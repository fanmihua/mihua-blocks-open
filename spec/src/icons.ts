import type { Localized } from './roles';

/**
 * 图标：设计通常用一套自己的图标，或者一套开源图标，而不是每个组件库各带的那套。
 *
 * 组件和套件从不直接引用某个图标库，只说「这里要一个下拉箭头」「这里要一个隐藏密码」——这是语义图标。
 * 规范里的 `icon.set` 决定用哪一套；每一套给每个语义图标一份图形数据。
 * 两个框架用同一份数据画 SVG（React 的 Icon、Vue 的 Icon）；组件库只能用 CSS 画的地方（比如 antd、
 * Element 复选框里的对勾）用同一份数据生成的 CSS 遮罩。换一套图标，五个组件库一起变。
 *
 * 加一套图标：在 ICON_SETS 里加一项，给每个 IconName 一份图形（24×24 画板）。
 */

export type IconName =
  | 'chevron-down'
  | 'chevron-left'
  | 'eye'
  | 'eye-off'
  | 'check'
  | 'loading'
  | 'qr'
  | 'monitor'
  | 'bell'
  | 'sidebar-collapse'
  | 'sidebar-expand'
  | 'user'
  | 'settings'
  | 'log-out'
  | 'home'
  | 'users'
  | 'trending-up'
  | 'chart'
  | 'chevron-up'
  | 'chevron-right'
  | 'chevrons-up-down'
  | 'minus'
  | 'inbox'
  | 'alert'
  | 'x'
  | 'calendar';

export const ICON_NAMES: IconName[] = [
  'chevron-down',
  'chevron-left',
  'eye',
  'eye-off',
  'check',
  'loading',
  'qr',
  'monitor',
  'bell',
  'sidebar-collapse',
  'sidebar-expand',
  'user',
  'settings',
  'log-out',
  'home',
  'users',
  'trending-up',
  'chart',
  'chevron-up',
  'chevron-right',
  'chevrons-up-down',
  'minus',
  'inbox',
  'alert',
  'x',
  'calendar',
];

/** 每个语义图标是做什么用的（文档读它）。 */
export const ICON_USAGE: Record<IconName, Localized> = {
  'chevron-down': { zh: '下拉箭头', en: 'Select arrow' },
  'chevron-left': { zh: '返回', en: 'Back' },
  eye: { zh: '密码可见', en: 'Password shown' },
  'eye-off': { zh: '密码隐藏', en: 'Password hidden' },
  check: { zh: '对勾：复选框、完成', en: 'Check mark' },
  loading: { zh: '加载中', en: 'Loading' },
  qr: { zh: '扫码登录', en: 'QR sign-in' },
  monitor: { zh: '回到账号登录', en: 'Back to form sign-in' },
  bell: { zh: '通知', en: 'Notifications' },
  'sidebar-collapse': { zh: '收起侧栏', en: 'Collapse sidebar' },
  'sidebar-expand': { zh: '展开侧栏', en: 'Expand sidebar' },
  user: { zh: '个人中心', en: 'Profile' },
  settings: { zh: '设置', en: 'Settings' },
  'log-out': { zh: '退出登录', en: 'Sign out' },
  home: { zh: '导航：工作台', en: 'Nav: home' },
  users: { zh: '导航：客户', en: 'Nav: customers' },
  'trending-up': { zh: '导航：销售', en: 'Nav: sales' },
  chart: { zh: '导航：分析', en: 'Nav: analytics' },
  'chevron-up': { zh: '升序（表头）', en: 'Sorted ascending' },
  'chevron-right': { zh: '下一页、下一个月', en: 'Next page / month' },
  'chevrons-up-down': { zh: '可以排序、还没排序（表头）', en: 'Sortable, unsorted' },
  minus: { zh: '复选框：部分选中', en: 'Checkbox: indeterminate' },
  inbox: { zh: '空状态', en: 'Empty state' },
  alert: { zh: '出错', en: 'Error' },
  x: { zh: '关闭对话框', en: 'Close dialog' },
  calendar: { zh: '日期选择', en: 'Date picker' },
};

