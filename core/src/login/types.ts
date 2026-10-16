import type { LoginMessageKey } from './messages';

/** 五种登录布局。它们共用同一个状态控制器，只是把相同的部件摆成不同的样子。 */
export type LoginVariant = 'centered' | 'split' | 'step' | 'social' | 'qr';
export type LoginMethod = 'phone' | 'account' | 'email' | 'qr';
export type LoginVerification = 'password' | 'otp';
export type LoginCountryCode = '+86' | '+852' | '+1';
export type LoginField = 'identity' | 'password' | 'code' | 'agreement';
export type SocialProvider = 'dingtalk' | 'wecom' | 'sso';

export interface LoginConfig {
  variant: LoginVariant;
  defaultMethod: LoginMethod;
  /** 留空时使用文案表里的默认标题。 */
  title: string;
  brand: string;
  socialProviders: SocialProvider[];
  showRegister: boolean;
  requireAgreement: boolean;
  showRemember: boolean;
  /** 分步布局里，第二步用密码还是验证码。 */
  stepVerification: LoginVerification;
}

export interface LoginOrganization {
  id: string;
  name: string;
  description?: string;
}
export interface LoginUser {
  id: string;
  name: string;
}
export type LoginResult =
  | { status: 'authenticated'; user: LoginUser }
  | { status: 'organization-required'; organizations: LoginOrganization[]; challengeToken: string };

export interface LoginCredentials {
  method: Exclude<LoginMethod, 'qr'>;
  identity: string;
  countryCode?: LoginCountryCode;
  verification: LoginVerification;
  password?: string;
  code?: string;
  remember: boolean;
}
export interface LoginQrSession {
  id: string;
  imageUrl: string;
  expiresAt: number;
}
export type LoginQrResult =
  | { status: 'waiting' | 'scanned' | 'expired' }
  | { status: 'confirmed'; result: LoginResult };

export type LoginEvent =
  | { type: 'authenticated'; user: LoginUser }
  | { type: 'register' | 'forgot-password' | 'terms' | 'privacy' }
  | { type: 'code-sent'; identity: string }
  | { type: 'error'; message: string };

/**
 * 宿主适配器：你的业务系统实现这些函数，组件负责其余一切（状态、校验、倒计时、取消过期请求）。
 * 组件不保存 token，也不内置任何真实认证服务。
 */
export interface LoginAdapter {
  authenticate: (credentials: LoginCredentials, signal: AbortSignal) => Promise<LoginResult>;
  sendCode: (
    input: { method: 'phone' | 'email'; identity: string; countryCode?: LoginCountryCode },
    signal: AbortSignal,
  ) => Promise<{ retryAfterSeconds: number }>;
  loadQr?: (signal: AbortSignal) => Promise<LoginQrSession>;
  pollQr?: (sessionId: string, signal: AbortSignal) => Promise<LoginQrResult>;
  selectOrganization?: (
    input: { organizationId: string; challengeToken: string },
    signal: AbortSignal,
  ) => Promise<LoginResult>;
  social?: (provider: SocialProvider, signal: AbortSignal) => Promise<LoginResult>;
  onEvent?: (event: LoginEvent) => void;
}

/** 提示信息：要么是文案表里的键（由视图翻译），要么是宿主直接返回的文字。 */
export type LoginNotice = { key: LoginMessageKey } | { text: string };

export interface LoginSnapshot {
  method: LoginMethod;
  countryCode: LoginCountryCode;
  stage: 'identity' | 'credentials' | 'organization';
  verification: LoginVerification;
  status: 'idle' | 'loading' | 'error' | 'success';
  identity: string;
  password: string;
  code: string;
  agreed: boolean;
  remember: boolean;
  errors: Partial<Record<LoginField, LoginMessageKey>>;
  notice: LoginNotice | null;
  sendingCode: boolean;
  resendSeconds: number;
  organizations: LoginOrganization[];
  selectedOrganizationId: string;
  user: LoginUser | null;
  qr: {
    status: 'idle' | 'loading' | 'waiting' | 'scanned' | 'expired' | 'error';
    session: LoginQrSession | null;
    notice: LoginNotice | null;
  };
}

export type LoginAction =
  | { type: 'field'; field: 'identity' | 'password' | 'code'; value: string }
  | { type: 'country-code'; value: LoginCountryCode }
  | { type: 'method'; method: LoginMethod }
  | { type: 'agreement'; value: boolean }
  | { type: 'remember'; value: boolean }
  | { type: 'verification'; verification: LoginVerification }
  | { type: 'next' | 'back' | 'submit' | 'send-code' | 'refresh-qr' | 'reset' }
  | { type: 'organization'; organizationId: string }
  | { type: 'social'; provider: SocialProvider }
  | { type: 'event'; event: 'register' | 'forgot-password' | 'terms' | 'privacy' };

/** 与框架无关的控制器：React 用 useSyncExternalStore 订阅，Vue 用 shallowRef 订阅。 */
export interface LoginController {
  readonly config: LoginConfig;
  getSnapshot: () => LoginSnapshot;
  subscribe: (listener: () => void) => () => void;
  send: (action: LoginAction) => Promise<void>;
  dispose: () => void;
}
