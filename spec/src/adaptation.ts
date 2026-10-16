import type { Localized } from './roles';

/**
 * 适配记录：一个组件库默认和统一设计（控件规格）不一样的地方，以及套件是怎么对齐的。
 * 每个套件都带一份，文档和演示页直接读它，不另写说明。
 */
export interface Adaptation {
  /** 哪种控件。 */
  control: AdaptedControl;
  /** 哪一类差异。 */
  aspect: AdaptationAspect;
  /** 组件库默认怎么做。 */
  native: Localized;
  /** 套件怎么对齐到统一设计。 */
  aligned: Localized;
  /** 用的什么手段，从最省事到最费事。 */
  via: AdaptationMethod;
}

export type AdaptedControl =
  | 'text'
  | 'field'
  | 'select'
  | 'checkbox'
  | 'tabs'
  | 'button'
  | 'link'
  | 'popup'
  | 'switch'
  | 'nav'
  | 'breadcrumb'
  | 'dropdown'
  | 'avatar'
  | 'badge'
  | 'table'
  | 'pagination'
  | 'tag'
  | 'dateRange'
  | 'dialog'
  | 'radio'
  | 'textarea';

/**
 * 哪一类差异。键盘和无障碍分开记：
 * - keyboard：组件库支持键盘，但按键做的事、聚焦的样子不一样（antd 标签栏 ← → 只移焦点、按回车才切换）；
 * - a11y：读屏和只用键盘的人用不了或用不好——没有角色（role）、Tab 进不去、读屏读不到名字、
 *   aria 属性落在别的元素上（TDesign 的开关和标签栏是普通 div；Element、TDesign 的菜单 Tab 进不去）。
 */
export type AdaptationAspect =
  | 'size'
  | 'color'
  | 'shape'
  | 'type'
  | 'icon'
  | 'state'
  | 'keyboard'
  | 'a11y';

/**
 * 对齐手段：
 * - theme-token：组件库的全局主题变量（antd 的 token、Element 的 CSS 变量）
 * - component-token：某个组件自己的主题变量（antd 的组件 token、Element 组件上声明的变量）
 * - prop：组件的属性（Arco 输入框的 height、Element 下拉的 offset）
 * - class：直接换类名（shadcn 的源码在我们手里）
 * - style-override：组件库没有接口，在套件样式表里逐项改，只在接上规范时生效
 * - behavior：组件库的交互不一样，套件补上或改写（键盘、显隐切换）
 */
export type AdaptationMethod =
  | 'theme-token'
  | 'component-token'
  | 'prop'
  | 'class'
  | 'style-override'
  | 'behavior';

export const CONTROL_NAMES: Record<AdaptedControl, Localized> = {
  text: { zh: '文字', en: 'Text' },
  field: { zh: '输入框', en: 'Input' },
  select: { zh: '选择框', en: 'Select' },
  checkbox: { zh: '复选框', en: 'Checkbox' },
  tabs: { zh: '标签栏', en: 'Tabs' },
  button: { zh: '按钮', en: 'Button' },
  link: { zh: '文字链接', en: 'Link' },
  popup: { zh: '下拉', en: 'Dropdown' },
  switch: { zh: '开关', en: 'Switch' },
  nav: { zh: '导航菜单', en: 'Navigation menu' },
  breadcrumb: { zh: '面包屑', en: 'Breadcrumb' },
  dropdown: { zh: '下拉菜单', en: 'Dropdown menu' },
  avatar: { zh: '头像', en: 'Avatar' },
  badge: { zh: '徽标', en: 'Badge' },
  table: { zh: '表格', en: 'Table' },
  pagination: { zh: '分页', en: 'Pagination' },
  tag: { zh: '标签', en: 'Tag' },
  dateRange: { zh: '日期范围', en: 'Date range' },
  dialog: { zh: '对话框', en: 'Dialog' },
  radio: { zh: '单选', en: 'Radio' },
  textarea: { zh: '多行输入', en: 'Textarea' },
};

export const ASPECT_NAMES: Record<AdaptationAspect, Localized> = {
  size: { zh: '尺寸', en: 'Size' },
  color: { zh: '颜色', en: 'Color' },
  shape: { zh: '形状', en: 'Shape' },
  type: { zh: '字号字重', en: 'Type' },
  icon: { zh: '图标', en: 'Icon' },
  state: { zh: '状态', en: 'State' },
  keyboard: { zh: '键盘', en: 'Keyboard' },
  a11y: { zh: '无障碍', en: 'Accessibility' },
};

export const METHOD_NAMES: Record<AdaptationMethod, Localized> = {
  'theme-token': { zh: '全局主题变量', en: 'Theme token' },
  'component-token': { zh: '组件主题变量', en: 'Component token' },
  prop: { zh: '组件属性', en: 'Prop' },
  class: { zh: '换类名', en: 'Class names' },
  'style-override': { zh: '样式覆盖', en: 'Style override' },
  behavior: { zh: '补交互', en: 'Behavior' },
};

