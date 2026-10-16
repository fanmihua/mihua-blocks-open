import type { RoleId } from '@mihua/spec';
import type { BlockContract, Localized } from '../shared/contract';
import type { LoginVariant } from './types';
import { LOGIN_VARIANTS } from './variants';

const HOST: BlockContract['host'] = [
  {
    name: 'authenticate',
    required: true,
    description: {
      zh: '校验账号密码或验证码，返回用户，或返回需要选择的组织。',
      en: 'Verify the password or code; return the user or the organizations to choose from.',
    },
  },
  {
    name: 'sendCode',
    required: true,
    description: {
      zh: '发送短信或邮件验证码，返回多少秒后可以重发。',
      en: 'Send an SMS or email code and say when it can be resent.',
    },
  },
  {
    name: 'loadQr',
    required: false,
    description: {
      zh: '创建一个扫码会话，返回二维码图片和过期时间。',
      en: 'Create a QR session with its image and expiry.',
    },
  },
  {
    name: 'pollQr',
    required: false,
    description: {
      zh: '查询扫码进度：等待、已扫码、已确认或已过期。',
      en: 'Report QR progress: waiting, scanned, confirmed or expired.',
    },
  },
  {
    name: 'social',
    required: false,
    description: {
      zh: '用钉钉、企业微信或 SSO 登录。',
      en: 'Sign in with DingTalk, WeCom or SSO.',
    },
  },
  {
    name: 'selectOrganization',
    required: false,
    description: {
      zh: '账号属于多个组织时，进入所选的那一个。',
      en: 'Enter the chosen organization when the account has several.',
    },
  },
  {
    name: 'onEvent',
    required: false,
    description: {
      zh: '接收注册、忘记密码、查看协议等事件，由你的系统决定去哪里。',
      en: 'Receive sign-up, forgot-password and policy events; your system decides where they go.',
    },
  },
];

const COMMON_INVARIANTS: Localized[] = [
  {
    zh: '协议默认不勾选；未同意时不能提交，扫码和第三方登录也不能完成。',
    en: 'The agreement starts unchecked; without it neither the form, QR nor social sign-in can complete.',
  },
  {
    zh: '错误显示在对应字段下方，用文字说明原因，不只靠变红。',
    en: 'Errors appear under the field they belong to, in words, not colour alone.',
  },
  {
    zh: '切换登录方式时放弃进行中的请求，保留「同意协议」与「记住我」。',
    en: 'Switching method abandons requests in flight but keeps the agreement and remember choice.',
  },
  {
    zh: '组件不保存密码或 token，认证结果只交给宿主。',
    en: 'The component never stores passwords or tokens; results go to the host.',
  },
];

const VARIANT_INVARIANTS: Record<LoginVariant, Localized[]> = {
  centered: [
    {
      zh: '扫码入口固定在右上角折角，不占用表单空间。',
      en: 'The QR entry sits in the top-right corner, outside the form.',
    },
  ],
  split: [
    {
      zh: '二维码常驻右侧；容器变窄时移到表单下方。',
      en: 'The QR code stays on the right and moves below the form when narrow.',
    },
    {
      zh: '在手机号和账号之间切换，不会重新生成仍然有效的二维码。',
      en: 'Switching between phone and account keeps a still-valid QR code.',
    },
  ],
  step: [
    {
      zh: '第二步不再要求输入身份；返回第一步时保留已填的身份。',
      en: 'Step two never asks for the identity again; going back keeps it.',
    },
  ],
  social: [
    {
      zh: '第三方按钮放在最上方且与表单等宽；账号表单是次要方式。',
      en: 'Social buttons come first at full width; the account form is secondary.',
    },
  ],
  qr: [
    {
      zh: '默认不显示输入框；二维码过期后必须能一键刷新。',
      en: 'No inputs by default; an expired QR code refreshes in one click.',
    },
  ],
};

