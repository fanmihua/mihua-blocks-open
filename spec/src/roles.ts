/**
 * 语义角色（Semantic roles）
 *
 * 组件从不直接写「#0A0A0A」或「6px」，只说「我要主操作的颜色」「我要控件圆角」。
 * 规范（Spec）负责给每个角色赋值，各组件库的主题接口再从角色取值。
 * 换一份规范，所有组件、所有技术栈一起变——这就是「表皮可塑」。
 */
export type Locale = 'zh' | 'en';
export type Localized = Record<Locale, string>;
export type RoleKind = 'color' | 'length' | 'duration' | 'font' | 'icons';
export type RoleGroup =
  | 'action'
  | 'text'
  | 'surface'
  | 'border'
  | 'feedback'
  | 'shape'
  | 'size'
  | 'type'
  | 'icon'
  | 'motion';

export interface RoleDefinition {
  kind: RoleKind;
  group: RoleGroup;
  /** 默认值，即黑白规范（Mono）的取值；其他规范只覆盖自己关心的角色。 */
  fallback: string;
  label: Localized;
  usage: Localized;
  /** 长度或时长的合法范围，单位分别是 px 与 ms。 */
  range?: [number, number];
}

const color = (fallback: string, group: RoleGroup, label: Localized, usage: Localized) =>
  ({ kind: 'color', group, fallback, label, usage }) satisfies RoleDefinition;
const length = (
  fallback: number,
  group: RoleGroup,
  range: [number, number],
  label: Localized,
  usage: Localized,
) =>
  ({
    kind: 'length',
    group,
    fallback: `${fallback}px`,
    range,
    label,
    usage,
  }) satisfies RoleDefinition;

