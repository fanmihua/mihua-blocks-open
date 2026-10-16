import { h } from 'vue';
import { MihuaProvider } from '@mihua/react';
import { MihuaProvider as VueMihuaProvider } from '@mihua/vue';
import type { Locale, Spec } from '@mihua/spec';
import type { RegisteredKit } from './kits';
import type { OpenedScene } from './scenes/types';
import { VueHost } from './VueHost';

/**
 * 外观的三档（演示时用来对比）：
 * native 组件库原生；theme 只把规范取值交给组件库的主题变量；aligned 再按控件规格对齐。
 */
export type LookMode = 'native' | 'theme' | 'aligned';

/**
 * 用一个登记过的组件库渲染一格：React 组件库直接渲染，Vue 组件库挂一个真正的 Vue 应用。
 * 这一格渲染的是打开的场景 scene：换了场景（或登录框换了布局）Vue 应用要重新挂载——
 * 它不会跟着 React 重新渲染，Vue 的视图也只在挂载时接收控制器。
 */
export function KitView({
  entry,
  spec,
  mode = 'aligned',
  locale = 'zh',
  scene,
}: {
  entry: RegisteredKit;
  spec: Spec;
  mode?: LookMode;
  locale?: Locale;
  scene: OpenedScene;
}) {
  const native = mode === 'native';
  const align = mode !== 'theme';
  if (entry.framework === 'react')
    return (
      <MihuaProvider kit={entry.kit} spec={spec} native={native} align={align} locale={locale}>
        {scene.react(entry.kit.id)}
      </MihuaProvider>
    );
  const kit = entry.kit;
  return (
    <VueHost
      deps={[kit, spec, mode, locale, scene]}
      render={() =>
        h(VueMihuaProvider, { kit, spec, native, align, locale }, () => scene.vue(kit.id))
      }
    />
  );
}
