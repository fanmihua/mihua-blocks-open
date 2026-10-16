import { createContext, useContext, useId, type FormEvent, type ReactNode } from 'react';
import {
  COUNTRY_CODES,
  type LoginConfig,
  type LoginController,
  type LoginMessageKey,
  type LoginMethod,
  type LoginSnapshot,
} from '@mihua/core';
import { useKit, useLoginText } from '../../context';
import { Icon } from '../../icon';
import { ProviderMark } from './icons';

/**
 * 登录组件的「部件」。五种布局都由这些部件拼出来：
 * 部件只读状态、只发动作，不关心自己被摆在哪里。
 */
interface LoginState {
  snapshot: LoginSnapshot;
  config: LoginConfig;
  send: LoginController['send'];
}
const LoginContext = createContext<LoginState | null>(null);
export const LoginStateProvider = LoginContext.Provider;
export function useLoginState() {
  const state = useContext(LoginContext);
  if (!state) throw new Error('登录部件必须放在 <Login> 里面。');
  return state;
}

export function Header({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { config } = useLoginState();
  const t = useLoginText();
  return (
    <header className="mh-login__header" data-region="header">
      <h2 className="mh-login__title">{title ?? (config.title || t('title'))}</h2>
      <p className="mh-login__subtitle">{subtitle ?? t('subtitle')}</p>
    </header>
  );
}

const METHOD_LABEL: Record<LoginMethod, LoginMessageKey> = {
  phone: 'method.phone',
  account: 'method.account',
  email: 'method.email',
  qr: 'method.qr',
};

export function MethodTabs({ methods }: { methods: LoginMethod[] }) {
  const { snapshot, send } = useLoginState();
  const { Tabs } = useKit();
  const t = useLoginText();
  if (methods.length < 2) return null;
  return (
    <div data-region="methods">
      <Tabs
        aria-label={t('methods.label')}
        value={snapshot.method}
        onChange={(method) => send({ type: 'method', method: method as LoginMethod })}
        items={methods.map((method) => ({ value: method, label: t(METHOD_LABEL[method]) }))}
      />
    </div>
  );
}

function Field({
  error,
  children,
}: {
  error?: LoginMessageKey;
  children: (errorId?: string) => ReactNode;
}) {
  const t = useLoginText();
  const id = useId();
  return (
    <div className="mh-field" data-region="fields">
      {children(error ? id : undefined)}
      {error && (
        <p id={id} className="mh-field__error">
          {t(error)}
        </p>
      )}
    </div>
  );
}

export function IdentityField() {
  const { snapshot, send } = useLoginState();
  const { Input, Select } = useKit();
  const t = useLoginText();
  const method = snapshot.method;
  const input = (errorId?: string) => (
    <Input
      size="large"
      name="identity"
      value={snapshot.identity}
      onChange={(value) => send({ type: 'field', field: 'identity', value })}
      invalid={!!snapshot.errors.identity}
      aria-describedby={errorId}
      type={method === 'phone' ? 'tel' : method === 'email' ? 'email' : 'text'}
      inputMode={method === 'phone' ? 'numeric' : method === 'email' ? 'email' : 'text'}
      autoComplete={method === 'phone' ? 'tel-national' : method === 'email' ? 'email' : 'username'}
      maxLength={method === 'phone' ? 11 : 80}
      placeholder={t(
        method === 'phone'
          ? 'placeholder.phone'
          : method === 'email'
            ? 'placeholder.email'
            : 'placeholder.account',
      )}
      aria-label={t(
        method === 'phone'
          ? 'placeholder.phone'
          : method === 'email'
            ? 'placeholder.email'
            : 'placeholder.account',
      )}
    />
  );
  return (
    <Field error={snapshot.errors.identity}>
      {(errorId) => (
        // 始终包一层（和 Vue 视图同一个结构）：切换登录方式时输入框不会被重新创建
        <div className={method === 'phone' ? 'mh-field__group' : undefined}>
          {method === 'phone' && (
            <Select
              size="large"
              width={96}
              aria-label={t('field.country')}
              value={snapshot.countryCode}
              display={(value) => value}
              onChange={(value) =>
                send({ type: 'country-code', value: value as LoginSnapshot['countryCode'] })
              }
              options={COUNTRY_CODES.map((code) => ({ value: code, label: t(`country.${code}`) }))}
            />
          )}
          {input(errorId)}
        </div>
      )}
    </Field>
  );
}

export function VerificationField() {
  const { snapshot, send } = useLoginState();
  const { Input, Button } = useKit();
  const t = useLoginText();
  if (snapshot.verification === 'password')
    return (
      <Field error={snapshot.errors.password}>
        {(errorId) => (
          <Input
            size="large"
            type="password"
            name="password"
            autoComplete="current-password"
            value={snapshot.password}
            onChange={(value) => send({ type: 'field', field: 'password', value })}
            invalid={!!snapshot.errors.password}
            aria-describedby={errorId}
            placeholder={t('placeholder.password')}
            aria-label={t('placeholder.password')}
          />
        )}
      </Field>
    );
  const waiting = snapshot.resendSeconds > 0;
  return (
    <Field error={snapshot.errors.code}>
      {(errorId) => (
        <Input
          size="large"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={snapshot.code}
          onChange={(value) =>
            send({ type: 'field', field: 'code', value: value.replace(/\D/g, '') })
          }
          invalid={!!snapshot.errors.code}
          aria-describedby={errorId}
          placeholder={t('placeholder.code')}
          aria-label={t('placeholder.code')}
          suffix={
            <Button
              variant="link"
              disabled={snapshot.sendingCode || waiting}
              onClick={() => send({ type: 'send-code' })}
            >
              {snapshot.sendingCode
                ? t('action.sending')
                : waiting
                  ? t('action.resend', { seconds: snapshot.resendSeconds })
                  : t('action.sendCode')}
            </Button>
          }
        />
      )}
    </Field>
  );
}

export function Preferences() {
  const { snapshot, config, send } = useLoginState();
  const { Checkbox, Button } = useKit();
  const t = useLoginText();
  const showForgot = snapshot.verification === 'password';
  if (!config.showRemember && !showForgot) return null;
  return (
    <div className="mh-login__row">
      {config.showRemember ? (
        <Checkbox
          checked={snapshot.remember}
          onChange={(value) => send({ type: 'remember', value })}
        >
          {t('label.remember')}
        </Checkbox>
      ) : (
        <span />
      )}
      {showForgot && (
        <Button variant="link" onClick={() => send({ type: 'event', event: 'forgot-password' })}>
          {t('action.forgot')}
        </Button>
      )}
    </div>
  );
}

export function Agreement() {
  const { snapshot, config, send } = useLoginState();
  const { Checkbox } = useKit();
  const t = useLoginText();
  const errorId = useId();
  if (!config.requireAgreement) return null;
  const policy = (event: 'terms' | 'privacy', key: LoginMessageKey) => (
    <button
      type="button"
      className="mh-inline-link"
      onClick={(e) => {
        e.preventDefault();
        void send({ type: 'event', event });
      }}
    >
      {t(key)}
    </button>
  );
  return (
    <div className="mh-field" data-region="agreement">
      <Checkbox
        checked={snapshot.agreed}
        onChange={(value) => send({ type: 'agreement', value })}
        invalid={!!snapshot.errors.agreement}
        aria-describedby={snapshot.errors.agreement ? errorId : undefined}
      >
        <span className="mh-login__agreement">
          {t('label.agree')} {policy('terms', 'label.terms')} {t('label.and')}{' '}
          {policy('privacy', 'label.privacy')}
        </span>
      </Checkbox>
      {snapshot.errors.agreement && (
        <p id={errorId} className="mh-field__error">
          {t(snapshot.errors.agreement)}
        </p>
      )}
    </div>
  );
}

export function Submit({ label }: { label?: LoginMessageKey }) {
  const { snapshot } = useLoginState();
  const { Button } = useKit();
  const t = useLoginText();
  const loading = snapshot.status === 'loading';
  return (
    <div data-region="submit">
      <Button variant="primary" size="large" type="submit" block loading={loading}>
        {loading ? t('action.signingIn') : t(label ?? 'action.signIn')}
      </Button>
    </div>
  );
}

/** 表单外壳：回车提交，交给控制器决定是「下一步」还是「登录」。 */
export function Form({ children }: { children: ReactNode }) {
  const { send } = useLoginState();
  return (
    <form
      className="mh-login__stack"
      noValidate
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        void send({ type: 'submit' });
      }}
    >
      {children}
    </form>
  );
}

