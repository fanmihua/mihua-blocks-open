import { tint } from './color';
import { px, type ResolvedTokens } from './spec';

/**
 * 控件规格：接上规范之后，所有组件库要对齐到的同一份控件设计。
 *
 * 规范（Design.md）只给出取值，比如主色、控件高度、圆角。同一个取值在每个组件库里由不同的规则
 * 决定（antd 的标签高度是上下内边距加一行文字，Element 是 CSS 变量，Arco 是固定档位，shadcn 是类名），
 * 每个组件库还有自己的默认长相（Arco 的灰底输入框、shadcn 的胶囊标签栏、Element 的 14px 复选框）。
 * 这里写清楚每种控件用哪些取值、怎么组合；套件只读这里：
 * - antd 读数值，交给主题 token 和组件 token；
 * - Element、Arco、shadcn、TDesign 读同名的 CSS 变量（--mh-c-*，由 controlCssVariables 生成）。
 * 改这里一处，所有组件库一起变。
 *
 * 尺寸两档：按钮、输入框、选择框都有「默认」和「大号」两档，套件按控件的 size 属性取对应的一档。
 * - 默认：后台页面（筛选栏、表格、对话框），高度是规范的 size.control（黑白规范 32px）；
 * - 大号：登录这类关键表单，高度是规范的 size.controlLarge。
 * 两档只差高度和按钮的左右留白（button.inset / insetLarge），字号、圆角、颜色都一样。
 */
