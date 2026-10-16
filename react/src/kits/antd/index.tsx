import {
  Avatar as AntAvatar,
  Badge as AntBadge,
  Breadcrumb as AntBreadcrumb,
  Button as AntButton,
  Checkbox as AntCheckbox,
  ConfigProvider,
  DatePicker as AntDatePicker,
  Dropdown as AntDropdown,
  Input as AntInput,
  Menu as AntMenu,
  Modal as AntModal,
  Pagination as AntPagination,
  Radio as AntRadio,
  Select as AntSelect,
  Switch as AntSwitch,
  Table as AntTable,
  Tabs as AntTabs,
  Tag as AntTag,
} from 'antd';
import type { MenuProps, MenuRef, TableProps as AntTableProps, ThemeConfig } from 'antd';
import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import {
  adapt,
  ms,
  nextSort,
  swapsIcons,
  px,
  resolveControls,
  roleMapping,
  themeMappingValues,
  type ControlSpec,
  type NavItem,
  type ResolvedTokens,
  type TableRow,
} from '@mihua/spec';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
// 日期面板按中文排（周一开头、「8月」）：antd 的中文语言包只带文字，dayjs 的中文要自己引入（antd 依赖 dayjs）
import 'dayjs/locale/zh-cn';
import { useIconSet, useLocale, usePortal } from '../../context';
import { Icon } from '../../icon';
import { PasswordToggle } from '../../kit/PasswordToggle';
import { useFocusOnOpen } from '../../kit/useFocusOnOpen';
import type { Kit } from '../../kit/types';
import './styles.css';

/**
 * 语义 token → Ant Design 主题 token。
 * antd 用 CSS-in-JS，自己会根据 colorPrimary 推算悬停、按下、浅色背景等整套颜色，
 * 所以这里只需要给「源头」，不需要写任何覆盖样式。
 */
/** 故事书只追踪主操作色与控件圆角，目标同时用于真正的主题输出。 */
export function antdRoleMappings(t: ResolvedTokens) {
  return {
    colorPrimary: roleMapping(t, 'action.primary', '直接交给 ConfigProvider；组件库再推导状态色。'),
    borderRadius: roleMapping(t, 'radius.control', '将 px 长度转换成主题需要的数字。', px),
    borderRadiusLG: roleMapping(
      t,
      'radius.control',
      '大号输入框与按钮也读取控件圆角；外层面板保持独立。',
      px,
    ),
  };
}

/**
 * aligned 为 false 时只把规范的取值交给 antd 的主题变量（大多数项目的做法），
 * 为 true 时再按控件规格对齐到统一设计。演示页用这两种状态对比「只有取值为什么不够」。
 */
export function antdTheme(t: ResolvedTokens, aligned = true): ThemeConfig {
  const c = resolveControls(t);
  // —— 规范取值 → antd 的全局 token ——
  const token = {
    ...themeMappingValues(antdRoleMappings(t)),
    colorPrimaryHover: t['action.primaryHover'],
    colorTextLightSolid: t['action.onPrimary'],
    colorText: t['text.body'],
    colorTextHeading: t['text.strong'],
    colorTextSecondary: t['text.secondary'],
    colorTextPlaceholder: t['text.placeholder'],
    colorTextDisabled: t['text.disabled'],
    colorLink: t['text.link'],
    colorBgContainer: t['surface.base'],
    colorBgLayout: t['surface.canvas'],
    colorFillTertiary: t['surface.subtle'],
    colorBorder: t['border.control'],
    colorBorderSecondary: t['border.default'],
    colorError: t['feedback.danger'],
    colorSuccess: t['feedback.success'],
    colorWarning: t['feedback.warning'],
    controlHeight: px(t['size.control']),
    controlHeightLG: px(t['size.controlLarge']),
    fontSize: px(t['type.body']),
    fontSizeSM: px(t['type.small']),
    fontFamily: t['font.sans'],
    motionDurationMid: `${ms(t['motion.duration']) / 1000}s`,
  };
  if (!aligned) return { token };
  return {
    token: {
      ...token,
      // —— 对齐到控件规格（antd 默认和统一设计不一样的地方）——
      colorLink: c.link.color,
      colorLinkHover: c.link.hoverColor,
      colorLinkActive: c.link.hoverColor,
      // 一行的高度取整数像素（antd 默认 1.5714，15px 字是 23.57px）
      lineHeight: c.text.line / c.text.size,
      // 大号控件另有一个行高 token，antd 按大号字号推算（15px 字是 21.67px）
      lineHeightLG: c.text.line / c.text.size,
      // 大号控件 antd 默认 16px 字，统一设计是正文字号
      fontSizeLG: c.text.size,
      // 下拉选项的悬停、选中底色：antd 从主色推算，主色很深时会得到深灰底配深色字
      controlItemBgHover: c.popup.hoverBackground,
      controlItemBgActive: c.popup.selectedBackground,
      controlItemBgActiveHover: c.popup.selectedBackground,
      // 聚焦外环
      controlOutline: c.focus.ringColor,
      controlOutlineWidth: c.focus.ring,
      // 复选框：antd 按控件高度的一半推算（36px 控件 → 18px）
      controlInteractiveSize: c.checkbox.size,
    },
    components: {
      // 标签栏高度 = 上下内边距 + 一行文字，所以内边距由规格里的高度倒推
      Tabs: {
        horizontalItemPadding: `${(c.tabs.height - c.text.line) / 2}px 0`,
        horizontalItemGutter: c.tabs.gap,
        titleFontSize: c.text.size,
        itemColor: c.tabs.color,
        itemHoverColor: c.tabs.hoverColor,
        itemSelectedColor: c.tabs.activeColor,
        itemActiveColor: c.tabs.activeColor,
        inkBarColor: c.tabs.activeColor,
        lineWidthBold: c.tabs.indicator,
        colorBorderSecondary: c.tabs.divider,
      },
      // 按钮：antd 默认字重 400、主按钮带阴影、次要按钮悬停变成主色描边加主色字
      Button: {
        fontWeight: c.button.weight,
        iconGap: c.button.iconGap,
        // 文字离外边框的距离：antd 两档都是 15px 内边距（不含 1px 边框），统一设计默认、大号各一档
        paddingInline: c.button.inset - 1,
        paddingInlineLG: c.button.insetLarge - 1,
        primaryShadow: 'none',
        defaultShadow: 'none',
        defaultBg: c.button.secondaryBackground,
        defaultBorderColor: c.button.secondaryBorder,
        defaultColor: c.button.secondaryColor,
        defaultHoverBg: c.button.secondaryHoverBackground,
        defaultHoverBorderColor: c.button.secondaryBorder,
        defaultHoverColor: c.button.secondaryHoverColor,
        defaultActiveBg: c.button.secondaryHoverBackground,
        defaultActiveBorderColor: c.button.secondaryBorder,
        defaultActiveColor: c.button.secondaryHoverColor,
      },
      // 输入框：文字离外边框 inset（antd 的内边距不含 1px 描边）
      Input: {
        paddingInline: c.field.inset - 1,
        paddingInlineLG: c.field.inset - 1,
        activeBorderColor: c.field.borderFocus,
        hoverBorderColor: c.field.border,
      },
      Checkbox: {
        borderRadiusSM: c.checkbox.radius,
        colorPrimary: c.checkbox.checked,
        colorWhite: c.checkbox.mark,
        paddingXS: c.checkbox.gap,
      },
      // 开关：antd 默认 44×22、圆点 18；关是 25% 的黑，悬停时开、关都变色（关着变深、开着变浅）；禁用 65% 不透明度。
      // 颜色、不透明度这些全局 token 可以只在开关上改，不影响别的组件。
      Switch: {
        trackHeight: c.switch.height,
        trackMinWidth: c.switch.width,
        trackPadding: c.switch.thumbInset,
        handleSize: c.switch.thumb,
        handleBg: c.switch.thumbColor,
        handleShadow: c.switch.thumbShadow,
        colorPrimary: c.switch.onBackground,
        colorPrimaryHover: c.switch.onBackground,
        colorTextQuaternary: c.switch.offBackground,
        colorTextTertiary: c.switch.offBackground,
        opacityLoading: c.switch.disabledOpacity,
      },
      // 下拉选项高度、内边距；选中浅底加粗，悬停浅灰
      Select: {
        optionHeight: c.popup.optionHeight,
        optionPadding: `${(c.popup.optionHeight - c.text.line) / 2}px ${c.popup.optionInset}px`,
        optionFontSize: c.text.size,
        optionSelectedBg: c.popup.selectedBackground,
        optionSelectedColor: c.popup.selectedColor,
        optionSelectedFontWeight: c.popup.selectedWeight,
        optionActiveBg: c.popup.hoverBackground,
        activeBorderColor: c.field.borderFocus,
        hoverBorderColor: c.field.border,
      },
      // 导航菜单：antd 默认 40px 高的项、上下外边距 4、左右外边距 4、右边一道 1px 分隔线、白底，
      // 子菜单整块灰底（colorFillAlter），选中项右边没有指示条但浅主色底。
      // 菜单四周的留白、相邻两项的距离由套件给菜单的 style 和项的外边距决定（见 NavMenu）。
      Menu: {
        itemHeight: c.nav.itemHeight,
        itemMarginInline: 0,
        // 只留下边距：上下相邻两项之间正好 itemGap，不受外边距合并影响
        itemMarginBlock: `0 ${c.nav.itemGap}px`,
        itemPaddingInline: c.nav.itemInset,
        itemBorderRadius: c.nav.radius,
        subMenuItemBorderRadius: c.popup.optionRadius,
        iconSize: c.nav.iconSize,
        collapsedIconSize: c.nav.iconSize,
        iconMarginInlineEnd: c.nav.iconGap,
        // 菜单本身不要分隔线、不要底色（分隔线归页面布局）
        activeBarBorderWidth: 0,
        itemBg: 'transparent',
        subMenuItemBg: 'transparent',
        popupBg: c.field.background,
        itemColor: c.nav.color,
        itemHoverColor: c.nav.hoverColor,
        itemHoverBg: c.nav.hoverBackground,
        itemActiveBg: c.nav.hoverBackground,
        itemSelectedBg: c.nav.selectedBackground,
        itemSelectedColor: c.nav.selectedColor,
        subMenuItemSelectedColor: c.nav.parentSelectedColor,
        dropdownWidth: c.nav.popupMinWidth,
        // 悬停、选中的底色过渡：antd 默认 0.3s（motionDurationSlow），统一取规范的动效时长
        motionDurationSlow: `${ms(t['motion.duration']) / 1000}s`,
      },
      // 面包屑：antd 默认链接左右 4px 内边距（再用 -4px 外边距抵消）、悬停浅灰底，
      // 文字都是 45% 的黑，当前页 88% 的黑
      Breadcrumb: {
        itemColor: c.breadcrumb.color,
        lastItemColor: c.breadcrumb.currentColor,
        linkColor: c.breadcrumb.color,
        linkHoverColor: c.breadcrumb.hoverColor,
        separatorColor: c.breadcrumb.separatorColor,
        separatorMargin: c.breadcrumb.separatorGap,
        paddingXXS: 0,
        marginXXS: 0,
        colorBgTextHover: 'transparent',
        borderRadiusSM: c.breadcrumb.radius,
      },
      // 头像：antd 默认 32px（控件高度）、灰底（占位文字色）白字、14px
      Avatar: {
        containerSize: c.avatar.size,
        textFontSize: c.avatar.fontSize,
        colorTextPlaceholder: c.avatar.background,
        colorTextLightSolid: c.avatar.color,
      },
      // 徽标：antd 默认高 = 一行文字高减 2（22px 行高 → 20px）、字重 400、外面一圈 1px 白边
      Badge: {
        indicatorHeight: c.badge.height,
        textFontSize: c.badge.fontSize,
        // 字重要写成字符串：antd 把数字 token 写成 CSS 变量时会加上 px（500px 是无效字重）
        textFontWeight: String(c.badge.weight),
        paddingInline: c.badge.inset,
        colorError: c.badge.background,
        colorTextLightSolid: c.badge.color,
        lineWidth: 0,
      },
      // 表格：antd 默认表头 #fafafa 底、600 字重、格子之间一道竖线，格子上下 16 的内边距（行 55 高）、
      // 表头左上右上 8 圆角；排了序的列整列变灰；勾选的行浅主色底、悬停再深一点。
      // 高度、表头字号字重、最后一行的分隔线 token 管不到，在 styles.css 里。
      Table: {
        headerBg: c.table.headBackground,
        headerColor: c.table.headColor,
        headerSplitColor: 'transparent',
        headerBorderRadius: 0,
        headerSortActiveBg: c.table.headBackground,
        headerSortHoverBg: c.table.headBackground,
        bodySortBg: 'transparent',
        borderColor: c.table.divider,
        rowHoverBg: c.table.hoverBackground,
        rowSelectedBg: c.table.selectedBackground,
        rowSelectedHoverBg: c.table.selectedBackground,
        cellPaddingInline: c.table.cellInset,
        cellFontSize: c.text.size,
        selectionColumnWidth: c.table.selectionWidth,
        colorText: c.table.color,
      },
      // 分页：antd 默认 32 的方块（控件高度）、当前页主色描边、600 字重；「共 N 条」离页码 8
      Pagination: {
        itemSize: c.pagination.itemSize,
        itemBg: 'transparent',
        itemActiveBg: c.pagination.activeBackground,
        itemActiveColor: c.pagination.activeColor,
        itemActiveColorHover: c.pagination.activeColor,
        colorPrimary: c.pagination.activeBorder,
        colorPrimaryHover: c.pagination.activeBorder,
        colorText: c.pagination.color,
        colorTextDisabled: c.pagination.disabledColor,
        colorBgTextHover: c.pagination.hoverBackground,
        borderRadius: c.pagination.radius,
        marginXS: c.pagination.gap,
      },
      // 标签：antd 默认 22 高（20 的行高加 1px 描边）、左右 7、字重 400，成功 / 提醒 / 出错有一圈同色系描边，
      // 浅底由 antd 从状态色推算。颜色交给组件 token，高度、字重在 styles.css
      Tag: {
        defaultBg: c.tag.background,
        defaultColor: c.tag.color,
        colorSuccessBg: c.tag.successBackground,
        colorSuccess: c.tag.successColor,
        colorWarningBg: c.tag.warningBackground,
        colorWarning: c.tag.warningColor,
        colorErrorBg: c.tag.dangerBackground,
        colorError: c.tag.dangerColor,
      },
      // 对话框：antd 默认 520 宽、上下 20 左右 24 的留白、8 圆角、标题下面 8、底部按钮上面 12、离窗口顶 100
      Modal: {
        titleFontSize: c.dialog.titleSize,
        titleLineHeight: c.dialog.titleLine / c.dialog.titleSize,
        titleColor: c.dialog.titleColor,
        contentBg: c.dialog.background,
        headerBg: c.dialog.background,
        borderRadiusLG: c.dialog.radius,
      },
      // 单选：antd 默认 16 的圆圈、选中是主色底加 8 的白点、右边 8 的外边距
      Radio: {
        radioSize: c.radio.size,
        dotSize: c.radio.dot,
        colorPrimary: c.radio.checked,
        colorBorder: c.radio.border,
        wrapperMarginInlineEnd: c.radio.optionGap,
      },
      // 下拉菜单：选项高度、左右内边距、图标和文字的距离、悬停底色、分隔线；外框见 Dropdown 的 menu.style
      Dropdown: {
        paddingBlock: (c.popup.optionHeight - c.text.line) / 2,
        controlPaddingHorizontal: c.popup.optionInset,
        borderRadiusSM: c.popup.optionRadius,
        marginXS: c.dropdown.iconGap,
        marginXXS: c.popup.padding,
        colorText: c.dropdown.color,
        colorError: c.dropdown.dangerColor,
        colorSplit: c.dropdown.divider,
        controlItemBgHover: c.popup.hoverBackground,
      },
    },
  };
}

