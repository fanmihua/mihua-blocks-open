import { normalizeLoginConfig, type LoginConfigInput } from './config';
import type { LoginMessageKey } from './messages';
import type {
  LoginAction,
  LoginAdapter,
  LoginConfig,
  LoginController,
  LoginCredentials,
  LoginEvent,
  LoginMethod,
  LoginNotice,
  LoginResult,
  LoginSnapshot,
  SocialProvider,
} from './types';
import { COUNTRY_CODES, identityError, isSixDigitCode } from './validation';
import { LOGIN_VARIANTS } from './variants';

const QR_POLL_INTERVAL = 1500;

function initialSnapshot(
  config: LoginConfig,
  method: LoginMethod = config.defaultMethod,
): LoginSnapshot {
  const staged = LOGIN_VARIANTS[config.variant].staged;
  return {
    method,
    countryCode: '+86',
    stage: staged ? 'identity' : 'credentials',
    verification: method === 'account' ? 'password' : staged ? config.stepVerification : 'otp',
    status: 'idle',
    identity: '',
    password: '',
    code: '',
    agreed: !config.requireAgreement,
    remember: true,
    errors: {},
    notice: null,
    sendingCode: false,
    resendSeconds: 0,
    organizations: [],
    selectedOrganizationId: '',
    user: null,
    qr: { status: 'idle', session: null, notice: null },
  };
}

/** 宿主抛出的错误优先显示宿主自己的文字；没有文字时用文案表里的兜底提示。 */
function noticeFrom(error: unknown, fallback: LoginMessageKey): LoginNotice {
  return error instanceof Error && error.message ? { text: error.message } : { key: fallback };
}

/**
 * 登录状态控制器。
 *
 * 它不知道自己会被画成什么样：React、Vue 都只是订阅它的快照、把用户操作 send 给它。
 * 所有异步请求都可以被取消；切换登录方式、返回上一步时，旧请求的结果会被丢弃，
 * 不会出现「切走以后旧的登录结果又回来了」的问题。倒计时基于绝对截止时间，后台标签页不会漂移。
 */