const z = (zh: string, en: string): Localized => ({ zh, en });
/** 写适配记录的小工具：adapt('tabs', 'size', 默认, 对齐, 手段)。 */
export function adapt(
  control: AdaptedControl,
  aspect: AdaptationAspect,
  native: [string, string],
  aligned: [string, string],
  via: AdaptationMethod,
): Adaptation {
  return { control, aspect, native: z(...native), aligned: z(...aligned), via };
}

/**
 * 控件的状态归谁管：
 * - controller：Mihua 的控制器（业务状态，React 和 Vue 共用，四个组件库表现一样）
 * - library：组件库自己（控件内部的状态，每个组件库默认做法不同）
 * - kit：组件库没有、或做法不一样，套件补上或改写
 */
export type StateOwner = 'controller' | 'library' | 'kit';

export interface ControlState {
  control: AdaptedControl;
  state: Localized;
  owner: StateOwner;
  /** 统一成什么样。 */
  aligned: Localized;
}

const state = (
  control: AdaptedControl,
  name: [string, string],
  owner: StateOwner,
  aligned: [string, string],
): ControlState => ({ control, state: z(...name), owner, aligned: z(...aligned) });

export const CONTROL_STATES: ControlState[] = [
  state('field', ['输入的值', 'Value'], 'controller', [
    '控制器保存，两个框架共用',
    'Kept by the controller, shared by both frameworks',
  ]),
  state('field', ['出错', 'Invalid'], 'controller', [
    '控制器校验后给出，套件交给组件库的出错样式',
    'Set by the controller after validation; the kit maps it to the library error style',
  ]),
  state('field', ['禁用', 'Disabled'], 'controller', [
    '提交中由控制器禁用',
    'Disabled by the controller while submitting',
  ]),
  state('field', ['聚焦', 'Focused'], 'library', [
    '组件库管焦点；描边和外圈取控件规格',
    'The library owns focus; border and ring come from the spec',
  ]),
  state('field', ['悬停', 'Hovered'], 'library', [
    '组件库管；颜色取控件规格',
    'The library owns it; colors come from the spec',
  ]),
  state('field', ['显示密码', 'Password shown'], 'kit', [
    '眼睛图标一直显示，隐藏时是闭眼',
    'The eye is always shown; closed while hidden',
  ]),
  state('select', ['选中的值', 'Selected value'], 'controller', [
    '控制器保存',
    'Kept by the controller',
  ]),
  state('select', ['展开 / 收起', 'Open / closed'], 'library', [
    '组件库管；位置、间距、外框取控件规格；Esc 都能收起',
    'The library owns it; position, gap and frame come from the spec; Esc closes in all four',
  ]),
  state('select', ['键盘高亮的选项', 'Highlighted option'], 'library', [
    '组件库管；底色取控件规格',
    'The library owns it; the fill comes from the spec',
  ]),
  state('checkbox', ['勾选', 'Checked'], 'controller', ['控制器保存', 'Kept by the controller']),
  state('checkbox', ['出错', 'Invalid'], 'controller', [
    '未勾选协议就提交时红色描边',
    'Red border when submitting without agreeing',
  ]),
  state('tabs', ['当前标签', 'Active tab'], 'controller', [
    '控制器保存（登录方式）',
    'Kept by the controller (sign-in method)',
  ]),
  state('tabs', ['键盘操作', 'Keyboard'], 'kit', [
    '← → 移动焦点并切换，只有当前标签在 Tab 顺序里',
    'Arrows move focus and switch; only the active tab is a Tab stop',
  ]),
  state('button', ['悬停 / 按下', 'Hover / pressed'], 'library', [
    '组件库管；颜色取控件规格',
    'The library owns it; colors come from the spec',
  ]),
  state('button', ['提交中', 'Loading'], 'controller', [
    '控制器给出，按钮显示一个字高的加载图标',
    'Set by the controller; the button shows a 1em spinner',
  ]),
];

/**
 * 组件库档案：这个组件库本身是怎么写的。文档介绍组件库时直接读它，
 * 加一个组件库 = 加一个套件和一份档案，文档里自动多一页。
 */
export interface LibraryProfile {
  framework: 'react' | 'vue';
  /** 官网。 */
  site: string;
  /** 两三个短标签：一眼看出它的样式和主题是怎么做的。 */
  tags: Localized[];
  /** 样式是怎么写的。 */
  styling: Localized;
  /** 主题从哪里进。 */
  theming: Localized;
  /** 尺寸体系。 */
  sizing: Localized;
  /** 默认长什么样。 */
  look: Localized;
  /** 图标从哪来：图标在哪个包里、组件里的图标能不能换。 */
  icons: Localized;
  /**
   * 无障碍：组件库自己的角色、键盘、读屏做得怎么样，有哪些缺口。套件在对齐那一档补上，原生那一档保留原样；
   * 但接口给的属性（aria-label、aria-describedby）落到真正的输入框上属于接口约定，三档都做。
   * 具体每一处记在适配记录里（aspect 为 a11y）。
   */
  accessibility: Localized;
  /** 接进项目要做的事。 */
  setup: Localized[];
}
