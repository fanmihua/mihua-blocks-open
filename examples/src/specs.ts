import { blueSpec, monoSpec, parseDesignMarkdown, type Spec } from '@mihua/spec';
import stressMarkdown from '../../designs/stress/Design.md?raw';

/**
 * 范例和检查用的三套规范，都从仓库里的 Design.md 读出来（designs/）：两套内置的（黑白、蓝色），
 * 加一套把取值推到边上、换了图标集的「压力测试」，检验对齐是不是真的跟着规范走（而不是碰巧和默认值一样）。
 * 改 designs/ 下任何一份 Design.md 里的一个数，演示页（npm run dev）和自动检查都跟着变。
 */
export const SPECS: Record<string, Spec> = {
  mono: monoSpec,
  blue: blueSpec,
  stress: parseDesignMarkdown(stressMarkdown).spec,
};

export const specOf = (id: string | undefined): Spec => SPECS[id ?? 'mono'] ?? monoSpec;
