import { ROLES, ROLE_IDS, type RoleGroup, type RoleId } from './roles';
import { validateSpec, type Spec } from './spec';

/**
 * Design.md：人和 AI 都能读的规范文件。
 *
 * ---
 * id: blue
 * name: 蓝色
 * revision: 1
 * ---
 *
 * 任意说明文字……
 *
 * ```mihua-tokens
 * action.primary: #3370FF
 * radius.control: 6px
 * ```
 *
 * 只有 `mihua-tokens` 代码块里的内容会被机器读取；其余文字原样保留，给人看。
 * 解析器不执行任何内容，未知角色和非法取值会直接报错，而不是悄悄忽略。
 */
export interface DesignDocument {
  spec: Spec;
  /** 代码块以外的正文。 */
  prose: string;
}

const FENCE = /```mihua-tokens\s*\n([\s\S]*?)```/;
const FRONT = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

function pairs(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of block.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const at = line.indexOf(':');
    if (at < 1) throw new Error(`无法解析这一行：${line}`);
    out[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return out;
}

export function parseDesignMarkdown(text: string): DesignDocument {
  if (text.length > 100_000) throw new Error('Design.md 不能超过 100 KB。');
  const front = FRONT.exec(text);
  if (!front) throw new Error('缺少开头的 --- 元信息块（id、name、revision）。');
  const meta = pairs(front[1]);
  const body = text.slice(front[0].length);
  const fence = FENCE.exec(body);
  if (!fence) throw new Error('缺少 ```mihua-tokens 代码块。');
  const spec = validateSpec({
    schemaVersion: 1,
    id: meta.id,
    name: meta.name,
    description: meta.description || undefined,
    revision: Number(meta.revision ?? 1),
    values: pairs(fence[1]),
  });
  const prose = (body.slice(0, fence.index) + body.slice(fence.index + fence[0].length)).trim();
  return { spec, prose };
}

const GROUP_TITLE: Record<RoleGroup, string> = {
  action: '操作',
  text: '文字',
  surface: '表面',
  border: '边框',
  feedback: '反馈',
  shape: '形状',
  size: '尺寸',
  type: '字体',
  icon: '图标',
  motion: '动效',
};

/**
 * 把规范写回 Design.md。默认只写出与默认值不同的角色，保持文件短小；
 * all 为 true 时每个角色都写出来（没写的用默认值），给人从头读一遍用（仓库里的 designs/*.Design.md）。
 */
export function serializeDesignMarkdown(
  spec: Spec,
  prose = '',
  { all = false }: { all?: boolean } = {},
): string {
  const values = all
    ? Object.fromEntries(ROLE_IDS.map((id) => [id, spec.values[id] ?? ROLES[id].fallback]))
    : spec.values;
  const changed = ROLE_IDS.filter(
    (id) => values[id] && (all || values[id] !== ROLES[id].fallback),
  );
  const lines: string[] = [];
  let group: RoleGroup | null = null;
  for (const id of changed as RoleId[]) {
    if (ROLES[id].group !== group) {
      group = ROLES[id].group;
      lines.push(`${lines.length ? '\n' : ''}# ${GROUP_TITLE[group]}`);
    }
    lines.push(`${id}: ${values[id]}`);
  }
  const meta = [
    `id: ${spec.id}`,
    `name: ${spec.name}`,
    `revision: ${spec.revision}`,
    ...(spec.description ? [`description: ${spec.description}`] : []),
  ];
  const intro = prose.trim() || `# ${spec.name}\n\n未列出的角色沿用 Mihua 黑白规范的默认值。`;
  return `---\n${meta.join('\n')}\n---\n\n${intro}\n\n\`\`\`mihua-tokens\n${lines.join('\n')}\n\`\`\`\n`;
}
