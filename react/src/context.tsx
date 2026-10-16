import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { format, loginMessages, type Locale, type LoginMessageKey } from '@mihua/core';
import { DEFAULT_ICON_SET } from '@mihua/spec';
import type { Kit } from './kit/types';

const KitContext = createContext<Kit | null>(null);
const LocaleContext = createContext<Locale>('zh');
/** 弹层（下拉菜单等）挂载的节点。挂在规范作用域里，弹层才能拿到同一套 token。 */
const PortalContext = createContext<HTMLElement | null>(null);
/** 规范选定的图标集（icon.set）。 */
const IconSetContext = createContext<string>(DEFAULT_ICON_SET);

export function useKit(): Kit {
  const kit = useContext(KitContext);
  if (!kit) throw new Error('Mihua 组件需要放在 <MihuaProvider kit={...}> 里面。');
  return kit;
}
export const useLocale = () => useContext(LocaleContext);
export const usePortal = () => useContext(PortalContext);
export const useIconSet = () => useContext(IconSetContext);

export function ContextProviders({
  kit,
  locale,
  portal,
  iconSet,
  children,
}: {
  kit: Kit;
  locale: Locale;
  portal: HTMLElement | null;
  iconSet: string;
  children: ReactNode;
}) {
  return (
    <KitContext.Provider value={kit}>
      <LocaleContext.Provider value={locale}>
        <PortalContext.Provider value={portal}>
          <IconSetContext.Provider value={iconSet}>{children}</IconSetContext.Provider>
        </PortalContext.Provider>
      </LocaleContext.Provider>
    </KitContext.Provider>
  );
}

/** 登录组件的取字函数：`t('action.resend', { seconds: 42 })`。 */
export function useLoginText() {
  const locale = useLocale();
  return useMemo(() => {
    const table = loginMessages[locale];
    return (key: LoginMessageKey, params?: Record<string, string | number>) =>
      format(table[key], params);
  }, [locale]);
}
