import type { Locale, Localized, RoleId } from '@mihua/spec';

export type { Locale, Localized };

/**
 * 控件角色：视图只说「这里要一个主按钮」，由技术栈套件决定它是
 * antd 的 `<Button type="primary">`、Arco 的 `<Button type="primary">` 还是 Element 的 `<el-button type="primary">`。
 */
export type ControlRole =
  | 'button.primary'
  | 'button.secondary'
  | 'button.link'
  | 'input'
  | 'input.password'
  | 'select'
  | 'checkbox'
  | 'tabs'
  | 'composite';

/**
 * 组件契约：一个组件「是什么」的完整说明，不涉及它「长什么样」。
 * 网站的拆解页、源码包里的说明、给 AI 的上下文都从这里生成，所以只写一次。
 */
export interface BlockContract {
  id: string;
  family: 'login' | 'notifications' | 'uploads';
  variant: string;
  name: Localized;
  /** 这个组件替用户完成什么任务，一句话。 */
  task: Localized;
  /** 结构分区。视图必须按这个顺序出现这些区域。 */
  regions: Array<{ id: string; name: Localized; controls: ControlRole[] }>;
  /** 不变量：换框架、换组件库、换规范时都不能被破坏的规则。 */
  invariants: Localized[];
  /** 组件可能处于的状态。拆解页可以直接切换到任意一个。 */
  states: Array<{ id: string; name: Localized }>;
  /** 宿主（你的业务系统）需要接入的函数。组件自己不连任何后端。 */
  host: Array<{ name: string; required: boolean; description: Localized }>;
  /** 这个组件消费的语义角色。 */
  tokens: RoleId[];
  accessibility: Localized[];
}

export function text(value: Localized, locale: Locale): string {
  return value[locale];
}

export function format(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}
