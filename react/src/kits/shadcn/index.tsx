import { cva } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleIcon,
  Eye,
  EyeOff,
  Loader2,
  XIcon,
} from 'lucide-react';
import { DayPicker, type ChevronProps } from 'react-day-picker';
import { zhCN } from 'react-day-picker/locale';
import {
  Avatar as AvatarPrimitive,
  Checkbox as CheckboxPrimitive,
  Collapsible as CollapsiblePrimitive,
  Dialog as DialogPrimitive,
  DropdownMenu as DropdownMenuPrimitive,
  Popover as PopoverPrimitive,
  RadioGroup as RadioGroupPrimitive,
  Select as SelectPrimitive,
  Switch as SwitchPrimitive,
  Tabs as TabsPrimitive,
  Tooltip as TooltipPrimitive,
} from 'radix-ui';
import {
  Fragment,
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react';
import { twMerge } from 'tailwind-merge';
import {
  adapt,
  badgeText,
  iconSetOf,
  nextSort,
  swapsIcons,
  resolveControls,
  roleMapping,
  themeMappingValues,
  type ControlSpec,
  type NavItem,
  type ResolvedTokens,
  type TableColumn,
  type TableRow,
} from '@mihua/spec';
import { useIconSet, useLocale, usePortal } from '../../context';
import { Icon } from '../../icon';
import { PasswordToggle } from '../../kit/PasswordToggle';
import type { Kit } from '../../kit/types';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/**
 * 语义 token → shadcn/ui 的 CSS 变量。
 * shadcn 的组件源码就在你自己的项目里，所以高度和圆角也能直接接 token（--kit-h、--kit-radius）；
 * 原生模式不设这些变量，组件回落到 shadcn 自己的默认值。
 */
export function shadcnRoleMappings(t: ResolvedTokens) {
  return {
    '--primary': roleMapping(t, 'action.primary', '主按钮底色；悬停时由控件叠加透明度。'),
    '--ring': roleMapping(t, 'action.primary', '同一主操作角色也供键盘焦点轮廓使用。'),
    '--kit-radius': roleMapping(t, 'radius.control', '供按钮、输入框与选择器的圆角类读取。'),
  };
}

export function shadcnVariables(t: ResolvedTokens): Record<string, string> {
  return {
    '--background': t['surface.base'],
    '--foreground': t['text.body'],
    ...themeMappingValues(shadcnRoleMappings(t)),
    '--primary-foreground': t['action.onPrimary'],
    '--muted': t['surface.subtle'],
    '--muted-foreground': t['text.secondary'],
    '--accent': t['surface.hover'],
    '--accent-foreground': t['text.strong'],
    '--border': t['border.default'],
    '--input': t['border.control'],
    '--destructive': t['feedback.danger'],
    '--kit-h': t['size.control'],
    '--kit-h-lg': t['size.controlLarge'],
    // 侧栏（导航菜单）有自己的一组颜色：悬停、选中都用 sidebar-accent
    '--sidebar-foreground': t['text.body'],
    '--sidebar-accent': t['surface.hover'],
    '--sidebar-accent-foreground': t['text.strong'],
    '--sidebar-border': t['border.default'],
    '--sidebar-ring': t['action.primary'],
    '--popover': t['surface.base'],
    '--popover-foreground': t['text.body'],
  };
}

/**
 * 接上规范时为 true：控件对齐到统一设计（下划线标签栏、16px 复选框、12px 文字内边距……）；
 * 原生模式为 false，保留 shadcn 自己的样子（比如分段式的胶囊标签栏）。
 * shadcn 的源码在我们手里，所以直接换类名，不需要覆盖样式。
 */
const AlignedContext = createContext<ControlSpec | null>(null);
const useAligned = () => useContext(AlignedContext) !== null;
const useControls = () => useContext(AlignedContext);

const radius = 'rounded-[var(--kit-radius,calc(var(--radius)-2px))]';
const focusRing = 'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40';
const height = { default: 'h-[var(--kit-h,2.25rem)]', large: 'h-[var(--kit-h-lg,2.5rem)]' };

const button = cva(
  cn(
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[color,background-color,box-shadow] disabled:pointer-events-none disabled:opacity-50',
    radius,
    focusRing,
  ),
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/85',
        secondary: 'border border-input bg-background text-foreground shadow-xs hover:bg-accent',
        text: 'text-foreground hover:bg-accent',
        link: 'h-auto px-0 text-primary underline-offset-4 hover:underline',
      },
      size: { default: cn(height.default, 'px-4'), large: cn(height.large, 'px-6 text-[15px]') },
    },
  },
);
/**
 * 接上规范时追加的类名：全部读控件规格的 CSS 变量（--mh-c-*，见 @mihua/spec 的 controls.ts），
 * 这里只决定「shadcn 的哪一处对应控件规格的哪一项」。用 tailwind-merge 能识别的写法，盖掉默认类名。
 */