export interface ControlSpec {
  /** 控件里的文字：字号、一行的高度。 */
  text: { size: number; line: number };
  /** 键盘聚焦：控件外一圈浅色外环。 */
  focus: { ring: number; ringColor: string };
  /** 输入框、选择框：白底、1px 描边，文字离外边框 inset。 */
  field: {
    inset: number;
    background: string;
    border: string;
    borderFocus: string;
    borderInvalid: string;
  };
  /** 标签栏：下划线样式。 */
  tabs: {
    height: number;
    gap: number;
    indicator: number;
    divider: string;
    color: string;
    hoverColor: string;
    activeColor: string;
    weight: number;
    activeWeight: number;
  };
  /** 复选框。 */
  checkbox: {
    size: number;
    radius: number;
    gap: number;
    border: string;
    borderInvalid: string;
    checked: string;
    mark: string;
    /** 禁用（比如没有行时表头的复选框）：底色。 */
    disabledBackground: string;
  };
  /** 按钮：主按钮和次要按钮（白底描边）。 */
  button: {
    weight: number;
    iconGap: number;
    /** 文字离按钮外边框的距离（含 1px 边框）：默认一档。 */
    inset: number;
    /** 同上，大号一档。 */
    insetLarge: number;
    /** 加载中：整个按钮的不透明度（不盖白色遮罩，不换底色）。 */
    loadingOpacity: number;
    secondaryBackground: string;
    secondaryBorder: string;
    secondaryColor: string;
    secondaryHoverBackground: string;
    secondaryHoverColor: string;
  };
  /** 文字链接：只占一行文字高。 */
  link: { weight: number; color: string; hoverColor: string };
  /**
   * 开关：轨道加圆点。开是主色，关是控件边框色；鼠标悬停不变色；禁用时整个变浅。
   * 按参照的后台（基于 Ant Design：antd 默认的 44×22、圆点 18）定，2026-10-11 设计师确认定稿。
   */
  switch: {
    width: number;
    height: number;
    /** 圆点的直径。 */
    thumb: number;
    /** 圆点离轨道边缘的距离。 */
    thumbInset: number;
    onBackground: string;
    offBackground: string;
    thumbColor: string;
    thumbShadow: string;
    /** 禁用：整个开关的不透明度。 */
    disabledOpacity: number;
  };
  /**
   * 图标：用规范选定的那一套（icon.set），不用组件库自带的。
   * size 是控件里图标的大小；color 是下拉箭头、密码显隐这类辅助图标的颜色；
   * check 是复选框里对勾的大小。
   */
  icon: { set: string; size: number; color: string; check: number };
  /**
   * 导航菜单（后台页面的侧栏）。一级项带图标；子菜单里的项不带图标，文字和上一级的文字对齐。
   * 侧栏收起时只显示图标，子菜单变成鼠标悬停时弹出的弹层（弹层外框和选项取 popup 一组）。
   * 第一版（2026-10-11）：按参照的后台（一个基于 Ant Design 的客户经营后台的侧栏：36px 高的项、
   * 选中是浅底加深色字）定，等设计师在演示页里看。侧栏宽度（展开 220、收起 64）归页面布局。
   */
  nav: {
    /** 菜单四周的留白：菜单项离侧栏边缘的距离。 */
    padding: number;
    itemHeight: number;
    /** 上下相邻两项之间的距离。 */
    itemGap: number;
    /** 一级项：图标离菜单项左边缘的距离。 */
    itemInset: number;
    radius: number;
    iconSize: number;
    /** 图标和文字之间的距离。 */
    iconGap: number;
    /** 子菜单里的项：文字离菜单项左边缘的距离（= itemInset + iconSize + iconGap，和上一级的文字对齐）。 */
    subInset: number;
    weight: number;
    color: string;
    iconColor: string;
    hoverBackground: string;
    hoverColor: string;
    selectedBackground: string;
    selectedColor: string;
    selectedWeight: number;
    /** 子菜单里有选中的项时，子菜单标题的文字和图标颜色（展开时）；收起时它画成选中的样子。 */
    parentSelectedColor: string;
    /** 子菜单的展开箭头（规范图标集的 chevron-down，大小、颜色取 icon 一组）：离菜单项右边缘的距离；展开时朝上。 */
    arrowInset: number;
    /** 收起后弹出的子菜单：最小宽度。左边离侧栏右边缘 popup.offset，顶边和菜单项对齐。 */
    popupMinWidth: number;
  };
  /**
   * 面包屑：能点的上级是次要灰，悬停变深；当前页是强调色；中间用「/」隔开。
   * 第一版（2026-10-11），按参照项目（antd 默认的面包屑）定。
   */
  breadcrumb: {
    color: string;
    hoverColor: string;
    currentColor: string;
    currentWeight: number;
    /** 分隔符（文字）。 */
    separator: string;
    separatorColor: string;
    /** 分隔符左右两边的距离。 */
    separatorGap: number;
    /** 能点的上级：圆角（键盘聚焦时外圈跟着它画）；不加底色、不加内边距。 */
    radius: number;
  };
  /**
   * 下拉菜单（比如顶栏的用户菜单）：外框、选项高度、悬停和选中取 popup 一组，这里只写它多出来的。
   * 弹层右边和触发它的按钮右边对齐，离按钮 popup.offset。
   */
  dropdown: {
    minWidth: number;
    iconGap: number;
    color: string;
    iconColor: string;
    /** 危险操作（退出登录）：文字和图标的颜色。 */
    dangerColor: string;
    /** 分隔线：颜色；上下各留 popup.padding。 */
    divider: string;
  };
  /**
   * 文字提示：鼠标悬停时显示名字（侧栏收起以后，没有子菜单的一级项）。深色底、白字、没有小箭头；
   * 在被提示的东西右边，左边离侧栏右边缘 popup.offset，上下居中。第一版（2026-10-11）。
   */
  tooltip: {
    background: string;
    color: string;
    fontSize: number;
    line: number;
    /** 文字离左右边缘。 */
    insetX: number;
    /** 文字离上下边缘。 */
    insetY: number;
    radius: number;
  };
  /** 头像：圆形，显示名字的第一个字。第一版（2026-10-11）。 */
  avatar: {
    size: number;
    background: string;
    color: string;
    fontSize: number;
    weight: number;
  };
  /**
   * 徽标：数字（超过 99 显示 99+）。圆角胶囊，中心对准它所标注的东西（比如铃铛图标）的右上角。
   * 第一版（2026-10-11）。
   */
  badge: {
    height: number;
    minWidth: number;
    /** 数字离左右边缘的距离（两位数以上时撑开）。 */
    inset: number;
    fontSize: number;
    weight: number;
    background: string;
    color: string;
  };
  /**
   * 表格：表头浅底、行与行之间一条分隔线，没有竖线和外框；悬停的行、勾选的行换底色。
   * 勾选列固定宽，复选框在格子里居中（复选框本身取 checkbox 一组；部分选中是主色底加白色短横，图标集的 minus）。
   * 能排序的列：表头文字和排序图标一起是一个按钮（图标在文字右边 sortGap；没排序 chevrons-up-down、
   * 升序 chevron-up、降序 chevron-down，大小取 icon.size），th 上写 aria-sort。
   * 加载中：表头和行一起变浅（loadingOpacity，不盖白色遮罩），表格中间一个加载图标（loadingIcon 大小、主色）。
   * 空状态：整行一个格子，格子不留白，里面的内容（图标、文字、高度）由页面给。
   * 第一版（2026-10-11）：按参照的后台（它的业务表格：表头 40 高、12px 灰字，
   * 行 44 高，格子左右 16，勾选列 48）定，等设计师在演示页里看。
   */
  table: {
    headHeight: number;
    rowHeight: number;
    /** 文字离格子左右边缘的距离（勾选列除外，复选框居中）。 */
    cellInset: number;
    headBackground: string;
    headColor: string;
    headSize: number;
    headWeight: number;
    color: string;
    /** 行与行之间、表头下面的分隔线。 */
    divider: string;
    hoverBackground: string;
    selectedBackground: string;
    /** 勾选列的宽度。 */
    selectionWidth: number;
    /** 排序图标离表头文字的距离。 */
    sortGap: number;
    /** 排序图标：没排序时的颜色；排了序的颜色。 */
    sortColor: string;
    sortActiveColor: string;
    /** 排序按钮的圆角（键盘聚焦时外圈跟着它画）。 */
    sortRadius: number;
    loadingOpacity: number;
    loadingIcon: number;
    loadingColor: string;
  };
  /**
   * 分页：「共 N 条」在左，页码和上一页、下一页在右。每一项是一个方块（最小宽度 = 高度），
   * 当前页是主色描边加主色字；上一页、下一页用图标集的 chevron-left / chevron-right。
   * 第一版（2026-10-11）：按参照项目（antd 默认的分页）定。
   */
  pagination: {
    itemSize: number;
    /** 多位数页码：数字离方块左右边缘的最小距离。 */
    itemInset: number;
    /** 相邻两项之间的距离。 */
    gap: number;
    radius: number;
    color: string;
    hoverBackground: string;
    activeColor: string;
    activeBorder: string;
    activeBackground: string;
    activeWeight: number;
    disabledColor: string;
    /** 「共 N 条」：颜色、离第一项的距离。 */
    totalColor: string;
    totalGap: number;
  };
  /**
   * 状态标签：浅色底加同色系的字，没有描边。四种色调：默认（灰）、成功、提醒、危险。
   * 第一版（2026-10-11）：按参照的后台（它的状态标签：20 高、4 圆角、500 字重）定。
   */
  tag: {
    height: number;
    inset: number;
    radius: number;
    fontSize: number;
    weight: number;
    background: string;
    color: string;
    successBackground: string;
    successColor: string;
    warningBackground: string;
    warningColor: string;
    dangerBackground: string;
    dangerColor: string;
  };
  /**
   * 日期范围的触发框：和输入框一样（高度、描边、圆角、聚焦取 field 一组），里面两个框，中间一段分隔文字，
   * 右边一个日历图标（图标集的 calendar，大小、颜色取 icon 一组，离右边缘 field.inset）。宽度由页面给，触发框填满。
   * 不显示「清空」按钮（筛选栏的「重置」负责清空）。
   */
  dateRange: {
    /** 分隔文字（「至」）左右两边的距离。 */
    separatorGap: number;
    separatorColor: string;
    /** 日历图标离结束日期的框的距离。 */
    iconGap: number;
  };
  /**
   * 日期面板：并排两个月，每个月上面一行标题（「2026年8月」，左边月份往前、右边月份往后的箭头），
   * 一行星期（一 二 … 日，周一开头），六行日子（每月都是六行，前后月份的日子显示成浅色）。
   * 只能按月翻，不显示按年翻的按钮。一天是一个 cellSize 的方块，七个方块紧挨着：
   * 选中的范围里的日子是浅底（rangeBackground），连成一条；开始、结束那天是主色底白字、带圆角；今天是 1px 主色描边。
   * 弹层外框、离触发框的距离取 popup 一组；左边和触发框左边对齐。
   * 第一版（2026-10-11）：五个组件库都是两个月并排，单元格大小各不一样（antd 24 的圆点在 36 的格子里），取一个整齐的 32。
   */
  datePanel: {
    padding: number;
    /** 两个月之间的距离。 */
    monthGap: number;
    headerHeight: number;
    titleWeight: number;
    titleColor: string;
    weekHeight: number;
    weekColor: string;
    weekSize: number;
    cellSize: number;
    cellRadius: number;
    color: string;
    /** 前后月份的日子。 */
    outsideColor: string;
    hoverBackground: string;
    rangeBackground: string;
    selectedBackground: string;
    selectedColor: string;
    todayBorder: string;
    /** 翻月份的箭头按钮：方块大小（图标取 icon 一组）。 */
    navSize: number;
  };
  /**
   * 对话框：白底、面板圆角、投影，宽 width，在窗口正中。标题在左上，关闭按钮（图标集的 x）在右上；
   * 内容在标题下面 headerGap，底部按钮靠右、在内容下面 footerGap、按钮之间 actionGap。
   * 遮罩是半透明的黑。点遮罩不关（表单填了一半，点歪了会丢）；Esc 和关闭按钮关。
   * 第一版（2026-10-11）：按参照项目（antd 默认的 Modal：520 宽、24 的留白、16px 600 的标题）定。
   */
  dialog: {
    width: number;
    padding: number;
    radius: number;
    background: string;
    shadow: string;
    mask: string;
    titleSize: number;
    titleLine: number;
    titleWeight: number;
    titleColor: string;
    /** 关闭按钮：方块大小、离对话框上边和右边的距离、图标颜色、悬停底色。 */
    closeSize: number;
    closeInset: number;
    closeColor: string;
    closeHoverBackground: string;
    /** 标题下面到内容的距离。 */
    headerGap: number;
    /** 内容下面到底部按钮的距离。 */
    footerGap: number;
    /** 底部按钮之间的距离。 */
    actionGap: number;
  };
  /**
   * 单选：16 的圆圈，选中是主色底、中间一个白点；圆圈和文字隔 gap，两个选项隔 optionGap，排成一行。
   * 第一版（2026-10-11）：按 antd、Element 的样子（实心主色加白点）定。
   */
  radio: {
    size: number;
    dot: number;
    gap: number;
    optionGap: number;
    border: string;
    checked: string;
    dotColor: string;
  };
  /**
   * 多行输入：外框、描边、圆角、聚焦和出错取 field 一组；文字离上下边缘 inset（第一行文字的位置和单行输入框一样），
   * 高度 = 行数 × 一行的高 + 上下留白；能往下拖大，不能拖宽。
   */
  textarea: {
    /** 文字离上下边缘的距离（含 1px 描边）。 */
    insetBlock: number;
    rows: number;
  };
  /** 下拉：离输入框 offset，圆角、描边、阴影；选项高度、内边距和选中样式。 */
  popup: {
    offset: number;
    radius: number;
    padding: number;
    border: string;
    shadow: string;
    optionHeight: number;
    optionInset: number;
    optionRadius: number;
    optionColor: string;
    hoverBackground: string;
    selectedBackground: string;
    selectedColor: string;
    selectedWeight: number;
  };
}