export const ROLES = {
  'action.primary': color(
    '#0A0A0A',
    'action',
    { zh: '主操作', en: 'Primary action' },
    {
      zh: '主按钮、选中态、焦点。一个区域里只出现一次。',
      en: 'Primary buttons, selection and focus. Once per area.',
    },
  ),
  'action.primaryHover': color(
    '#333333',
    'action',
    { zh: '主操作悬停', en: 'Primary hover' },
    {
      zh: '主按钮悬停与按下时的颜色。',
      en: 'Primary button hover and pressed state.',
    },
  ),
  'action.onPrimary': color(
    '#FFFFFF',
    'action',
    { zh: '主操作上的文字', en: 'On primary' },
    {
      zh: '实色主按钮上的文字与图标。',
      en: 'Text and icons placed on the primary color.',
    },
  ),
  'text.strong': color(
    '#0A0A0A',
    'text',
    { zh: '标题', en: 'Strong text' },
    {
      zh: '标题与关键数值。',
      en: 'Headings and key figures.',
    },
  ),
  'text.body': color(
    '#262626',
    'text',
    { zh: '正文', en: 'Body text' },
    {
      zh: '正文、菜单项与可操作内容。',
      en: 'Body copy, menu items and actionable content.',
    },
  ),
  'text.secondary': color(
    '#737373',
    'text',
    { zh: '说明文字', en: 'Secondary text' },
    {
      zh: '说明、辅助信息。',
      en: 'Descriptions and supporting information.',
    },
  ),
  'text.placeholder': color(
    '#A3A3A3',
    'text',
    { zh: '占位文字', en: 'Placeholder' },
    {
      zh: '输入框占位提示；不能承载必须阅读的信息。',
      en: 'Input placeholders; never required information.',
    },
  ),
  'text.disabled': color(
    '#C4C4C4',
    'text',
    { zh: '禁用文字', en: 'Disabled text' },
    {
      zh: '不可操作的内容。',
      en: 'Content that cannot be interacted with.',
    },
  ),
  'text.link': color(
    '#0A0A0A',
    'text',
    { zh: '链接', en: 'Link' },
    {
      zh: '文字链接；黑白规范下靠下划线区分。',
      en: 'Text links; underlined in the mono spec.',
    },
  ),
  'surface.canvas': color(
    '#F5F5F5',
    'surface',
    { zh: '画布', en: 'Canvas' },
    {
      zh: '组件所在页面的底色。',
      en: 'The page background behind components.',
    },
  ),
  'surface.base': color(
    '#FFFFFF',
    'surface',
    { zh: '面板', en: 'Surface' },
    {
      zh: '卡片、弹层与输入框的底色。',
      en: 'Cards, overlays and input backgrounds.',
    },
  ),
  'surface.subtle': color(
    '#F5F5F5',
    'surface',
    { zh: '次级面', en: 'Subtle surface' },
    {
      zh: '面板内的分区、拖放区、二维码区。',
      en: 'Sections inside a panel, drop zones, QR area.',
    },
  ),
  'surface.hover': color(
    '#F0F0F0',
    'surface',
    { zh: '悬停面', en: 'Hover surface' },
    {
      zh: '列表项与次操作的悬停反馈。',
      en: 'Hover feedback for list items and secondary actions.',
    },
  ),
  'surface.selected': color(
    '#EBEBEB',
    'surface',
    { zh: '选中面', en: 'Selected surface' },
    {
      zh: '选中的标签、菜单项底色。',
      en: 'Background of selected tabs and menu items.',
    },
  ),
  'border.default': color(
    '#E5E5E5',
    'border',
    { zh: '分隔线', en: 'Divider' },
    {
      zh: '卡片边缘与分隔线。',
      en: 'Card edges and dividers.',
    },
  ),
  'border.control': color(
    '#D4D4D4',
    'border',
    { zh: '控件边框', en: 'Control border' },
    {
      zh: '输入框、复选框等可交互控件的边框。',
      en: 'Borders of inputs, checkboxes and other controls.',
    },
  ),
  'feedback.danger': color(
    '#DC2626',
    'feedback',
    { zh: '错误', en: 'Danger' },
    {
      zh: '阻断性错误；必须同时有文字说明。',
      en: 'Blocking errors; always paired with text.',
    },
  ),
  'feedback.success': color(
    '#16A34A',
    'feedback',
    { zh: '成功', en: 'Success' },
    {
      zh: '操作成功的结果反馈。',
      en: 'Successful outcomes.',
    },
  ),
  'feedback.warning': color(
    '#D97706',
    'feedback',
    { zh: '警告', en: 'Warning' },
    {
      zh: '需要注意但不阻断的情况。',
      en: 'Non-blocking situations that need attention.',
    },
  ),
  'radius.control': length(
    6,
    'shape',
    [0, 20],
    { zh: '控件圆角', en: 'Control radius' },
    {
      zh: '输入框、按钮、复选框。',
      en: 'Inputs, buttons and checkboxes.',
    },
  ),
  'radius.panel': length(
    12,
    'shape',
    [0, 32],
    { zh: '面板圆角', en: 'Panel radius' },
    {
      zh: '卡片与弹层。',
      en: 'Cards and overlays.',
    },
  ),
  'size.control': length(
    32,
    'size',
    [28, 48],
    { zh: '控件高度', en: 'Control height' },
    {
      zh: '默认一档：后台页面（筛选栏、表格、对话框）里按钮、输入框、选择框的高度。黑白规范取紧凑密度 32px。',
      en: 'Default size: buttons, inputs and selects in admin pages (filters, tables, dialogs).',
    },
  ),
  'size.controlLarge': length(
    40,
    'size',
    [32, 56],
    { zh: '大号控件高度', en: 'Large control height' },
    {
      zh: '大号一档：登录这类关键表单里的按钮、输入框、选择框。',
      en: 'Large size: buttons, inputs and selects in key forms such as sign-in.',
    },
  ),
  'space.field': length(
    16,
    'size',
    [8, 32],
    { zh: '字段间距', en: 'Field spacing' },
    {
      zh: '相邻表单字段之间的距离。',
      en: 'Distance between adjacent form fields.',
    },
  ),
  'space.panel': length(
    32,
    'size',
    [16, 56],
    { zh: '面板内边距', en: 'Panel padding' },
    {
      zh: '卡片内容到边缘的距离。',
      en: 'Distance from card content to its edge.',
    },
  ),
  'type.body': length(
    14,
    'type',
    [12, 18],
    { zh: '正文字号', en: 'Body size' },
    {
      zh: '正文与控件文字。',
      en: 'Body copy and control text.',
    },
  ),
  'type.small': length(
    12,
    'type',
    [11, 14],
    { zh: '辅助字号', en: 'Small size' },
    {
      zh: '提示、错误说明与次要信息。',
      en: 'Hints, error messages and secondary details.',
    },
  ),
  'type.title': length(
    22,
    'type',
    [18, 32],
    { zh: '标题字号', en: 'Title size' },
    {
      zh: '组件主标题。',
      en: 'Component titles.',
    },
  ),
  'font.sans': {
    kind: 'font',
    group: 'type',
    fallback:
      "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', 'Microsoft YaHei', sans-serif",
    label: { zh: '字体', en: 'Font family' },
    usage: {
      zh: '界面字体；规范只写名称，不自动下载字体文件。',
      en: 'UI font stack; specs name fonts but never download them.',
    },
  },
  'icon.set': {
    kind: 'icons',
    group: 'icon',
    fallback: 'lucide',
    label: { zh: '图标集', en: 'Icon set' },
    usage: {
      zh: '整套界面用的图标：下拉箭头、密码显隐、对勾、加载等，不用组件库各自带的图标。写 native 表示保留各组件库自带的（用来对比）。',
      en: 'The icons used across the UI (select arrow, password toggle, check, loading) instead of each library’s own. native keeps each library’s icons (for comparison).',
    },
  },
  'size.icon': length(
    16,
    'icon',
    [12, 24],
    { zh: '图标尺寸', en: 'Icon size' },
    {
      zh: '控件里的图标，比如下拉箭头和密码显隐按钮。',
      en: 'Icons inside controls, such as the select arrow and the password toggle.',
    },
  ),
  'motion.duration': {
    kind: 'duration',
    group: 'motion',
    fallback: '150ms',
    range: [0, 400],
    label: { zh: '动效时长', en: 'Motion duration' },
    usage: {
      zh: '局部状态切换；系统开启「减少动态效果」时归零。',
      en: 'Local state transitions; zero when reduced motion is on.',
    },
  },
} as const satisfies Record<string, RoleDefinition>;

export type RoleId = keyof typeof ROLES;
export const ROLE_IDS = Object.keys(ROLES) as RoleId[];

/** `action.primary` → `--mh-action-primary`。CSS 变量名是公开契约，不随意改名。 */
export function cssVar(id: RoleId): `--mh-${string}` {
  return `--mh-${id.replace(/\./g, '-').replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}
