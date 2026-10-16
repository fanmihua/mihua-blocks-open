import type { RoleId } from './roles';
import type { ResolvedTokens } from './spec';

export type ThemeValue = string | number;

/** 映射的来源和值放在一起：实际主题与可视化说明消费同一条关系。 */
export interface ThemeRoleMapping<Value extends ThemeValue = ThemeValue> {
  role: RoleId;
  value: Value;
  note: string;
}

export function roleMapping(
  tokens: ResolvedTokens,
  role: RoleId,
  note: string,
): ThemeRoleMapping<string>;
export function roleMapping<Value extends ThemeValue>(
  tokens: ResolvedTokens,
  role: RoleId,
  note: string,
  convert: (value: string) => Value,
): ThemeRoleMapping<Value>;
export function roleMapping(
  tokens: ResolvedTokens,
  role: RoleId,
  note: string,
  convert: (value: string) => ThemeValue = (value) => value,
): ThemeRoleMapping {
  return { role, value: convert(tokens[role]), note };
}

/** 保留各目标的实际值类型，例如 antd 的圆角是 number，CSS 变量是 string。 */
export function themeMappingValues<const Map extends Record<string, ThemeRoleMapping>>(
  mappings: Map,
): { [Target in keyof Map]: Map[Target]['value'] } {
  return Object.fromEntries(
    Object.entries(mappings).map(([target, mapping]) => [target, mapping.value]),
  ) as { [Target in keyof Map]: Map[Target]['value'] };
}