export function resolveControls(t: ResolvedTokens): ControlSpec {
  const fontSize = px(t['type.body']);
  const radius = px(t['radius.control']);
  return {
    text: { size: fontSize, line: Math.round(fontSize * 1.5715) },
    focus: { ring: 3, ringColor: tint(t['action.primary'], 0.8) },
    field: {
      inset: 12,
      background: t['surface.base'],
      border: t['border.control'],
      borderFocus: t['action.primary'],
      borderInvalid: t['feedback.danger'],
    },
    tabs: {
      height: px(t['size.controlLarge']),
      gap: 32,
      indicator: 2,
      divider: t['border.default'],
      color: t['text.secondary'],
      hoverColor: t['text.strong'],
      activeColor: t['action.primary'],
      weight: 400,
      activeWeight: 500,
    },
    checkbox: {
      size: 16,
      radius: Math.min(4, radius),
      gap: 8,
      border: t['border.control'],
      borderInvalid: t['feedback.danger'],
      checked: t['action.primary'],
      mark: t['action.onPrimary'],
      disabledBackground: t['surface.subtle'],
    },
    button: {
      weight: 500,
      iconGap: 8,
      inset: 16,
      insetLarge: 20,
      loadingOpacity: 0.65,
      secondaryBackground: t['surface.base'],
      secondaryBorder: t['border.control'],
      secondaryColor: t['text.body'],
      secondaryHoverBackground: t['surface.hover'],
      secondaryHoverColor: t['text.strong'],
    },
    link: { weight: 500, color: t['text.link'], hoverColor: t['action.primaryHover'] },
    switch: {
      width: 44,
      height: 22,
      thumb: 18,
      thumbInset: 2,
      onBackground: t['action.primary'],
      offBackground: t['border.control'],
      thumbColor: t['surface.base'],
      thumbShadow: '0 1px 2px rgb(0 0 0 / 0.2)',
      disabledOpacity: 0.5,
    },
    icon: {
      set: t['icon.set'],
      size: px(t['size.icon']),
      color: t['text.secondary'],
      check: 12,
    },
    nav: {
      padding: 8,
      itemHeight: 36,
      itemGap: 2,
      itemInset: 12,
      radius,
      iconSize: px(t['size.icon']),
      iconGap: 10,
      subInset: 12 + px(t['size.icon']) + 10,
      weight: 400,
      color: t['text.body'],
      iconColor: t['text.secondary'],
      hoverBackground: t['surface.hover'],
      hoverColor: t['text.strong'],
      selectedBackground: t['surface.selected'],
      selectedColor: t['action.primary'],
      selectedWeight: 500,
      parentSelectedColor: t['action.primary'],
      arrowInset: 12,
      popupMinWidth: 160,
    },
    breadcrumb: {
      color: t['text.secondary'],
      hoverColor: t['text.strong'],
      currentColor: t['text.strong'],
      currentWeight: 400,
      separator: '/',
      separatorColor: t['text.placeholder'],
      separatorGap: 8,
      radius: Math.min(4, radius),
    },
    dropdown: {
      minWidth: 160,
      iconGap: 8,
      color: t['text.body'],
      iconColor: t['text.secondary'],
      dangerColor: t['feedback.danger'],
      divider: t['border.default'],
    },
    tooltip: {
      background: t['text.strong'],
      color: t['surface.base'],
      fontSize: px(t['type.small']),
      line: 20,
      insetX: 8,
      insetY: 4,
      radius,
    },
    avatar: {
      size: 28,
      background: t['surface.selected'],
      color: t['text.strong'],
      fontSize: px(t['type.small']),
      weight: 500,
    },
    badge: {
      height: 16,
      minWidth: 16,
      inset: 4,
      fontSize: px(t['type.small']),
      weight: 500,
      background: t['feedback.danger'],
      color: t['action.onPrimary'],
    },
    table: {
      headHeight: 40,
      rowHeight: 44,
      cellInset: 16,
      headBackground: t['surface.subtle'],
      headColor: t['text.secondary'],
      headSize: px(t['type.small']),
      headWeight: 500,
      color: t['text.body'],
      divider: t['border.default'],
      hoverBackground: t['surface.hover'],
      selectedBackground: t['surface.selected'],
      selectionWidth: 48,
      sortGap: 4,
      sortColor: t['text.placeholder'],
      sortActiveColor: t['text.strong'],
      sortRadius: Math.min(4, radius),
      loadingOpacity: 0.5,
      loadingIcon: 20,
      loadingColor: t['action.primary'],
    },
    pagination: {
      itemSize: px(t['size.control']),
      itemInset: 6,
      gap: 8,
      radius,
      color: t['text.body'],
      hoverBackground: t['surface.hover'],
      activeColor: t['action.primary'],
      activeBorder: t['action.primary'],
      activeBackground: t['surface.base'],
      activeWeight: 500,
      disabledColor: t['text.disabled'],
      totalColor: t['text.secondary'],
      totalGap: 16,
    },
    tag: {
      height: 20,
      inset: 6,
      radius: Math.min(4, radius),
      fontSize: px(t['type.small']),
      weight: 500,
      background: t['surface.subtle'],
      color: t['text.body'],
      successBackground: tint(t['feedback.success'], 0.9),
      successColor: t['feedback.success'],
      warningBackground: tint(t['feedback.warning'], 0.9),
      warningColor: t['feedback.warning'],
      dangerBackground: tint(t['feedback.danger'], 0.9),
      dangerColor: t['feedback.danger'],
    },
    dateRange: {
      separatorGap: 8,
      separatorColor: t['text.placeholder'],
      iconGap: 8,
    },
    datePanel: {
      padding: 12,
      monthGap: 24,
      headerHeight: 32,
      titleWeight: 500,
      titleColor: t['text.strong'],
      weekHeight: 32,
      weekColor: t['text.secondary'],
      weekSize: px(t['type.small']),
      cellSize: 32,
      cellRadius: radius,
      color: t['text.body'],
      outsideColor: t['text.disabled'],
      hoverBackground: t['surface.hover'],
      rangeBackground: t['surface.selected'],
      selectedBackground: t['action.primary'],
      selectedColor: t['action.onPrimary'],
      todayBorder: t['action.primary'],
      navSize: 24,
    },
    dialog: {
      width: 520,
      padding: 24,
      radius: px(t['radius.panel']),
      background: t['surface.base'],
      shadow: '0 12px 32px -8px rgb(0 0 0 / 0.2), 0 4px 12px -4px rgb(0 0 0 / 0.08)',
      mask: 'rgb(0 0 0 / 0.45)',
      titleSize: 16,
      titleLine: 24,
      titleWeight: 600,
      titleColor: t['text.strong'],
      closeSize: 32,
      // 关闭按钮的中心和标题第一行的中心对齐：24 + 24 / 2 = 20 + 32 / 2
      closeInset: 20,
      closeColor: t['text.secondary'],
      closeHoverBackground: t['surface.hover'],
      headerGap: 20,
      footerGap: 24,
      actionGap: 8,
    },
    radio: {
      size: 16,
      dot: 6,
      gap: 8,
      optionGap: 24,
      border: t['border.control'],
      checked: t['action.primary'],
      dotColor: t['action.onPrimary'],
    },
    textarea: {
      insetBlock: (px(t['size.control']) - Math.round(fontSize * 1.5715)) / 2,
      rows: 3,
    },
    popup: {
      offset: 4,
      radius: radius + 2,
      padding: 4,
      border: t['border.default'],
      shadow: '0 8px 24px -12px rgb(0 0 0 / 0.2), 0 2px 6px -2px rgb(0 0 0 / 0.06)',
      optionHeight: 32,
      optionInset: 12,
      optionRadius: Math.max(0, radius - 2),
      optionColor: t['text.body'],
      hoverBackground: t['surface.hover'],
      selectedBackground: t['surface.selected'],
      selectedColor: t['text.strong'],
      selectedWeight: 500,
    },
  };
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * 控件规格 → CSS 变量，例如 tabs.activeColor → --mh-c-tabs-active-color。
 * 长度写成 px，字重保持数字。
 */
export function controlCssVariables(c: ControlSpec): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [group, values] of Object.entries(c) as Array<[string, Record<string, unknown>]>) {
    for (const [key, value] of Object.entries(values)) {
      const name = `--mh-c-${kebab(group)}-${kebab(key)}`;
      out[name] =
        typeof value === 'number' && !/weight|opacity/i.test(key) ? `${value}px` : String(value);
    }
  }
  return out;
}
