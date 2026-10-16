import blueMarkdown from '../../designs/blue/Design.md?raw';
import monoMarkdown from '../../designs/mono/Design.md?raw';
import { parseDesignMarkdown } from './markdown';
import type { Spec } from './spec';

/**
 * 内置规范：从仓库里的 Design.md 读出来（designs/），文件就是源头——
 * 改 designs/mono/Design.md 里的一个数，演示页、检查、用 monoSpec 的代码都跟着变。
 *
 * Mono（黑白）是所有角色的默认值本身：「没有任何品牌色」的起点。
 * 蓝色只改了和黑白不一样的那些，用来演示「换一份规范」。
 * 两份文件为了从头读一遍，把每个角色都写了出来。
 */
export const monoSpec: Spec = parseDesignMarkdown(monoMarkdown).spec;

/** 蓝色主色的第二套内置规范：偏冷的中性色、6px 控件圆角。 */
export const blueSpec: Spec = parseDesignMarkdown(blueMarkdown).spec;

export const builtinSpecs: readonly Spec[] = [monoSpec, blueSpec];
