import { z } from 'zod';
import type { ConfigField } from '../shared/config';
import type { LoginConfig } from './types';
import { LOGIN_VARIANTS } from './variants';

export const loginConfigSchema = z.object({
  variant: z.enum(['centered', 'split', 'step', 'social', 'qr']).default('centered'),
  defaultMethod: z.enum(['phone', 'account', 'email', 'qr']).optional(),
  title: z.string().trim().max(40).default(''),
  brand: z.string().trim().min(1).max(30).default('Mihua'),
  socialProviders: z
    .array(z.enum(['dingtalk', 'wecom', 'sso']))
    .max(3)
    .default(['dingtalk', 'wecom', 'sso']),
  showRegister: z.boolean().default(true),
  requireAgreement: z.boolean().default(true),
  showRemember: z.boolean().default(true),
  stepVerification: z.enum(['otp', 'password']).default('otp'),
});

export type LoginConfigInput = z.input<typeof loginConfigSchema>;

/**
 * 校验并补全配置。非法值直接报错，不悄悄替换——配置写错了，应该在开发时就知道。
 * 唯一的「修正」是默认登录方式：它必须属于当前布局，否则取布局自己的默认方式。
 */
export function normalizeLoginConfig(input: LoginConfigInput = {}): LoginConfig {
  const result = loginConfigSchema.safeParse(input);
  if (!result.success)
    throw new Error(
      result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
    );
  const value = result.data;
  const variant = LOGIN_VARIANTS[value.variant];
  const defaultMethod =
    value.defaultMethod && variant.methods.includes(value.defaultMethod)
      ? value.defaultMethod
      : variant.defaultMethod;
  return { ...value, defaultMethod, socialProviders: [...new Set(value.socialProviders)] };
}

export const loginDefaults: LoginConfig = normalizeLoginConfig();

export const loginFields: ConfigField[] = [
  {
    key: 'title',
    kind: 'text',
    maxLength: 40,
    group: 'content',
    label: { zh: '标题', en: 'Title' },
    hint: { zh: '留空时显示「欢迎回来」', en: 'Defaults to “Welcome back”' },
  },
  {
    key: 'brand',
    kind: 'text',
    maxLength: 30,
    group: 'content',
    label: { zh: '产品名称', en: 'Product name' },
  },
  {
    key: 'socialProviders',
    kind: 'multi',
    group: 'features',
    label: { zh: '第三方登录', en: 'Social sign-in' },
    options: [
      { value: 'dingtalk', label: { zh: '钉钉', en: 'DingTalk' } },
      { value: 'wecom', label: { zh: '企业微信', en: 'WeCom' } },
      { value: 'sso', label: { zh: '单点登录', en: 'SSO' } },
    ],
  },
  {
    key: 'showRemember',
    kind: 'switch',
    group: 'features',
    label: { zh: '记住登录状态', en: 'Keep me signed in' },
  },
  {
    key: 'showRegister',
    kind: 'switch',
    group: 'features',
    label: { zh: '注册入口', en: 'Sign-up link' },
  },
  {
    key: 'requireAgreement',
    kind: 'switch',
    group: 'behavior',
    label: { zh: '必须同意协议', en: 'Require agreement' },
    hint: { zh: '勾选前不能登录；协议默认不勾选', en: 'Sign-in is blocked until checked' },
  },
  {
    key: 'stepVerification',
    kind: 'select',
    group: 'behavior',
    label: { zh: '分步验证方式', en: 'Step verification' },
    options: [
      { value: 'otp', label: { zh: '验证码', en: 'One-time code' } },
      { value: 'password', label: { zh: '密码', en: 'Password' } },
    ],
  },
];