const REGIONS: Record<LoginVariant, BlockContract['regions']> = {
  centered: [
    { id: 'header', name: { zh: '标题', en: 'Header' }, controls: ['composite'] },
    { id: 'methods', name: { zh: '登录方式', en: 'Methods' }, controls: ['tabs'] },
    {
      id: 'fields',
      name: { zh: '输入组', en: 'Fields' },
      controls: ['select', 'input', 'input.password', 'button.link'],
    },
    { id: 'agreement', name: { zh: '协议', en: 'Agreement' }, controls: ['checkbox'] },
    { id: 'submit', name: { zh: '主操作', en: 'Submit' }, controls: ['button.primary'] },
    { id: 'social', name: { zh: '第三方登录', en: 'Social' }, controls: ['button.secondary'] },
    { id: 'qr-corner', name: { zh: '扫码折角', en: 'QR corner' }, controls: ['composite'] },
  ],
  split: [
    {
      id: 'form',
      name: { zh: '左侧表单', en: 'Form side' },
      controls: ['tabs', 'input', 'checkbox', 'button.primary'],
    },
    {
      id: 'qr',
      name: { zh: '右侧二维码', en: 'QR side' },
      controls: ['composite', 'button.secondary'],
    },
    {
      id: 'social',
      name: { zh: '底部第三方', en: 'Social footer' },
      controls: ['button.secondary'],
    },
  ],
  step: [
    { id: 'progress', name: { zh: '步骤', en: 'Progress' }, controls: ['composite'] },
    {
      id: 'identity',
      name: { zh: '确认身份', en: 'Identify' },
      controls: ['tabs', 'select', 'input', 'checkbox'],
    },
    {
      id: 'verify',
      name: { zh: '验证', en: 'Verify' },
      controls: ['input', 'input.password', 'button.link'],
    },
    { id: 'submit', name: { zh: '主操作', en: 'Submit' }, controls: ['button.primary'] },
  ],
  social: [
    { id: 'header', name: { zh: '标题', en: 'Header' }, controls: ['composite'] },
    { id: 'providers', name: { zh: '企业身份', en: 'Providers' }, controls: ['button.secondary'] },
    {
      id: 'form',
      name: { zh: '账号表单', en: 'Account form' },
      controls: ['tabs', 'input', 'checkbox', 'button.primary'],
    },
  ],
  qr: [
    { id: 'header', name: { zh: '标题', en: 'Header' }, controls: ['composite'] },
    {
      id: 'qr',
      name: { zh: '二维码', en: 'QR code' },
      controls: ['composite', 'button.secondary'],
    },
    { id: 'fallback', name: { zh: '其他方式', en: 'Fallback' }, controls: ['button.link'] },
    { id: 'social', name: { zh: '第三方登录', en: 'Social' }, controls: ['button.secondary'] },
  ],
};

const STATES: BlockContract['states'] = [
  { id: 'idle', name: { zh: '初始', en: 'Idle' } },
  { id: 'validation-error', name: { zh: '校验出错', en: 'Validation error' } },
  { id: 'code-sent', name: { zh: '验证码已发送', en: 'Code sent' } },
  { id: 'loading', name: { zh: '登录中', en: 'Signing in' } },
  { id: 'error', name: { zh: '登录失败', en: 'Failed' } },
  { id: 'organization', name: { zh: '选择组织', en: 'Choose organization' } },
  { id: 'success', name: { zh: '登录成功', en: 'Signed in' } },
];
const QR_STATES: BlockContract['states'] = [
  { id: 'qr-waiting', name: { zh: '等待扫码', en: 'Waiting for scan' } },
  { id: 'qr-scanned', name: { zh: '已扫码', en: 'Scanned' } },
  { id: 'qr-expired', name: { zh: '二维码过期', en: 'QR expired' } },
];

const TOKENS: RoleId[] = [
  'action.primary',
  'action.primaryHover',
  'action.onPrimary',
  'text.strong',
  'text.body',
  'text.secondary',
  'text.placeholder',
  'text.link',
  'surface.base',
  'surface.subtle',
  'border.default',
  'border.control',
  'feedback.danger',
  'feedback.success',
  'radius.control',
  'radius.panel',
  'size.controlLarge',
  'space.field',
  'space.panel',
  'type.body',
  'type.small',
  'type.title',
  'font.sans',
];

const ACCESSIBILITY: Localized[] = [
  {
    zh: '每个输入框都有可读名称，错误通过 aria-describedby 关联。',
    en: 'Every input has an accessible name; errors are linked with aria-describedby.',
  },
  {
    zh: 'Tab 顺序与视觉顺序一致，回车提交。',
    en: 'Tab order follows the visual order; Enter submits.',
  },
  {
    zh: '发送验证码、登录失败等状态变化会被读屏软件播报。',
    en: 'Status changes such as “code sent” or “failed” are announced.',
  },
  {
    zh: '焦点始终可见；尊重系统的「减少动态效果」。',
    en: 'Focus is always visible; reduced motion is respected.',
  },
];

export function loginContract(variant: LoginVariant): BlockContract {
  const definition = LOGIN_VARIANTS[variant];
  const hasQr = definition.qr !== 'none';
  return {
    id: variant === 'centered' ? 'login' : `login-${variant}`,
    family: 'login',
    variant,
    name: definition.name,
    task: definition.summary,
    regions: REGIONS[variant],
    invariants: [...VARIANT_INVARIANTS[variant], ...COMMON_INVARIANTS],
    states: hasQr ? [...STATES, ...QR_STATES] : STATES,
    host: HOST.map((item) =>
      (item.name === 'loadQr' || item.name === 'pollQr') &&
      (definition.qr === 'side' || definition.qr === 'primary')
        ? { ...item, required: true }
        : item,
    ).filter((item) => hasQr || (item.name !== 'loadQr' && item.name !== 'pollQr')),
    tokens: TOKENS,
    accessibility: ACCESSIBILITY,
  };
}

export const loginContracts: BlockContract[] = (Object.keys(LOGIN_VARIANTS) as LoginVariant[]).map(
  loginContract,
);