const ALIGNED = {
  button:
    'shadow-none gap-(--mh-c-button-icon-gap) font-(--mh-c-button-weight) text-(length:--mh-c-text-size)',
  // 按钮都带 1px 边框（主按钮的是透明的），文字离外边框取控件规格的两档：
  // shadcn 默认 px-4 / px-6，主按钮没有边框、次要按钮有，两种按钮差 2px 宽
  frame: 'border border-transparent',
  inset: 'px-[calc(var(--mh-c-button-inset)-1px)]',
  insetLarge: 'px-[calc(var(--mh-c-button-inset-large)-1px)]',
  primary: 'hover:bg-(--mh-action-primary-hover)',
  secondary:
    'border-(--mh-c-button-secondary-border) bg-(--mh-c-button-secondary-background) text-(--mh-c-button-secondary-color) hover:bg-(--mh-c-button-secondary-hover-background) hover:text-(--mh-c-button-secondary-hover-color)',
  link: 'leading-(--mh-c-text-line) font-(--mh-c-link-weight) text-(--mh-c-link-color) hover:text-(--mh-c-link-hover-color) hover:no-underline',
  field:
    'shadow-none border-(--mh-c-field-border) bg-(--mh-c-field-background) focus-within:border-(--mh-c-field-border-focus) focus-within:ring-(length:--mh-c-focus-ring) focus-within:ring-(--mh-c-focus-ring-color)',
  fieldText:
    'px-[calc(var(--mh-c-field-inset)-1px)] text-(length:--mh-c-text-size) placeholder:text-(--mh-text-placeholder)',
  selectTrigger:
    'shadow-none border-(--mh-c-field-border) bg-(--mh-c-field-background) px-[calc(var(--mh-c-field-inset)-1px)] text-(length:--mh-c-text-size) leading-(--mh-c-text-line) focus-visible:border-(--mh-c-field-border-focus) focus-visible:ring-(length:--mh-c-focus-ring) focus-visible:ring-(--mh-c-focus-ring-color) data-[state=open]:border-(--mh-c-field-border-focus) data-[state=open]:ring-(length:--mh-c-focus-ring) data-[state=open]:ring-(--mh-c-focus-ring-color) [&[data-state=open]_svg]:rotate-180 [&_svg]:transition-transform',
  popup:
    'min-w-(--radix-select-trigger-width) rounded-(--mh-c-popup-radius) border-(--mh-c-popup-border) bg-(--mh-c-field-background) shadow-(--mh-c-popup-shadow)',
  popupViewport: 'p-(--mh-c-popup-padding)',
  option:
    'h-(--mh-c-popup-option-height) rounded-(--mh-c-popup-option-radius) px-(--mh-c-popup-option-inset) py-0 text-(length:--mh-c-text-size) text-(--mh-c-popup-option-color) data-[highlighted]:bg-(--mh-c-popup-hover-background) data-[state=checked]:bg-(--mh-c-popup-selected-background) data-[state=checked]:font-(--mh-c-popup-selected-weight) data-[state=checked]:text-(--mh-c-popup-selected-color)',
  checkboxLabel:
    'gap-(--mh-c-checkbox-gap) text-(length:--mh-c-text-size) leading-(--mh-c-text-line)',
  checkbox:
    'focus-visible:ring-(length:--mh-c-focus-ring) focus-visible:ring-(--mh-c-focus-ring-color) shadow-none size-(--mh-c-checkbox-size) rounded-(--mh-c-checkbox-radius) border-(--mh-c-checkbox-border) data-[state=checked]:border-(--mh-c-checkbox-checked) data-[state=checked]:bg-(--mh-c-checkbox-checked) data-[state=checked]:text-(--mh-c-checkbox-mark) aria-invalid:border-(--mh-c-checkbox-border-invalid)',
  // 开关：shadcn 默认 32×18.4（h-[1.15rem] w-8）、圆点 16，关是 --input 色
  switch:
    'h-(--mh-c-switch-height) w-(--mh-c-switch-width) border-0 px-(--mh-c-switch-thumb-inset) shadow-none data-[state=checked]:bg-(--mh-c-switch-on-background) data-[state=unchecked]:bg-(--mh-c-switch-off-background) disabled:opacity-(--mh-c-switch-disabled-opacity) focus-visible:ring-(length:--mh-c-focus-ring) focus-visible:ring-(--mh-c-focus-ring-color)',
  switchThumb:
    'size-(--mh-c-switch-thumb) bg-(--mh-c-switch-thumb-color) shadow-(--mh-c-switch-thumb-shadow) data-[state=checked]:translate-x-[calc(var(--mh-c-switch-width)_-_var(--mh-c-switch-thumb)_-_2*var(--mh-c-switch-thumb-inset))]',
  tabsList:
    'flex h-(--mh-c-tabs-height) w-full items-stretch gap-(--mh-c-tabs-gap) border-b border-(--mh-c-tabs-divider)',
  tab: 'relative -mb-px inline-flex items-center text-(length:--mh-c-text-size) leading-(--mh-c-text-line) font-(--mh-c-tabs-weight) text-(--mh-c-tabs-color) transition-colors hover:text-(--mh-c-tabs-hover-color) data-[state=active]:font-(--mh-c-tabs-active-weight) data-[state=active]:text-(--mh-c-tabs-active-color) after:absolute after:inset-x-0 after:bottom-0 after:h-(--mh-c-tabs-indicator) after:bg-transparent data-[state=active]:after:bg-(--mh-c-tabs-active-color)',
  // 导航菜单：shadcn 的侧栏菜单默认 32px 高的项、间隔 4px、选中只是浅灰底加粗，子菜单左边一条竖线
  navMenu: 'gap-(--mh-c-nav-item-gap) p-(--mh-c-nav-padding)',
  navItem:
    'h-(--mh-c-nav-item-height) gap-(--mh-c-nav-icon-gap) rounded-(--mh-c-nav-radius) py-0 pr-(--mh-c-nav-arrow-inset) pl-(--mh-c-nav-item-inset) text-(length:--mh-c-text-size) leading-(--mh-c-text-line) font-(--mh-c-nav-weight) text-(--mh-c-nav-color) hover:bg-(--mh-c-nav-hover-background) hover:text-(--mh-c-nav-hover-color) active:bg-(--mh-c-nav-hover-background) active:text-(--mh-c-nav-hover-color) focus-visible:ring-(length:--mh-c-focus-ring) focus-visible:ring-(--mh-c-focus-ring-color) [&>svg]:size-(--mh-c-nav-icon-size) [&>svg]:text-(--mh-c-nav-icon-color)',
  navSubItem: 'pl-(--mh-c-nav-sub-inset)',
  navSelected:
    'bg-(--mh-c-nav-selected-background) font-(--mh-c-nav-selected-weight) text-(--mh-c-nav-selected-color) hover:bg-(--mh-c-nav-selected-background) hover:text-(--mh-c-nav-selected-color) [&>svg]:text-(--mh-c-nav-selected-color)',
  navParentSelected:
    'text-(--mh-c-nav-parent-selected-color) [&>svg:first-child]:text-(--mh-c-nav-parent-selected-color)',
  navCollapsed: 'justify-center px-0',
  navArrow:
    'ml-auto size-(--mh-c-icon-size) text-(--mh-c-icon-color) transition-transform group-data-[state=open]/collapsible:rotate-180',
  navSub: 'mx-0 translate-x-0 gap-(--mh-c-nav-item-gap) border-l-0 p-0 pt-(--mh-c-nav-item-gap)',
  // 收起后的子菜单弹层：外框和选项取下拉（popup）一组
  flyout:
    'min-w-(--mh-c-nav-popup-min-width) rounded-(--mh-c-popup-radius) border-(--mh-c-popup-border) bg-(--mh-c-field-background) p-(--mh-c-popup-padding) shadow-(--mh-c-popup-shadow)',
  flyoutItem:
    'h-(--mh-c-popup-option-height) shrink-0 rounded-(--mh-c-popup-option-radius) px-(--mh-c-popup-option-inset) py-0 text-(length:--mh-c-text-size) leading-(--mh-c-text-line) text-(--mh-c-popup-option-color) hover:bg-(--mh-c-popup-hover-background) hover:text-(--mh-c-popup-option-color) focus-visible:bg-(--mh-c-popup-hover-background) aria-[current=page]:bg-(--mh-c-popup-selected-background) aria-[current=page]:font-(--mh-c-popup-selected-weight) aria-[current=page]:text-(--mh-c-popup-selected-color)',
  // 面包屑：shadcn 默认用 ChevronRight 隔开、间距 6px（宽屏 10px）
  breadcrumbList:
    'gap-(--mh-c-breadcrumb-separator-gap) sm:gap-(--mh-c-breadcrumb-separator-gap) text-(length:--mh-c-text-size) leading-(--mh-c-text-line) text-(--mh-c-breadcrumb-color)',
  breadcrumbLink:
    'rounded-(--mh-c-breadcrumb-radius) outline-none hover:text-(--mh-c-breadcrumb-hover-color) focus-visible:ring-(length:--mh-c-focus-ring) focus-visible:ring-(--mh-c-focus-ring-color)',
  breadcrumbPage: 'font-(--mh-c-breadcrumb-current-weight) text-(--mh-c-breadcrumb-current-color)',
  breadcrumbSeparator: 'text-(--mh-c-breadcrumb-separator-color)',
  // 下拉菜单：外框和选项高度取 popup 一组
  dropdown:
    'min-w-(--mh-c-dropdown-min-width) rounded-(--mh-c-popup-radius) border-(--mh-c-popup-border) bg-(--mh-c-field-background) p-(--mh-c-popup-padding) shadow-(--mh-c-popup-shadow)',
  dropdownItem:
    'h-(--mh-c-popup-option-height) gap-(--mh-c-dropdown-icon-gap) rounded-(--mh-c-popup-option-radius) px-(--mh-c-popup-option-inset) py-0 text-(length:--mh-c-text-size) leading-(--mh-c-text-line) text-(--mh-c-dropdown-color) focus:bg-(--mh-c-popup-hover-background) focus:text-(--mh-c-dropdown-color) [&_svg]:size-(--mh-c-icon-size) [&_svg:not([class*=text-])]:text-(--mh-c-dropdown-icon-color) data-[variant=destructive]:text-(--mh-c-dropdown-danger-color) data-[variant=destructive]:focus:bg-(--mh-c-popup-hover-background) data-[variant=destructive]:focus:text-(--mh-c-dropdown-danger-color) data-[variant=destructive]:[&_svg]:text-(--mh-c-dropdown-danger-color)!',
  // 文字提示：shadcn 默认是深色底（foreground）、12px、px-3 py-1.5、圆角 8，带一个小箭头
  tooltip:
    'rounded-(--mh-c-tooltip-radius) bg-(--mh-c-tooltip-background) px-(--mh-c-tooltip-inset-x) py-(--mh-c-tooltip-inset-y) text-(length:--mh-c-tooltip-font-size) leading-(--mh-c-tooltip-line) font-normal text-(--mh-c-tooltip-color)',
  dropdownSeparator:
    '-mx-(--mh-c-popup-padding) my-(--mh-c-popup-padding) bg-(--mh-c-dropdown-divider)',
  avatar:
    'size-(--mh-c-avatar-size) bg-(--mh-c-avatar-background) text-(length:--mh-c-avatar-font-size) font-(--mh-c-avatar-weight) text-(--mh-c-avatar-color)',
  // 徽标：shadcn 的 Badge 是标签样式（圆角矩形、22px 高、px-2），没有「标在右上角的数字」
  badge:
    'h-(--mh-c-badge-height) min-w-(--mh-c-badge-min-width) rounded-full border-0 px-(--mh-c-badge-inset) py-0 text-(length:--mh-c-badge-font-size) leading-(--mh-c-badge-height) font-(--mh-c-badge-weight) bg-(--mh-c-badge-background) text-(--mh-c-badge-color)',
  // 复选框「部分选中」（表头）：和选中一样是主色底，里面是短横
  checkboxIndeterminate:
    'disabled:cursor-not-allowed disabled:bg-(--mh-c-checkbox-disabled-background) data-[state=indeterminate]:border-(--mh-c-checkbox-checked) data-[state=indeterminate]:bg-(--mh-c-checkbox-checked) data-[state=indeterminate]:text-(--mh-c-checkbox-mark)',
  // 表格：shadcn 的 table.tsx 默认表头 40 高、格子 p-2、字 14 加粗，分隔线画在行（tr）上、最后一行不画
  table:
    'table-fixed border-separate border-spacing-0 text-(length:--mh-c-text-size) leading-(--mh-c-text-line) text-(--mh-c-table-color)',
  tableHead:
    'h-(--mh-c-table-head-height) border-b border-(--mh-c-table-divider) bg-(--mh-c-table-head-background) px-(--mh-c-table-cell-inset) py-0 text-(length:--mh-c-table-head-size) font-(--mh-c-table-head-weight) text-(--mh-c-table-head-color)',
  tableCell:
    'h-(--mh-c-table-row-height) border-b border-(--mh-c-table-divider) px-(--mh-c-table-cell-inset) py-0 transition-colors group-hover/row:bg-(--mh-c-table-hover-background) [&>[role=switch]]:align-middle group-data-[state=selected]/row:bg-(--mh-c-table-selected-background) group-last/row:border-b-0',
  tableSelection: 'w-(--mh-c-table-selection-width) px-0',
  tableSort:
    'h-auto gap-(--mh-c-table-sort-gap) rounded-(--mh-c-table-sort-radius) p-0 font-[inherit] text-[length:inherit] leading-(--mh-c-text-line) text-[color:inherit] hover:bg-transparent hover:text-[color:inherit] focus-visible:ring-(length:--mh-c-focus-ring) focus-visible:ring-(--mh-c-focus-ring-color) [&>svg]:size-(--mh-c-icon-size) [&>svg]:text-(--mh-c-table-sort-color) [&>svg[data-sorted]]:text-(--mh-c-table-sort-active-color)',
  tableLoading: 'opacity-(--mh-c-table-loading-opacity)',
  tableSpinner: 'size-(--mh-c-table-loading-icon) text-(--mh-c-table-loading-color)',
  // 分页：shadcn 的 pagination.tsx 默认 36 的方块（当前页描边）、上一页下一页带文字
  pagination: 'mx-0 w-auto items-center justify-end gap-(--mh-c-pagination-total-gap)',
  paginationTotal: 'text-(length:--mh-c-text-size) text-(--mh-c-pagination-total-color)',
  paginationList: 'gap-(--mh-c-pagination-gap)',
  pageItem:
    'h-(--mh-c-pagination-item-size) w-auto min-w-(--mh-c-pagination-item-size) gap-0 rounded-(--mh-c-pagination-radius) border border-transparent bg-transparent px-(--mh-c-pagination-item-inset) text-(length:--mh-c-text-size) font-normal text-(--mh-c-pagination-color) shadow-none hover:bg-(--mh-c-pagination-hover-background) hover:text-(--mh-c-pagination-color) disabled:bg-transparent disabled:text-(--mh-c-pagination-disabled-color) disabled:opacity-100 aria-[current=page]:border-(--mh-c-pagination-active-border) aria-[current=page]:bg-(--mh-c-pagination-active-background) aria-[current=page]:font-(--mh-c-pagination-active-weight) aria-[current=page]:text-(--mh-c-pagination-active-color) focus-visible:ring-(length:--mh-c-focus-ring) focus-visible:ring-(--mh-c-focus-ring-color) [&>svg]:size-(--mh-c-icon-size)',
  // 标签：shadcn 的 Badge 默认 22 高（py-0.5）、圆角 6、12px、带 1px 描边，没有成功、提醒两种颜色
  tag: 'h-(--mh-c-tag-height) rounded-(--mh-c-tag-radius) border-0 px-(--mh-c-tag-inset) py-0 text-(length:--mh-c-tag-font-size) leading-(--mh-c-tag-height) font-(--mh-c-tag-weight)',
  // 日期范围的触发框：和输入框同一组（field），里面两个只读的框
  dateRange:
    'h-(--kit-h) gap-0 border-(--mh-c-field-border) bg-(--mh-c-field-background) px-[calc(var(--mh-c-field-inset)-1px)] shadow-none text-(length:--mh-c-text-size) focus-within:border-(--mh-c-field-border-focus) focus-within:ring-(length:--mh-c-focus-ring) focus-within:ring-(--mh-c-focus-ring-color) data-[state=open]:border-(--mh-c-field-border-focus) data-[state=open]:ring-(length:--mh-c-focus-ring) data-[state=open]:ring-(--mh-c-focus-ring-color)',
  dateSeparator: 'px-(--mh-c-date-range-separator-gap) text-(--mh-c-date-range-separator-color)',
  dateIcon:
    'ml-(--mh-c-date-range-icon-gap) size-(--mh-c-icon-size) shrink-0 text-(--mh-c-icon-color)',
  datePopup:
    'rounded-(--mh-c-popup-radius) border-(--mh-c-popup-border) bg-(--mh-c-field-background) p-(--mh-c-date-panel-padding) shadow-(--mh-c-popup-shadow)',
  // 对话框：shadcn 默认 512 宽、24 的留白、圆角 10、1px 描边、元素之间 16；关闭按钮在最后、70% 不透明
  dialog:
    'block w-(--mh-c-dialog-width) max-w-none rounded-(--mh-c-dialog-radius) border-0 bg-(--mh-c-dialog-background) p-(--mh-c-dialog-padding) shadow-(--mh-c-dialog-shadow) sm:max-w-none',
  dialogOverlay: 'bg-(--mh-c-dialog-mask)',
  dialogTitle:
    'pr-(--mh-c-dialog-close-size) text-(length:--mh-c-dialog-title-size) leading-(--mh-c-dialog-title-line) font-(--mh-c-dialog-title-weight) text-(--mh-c-dialog-title-color)',
  dialogClose:
    'top-(--mh-c-dialog-close-inset) right-(--mh-c-dialog-close-inset) grid size-(--mh-c-dialog-close-size) place-items-center rounded-(--mh-c-popup-option-radius) text-(--mh-c-dialog-close-color) opacity-100 hover:bg-(--mh-c-dialog-close-hover-background) focus:ring-0 focus:ring-offset-0 focus-visible:ring-(length:--mh-c-focus-ring) focus-visible:ring-(--mh-c-focus-ring-color) [&_svg]:size-(--mh-c-icon-size)',
  dialogBody: 'mt-(--mh-c-dialog-header-gap)',
  dialogFooter: 'mt-(--mh-c-dialog-footer-gap)',
  // 单选：shadcn 默认竖着排、隔 12，选中是白底里一个主色小圆点
  radioGroup: 'flex gap-(--mh-c-radio-option-gap)',
  radioLabel: 'gap-(--mh-c-radio-gap) text-(length:--mh-c-text-size) leading-(--mh-c-text-line)',
  radio:
    'size-(--mh-c-radio-size) border-(--mh-c-radio-border) bg-(--mh-c-field-background) shadow-none data-[state=checked]:border-(--mh-c-radio-checked) data-[state=checked]:bg-(--mh-c-radio-checked) focus-visible:ring-(length:--mh-c-focus-ring) focus-visible:ring-(--mh-c-focus-ring-color)',
  radioDot: 'size-(--mh-c-radio-dot) rounded-full bg-(--mh-c-radio-dot-color)',
  // 多行输入：shadcn 默认跟着内容长高（field-sizing: content）、最少 64 高、上下 8
  textarea:
    'field-sizing-fixed min-h-0 resize-y border-(--mh-c-field-border) bg-(--mh-c-field-background) px-[calc(var(--mh-c-field-inset)-1px)] py-[calc(var(--mh-c-textarea-inset-block)-1px)] text-(length:--mh-c-text-size) leading-(--mh-c-text-line) shadow-none placeholder:text-(--mh-text-placeholder) focus-visible:border-(--mh-c-field-border-focus) focus-visible:ring-(length:--mh-c-focus-ring) focus-visible:ring-(--mh-c-focus-ring-color) aria-invalid:border-(--mh-c-field-border-invalid)',
  tagTone: {
    default: 'bg-(--mh-c-tag-background) text-(--mh-c-tag-color)',
    success: 'bg-(--mh-c-tag-success-background) text-(--mh-c-tag-success-color)',
    warning: 'bg-(--mh-c-tag-warning-background) text-(--mh-c-tag-warning-color)',
    danger: 'bg-(--mh-c-tag-danger-background) text-(--mh-c-tag-danger-color)',
  },
};