/** 一个图形元素：标签名和属性，比如 ['path', { d: 'm6 9 6 6 6-6' }]。 */
export type IconNode = [tag: 'path' | 'circle' | 'rect' | 'line', attrs: Record<string, string>];

export interface IconSet {
  name: Localized;
  /** 出处和许可，随源码一起分发。 */
  source: string;
  /** 线宽（24×24 画板上的单位）。目前收录的都是线性图标。 */
  strokeWidth: number;
  glyphs: Record<IconName, IconNode[]>;
}

const path = (d: string): IconNode => ['path', { d }];

export const ICON_SETS = {
  /**
   * Lucide（https://lucide.dev），ISC 许可。
   * 图形数据摘自 lucide-react 0.523.0：chevron-down、chevron-left、eye、eye-off、check、
   * loader-circle、qr-code、monitor、bell、panel-left-close、panel-left-open、user、settings、
   * log-out、house、users、trending-up、chart-column、chevron-up、chevron-right、chevrons-up-down、
   * minus、inbox、circle-alert、x、calendar。
   */
  lucide: {
    name: { zh: 'Lucide（开源图标）', en: 'Lucide (open source)' },
    source: 'Lucide, ISC License, https://lucide.dev',
    strokeWidth: 2,
    glyphs: {
      'chevron-down': [path('m6 9 6 6 6-6')],
      'chevron-left': [path('m15 18-6-6 6-6')],
      eye: [
        path(
          'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0',
        ),
        ['circle', { cx: '12', cy: '12', r: '3' }],
      ],
      'eye-off': [
        path(
          'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49',
        ),
        path('M14.084 14.158a3 3 0 0 1-4.242-4.242'),
        path(
          'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143',
        ),
        path('m2 2 20 20'),
      ],
      check: [path('M20 6 9 17l-5-5')],
      loading: [path('M21 12a9 9 0 1 1-6.219-8.56')],
      qr: [
        ['rect', { width: '5', height: '5', x: '3', y: '3', rx: '1' }],
        ['rect', { width: '5', height: '5', x: '16', y: '3', rx: '1' }],
        ['rect', { width: '5', height: '5', x: '3', y: '16', rx: '1' }],
        path('M21 16h-3a2 2 0 0 0-2 2v3'),
        path('M21 21v.01'),
        path('M12 7v3a2 2 0 0 1-2 2H7'),
        path('M3 12h.01'),
        path('M12 3h.01'),
        path('M12 16v.01'),
        path('M16 12h1'),
        path('M21 12v.01'),
        path('M12 21v-1'),
      ],
      monitor: [
        ['rect', { width: '20', height: '14', x: '2', y: '3', rx: '2' }],
        ['line', { x1: '8', x2: '16', y1: '21', y2: '21' }],
        ['line', { x1: '12', x2: '12', y1: '17', y2: '21' }],
      ],
      bell: [
        path('M10.268 21a2 2 0 0 0 3.464 0'),
        path(
          'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326',
        ),
      ],
      'sidebar-collapse': [
        ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }],
        path('M9 3v18'),
        path('m16 15-3-3 3-3'),
      ],
      'sidebar-expand': [
        ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }],
        path('M9 3v18'),
        path('m14 9 3 3-3 3'),
      ],
      user: [
        path('M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'),
        ['circle', { cx: '12', cy: '7', r: '4' }],
      ],
      settings: [
        path(
          'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
        ),
        ['circle', { cx: '12', cy: '12', r: '3' }],
      ],
      'log-out': [
        path('m16 17 5-5-5-5'),
        path('M21 12H9'),
        path('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'),
      ],
      home: [
        path('M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'),
        path(
          'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
        ),
      ],
      users: [
        path('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'),
        path('M16 3.128a4 4 0 0 1 0 7.744'),
        path('M22 21v-2a4 4 0 0 0-3-3.87'),
        ['circle', { cx: '9', cy: '7', r: '4' }],
      ],
      'trending-up': [path('M16 7h6v6'), path('m22 7-8.5 8.5-5-5L2 17')],
      chart: [
        path('M3 3v16a2 2 0 0 0 2 2h16'),
        path('M18 17V9'),
        path('M13 17V5'),
        path('M8 17v-3'),
      ],
      'chevron-up': [path('m18 15-6-6-6 6')],
      'chevron-right': [path('m9 18 6-6-6-6')],
      'chevrons-up-down': [path('m7 15 5 5 5-5'), path('m7 9 5-5 5 5')],
      minus: [path('M5 12h14')],
      inbox: [
        path('M22 12h-6l-2 3h-4l-2-3H2'),
        path(
          'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
        ),
      ],
      alert: [
        ['circle', { cx: '12', cy: '12', r: '10' }],
        ['line', { x1: '12', x2: '12', y1: '8', y2: '12' }],
        ['line', { x1: '12', x2: '12.01', y1: '16', y2: '16' }],
      ],
      x: [path('M18 6 6 18'), path('m6 6 12 12')],
      calendar: [
        path('M8 2v4'),
        path('M16 2v4'),
        ['rect', { width: '18', height: '18', x: '3', y: '4', rx: '2' }],
        path('M3 10h18'),
      ],
    },
  },
  /** Mihua 自绘：细线、圆角端点；隐藏密码画成闭着的眼睛。代表「设计自己画的一套」。 */
  mihua: {
    name: { zh: 'Mihua 自绘', en: 'Mihua (custom)' },
    source: 'Mihua Blocks',
    strokeWidth: 1.6,
    glyphs: {
      'chevron-down': [path('m7 10 5 5 5-5')],
      'chevron-left': [path('m15 6-6 6 6 6')],
      eye: [
        path(
          'M2.5 12c2.3-4.2 5.6-6.5 9.5-6.5s7.2 2.3 9.5 6.5c-2.3 4.2-5.6 6.5-9.5 6.5S4.8 16.2 2.5 12Z',
        ),
        ['circle', { cx: '12', cy: '12', r: '2.5' }],
      ],
      'eye-off': [
        path('M3 10c2.4 3 5.4 4.5 9 4.5s6.6-1.5 9-4.5'),
        path('m6.6 13.2-1.4 2.4M12 14.5v2.8M17.4 13.2l1.4 2.4'),
      ],
      check: [path('m5 12 5 5 9-10')],
      loading: [path('M12 3a9 9 0 1 0 9 9')],
      qr: [
        ['rect', { x: '3', y: '3', width: '7', height: '7', rx: '1' }],
        ['rect', { x: '14', y: '3', width: '7', height: '7', rx: '1' }],
        ['rect', { x: '3', y: '14', width: '7', height: '7', rx: '1' }],
        path('M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3'),
      ],
      monitor: [
        ['rect', { x: '2', y: '4', width: '20', height: '13', rx: '2' }],
        path('M8 21h8M12 17v4'),
      ],
      bell: [
        path('M6 16.5V10.5a6 6 0 0 1 12 0v6l1.5 1.5h-15Z'),
        path('M10 20.5a2.2 2.2 0 0 0 4 0'),
      ],
      'sidebar-collapse': [
        ['rect', { x: '3', y: '4', width: '18', height: '16', rx: '2' }],
        path('M9 4v16M15.5 9.5 13 12l2.5 2.5'),
      ],
      'sidebar-expand': [
        ['rect', { x: '3', y: '4', width: '18', height: '16', rx: '2' }],
        path('M9 4v16M13 9.5l2.5 2.5-2.5 2.5'),
      ],
      user: [
        ['circle', { cx: '12', cy: '8', r: '3.5' }],
        path('M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5'),
      ],
      settings: [
        ['circle', { cx: '12', cy: '12', r: '3' }],
        ['circle', { cx: '12', cy: '12', r: '6.5' }],
        path(
          'M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1',
        ),
      ],
      'log-out': [
        path('M10 4.5H6A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h4'),
        path('M14 8l4 4-4 4M18 12H9.5'),
      ],
      home: [path('M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1Z')],
      users: [
        ['circle', { cx: '9', cy: '8.5', r: '3' }],
        path('M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8'),
        path('M15.5 5.8a3 3 0 0 1 0 5.4M17.5 14.6c1.6.6 2.7 2.1 3 4.4'),
      ],
      'trending-up': [path('M3.5 17 9 11.5l4 4 7.5-7.5'), path('M15 8h5.5v5.5')],
      chart: [path('M4 4v15a1 1 0 0 0 1 1h15'), path('M9 16v-4M13.5 16V8M18 16v-6')],
      'chevron-up': [path('m7 14 5-5 5 5')],
      'chevron-right': [path('m9 6 6 6-6 6')],
      'chevrons-up-down': [path('m8 15 4 4 4-4'), path('m8 9 4-4 4 4')],
      minus: [path('M6 12h12')],
      inbox: [
        path('M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5'),
        path('M3.5 13.5 6 6h12l2.5 7.5V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1Z'),
      ],
      alert: [['circle', { cx: '12', cy: '12', r: '8.5' }], path('M12 8v5M12 16v.01')],
      x: [path('M7 7l10 10M17 7 7 17')],
      calendar: [
        ['rect', { x: '3.5', y: '5', width: '17', height: '15', rx: '2' }],
        path('M3.5 10h17M8 3v4M16 3v4'),
      ],
    },
  },
} satisfies Record<string, IconSet>;

