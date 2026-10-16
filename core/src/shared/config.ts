import type { Localized } from './contract';

/**
 * 配置字段的描述。配置面板、源码包里的说明、AI 上下文都根据它生成，
 * 所以新增一个配置项只改一处：schema 负责校验，字段描述负责「怎么给人看」。
 */
export type ConfigField = {
  key: string;
  label: Localized;
  group: 'content' | 'features' | 'behavior';
  hint?: Localized;
} & (
  | { kind: 'text'; maxLength: number }
  | { kind: 'switch' }
  | { kind: 'select'; options: Array<{ value: string; label: Localized }> }
  | { kind: 'multi'; options: Array<{ value: string; label: Localized }> }
);