export function createLoginController(
  input: LoginConfigInput,
  adapter: LoginAdapter,
): LoginController {
  const config = normalizeLoginConfig(input);
  const variant = LOGIN_VARIANTS[config.variant];
  let snapshot = initialSnapshot(config);
  const listeners = new Set<() => void>();
  let disposed = false;
  let epoch = 0;
  let challengeToken = '';
  let codeDeadline = 0;
  let nextQrPoll = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  const requests: Partial<Record<'auth' | 'code' | 'qr' | 'poll', AbortController>> = {};

  const showsQr = () => snapshot.method === 'qr' || variant.qr === 'side';

  function update(patch: Partial<LoginSnapshot>) {
    if (disposed) return;
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  }
  function emit(event: LoginEvent) {
    adapter.onEvent?.(event);
  }
  function cancel(kind: keyof typeof requests) {
    requests[kind]?.abort();
    delete requests[kind];
  }
  function cancelAll() {
    epoch += 1;
    (Object.keys(requests) as Array<keyof typeof requests>).forEach(cancel);
    if (timer) clearInterval(timer);
    timer = undefined;
  }
  /** 发起一个可取消的请求；valid() 为 false 表示结果已经过期，应该丢弃。 */
  function request(kind: keyof typeof requests) {
    cancel(kind);
    const controller = new AbortController();
    requests[kind] = controller;
    const started = epoch;
    return {
      signal: controller.signal,
      valid: () => !disposed && !controller.signal.aborted && started === epoch,
    };
  }
  function fail(error: unknown, fallback: LoginMessageKey) {
    const notice = noticeFrom(error, fallback);
    update({ status: 'error', notice });
    emit({ type: 'error', message: 'text' in notice ? notice.text : notice.key });
  }
  function accept(result: LoginResult) {
    cancelAll();
    codeDeadline = 0;
    if (result.status === 'organization-required') {
      if (!result.challengeToken || !result.organizations.length) {
        fail(null, 'error.org.none');
        return;
      }
      challengeToken = result.challengeToken;
      update({
        stage: 'organization',
        status: 'idle',
        organizations: result.organizations,
        password: '',
        code: '',
        notice: null,
        sendingCode: false,
        resendSeconds: 0,
      });
      return;
    }
    update({
      status: 'success',
      user: result.user,
      password: '',
      code: '',
      notice: null,
      sendingCode: false,
    });
    emit({ type: 'authenticated', user: result.user });
  }
  function validateIdentity() {
    const key = identityError(snapshot.method, snapshot.identity, snapshot.countryCode);
    update({ errors: key ? { identity: key } : {}, status: key ? 'error' : 'idle', notice: null });
    return !key;
  }
  function checkAgreement() {
    if (!config.requireAgreement || snapshot.agreed) return true;
    update({
      status: 'error',
      errors: { ...snapshot.errors, agreement: 'error.agreement.required' },
      notice: null,
    });
    return false;
  }

  function tick() {
    if (disposed) return;
    const seconds = Math.max(0, Math.ceil((codeDeadline - Date.now()) / 1000));
    if (seconds !== snapshot.resendSeconds) update({ resendSeconds: seconds });
    const qr = snapshot.qr;
    if (qr.session && (qr.status === 'waiting' || qr.status === 'scanned')) {
      if (Date.now() >= qr.session.expiresAt) {
        cancel('poll');
        update({ qr: { ...qr, status: 'expired', notice: null } });
      } else if (Date.now() >= nextQrPoll) void pollQr();
    }
    const qrActive = ['waiting', 'scanned', 'loading'].includes(snapshot.qr.status);
    if (!seconds && !qrActive && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  }
  function startTimer() {
    if (!timer) timer = setInterval(tick, 250);
  }

  async function refreshQr() {
    if (!showsQr() || snapshot.status === 'success' || snapshot.stage === 'organization') return;
    cancel('poll');
    if (!adapter.loadQr) {
      update({ qr: { status: 'error', session: null, notice: { key: 'error.qr.unavailable' } } });
      return;
    }
    const call = request('qr');
    update({ qr: { status: 'loading', session: null, notice: null } });
    try {
      const session = await adapter.loadQr(call.signal);
      if (!call.valid()) return;
      if (!session.id || !session.imageUrl || !Number.isFinite(session.expiresAt))
        throw new Error('');
      update({
        qr: {
          status: session.expiresAt <= Date.now() ? 'expired' : 'waiting',
          session,
          notice: null,
        },
      });
      nextQrPoll = Date.now() + QR_POLL_INTERVAL;
      startTimer();
    } catch (error) {
      if (call.valid())
        update({
          qr: { status: 'error', session: null, notice: noticeFrom(error, 'error.qr.load') },
        });
    } finally {
      if (call.valid()) delete requests.qr;
    }
  }
  async function pollQr() {
    const session = snapshot.qr.session;
    if (!adapter.pollQr || !session || requests.poll || snapshot.stage === 'organization') return;
    if (snapshot.status === 'success') return;
    const call = request('poll');
    nextQrPoll = Date.now() + QR_POLL_INTERVAL;
    try {
      const result = await adapter.pollQr(session.id, call.signal);
      if (!call.valid() || snapshot.qr.session?.id !== session.id) return;
      if (Date.now() >= session.expiresAt) {
        update({ qr: { ...snapshot.qr, status: 'expired' } });
      } else if (result.status === 'confirmed') {
        // 扫码确认也要遵守本地的协议勾选：未同意时停在「已扫码」，下一次轮询再确认。
        if (config.requireAgreement && !snapshot.agreed)
          update({ qr: { ...snapshot.qr, status: 'scanned', notice: { key: 'notice.qrAgree' } } });
        else accept(result.result);
      } else {
        update({ qr: { ...snapshot.qr, status: result.status, notice: null } });
      }
    } catch (error) {
      if (call.valid())
        update({
          qr: { ...snapshot.qr, status: 'error', notice: noticeFrom(error, 'error.qr.check') },
        });
    } finally {
      if (call.valid()) delete requests.poll;
    }
  }

  async function sendCode() {
    if (snapshot.sendingCode || snapshot.resendSeconds > 0) return;
    if (snapshot.status === 'loading' || snapshot.status === 'success') return;
    if (snapshot.method !== 'phone' && snapshot.method !== 'email') return;
    if (!validateIdentity()) return;
    const identity = snapshot.identity.trim();
    const call = request('code');
    update({ sendingCode: true, notice: null });
    try {
      const result = await adapter.sendCode(
        {
          method: snapshot.method,
          identity,
          ...(snapshot.method === 'phone' ? { countryCode: snapshot.countryCode } : {}),
        },
        call.signal,
      );
      if (!call.valid()) return;
      const seconds = Number.isFinite(result.retryAfterSeconds)
        ? Math.max(1, Math.ceil(result.retryAfterSeconds))
        : 60;
      codeDeadline = Date.now() + seconds * 1000;
      update({
        sendingCode: false,
        resendSeconds: seconds,
        status: 'idle',
        notice: { key: 'notice.codeSent' },
      });
      startTimer();
      emit({ type: 'code-sent', identity });
    } catch (error) {
      if (call.valid()) {
        update({ sendingCode: false });
        fail(error, 'error.sendCode');
      }
    } finally {
      if (call.valid()) delete requests.code;
    }
  }

  async function nextStep() {
    if (snapshot.stage !== 'identity' || snapshot.sendingCode || snapshot.status === 'loading')
      return;
    const validIdentity = validateIdentity();
    const agreed = checkAgreement();
    if (!validIdentity || !agreed) return;
    if (snapshot.verification === 'password') {
      update({ stage: 'credentials', errors: {}, notice: null });
      return;
    }
    const identity = snapshot.identity;
    const started = epoch;
    if (!snapshot.resendSeconds) await sendCode();
    const stillCurrent = !disposed && started === epoch && identity === snapshot.identity;
    if (stillCurrent && snapshot.resendSeconds > 0 && snapshot.status !== 'error')
      update({ stage: 'credentials', errors: {} });
  }

  async function submit() {
    if (snapshot.sendingCode || snapshot.status === 'loading' || snapshot.status === 'success')
      return;
    if (snapshot.method === 'qr' || snapshot.stage === 'organization') return;
    if (snapshot.stage === 'identity') return nextStep();
    const errors: LoginSnapshot['errors'] = {};
    const identity = identityError(snapshot.method, snapshot.identity, snapshot.countryCode);
    if (identity) errors.identity = identity;
    if (snapshot.verification === 'password' && !snapshot.password)
      errors.password = 'error.password.required';
    if (snapshot.verification === 'otp' && !isSixDigitCode(snapshot.code))
      errors.code = 'error.code.invalid';
    if (config.requireAgreement && !snapshot.agreed) errors.agreement = 'error.agreement.required';
    if (Object.keys(errors).length) {
      update({ status: 'error', errors, notice: null });
      return;
    }
    const credentials: LoginCredentials = {
      method: snapshot.method,
      identity: snapshot.identity.trim(),
      ...(snapshot.method === 'phone' ? { countryCode: snapshot.countryCode } : {}),
      verification: snapshot.verification,
      ...(snapshot.verification === 'password'
        ? { password: snapshot.password }
        : { code: snapshot.code }),
      remember: snapshot.remember,
    };
    const call = request('auth');
    update({ status: 'loading', errors: {}, notice: null });
    try {
      const result = await adapter.authenticate(credentials, call.signal);
      if (call.valid()) accept(result);
    } catch (error) {
      if (call.valid()) fail(error, 'error.signIn');
    } finally {
      if (call.valid()) delete requests.auth;
    }
  }

  async function chooseOrganization(organizationId: string) {
    if (
      snapshot.stage !== 'organization' ||
      snapshot.status === 'loading' ||
      snapshot.status === 'success'
    )
      return;
    if (!snapshot.organizations.some((item) => item.id === organizationId)) return;
    if (!adapter.selectOrganization) return fail(null, 'error.org.unavailable');
    const call = request('auth');
    update({ selectedOrganizationId: organizationId, status: 'loading', notice: null });
    try {
      const result = await adapter.selectOrganization(
        { organizationId, challengeToken },
        call.signal,
      );
      if (call.valid()) accept(result);
    } catch (error) {
      if (call.valid()) fail(error, 'error.org.open');
    } finally {
      if (call.valid()) delete requests.auth;
    }
  }

  async function social(provider: SocialProvider) {
    if (snapshot.sendingCode || snapshot.status === 'loading' || snapshot.status === 'success')
      return;
    if (!checkAgreement()) return;
    if (!adapter.social) return fail(null, 'error.social.unavailable');
    const call = request('auth');
    update({ status: 'loading', errors: {}, notice: null });
    try {
      const result = await adapter.social(provider, call.signal);
      if (call.valid()) accept(result);
    } catch (error) {
      if (call.valid()) fail(error, 'error.signIn');
    } finally {
      if (call.valid()) delete requests.auth;
    }
  }

  /** 切换登录方式时保留「同意协议」和「记住我」，其余回到初始状态；双栏的二维码如果还有效就继续用。 */
  function reset(method: LoginMethod = config.defaultMethod, keepPreferences = false) {
    const preferences = keepPreferences
      ? { agreed: snapshot.agreed, remember: snapshot.remember }
      : {};
    const qr = snapshot.qr;
    const reusableQr =
      keepPreferences &&
      variant.qr === 'side' &&
      qr.session &&
      qr.session.expiresAt > Date.now() &&
      (qr.status === 'waiting' || qr.status === 'scanned')
        ? qr
        : null;
    cancelAll();
    challengeToken = '';
    codeDeadline = 0;
    snapshot = {
      ...initialSnapshot(config, method),
      ...preferences,
      ...(reusableQr ? { qr: reusableQr } : {}),
    };
    update({});
    if (reusableQr) startTimer();
    else if (showsQr()) void refreshQr();
  }

  async function send(action: LoginAction): Promise<void> {
    if (disposed) return;
    switch (action.type) {
      case 'field': {
        cancel('auth');
        if (action.field === 'identity') {
          cancel('code');
          update({ sendingCode: false });
        }
        const errors = { ...snapshot.errors };
        delete errors[action.field];
        update({ [action.field]: action.value, errors, status: 'idle', notice: null });
        return;
      }
      case 'country-code': {
        if (!COUNTRY_CODES.includes(action.value) || snapshot.countryCode === action.value) return;
        cancel('auth');
        cancel('code');
        codeDeadline = 0;
        update({
          countryCode: action.value,
          identity: '',
          code: '',
          errors: {},
          sendingCode: false,
          resendSeconds: 0,
          status: 'idle',
          notice: null,
        });
        return;
      }
      case 'method':
        if (variant.methods.includes(action.method) && action.method !== snapshot.method)
          reset(action.method, true);
        return;
      case 'agreement': {
        const errors = { ...snapshot.errors };
        delete errors.agreement;
        // 登录请求进行中取消勾选：撤回这次请求，而不是让它在未同意协议的情况下完成。
        if (!action.value && snapshot.status === 'loading') cancel('auth');
        const settle =
          snapshot.status === 'error' || (!action.value && snapshot.status === 'loading');
        update({ agreed: action.value, errors, ...(settle ? { status: 'idle' as const } : {}) });
        return;
      }
      case 'remember':
        update({ remember: action.value });
        return;
      case 'verification': {
        if (!variant.staged || (snapshot.method !== 'phone' && snapshot.method !== 'email')) return;
        cancel('auth');
        update({
          verification: action.verification,
          password: '',
          code: '',
          errors: {},
          status: 'idle',
          notice: null,
        });
        if (
          snapshot.stage === 'credentials' &&
          action.verification === 'otp' &&
          !snapshot.resendSeconds
        )
          await sendCode();
        return;
      }
      case 'back':
        cancelAll();
        challengeToken = '';
        codeDeadline = 0;
        update({
          stage: variant.staged ? 'identity' : 'credentials',
          status: 'idle',
          password: '',
          code: '',
          errors: {},
          notice: null,
          organizations: [],
          sendingCode: false,
          resendSeconds: 0,
          selectedOrganizationId: '',
          user: null,
        });
        if (showsQr()) void refreshQr();
        return;
      case 'next':
        return nextStep();
      case 'submit':
        return submit();
      case 'send-code':
        return sendCode();
      case 'refresh-qr':
        return refreshQr();
      case 'organization':
        return chooseOrganization(action.organizationId);
      case 'social':
        return social(action.provider);
      case 'event':
        emit({ type: action.event });
        return;
      case 'reset':
        reset();
        return;
    }
  }

  /**
   * 没有界面在看时暂停：放弃进行中的请求、停掉计时器，并把「进行中」的状态落回可操作的状态。
   * 有界面重新订阅时，倒计时和二维码轮询从绝对时间继续算，不会漂移。
   */
  function pause() {
    cancelAll();
    snapshot = {
      ...snapshot,
      status: snapshot.status === 'loading' ? 'idle' : snapshot.status,
      sendingCode: false,
      qr: snapshot.qr.status === 'loading' ? { ...snapshot.qr, status: 'idle' } : snapshot.qr,
    };
  }
  function resume() {
    const qrActive = snapshot.qr.status === 'waiting' || snapshot.qr.status === 'scanned';
    if (codeDeadline > Date.now() || qrActive) startTimer();
  }

  return {
    config,
    getSnapshot: () => snapshot,
    subscribe(listener) {
      if (!listeners.size) resume();
      listeners.add(listener);
      // 被界面订阅后才加载二维码：只创建控制器、不展示，就不会产生请求。
      queueMicrotask(() => {
        if (!disposed && listeners.size > 0 && snapshot.qr.status === 'idle' && showsQr())
          void refreshQr();
      });
      return () => {
        listeners.delete(listener);
        // 等一个微任务再判断：React 严格模式会「卸载再挂载」，中间的空档不应该中断请求。
        queueMicrotask(() => {
          if (!disposed && !listeners.size) pause();
        });
      };
    },
    send,
    dispose() {
      disposed = true;
      cancelAll();
      listeners.clear();
    },
  };
}