/**
 * 侧栏收起后，没有子菜单的一级项悬停显示名字：照 shadcn 侧栏的做法（SidebarMenuButton 的 tooltip，
 * Radix Tooltip、放在右边、上下居中）。接上规范时不画小箭头，位置和收起后的子菜单弹层一样离侧栏右边缘 popup.offset。
 */
function NavTooltip({ label, children }: { label: string; children: ReactElement }) {
  const portal = usePortal();
  const aligned = useAligned();
  const controls = useControls();
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal container={portal}>
        <TooltipPrimitive.Content
          data-slot="tooltip-content"
          side="right"
          align="center"
          sideOffset={controls ? controls.nav.padding + 1 + controls.popup.offset : 0}
          className={cn(
            'z-50 w-fit rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background',
            aligned && ALIGNED.tooltip,
          )}
        >
          {label}
          {!aligned && (
            <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
          )}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/**
 * 表格里的复选框（勾选列）：和套件的 Checkbox 同一个 Radix 原语、同一组类名，多一个「部分选中」。
 * shadcn 的 checkbox.tsx 没给部分选中画样子（数据表格示例里表头的勾选框部分选中时是白底加对勾），
 * 原生那一档照样保留。
 */
function TableCheckbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean | 'indeterminate';
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  const aligned = useAligned();
  const choice = useIconSet();
  const swap = aligned && swapsIcons(choice);
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      checked={checked}
      onCheckedChange={(next) => onChange(next === true)}
      aria-label={label}
      disabled={disabled}
      className={cn(
        'grid size-4 shrink-0 place-items-center rounded-[4px] border border-input bg-background shadow-xs data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        focusRing,
        aligned && ALIGNED.checkbox,
        aligned && ALIGNED.checkboxIndeterminate,
      )}
    >
      <CheckboxPrimitive.Indicator className="grid place-items-center">
        {swap ? (
          <Icon
            name={checked === 'indeterminate' ? 'minus' : 'check'}
            strokeWidth={iconSetOf(choice).strokeWidth * 1.5}
            className="size-(--mh-c-icon-check) text-(--mh-c-checkbox-mark)"
          />
        ) : (
          <Check className="size-3.5" strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

/** 日期和「YYYY-MM-DD」互换（按本地时间，不经过时区）。 */
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dateOf = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
};

/** 打的字是不是一个真实存在的日期（YYYY-MM-DD）。 */
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && ymd(dateOf(s)) === s;

/** 日期面板翻月份的箭头：对齐时用图标集里的，原生用 shadcn 的 lucide。 */
function CalendarChevron({ orientation }: ChevronProps) {
  const aligned = useAligned();
  const choice = useIconSet();
  if (aligned && swapsIcons(choice))
    return <Icon name={orientation === 'left' ? 'chevron-left' : 'chevron-right'} />;
  return orientation === 'left' ? (
    <ChevronLeft className="size-4" />
  ) : (
    <ChevronRight className="size-4" />
  );
}

/** shadcn 的 calendar.tsx 给 react-day-picker 的类名（原生那一档），精简到用到的几项。 */
const DAY_PICKER_NATIVE = {
  root: 'p-3',
  months: 'relative flex flex-col gap-4 md:flex-row',
  month: 'flex w-full flex-col gap-4',
  nav: 'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
  button_previous: 'inline-flex size-8 items-center justify-center rounded-md hover:bg-accent',
  button_next: 'inline-flex size-8 items-center justify-center rounded-md hover:bg-accent',
  month_caption: 'flex h-8 w-full items-center justify-center px-8 text-sm font-medium',
  month_grid: 'w-full border-collapse',
  weekdays: 'flex',
  weekday: 'flex-1 rounded-md text-[0.8rem] font-normal text-muted-foreground select-none',
  week: 'mt-2 flex w-full',
  day: 'relative aspect-square h-full w-full p-0 text-center select-none [&>button]:size-8 [&>button]:rounded-md [&>button]:text-sm [&>button]:font-normal [&>button:hover]:bg-accent',
  range_start: 'rounded-l-md bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground',
  range_middle: 'rounded-none [&>button]:bg-accent [&>button]:rounded-none',
  range_end: 'rounded-r-md bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground',
  today: '[&>button]:bg-accent [&>button]:text-accent-foreground',
  outside: '[&>button]:text-muted-foreground',
};

/**
 * 对齐时的类名：两个月之间 monthGap；标题一行 headerHeight（箭头 navSize 的方块在两头）；一行星期 weekHeight；
 * 每天一个 cellSize 的方块、紧挨着，范围里的日子浅底连成一条，开始、结束那天主色底带圆角，今天 1px 主色描边。
 */
const DAY_PICKER_ALIGNED = {
  root: '',
  months: 'relative flex gap-(--mh-c-date-panel-month-gap)',
  month: 'flex flex-col',
  nav: 'absolute inset-x-0 top-0 flex h-(--mh-c-date-panel-header-height) items-center justify-between',
  button_previous:
    'grid size-(--mh-c-date-panel-nav-size) place-items-center rounded-(--mh-c-popup-option-radius) text-(--mh-c-icon-color) hover:bg-(--mh-c-date-panel-hover-background) [&_svg]:size-(--mh-c-icon-size)',
  button_next:
    'grid size-(--mh-c-date-panel-nav-size) place-items-center rounded-(--mh-c-popup-option-radius) text-(--mh-c-icon-color) hover:bg-(--mh-c-date-panel-hover-background) [&_svg]:size-(--mh-c-icon-size)',
  month_caption:
    'flex h-(--mh-c-date-panel-header-height) items-center justify-center text-(length:--mh-c-text-size) font-(--mh-c-date-panel-title-weight) text-(--mh-c-date-panel-title-color)',
  month_grid: 'border-collapse',
  weekdays: 'flex',
  weekday:
    'grid h-(--mh-c-date-panel-week-height) w-(--mh-c-date-panel-cell-size) place-items-center p-0 text-(length:--mh-c-date-panel-week-size) font-normal text-(--mh-c-date-panel-week-color)',
  week: 'flex',
  day: 'p-0 [&>button]:size-(--mh-c-date-panel-cell-size) [&>button]:rounded-(--mh-c-date-panel-cell-radius) [&>button]:text-(length:--mh-c-text-size) [&>button]:text-(--mh-c-date-panel-color) [&>button:hover]:bg-(--mh-c-date-panel-hover-background)',
  range_start:
    '[&>button]:bg-(--mh-c-date-panel-selected-background)! [&>button]:text-(--mh-c-date-panel-selected-color)!',
  range_end:
    '[&>button]:bg-(--mh-c-date-panel-selected-background)! [&>button]:text-(--mh-c-date-panel-selected-color)!',
  range_middle: '[&>button]:rounded-none! [&>button]:bg-(--mh-c-date-panel-range-background)!',
  today: '[&>button]:border [&>button]:border-(--mh-c-date-panel-today-border)',
  outside: '[&>button]:text-(--mh-c-date-panel-outside-color)',
};

/** 分页显示哪些页码：不超过 7 页全显示，多了中间用「…」（null）。 */
function pageList(page: number, count: number): Array<number | null> {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const near = [page - 1, page, page + 1].filter((p) => p > 1 && p < count);
  return [
    1,
    ...(near[0]! > 2 ? [null] : []),
    ...near,
    ...(near.at(-1)! < count - 1 ? [null] : []),
    count,
  ];
}

/** 收起后的子菜单：鼠标停在图标上多久打开、离开多久关上（毫秒）。 */
const FLYOUT_OPEN_DELAY = 100;
const FLYOUT_CLOSE_DELAY = 150;

/**
 * 侧栏收起后的子菜单弹层。shadcn 的侧栏收起成图标以后不显示子菜单（只给一个文字提示），
 * 没有「悬停弹出子菜单」，套件用 Radix 的 Popover 拼：鼠标悬停打开、移开关上；点击、回车、空格也能打开，
 * Esc 关上。不用 DropdownMenu：它一打开就把焦点抢进菜单，鼠标只是路过也会把别处的焦点拿走。
 */
function NavFlyout({
  item,
  selected,
  onSelect,
  trigger,
}: {
  item: NavItem;
  selected: string;
  onSelect: (key: string) => void;
  trigger: ReactElement;
}) {
  const portal = usePortal();
  const aligned = useAligned();
  const controls = useControls();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const byHover = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  const later = (next: boolean, delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      byHover.current = true;
      setOpen(next);
    }, delay);
  };
  const hover = {
    onPointerEnter: () => later(true, FLYOUT_OPEN_DELAY),
    onPointerLeave: () => later(false, FLYOUT_CLOSE_DELAY),
  };
  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        clearTimeout(timer.current);
        byHover.current = false;
        setOpen(next);
      }}
    >
      <PopoverPrimitive.Trigger
        asChild
        {...hover}
        // 悬停已经打开了，再点不要把它关上
        onClick={(event) => open && byHover.current && event.preventDefault()}
      >
        {trigger}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={portal}>
        <PopoverPrimitive.Content
          role="menu"
          aria-label={item.label}
          data-slot="nav-flyout"
          side="right"
          align="start"
          // 左边离侧栏右边缘 popup.offset：菜单项右边到侧栏右边缘还隔着菜单的留白和 1px 分隔线
          sideOffset={controls ? controls.nav.padding + 1 + controls.popup.offset : 4}
          // 悬停打开时不抢焦点；用键盘打开时焦点进到弹层里
          onOpenAutoFocus={(event) => byHover.current && event.preventDefault()}
          onCloseAutoFocus={(event) => byHover.current && event.preventDefault()}
          {...hover}
          className={cn(
            'z-50 flex min-w-[8rem] flex-col overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md',
            aligned && ALIGNED.flyout,
          )}
        >
          {item.children!.map((child) => (
            <button
              key={child.key}
              type="button"
              role="menuitem"
              data-slot="nav-item"
              aria-current={child.key === selected ? 'page' : undefined}
              onClick={() => {
                onSelect(child.key);
                setOpen(false);
              }}
              className={cn(
                'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent aria-[current=page]:font-medium',
                aligned && ALIGNED.flyoutItem,
              )}
            >
              {child.label}
            </button>
          ))}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export const shadcnKit: Kit = {
  id: 'shadcn',
  name: 'shadcn/ui',
  Provider: ({ tokens, aligned = true, children }) => (
    <AlignedContext.Provider value={tokens && aligned ? resolveControls(tokens) : null}>
      <div
        className="mh-kit-shadcn text-foreground"
        style={tokens ? (shadcnVariables(tokens) as CSSProperties) : undefined}
      >
        {children}
      </div>
    </AlignedContext.Provider>
  ),
  Button: function ShadcnButton({
    variant,
    size = 'default',
    block,
    loading,
    disabled,
    type = 'button',
    icon,
    onClick,
    children,
    ...aria
  }) {
    const aligned = useAligned();
    const iconChoice = useIconSet(); // Hook 每次渲染都要调用，不能写在 && 后面
    const swap = aligned && swapsIcons(iconChoice);
    return (
      <button
        type={type}
        data-slot="button"
        data-variant={variant}
        className={cn(
          button({ variant, size: variant === 'link' ? undefined : size }),
          aligned && ALIGNED.button,
          aligned && variant !== 'link' && ALIGNED.frame,
          aligned && variant !== 'link' && (size === 'large' ? ALIGNED.insetLarge : ALIGNED.inset),
          aligned && variant === 'primary' && ALIGNED.primary,
          aligned && variant === 'secondary' && ALIGNED.secondary,
          aligned && variant === 'link' && ALIGNED.link,
          // 加载中的按钮按控件规格降低不透明度（shadcn 默认和禁用一样降到 50%）
          aligned && loading && 'disabled:opacity-(--mh-c-button-loading-opacity)',
          block && 'w-full',
        )}
        disabled={disabled || loading}
        onClick={onClick}
        {...aria}
      >
        {loading ? (
          swap ? (
            // 加载图标用规范图标集里的那一个，大小取控件规格
            <Icon name="loading" spin className="mh-btn-spinner" />
          ) : (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          )
        ) : (
          icon
        )}
        {children}
      </button>
    );
  },
  Input: function ShadcnInput({
    type = 'text',
    value,
    onChange,
    size = 'default',
    invalid,
    suffix,
    ...rest
  }) {
    const [visible, setVisible] = useState(false);
    const locale = useLocale();
    const aligned = useAligned();
    const iconChoice = useIconSet();
    const password = type === 'password';
    return (
      <div
        data-slot="input"
        className={cn(
          'flex w-full min-w-0 items-center border border-input bg-background shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25',
          aligned && ALIGNED.field,
          radius,
          height[size],
          invalid &&
            'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
        )}
      >
        <input
          {...rest}
          type={password && visible ? 'text' : type}
          value={value}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground',
            aligned && ALIGNED.fieldText,
          )}
        />
        {password && aligned && (
          // 接上规范时用四个套件共用的密码显隐按钮：图标来自规范的图标集（native 时用 shadcn 自己的 lucide）
          <div className="flex items-center pr-[calc(var(--mh-c-field-inset)-1px)]">
            <PasswordToggle
              visible={visible}
              onToggle={() => setVisible(!visible)}
              glyphs={
                swapsIcons(iconChoice)
                  ? undefined
                  : { shown: <Eye className="size-4" />, hidden: <EyeOff className="size-4" /> }
              }
            />
          </div>
        )}
        {password && !aligned && (
          <button
            type="button"
            className={cn(
              'mr-1 grid size-7 place-items-center rounded text-muted-foreground hover:text-foreground',
              focusRing,
            )}
            aria-label={
              locale === 'zh'
                ? visible
                  ? '隐藏密码'
                  : '显示密码'
                : visible
                  ? 'Hide password'
                  : 'Show password'
            }
            onClick={() => setVisible(!visible)}
          >
            {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </button>
        )}
        {suffix && (
          <div
            className={cn(
              'flex items-center pr-3',
              aligned && 'pr-[calc(var(--mh-c-field-inset)-1px)]',
            )}
          >
            {suffix}
          </div>
        )}
      </div>
    );
  },
  Checkbox: function ShadcnCheckbox({ checked, onChange, children, invalid, ...aria }) {
    const aligned = useAligned();
    const choice = useIconSet();
    const iconSet = iconSetOf(choice);
    const swap = aligned && swapsIcons(choice);
    return (
      <label
        className={cn(
          'inline-flex cursor-pointer items-center gap-2 text-sm text-foreground',
          aligned && ALIGNED.checkboxLabel,
        )}
      >
        <CheckboxPrimitive.Root
          data-slot="checkbox"
          checked={checked}
          onCheckedChange={(next) => onChange(next === true)}
          aria-invalid={invalid || undefined}
          className={cn(
            'grid size-4 shrink-0 place-items-center rounded-[4px] border border-input bg-background shadow-xs data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground aria-invalid:border-destructive',
            focusRing,
            aligned && ALIGNED.checkbox,
          )}
          {...aria}
        >
          {/* 网格：对勾不落在文字基线上，在方块里居中 */}
          <CheckboxPrimitive.Indicator className="grid place-items-center">
            {swap ? (
              // 对勾用规范图标集里的那一个，线宽加粗一半（和 antd、Element 的 CSS 遮罩一致）
              <Icon
                name="check"
                strokeWidth={iconSet.strokeWidth * 1.5}
                className="size-(--mh-c-icon-check) text-(--mh-c-checkbox-mark)"
              />
            ) : (
              <Check className="size-3.5" strokeWidth={3} />
            )}
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        <span>{children}</span>
      </label>
    );
  },
  Tabs: function ShadcnTabs({ value, onChange, items, ...aria }) {
    const aligned = useAligned();
    return (
      <TabsPrimitive.Root value={value} onValueChange={onChange}>
        <TabsPrimitive.List
          {...aria}
          data-slot="tabs-list"
          className={
            aligned
              ? ALIGNED.tabsList
              : // shadcn 默认：分段式胶囊
                'flex h-9 w-full items-center rounded-lg bg-muted p-[3px] text-muted-foreground'
          }
        >
          {items.map((item) => (
            <TabsPrimitive.Trigger
              key={item.value}
              value={item.value}
              className={cn(
                aligned
                  ? ALIGNED.tab
                  : 'inline-flex h-full flex-1 items-center justify-center rounded-md px-3 text-sm font-medium transition-[color,box-shadow] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
                focusRing,
              )}
            >
              {item.label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
      </TabsPrimitive.Root>
    );
  },
  Select: function ShadcnSelect({
    value,
    onChange,
    options,
    size = 'default',
    display,
    width,
    ...aria
  }) {
    const portal = usePortal();
    const aligned = useAligned();
    const iconChoice = useIconSet(); // Hook 每次渲染都要调用，不能写在 && 后面
    const swap = aligned && swapsIcons(iconChoice);
    const controls = useControls();
    return (
      <SelectPrimitive.Root value={value} onValueChange={onChange}>
        <SelectPrimitive.Trigger
          {...aria}
          data-slot="select-trigger"
          style={{ width }}
          className={cn(
            'flex shrink-0 items-center justify-between gap-2 border border-input bg-background px-3 text-sm text-foreground shadow-xs',
            radius,
            height[size],
            focusRing,
            aligned && ALIGNED.selectTrigger,
          )}
        >
          <SelectPrimitive.Value>{display ? display(value) : undefined}</SelectPrimitive.Value>
          <SelectPrimitive.Icon>
            {swap ? (
              // 下拉箭头用规范图标集里的那一个
              <Icon name="chevron-down" className="mh-select-arrow" />
            ) : (
              <ChevronDown className="size-4 opacity-50" />
            )}
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal container={portal}>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={controls?.popup.offset ?? 4}
            className={cn(
              'z-50 min-w-[10rem] overflow-hidden rounded-md border border-border bg-background text-foreground shadow-md',
              aligned && ALIGNED.popup,
            )}
          >
            <SelectPrimitive.Viewport className={cn('p-1', aligned && ALIGNED.popupViewport)}>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    'relative flex cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[highlighted]:bg-accent',
                    aligned && ALIGNED.option,
                  )}
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  {!aligned && (
                    <SelectPrimitive.ItemIndicator className="absolute right-2">
                      <Check className="size-4" />
                    </SelectPrimitive.ItemIndicator>
                  )}
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    );
  },
  Switch: function ShadcnSwitch({ checked, onChange, disabled, ...aria }) {
    const aligned = useAligned();
    return (
      <SwitchPrimitive.Root
        data-slot="switch"
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className={cn(
          'peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
          aligned && ALIGNED.switch,
        )}
        {...aria}
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className={cn(
            'pointer-events-none block size-4 rounded-full bg-background ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0',
            aligned && ALIGNED.switchThumb,
          )}
        />
      </SwitchPrimitive.Root>
    );
  },
  /**
   * 导航菜单：照 shadcn 侧栏（sidebar.tsx）的 SidebarMenu / SidebarMenuButton / SidebarMenuSub 写，
   * 子菜单用 Radix 的 Collapsible（官方示例的做法），收起后的弹层见 NavFlyout。
   * 每一项是一个 button（role=menuitem），所以都在 Tab 顺序里，回车、空格就是点击。
   */
  NavMenu: function ShadcnNavMenu({
    items,
    selected,
    onSelect,
    open,
    onOpenChange,
    collapsed,
    ...aria
  }) {
    const aligned = useAligned();
    const iconChoice = useIconSet(); // Hook 每次渲染都要调用，不能写在 && 后面
    const swap = aligned && swapsIcons(iconChoice);
    const button = (active: boolean, extra?: string) =>
      cn(
        'flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-sidebar-foreground outline-none transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring [&>span]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
        active && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
        aligned && ALIGNED.navItem,
        aligned && active && ALIGNED.navSelected,
        collapsed && 'justify-center p-2',
        aligned && collapsed && ALIGNED.navCollapsed,
        extra,
      );
    // 图标：导航图标用规范图标集（shadcn 自己用的也是 Lucide）
    const icon = (item: NavItem) => item.icon && <Icon name={item.icon} />;
    // 收起时文字留给读屏（sr-only），键盘聚焦时读得到名字
    const label = (text: string) => (
      <span className={collapsed ? 'sr-only' : undefined}>{text}</span>
    );
    const toggle = (key: string, next: boolean) =>
      onOpenChange(next ? [...open, key] : open.filter((k) => k !== key));
    return (
      // 文字提示马上出现（shadcn 的侧栏也是 delayDuration 0）
      <TooltipPrimitive.Provider delayDuration={0}>
        <ul
          role="menu"
          {...aria}
          data-slot="sidebar-menu"
          className={cn('flex w-full min-w-0 flex-col gap-1 p-2', aligned && ALIGNED.navMenu)}
        >
          {items.map((item) => {
            const childSelected = !!item.children?.some((child) => child.key === selected);
            if (!item.children) {
              const leaf = (
                <button
                  type="button"
                  role="menuitem"
                  data-slot="nav-item"
                  aria-current={item.key === selected ? 'page' : undefined}
                  className={button(item.key === selected)}
                  onClick={() => onSelect(item.key)}
                >
                  {icon(item)}
                  {label(item.label)}
                </button>
              );
              return (
                <li key={item.key} role="none" className="relative">
                  {collapsed ? <NavTooltip label={item.label}>{leaf}</NavTooltip> : leaf}
                </li>
              );
            }
            if (collapsed)
              return (
                <li key={item.key} role="none" className="relative">
                  <NavFlyout
                    item={item}
                    selected={selected}
                    onSelect={onSelect}
                    trigger={
                      <button
                        type="button"
                        role="menuitem"
                        data-slot="nav-item"
                        className={button(childSelected)}
                      >
                        {icon(item)}
                        {label(item.label)}
                      </button>
                    }
                  />
                </li>
              );
            return (
              <CollapsiblePrimitive.Root
                key={item.key}
                asChild
                open={open.includes(item.key)}
                onOpenChange={(next) => toggle(item.key, next)}
                className="group/collapsible"
              >
                <li role="none" className="relative">
                  <CollapsiblePrimitive.Trigger
                    role="menuitem"
                    data-slot="nav-item"
                    className={button(
                      false,
                      cn(aligned && childSelected && ALIGNED.navParentSelected),
                    )}
                  >
                    {icon(item)}
                    {label(item.label)}
                    {swap ? (
                      <Icon name="chevron-down" className={ALIGNED.navArrow} />
                    ) : (
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    )}
                  </CollapsiblePrimitive.Trigger>
                  <CollapsiblePrimitive.Content asChild>
                    <ul
                      role="menu"
                      aria-label={item.label}
                      className={cn(
                        'mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5',
                        aligned && ALIGNED.navSub,
                      )}
                    >
                      {item.children.map((child) => (
                        <li key={child.key} role="none">
                          <button
                            type="button"
                            role="menuitem"
                            data-slot="nav-item"
                            aria-current={child.key === selected ? 'page' : undefined}
                            className={button(
                              child.key === selected,
                              cn(!aligned && 'h-7 px-2', aligned && ALIGNED.navSubItem),
                            )}
                            onClick={() => onSelect(child.key)}
                          >
                            {label(child.label)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </CollapsiblePrimitive.Content>
                </li>
              </CollapsiblePrimitive.Root>
            );
          })}
        </ul>
      </TooltipPrimitive.Provider>
    );
  },
  /** 面包屑：照 shadcn 的 breadcrumb.tsx 写。 */
  Breadcrumb: function ShadcnBreadcrumb({ items, onNavigate, ...aria }) {
    const aligned = useAligned();
    const controls = useControls();
    return (
      <nav {...aria} data-slot="breadcrumb">
        <ol
          className={cn(
            'flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2.5',
            aligned && ALIGNED.breadcrumbList,
          )}
        >
          {items.map((item, i) => (
            <Fragment key={item.key}>
              {i > 0 && (
                <li
                  role="presentation"
                  aria-hidden
                  className={cn('[&>svg]:size-3.5', aligned && ALIGNED.breadcrumbSeparator)}
                >
                  {controls ? controls.breadcrumb.separator : <ChevronRight />}
                </li>
              )}
              <li className="inline-flex items-center gap-1.5">
                {i === items.length - 1 ? (
                  // shadcn 的当前页是 role=link + aria-disabled；接上规范时只标 aria-current（不是链接）
                  <span
                    {...(aligned ? {} : { role: 'link', 'aria-disabled': true })}
                    aria-current="page"
                    className={cn('font-normal text-foreground', aligned && ALIGNED.breadcrumbPage)}
                  >
                    {item.label}
                  </span>
                ) : item.link ? (
                  <a
                    href="#"
                    data-slot="breadcrumb-link"
                    className={cn(
                      'transition-colors hover:text-foreground',
                      aligned && ALIGNED.breadcrumbLink,
                    )}
                    onClick={(event) => {
                      event.preventDefault();
                      onNavigate(item.key);
                    }}
                  >
                    {item.label}
                  </a>
                ) : (
                  <span>{item.label}</span>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>
    );
  },
  /** 下拉菜单：照 shadcn 的 dropdown-menu.tsx 写（Radix DropdownMenu）。 */
  Dropdown: function ShadcnDropdown({ items, onSelect, children, ...aria }) {
    const portal = usePortal();
    const aligned = useAligned();
    const controls = useControls();
    return (
      <DropdownMenuPrimitive.Root modal={false}>
        <DropdownMenuPrimitive.Trigger asChild>{children}</DropdownMenuPrimitive.Trigger>
        <DropdownMenuPrimitive.Portal container={portal}>
          <DropdownMenuPrimitive.Content
            {...aria}
            data-slot="dropdown-menu-content"
            align="end"
            sideOffset={controls?.popup.offset ?? 4}
            className={cn(
              'z-50 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md',
              aligned && ALIGNED.dropdown,
            )}
          >
            {items.map((item) => (
              <Fragment key={item.key}>
                {item.divided && (
                  <DropdownMenuPrimitive.Separator
                    className={cn(
                      '-mx-1 my-1 h-px bg-border',
                      aligned && ALIGNED.dropdownSeparator,
                    )}
                  />
                )}
                <DropdownMenuPrimitive.Item
                  data-slot="dropdown-menu-item"
                  data-variant={item.danger ? 'destructive' : 'default'}
                  onSelect={() => onSelect(item.key)}
                  className={cn(
                    "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground data-[variant=destructive]:[&_svg]:text-destructive!",
                    aligned && ALIGNED.dropdownItem,
                  )}
                >
                  {item.icon && <Icon name={item.icon} />}
                  {item.label}
                </DropdownMenuPrimitive.Item>
              </Fragment>
            ))}
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    );
  },
  /** 头像：照 shadcn 的 avatar.tsx 写（Radix Avatar，没有图片时显示文字）。 */
  Avatar: function ShadcnAvatar({ text }) {
    const aligned = useAligned();
    return (
      <AvatarPrimitive.Root
        data-slot="avatar"
        className={cn(
          'relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted',
          aligned && ALIGNED.avatar,
        )}
      >
        <AvatarPrimitive.Fallback className="flex size-full items-center justify-center rounded-full">
          {text}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
    );
  },
  /** 徽标：shadcn 的 Badge（destructive）定位到右上角，中心对准被标注的东西的右上角。 */
  Badge: function ShadcnBadge({ count, children }) {
    const aligned = useAligned();
    return (
      <span className="relative inline-flex">
        {children}
        <span
          data-slot="badge"
          aria-hidden
          className={cn(
            'absolute top-0 right-0 inline-flex translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border border-transparent bg-destructive px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white',
            aligned && ALIGNED.badge,
          )}
        >
          {badgeText(count)}
        </span>
      </span>
    );
  },
  /**
   * 表格：shadcn 没有「表格组件」，只有 table.tsx 里几个加了类名的表格元素（Table、TableRow、TableHead……），
   * 官方的数据表格示例用它们加 TanStack Table 拼：TanStack 管列、行、勾选状态，shadcn 管长相。这里照着拼。
   * 排序、分页由页面做（manualSorting），表格只把「点了哪一列」按 nextSort 告诉页面。
   * shadcn 也没有「加载中」：套件自己画（表格变浅，中间一个加载图标）。
   */
  Table: function ShadcnTable({
    columns,
    rows,
    renderCell,
    selected,
    onSelectedChange,
    sort,
    onSortChange,
    loading,
    empty,
    selectLabel,
    selectAllLabel,
    ...aria
  }) {
    const aligned = useAligned();
    const choice = useIconSet();
    const swap = aligned && swapsIcons(choice);
    const selectable = !!selected;
    const rowSelection: RowSelectionState = Object.fromEntries(
      (selected ?? []).map((key) => [key, true]),
    );
    const defs: ColumnDef<TableRow>[] = [
      ...(selectable ? [{ id: '__select' }] : []),
      ...columns.map((column) => ({ id: column.key, meta: column })),
    ];
    const table = useReactTable({
      data: rows,
      columns: defs,
      getCoreRowModel: getCoreRowModel(),
      getRowId: (row) => row.key,
      manualSorting: true,
      enableRowSelection: selectable,
      state: {
        rowSelection,
        sorting: sort ? [{ id: sort.key, desc: sort.order === 'desc' }] : [],
      },
      // 勾选：TanStack 只改这一页的行，别的页的勾选原样留着
      onRowSelectionChange: (updater) => {
        const next = typeof updater === 'function' ? updater(rowSelection) : updater;
        onSelectedChange?.(Object.keys(next).filter((key) => next[key]));
      },
    });
    const metaOf = (id: string) => columns.find((column) => column.key === id);
    const colSpan = defs.length;
    const sortIcon = (column: TableColumn) => {
      const order = sort?.key === column.key ? sort.order : null;
      if (!swap) return <ArrowUpDown className="size-4" />;
      return (
        <Icon
          name={
            order === 'asc' ? 'chevron-up' : order === 'desc' ? 'chevron-down' : 'chevrons-up-down'
          }
          {...(order ? { 'data-sorted': '' } : {})}
        />
      );
    };
    const checkCell = (children: ReactElement) => (
      <div className="flex items-center justify-center">{children}</div>
    );
    return (
      <div data-slot="table-container" className="relative w-full overflow-x-auto">
        <table
          {...aria}
          data-slot="table"
          aria-busy={loading || undefined}
          // 加载中整个表格不能操作（鼠标、键盘），这是接口约定，三档都是
          inert={loading || undefined}
          className={cn(
            'w-full caption-bottom text-sm',
            aligned && ALIGNED.table,
            loading && aligned && ALIGNED.tableLoading,
          )}
        >
          <colgroup>
            {selectable && (
              <col className={aligned ? 'w-(--mh-c-table-selection-width)' : 'w-10'} />
            )}
            {columns.map((column) => (
              <col key={column.key} style={{ width: column.width }} />
            ))}
          </colgroup>
          <thead data-slot="table-header" className={cn(!aligned && '[&_tr]:border-b')}>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} data-slot="table-row" className={cn(!aligned && 'border-b')}>
                {group.headers.map((header) => {
                  const column = metaOf(header.id);
                  const order = column && sort?.key === column.key ? sort.order : null;
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      data-slot="table-head"
                      aria-sort={order ? (order === 'asc' ? 'ascending' : 'descending') : undefined}
                      className={cn(
                        'h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground',
                        aligned && ALIGNED.tableHead,
                        !column && (aligned ? ALIGNED.tableSelection : 'pr-0'),
                        column?.align === 'right' && 'text-right',
                      )}
                    >
                      {!column ? (
                        checkCell(
                          <TableCheckbox
                            checked={
                              table.getIsAllPageRowsSelected()
                                ? true
                                : table.getIsSomePageRowsSelected()
                                  ? 'indeterminate'
                                  : false
                            }
                            onChange={(value) => table.toggleAllPageRowsSelected(value)}
                            label={selectAllLabel}
                            // 没有行：没什么可选的
                            disabled={!rows.length}
                          />,
                        )
                      ) : column.sortable ? (
                        // 官方示例：表头里放一个 ghost 按钮，文字后面一个 ArrowUpDown
                        <button
                          type="button"
                          data-slot="table-sort"
                          onClick={() => onSortChange(nextSort(sort, column.key))}
                          className={cn(
                            button({ variant: 'text', size: 'default' }),
                            '-ml-3 px-3',
                            column.align === 'right' && '-mr-3 ml-0',
                            aligned && ALIGNED.tableSort,
                            aligned && 'mx-0',
                          )}
                        >
                          {column.title}
                          {sortIcon(column)}
                        </button>
                      ) : (
                        column.title
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody data-slot="table-body" className={cn(!aligned && '[&_tr:last-child]:border-0')}>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-slot="table-row"
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className={cn(
                    'group/row',
                    !aligned &&
                      'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const column = metaOf(cell.column.id);
                    return (
                      <td
                        key={cell.id}
                        data-slot="table-cell"
                        className={cn(
                          'p-2 align-middle whitespace-nowrap',
                          aligned && ALIGNED.tableCell,
                          !column && (aligned ? ALIGNED.tableSelection : 'pr-0'),
                          column?.align === 'right' && 'text-right',
                        )}
                      >
                        {column
                          ? renderCell(row.original, column)
                          : checkCell(
                              <TableCheckbox
                                checked={row.getIsSelected()}
                                onChange={(value) => row.toggleSelected(value)}
                                label={selectLabel(row.original)}
                              />,
                            )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              // 没有行：官方示例是一个 h-24 的格子写「No results.」；内容由页面给
              <tr data-slot="table-row" className="group/row">
                <td
                  colSpan={colSpan}
                  data-slot="table-cell"
                  className={cn('p-2 text-center', aligned && 'h-auto border-b-0 p-0')}
                >
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && (
          // shadcn 没有表格的加载中：中间放一个加载图标（原生那一档用它的 Spinner：Loader2 转圈）
          <div aria-hidden className="absolute inset-0 grid place-items-center">
            {swap ? (
              <Icon name="loading" spin className={ALIGNED.tableSpinner} />
            ) : (
              <Loader2 className={cn('size-4 animate-spin', aligned && ALIGNED.tableSpinner)} />
            )}
          </div>
        )}
      </div>
    );
  },
  /**
   * 分页：照 shadcn 的 pagination.tsx 写（nav > ul > li，当前页是 outline 按钮，别的页是 ghost）。
   * 官方用 <a href>，这里不跳转页面，换成 <button>。shadcn 没有「共 N 条」，套件加在左边。
   */
  Pagination: function ShadcnPagination({
    page,
    pageSize,
    total,
    onChange,
    totalText,
    pageLabel,
    prevLabel,
    nextLabel,
    ...aria
  }) {
    const aligned = useAligned();
    const choice = useIconSet();
    const swap = aligned && swapsIcons(choice);
    const count = Math.max(1, Math.ceil(total / pageSize));
    const item = (active: boolean) =>
      cn(
        button({ variant: active ? 'secondary' : 'text', size: 'default' }),
        'size-9 px-0',
        aligned && ALIGNED.pageItem,
      );
    const step = (to: number, label: string, icon: 'chevron-left' | 'chevron-right') => (
      <li>
        <button
          type="button"
          data-slot="pagination-link"
          aria-label={label}
          disabled={to < 1 || to > count}
          onClick={() => onChange(to)}
          className={cn(item(false), !aligned && 'w-auto gap-1 px-2.5')}
        >
          {swap ? (
            <Icon name={icon} />
          ) : icon === 'chevron-left' ? (
            <>
              <ChevronLeft className="size-4" />
              {!aligned && <span>{label}</span>}
            </>
          ) : (
            <>
              {!aligned && <span>{label}</span>}
              <ChevronRight className="size-4" />
            </>
          )}
        </button>
      </li>
    );
    return (
      <nav
        {...aria}
        data-slot="pagination"
        className={cn(
          'mx-auto flex w-full items-center justify-center gap-4',
          aligned && ALIGNED.pagination,
        )}
      >
        <span className={cn('text-sm text-muted-foreground', aligned && ALIGNED.paginationTotal)}>
          {totalText(total)}
        </span>
        <ul className={cn('flex flex-row items-center gap-1', aligned && ALIGNED.paginationList)}>
          {step(page - 1, prevLabel, 'chevron-left')}
          {pageList(page, count).map((p, i) =>
            p === null ? (
              <li key={`gap${i}`} aria-hidden className="flex size-9 items-center justify-center">
                …
              </li>
            ) : (
              <li key={p}>
                <button
                  type="button"
                  data-slot="pagination-link"
                  aria-current={p === page ? 'page' : undefined}
                  aria-label={pageLabel(p)}
                  onClick={() => onChange(p)}
                  className={item(p === page)}
                >
                  {p}
                </button>
              </li>
            ),
          )}
          {step(page + 1, nextLabel, 'chevron-right')}
        </ul>
      </nav>
    );
  },
  /**
   * 状态标签：照 shadcn 的 badge.tsx 写。shadcn 只有 default（黑底）、secondary（灰底）、destructive（红底）、
   * outline（描边）四种，没有成功、提醒：原生那一档默认用 secondary、危险用 destructive，成功和提醒只能用 outline。
   */
  Tag: function ShadcnTag({ tone = 'default', children }) {
    const aligned = useAligned();
    const native = {
      default: 'border-transparent bg-muted text-foreground',
      success: 'text-foreground',
      warning: 'text-foreground',
      danger: 'border-transparent bg-destructive text-white',
    }[tone];
    return (
      <span
        data-slot="tag"
        className={cn(
          'inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
          aligned ? [ALIGNED.tag, ALIGNED.tagTone[tone]] : native,
        )}
      >
        {children}
      </span>
    );
  },
  // 部件地图：用户看得见的那个框是哪个元素（自动检查按这里找，不影响组件本身）。
  // 标签栏的指示条是选中标签的 ::after 伪元素。
  /**
   * 日期范围：照 shadcn 的「日期范围选择」示例（Popover + Calendar，Calendar 是 react-day-picker，两个月并排）。
   * 示例的触发器是一个按钮，里面写「开始 - 结束」；统一设计是两个只读的框，套件改成框，点哪个都打开面板。
   * 选两天：先点的是开始、后点的是结束（后点的比先点的早就对调），选完收起、通知页面。
   * 打开面板不抢焦点（焦点留在框上），Esc 收起，焦点回到框上。
   */
  DateRange: function ShadcnDateRange({
    value,
    onChange,
    placeholder,
    separator,
    labels,
    ...aria
  }) {
    const portal = usePortal();
    const aligned = useAligned();
    const choice = useIconSet();
    const swap = aligned && swapsIcons(choice);
    const controls = useControls();
    const [open, setOpen] = useState(false);
    const [start, setStart] = useState<Date | null>(null);
    const [month, setMonth] = useState(() => (value ? dateOf(value[0]) : new Date()));
    // 框里打的字（还没提交）；null 是没在打字，框里显示页面给的值
    const [draft, setDraft] = useState<[string, string] | null>(null);
    const anchor = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const last = useRef<HTMLInputElement | null>(null);
    const shown: [string, string] = draft ?? [value?.[0] ?? '', value?.[1] ?? ''];
    const show = (next: boolean) => {
      if (next) {
        setStart(null);
        setMonth(value ? dateOf(value[0]) : new Date());
      }
      setOpen(next);
    };
    const pick = (day: Date) => {
      setDraft(null);
      if (!start) return setStart(day);
      const [a, b] = day < start ? [day, start] : [start, day];
      onChange([ymd(a), ymd(b)]);
      setStart(null);
      setOpen(false);
    };
    /** 提交打的字：两个都是合法日期才通知页面（开始比结束晚就对调），不合法就回到页面给的值。 */
    const commit = () => {
      if (draft) {
        const [a, b] = draft;
        if (isDate(a) && isDate(b)) onChange(a <= b ? [a, b] : [b, a]);
      }
      setDraft(null);
    };
    const from = start ?? (value ? dateOf(value[0]) : undefined);
    const to = start ?? (value ? dateOf(value[1]) : undefined);
    const box = (i: 0 | 1) => (
      <input
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={labels[i]}
        autoComplete="off"
        placeholder={placeholder[i]}
        value={shown[i]}
        onChange={(event) =>
          setDraft(i === 0 ? [event.target.value, shown[1]] : [shown[0], event.target.value])
        }
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            last.current = event.currentTarget;
            // 打过字就提交（回车照常提交所在的表单：筛选栏就是查询），没打过字就打开 / 收起面板
            if (draft) return commit();
            event.preventDefault();
            show(!open);
          } else if (event.key === 'Escape' && draft) {
            setDraft(null);
          }
        }}
        className={cn(
          'w-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground',
          aligned && 'placeholder:text-(--mh-text-placeholder)',
        )}
      />
    );
    return (
      <PopoverPrimitive.Root open={open} onOpenChange={show}>
        <PopoverPrimitive.Anchor asChild>
          <div
            ref={anchor}
            role="group"
            {...aria}
            data-slot="date-range"
            data-state={open ? 'open' : 'closed'}
            onBlur={(event) => {
              const next = event.relatedTarget as Node | null;
              if (!anchor.current?.contains(next) && !content.current?.contains(next))
                setDraft(null);
            }}
            // 点框里哪儿都打开（点在两个框上，焦点就在那个框上；点在别处算开始日期）
            onClick={(event) => {
              const input = (event.target as HTMLElement).closest('input');
              last.current = input ?? anchor.current!.querySelector('input');
              if (!input) last.current?.focus();
              show(true);
            }}
            className={cn(
              'flex w-full items-center gap-2 border border-input bg-background px-3 text-sm shadow-xs focus-within:ring-[3px] focus-within:ring-ring/40',
              radius,
              height.default,
              aligned && ALIGNED.dateRange,
            )}
          >
            {box(0)}
            <span
              aria-hidden
              className={cn('text-muted-foreground', aligned && ALIGNED.dateSeparator)}
            >
              {separator}
            </span>
            {box(1)}
            {swap ? (
              <Icon name="calendar" className={ALIGNED.dateIcon} />
            ) : (
              <CalendarIcon
                className={cn('size-4 shrink-0 opacity-50', aligned && ALIGNED.dateIcon)}
              />
            )}
          </div>
        </PopoverPrimitive.Anchor>
        <PopoverPrimitive.Portal container={portal}>
          <PopoverPrimitive.Content
            ref={content}
            data-slot="date-popup"
            align="start"
            sideOffset={controls?.popup.offset ?? 4}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              last.current?.focus();
            }}
            // 点框本身不算「点在外面」：不然先关上、又被点击打开
            onInteractOutside={(event) => {
              if (anchor.current?.contains(event.target as Node)) event.preventDefault();
            }}
            className={cn(
              'z-50 w-auto rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none',
              aligned && ALIGNED.datePopup,
            )}
          >
            <DayPicker
              locale={zhCN}
              weekStartsOn={1}
              numberOfMonths={2}
              showOutsideDays
              fixedWeeks
              month={month}
              onMonthChange={setMonth}
              onDayClick={pick}
              modifiers={{
                range_start: from ? [from] : [],
                range_end: to ? [to] : [],
                range_middle: from && to ? [{ after: from, before: to }] : [],
              }}
              formatters={{
                formatCaption: (date) => `${date.getFullYear()}年${date.getMonth() + 1}月`,
                formatWeekdayName: (date) => '日一二三四五六'[date.getDay()]!,
              }}
              components={{ Chevron: CalendarChevron }}
              classNames={aligned ? DAY_PICKER_ALIGNED : DAY_PICKER_NATIVE}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  },
  /**
   * 对话框：照 shadcn 的 dialog.tsx 写（Radix Dialog）。Radix 管焦点锁定、Esc 一层一层关（里面的下拉先关）、
   * 关上以后焦点回到打开前的元素。统一设计：关闭按钮在 Tab 顺序的最前（shadcn 放在最后）、点遮罩不关、
   * 打开后焦点进第一个输入框（shadcn 默认进第一个能聚焦的，也就是关闭按钮）。
   */
  Dialog: function ShadcnDialog({ open, onClose, title, children, footer, closeLabel }) {
    const portal = usePortal();
    const aligned = useAligned();
    const choice = useIconSet();
    const swap = aligned && swapsIcons(choice);
    const body = useRef<HTMLDivElement>(null);
    // 打开前焦点在哪（编辑按钮）：关上以后回到那里。Radix 只会回到 DialogTrigger，页面自己控制开关时没有它
    const opener = useRef<HTMLElement | null>(null);
    useLayoutEffect(() => {
      if (open) opener.current = document.activeElement as HTMLElement | null;
    }, [open]);
    const close = (
      <DialogPrimitive.Close
        aria-label={closeLabel}
        className={cn(
          'absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden [&_svg]:size-4',
          aligned && ALIGNED.dialogClose,
        )}
      >
        {swap ? <Icon name="x" /> : <XIcon />}
      </DialogPrimitive.Close>
    );
    return (
      <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogPrimitive.Portal container={portal}>
          <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn('fixed inset-0 z-50 bg-black/50', aligned && ALIGNED.dialogOverlay)}
          />
          <DialogPrimitive.Content
            data-slot="dialog-content"
            aria-describedby={undefined}
            onOpenAutoFocus={(event) => {
              if (!aligned) return;
              event.preventDefault();
              body.current
                ?.querySelector<HTMLElement>(
                  'input, textarea, select, button, [tabindex]:not([tabindex="-1"])',
                )
                ?.focus();
            }}
            // 点遮罩不关是接口约定（表单填了一半，点歪了会丢），三档都这样
            onPointerDownOutside={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (opener.current?.isConnected) opener.current.focus();
            }}
            className={cn(
              'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg sm:max-w-lg',
              aligned && ALIGNED.dialog,
            )}
          >
            {aligned && close}
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <DialogPrimitive.Title
                className={cn('text-lg leading-none font-semibold', aligned && ALIGNED.dialogTitle)}
              >
                {title}
              </DialogPrimitive.Title>
            </div>
            <div ref={body} className={cn(aligned && ALIGNED.dialogBody)}>
              {children}
            </div>
            <div className={cn(aligned && ALIGNED.dialogFooter)}>{footer}</div>
            {!aligned && close}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  },
  /** 单选：照 shadcn 的 radio-group.tsx 写（Radix RadioGroup：Tab 进到选中的那一项，方向键换选中）。 */
  Radio: function ShadcnRadio({ value, onChange, options, ...aria }) {
    const aligned = useAligned();
    return (
      <RadioGroupPrimitive.Root
        {...aria}
        value={value}
        onValueChange={onChange}
        data-slot="radio-group"
        className={cn('grid gap-3', aligned && ALIGNED.radioGroup)}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn('flex items-center gap-3 text-sm', aligned && ALIGNED.radioLabel)}
          >
            <RadioGroupPrimitive.Item
              value={option.value}
              data-slot="radio-group-item"
              className={cn(
                'aspect-square size-4 shrink-0 rounded-full border border-input shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                aligned && ALIGNED.radio,
              )}
            >
              <RadioGroupPrimitive.Indicator className="relative flex items-center justify-center">
                {aligned ? (
                  <span className={ALIGNED.radioDot} />
                ) : (
                  <CircleIcon className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 fill-primary" />
                )}
              </RadioGroupPrimitive.Indicator>
            </RadioGroupPrimitive.Item>
            <span>{option.label}</span>
          </label>
        ))}
      </RadioGroupPrimitive.Root>
    );
  },
  /** 多行输入：照 shadcn 的 textarea.tsx 写。 */
  Textarea: function ShadcnTextarea({ value, onChange, invalid, rows, ...rest }) {
    const aligned = useAligned();
    const controls = useControls();
    return (
      <textarea
        {...rest}
        data-slot="textarea"
        rows={rows ?? controls?.textarea.rows}
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm',
          aligned && ALIGNED.textarea,
          aligned && radius,
        )}
      />
    );
  },
  parts: {
    field: '[data-slot=input]',
    select: '[data-slot=select-trigger]',
    checkbox: '[data-slot=checkbox]',
    button: '[data-slot=button]:not([data-variant=link], [data-variant=text])',
    tabIndicator: { selector: '[role=tab][data-state=active]', pseudo: '::after' },
    popup: '[role=listbox]',
    option: '[role=option]',
    switch: '[data-slot=switch]',
    switchThumb: '[data-slot=switch-thumb]',
    menuItem: '[data-slot=nav-item]',
    menuPopup: '[data-slot=nav-flyout]',
    breadcrumbLink: '[data-slot=breadcrumb-link]',
    dropdown: '[data-slot=dropdown-menu-content]',
    dropdownItem: '[data-slot=dropdown-menu-item]',
    avatar: '[data-slot=avatar]',
    badge: '[data-slot=badge]',
    tooltip: '[data-slot=tooltip-content]',
    tableHead: '[data-slot=table-head]',
    tableCell: '[data-slot=table-cell]',
    tableSort: '[data-slot=table-sort]',
    tag: '[data-slot=tag]',
    pageItem: '[data-slot=pagination-link]',
    dateRange: '[data-slot=date-range]',
    datePopup: '[data-slot=date-popup]',
    dateCell: '[data-slot=date-popup] td > button',
    dialog: '[data-slot=dialog-content]',
    radio: '[data-slot=radio-group-item]',
    textarea: '[data-slot=textarea]',
  },
  profile: {
    framework: 'react',
    site: 'https://ui.shadcn.com',
    tags: [
      { zh: '源码复制进项目', en: 'Source copied in' },
      { zh: 'Tailwind 类名', en: 'Tailwind classes' },
      { zh: 'Radix 交互', en: 'Radix primitives' },
    ],
    styling: {
      zh: '不是装进项目的组件库，而是复制进项目的源码：交互用 Radix 原语，样式全是 Tailwind 类名。',
      en: 'Not an installed library but source copied into your project: Radix primitives for behavior, Tailwind classes for styling.',
    },
    theming: {
      zh: '一组 CSS 变量（--primary、--border、--ring……）接到 Tailwind 的主题上；源码在自己手里，尺寸和长相直接改类名。',
      en: 'A set of CSS variables (--primary, --border, --ring…) wired into the Tailwind theme; you own the source, so sizes and looks are edited in the class names.',
    },
    sizing: {
      zh: '写在类名里，比如控件默认 h-9（36px）、文字 text-sm（14px、行高 20px）；没有统一的尺寸开关。',
      en: 'Written in class names, e.g. h-9 (36px) controls and text-sm (14px / 20px); no single size switch.',
    },
    look: {
      zh: '黑白中性色，标签栏是分段式胶囊，复选框 16px，聚焦有 3px 外环，选中的下拉项右边有对勾。',
      en: 'Neutral black and white, segmented pill tabs, 16px checkbox, a 3px focus ring, a check on the selected option.',
    },
    icons: {
      zh: '没有自己的图标库，源码里默认用 lucide-react（ChevronDown、Eye、Check、Loader2……）。源码在项目里，换图标就是改 import。',
      en: 'No icon library of its own: the source imports lucide-react by default (ChevronDown, Eye, Check, Loader2…). The source lives in your project, so changing icons means changing the imports.',
    },
    accessibility: {
      zh: '交互都来自 Radix 原语：开关、复选框、标签栏、选择框、下拉菜单的角色、键盘（方向键、Esc、焦点回到触发按钮）都是现成的。侧栏菜单是一串 <button>，天然能 Tab、回车空格。缺口在拼出来的地方：侧栏收起后没有子菜单弹层（套件用 Popover 拼）；面包屑的当前页是 role=link + aria-disabled，读成「不能用的链接」。',
      en: 'Behavior comes from Radix primitives: roles and keyboard for switch, checkbox, tabs, select and dropdown menu (arrows, Esc, focus back to the trigger) are built in. Sidebar items are plain buttons. Gaps are in what you compose yourself: no flyout for the collapsed sidebar (the kit builds one with Popover); the current breadcrumb page is role=link with aria-disabled.',
    },
    setup: [
      { zh: '项目要先接入 Tailwind CSS v4。', en: 'The project needs Tailwind CSS v4.' },
      {
        zh: '组件代码在自己的仓库里，升级要自己合并上游的改动。',
        en: 'The component code lives in your repo; upgrades are merged by hand.',
      },
    ],
  },
  adaptations: [
    adapt(
      'dateRange',
      'shape',
      [
        '官方示例的触发器是一个按钮（日历图标在左边，文字「开始 - 结束」）；面板是 react-day-picker，日子 32 的方块、范围的开始结束是主色、中间浅灰',
        'The official trigger is a button (calendar icon on the left, “start - end”); the panel is react-day-picker with 32px days',
      ],
      [
        '两个只读的框加分隔文字，日历图标在右；面板照规格（星期、标题行 32、今天 1px 描边、周一开头）',
        'Two read-only boxes with a separator and the calendar on the right; the panel follows the spec (32px header and weekday rows, today outlined, Monday first)',
      ],
      'class',
    ),
    adapt(
      'dialog',
      'keyboard',
      [
        '关闭按钮在最后（Tab 顺序也在最后）；打开后焦点落在第一个能聚焦的元素上；点遮罩就关；页面自己控制开关时（没有 DialogTrigger），关上以后焦点掉到 body',
        'The close button comes last; focus lands on the first focusable element; clicking outside closes; without a DialogTrigger focus falls to body on close',
      ],
      [
        '关闭按钮在最前；打开后焦点进第一个输入框；点遮罩不关（接口约定，三档都是）；关上以后焦点回到打开它的按钮',
        'Close button first; focus goes to the first field; the mask does not close (a contract); focus returns to the opener',
      ],
      'behavior',
    ),
    adapt(
      'dialog',
      'size',
      [
        '512 宽、24 的留白、圆角 10、1px 描边、元素之间 16；标题 18px 600、行高 1；关闭按钮 70% 不透明',
        '512px wide, 24px padding, 10px radius, 1px border, 16px gaps; 18px/600 title; close button at 70% opacity',
      ],
      ['照对话框规格', 'Follows the dialog spec'],
      'class',
    ),
    adapt(
      'radio',
      'shape',
      [
        '竖着排、隔 12；选中是白底里一个主色小圆点（8px）',
        'Stacked with 12px gaps; checked shows an 8px primary dot on white',
      ],
      [
        '一行、两项隔 24；选中是主色底加 6 的白点',
        'One row, 24px apart; checked is primary with a 6px white dot',
      ],
      'class',
    ),
    adapt(
      'textarea',
      'size',
      [
        '跟着内容自己长高（field-sizing: content），最少 64 高，上下 8',
        'Grows with its content (field-sizing: content), at least 64px, 8px vertical padding',
      ],
      [
        '固定 3 行、上下留白取规格、能往下拖',
        'Fixed 3 rows, vertical inset from the spec, vertical resize',
      ],
      'class',
    ),
    adapt(
      'table',
      'shape',
      [
        '没有表格组件：table.tsx 只是几个加了类名的表格元素，官方的数据表格示例用 TanStack Table 管列、行和勾选',
        'No table component: table.tsx is a few styled table elements; the official data-table recipe adds TanStack Table for columns, rows and selection',
      ],
      [
        '照官方示例拼（TanStack Table 8.21.3），排序、分页交给页面',
        'Assembled the same way (TanStack Table 8.21.3); sorting and paging stay with the page',
      ],
      'class',
    ),
    adapt(
      'table',
      'size',
      [
        '表头 40、格子 p-2（行约 37 高）、表头 14px 500 深色字，分隔线画在行上、最后一行不画',
        'Header 40, p-2 cells (rows about 37px), 14px/500 dark header text, rules drawn on rows, none under the last',
      ],
      [
        '表头 40、行 44、格子左右 16、勾选列 48；表头 12px 500 次要灰；分隔线画在格子上',
        'Header 40, rows 44, 16px cell inset, 48px selection column; 12px/500 secondary header text; rules on cells',
      ],
      'class',
    ),
    adapt(
      'table',
      'icon',
      [
        '排序：表头里一个 ghost 按钮，文字后面一个 ArrowUpDown，排没排序都是它',
        'Sorting: a ghost button with an ArrowUpDown that never changes',
      ],
      [
        '图标集的三种：没排序 chevrons-up-down、升序 chevron-up、降序 chevron-down，th 上写 aria-sort',
        'Three icon-set glyphs for unsorted / ascending / descending; aria-sort on the th',
      ],
      'class',
    ),
    adapt(
      'table',
      'state',
      [
        '没有加载中；勾选框的「部分选中」没有样子（白底上一个对勾）',
        'No loading state; the indeterminate checkbox has no style (a check on white)',
      ],
      [
        '套件画加载中（变浅 + 图标集的加载图标）；部分选中是主色底加短横；没有行时表头的复选框禁用',
        'The kit draws loading (fade + icon-set spinner); indeterminate is primary with a dash; the header checkbox is disabled with no rows',
      ],
      'behavior',
    ),
    adapt(
      'checkbox',
      'state',
      [
        '键盘聚焦：3px 外圈是 40% 的 --ring（color-mix 写的，自动检查量不到）',
        'Keyboard focus: a 3px ring of 40% --ring (written with color-mix)',
      ],
      ['控件规格的外圈（3px 浅主色）', 'The spec focus ring (3px light primary)'],
      'class',
    ),
    adapt(
      'pagination',
      'size',
      [
        '36 的方块；当前页是带阴影的 outline 按钮；上一页、下一页带文字；页码是 <a href>；没有「共 N 条」',
        '36px squares; the current page is a shadowed outline button; prev / next carry text; items are <a href>; no total',
      ],
      [
        '32 的方块、当前页主色描边、上一页下一页只有图标；不跳转页面，用 <button>；「共 N 条」加在左边',
        '32px squares, primary outline on the current page, icon-only prev / next; <button> since nothing navigates; total added on the left',
      ],
      'class',
    ),
    adapt(
      'tag',
      'color',
      [
        'Badge 22 高、圆角 6、带描边；只有 default（黑底）、secondary、destructive、outline，没有成功、提醒',
        'Badge is 22px, 6px radius, bordered; only default (black), secondary, destructive and outline, no success or warning',
      ],
      [
        '20 高、左右 6、没有描边，四种色调的浅底和字色取控件规格',
        '20px, 6px inset, no border; tinted fills and text for all four tones from the spec',
      ],
      'class',
    ),
    adapt(
      'field',
      'shape',
      [
        '输入框、选择框、按钮、复选框都带一道很淡的阴影（shadow-xs：向下 1px、5% 的黑）',
        'Inputs, selects, buttons and checkboxes carry a faint shadow (shadow-xs: 1px down, 5% black)',
      ],
      [
        '去掉：控件规格里没有这道阴影，另外三个组件库也没有',
        'Removed: the spec has no such shadow, nor do the other libraries',
      ],
      'class',
    ),
    adapt(
      'switch',
      'size',
      [
        '轨道 32×18.4（h-[1.15rem] w-8，含 1px 透明边框）、圆点 16，轨道带一道小阴影',
        'Track 32×18.4 (h-[1.15rem] w-8 with a 1px transparent border), 16px thumb, small track shadow',
      ],
      [
        '44×22、圆点 18 离边 2px，阴影只在圆点上',
        '44×22, 18px thumb 2px from the edge, shadow on the thumb only',
      ],
      'class',
    ),
    adapt(
      'switch',
      'keyboard',
      ['键盘聚焦外圈是主色 50%', 'The focus ring is the primary at 50%'],
      ['外圈颜色取控件规格', 'Ring color from the spec'],
      'class',
    ),
    adapt(
      'button',
      'size',
      [
        '左右内边距默认 px-4（16px）、大号 px-6（24px）；主按钮没有边框、次要按钮有，宽度差 2px',
        'Padding is px-4 (16px) or px-6 (24px) when large; primary has no border but secondary does, 2px wider',
      ],
      [
        '按钮都带 1px 边框（主按钮的透明），文字离外边框取控件规格：默认 16px、大号 20px',
        'All buttons get a 1px border (transparent on primary); text inset from the spec: 16px default, 20px large',
      ],
      'class',
    ),
    adapt(
      'tabs',
      'shape',
      ['标签栏是分段式胶囊', 'Tabs are a segmented pill'],
      ['下划线标签栏', 'Underlined tabs'],
      'class',
    ),
    adapt(
      'checkbox',
      'type',
      [
        '复选框文字 14px、行高 20px（text-sm）',
        'Checkbox labels are 14px with a 20px line (text-sm)',
      ],
      ['规范的正文字号，一行文字高', 'The spec body size and line height'],
      'class',
    ),
    adapt(
      'field',
      'size',
      ['文字离外边框 13px', 'Text sits 13px from the edge'],
      ['12px', '12px'],
      'class',
    ),
    adapt(
      'field',
      'state',
      ['聚焦外环 3px、主色 25%', 'The focus ring is 3px at 25% of the primary'],
      [
        '3px、主色 20%，和其它组件库同一个颜色',
        '3px at 20%, the same color as the other libraries',
      ],
      'class',
    ),
    adapt(
      'button',
      'color',
      ['主按钮悬停 = 主色加 85% 透明度', 'Primary hover is the primary at 85% opacity'],
      ['读规范里的悬停色', 'Reads the spec hover color'],
      'class',
    ),
    adapt(
      'button',
      'type',
      ['大号按钮 15px 字', 'Large buttons use 15px text'],
      ['正文字号', 'The body size'],
      'class',
    ),
    adapt(
      'button',
      'size',
      ['加载图标 16px', 'The loading icon is 16px'],
      [
        '一个字高（1em），文字位置和其它组件库一样',
        'One em, so the label sits where the others do',
      ],
      'class',
    ),
    adapt(
      'link',
      'state',
      ['链接悬停加下划线', 'Links underline on hover'],
      ['换成链接悬停色，不加下划线', 'Change to the link hover color, no underline'],
      'class',
    ),
    adapt(
      'popup',
      'shape',
      [
        '选中项右边有对勾，选项左 8px、右 32px',
        'Selected options get a check; padding is 8px / 32px',
      ],
      ['选中浅底加粗，左右 12px，不用对勾', 'Light fill and medium weight, 12px padding, no check'],
      'class',
    ),
    adapt(
      'popup',
      'size',
      ['下拉至少 10rem 宽', 'The dropdown is at least 10rem wide'],
      ['至少和输入框一样宽，随内容', 'At least as wide as the trigger, sized to content'],
      'class',
    ),
    adapt(
      'select',
      'icon',
      ['下拉箭头是 lucide-react 的 ChevronDown', 'The select arrow is lucide-react’s ChevronDown'],
      ['规范图标集里的下拉箭头', 'The arrow from the spec’s icon set'],
      'class',
    ),
    adapt(
      'field',
      'icon',
      [
        '密码显隐是 lucide-react 的 Eye / EyeOff',
        'The password toggle uses lucide-react’s Eye / EyeOff',
      ],
      ['规范图标集里的显隐图标', 'The toggle icons from the spec’s icon set'],
      'class',
    ),
    adapt(
      'checkbox',
      'icon',
      ['对勾是 lucide-react 的 Check', 'The check is lucide-react’s Check'],
      ['规范图标集里的对勾', 'The check from the spec’s icon set'],
      'class',
    ),
    adapt(
      'button',
      'icon',
      ['加载图标是 lucide-react 的 Loader2', 'The loading icon is lucide-react’s Loader2'],
      ['规范图标集里的加载图标', 'The loading icon from the spec’s icon set'],
      'class',
    ),
    adapt(
      'button',
      'state',
      ['加载时和禁用一样降到 50% 不透明度', 'Loading fades to 50% like disabled'],
      ['按控件规格的加载不透明度', 'The spec’s loading opacity'],
      'class',
    ),
    adapt(
      'nav',
      'size',
      [
        '侧栏菜单项 32 高（h-8 p-2）、相邻隔 4、圆角 8，图标 16 和文字隔 8',
        'Sidebar items are 32px (h-8 p-2), 4px apart, 8px radius; 16px icon 8px from the text',
      ],
      [
        '项 36 高、隔 2、图标离左 12、和文字隔 10、圆角取控件圆角',
        '36px items, 2px apart, icon 12px from the left and 10px from the text, control radius',
      ],
      'class',
    ),
    adapt(
      'nav',
      'color',
      [
        '选中是浅灰底（sidebar-accent）加粗，字不变色；子菜单里有选中项时标题不变',
        'Active is a light gray fill (sidebar-accent) in medium weight, same text color; the parent title does not change',
      ],
      [
        '选中是选中面底 + 主色字、500；子菜单标题变主色',
        'Active uses the selected surface with primary text at 500; the parent title turns primary',
      ],
      'class',
    ),
    adapt(
      'nav',
      'shape',
      [
        '子菜单左边一条竖线、往里缩（mx-3.5 border-l px-2.5），子项 28 高',
        'Submenus have a left rail and are inset (mx-3.5 border-l px-2.5); sub-items are 28px',
      ],
      [
        '去掉竖线，子项和一级项一样高，文字和上一级的文字对齐',
        'No rail; sub-items match the top level height and align with the parent text',
      ],
      'class',
    ),
    adapt(
      'nav',
      'icon',
      [
        '子菜单箭头是 ChevronRight，展开时转 90°',
        'The submenu arrow is ChevronRight, turned 90° when open',
      ],
      [
        '规范图标集里的下拉箭头，离右 12，展开时转 180°',
        'The chevron-down from the spec’s icon set, 12px from the right, turned 180° when open',
      ],
      'class',
    ),
    adapt(
      'nav',
      'state',
      [
        '侧栏收起成图标（3rem = 48 宽、项 32×32）后不显示子菜单，只给一个文字提示',
        'The icon-only sidebar (3rem wide, 32×32 items) hides submenus and only shows a tooltip',
      ],
      [
        '收起 64 宽、项 48×36；鼠标悬停弹出子菜单（用 Radix Popover 拼，悬停打开不抢焦点）',
        '64px wide with 48×36 items; hovering opens the submenu (built from Radix Popover; hover does not steal focus)',
      ],
      'behavior',
    ),
    adapt(
      'nav',
      'shape',
      [
        '收起后的文字提示：深色底、12px、左右 12 上下 6、圆角 8，带小箭头，贴着菜单项',
        'Collapsed tooltip: dark fill, 12px, 12/6 padding, 8px radius, with an arrow, right next to the item',
      ],
      [
        '取控件规格的文字提示：左右 8 上下 4、控件圆角、没有小箭头，离侧栏右边缘 4',
        'The spec tooltip: 8/4 padding, control radius, no arrow, 4px off the sidebar edge',
      ],
      'class',
    ),
    adapt(
      'nav',
      'keyboard',
      ['聚焦是 2px 的 sidebar-ring 外圈', 'Focus is a 2px sidebar-ring outline'],
      ['控件规格的 3px 外圈', 'The 3px ring from the spec'],
      'class',
    ),
    adapt(
      'breadcrumb',
      'type',
      [
        '分隔符是 ChevronRight 图标（14px），间距 6（宽屏 10）',
        'The separator is a 14px ChevronRight, 6px apart (10px on wide screens)',
      ],
      ['文字「/」，左右各 8，占位符色', 'A “/” 8px on each side in the placeholder color'],
      'class',
    ),
    adapt(
      'breadcrumb',
      'a11y',
      [
        '当前页是 role=link + aria-disabled（读屏读成「不能用的链接」）',
        'The current page is role=link with aria-disabled (read as a disabled link)',
      ],
      ['只标 aria-current="page"，不是链接', 'Only aria-current="page"; not a link'],
      'behavior',
    ),
    adapt(
      'dropdown',
      'size',
      [
        '最小宽 128（min-w-[8rem]），项 32 高、左右 8，分隔线上下 4',
        'Min width 128 (min-w-[8rem]); 32px items with 8px padding; 4px around the divider',
      ],
      [
        '最小宽 160，项左右 12，图标和文字隔 8，外框取下拉的圆角、描边、阴影',
        'Min width 160, 12px item padding, 8px icon gap; the dropdown frame from the spec',
      ],
      'class',
    ),
    adapt(
      'dropdown',
      'color',
      ['危险项悬停是 10% 的红底', 'The destructive item hovers with a 10% red fill'],
      [
        '悬停和其他项一样是浅灰底，字和图标保持红色',
        'Hover is the same light gray; text and icon stay red',
      ],
      'class',
    ),
    adapt(
      'avatar',
      'size',
      [
        '32（size-8），muted 底，字跟着外面（14px）',
        '32px (size-8) on muted with inherited 14px text',
      ],
      ['28，选中面底，12px、500', '28px on the selected surface, 12px at 500'],
      'class',
    ),
    adapt(
      'badge',
      'shape',
      [
        'Badge 是标签：圆角 8、px-2 py-0.5、22 高、12px；没有「标在右上角的数字」',
        'Badge is a tag: 8px radius, px-2 py-0.5, 22px tall, 12px text; no corner count badge',
      ],
      [
        '16 高、全圆角、左右 4，中心对准被标注的东西的右上角（套件加定位）',
        '16px pill with 4px padding, centered on the corner of what it marks (positioned by the kit)',
      ],
      'class',
    ),
  ],
};
