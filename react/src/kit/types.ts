import type { ComponentType, ReactElement, ReactNode } from 'react';
import type {
  Adaptation,
  BreadcrumbItem,
  DropdownItem,
  LibraryProfile,
  NavItem,
  PartMap,
  ResolvedTokens,
  TableColumn,
  TableRow,
  TableSort,
  TagTone,
} from '@mihua/spec';

/**
 * 控件套件（Kit）
 *
 * 视图只会说「这里要一个主按钮」「这里要一个输入框」。套件负责把这些话翻译成某个组件库的真实组件，
 * 并把规范里的 token 交给这个组件库自己的主题接口。换组件库 = 换套件，视图一行不改。
 *
 * 接口刻意很小：只包含复合组件真正需要的基础控件。
 */
/** 组件库的名字，比如 antd。接新组件库不用改这里。 */
export type KitId = string;

export interface ButtonProps {
  variant: 'primary' | 'secondary' | 'link' | 'text';
  size?: 'default' | 'large';
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  icon?: ReactNode;
  onClick?: () => void;
  'aria-label'?: string;
  children?: ReactNode;
}

export interface InputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'password' | 'email' | 'tel';
  placeholder?: string;
  size?: 'default' | 'large';
  invalid?: boolean;
  disabled?: boolean;
  /** 输入框右侧的附加内容，例如「获取验证码」。 */
  suffix?: ReactNode;
  autoComplete?: string;
  inputMode?: 'text' | 'numeric' | 'email' | 'tel';
  maxLength?: number;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  invalid?: boolean;
  'aria-describedby'?: string;
  children?: ReactNode;
}

export interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  items: Array<{ value: string; label: string }>;
  'aria-label': string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  size?: 'default' | 'large';
  /** 选中后在框里显示的简短文字，例如只显示「+86」。 */
  display?: (value: string) => string;
  'aria-label': string;
  width?: number;
}

/** 开关：立即生效的二元切换。开还是关由页面传进来。 */
export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

/**
 * 导航菜单（后台侧栏）。选中哪一项、哪些子菜单展开、侧栏是否收起，都由页面传进来。
 * 收起时只显示一级项的图标，子菜单变成鼠标悬停弹出的弹层（弹层开没开归组件库管，不改 open）；
 * 没有子菜单的一级项，鼠标悬停时显示它的名字（文字提示，规格见控件规格的 tooltip 一组）。
 * 键盘：每个看得见的菜单项（含子菜单标题）都能用 Tab 聚焦，角色是 menuitem；
 * 回车、空格选中菜单项，或展开 / 收起子菜单。
 */
export interface NavMenuProps {
  items: NavItem[];
  selected: string;
  onSelect: (key: string) => void;
  open: string[];
  onOpenChange: (open: string[]) => void;
  collapsed?: boolean;
  'aria-label': string;
}

/** 面包屑：最后一项是当前页；能点的上级点了以后通知页面（onNavigate），由页面决定去哪。 */
export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (key: string) => void;
  'aria-label': string;
}

/**
 * 下拉菜单：点击触发按钮（children，由页面画）打开；选了一项通知页面（onSelect）并收起。
 * 键盘：在触发按钮上按回车、空格打开，焦点进到第一项；↑ ↓ 移动；回车选中；Esc 收起，焦点回到触发按钮。
 */
export interface DropdownProps {
  items: DropdownItem[];
  onSelect: (key: string) => void;
  children: ReactElement;
  'aria-label': string;
}

/** 头像：圆形，显示一两个字（名字的第一个字由页面给）。 */
export interface AvatarProps {
  text: string;
}

/** 徽标：数字标在 children 的右上角。读屏读不到它，数字要写进它所标注的按钮的名字里。 */
export interface BadgeProps {
  count: number;
  children: ReactNode;
}

/**
 * 表格。行、排序、勾选都由页面传进来；表格不分页、不自己排序（页面给的就是这一页、排好序的行），
 * 格子里画什么由 renderCell 决定。不做：固定列、虚拟滚动、展开行、拖拽、树形表格。
 * - 勾选：给了 selected 才有勾选列。selected 里可以有不在这一页的行；表头的复选框只管这一页
 *   （这一页全选了是勾、选了一部分是「部分选中」，点它把这一页全选 / 全不选，别的页不动）。
 * - 排序：点表头的排序按钮，按 nextSort 算出下一个排序交给 onSortChange（没排序 → 升序 → 降序 → 没排序）。
 * - 加载中：行还在、整个表格变浅，中间一个加载图标；鼠标、键盘都不能操作（表格设成 inert，Tab 跳过表格里的
 *   勾选框、排序按钮、开关、按钮）。
 * - 没有行：显示 empty（页面给：空状态或出错）。
 * 键盘：勾选框、排序按钮、格子里的按钮都在 Tab 顺序里；行和格子本身不在。排序按钮回车、空格切换排序；
 * 勾选框空格勾选。th 上写 aria-sort（ascending / descending）。勾选框的名字用 selectLabel、selectAllLabel。
 */
