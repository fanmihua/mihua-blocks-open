import type { ReactNode } from 'react';
import type { VNode } from 'vue';
import type { Check, Combo, SceneIndex } from '@mihua/audit/page/types';

/**
 * 场景：演示页和检查页上渲染的一样东西（登录框、控件样张，以后的列表页）。
 * 场景只管「渲染什么、有哪些状态、每个状态检查什么」，组件库由外面的 MihuaProvider 决定，
 * 所以同一个场景在每个组件库里渲染出来的结构一样，样子由套件负责对齐。
 */
export interface Scene extends SceneIndex {
  /** 打开一个组合：准备好状态，告诉页面每一格渲染什么、做哪些检查。 */
  open(combo: Combo): OpenedScene;
}

export interface OpenedScene {
  /** 每一格里场景的根元素（选择器）：量取的原点，区域（data-region）都在它里面。 */
  root: string;
  checks: Check[];
  /** 每一格里渲染什么：React 一份，Vue 一份（套件由外面的 MihuaProvider 提供）。kit 是这一格的组件库。 */
  react(kit: string): ReactNode;
  vue(kit: string): VNode;
  /** 渲染好以后进入这个组合的状态（控制器要有界面订阅才会工作，所以在渲染之后做）。 */
  enter(): Promise<void>;
  /** 换一份全新的状态；之后页面会重新渲染每一格，再调用 enter。 */
  renew(): void;
  /** 场景的业务状态（键盘、点击检查读它）。 */
  snapshot(kit: string): unknown;
  /** 下次 renew 时只打开这个组件库的模态弹层（对话框），见检查工具的 SceneRuntime.solo。没有模态弹层的场景不用给。 */
  solo?(kit: string | null): void;
  /** 不再用了：停掉计时器、放弃进行中的请求。 */
  dispose(): void;
}
