import { computed, defineComponent, h, provide, type PropType } from 'vue';
import {
  controlCssVariables,
  iconCssVariables,
  monoSpec,
  resolveControls,
  resolveSpec,
  toCssVariables,
  type Spec,
} from '@mihua/spec';
import type { Locale } from '@mihua/core';
import { IconSetKey, KitKey, LocaleKey } from './context';
import type { VueKit } from './kit/types';
import '@mihua/core/styles/root.css';

/**
 * 与 React 版 MihuaProvider 相同的三件事：规范 → CSS 变量；规范 → 组件库主题（native 时跳过）；提供语言。
 * 套件在挂载时注入；需要换套件时给 MihuaProvider 换一个 key 让它重新挂载。
 */
export const MihuaProvider = defineComponent({
  name: 'MihuaProvider',
  props: {
    kit: { type: Object as PropType<VueKit>, required: true },
    spec: { type: Object as PropType<Spec>, default: () => monoSpec },
    native: { type: Boolean, default: false },
    /** 为 false 时只把取值交给组件库的主题变量，不按控件规格对齐（用来对比）。 */
    align: { type: Boolean, default: true },
    locale: { type: String as PropType<Locale>, default: 'zh' },
  },
  setup(props, { slots }) {
    provide(KitKey, props.kit);
    provide(
      LocaleKey,
      computed(() => props.locale),
    );
    const tokens = computed(() => resolveSpec(props.spec));
    provide(
      IconSetKey,
      computed(() => tokens.value['icon.set']),
    );
    return () =>
      h(
        'div',
        {
          class: 'mh-root',
          'data-kit': props.kit.id,
          'data-native': props.native || undefined,
          lang: props.locale === 'zh' ? 'zh-CN' : 'en',
          // 规范的取值（--mh-*）加上由它算出的控件规格（--mh-c-*），套件对齐时读后者
          style: {
            ...toCssVariables(tokens.value),
            ...controlCssVariables(resolveControls(tokens.value)),
            // 组件库只能用 CSS 画的图标（复选框的对勾），套件用这些变量做遮罩
            ...iconCssVariables(tokens.value['icon.set']),
          },
        },
        [
          h(
            props.kit.Provider,
            { tokens: props.native ? null : tokens.value, aligned: props.align },
            slots,
          ),
        ],
      );
  },
});
