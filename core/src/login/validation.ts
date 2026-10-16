import type { LoginMessageKey } from './messages';
import type { LoginCountryCode, LoginMethod } from './types';

/** 各地区手机号规则。只校验格式，号码是否存在由宿主的认证服务判断。 */
const PHONE_RULES: Record<LoginCountryCode, { pattern: RegExp; error: LoginMessageKey }> = {
  '+86': { pattern: /^1[3-9]\d{9}$/, error: 'error.identity.phone.cn' },
  '+852': { pattern: /^[4-9]\d{7}$/, error: 'error.identity.phone.hk' },
  '+1': { pattern: /^[2-9]\d{9}$/, error: 'error.identity.phone.us' },
};

export const COUNTRY_CODES = Object.keys(PHONE_RULES) as LoginCountryCode[];

/** 返回错误键；合法时返回 null。 */
export function identityError(
  method: LoginMethod,
  identity: string,
  countryCode: LoginCountryCode,
): LoginMessageKey | null {
  const value = identity.trim();
  if (!value) {
    if (method === 'phone') return 'error.identity.phone.required';
    if (method === 'email') return 'error.identity.email.required';
    return 'error.identity.account.required';
  }
  if (method === 'phone') {
    const rule = PHONE_RULES[countryCode];
    return rule.pattern.test(value) ? null : rule.error;
  }
  if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return 'error.identity.email.invalid';
  return null;
}

export const isSixDigitCode = (code: string) => /^\d{6}$/.test(code);