export type IconSetId = keyof typeof ICON_SETS;
export const ICON_SET_IDS = Object.keys(ICON_SETS) as IconSetId[];
export const DEFAULT_ICON_SET: IconSetId = 'lucide';

/**
 * icon.set 还可以写 native：不换图标，四个组件库各用自己带的那套（用来对比）。
 * 组件库没有对应图标的地方（扫码入口、返回），仍然用默认的那一套。
 */
export const NATIVE_ICONS = 'native';
export type IconChoice = IconSetId | typeof NATIVE_ICONS;
export const ICON_CHOICES: Array<{ id: IconChoice; name: Localized }> = [
  { id: NATIVE_ICONS, name: { zh: '组件库自带', en: 'Library icons' } },
  ...ICON_SET_IDS.map((id) => ({ id, name: ICON_SETS[id].name })),
];

/** 套件要不要把组件库的图标换成规范图标集里的。 */
export const swapsIcons = (choice: string | undefined) => choice !== NATIVE_ICONS;

export const iconSetOf = (id: string | undefined): IconSet =>
  ICON_SETS[(id && id in ICON_SETS ? id : DEFAULT_ICON_SET) as IconSetId];

const escape = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** 一个图标的 SVG 文本（CSS 遮罩用）。strokeWidth 不给就用这一套的线宽。 */
export function iconSvg(setId: string | undefined, name: IconName, strokeWidth?: number): string {
  const set = iconSetOf(setId);
  const body = set.glyphs[name]
    .map(
      ([tag, attrs]) =>
        `<${tag} ${Object.entries(attrs)
          .map(([k, v]) => `${k}="${escape(v)}"`)
          .join(' ')}/>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="${strokeWidth ?? set.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" data-mh-icon="${name}">${body}</svg>`;
}

/** 写成 CSS 的 url(...)，给 mask-image 用。 */
export const iconUrl = (setId: string | undefined, name: IconName, strokeWidth?: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(iconSvg(setId, name, strokeWidth))}")`;

/**
 * 组件库用 CSS 画的图标，换成规范里的那一套：生成 --mh-icon-<名字> 变量，套件的样式表用它做遮罩。
 * 复选框里的对勾画得粗一些（线宽 × 1.5），在 12px 的小尺寸下才看得清。
 */
export function iconCssVariables(setId: string | undefined): Record<string, string> {
  const set = iconSetOf(setId);
  return {
    '--mh-icon-check': iconUrl(setId, 'check', set.strokeWidth * 1.5),
    '--mh-icon-chevron-down': iconUrl(setId, 'chevron-down'),
    // 复选框「部分选中」里的短横：和对勾一样加粗
    '--mh-icon-minus': iconUrl(setId, 'minus', set.strokeWidth * 1.5),
  };
}
