import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLoginController } from './controller';
import { normalizeLoginConfig } from './config';
import { loginContracts } from './contract';
import { loginMessages } from './messages';
import type { LoginAdapter, LoginResult } from './types';

const user = { id: 'u1', name: 'Mia' };
const ok: LoginResult = { status: 'authenticated', user };

function adapter(overrides: Partial<LoginAdapter> = {}): LoginAdapter {
  return {
    authenticate: vi.fn(async () => ok),
    sendCode: vi.fn(async () => ({ retryAfterSeconds: 60 })),
    ...overrides,
  };
}

/** 让挂起的 Promise 和 queueMicrotask 都跑完。 */
const flush = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('login config', () => {
  it('falls back to the layout default method', () => {
    expect(normalizeLoginConfig({ variant: 'qr' }).defaultMethod).toBe('qr');
    expect(normalizeLoginConfig({ variant: 'step', defaultMethod: 'account' }).defaultMethod).toBe(
      'phone',
    );
  });

  it('rejects invalid values instead of guessing', () => {
    expect(() => normalizeLoginConfig({ variant: 'sideways' as never })).toThrow('variant');
  });
});

describe('login controller', () => {
  it('validates the phone number before sending a code', async () => {
    const host = adapter();
    const login = createLoginController({}, host);
    await login.send({ type: 'field', field: 'identity', value: '123' });
    await login.send({ type: 'send-code' });
    expect(login.getSnapshot().errors.identity).toBe('error.identity.phone.cn');
    expect(host.sendCode).not.toHaveBeenCalled();
  });

  it('counts down from the host’s retry time', async () => {
    const login = createLoginController({}, adapter());
    await login.send({ type: 'field', field: 'identity', value: '13800138000' });
    await login.send({ type: 'send-code' });
    expect(login.getSnapshot().resendSeconds).toBe(60);
    expect(login.getSnapshot().notice).toEqual({ key: 'notice.codeSent' });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(login.getSnapshot().resendSeconds).toBe(50);
  });

  it('blocks sign-in until the agreement is accepted', async () => {
    const host = adapter();
    const login = createLoginController({ defaultMethod: 'account' }, host);
    await login.send({ type: 'field', field: 'identity', value: 'mia' });
    await login.send({ type: 'field', field: 'password', value: 'secret' });
    await login.send({ type: 'submit' });
    expect(login.getSnapshot().errors.agreement).toBe('error.agreement.required');
    expect(host.authenticate).not.toHaveBeenCalled();
    await login.send({ type: 'agreement', value: true });
    await login.send({ type: 'submit' });
    expect(login.getSnapshot().status).toBe('success');
    expect(login.getSnapshot().password).toBe('');
  });

  it('shows the host’s own error text when sign-in fails', async () => {
    const login = createLoginController(
      { defaultMethod: 'account', requireAgreement: false },
      adapter({ authenticate: async () => Promise.reject(new Error('账号已被停用')) }),
    );
    await login.send({ type: 'field', field: 'identity', value: 'mia' });
    await login.send({ type: 'field', field: 'password', value: 'x' });
    await login.send({ type: 'submit' });
    expect(login.getSnapshot()).toMatchObject({
      status: 'error',
      notice: { text: '账号已被停用' },
    });
  });

  it('discards a sign-in result that arrives after switching method', async () => {
    let resolve!: (value: LoginResult) => void;
    const onEvent = vi.fn();
    const login = createLoginController(
      { defaultMethod: 'account', requireAgreement: false },
      adapter({ authenticate: () => new Promise((r) => (resolve = r)), onEvent }),
    );
    await login.send({ type: 'field', field: 'identity', value: 'mia' });
    await login.send({ type: 'field', field: 'password', value: 'x' });
    void login.send({ type: 'submit' });
    await flush();
    expect(login.getSnapshot().status).toBe('loading');
    await login.send({ type: 'method', method: 'phone' });
    resolve(ok);
    await flush();
    expect(login.getSnapshot()).toMatchObject({ method: 'phone', status: 'idle', user: null });
    expect(onEvent).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'authenticated' }));
  });

  it('loads a QR code when shown and marks it expired on time', async () => {
    const login = createLoginController(
      { variant: 'qr' },
      adapter({
        loadQr: async () => ({ id: 's1', imageUrl: 'data:,', expiresAt: Date.now() + 5000 }),
        pollQr: async () => ({ status: 'waiting' }),
      }),
    );
    expect(login.getSnapshot().qr.status).toBe('idle');
    login.subscribe(() => {});
    await flush();
    expect(login.getSnapshot().qr.status).toBe('waiting');
    await vi.advanceTimersByTimeAsync(6000);
    expect(login.getSnapshot().qr.status).toBe('expired');
  });

  it('walks the step layout from identity to verification', async () => {
    const host = adapter();
    const login = createLoginController({ variant: 'step', requireAgreement: false }, host);
    expect(login.getSnapshot().stage).toBe('identity');
    await login.send({ type: 'field', field: 'identity', value: '13800138000' });
    await login.send({ type: 'next' });
    expect(host.sendCode).toHaveBeenCalledOnce();
    expect(login.getSnapshot().stage).toBe('credentials');
    await login.send({ type: 'back' });
    expect(login.getSnapshot()).toMatchObject({ stage: 'identity', identity: '13800138000' });
  });

  it('pauses when nobody is watching and resumes the countdown later', async () => {
    let resolve!: (value: LoginResult) => void;
    const login = createLoginController(
      { defaultMethod: 'account', requireAgreement: false },
      adapter({ authenticate: () => new Promise((r) => (resolve = r)) }),
    );
    const stop = login.subscribe(() => {});
    await login.send({ type: 'field', field: 'identity', value: 'mia' });
    await login.send({ type: 'field', field: 'password', value: 'x' });
    void login.send({ type: 'submit' });
    await flush();
    stop();
    await flush();
    resolve(ok);
    await flush();
    // 界面已经离开：进行中的登录被放弃，状态回到可操作。
    expect(login.getSnapshot()).toMatchObject({ status: 'idle', user: null });
  });

  it('survives an immediate unsubscribe and resubscribe', async () => {
    const host = adapter({
      loadQr: vi.fn(async () => ({ id: 's1', imageUrl: 'data:,', expiresAt: Date.now() + 60_000 })),
      pollQr: async () => ({ status: 'waiting' as const }),
    });
    const login = createLoginController({ variant: 'split' }, host);
    login.subscribe(() => {})();
    login.subscribe(() => {});
    await flush();
    expect(host.loadQr).toHaveBeenCalledOnce();
    expect(login.getSnapshot().qr.status).toBe('waiting');
  });

  it('asks for an organization when the host requires one', async () => {
    const login = createLoginController(
      { defaultMethod: 'account', requireAgreement: false },
      adapter({
        authenticate: async () => ({
          status: 'organization-required',
          challengeToken: 't',
          organizations: [{ id: 'a', name: 'A' }],
        }),
        selectOrganization: async () => ok,
      }),
    );
    await login.send({ type: 'field', field: 'identity', value: 'mia' });
    await login.send({ type: 'field', field: 'password', value: 'x' });
    await login.send({ type: 'submit' });
    expect(login.getSnapshot().stage).toBe('organization');
    await login.send({ type: 'organization', organizationId: 'a' });
    expect(login.getSnapshot()).toMatchObject({ status: 'success', user });
  });
});

describe('login contracts and messages', () => {
  it('describes all five layouts', () => {
    expect(loginContracts.map((c) => c.variant)).toEqual([
      'centered',
      'split',
      'step',
      'social',
      'qr',
    ]);
    for (const contract of loginContracts)
      expect(contract.host.find((h) => h.name === 'authenticate')?.required).toBe(true);
  });

  it('translates every message into both languages', () => {
    expect(Object.keys(loginMessages.en).sort()).toEqual(Object.keys(loginMessages.zh).sort());
  });
});
