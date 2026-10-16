import type { ReactElement } from 'react';
import {
  LOGIN_VARIANTS,
  type LoginAdapter,
  type LoginConfigInput,
  type LoginController,
  type LoginMethod,
  type LoginVariant,
} from '@mihua/core';
import { useLoginText } from '../../context';
import { Icon } from '../../icon';
import {
  Agreement,
  BackLink,
  Form,
  Header,
  IdentityField,
  LoginStateProvider,
  MethodTabs,
  Notice,
  Organizations,
  Preferences,
  QrPanel,
  RegisterPrompt,
  SocialButtons,
  SocialFooter,
  Submit,
  Success,
  VerificationField,
  useLoginState,
} from './parts';
import { useLogin } from './useLogin';
import '@mihua/core/styles/login.css';

export interface LoginProps {
  config?: LoginConfigInput;
  /** 你的业务系统接入认证的地方；不传时使用内存里的演示适配器。 */
  adapter?: LoginAdapter;
  /** 传入现成的控制器时，config 与 adapter 以控制器为准。 */
  controller?: LoginController;
}

/**
 * 登录组件。五种布局共用同一个控制器和同一组部件，区别只在「怎么摆」。
 * 每个布局函数对应组件契约里的一组结构分区（regions）。
 */
export function Login({ config = {}, adapter, controller }: LoginProps) {
  const state = useLogin(config, adapter, controller);
  const { snapshot } = state;
  const Layout = LAYOUTS[state.config.variant];
  return (
    <LoginStateProvider value={state}>
      <section className="mh-login" data-variant={state.config.variant}>
        {snapshot.status === 'success' ? (
          <Success />
        ) : snapshot.stage === 'organization' ? (
          <Organizations />
        ) : (
          <Layout />
        )}
      </section>
    </LoginStateProvider>
  );
}

const formMethods = (variant: LoginVariant): LoginMethod[] =>
  LOGIN_VARIANTS[variant].methods.filter((m) => m !== 'qr');

/** 表单：方式切换 → 身份 → 验证 → 偏好 → 协议 → 登录 → 状态播报。 */
function AccountForm() {
  const { config } = useLoginState();
  return (
    <Form>
      <MethodTabs methods={formMethods(config.variant)} />
      <IdentityField />
      <VerificationField />
      <Preferences />
      <Agreement />
      <Submit />
      <Notice />
    </Form>
  );
}

/** 居中：扫码入口在右上角折角，点一下在表单和二维码之间切换。 */
function CenteredLayout() {
  const { snapshot, config, send } = useLoginState();
  const t = useLoginText();
  const onQr = snapshot.method === 'qr';
  const label = t(onQr ? 'qr.toForm' : 'qr.toQr');
  return (
    <>
      <button
        type="button"
        className="mh-corner"
        data-region="qr-corner"
        aria-label={label}
        title={label}
        onClick={() =>
          send({ type: 'method', method: onQr ? formMethods(config.variant)[0] : 'qr' })
        }
      >
        <Icon name={onQr ? 'monitor' : 'qr'} size={20} />
      </button>
      {onQr ? (
        <div className="mh-login__stack">
          <Header title={t('qr.title')} />
          <QrPanel />
          <Agreement />
        </div>
      ) : (
        <>
          <Header />
          <AccountForm />
          <RegisterPrompt />
        </>
      )}
      <SocialFooter />
    </>
  );
}

/** 双栏：左边表单、右边二维码同时展示；底部共用第三方入口。 */
function SplitLayout() {
  const t = useLoginText();
  return (
    <>
      <div className="mh-split">
        <div className="mh-split__form" data-region="form">
          <Header />
          <AccountForm />
          <RegisterPrompt />
        </div>
        <div className="mh-split__qr">
          <h3 className="mh-login__section-title">{t('qr.title')}</h3>
          <QrPanel compact />
        </div>
      </div>
      <SocialFooter />
    </>
  );
}

/** 分步：第一步确认身份，第二步验证。第二步不再要求输入身份。 */
function StepLayout() {
  const { snapshot, config, send } = useLoginState();
  const t = useLoginText();
  const identifying = snapshot.stage === 'identity';
  return (
    <>
      <p className="mh-steps" data-region="progress">
        {t(identifying ? 'step.identity' : 'step.verify')}
      </p>
      <Header />
      {identifying ? (
        <Form>
          <MethodTabs methods={formMethods(config.variant)} />
          <IdentityField />
          <Agreement />
          <Submit label="action.continue" />
          <Notice />
        </Form>
      ) : (
        <Form>
          <div className="mh-identity">
            <span>
              {snapshot.method === 'phone'
                ? `${snapshot.countryCode} ${snapshot.identity}`
                : snapshot.identity}
            </span>
            <BackLink label={t('action.back')} onClick={() => send({ type: 'back' })} />
          </div>
          <VerificationField />
          <div className="mh-login__row">
            <button
              type="button"
              className="mh-inline-link"
              onClick={() =>
                send({
                  type: 'verification',
                  verification: snapshot.verification === 'otp' ? 'password' : 'otp',
                })
              }
            >
              {t(snapshot.verification === 'otp' ? 'step.usePassword' : 'step.useCode')}
            </button>
          </div>
          <Submit />
          <Notice />
        </Form>
      )}
      <SocialFooter />
    </>
  );
}

/** 第三方优先：企业身份按钮在最上方，账号表单作为次要方式。 */
function SocialLayout() {
  const t = useLoginText();
  return (
    <>
      <Header />
      <SocialButtons />
      <div className="mh-divider">{t('label.orForm')}</div>
      <AccountForm />
      <RegisterPrompt />
    </>
  );
}

/** 扫码优先：默认只有二维码；手机号和账号是备用方式。 */
function QrFirstLayout() {
  const { snapshot, config, send } = useLoginState();
  const t = useLoginText();
  if (snapshot.method !== 'qr')
    return (
      <>
        <BackLink label={t('qr.title')} onClick={() => send({ type: 'method', method: 'qr' })} />
        <Header />
        <AccountForm />
        <SocialFooter />
      </>
    );
  return (
    <>
      <Header title={t('qr.title')} />
      <QrPanel />
      <Agreement />
      <div className="mh-login__switches">
        {formMethods(config.variant).map((method) => (
          <button
            key={method}
            type="button"
            className="mh-inline-link"
            onClick={() => send({ type: 'method', method })}
          >
            {t(method === 'phone' ? 'method.phone' : 'method.account')}
          </button>
        ))}
      </div>
      <SocialFooter />
    </>
  );
}

const LAYOUTS: Record<LoginVariant, () => ReactElement> = {
  centered: CenteredLayout,
  split: SplitLayout,
  step: StepLayout,
  social: SocialLayout,
  qr: QrFirstLayout,
};
