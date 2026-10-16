import type { PartMap, PartName } from '@mihua/spec';

/**
 * 检查工具和检查页之间的约定。
 *
 * 检查工具（audit/run.mjs）只认识这里的几种「检查项」，不认识任何组件库、任何组件：
 * 组件库从登记表来（每个套件带一份部件地图），组件从「场景」来（登录框、控件样张、以后的列表页）。
 * 接一个新组件库：登记一行。加一个新场景或新控件：写场景、补部件地图。检查工具本身不用改。
 */

/** 登记过的一个组件库：检查工具只需要知道它叫什么、它的部件在哪。 */
export interface AuditKit {
  id: string;
  name: string;
  framework: 'react' | 'vue';
  parts: PartMap;
}

/**
 * 页面上的一个目标：
 * - part：按部件地图找（每个组件库的元素不同），例如 { part: 'select' }；
 * - selector：按页面结构找（所有组件库都一样的地方），例如 '[data-region=submit] button'。
 * index 是第几个（从 0 开始），'last' 是最后一个；只算看得见的。
 */
export interface Target {
  part?: PartName;
  selector?: string;
  index?: number | 'last';
}

/** 聚焦一个元素，量它对应部件的边线和外圈。 */
export interface FocusTarget {
  /** 要聚焦的元素（场景里所有匹配的、看得见的元素逐个聚焦）。 */
  selector: string;
  /** 外圈画在哪个部件上（可以是元素自己、它的外层、里层或旁边的元素）。 */
  part?: PartName;
}

/**
 * 检查项。每一项都在所有登记的组件库里做同样的事，然后逐项对比结果。
 * - look：量整个场景，按区域、按部件（位置、大小、文字、颜色、边线、圆角、图标）
 * - focus：逐个聚焦，量边线和外圈
 * - popup：真实点击（或鼠标悬停）打开弹层，量弹层和选项，再按 Esc（或把鼠标移开），核对弹层收起
 * - hover：鼠标悬停，量那个元素的颜色和边线
 * - tabOrder：从每格开头一直按 Tab，记下依次聚焦到什么
 * - keys：聚焦一个元素，按几个键，读场景的状态和焦点
 * - click：真实点击一个元素，读场景的状态
 */
export type Check =
  | { type: 'look' }
  | { type: 'focus'; targets: FocusTarget[] }
  | {
      type: 'popup';
      label: string;
      trigger: Target;
      popup: PartName;
      /** 弹层里的项（下拉的选项、菜单项）；不给就量弹层自己的文字（文字提示）。 */
      item?: PartName;
      /**
       * 怎么打开：click（默认）点击，按 Esc 收起；hover 鼠标悬停，把鼠标移开收起
       * （比如侧栏收起后的子菜单）。
       */
      open?: 'click' | 'hover';
    }
  | { type: 'hover'; label: string; target: Target }
  | { type: 'tabOrder' }
  | {
      type: 'keys';
      label: string;
      target: Target;
      /** 按键；{ text } 是打一串字（比如在日期框里打「2026-06-08」）。 */
      keys: Array<AuditKey | { text: string }>;
      /** 只比状态、不比按完以后焦点在哪（默认两样都比）。 */
      read?: 'state';
      /** 两个键之间等多久（毫秒，默认 60）。按人的速度按（比如连按两次 Esc）时给大一点。 */
      gap?: number;
    }
  | {
      type: 'click';
      label: string;
      target: Target;
      /** 点完以后接着依次再点这几处（比如打开日期面板，再点开始、结束两天）。 */
      steps?: Target[];
    };

export type AuditKey =
  | 'Tab'
  | 'Enter'
  | 'Escape'
  | 'Space'
  | 'ArrowRight'
  | 'ArrowLeft'
  | 'ArrowDown'
  | 'ArrowUp';

/** 一个组合：场景的一种状态，例如 { spec: 'mono', variant: 'centered', state: 'errors' }。 */
export type Combo = Record<string, string>;

/** 检查页上当前打开的场景。 */
export interface SceneRuntime {
  /** 场景在每一格里的根元素（选择器）：量取的原点，区域都在它里面。 */
  root: string;
  /** 这个组合要做哪些检查。 */
  checks: Check[];
  /** 场景的业务状态（键盘、点击检查读它）。各组件库共用一个状态时可以不看 kit。 */
  snapshot(kit: string): unknown;
  /** 回到这个组合的初始状态（键盘、点击检查每次只动一个组件库，动之前先复原）。 */
  reset(): Promise<void>;
  /**
   * 下次复原时只打开这个组件库的对话框这类模态弹层（可选；null 是一个都不开）。检查页上几个组件库并排，
   * 几个模态对话框同时开着时，每个都把焦点锁在自己里面、把页面别处设成不能点（Radix 给 body 加
   * pointer-events: none），互相抢焦点，三个以上一打开页面就卡死；真实页面里只有一个。
   * 所以有模态弹层的状态，检查页一打开一个都不开；检查工具和某个组件库交互、量它的样子之前，先调用它再复原。
   */
  solo?(kit: string | null): void;
}

/** 检查页能提供的所有场景和它们的组合（检查工具逐个打开）。 */
export interface SceneIndex {
  id: string;
  name: string;
  combos: Combo[];
}