/** 状态播报：发送验证码、登录失败等变化会被读屏软件朗读。 */
export function Notice() {
  const { snapshot } = useLoginState();
  const t = useLoginText();
  const notice = snapshot.notice;
  return (
    <p
      className="mh-login__notice"
      role="status"
      aria-live="polite"
      data-tone={snapshot.status === 'error' ? 'error' : 'info'}
    >
      {notice ? ('key' in notice ? t(notice.key) : notice.text) : ''}
    </p>
  );
}

export function SocialFooter() {
  const { config, send } = useLoginState();
  const t = useLoginText();
  if (!config.socialProviders.length) return null;
  return (
    <div className="mh-login__social" data-region="social">
      <div className="mh-divider">{t('label.others')}</div>
      <div className="mh-login__providers">
        {config.socialProviders.map((provider) => (
          <button
            key={provider}
            type="button"
            className="mh-provider"
            aria-label={t('social.continue', { provider: t(`social.${provider}`) })}
            onClick={() => send({ type: 'social', provider })}
          >
            <ProviderMark provider={provider} size={32} />
            <span>{t(`social.${provider}`)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SocialButtons() {
  const { config, snapshot, send } = useLoginState();
  const { Button } = useKit();
  const t = useLoginText();
  return (
    <div className="mh-login__stack" data-region="providers">
      {config.socialProviders.map((provider) => (
        <Button
          key={provider}
          variant="secondary"
          size="large"
          block
          disabled={snapshot.status === 'loading'}
          icon={<ProviderMark provider={provider} />}
          onClick={() => send({ type: 'social', provider })}
        >
          {t('social.continue', { provider: t(`social.${provider}`) })}
        </Button>
      ))}
    </div>
  );
}

export function QrPanel({ compact = false }: { compact?: boolean }) {
  const { snapshot, config, send } = useLoginState();
  const { Button } = useKit();
  const t = useLoginText();
  const qr = snapshot.qr;
  const notice = qr.notice ? ('key' in qr.notice ? t(qr.notice.key) : qr.notice.text) : '';
  const covered = qr.status === 'expired' || qr.status === 'error' || qr.status === 'scanned';
  return (
    <div className="mh-qr" data-region="qr" data-compact={compact || undefined}>
      <div className="mh-qr__frame" aria-busy={qr.status === 'loading'}>
        {qr.session && (
          <img className="mh-qr__image" src={qr.session.imageUrl} alt={t('qr.title')} />
        )}
        {qr.status === 'loading' && <span className="mh-qr__hint">{t('qr.loading')}</span>}
        {covered && (
          <div className="mh-qr__cover">
            <strong>
              {qr.status === 'expired'
                ? t('qr.expired')
                : qr.status === 'scanned'
                  ? t('qr.scanned')
                  : notice}
            </strong>
            {qr.status !== 'scanned' && (
              <Button variant="secondary" onClick={() => send({ type: 'refresh-qr' })}>
                {t('qr.refresh')}
              </Button>
            )}
          </div>
        )}
      </div>
      <p className="mh-qr__caption" role="status" aria-live="polite">
        {qr.status === 'scanned' && notice ? notice : t('qr.hint', { brand: config.brand })}
      </p>
    </div>
  );
}

export function RegisterPrompt() {
  const { config, send } = useLoginState();
  const { Button } = useKit();
  const t = useLoginText();
  if (!config.showRegister) return null;
  return (
    <p className="mh-login__footnote">
      {t('register.prompt')}{' '}
      <Button variant="link" onClick={() => send({ type: 'event', event: 'register' })}>
        {t('action.register')}
      </Button>
    </p>
  );
}

export function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="mh-back" onClick={onClick}>
      <Icon name="chevron-left" size={16} />
      {label}
    </button>
  );
}

export function Organizations() {
  const { snapshot, send } = useLoginState();
  const t = useLoginText();
  return (
    <div className="mh-login__stack">
      <Header title={t('org.title')} subtitle={t('org.subtitle')} />
      <ul className="mh-orgs">
        {snapshot.organizations.map((org) => (
          <li key={org.id}>
            <button
              type="button"
              className="mh-org"
              aria-busy={
                snapshot.selectedOrganizationId === org.id && snapshot.status === 'loading'
              }
              onClick={() => send({ type: 'organization', organizationId: org.id })}
            >
              <span className="mh-org__avatar">{org.name.slice(0, 1)}</span>
              <span className="mh-org__name">{org.name}</span>
              {org.description && <span className="mh-org__meta">{org.description}</span>}
            </button>
          </li>
        ))}
      </ul>
      <BackLink label={t('action.back')} onClick={() => send({ type: 'back' })} />
      <Notice />
    </div>
  );
}

export function Success() {
  const { snapshot, send } = useLoginState();
  const t = useLoginText();
  return (
    <div className="mh-success" role="status">
      <span className="mh-success__icon">
        <Icon name="check" size={28} />
      </span>
      <h2 className="mh-login__title">{t('success.title')}</h2>
      <p className="mh-login__subtitle">{t('success.body', { name: snapshot.user?.name ?? '' })}</p>
      <BackLink label={t('action.back')} onClick={() => send({ type: 'reset' })} />
    </div>
  );
}
