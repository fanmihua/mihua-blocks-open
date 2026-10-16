import {
  describeFocus,
  edge,
  frames,
  hostSelector,
  measureFocus,
  measurePopup,
  measureScene,
  outline,
  ring,
  visible,
} from './measure';
import type {
  AuditKit,
  Check,
  Combo,
  FocusTarget,
  SceneIndex,
  SceneRuntime,
  Target,
} from './types';

/**
 * 检查页这一侧：把量取函数挂到 window.__audit 上，检查工具（audit/run.mjs）通过它量、通过它找元素。
 *
 * 检查页的约定：每个组件库一格 [data-audit-cell=<组件库>]，格子最前面一个看不见的起点按钮
 * [data-audit-start]（键盘检查从这里开始按 Tab）。场景渲染在格子里。
 */

/**
 * 算不算「在页面上」：看得见；或者是藏起来的原生 input、外层看得见——
 * 开关、复选框常用这种做法（Element 开关的 role=switch 就在一个隐藏的 input 上），键盘能聚焦到它。
 */
const present = (el: Element) =>
  visible(el) ||
  (el instanceof HTMLInputElement &&
    // 外面包着一层透明的框也算（Element 选择框里能聚焦的输入框），只要没被 display / visibility 藏起来
    el.checkVisibility({ visibilityProperty: true }) &&
    !!el.parentElement &&
    (visible(el.parentElement) || el.getBoundingClientRect().width > 1));

export const CELL = 'data-audit-cell';
export const START = 'data-audit-start';

export interface Harness {
  scenes: SceneIndex[];
  kits: AuditKit[];
  combo: Combo;
  scene: SceneRuntime;
  /** 场景渲染好、字体加载好、组件库的过渡动画结束之后才 resolve。 */
  ready: Promise<unknown>;
}

export function installHarness({ scenes, kits, combo, scene, ready }: Harness) {
  const kitOf = (id: string) => kits.find((kit) => kit.id === id)!;
  const cell = (id: string) => document.querySelector(`[${CELL}='${id}']`)!;
  const rootOf = (id: string) => cell(id).querySelector(scene.root);

  /** 按部件或选择器找目标（只算看得见的）。 */
  const find = (id: string, target: Target): Element | null => {
    const selector = target.part ? hostSelector(kitOf(id).parts[target.part]) : target.selector!;
    const all = [...cell(id).querySelectorAll(selector)].filter(present);
    const index = target.index === 'last' ? all.length - 1 : (target.index ?? 0);
    return all[index] ?? null;
  };
  const center = (el: Element | null) => {
    if (!el) return null;
    // 组件库一多，页面会比检查窗口宽（双栏登录五格排开要 4000 多 px）。真实的鼠标只能点到窗口里的东西，
    // 所以先把目标滚进窗口，再算坐标。离窗口左右边缘不到 400px 的滚到窗口中间：
    // 贴着窗口边缘时，往那一边弹出的弹层（侧栏收起后的子菜单）放不下，组件库会把它翻到另一边，各家翻法不同。
    const box = el.getBoundingClientRect();
    const margin = Math.min(400, innerWidth / 4);
    const roomy = box.left >= margin && box.right <= innerWidth - margin;
    el.scrollIntoView({ block: 'nearest', inline: roomy ? 'nearest' : 'center' });
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };

  Object.assign(window, {
    __audit: {
      scenes,
      kits: kits.map((kit) => kit.id),
      combo,
      checks: scene.checks satisfies Check[],
      ready: ready.then(() => frames(2)).then(() => true),
      /** 场景有没有模态弹层（有的话，样子也一个组件库一个组件库地量）。 */
      solo: !!scene.solo,
      /** 只量一个组件库。 */
      measureIn: (id: string) => {
        const root = rootOf(id);
        return root ? measureScene(root, kitOf(id).parts) : null;
      },
      /** 量整个场景（每个组件库一份）。 */
      measure: () =>
        Object.fromEntries(
          kits.map((kit) => {
            const root = rootOf(kit.id);
            return [kit.id, root ? measureScene(root, kit.parts) : null];
          }),
        ),
      /** 一个组件库：逐个聚焦（每个目标要等聚焦、失焦的过渡，组件库多、目标多时一次量完会超过检查工具的等待时间）。 */
      measureFocusIn: async (id: string, targets: FocusTarget[]) => {
        const root = rootOf(id);
        return root ? await measureFocus(root, kitOf(id).parts, targets) : null;
      },
      measureFocus: async (targets: FocusTarget[]) => {
        const out: Record<string, unknown> = {};
        for (const kit of kits) {
          const root = rootOf(kit.id);
          out[kit.id] = root ? await measureFocus(root, kit.parts, targets) : null;
        }
        return out;
      },
      measurePopup: (id: string, trigger: Target, popup: string, item?: string) =>
        measurePopup(find(id, trigger), cell(id), kitOf(id).parts, popup as never, item as never),
      /** 目标的中心点（给检查工具里的真实鼠标点击、悬停用）。 */
      center: (id: string, target: Target) => center(find(id, target)),
      /** 鼠标悬停之后，那个元素的样子。 */
      styleOf: (id: string, target: Target) => {
        const el = find(id, target);
        if (!el) return null;
        const cs = getComputedStyle(el);
        return {
          bg: cs.backgroundColor,
          color: cs.color,
          edge: edge(el),
          ring: ring(el),
          outline: outline(el),
        };
      },
      /**
       * 只和一个组件库交互：别的格子设成 inert（不能聚焦、不能点）；场景有模态弹层（scene.solo）时，
       * 复原成只有这个组件库的弹层开着。不给 id 就全部恢复。
       */
      isolate: async (id?: string) => {
        if (scene.solo) {
          scene.solo(id ?? null);
          await scene.reset();
        }
        for (const kit of kits) (cell(kit.id) as HTMLElement).inert = !!id && kit.id !== id;
        await frames(2);
      },
      focusStart: (id: string) => cell(id).querySelector<HTMLElement>(`[${START}]`)!.focus(),
      focusIn: (id: string, target: Target) => {
        const el = find(id, target) as HTMLElement | null;
        el?.focus();
        return !!el;
      },
      focused: () => {
        const el = document.activeElement;
        const owner = el?.closest(`[${CELL}]`);
        return {
          kit: owner?.getAttribute(CELL) ?? null,
          start: !!el?.matches(`[${START}]`),
          desc: describeFocus(),
        };
      },
      snapshot: (id: string) => scene.snapshot(id),
      reset: async () => {
        await scene.reset();
        await frames(2);
      },
    },
  });
}
