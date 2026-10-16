import type { IconName } from './icons';

/**
 * 套件接口里几种控件的数据形状（React 和 Vue 共用）：页面只给数据，怎么画由套件交给组件库。
 * 文字由页面给好（已经是当前语言），控件不认识业务。
 */

/** 导航菜单的一项。有 children 的是子菜单（只支持两级）；一级项带图标，子菜单里的项不带。 */
export interface NavItem {
  key: string;
  label: string;
  icon?: IconName;
  children?: NavItem[];
}

/** 面包屑的一项。最后一项是当前页；link 为 true 的能点（回到那一页）。 */
export interface BreadcrumbItem {
  key: string;
  label: string;
  link?: boolean;
}

/** 下拉菜单的一项。 */
export interface DropdownItem {
  key: string;
  label: string;
  icon?: IconName;
  /** 危险操作（退出登录、删除）：红色。 */
  danger?: boolean;
  /** 在这一项上面画一条分隔线。 */
  divided?: boolean;
}

/** 徽标里显示的数字：超过 max 显示「max+」。 */
export const badgeText = (count: number, max = 99) => (count > max ? `${max}+` : String(count));

/**
 * 表格的一列。宽度是像素；没给宽度的列分剩下的宽度。
 * 格子里画什么由页面决定（React 的 renderCell、Vue 的 cell 插槽），表格只管排列、勾选、排序。
 */
export interface TableColumn {
  key: string;
  title: string;
  width?: number;
  /** 数字列靠右。 */
  align?: 'left' | 'right';
  /** 能排序：表头里有一个排序按钮。 */
  sortable?: boolean;
}

/** 表格的一行：key 是这一行的标识（勾选记的就是它），其余字段由页面决定。 */
export interface TableRow {
  key: string;
  [field: string]: unknown;
}

/** 排序：按哪一列、升序还是降序。没排序是 null。 */
export interface TableSort {
  key: string;
  order: 'asc' | 'desc';
}

/**
 * 点一次表头的排序按钮以后的排序：没排序（或按别的列排）→ 升序 → 降序 → 没排序。
 * 五个组件库默认的顺序不一样（TanStack 的数字列先降序），套件都按这里算。
 */
export function nextSort(sort: TableSort | null, key: string): TableSort | null {
  if (!sort || sort.key !== key) return { key, order: 'asc' };
  return sort.order === 'asc' ? { key, order: 'desc' } : null;
}

/** 状态标签的色调：默认（灰）、成功、提醒、危险。 */
export type TagTone = 'default' | 'success' | 'warning' | 'danger';