const INLINE_LINK = {
  height: 'auto',
  padding: 0,
  borderWidth: 0,
  // 沿用所在位置的行高，不会把输入框撑高
  lineHeight: 'inherit',
  fontWeight: 'var(--mh-c-link-weight)',
} as const;

/** 接上规范时为 true；原生模式为 false，保留 antd 自己的样子。 */
const AlignedContext = createContext(false);
/** 下拉离输入框的距离（控件规格）。 */
const PopupGapContext = createContext(4);
/** 对齐时的控件规格（数值）；原生、只设主题时为 null。 */
const ControlsContext = createContext<ControlSpec | null>(null);

/** 统一设计的下拉外框：圆角、描边、阴影都读控件规格的 CSS 变量。 */
const ALIGNED_POPUP = {
  padding: 'var(--mh-c-popup-padding)',
  border: '1px solid var(--mh-c-popup-border)',
  borderRadius: 'var(--mh-c-popup-radius)',
  boxShadow: 'var(--mh-c-popup-shadow)',
};

type MenuItems = NonNullable<MenuProps['items']>;

/**
 * 导航数据 → antd Menu 的 items。图标用规范图标集（antd 菜单的图标位由使用方给）。
 * tabbable、subTabbable：一级项、子菜单里的项能用 Tab 聚焦（antd 默认只有整个菜单 ul 能 Tab，项之间用方向键）；
 * subStyle：子菜单里的项的样式（antd 按层级缩进 inlineIndent × 层数，写在行内样式上，只有项自己的 style 盖得过）。
 */
const navMenuItems = (
  items: NavItem[],
  options: { tabbable: boolean; subTabbable: boolean; subStyle?: CSSProperties },
  sub = false,
): MenuItems =>
  items.map((item) =>
    item.children
      ? {
          key: item.key,
          label: item.label,
          icon: item.icon && <Icon name={item.icon} />,
          children: navMenuItems(item.children, options, true),
        }
      : {
          key: item.key,
          label: item.label,
          icon: item.icon && <Icon name={item.icon} />,
          ...((sub ? options.subTabbable : options.tabbable) ? { tabIndex: 0 } : {}),
          ...(sub && options.subStyle ? { style: options.subStyle } : {}),
        },
  );

/** 收起后子菜单弹层（antd 的 .ant-menu-submenu-popup）上加的类名，对齐样式靠它找到弹层。 */
const NAV_FLYOUT = 'mh-nav-flyout';

/**
 * 统一设计的文字提示框：底色、字、内边距、圆角读控件规格的 CSS 变量（tooltip 一组）。
 * antd 默认 85% 的黑底、14/22、上下 6 左右 8、最小 32 高（控件高度）、最小宽 = 2 × 圆角 + 箭头 16，
 * 外层（.ant-tooltip）还有一道三层的投影（filter: drop-shadow）。
 */
const ALIGNED_TIP: { root: CSSProperties; container: CSSProperties } = {
  root: { filter: 'none' },
  container: {
    minWidth: 0,
    minHeight: 0,
    padding: 'var(--mh-c-tooltip-inset-y) var(--mh-c-tooltip-inset-x)',
    borderRadius: 'var(--mh-c-tooltip-radius)',
    background: 'var(--mh-c-tooltip-background)',
    color: 'var(--mh-c-tooltip-color)',
    fontSize: 'var(--mh-c-tooltip-font-size)',
    lineHeight: 'var(--mh-c-tooltip-line)',
    fontWeight: 400,
  },
};

