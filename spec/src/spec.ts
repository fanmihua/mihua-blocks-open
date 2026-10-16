import { z } from 'zod';
import { ICON_SETS, NATIVE_ICONS } from './icons';
import { isHexColor } from './color';
import { ROLES, ROLE_IDS, cssVar, type RoleId } from './roles';

/**
 * 规范（Spec）= 一组「角色 → 取值」。
 * 只写需要改变的角色，其余沿用默认值（黑白规范）。
 */
export interface Spec {
  schemaVersion: 1;
  id: string;
  name: string;
  description?: string;
  revision: number;
  values: Partial<Record<RoleId, string>>;
}

/** 补全默认值之后的完整取值表，组件和映射层只消费这个。 */
export type ResolvedTokens = Readonly<Record<RoleId, string>>;

const LENGTH = /^(\d+(?:\.\d+)?)px$/;
const DURATION = /^(\d+)ms$/;

/** 校验单个取值；返回错误说明，合法时返回空字符串。 */
export function checkValue(id: RoleId, value: string): string {
  const role = ROLES[id];
  const v = value.trim();
  if (role.kind === 'color') return isHexColor(v) ? '' : `${id} 需要十六进制颜色，例如 #0A0A0A`;
  if (role.kind === 'font') return v && !/[;{}<>]/.test(v) ? '' : `${id} 需要字体名称列表`;
  if (role.kind === 'icons')
    return v in ICON_SETS || v === NATIVE_ICONS
      ? ''
      : `${id} 需要图标集名称：${[...Object.keys(ICON_SETS), NATIVE_ICONS].join('、')}`;
  const match = (role.kind === 'length' ? LENGTH : DURATION).exec(v);
  if (!match)
    return `${id} 需要${role.kind === 'length' ? ' px 长度，例如 6px' : ' ms 时长，例如 150ms'}`;
  const n = Number(match[1]);
  const [min, max] = role.range ?? [0, Infinity];
  return n < min || n > max ? `${id} 超出范围 ${min}–${max}` : '';
}

const specSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().regex(/^[a-z][a-z0-9-]{0,63}$/, 'id 只能使用小写字母、数字和连字符'),
    name: z.string().min(1).max(60),
    description: z.string().max(400).optional(),
    revision: z.number().int().positive(),
    values: z.record(z.string(), z.string()),
  })
  .superRefine((spec, ctx) => {
    for (const [key, value] of Object.entries(spec.values)) {
      if (!ROLE_IDS.includes(key as RoleId)) {
        ctx.addIssue({ code: 'custom', path: ['values', key], message: `未知的角色：${key}` });
        continue;
      }
      const problem = checkValue(key as RoleId, value);
      if (problem) ctx.addIssue({ code: 'custom', path: ['values', key], message: problem });
    }
  });

export function validateSpec(input: unknown): Spec {
  const result = specSchema.safeParse(input);
  if (!result.success) throw new Error(result.error.issues.map((i) => i.message).join('；'));
  return result.data as Spec;
}

export function resolveSpec(spec: Spec): ResolvedTokens {
  return Object.fromEntries(
    ROLE_IDS.map((id) => [id, spec.values[id]?.trim() || ROLES[id].fallback]),
  ) as ResolvedTokens;
}

/** 生成可以直接放进 `style` 的 CSS 变量，例如 `{ '--mh-action-primary': '#0A0A0A' }`。 */
export function toCssVariables(tokens: ResolvedTokens): Record<string, string> {
  return Object.fromEntries(ROLE_IDS.map((id) => [cssVar(id), tokens[id]]));
}

export const px = (value: string) => Number(LENGTH.exec(value)?.[1] ?? 0);
export const ms = (value: string) => Number(DURATION.exec(value)?.[1] ?? 0);
