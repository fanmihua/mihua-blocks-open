import type { SocialProvider } from '@mihua/core';

/**
 * 企业身份的标识。这里用品牌色加首字，不复制各家的商标图形；
 * 接入真实业务时，换成你获得授权的官方图标即可。
 */
const PROVIDER_MARK: Record<SocialProvider, { glyph: string; color: string }> = {
  dingtalk: { glyph: '钉', color: '#0089FF' },
  wecom: { glyph: '企', color: '#07C160' },
  sso: { glyph: 'ID', color: 'var(--mh-text-strong)' },
};

export function ProviderMark({ provider, size = 20 }: { provider: SocialProvider; size?: number }) {
  const mark = PROVIDER_MARK[provider];
  return (
    <span
      className="mh-provider-mark"
      aria-hidden
      style={{ width: size, height: size, background: mark.color, fontSize: size * 0.5 }}
    >
      {mark.glyph}
    </span>
  );
}