export const antdKit: Kit = {
  id: 'antd',
  name: 'Ant Design',
  Provider: ({ tokens, aligned = true, children }) => {
    const portal = usePortal();
    const locale = useLocale();
    const controls = useMemo(
      () => (tokens && aligned ? resolveControls(tokens) : null),
      [tokens, aligned],
    );
    return (
      <AlignedContext.Provider value={tokens !== null && aligned}>
        <ControlsContext.Provider value={controls}>
          <PopupGapContext.Provider value={tokens ? resolveControls(tokens).popup.offset : 4}>
            <ConfigProvider
              theme={tokens ? antdTheme(tokens, aligned) : undefined}
              locale={locale === 'zh' ? zhCN : undefined}
              getPopupContainer={() => portal ?? document.body}
              // antd 默认会在两个汉字的按钮中间插空格（「登 录」）；文案由组件的文案表决定，不让组件库改写。
              button={{ autoInsertSpace: false }}
            >
              {/* 只用来挂对齐用的样式（styles.css），不占布局 */}
              <div
                className={[
                  'mh-kit-antd',
                  tokens && aligned && 'mh-kit-antd--aligned',
                  tokens && aligned && swapsIcons(tokens['icon.set']) && 'mh-kit-antd--icons',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ display: 'contents' }}
              >
                {children}
              </div>
            </ConfigProvider>
          </PopupGapContext.Provider>
        </ControlsContext.Provider>
      </AlignedContext.Provider>
    );
  },
  Button: function AntdKitButton({
    variant,
    size,
    block,
    loading,
    disabled,
    type = 'button',
    icon,
    onClick,
    children,
    ...aria
  }) {
    const aligned = useContext(AlignedContext);
    const iconChoice = useIconSet(); // Hook 每次渲染都要调用，不能写在 && 后面
    const swap = aligned && swapsIcons(iconChoice);
    return (
      <AntButton
        type={variant === 'secondary' ? 'default' : variant}
        size={size === 'large' ? 'large' : 'middle'}
        block={block}
        // 加载图标用规范图标集里的那一个（antd 默认是自己的 LoadingOutlined）
        loading={
          swap && loading
            ? { icon: <Icon name="loading" spin className="mh-btn-spinner" /> }
            : loading
        }
        disabled={disabled}
        htmlType={type}
        icon={icon}
        onClick={onClick}
        // 链接按钮放在一行文字或输入框里，只占一行文字的高度；否则 32px 的按钮会把输入框撑到 52px。
        style={
          aligned && variant === 'link'
            ? INLINE_LINK
            : aligned && loading
              ? { opacity: 'var(--mh-c-button-loading-opacity)' }
              : undefined
        }
        {...aria}
      >
        {children}
      </AntButton>
    );
  },
  Input: function AntdKitInput({ type = 'text', value, onChange, size, invalid, suffix, ...rest }) {
    const aligned = useContext(AlignedContext);
    const iconChoice = useIconSet(); // Hook 每次渲染都要调用，不能写在 && 后面
    const swap = aligned && swapsIcons(iconChoice);
    const [visible, setVisible] = useState(false);
    const common = {
      ...rest,
      value,
      size: size === 'large' ? ('large' as const) : ('middle' as const),
      status: invalid ? ('error' as const) : undefined,
      'aria-invalid': invalid || undefined,
      onChange: (event: { target: { value: string } }) => onChange(event.target.value),
    };
    // 接上规范时密码显隐按钮由套件画（antd 自带的是 span role=button，图标是 antd 自己的，名字默认英文 Show / Hide）
    if (type === 'password' && aligned)
      return (
        <AntInput
          {...common}
          type={visible ? 'text' : 'password'}
          suffix={
            <PasswordToggle
              visible={visible}
              onToggle={() => setVisible(!visible)}
              // 规范写 icon.set: native 时用 antd 自己的眼睛图标
              glyphs={
                swap ? undefined : { shown: <EyeOutlined />, hidden: <EyeInvisibleOutlined /> }
              }
            />
          }
        />
      );
    return type === 'password' ? (
      <AntInput.Password {...common} />
    ) : (
      <AntInput {...common} type={type} suffix={suffix} />
    );
  },
  Checkbox: function AntdKitCheckbox({ checked, onChange, children, invalid, ...aria }) {
    const aligned = useContext(AlignedContext);
    return (
      <AntCheckbox
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-invalid={invalid || undefined}
        // antd 的复选框按文字基线对齐、方块再往下偏 0.2em；统一设计是方块和文字一起垂直居中。
        // antd 也没有出错样式：出错时红色描边（勾选后由主色底盖住）。
        styles={
          aligned
            ? {
                root: { alignItems: 'center' },
                // antd 在文字左右各留 8px；文字后面的距离归页面布局管，只留方块和文字之间那一段
                label: { paddingInlineEnd: 0 },
                icon: {
                  top: 0,
                  alignSelf: 'center',
                  ...(invalid && !checked ? { borderColor: 'var(--mh-feedback-danger)' } : {}),
                },
              }
            : undefined
        }
        {...aria}
      >
        {children}
      </AntCheckbox>
    );
  },
  Tabs: function AntdKitTabs({ value, onChange, items, ...aria }) {
    const aligned = useContext(AlignedContext);
    // 键盘：antd 的 ← → 只移动焦点，要再按回车才切换。统一成移动焦点的同时切换（和 Element、shadcn 一致）。
    const onKeyDown = (event: KeyboardEvent) => {
      if (!aligned || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
      requestAnimationFrame(() => {
        const tab = document.activeElement?.closest<HTMLElement>('.ant-tabs-tab');
        const key = tab?.dataset.nodeKey;
        if (key && key !== value) onChange(key);
      });
    };
    return (
      <div onKeyDown={onKeyDown}>
        <AntTabs
          activeKey={value}
          onChange={onChange}
          items={items.map((item) => ({
            key: item.value,
            // antd 没有「选中标签字重」的 token，接上规范时在标签文字上直接加粗
            label: aligned ? (
              <span
                style={{
                  fontWeight:
                    item.value === value
                      ? 'var(--mh-c-tabs-active-weight)'
                      : 'var(--mh-c-tabs-weight)',
                }}
              >
                {item.label}
              </span>
            ) : (
              item.label
            ),
          }))}
          tabBarStyle={{ margin: 0 }}
          {...aria}
        />
      </div>
    );
  },
  Select: function AntdKitSelect({ value, onChange, options, size, display, width, ...aria }) {
    const aligned = useContext(AlignedContext);
    const iconChoice = useIconSet(); // Hook 每次渲染都要调用，不能写在 && 后面
    const swap = aligned && swapsIcons(iconChoice);
    const gap = useContext(PopupGapContext);
    const [open, setOpen] = useState(false);
    return (
      <AntSelect
        value={value}
        onChange={onChange}
        size={size === 'large' ? 'large' : 'middle'}
        style={{ width }}
        popupMatchSelectWidth={false}
        // 下拉离输入框的距离取控件规格（antd 默认约 4px，和选择框的边框一起算会差半像素）
        popupAlign={aligned ? { offset: [0, gap] } : undefined}
        // 下拉箭头用规范图标集里的那一个
        suffixIcon={swap ? <Icon name="chevron-down" className="mh-select-arrow" /> : undefined}
        onOpenChange={setOpen}
        // 统一设计：展开时已选的值保持清晰，箭头朝上
        styles={
          aligned
            ? {
                popup: { root: ALIGNED_POPUP },
                // antd 展开时把已选的值降到 25% 透明度
                content: { opacity: 1 },
                suffix: {
                  transform: open ? 'rotate(180deg)' : undefined,
                  transition: 'transform var(--mh-motion-duration)',
                },
              }
            : undefined
        }
        options={options}
        labelRender={display ? ({ value: v }) => display(String(v)) : undefined}
        {...aria}
      />
    );
  },
  Switch: function AntdKitSwitch({ checked, onChange, disabled, ...aria }) {
    return (
      <AntSwitch
        checked={checked}
        onChange={(next) => onChange(next)}
        disabled={disabled}
        {...aria}
      />
    );
  },
  /**
   * 导航菜单：antd 的 Menu（inline 模式）；收起用 inlineCollapsed，antd 自己把子菜单变成鼠标悬停弹出的弹层
   * （rc-menu 的 vertical 模式，弹层挂在 getPopupContainer 上）。
   * 收起时弹层开没开归 antd 管：openKeys 换成套件自己的一份，不改页面的 open，悬停也不调 onOpenChange。
   */
  NavMenu: function AntdKitNavMenu({
    items,
    selected,
    onSelect,
    open,
    onOpenChange,
    collapsed,
    ...aria
  }) {
    const aligned = useContext(AlignedContext);
    const controls = useContext(ControlsContext);
    const iconChoice = useIconSet();
    const swap = aligned && swapsIcons(iconChoice);
    // 收起后悬停弹出的子菜单：开关存在套件里，不动页面的 open
    const [flyout, setFlyout] = useState<string[]>([]);
    const menu = useRef<MenuRef>(null);
    const id = useId();
    // 刚用鼠标在收起后的弹层里选了一项、鼠标还没回到菜单上：这时 antd 会因为鼠标还停在弹层上把它重新打开
    const picked = useRef(false);
    useEffect(() => {
      const list = menu.current?.menu?.list;
      if (!list) return;
      const reset = () => (picked.current = false);
      list.addEventListener('pointermove', reset);
      return () => list.removeEventListener('pointermove', reset);
    }, []);
    const submenus = items.filter((item) => item.children).map((item) => item.key);
    // antd 在叶子上按回车，除了选中，还会把这个叶子的 key 当成子菜单「展开」（openKeys 里多一个叶子；
    // 收起后的弹层里，刚因为选中关上的弹层又被它打开）。open 只记子菜单：带叶子的这次通知不算。
    const changeOpen = (keys: string[]) => {
      if (keys.some((key) => !submenus.includes(key))) return;
      if (collapsed) {
        // 对齐时：点了弹层里的项，弹层关上（antd 默认鼠标不离开就不关）
        if (aligned && picked.current && keys.length) return;
        return setFlyout(keys);
      }
      if (keys.length !== open.length || keys.some((key) => !open.includes(key)))
        onOpenChange(keys);
    };
    const select: MenuProps['onClick'] = ({ key, keyPath, domEvent }) => {
      onSelect(key);
      if (!aligned || !collapsed || keyPath.length < 2) return;
      if (domEvent.type === 'click') picked.current = true;
      // 用键盘选中：弹层关上，焦点回到它的子菜单标题（antd 默认焦点跟着弹层消失，掉到 body）
      else
        document
          .querySelector<HTMLElement>(`[data-menu-id="${CSS.escape(`${id}-${keyPath[1]}`)}"]`)
          ?.focus();
    };
    // 对齐时子菜单标题也要能用 Tab 聚焦：rc-menu 把标题的 tabIndex 写死成 -1，
    // 只能在渲染以后改 DOM（React 不会再去碰没有变化的属性）
    useLayoutEffect(() => {
      if (!aligned) return;
      const list = menu.current?.menu?.list;
      for (const title of list?.querySelectorAll(
        ':scope > .ant-menu-submenu > .ant-menu-submenu-title',
      ) ?? [])
        title.setAttribute('tabindex', '0');
    });
    // 空格：antd 只认回车。对齐时空格和回车一样（叶子选中、子菜单标题展开 / 收起），焦点留在原处。
    // 收起后的子菜单标题点了不打开弹层（弹层是悬停打开的），回车才打开：空格就转成一次回车交给 antd
    const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
      if (!aligned || event.key !== ' ') return;
      const target = event.target as HTMLElement;
      if (target.getAttribute('role') !== 'menuitem') return;
      event.preventDefault();
      if (collapsed && target.classList.contains('ant-menu-submenu-title'))
        target.dispatchEvent(
          new globalThis.KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
          }),
        );
      else target.click();
    };
    return (
      <AntMenu
        ref={menu}
        mode="inline"
        inlineCollapsed={collapsed}
        items={navMenuItems(items, {
          tabbable: aligned,
          // 收起后弹层里的项不在 Tab 顺序里（弹层是鼠标悬停打开的）
          subTabbable: aligned && !collapsed,
          subStyle:
            aligned && !collapsed ? { paddingLeft: 'var(--mh-c-nav-sub-inset)' } : undefined,
        })}
        selectedKeys={[selected]}
        openKeys={collapsed ? flyout : open}
        onOpenChange={changeOpen}
        id={id}
        onClick={select}
        onKeyDown={onKeyDown}
        // 对齐时：一级项离左边 nav.itemInset（antd 按层级缩进 inlineIndent × 层数，默认 24）
        inlineIndent={controls?.nav.itemInset}
        // 对齐时：菜单四周留白 nav.padding，宽度跟着侧栏（收起时 antd 默认 80px 宽）；
        // 整个菜单不进 Tab 顺序，每一项自己进
        style={aligned ? { width: '100%', padding: 'var(--mh-c-nav-padding)' } : undefined}
        tabIndex={aligned ? -1 : undefined}
        // 子菜单箭头：规范图标集的 chevron-down（antd 默认是两道 CSS 画的短线）
        expandIcon={
          swap && !collapsed
            ? ({ isOpen }) => (
                <Icon
                  name="chevron-down"
                  className={isOpen ? 'mh-nav-arrow mh-nav-arrow--open' : 'mh-nav-arrow'}
                />
              )
            : undefined
        }
        className="mh-nav"
        classNames={{ popup: { root: NAV_FLYOUT } }}
        // 收起后没有子菜单的一级项：antd 自己给它挂了 Tooltip（悬停 0.1s 出现，名字放在右边、上下居中）。
        // 对齐时不要小箭头和投影，样子取控件规格的 tooltip 一组；左边离侧栏右边缘 popup.offset：
        // 从菜单项右边算起 = 侧栏留白 + 1px 分隔线 + offset（antd 默认离菜单项右边 12 = 半个箭头 8 + 4）
        tooltip={
          aligned && controls
            ? {
                arrow: false,
                align: { offset: [controls.nav.padding + 1 + controls.popup.offset, 0] },
                styles: ALIGNED_TIP,
              }
            : undefined
        }
        {...aria}
      />
    );
  },
  /** 面包屑：antd 的 Breadcrumb；能点的上级是 a[href]，点了、按回车都只通知页面，不跳转。 */
  Breadcrumb: function AntdKitBreadcrumb({ items, onNavigate, ...aria }) {
    const aligned = useContext(AlignedContext);
    return (
      <AntBreadcrumb
        className="mh-breadcrumb"
        items={items.map((item, i) => {
          const last = i === items.length - 1;
          const link = item.link && !last;
          return {
            key: item.key,
            title: item.label,
            href: link ? '#' : undefined,
            ...(aligned && last ? { 'aria-current': 'page' as const } : {}),
            onClick: link
              ? (event: { preventDefault(): void }) => {
                  event.preventDefault();
                  onNavigate(item.key);
                }
              : undefined,
          };
        })}
        {...aria}
      />
    );
  },
  /**
   * 下拉菜单：antd 的 Dropdown（点击打开，bottomRight：弹层右边和按钮右边对齐）。
   * 对齐时补键盘：在按钮上按回车、空格打开后焦点进到第一项（antd 默认焦点留在按钮上，↓ 没反应，要先按 Tab）；
   * 选中、在项上按 Esc 以后焦点回到按钮（antd 默认焦点跟着弹层一起消失，掉到 body）。↑ ↓ 移动是 antd 自己的。
   */
  Dropdown: function AntdKitDropdown({ items, onSelect, children, ...aria }) {
    const aligned = useContext(AlignedContext);
    const gap = useContext(PopupGapContext);
    const id = useId();
    const [open, setOpen] = useState(false);
    const trigger = useRef<HTMLElement | null>(null);
    const byKeyboard = useRef(false);
    useEffect(() => {
      if (!open || !aligned || !byKeyboard.current) return;
      // 弹层出现以后再找第一项（antd 的弹层在打开的下一帧才渲染出来）
      let frame = 0;
      const focusFirst = (tries: number) => {
        const first = document.getElementById(id)?.querySelector<HTMLElement>('[role=menuitem]');
        if (first) first.focus();
        else if (tries > 0) frame = requestAnimationFrame(() => focusFirst(tries - 1));
      };
      frame = requestAnimationFrame(() => focusFirst(30));
      return () => cancelAnimationFrame(frame);
    }, [open, aligned, id]);
    const menuItems: MenuItems = items.flatMap((item) => [
      ...(item.divided ? [{ type: 'divider' as const, key: `${item.key}-divider` }] : []),
      {
        key: item.key,
        label: item.label,
        icon: item.icon && <Icon name={item.icon} />,
        danger: item.danger,
      },
    ]);
    // 触发按钮由页面画：记下它（选中以后把焦点还给它）和这次是不是用键盘打开的，再调它自己的处理函数
    const button = children as ReactElement<HTMLAttributes<HTMLElement>>;
    const remember =
      (keyboard: boolean, own?: (event: never) => void) =>
      (event: { currentTarget: EventTarget }) => {
        byKeyboard.current = keyboard;
        trigger.current = event.currentTarget as HTMLElement;
        own?.(event as never);
      };
    return (
      <AntDropdown
        open={open}
        onOpenChange={setOpen}
        trigger={['click']}
        placement="bottomRight"
        // 弹层离按钮 popup.offset（antd 默认也是 4，但位置向下取整到整像素：按钮落在半像素上时只离 3.5）
        align={aligned ? { offset: [0, gap] } : undefined}
        menu={{
          id,
          items: menuItems,
          onClick: ({ key }) => {
            setOpen(false);
            onSelect(key);
            if (aligned) trigger.current?.focus();
          },
          // 回车选中以后焦点已经回到按钮：拦住这次回车，免得它再「点」一下按钮又把菜单打开。
          // Esc：antd 收起弹层，但焦点留在消失的菜单项上（掉到 body），对齐时还给按钮
          onKeyDown: aligned
            ? (event) => {
                if (event.key === 'Enter') event.preventDefault();
                if (event.key === 'Escape') {
                  setOpen(false);
                  trigger.current?.focus();
                }
              }
            : undefined,
          className: 'mh-dropdown',
          // 外框：圆角、1px 描边、内边距、阴影取控件规格（antd 默认没有描边、阴影是三层的 boxShadowSecondary）
          style: aligned
            ? {
                ...ALIGNED_POPUP,
                minWidth: 'var(--mh-c-dropdown-min-width)',
                background: 'var(--mh-c-field-background)',
              }
            : undefined,
          ...aria,
        }}
      >
        {cloneElement(button, {
          onKeyDown: remember(true, button.props.onKeyDown),
          onPointerDown: remember(false, button.props.onPointerDown),
          ...(aligned ? { 'aria-haspopup': 'menu', 'aria-expanded': open } : {}),
        })}
      </AntDropdown>
    );
  },
  Avatar: function AntdKitAvatar({ text }) {
    const aligned = useContext(AlignedContext);
    return (
      <AntAvatar
        // antd 的头像文字字重是 400，没有对应的 token
        style={aligned ? { fontWeight: 'var(--mh-c-avatar-weight)' } : undefined}
      >
        {text}
      </AntAvatar>
    );
  },
  /**
   * 徽标：antd 的 Badge（数字变化时有滚动动画）。读屏读不到它：数字写在它所标注的按钮的名字里，
   * antd 的数字（sup）没有 aria-hidden，对齐时渲染以后补上（原生保留 antd 的做法）。
   */
  Badge: function AntdKitBadge({ count, children }) {
    const aligned = useContext(AlignedContext);
    const root = useRef<HTMLSpanElement>(null);
    useLayoutEffect(() => {
      if (aligned)
        root.current?.querySelector('.ant-badge-count')?.setAttribute('aria-hidden', 'true');
    });
    return (
      <AntBadge
        ref={root}
        count={count}
        overflowCount={99}
        // antd 的徽标外层会把文字色改成正文色，被包住的图标跟着变色；对齐时沿用外面的颜色。
        // 外层是 inline-block、行高 1：被包住的图标落在一行文字里，按基线对齐会偏半像素，改成 inline-flex
        styles={aligned ? { root: { color: 'inherit', display: 'inline-flex' } } : undefined}
      >
        {children}
      </AntBadge>
    );
  },
  // 部件地图：用户看得见的那个框是 antd 的哪个元素（自动检查按这里找，不影响组件本身）
  /**
   * 表格：antd 的 Table。勾选用 rowSelection（受控，preserveSelectedRowKeys 留住别的页的勾选），
   * 排序用列的 sorter + sortOrder（受控、不在本地排：sorter: true），分页关掉（pagination={false}），
   * 交给套件的 Pagination；没有行时的内容交给 locale.emptyText。
   */
  Table: function AntdKitTable({
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
    const aligned = useContext(AlignedContext);
    const iconChoice = useIconSet(); // Hook 每次渲染都要调用，不能写在 && 后面
    const swap = aligned && swapsIcons(iconChoice);
    const ref = useRef<HTMLDivElement>(null);
    // 对齐时补读屏：antd 不把 aria-label 交给 <table>，加载中也不写 aria-busy
    useLayoutEffect(() => {
      const table = ref.current?.querySelector('table');
      if (!aligned || !table) return;
      table.setAttribute('aria-label', aria['aria-label']);
      if (loading) table.setAttribute('aria-busy', 'true');
      else table.removeAttribute('aria-busy');
    });
    const orderOf = (key: string) => (sort?.key === key ? sort.order : null);
    const antColumns: AntTableProps<TableRow>['columns'] = columns.map((column) => {
      const order = orderOf(column.key);
      const base = {
        key: column.key,
        dataIndex: column.key,
        width: column.width,
        align: column.align,
        render: (_: unknown, row: TableRow) => renderCell(row, column),
      };
      if (!column.sortable) return { ...base, title: column.title };
      // 对齐：antd 的排序是整个表头格子能点、能 Tab（th tabindex=0），图标是两个小三角、靠格子右边。
      // 统一成表头里一个按钮（文字 + 排序图标），th 上写 aria-sort
      if (aligned)
        return {
          ...base,
          title: (
            <button
              type="button"
              className="mh-table-sort"
              onClick={() => onSortChange(nextSort(sort, column.key))}
            >
              {column.title}
              {swap ? (
                <Icon
                  name={
                    order === 'asc'
                      ? 'chevron-up'
                      : order === 'desc'
                        ? 'chevron-down'
                        : 'chevrons-up-down'
                  }
                  {...(order ? { 'data-sorted': '' } : {})}
                />
              ) : null}
            </button>
          ),
          onHeaderCell: () =>
            (order
              ? { 'aria-sort': order === 'asc' ? 'ascending' : 'descending' }
              : {}) as HTMLAttributes<HTMLElement>,
        };
      return {
        ...base,
        title: column.title,
        sorter: true,
        sortOrder: order === 'asc' ? 'ascend' : order === 'desc' ? 'descend' : null,
      };
    });
    return (
      // 加载中整个表格不能操作（鼠标、键盘），这是接口约定，三档都是
      <div ref={ref} {...(aligned ? {} : aria)} inert={loading || undefined}>
        <AntTable<TableRow>
          rowKey="key"
          dataSource={rows}
          columns={antColumns}
          pagination={false}
          // 列宽由页面给：对齐时按给的宽度排（antd 默认 auto，内容会把列撑宽）
          tableLayout={aligned ? 'fixed' : undefined}
          loading={
            aligned
              ? {
                  spinning: !!loading,
                  indicator: swap ? (
                    <Icon name="loading" spin className="mh-table-spinner" />
                  ) : undefined,
                }
              : loading
          }
          locale={{ emptyText: empty }}
          rowSelection={
            selected
              ? {
                  selectedRowKeys: selected,
                  preserveSelectedRowKeys: true,
                  columnWidth: aligned ? 'var(--mh-c-table-selection-width)' : undefined,
                  onChange: (keys) => onSelectedChange?.(keys as string[]),
                  getCheckboxProps: (row) => ({ 'aria-label': selectLabel(row) }),
                  getTitleCheckboxProps: () => ({ 'aria-label': selectAllLabel }),
                }
              : undefined
          }
          onChange={(_pagination, _filters, sorter) => {
            const one = Array.isArray(sorter) ? sorter[0] : sorter;
            onSortChange(
              one?.order && one.columnKey
                ? { key: String(one.columnKey), order: one.order === 'ascend' ? 'asc' : 'desc' }
                : null,
            );
          }}
        />
      </div>
    );
  },
  /**
   * 分页：antd 的 Pagination，「共 N 条」用 showTotal。antd 的页码是能 Tab 的 <li>（回车翻页），
   * 没有角色、不认空格，上一页、下一页的名字是英文的 title；对齐时补上（role=button、aria-label、aria-current、空格）。
   */
  Pagination: function AntdKitPagination({
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
    const aligned = useContext(AlignedContext);
    const iconChoice = useIconSet();
    const swap = aligned && swapsIcons(iconChoice);
    const ref = useRef<HTMLElement>(null);
    useLayoutEffect(() => {
      if (!ref.current) return;
      const items = ref.current.querySelectorAll<HTMLElement>(
        '.ant-pagination-item, .ant-pagination-prev, .ant-pagination-next',
      );
      for (const li of items) {
        // 名字是接口约定（页面给的），三档都补
        if (li.classList.contains('ant-pagination-prev')) li.setAttribute('aria-label', prevLabel);
        else if (li.classList.contains('ant-pagination-next'))
          li.setAttribute('aria-label', nextLabel);
        else li.setAttribute('aria-label', pageLabel(Number(li.textContent)));
        // 角色、当前页只在对齐档补
        if (!aligned) continue;
        li.setAttribute('role', 'button');
        li.removeAttribute('title');
        if (li.classList.contains('ant-pagination-item-active'))
          li.setAttribute('aria-current', 'page');
        else li.removeAttribute('aria-current');
      }
    });
    return (
      <nav
        {...aria}
        ref={ref}
        // 空格也翻页（antd 只认回车）
        onKeyDown={(event) => {
          const target = event.target as HTMLElement;
          if (aligned && event.key === ' ' && target.getAttribute('role') === 'button') {
            event.preventDefault();
            target.click();
          }
        }}
      >
        <AntPagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger={false}
          showTotal={(count) => totalText(count)}
          onChange={(next) => onChange(next)}
          itemRender={(_, type, element) =>
            swap && (type === 'prev' || type === 'next') ? (
              <button type="button" className="ant-pagination-item-link" tabIndex={-1}>
                <Icon name={type === 'prev' ? 'chevron-left' : 'chevron-right'} />
              </button>
            ) : (
              element
            )
          }
        />
      </nav>
    );
  },
  /** 状态标签：antd 的 Tag，色调交给预设颜色（success、warning、error）。 */
  Tag: function AntdKitTag({ tone = 'default', children }) {
    const color = { default: undefined, success: 'success', warning: 'warning', danger: 'error' }[
      tone
    ];
    const aligned = useContext(AlignedContext);
    return (
      // 对齐：没有描边（filled），尺寸、字重在 styles.css
      <AntTag color={color} variant={aligned ? 'filled' : undefined}>
        {children}
      </AntTag>
    );
  },
  /**
   * 日期范围：antd 的 RangePicker（两个框、并排两个月）。值是 dayjs，进出时和「YYYY-MM-DD」互换。
   * 框只读（不打字），选完两天才通知页面。面板的尺寸在 styles.css（日期面板一节）。
   */
  DateRange: function AntdKitDateRange({
    value,
    onChange,
    placeholder,
    separator,
    labels,
    ...aria
  }) {
    const aligned = useContext(AlignedContext);
    const iconChoice = useIconSet();
    const swap = aligned && swapsIcons(iconChoice);
    const ref = useRef<HTMLDivElement>(null);
    // 对齐：antd 一聚焦就打开面板（Tab 被拦在第一个框里）；统一成点击、回车才打开
    const [open, setOpen] = useState(false);
    const pointer = useRef(false);
    useLayoutEffect(() => {
      ref.current?.querySelectorAll('input').forEach((input, i) => {
        // 两个框的名字是接口约定（页面给的），三档都补：antd 只给第一个框传 aria-label
        if (input.getAttribute('aria-label') !== labels[i])
          input.setAttribute('aria-label', labels[i]!);
        // 对齐时补读屏：combobox，面板开没开
        if (!aligned) return;
        const attrs = {
          role: 'combobox',
          'aria-haspopup': 'dialog',
          'aria-expanded': String(open),
        };
        for (const [name, v] of Object.entries(attrs))
          if (input.getAttribute(name) !== v) input.setAttribute(name, v);
      });
    });
    /** 框里的字和页面给的值不一样：用户打过字。 */
    const typed = (input: HTMLInputElement) => {
      const i = [...(ref.current?.querySelectorAll('input') ?? [])].indexOf(input);
      return input.value !== (value?.[i] ?? '');
    };
    return (
      <div
        ref={ref}
        {...aria}
        role="group"
        onMouseDownCapture={() => {
          pointer.current = true;
        }}
        onKeyDownCapture={(event) => {
          // 没打过字的回车：打开面板（打过字的回车交给 antd 提交）
          const input = event.target as HTMLInputElement;
          if (aligned && !open && event.key === 'Enter' && !typed(input)) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(true);
          }
        }}
      >
        <AntDatePicker.RangePicker
          open={aligned ? open : undefined}
          onOpenChange={(next) => {
            if (next && !pointer.current) return;
            pointer.current = false;
            setOpen(next);
          }}
          value={value ? [dayjs(value[0]), dayjs(value[1])] : null}
          onChange={(dates) => {
            // 清空（原生档的清空按钮）通知页面；只有一头的半截值不算（接口：两头都有才通知）
            if (!dates) return onChange(null);
            if (dates[0] && dates[1])
              onChange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
          }}
          format="YYYY-MM-DD"
          // 框能打字（键盘选日期的路径），打完回车提交
          // 对齐：框空着也能用 Tab 走过去（antd 默认把 Tab 当「确认这个框」，框空着就不让走，键盘出不去）
          allowEmpty={aligned ? [true, true] : undefined}
          placeholder={placeholder}
          separator={separator}
          // 统一设计没有「清空」：筛选栏的「重置」负责
          allowClear={!aligned}
          suffixIcon={swap ? <Icon name="calendar" /> : undefined}
          prevIcon={swap ? <Icon name="chevron-left" /> : undefined}
          nextIcon={swap ? <Icon name="chevron-right" /> : undefined}
          classNames={aligned ? { popup: { root: 'mh-date-popup' } } : undefined}
          style={aligned ? { width: '100%' } : undefined}
        />
      </div>
    );
  },
  /**
   * 对话框：antd 的 Modal。按 Esc、点右上角的叉都走 onCancel；点遮罩不关（接口约定，三档都是）。
   * 对齐：在窗口正中；打开后焦点进第一个输入框（antd 默认落在关闭按钮上）。
   * Esc 一层一层关、关上后焦点回到打开它的按钮，antd 自己都做了（全局的 Esc 栈）。
   * 焦点锁定：antd 不拦 Tab，等焦点跑出对话框（focusin）再拉回来；对话框后面没有能聚焦的东西时，
   * 焦点直接离开页面、没有 focusin，就锁不住（对话框挂在页面最后时常这样）。对齐时套件在两头接住 Tab。
   */
  Dialog: function AntdKitDialog({ open, onClose, title, children, footer, closeLabel }) {
    const portal = usePortal();
    const aligned = useContext(AlignedContext);
    const controls = useContext(ControlsContext);
    const iconChoice = useIconSet();
    const swap = aligned && swapsIcons(iconChoice);
    // 打开时把焦点放进第一个输入框（antd 的弹层晚一拍才渲染内容；只在打开那一刻做一次）
    const body = useFocusOnOpen(open, aligned, 'input, textarea, select, button');
    return (
      <AntModal
        open={open}
        title={title}
        onCancel={onClose}
        footer={footer}
        closable={{ 'aria-label': closeLabel, closeIcon: swap ? <Icon name="x" /> : undefined }}
        mask={{ closable: false }}
        centered={aligned}
        modalRender={
          aligned
            ? (node) => (
                <div
                  onKeyDown={(event) => {
                    if (event.key !== 'Tab') return;
                    const all = [
                      ...event.currentTarget.querySelectorAll<HTMLElement>(
                        'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
                      ),
                    ].filter((el) => !el.matches(':disabled') && el.getClientRects().length);
                    const first = all[0];
                    const last = all.at(-1);
                    if (!event.shiftKey && document.activeElement === last) {
                      event.preventDefault();
                      first?.focus();
                    } else if (event.shiftKey && document.activeElement === first) {
                      event.preventDefault();
                      last?.focus();
                    }
                  }}
                >
                  {node}
                </div>
              )
            : undefined
        }
        width={controls?.dialog.width}
        getContainer={() => portal ?? document.body}
      >
        <div ref={body}>{children}</div>
      </AntModal>
    );
  },
  /** 单选：antd 的 Radio.Group（原生的 radio：Tab 进到选中的那一项，方向键换选中）。 */
  Radio: function AntdKitRadio({ value, onChange, options, ...aria }) {
    return (
      <AntRadio.Group
        {...aria}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        options={options}
      />
    );
  },
  /** 多行输入：antd 的 Input.TextArea。 */
  Textarea: function AntdKitTextarea({ value, onChange, invalid, rows, ...rest }) {
    return (
      <AntInput.TextArea
        {...rest}
        rows={rows ?? 3}
        value={value}
        status={invalid ? 'error' : undefined}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  },
  parts: {
    field:
      '.ant-input-affix-wrapper, .ant-input:not(.ant-input-affix-wrapper .ant-input, textarea)',
    select: '.ant-select',
    checkbox: '.ant-checkbox',
    button: '.ant-btn:not([class*=variant-link])',
    tabIndicator: '.ant-tabs-ink-bar',
    popup: '.ant-select-dropdown',
    option: '.ant-select-item-option',
    switch: '.ant-switch',
    // 圆点的白底和阴影画在 .ant-switch-handle 的 ::before 上
    switchThumb: { selector: '.ant-switch-handle', pseudo: '::before' },
    // 导航菜单：叶子是 li.ant-menu-item，子菜单标题是 .ant-menu-submenu-title（role=menuitem 都在这两个框上）
    menuItem: '.ant-menu-item, .ant-menu-submenu-title',
    // 收起后的子菜单弹层：外层 .ant-menu-submenu-popup 是透明的定位壳，看得见的框是里面的 ul
    menuPopup: '.ant-menu-submenu-popup > .ant-menu',
    // 面包屑：能点的上级是 a.ant-breadcrumb-link（不能点的是 span.ant-breadcrumb-link）
    breadcrumbLink: 'a.ant-breadcrumb-link',
    // 下拉菜单：外层 .ant-dropdown 是定位壳，看得见的框是里面的 ul.ant-dropdown-menu
    dropdown: '.ant-dropdown-menu',
    dropdownItem: '.ant-dropdown-menu-item',
    avatar: '.ant-avatar',
    badge: '.ant-badge-count',
    // 文字提示：外层 .ant-tooltip 是定位壳（投影 filter 画在它上面），有底色的框是 .ant-tooltip-container
    // （role=tooltip 也在它上面），小箭头 .ant-tooltip-arrow 是它的兄弟
    tooltip: '.ant-tooltip-container',
    tableHead: '.ant-table-thead > tr > th',
    tableCell: '.ant-table-tbody > tr > td',
    tableSort: ':is(.mh-table-sort, .ant-table-column-sorters)',
    tag: '.ant-tag',
    pageItem: ':is(.ant-pagination-item, .ant-pagination-prev, .ant-pagination-next)',
    dateRange: '.ant-picker-range',
    datePopup: '.ant-picker-panel-container',
    dateCell: '.ant-picker-cell-inner',
    dialog: '.ant-modal-container',
    radio: '.ant-radio',
    textarea: 'textarea.ant-input',
  },
  profile: {
    framework: 'react',
    site: 'https://ant.design',
    tags: [
      { zh: 'CSS-in-JS', en: 'CSS-in-JS' },
      { zh: '主题用 token 推算', en: 'Seed tokens + algorithm' },
    ],
    styling: {
      zh: 'CSS-in-JS：样式在运行时由 JavaScript 生成，类名带一段随机后缀；v6 默认把取值写成 CSS 变量。',
      en: 'CSS-in-JS: styles are generated at runtime with hashed class names; v6 writes values as CSS variables by default.',
    },
    theming: {
      zh: '用 ConfigProvider 的 theme 传「种子」token（主色、圆角、控件高度……），antd 用算法推算出悬停、浅色等整套颜色；每个组件还有自己的组件 token。',
      en: 'ConfigProvider takes seed tokens (primary, radius, control height…); an algorithm derives hover and light shades; each component also has its own tokens.',
    },
    sizing: {
      zh: 'small / middle / large 三档，默认 24 / 32 / 40px，由 controlHeight 一组 token 决定；标签栏、复选框等部件按内边距加行高、或按控件高度的比例推算。',
      en: 'small / middle / large (24 / 32 / 40px by default) from the controlHeight tokens; tabs and checkboxes are derived from padding + line height or a ratio of the control height.',
    },
    look: {
      zh: '主色 #1677FF，圆角 6px，复选框 16px，下划线标签栏 46px 高，按钮字重 400、主按钮带一道阴影。',
      en: 'Primary #1677FF, 6px radius, 16px checkbox, 46px underlined tabs, weight-400 buttons with a shadow on primary.',
    },
    icons: {
      zh: '图标在单独的包 @ant-design/icons 里，每个图标是一个 React 组件（DownOutlined、EyeInvisibleOutlined……），有线框、实底、双色三种风格。组件里用到的图标是写死的，一部分留了替换属性：选择框的 suffixIcon、密码框的 iconRender、按钮的 loading.icon。复选框里的对勾不是图标，是 CSS 画的旋转边框。',
      en: 'Icons live in the separate @ant-design/icons package, one React component each (DownOutlined, EyeInvisibleOutlined…), in outlined, filled and two-tone styles. Icons inside components are built in; some can be replaced: suffixIcon on Select, iconRender on Password, loading.icon on Button. The checkbox check is not an icon but a rotated CSS border.',
    },
    accessibility: {
      zh: '现成的：开关是 button role=switch，标签栏 role=tab，选择框 role=combobox，复选框是原生 input，密码显隐是能 Tab 的 role=button（名字默认英文 Show / Hide，要配 locale）；收起后的菜单项悬停有 Tooltip，打开时项的 aria-describedby 指向它（只认鼠标，名字本来就在项里）。缺口在菜单和弹层：Menu 只有 ul 一个 Tab 停靠点，项和子菜单标题都是 tabIndex -1（标题的写死），下拉菜单的触发按钮没有 aria-haspopup、aria-expanded，面包屑当前页没有 aria-current，徽标数字没有 aria-hidden；对齐那一档套件逐项补上，原生那一档保留原样。',
      en: 'Built in: Switch is a button with role=switch, Tabs use role=tab, Select is a combobox, Checkbox is a native input, and the password toggle is a focusable role=button (named Show / Hide in English unless a locale is set); collapsed menu items get a hover Tooltip referenced by aria-describedby while open (mouse only; the item already carries the name). Gaps are in menus and popups: Menu is a single tab stop (the ul) with items and submenu titles at tabIndex -1 (hard-coded for titles), the Dropdown trigger has no aria-haspopup or aria-expanded, the current breadcrumb has no aria-current and the badge count is not aria-hidden; the aligned look patches each one, the native look keeps antd as is.',
    },
    setup: [
      {
        zh: '不用引入样式文件，外面包一层 ConfigProvider。',
        en: 'No stylesheet import; wrap with ConfigProvider.',
      },
      {
        zh: '弹层默认挂到 body，用 getPopupContainer 改。',
        en: 'Popups mount to body; change it with getPopupContainer.',
      },
    ],
  },
  adaptations: [
    adapt(
      'dateRange',
      'keyboard',
      [
        '一聚焦就打开面板；两个框都空着时按 Tab 走不出开始日期（Tab 被当成「确认这个框」，框空着就不让走）',
        'Opens on focus; with both boxes empty, Tab cannot leave the start box (Tab means “confirm this box”)',
      ],
      [
        '点击、回车、空格才打开；allowEmpty 让空着的框也能 Tab 过去；第二个框补上读屏名字',
        'Opens on click, Enter or Space; allowEmpty lets Tab pass empty boxes; the end box gets its label',
      ],
      'behavior',
    ),
    adapt(
      'dateRange',
      'a11y',
      [
        '两个框没有角色，只有第一个框能用属性给名字',
        'The boxes have no role and only the first one takes a label prop',
      ],
      [
        '两个框的名字三档都补；对齐时补 combobox、aria-haspopup、aria-expanded',
        'Both labels in every look; combobox, aria-haspopup and aria-expanded when aligned',
      ],
      'behavior',
    ),
    adapt(
      'dateRange',
      'shape',
      [
        '面板：每个月 288 宽（36 的格子里一个 24 的圆角块，范围的浅色带画在格子的 ::before 上），标题行 40、有按年翻的按钮，面板上方一个小箭头指着当前的框；触发框下面一道活动的蓝线、悬停有清空按钮',
        'Panel: 288px months (a 24px rounded block in a 36px cell, range band on the cell’s ::before), 40px header with year buttons, an arrow pointing at the active box; an active bar under the trigger and a clear button on hover',
      ],
      [
        '32 的方块紧挨着、范围浅底画在方块上，标题行 32、只按月翻，没有小箭头、活动蓝线和清空按钮',
        '32px squares side by side with the range fill on them, 32px header with month buttons only, no arrow, active bar or clear button',
      ],
      'style-override',
    ),
    adapt(
      'dialog',
      'size',
      [
        '离窗口顶 100、上下 20 左右 24 的留白、圆角 8、标题下面 8、底部按钮上面 12；关闭按钮 antd 自己的 16px 叉',
        '100px from the top, 20 / 24 padding, 8px radius, 8px under the title, 12px above the footer; antd’s own close icon',
      ],
      [
        '窗口正中、留白 24、面板圆角、标题下面 20、按钮上面 24；关闭按钮 32 的方块、图标集的 x',
        'Centred, 24px padding, panel radius, 20px under the title, 24px above the footer; a 32px close button with the icon-set x',
      ],
      'style-override',
    ),
    adapt(
      'dialog',
      'keyboard',
      [
        '打开后焦点落在关闭按钮上；点遮罩就关',
        'Focus lands on the close button; clicking the mask closes',
      ],
      [
        '打开后焦点进第一个输入框；点遮罩不关（接口约定，三档都是）；Esc 一层一层关、焦点锁定、关上后焦点回到打开它的按钮，antd 自己就做了',
        'Focus goes to the first field; the mask does not close (a contract in all three looks); layered Esc, focus trap and focus return are built in',
      ],
      'behavior',
    ),
    adapt(
      'dialog',
      'a11y',
      [
        '焦点锁定靠「焦点跑出去以后再拉回来」：对话框后面没有能聚焦的东西时，Tab 从最后一个按钮直接离开页面（检查页里偶尔出现）',
        'The focus trap pulls focus back after it leaves; with nothing focusable after the dialog, Tab from the last button leaves the page',
      ],
      [
        '对齐时套件在两头接住 Tab（最后一个往前绕到第一个，Shift+Tab 反过来）',
        'When aligned the kit wraps Tab at both ends',
      ],
      'behavior',
    ),
    adapt(
      'radio',
      'shape',
      [
        '文字左右各 8 的内边距、选项之间 8 的外边距；选中是主色底加 8 的白点；键盘聚焦是轮廓线',
        '8px padding on both sides of the label and 8px between options; checked is primary with an 8px dot; focus is an outline',
      ],
      [
        '文字离圆圈 8、两项隔 24；白点 6；聚焦是控件规格的外圈',
        '8px from the circle, 24px between options; a 6px dot; the spec focus ring',
      ],
      'component-token',
    ),
    adapt(
      'textarea',
      'size',
      ['上下 4 的内边距（一行 22 + 8 + 2）', '4px vertical padding'],
      [
        '上下留白取规格（第一行文字的位置和单行输入框一样），3 行，能往下拖',
        'Vertical inset from the spec (first line aligned with single-line inputs), 3 rows, vertical resize',
      ],
      'style-override',
    ),
    adapt(
      'table',
      'size',
      [
        '表头 55 高、行 55–57 高（上下 16 的内边距 + 22 的行高 + 1px 线），勾选列 32 宽',
        'Header 55px, rows 55–57px (16px padding + 22px line + 1px rule), 32px selection column',
      ],
      [
        '表头 40、行 44、勾选列 48，复选框在格子正中',
        'Header 40, rows 44, 48px selection column, checkbox centred',
      ],
      'style-override',
    ),
    adapt(
      'table',
      'color',
      [
        '表头 #fafafa 底、14px 600 的深色字，表头格子之间一道竖线，表头左上角 6 圆角；排了序的列整列变灰；勾选的行悬停再深一点',
        'Header #fafafa with 14px/600 dark text, vertical rules between header cells, 6px top-left radius; the sorted column turns grey; selected rows darken on hover',
      ],
      [
        '表头浅底、12px 500 的次要灰字，没有竖线和圆角；排序不改底色；勾选的行悬停不变',
        'Light header with 12px/500 secondary text, no rules or radius; sorting keeps the fill; selected rows keep their fill on hover',
      ],
      'component-token',
    ),
    adapt(
      'table',
      'keyboard',
      [
        '排序：整个表头格子能点、能 Tab（th tabindex=0，回车切换），两个小三角靠在格子右边',
        'Sorting: the whole header cell is clickable and tabbable (th tabindex=0, Enter toggles), two carets pushed to the right edge',
      ],
      [
        '表头里一个按钮：文字 + 图标集的排序图标（隔 4），th 上写 aria-sort；对齐时不用 antd 的 sorter',
        'A button in the header: label + sort icon from the icon set (4px gap), aria-sort on the th; antd’s sorter is not used when aligned',
      ],
      'behavior',
    ),
    adapt(
      'table',
      'state',
      [
        '加载中：表格 50% 不透明、再盖一层 40% 的白，加载图标是四个点，离顶部最多 200px（表格高过 400 就不在中间）；<table> 上没有 aria-label、aria-busy',
        'Loading: 50% opacity plus a 40% white veil, a four-dot spinner capped at 200px from the top; no aria-label or aria-busy on <table>',
      ],
      [
        '只变浅、不盖白，图标集的加载图标（20px、主色）在表格正中；补上 aria-label、aria-busy',
        'Fade only, no veil; the icon-set spinner (20px, primary) dead centre; aria-label and aria-busy added',
      ],
      'style-override',
    ),
    adapt(
      'table',
      'shape',
      [
        '部分选中：白底里一个主色小方块；没有行时格子上下 16 留白、悬停变色；最后一行下面也有线',
        'Indeterminate: a small primary square on white; the empty cell has 16px padding and a hover fill; the last row keeps its rule',
      ],
      [
        '部分选中：主色底加白色短横（图标集的 minus）；没有行时格子不留白、不变色；最后一行下面不画线',
        'Indeterminate: primary fill with a white dash (icon-set minus); empty cell has no padding or hover; no rule under the last row',
      ],
      'style-override',
    ),
    adapt(
      'checkbox',
      'state',
      ['键盘聚焦：复选框上 3px 的深色轮廓线', 'Keyboard focus: a 3px dark outline'],
      ['控件规格的外圈（3px 浅主色）', 'The spec focus ring (3px light primary)'],
      'style-override',
    ),
    adapt(
      'pagination',
      'type',
      [
        '当前页 600 字重；「共 N 条」离页码 8、正文颜色；上一页、下一页是 antd 的 12px 箭头',
        'Current page 600 weight; the total sits 8px from the items in body colour; 12px antd arrows for prev / next',
      ],
      [
        '当前页 500；「共 N 条」离页码 16、次要灰；上一页、下一页用图标集的 16px 箭头',
        'Current page 500; total 16px away in secondary grey; 16px arrows from the icon set',
      ],
      'style-override',
    ),
    adapt(
      'pagination',
      'a11y',
      [
        '页码是能 Tab 的 <li>，只认回车，没有角色；上一页、下一页的名字是英文的 title（Previous Page）',
        'Page items are tabbable <li> elements, Enter only, no role; prev / next are named by an English title',
      ],
      [
        '名字三档都补（「第 2 页」「上一页」「下一页」）；对齐时补 role=button、aria-current，空格也能翻页',
        'Names in every look (“第 2 页”, prev, next); role=button, aria-current and Space when aligned',
      ],
      'behavior',
    ),
    adapt(
      'tag',
      'size',
      [
        '22 高、左右 7、400 字重、右边 8 的外边距；成功、提醒、出错的浅底由 antd 从状态色推算（成功是 rgb(211, 227, 214)）',
        '22px tall, 7px padding, 400 weight, 8px right margin; tinted fills derived by antd (success is rgb(211, 227, 214))',
      ],
      [
        '20 高、左右 6、500，没有外边距；浅底和字色取控件规格',
        '20px, 6px padding, 500, no margin; fills and text colours from the spec',
      ],
      'component-token',
    ),
    adapt(
      'switch',
      'color',
      [
        '关是 25% 的黑，悬停时开、关都变色（关着变深、开着变浅）；圆点带一道偏绿的阴影',
        'Off is 25% black; on hover both states change color (off darkens, on lightens); the thumb has a greenish shadow',
      ],
      [
        '关是控件边框色，悬停不变色，阴影取控件规格',
        'Off uses the control border color, no hover change, shadow from the spec',
      ],
      'component-token',
    ),
    adapt(
      'switch',
      'state',
      ['禁用时 65% 不透明度', 'Disabled at 65% opacity'],
      ['禁用时 50% 不透明度', 'Disabled at 50% opacity'],
      'component-token',
    ),
    adapt(
      'switch',
      'keyboard',
      ['键盘聚焦是一圈主色浅色的轮廓线', 'Keyboard focus is a light primary outline'],
      ['控件规格的 3px 外圈', 'The 3px ring from the spec'],
      'style-override',
    ),
    adapt(
      'text',
      'type',
      ['大号控件用 16px 字', 'Large controls use 16px text'],
      ['大号控件也用规范的正文字号', 'Large controls use the body size too'],
      'theme-token',
    ),
    adapt(
      'text',
      'size',
      [
        '一行高 1.5714 倍字号，15px 字是 23.57px',
        'Line height is 1.5714 × font size (23.57px at 15px)',
      ],
      ['一行高取控件规格里的整数像素', 'Line height is a whole pixel from the control spec'],
      'theme-token',
    ),
    adapt(
      'button',
      'color',
      [
        '悬停、按下、浅色背景都由主色自动推算',
        'Hover, active and light shades are derived from the primary',
      ],
      [
        '规范里的悬停色作为 colorPrimaryHover 传入；按下色仍由 antd 推算',
        'The spec hover is passed as colorPrimaryHover; antd still derives the active shade',
      ],
      'theme-token',
    ),
    adapt(
      'checkbox',
      'size',
      [
        '复选框按控件高度的一半推算（36px 控件 → 18px）',
        'The checkbox is half the control height (18px for 36px controls)',
      ],
      ['固定为控件规格里的 16px', 'Fixed at 16px from the control spec'],
      'theme-token',
    ),
    adapt(
      'checkbox',
      'state',
      ['复选框没有出错样式', 'No error style on checkboxes'],
      ['出错时红色描边', 'Red border when invalid'],
      'prop',
    ),
    adapt(
      'tabs',
      'size',
      [
        '标签高度 = 上下 12px 内边距 + 一行文字（46px）',
        'Tab height is 12px padding + one line (46px)',
      ],
      ['内边距由规格里的高度倒推（40px）', 'Padding is derived from the spec height (40px)'],
      'component-token',
    ),
    adapt(
      'tabs',
      'color',
      [
        '未选中是正文色，选中只变色不加粗',
        'Inactive tabs use body color; active only changes color',
      ],
      ['未选中次要灰，选中主色加粗', 'Inactive secondary gray, active primary and medium weight'],
      'component-token',
    ),
    adapt(
      'tabs',
      'keyboard',
      ['← → 只移动焦点，按回车才切换', 'Arrow keys only move focus; Enter switches'],
      [
        '移动焦点的同时切换（和 Element、shadcn 一致）',
        'Arrow keys move focus and switch, like Element and shadcn',
      ],
      'behavior',
    ),
    adapt(
      'button',
      'type',
      ['按钮字重 400，主按钮带一道阴影', 'Buttons are weight 400; primary has a shadow'],
      ['字重 500，没有阴影', 'Weight 500, no shadow'],
      'component-token',
    ),
    adapt(
      'button',
      'size',
      [
        '默认和大号按钮都是 15px 左右内边距',
        'Default and large buttons both have 15px horizontal padding',
      ],
      [
        '文字离外边框取控件规格：默认 16px、大号 20px',
        'Text inset from the spec: 16px default, 20px large',
      ],
      'component-token',
    ),
    adapt(
      'checkbox',
      'size',
      [
        '复选框的文字左右各留 8px，文字后面多出 8px 空白',
        'The label is padded 8px on both sides, leaving 8px of space after the text',
      ],
      [
        '只留方块和文字之间的 8px，文字后面的距离由页面布局决定',
        'Only the 8px between box and text remains; space after the text belongs to the layout',
      ],
      'prop',
    ),
    adapt(
      'button',
      'state',
      ['次要按钮悬停变成主色描边加主色字', 'Secondary hover turns the border and text primary'],
      ['悬停是浅灰底', 'Hover is a light gray background'],
      'component-token',
    ),
    adapt(
      'link',
      'size',
      [
        '链接按钮 32px 高，放进输入框会把它撑到 52px',
        'Link buttons are 32px tall and stretch inputs to 52px',
      ],
      ['只占一行文字高', 'Takes one line of text'],
      'prop',
    ),
    adapt(
      'popup',
      'color',
      [
        '选中项底色由主色推算，主色很深时是深灰底配深色字',
        'The selected option is tinted from the primary; dark primaries give dark gray',
      ],
      [
        '选中浅底加粗，悬停浅灰',
        'Selected is a light fill with medium weight; hover is light gray',
      ],
      'component-token',
    ),
    adapt(
      'popup',
      'state',
      ['展开时已选的值降到 25% 透明度', 'The selected value fades to 25% while open'],
      ['保持清晰，箭头朝上', 'Stays clear; the arrow points up'],
      'prop',
    ),
    adapt(
      'popup',
      'size',
      ['下拉离输入框约 3.5px', 'The dropdown sits about 3.5px below'],
      ['取规格里的 4px', 'Uses the 4px from the spec'],
      'prop',
    ),
    adapt(
      'select',
      'icon',
      ['下拉箭头是 antd 自己的图标', 'The select arrow is antd’s own icon'],
      ['规范图标集里的下拉箭头（suffixIcon）', 'The arrow from the spec’s icon set (suffixIcon)'],
      'prop',
    ),
    adapt(
      'checkbox',
      'icon',
      ['对勾是方块的 ::after 画的旋转边框', 'The check is a rotated border on the box’s ::after'],
      [
        '规范图标集里的对勾，用 CSS 遮罩画',
        'The check from the spec’s icon set, drawn as a CSS mask',
      ],
      'style-override',
    ),
    adapt(
      'field',
      'icon',
      [
        '密码显隐是 antd 自己的眼睛图标（span role=button，能 Tab；名字默认英文 Show / Hide）',
        'The password toggle is antd’s own eye icon (a focusable span role=button, named Show / Hide in English by default)',
      ],
      [
        '套件画显隐按钮（button），图标来自规范图标集，名字取文案表',
        'The kit draws a real button with the spec’s icons, named from the copy table',
      ],
      'behavior',
    ),
    adapt(
      'button',
      'icon',
      ['加载图标是 antd 自己的', 'The loading icon is antd’s own'],
      [
        '规范图标集里的加载图标（loading.icon）',
        'The loading icon from the spec’s icon set (loading.icon)',
      ],
      'prop',
    ),
    // —— 导航菜单（antd 6.6.5 原生实测：侧栏 220 宽、黑白规范「只设主题」以外的默认值）——
    adapt(
      'nav',
      'size',
      [
        '菜单项 40 高、上下外边距各 4（相邻两项隔 4，子菜单标题和第一个子项、最后一个子项和下一项隔 8），左右外边距 4（项 211 宽），菜单本身没有留白',
        'Items are 40px tall with 4px vertical margins (4px apart, 8px around an open submenu) and 4px side margins (211px wide); the menu has no padding',
      ],
      [
        '项 36 高、只留下边距（相邻两项隔 2），菜单四周留白 8，项 204 宽',
        'Items are 36px tall with a bottom margin only (2px apart), 8px menu padding, 204px wide',
      ],
      'component-token',
    ),
    adapt(
      'nav',
      'shape',
      [
        '菜单白底、右边一道 1px 分隔线，展开的子菜单整块 2% 的黑底',
        'The menu is white with a 1px right border; open submenus get a 2% black fill',
      ],
      [
        '菜单透明、没有分隔线（分隔线归页面布局）',
        'Transparent menu, no border (the divider belongs to the layout)',
      ],
      'component-token',
    ),
    adapt(
      'nav',
      'size',
      [
        '一级项左内边距 24，子菜单里的项按层级缩进 48（inlineIndent 24 × 层数，写在行内样式上）；文字离项左边 50、子项 48',
        'Top-level items are padded 24px; nested items are indented 48px (inlineIndent 24 × level, as inline styles); text sits at 50px, nested at 48px',
      ],
      [
        '图标离左边 12（inlineIndent），子项用项自己的 style 盖掉缩进，文字都在 38',
        'Icons at 12px (inlineIndent); nested items override the indent with their own style, so all text sits at 38px',
      ],
      'prop',
    ),
    adapt(
      'nav',
      'color',
      [
        '选中项浅蓝底（#E6F4FF）主色字，悬停 6% 的黑底，图标和文字同色；有选中项的子菜单标题是主色',
        'Selected is light blue (#E6F4FF) with primary text; hover is 6% black; icons share the text color; a submenu with a selected child turns primary',
      ],
      [
        '选中、悬停、子菜单标题的颜色取控件规格；图标次要灰，选中时和文字一起变',
        'Selected, hover and parent colors from the spec; icons are secondary gray and follow the selected color',
      ],
      'component-token',
    ),
    adapt(
      'nav',
      'type',
      ['选中项只变色，字重 400', 'Selected items only change color (weight 400)'],
      ['选中项字重 500', 'Selected items are weight 500'],
      'style-override',
    ),
    adapt(
      'nav',
      'icon',
      [
        '子菜单箭头是两道 CSS 画的短线（10 宽，离右边 16），展开时翻转',
        'The submenu arrow is two CSS-drawn bars (10px wide, 16px from the right) that flip when open',
      ],
      [
        '规范图标集的 chevron-down（expandIcon），离右边 12，展开时转 180°',
        'The spec’s chevron-down (expandIcon), 12px from the right, rotated 180° when open',
      ],
      'prop',
    ),
    adapt(
      'nav',
      'state',
      [
        '收起后菜单 80 宽（collapsedWidth = 2 × 大号控件高），在 64 宽的侧栏里被裁掉一截，项 71×40；有选中项的子菜单只把图标变成主色',
        'Collapsed, the menu is 80px wide (2 × large control height) and gets clipped by the 64px sider, items 71×40; a submenu with a selected child only tints its icon',
      ],
      [
        '宽度跟着侧栏（项 48×36，图标居中）；有选中项的子菜单画成选中的样子（选中底色、选中色图标）',
        'Width follows the sider (items 48×36, icon centered); a submenu with a selected child is drawn as selected',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'shape',
      [
        '收起后悬停 0.1s 弹出子菜单（缩放动画）：贴着菜单项右边、左边留 8 的透明壳，弹层没有描边、圆角 8、三层阴影、内边距 0；项 152×40、左右外边距 4、左内边距 16，选中浅蓝底主色字',
        'Collapsed, a submenu flies out after 0.1s (zoom): 8px from the item inside a transparent shell, no border, 8px radius, three-layer shadow, no padding; items 152×40 with 4px margins and 16px padding, selected light blue',
      ],
      [
        '弹层左边离侧栏右边缘 popup.offset（壳的左内边距 = 侧栏留白 + 1px 分隔线 + offset，鼠标移过去不断），外框和选项取下拉（popup）一组',
        'The flyout sits popup.offset from the sider edge (the shell’s padding bridges the gap); frame and options from the popup spec',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'shape',
      [
        '收起后没有子菜单的项悬停 0.1s 出现文字提示（缩放动画），移开 0.1s 关上：85% 的黑底白字、14/22、上下 6 左右 8、圆角 6、最小 32 高，带 16px 的小箭头和三层投影（filter），左边离菜单项右边 12（半个箭头 8 + 4），上下居中',
        'Collapsed leaf items show a tooltip after 0.1s (zoom) and hide 0.1s after leaving: white on 85% black, 14/22, 6/8 padding, 6px radius, 32px min height, a 16px arrow and a three-layer drop shadow, 12px right of the item (half the arrow + 4), centered',
      ],
      [
        '取控件规格的文字提示：12/20、左右 8 上下 4、控件圆角，没有小箭头和投影；左边离侧栏右边缘 popup.offset（Menu 的 tooltip 属性：arrow、align、styles），延时沿用 antd 的 0.1s',
        'The spec tooltip: 12/20, 8/4 padding, control radius, no arrow or shadow, popup.offset off the sider edge (Menu’s tooltip prop: arrow, align, styles); antd’s 0.1s delay stays',
      ],
      'prop',
    ),
    adapt(
      'nav',
      'state',
      [
        '用鼠标点了收起后弹层里的项，鼠标还停在弹层上时弹层马上又被打开',
        'Clicking an item in the collapsed flyout reopens it while the pointer is still over it',
      ],
      [
        '点了就关上，鼠标回到菜单上以后照常悬停打开',
        'It closes on click; hovering the menu again works as usual',
      ],
      'behavior',
    ),
    adapt(
      'nav',
      'state',
      ['悬停、选中的底色过渡 0.3s', 'Hover and selection fade over 0.3s'],
      ['取规范的动效时长', 'Uses the spec’s motion duration'],
      'component-token',
    ),
    adapt(
      'nav',
      'a11y',
      [
        '整个菜单只有一个 Tab 停靠点（ul），项和子菜单标题都是 tabIndex -1（标题的写死在 rc-menu 里），Tab 进不去，只能先聚焦菜单再用 ↑ ↓',
        'The whole menu is one tab stop (the ul); items and submenu titles are tabIndex -1 (hard-coded for titles in rc-menu), so Tab never reaches them; only arrows move between items',
      ],
      [
        '每个看得见的项都能 Tab（叶子用 items 的 tabIndex，子菜单标题在渲染后改 DOM），菜单本身移出 Tab 顺序；方向键照旧',
        'Every visible item is a tab stop (leaves via items’ tabIndex, submenu titles patched after render); the ul leaves the tab order; arrows still work',
      ],
      'behavior',
    ),
    adapt(
      'nav',
      'keyboard',
      ['只认回车，空格没反应', 'Enter works, Space does nothing'],
      [
        '空格和回车一样（收起后的子菜单标题按空格也打开弹层）',
        'Space acts like Enter (it also opens the collapsed flyout)',
      ],
      'behavior',
    ),
    adapt(
      'nav',
      'keyboard',
      [
        '在叶子上按回车，除了选中，还把这个叶子当成子菜单「展开」（onOpenChange 里多一个叶子；收起后的弹层关了又开）',
        'Enter on a leaf also “opens” it as a submenu (onOpenChange gets the leaf key; the collapsed flyout reopens)',
      ],
      [
        '套件不理这次通知，open 只记子菜单（三档外观都这样，它会改坏业务状态）',
        'The kit ignores it; open only lists submenus (in every look, since it corrupts business state)',
      ],
      'behavior',
    ),
    adapt(
      'nav',
      'keyboard',
      [
        '键盘聚焦是一圈 outline；收起后在弹层里按回车选中，焦点跟着弹层消失（掉到 body）',
        'Keyboard focus is an outline; choosing in the collapsed flyout with Enter drops focus to body',
      ],
      [
        '控件规格的 3px 外圈；焦点回到子菜单标题',
        'The 3px ring from the spec; focus returns to the submenu title',
      ],
      'style-override',
    ),
    // —— 面包屑 ——
    adapt(
      'breadcrumb',
      'color',
      [
        '链接、分隔符、不能点的上级都是 45% 的黑，当前页 88% 的黑',
        'Links, separators and plain ancestors are 45% black; the current page is 88% black',
      ],
      ['各取控件规格的颜色（分隔符更浅）', 'Each from the spec (a lighter separator)'],
      'component-token',
    ),
    adapt(
      'breadcrumb',
      'state',
      [
        '链接左右 4px 内边距（再用 -4px 外边距抵消），悬停 6% 的黑底；键盘聚焦是 outline',
        'Links have 4px side padding (offset by -4px margins) and a 6% black hover fill; focus is an outline',
      ],
      [
        '没有内边距、悬停不加底色，只变色；聚焦是控件规格的 3px 外圈',
        'No padding, no hover fill, only the color changes; focus is the 3px ring',
      ],
      'component-token',
    ),
    adapt(
      'breadcrumb',
      'a11y',
      [
        '当前页是普通 span，没有 aria-current：读屏不知道哪一项是当前所在的页',
        'The current page is a plain span without aria-current, so screen readers can’t tell it is the current page',
      ],
      [
        '当前页加 aria-current="page"（写在 items 里，antd 原样放到 span 上）',
        'The current page gets aria-current="page" (set in items; antd passes it to the span)',
      ],
      'prop',
    ),
    // —— 下拉菜单 ——
    adapt(
      'dropdown',
      'shape',
      [
        '弹层没有描边、圆角 8、三层阴影，宽度等于触发按钮（这里 116）',
        'No border, 8px radius, three-layer shadow, as wide as the trigger (116px here)',
      ],
      [
        '1px 描边，圆角、阴影、内边距取 popup 一组，最小宽 160（menu.style）',
        '1px border; radius, shadow and padding from the popup spec; min width 160 (menu.style)',
      ],
      'prop',
    ),
    adapt(
      'dropdown',
      'color',
      [
        '图标和文字同色；危险项悬停变成红底白字；分隔线不盖住左右内边距',
        'Icons share the text color; danger items turn white on red when hovered; the divider stops at the padding',
      ],
      [
        '图标次要灰；危险项悬停浅灰底、仍是红字；分隔线横跨整个内宽',
        'Secondary gray icons; danger hover is light gray with red text; the divider spans the full width',
      ],
      'style-override',
    ),
    adapt(
      'dropdown',
      'keyboard',
      [
        '回车打开以后焦点留在按钮上（↓ 不进菜单，要先按 Tab）；选中或在项上按 Esc 以后焦点掉到 body',
        'Enter opens but focus stays on the trigger (↓ does nothing until Tab); after choosing or Esc on an item, focus drops to body',
      ],
      [
        '回车、空格打开后焦点进第一项；选中、Esc 以后焦点回到按钮',
        'Enter or Space focuses the first item; choosing or Esc returns focus to the trigger',
      ],
      'behavior',
    ),
    adapt(
      'dropdown',
      'a11y',
      [
        '触发按钮没有 aria-haspopup、aria-expanded：读屏不知道它能打开菜单、菜单开没开',
        'The trigger has no aria-haspopup or aria-expanded, so screen readers can’t tell it opens a menu or whether it is open',
      ],
      [
        '触发按钮补上 aria-haspopup="menu" 和跟着开关变的 aria-expanded',
        'The trigger gets aria-haspopup="menu" and an aria-expanded that follows the open state',
      ],
      'behavior',
    ),
    // —— 头像 ——
    adapt(
      'avatar',
      'size',
      ['32px（控件高度）、14px 字', '32px (the control height), 14px text'],
      ['28px、12px 字', '28px, 12px text'],
      'component-token',
    ),
    adapt(
      'avatar',
      'color',
      ['灰底（25% 的黑）白字，字重 400', 'Gray (25% black) with white text, weight 400'],
      ['浅底深字，字重 500', 'Light fill, dark text, weight 500'],
      'component-token',
    ),
    // —— 徽标 ——
    adapt(
      'badge',
      'size',
      [
        '高 20（一行文字高减 2）、最小宽 20、字重 400，外面一圈 1px 白边',
        '20px tall (one line minus 2), 20px min width, weight 400, a 1px white ring',
      ],
      [
        '高 16、最小宽 16、左右 4、字重 500，没有外圈',
        '16px tall, 16px min width, 4px sides, weight 500, no ring',
      ],
      'component-token',
    ),
    adapt(
      'badge',
      'color',
      [
        '徽标外层把文字色改成正文色，被包住的铃铛跟着变深；外层是 inline-block、行高 1，铃铛按基线偏半像素',
        'The wrapper resets the text color, darkening the bell; it is inline-block with line-height 1, nudging the bell half a pixel',
      ],
      [
        '沿用按钮的颜色，外层改成 inline-flex',
        'Keeps the button’s color; the wrapper becomes inline-flex',
      ],
      'prop',
    ),
    adapt(
      'badge',
      'a11y',
      [
        '数字（sup）没有 aria-hidden，还带 title：徽标不在一个有名字的按钮里时，读屏会读出一个没头没尾的数字',
        'The count (sup) is not aria-hidden and has a title; outside a named button, screen readers read a bare number',
      ],
      [
        '数字加 aria-hidden（渲染以后改 DOM），未读数写在被标注的按钮名字里（「通知，5 条未读」）',
        'The count is aria-hidden (patched after render); the number goes into the labelled button’s name (“Notifications, 5 unread”)',
      ],
      'behavior',
    ),
  ],
};
