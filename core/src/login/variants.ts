import type { Localized } from '../shared/contract';
import type { LoginMethod, LoginVariant } from './types';

/**
 * 布局定义：同一套登录能力，五种摆法。
 * 视图读这里决定「扫码放在哪」「第三方登录是主入口还是次入口」，控制器读这里决定可用的登录方式。
 */
export interface LoginVariantDefinition {
  id: LoginVariant;
  /** 表单里可以切换的登录方式，顺序即标签顺序。 */
  methods: LoginMethod[];
  defaultMethod: LoginMethod;
  /** 扫码入口：右上角折角、右侧常驻、作为主入口，或没有。 */
  qr: 'corner' | 'side' | 'primary' | 'none';
  /** 第三方登录：表单下方的次入口，或最显眼的主入口。 */
  social: 'footer' | 'primary';
  /** 分步：先确认身份，再验证。 */
  staged: boolean;
  name: Localized;
  summary: Localized;
  useWhen: Localized[];
  avoidWhen: Localized[];
}

export const LOGIN_VARIANTS: Record<LoginVariant, LoginVariantDefinition> = {
  centered: {
    id: 'centered',
    methods: ['phone', 'account', 'qr'],
    defaultMethod: 'phone',
    qr: 'corner',
    social: 'footer',
    staged: false,
    name: { zh: '居中登录', en: 'Centered' },
    summary: {
      zh: '最常见的独立登录页：标题、方式切换、表单、第三方入口自上而下排列。',
      en: 'The common standalone sign-in page: title, method switch, form and social entry stacked vertically.',
    },
    useWhen: [
      { zh: '独立的登录页', en: 'A standalone sign-in page' },
      { zh: '手机号和账号两种方式都要支持', en: 'Both phone and account sign-in are needed' },
    ],
    avoidWhen: [{ zh: '扫码必须和表单同时出现', en: 'QR must be visible next to the form' }],
  },
  split: {
    id: 'split',
    methods: ['phone', 'account'],
    defaultMethod: 'phone',
    qr: 'side',
    social: 'footer',
    staged: false,
    name: { zh: '双栏登录', en: 'Split' },
    summary: {
      zh: '左侧表单、右侧二维码同时展示，适合桌面端。',
      en: 'Form on the left, QR code on the right, both visible. Best on desktop.',
    },
    useWhen: [{ zh: '员工常用手机扫码，也常用账号', en: 'Staff use both QR and accounts' }],
    avoidWhen: [
      { zh: '还没有扫码服务', en: 'No QR service is available yet' },
      { zh: '容器宽度小于 720px', en: 'The container is narrower than 720px' },
    ],
  },
  step: {
    id: 'step',
    methods: ['phone', 'email'],
    defaultMethod: 'phone',
    qr: 'none',
    social: 'footer',
    staged: true,
    name: { zh: '分步登录', en: 'Step by step' },
    summary: {
      zh: '先确认手机号或邮箱，再输入验证码或密码，一次只做一件事。',
      en: 'Confirm the phone or email first, then verify. One thing at a time.',
    },
    useWhen: [
      { zh: '需要邮箱登录', en: 'Email sign-in is required' },
      { zh: '登录后还要选择组织', en: 'Users pick an organization after signing in' },
    ],
    avoidWhen: [{ zh: '用户习惯一屏完成登录', en: 'Users expect a single-screen sign-in' }],
  },
  social: {
    id: 'social',
    methods: ['phone', 'account'],
    defaultMethod: 'phone',
    qr: 'none',
    social: 'primary',
    staged: false,
    name: { zh: '第三方优先', en: 'Social first' },
    summary: {
      zh: '钉钉、企业微信、SSO 等企业身份作为主入口，账号表单收起为次要方式。',
      en: 'Workplace identities such as DingTalk, WeCom or SSO come first; the form is secondary.',
    },
    useWhen: [
      {
        zh: '企业已经统一使用钉钉、企业微信或 SSO',
        en: 'The company already standardises on DingTalk, WeCom or SSO',
      },
    ],
    avoidWhen: [{ zh: '大部分用户没有企业身份', en: 'Most users have no workplace identity' }],
  },
  qr: {
    id: 'qr',
    methods: ['qr', 'phone', 'account'],
    defaultMethod: 'qr',
    qr: 'primary',
    social: 'footer',
    staged: false,
    name: { zh: '扫码优先', en: 'QR first' },
    summary: {
      zh: '默认展示二维码，扫一下就进来；表单作为备用方式。',
      en: 'Shows the QR code by default; the form is the fallback.',
    },
    useWhen: [{ zh: '员工都装了企业 App', en: 'Everyone has the company app installed' }],
    avoidWhen: [
      { zh: '用户多在手机上打开这个页面', en: 'Most visitors open the page on their phone' },
    ],
  },
};

export function loginMethods(variant: LoginVariant): LoginMethod[] {
  return [...LOGIN_VARIANTS[variant].methods];
}
