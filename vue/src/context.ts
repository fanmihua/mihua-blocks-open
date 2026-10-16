import { inject, ref, type InjectionKey, type Ref } from 'vue';
import { format, loginMessages, type Locale, type LoginMessageKey } from '@mihua/core';
import { DEFAULT_ICON_SET } from '@mihua/spec';
import type { VueKit } from './kit/types';

export const KitKey: InjectionKey<VueKit> = Symbol('mihua-kit');
export const LocaleKey: InjectionKey<Ref<Locale>> = Symbol('mihua-locale');
/** 规范选定的图标集（icon.set）。 */
export const IconSetKey: InjectionKey<Ref<string>> = Symbol('mihua-icon-set');

export function useIconSet(): Ref<string> {
  return inject(IconSetKey, ref<string>(DEFAULT_ICON_SET));
}

export function useKit(): VueKit {
  const kit = inject(KitKey, null);
  if (!kit) throw new Error('Mihua 组件需要放在 <MihuaProvider :kit="..."> 里面。');
  return kit;
}

export function useLocale(): Ref<Locale> {
  return inject(LocaleKey, ref<Locale>('zh'));
}

/** 登录组件的取字函数。在模板里调用时读取当前语言，切换语言会自动更新。 */
export function useLoginText() {
  const locale = useLocale();
  return (key: LoginMessageKey, params?: Record<string, string | number>) =>
    format(loginMessages[locale.value][key], params);
}
