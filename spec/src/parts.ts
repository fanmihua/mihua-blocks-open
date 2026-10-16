import type { Localized } from './roles';

/**
 * 部件地图：自动检查要量「用户看得见的那个框」，而它在每个组件库里是不同的元素——
 * 输入框的外框，antd 是 .ant-input-affix-wrapper，Element 是 .el-input__wrapper，shadcn 是我们自己写的 div。
 *
 * 每个套件登记一份「部件名 → 选择器」，检查工具只按部件名找，自己不认识任何组件库。
 * 接一个新组件库 = 套件里多写一份部件地图；检查工具一行不改。
 * 给套件加一个新控件 = 在这里加部件名，每个套件补上它的选择器（漏了 TypeScript 会报错）。
 */
export type PartName =
  | 'field'
  | 'select'
  | 'checkbox'
  | 'button'
  | 'tabIndicator'
  | 'popup'
  | 'option'
  | 'switch'
  | 'switchThumb'
  | 'menuItem'
  | 'menuPopup'
  | 'breadcrumbLink'
  | 'dropdown'
  | 'dropdownItem'
  | 'avatar'
  | 'badge'
  | 'tooltip'
  | 'tableHead'
  | 'tableCell'
  | 'tableSort'
  | 'tag'
  | 'pageItem'
  | 'dateRange'
  | 'datePopup'
  | 'dateCell'
  | 'dialog'
  | 'radio'
  | 'textarea';

/**
 * 一个部件在组件库里的位置：一个 CSS 选择器；
 * 或者组件库用伪元素画的（比如 shadcn 标签栏的指示条是选中标签的 ::after），写成 { selector, pseudo }。
 * 伪元素按「绝对定位在宿主元素里」来量：位置取它的 left / top，大小取它的 width / height。
 */
export type PartSelector = string | { selector: string; pseudo: '::before' | '::after' };

export type PartMap = Record<PartName, PartSelector>;

/** 部件是什么（检查报告和文档读它）。 */
export const PART_NAMES: Record<PartName, Localized> = {
  field: { zh: '输入框外框', en: 'Input frame' },
  select: { zh: '选择框', en: 'Select trigger' },
  checkbox: { zh: '复选框方块', en: 'Checkbox box' },
  button: { zh: '按钮（不含文字链接）', en: 'Button (not links)' },
  tabIndicator: { zh: '标签栏指示条', en: 'Tab indicator' },
  popup: { zh: '下拉弹层', en: 'Dropdown' },
  option: { zh: '下拉选项', en: 'Dropdown option' },
  switch: { zh: '开关的轨道', en: 'Switch track' },
  switchThumb: { zh: '开关的圆点', en: 'Switch thumb' },
  menuItem: {
    zh: '导航菜单项（含子菜单标题、收起后弹层里的项）：有底色、圆角的那个框，也是键盘聚焦的那个元素',
    en: 'Navigation item (including submenu titles and items in the collapsed flyout)',
  },
  menuPopup: { zh: '侧栏收起后悬停弹出的子菜单弹层', en: 'Collapsed submenu flyout' },
  breadcrumbLink: { zh: '面包屑里能点的上级', en: 'Breadcrumb link' },
  dropdown: { zh: '下拉菜单弹层', en: 'Dropdown menu' },
  dropdownItem: { zh: '下拉菜单的项', en: 'Dropdown menu item' },
  avatar: { zh: '头像', en: 'Avatar' },
  badge: { zh: '徽标（数字）', en: 'Badge (count)' },
  tooltip: { zh: '文字提示：有底色的那个框（不含小箭头）', en: 'Tooltip box (without the arrow)' },
  tableHead: { zh: '表头的格子（含勾选列）', en: 'Table header cell' },
  tableCell: {
    zh: '表格的格子（含勾选列）：行的底色、行之间的分隔线画在它上面',
    en: 'Table body cell (row fill and divider)',
  },
  tableSort: {
    zh: '表头里的排序按钮（文字加排序图标）：键盘聚焦的那个元素',
    en: 'Sort button in a header cell',
  },
  tag: { zh: '状态标签', en: 'Status tag' },
  pageItem: { zh: '分页的项（页码、上一页、下一页）', en: 'Pagination item' },
  dateRange: { zh: '日期范围的触发框（两个框外面那一圈）', en: 'Date range trigger' },
  datePopup: { zh: '日期范围的弹层（两个月的面板）', en: 'Date range panel' },
  dateCell: { zh: '日期面板里的一天：有底色的那个框', en: 'Day cell' },
  dialog: { zh: '对话框的框', en: 'Dialog' },
  radio: { zh: '单选的圆圈', en: 'Radio circle' },
  textarea: { zh: '多行输入框外框', en: 'Textarea frame' },
};