export interface TableProps {
  columns: TableColumn[];
  rows: TableRow[];
  renderCell: (row: TableRow, column: TableColumn) => ReactNode;
  selected?: string[];
  onSelectedChange?: (keys: string[]) => void;
  sort: TableSort | null;
  onSortChange: (sort: TableSort | null) => void;
  loading?: boolean;
  empty: ReactNode;
  selectLabel: (row: TableRow) => string;
  selectAllLabel: string;
  'aria-label': string;
}

/**
 * 分页：页码由页面传进来，点了以后通知页面（onChange）。「共 N 条」的文字由页面给（totalText）。
 * 键盘：每个页码和上一页、下一页都在 Tab 顺序里，回车、空格翻页，翻完焦点留在按下的那一项上；
 * 当前页 aria-current="page"；页码的名字用 pageLabel（「第 2 页」），上一页、下一页的名字用 prevLabel、nextLabel，
 * 到头了是禁用的。页数多时显示哪些页码、省略号能不能点，保留各组件库自己的做法（见 docs/取舍记录.md 第 10 条）。
 */
export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  totalText: (total: number) => string;
  pageLabel: (page: number) => string;
  prevLabel: string;
  nextLabel: string;
  'aria-label': string;
}

/** 状态标签：浅色底加同色系的字。 */
export interface TagProps {
  tone?: TagTone;
  children: ReactNode;
}

/**
 * 日期范围：起止日期（YYYY-MM-DD）由页面传进来，选好两天以后通知页面（onChange）；清空是 null。
 * 触发框和输入框一样（两个框 + 中间的分隔文字 + 右边的日历图标），点开是并排两个月的面板（聚焦不打开）。
 * 两个框能打字（YYYY-MM-DD），这是键盘选日期的路径：
 * - 回车：框里打过字，两个框都是合法日期就通知页面（开始比结束晚就对调），不合法就回到页面给的值，
 *   然后回车照常提交所在的表单（筛选栏就是「查询」，和别的框一样）；没打过字，打开 / 收起面板（不提交表单）；
 * - Tab 在两个框之间走，打的字留着；焦点离开整个日期范围时，没提交的字回到页面给的值；
 * - Esc：收起面板，没提交的字回到页面给的值，焦点留在框上。
 * 读屏：两个框都是 combobox（role=combobox、aria-haspopup="dialog"、aria-expanded 跟着面板），名字用 labels。
 */
export interface DateRangeProps {
  value: [string, string] | null;
  onChange: (value: [string, string] | null) => void;
  placeholder: [string, string];
  separator: string;
  /** 两个框的名字（读屏）：开始日期、结束日期。 */
  labels: [string, string];
  'aria-label': string;
}

/**
 * 对话框：开没开由页面传进来；用户按 Esc、点关闭按钮（右上角的叉）要关时通知页面（onClose），由页面决定关不关。
 * 打开后焦点进内容区第一个能聚焦的元素、锁在对话框里（Tab 不会跑到后面的页面）；
 * 对话框里还开着下拉这类弹层时，Esc 先收起弹层，再按一次才关对话框；关上以后焦点回到打开它的那个按钮。
 * 弹层（对话框本身、里面的下拉）都挂在作用域的挂载点里。
 */
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** 底部的按钮（页面给）。 */
  footer: ReactNode;
  closeLabel: string;
}

/** 单选（一组）：选中哪一个由页面传进来。键盘：Tab 进到选中的那一项，方向键换选中。 */
export interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  'aria-label': string;
}

/** 多行输入：和输入框一样，只是多行。 */
export interface TextareaProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  invalid?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export interface Kit {
  id: KitId;
  name: string;
  /**
   * tokens 为 null：组件库原生外观；
   * 有 tokens、aligned 为 false：只把取值交给组件库的主题变量；
   * 有 tokens、aligned 为 true（默认）：再按控件规格对齐到统一设计。
   */
  Provider: ComponentType<{
    tokens: ResolvedTokens | null;
    aligned?: boolean;
    children: ReactNode;
  }>;
  Button: ComponentType<ButtonProps>;
  Input: ComponentType<InputProps>;
  Checkbox: ComponentType<CheckboxProps>;
  Tabs: ComponentType<TabsProps>;
  Select: ComponentType<SelectProps>;
  Switch: ComponentType<SwitchProps>;
  NavMenu: ComponentType<NavMenuProps>;
  Breadcrumb: ComponentType<BreadcrumbProps>;
  Dropdown: ComponentType<DropdownProps>;
  Avatar: ComponentType<AvatarProps>;
  Badge: ComponentType<BadgeProps>;
  Table: ComponentType<TableProps>;
  Pagination: ComponentType<PaginationProps>;
  Tag: ComponentType<TagProps>;
  DateRange: ComponentType<DateRangeProps>;
  Dialog: ComponentType<DialogProps>;
  Radio: ComponentType<RadioGroupProps>;
  Textarea: ComponentType<TextareaProps>;
  /** 这个组件库默认和统一设计不一样的地方，以及套件是怎么对齐的（文档和演示页直接读它）。 */
  adaptations: Adaptation[];
  /** 这个组件库本身是怎么写的（文档介绍组件库时读它）。 */
  profile: LibraryProfile;
  /** 部件地图：用户看得见的每个部件在这个组件库里是哪个元素（自动检查读它）。 */
  parts: PartMap;
}
