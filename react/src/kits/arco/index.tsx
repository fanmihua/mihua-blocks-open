// Arco 官方的 React 19 适配：让它的消息、弹窗等命令式接口用 react-dom/client 渲染。
import '@arco-design/web-react/es/_util/react-19-adapter';
import {
  Avatar as ArcoAvatar,
  Badge as ArcoBadge,
  Breadcrumb as ArcoBreadcrumb,
  Button as ArcoButton,
  Checkbox as ArcoCheckbox,
  ConfigProvider,
  DatePicker as ArcoDatePicker,
  Dropdown as ArcoDropdown,
  Input as ArcoInput,
  Menu as ArcoMenu,
  Modal as ArcoModal,
  Pagination as ArcoPagination,
  Radio as ArcoRadio,
  Select as ArcoSelect,
  Switch as ArcoSwitch,
  Table as ArcoTable,
  Tabs as ArcoTabs,
  Tag as ArcoTag,
} from '@arco-design/web-react';
import type { TableColumnProps as ArcoColumnProps } from '@arco-design/web-react';
import type { SelectHandle } from '@arco-design/web-react/es/Select/interface';
import {
  IconClose,
  IconEye,
  IconEyeInvisible,
  IconLoading,
  IconSort,
  IconSortAscending,
  IconSortDescending,
} from '@arco-design/web-react/icon';
import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  adapt,
  iconSetOf,
  nextSort,
  px,
  swapsIcons,
  resolveControls,
  rgbTriplet,
  roleMapping,
  shade,
  themeMappingValues,
  tint,
  type ControlSpec,
  type NavItem,
  type ResolvedTokens,
  type TableRow,
} from '@mihua/spec';
import { useIconSet, usePortal } from '../../context';
import { Icon } from '../../icon';
import { PasswordToggle } from '../../kit/PasswordToggle';
import { useFocusOnOpen } from '../../kit/useFocusOnOpen';
import type { Kit } from '../../kit/types';

/** Arco 的颜色梯度 1–7：1–4 是浅色背景，5 是悬停，6 是本色，7 是按下。 */
function scale(name: string, color: string, hover: string): Record<string, string> {
  const steps = [
    tint(color, 0.92),
    tint(color, 0.8),
    tint(color, 0.6),
    tint(color, 0.35),
    hover,
    color,
    shade(color, 0.15),
  ];
  return Object.fromEntries(steps.map((value, i) => [`--${name}-${i + 1}`, rgbTriplet(value)]));
}

/**
 * 语义 token → Arco Design 的 CSS 变量。
 * Arco 的颜色变量写成 "51,112,255" 这样的 RGB 三元组（组件里用 rgb(var(--primary-6)) 取色），
 * 所以要先换算；变量写在套件的包裹元素上，只影响这个组件，不影响页面上的其他 Arco 组件。
 */
/** 第 5 档来自独立的悬停角色；它不是主操作色的派生关系。 */
export function arcoRoleMappings(t: ResolvedTokens) {
  return {
    '--primary-1': roleMapping(t, 'action.primary', '混白 92%，再转换为 RGB 三元组。', (v) =>
      rgbTriplet(tint(v, 0.92)),
    ),
    '--primary-2': roleMapping(t, 'action.primary', '混白 80%，再转换为 RGB 三元组。', (v) =>
      rgbTriplet(tint(v, 0.8)),
    ),
    '--primary-3': roleMapping(t, 'action.primary', '混白 60%，再转换为 RGB 三元组。', (v) =>
      rgbTriplet(tint(v, 0.6)),
    ),
    '--primary-4': roleMapping(t, 'action.primary', '混白 35%，再转换为 RGB 三元组。', (v) =>
      rgbTriplet(tint(v, 0.35)),
    ),
    '--primary-5': roleMapping(
      t,
      'action.primaryHover',
      '独立的悬停色，转换为 RGB 三元组。',
      rgbTriplet,
    ),
    '--primary-6': roleMapping(
      t,
      'action.primary',
      '主色转换为 RGB 三元组，供 rgb(var(--primary-6)) 使用。',
      rgbTriplet,
    ),
    '--primary-7': roleMapping(t, 'action.primary', '混黑 15%，再转换为 RGB 三元组。', (v) =>
      rgbTriplet(shade(v, 0.15)),
    ),
    '--border-radius-small': roleMapping(
      t,
      'radius.control',
      '保留 px，交给组件库的小号圆角变量。',
    ),
    '--border-radius-medium': roleMapping(
      t,
      'radius.control',
      '保留 px，交给组件库的中号圆角变量。',
    ),
  };
}

export function arcoVariables(t: ResolvedTokens): Record<string, string> {
  const danger = t['feedback.danger'];
  const success = t['feedback.success'];
  const warning = t['feedback.warning'];
  return {
    ...themeMappingValues(arcoRoleMappings(t)),
    ...scale('link', t['text.link'], tint(t['text.link'], 0.15)),
    ...scale('danger', danger, tint(danger, 0.15)),
    ...scale('success', success, tint(success, 0.15)),
    ...scale('warning', warning, tint(warning, 0.15)),
    '--color-text-1': t['text.strong'],
    '--color-text-2': t['text.body'],
    '--color-text-3': t['text.secondary'],
    '--color-text-4': t['text.disabled'],
    '--color-border-1': t['border.default'],
    '--color-border-2': t['border.default'],
    '--color-border-3': t['border.control'],
    '--color-fill-1': t['surface.subtle'],
    '--color-fill-2': t['surface.subtle'],
    '--color-fill-3': t['surface.hover'],
    '--color-secondary': t['surface.subtle'],
    '--color-secondary-hover': t['surface.hover'],
    '--color-secondary-active': t['surface.selected'],
    '--color-bg-1': t['surface.base'],
    '--color-bg-2': t['surface.base'],
    '--color-bg-popup': t['surface.base'],
  };
}

/** Arco 的控件只有固定几档高度，先取与 token 最接近的一档（字号、内边距跟着这一档走）。 */
function arcoSize(height: number): 'small' | 'default' | 'large' {
  const steps = [
    ['small', 28],
    ['default', 32],
    ['large', 36],
  ] as const;
  return steps.reduce((best, step) =>
    Math.abs(step[1] - height) < Math.abs(best[1] - height) ? step : best,
  )[0];
}

/**
 * 当前规范对应的控件高度，由 Provider 提供；每个 Provider 各管各的，互不影响。
 * exact：接上规范时为 true，再把高度精确设成规范值——输入框用 Arco 官方的 height 属性，
 * 按钮和选择框用行内高度。原生模式为 false，停在 Arco 自己的那一档。
 */
const HeightContext = createContext<{
  default: number;
  large: number;
  exact: boolean;
  popupGap?: number;
}>({ default: 32, large: 36, exact: false });
/** 控件规格（接上规范并对齐时才有）：弹层距离、缩进这类只能写成组件属性的数字从这里取。 */
const ControlsContext = createContext<ControlSpec | null>(null);

function useArcoHeight(size: 'default' | 'large' = 'default') {
  const heights = useContext(HeightContext);
  return {
    size: arcoSize(heights[size]),
    height: heights.exact ? heights[size] : undefined,
  };
}

/** 下拉菜单的触发按钮（页面画的）上，套件要接的属性和事件。 */
type TriggerElementProps = {
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  'aria-haspopup'?: 'menu';
  'aria-expanded'?: boolean;
};

/** 文字链接只占一行文字的高度（Arco 的 mini 按钮是 24px 高、12px 字）。 */
const INLINE_LINK = {
  height: 'auto',
  padding: 0,
  borderWidth: 0,
  fontSize: 'var(--mh-c-text-size)',
  lineHeight: 'var(--mh-c-text-line)',
};

/**
 * 表格表头的勾选格（Arco 自己画的 <th>，里面的 Checkbox 不收属性）：给它换上规范图标集里的对勾。
 * Arco 的 components.header.operations 交出它画好的格子，这里只给里面的 Checkbox 加 icon。
 */
function headerOperations(icon: ReactElement) {
  const withIcon = (node: ReactNode): ReactNode => {
    if (!isValidElement<{ indeterminate?: boolean; children?: ReactNode }>(node)) return node;
    // 表头的 Checkbox：带 indeterminate 属性的那个元素
    if ('indeterminate' in node.props) return cloneElement(node, { icon } as object);
    const { children } = node.props;
    if (children === undefined) return node;
    return cloneElement(
      node,
      {},
      ...(Array.isArray(children) ? children : [children]).map(withIcon),
    );
  };
  return ({ selectionNode, expandNode }: { selectionNode?: ReactNode; expandNode?: ReactNode }) => [
    { name: 'expandNode', node: expandNode },
    { name: 'selectionNode', node: withIcon(selectionNode) },
  ];
}

/** 打的字是不是一个真实存在的日期（YYYY-MM-DD）。 */
function isDate(text: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const [y, m, d] = text.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export const arcoKit: Kit = {
  id: 'arco',
  name: 'Arco Design',
  Provider: ({ tokens, aligned = true, children }) => {
    const portal = usePortal();
    const controls = tokens && aligned ? resolveControls(tokens) : null;
    const heights =
      tokens && aligned
        ? {
            default: px(tokens['size.control']),
            large: px(tokens['size.controlLarge']),
            exact: true,
            popupGap: controls!.popup.offset,
          }
        : { default: 32, large: 36, exact: false };
    return (
      <ConfigProvider getPopupContainer={() => portal ?? document.body}>
        <HeightContext.Provider value={heights}>
          <ControlsContext.Provider value={controls}>
            <div
              // --aligned：styles.css 里按统一设计调整输入框底色、标签栏、复选框和下拉（见那里的说明）
              className={[
                'mh-kit-arco',
                tokens && aligned && 'mh-kit-arco--aligned',
                tokens && aligned && swapsIcons(tokens['icon.set']) && 'mh-kit-arco--icons',
              ]
                .filter(Boolean)
                .join(' ')}
              style={tokens ? (arcoVariables(tokens) as CSSProperties) : undefined}
            >
              {children}
            </div>
          </ControlsContext.Provider>
        </HeightContext.Provider>
      </ConfigProvider>
    );
  },
  Button: function ArcoKitButton({
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
    const { size: arcoSizeValue, height } = useArcoHeight(size);
    const aligned = useContext(HeightContext).exact;
    const link = variant === 'link';
    // Arco 的加载图标写死是它自己的 IconLoading，换不掉；接上规范时由套件画加载状态：
    // 用规范图标集里的加载图标，整个按钮按控件规格降低不透明度（Arco 默认盖一层白色遮罩）。
    const ownLoading = aligned && loading;
    const iconChoice = useIconSet(); // Hook 每次渲染都要调用，不能写在 && 后面
    const swap = aligned && swapsIcons(iconChoice);
    const shownIcon = ownLoading ? (
      swap ? (
        <Icon name="loading" spin className="mh-btn-spinner" />
      ) : (
        <IconLoading />
      )
    ) : (
      icon
    );
    return (
      <ArcoButton
        type={variant === 'primary' ? 'primary' : variant === 'secondary' ? 'secondary' : 'text'}
        size={link ? 'mini' : arcoSizeValue}
        long={block}
        loading={ownLoading ? false : loading}
        disabled={disabled}
        htmlType={type}
        // 包一层，styles.css 里给图标和文字之间留 8px（Arco 只认它自己的图标组件）
        icon={shownIcon ? <span className="mh-arco-btn-icon">{shownIcon}</span> : undefined}
        onClick={ownLoading ? undefined : onClick}
        aria-busy={ownLoading || undefined}
        className={link ? 'mh-arco-link' : ownLoading ? 'mh-arco-loading' : undefined}
        // 接上规范时：高度取规范值；文字离外边框取控件规格的那一档（Arco 按高度选档，36px 的默认按钮
        // 会落在它的大号档，内边距是大号的 19px，所以留白不能跟着 Arco 的档位走）
        style={
          link
            ? height !== undefined
              ? INLINE_LINK
              : undefined
            : height
              ? {
                  height,
                  paddingInline: `calc(var(--mh-c-button-inset${size === 'large' ? '-large' : ''}) - 1px)`,
                }
              : undefined
        }
        {...aria}
      >
        {children}
      </ArcoButton>
    );
  },
  Input: function ArcoKitInput({ type = 'text', value, onChange, size, invalid, suffix, ...rest }) {
    const { size: arcoSizeValue, height } = useArcoHeight(size);
    const aligned = useContext(HeightContext).exact;
    const iconChoice = useIconSet(); // Hook 每次渲染都要调用，不能写在 && 后面
    const swap = aligned && swapsIcons(iconChoice);
    const [visible, setVisible] = useState(false);
    const common = {
      ...rest,
      value,
      size: arcoSizeValue,
      // Arco 只在传了 height 时才改高度（它判断的是有没有这个属性），所以没有时不能传 undefined。
      ...(height ? { height } : {}),
      status: invalid ? ('error' as const) : undefined,
      'aria-invalid': invalid || undefined,
      onChange: (next: string) => onChange(next),
    };
    // 接上规范时密码显隐按钮由套件画（Arco 自带的图标是它自己的，换不掉）
    if (type === 'password' && aligned)
      return (
        <ArcoInput
          {...common}
          type={visible ? 'text' : 'password'}
          suffix={
            <PasswordToggle
              visible={visible}
              onToggle={() => setVisible(!visible)}
              // 规范写 icon.set: native 时用 Arco 自己的眼睛图标
              glyphs={swap ? undefined : { shown: <IconEye />, hidden: <IconEyeInvisible /> }}
            />
          }
        />
      );
    return type === 'password' ? (
      <ArcoInput.Password {...common} />
    ) : (
      <ArcoInput {...common} type={type} suffix={suffix} />
    );
  },
  Checkbox: function ArcoKitCheckbox({ checked, onChange, children, invalid, ...aria }) {
    const aligned = useContext(HeightContext).exact;
    const choice = useIconSet();
    const set = iconSetOf(choice);
    const swap = aligned && swapsIcons(choice);
    return (
      <ArcoCheckbox
        checked={checked}
        onChange={(next) => onChange(next)}
        aria-invalid={invalid || undefined}
        // 对勾用规范图标集里的那一个，线宽加粗一半（和 antd、Element 的 CSS 遮罩一致）
        icon={swap ? <Icon name="check" strokeWidth={set.strokeWidth * 1.5} /> : undefined}
        {...aria}
      >
        {children}
      </ArcoCheckbox>
    );
  },
  Tabs: function ArcoKitTabs({ value, onChange, items, ...aria }) {
    const ref = useRef<HTMLDivElement>(null);
    const aligned = useContext(HeightContext).exact;
    // 键盘：Arco 的每个标签都能被 Tab 键选中，也不支持方向键。按 WAI-ARIA 标签页的做法统一：
    // 只有选中的标签在 Tab 顺序里，← → 切换并移动焦点（和 Element、shadcn 一致）。
    useEffect(() => {
      if (!aligned) return;
      ref.current?.querySelectorAll<HTMLElement>('[role=tab]').forEach((tab) => {
        tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
      });
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (!aligned) return;
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      const index =
        (items.findIndex((item) => item.value === value) + step + items.length) % items.length;
      // 先移动焦点再切换，和 Element、shadcn 的顺序相同
      ref.current?.querySelectorAll<HTMLElement>('[role=tab]')[index]?.focus();
      onChange(items[index]!.value);
    };
    return (
      <div ref={ref} onKeyDown={onKeyDown}>
        <ArcoTabs className="mh-kit-arco-tabs" activeTab={value} onChange={onChange} {...aria}>
          {items.map((item) => (
            <ArcoTabs.TabPane key={item.value} title={item.label} />
          ))}
        </ArcoTabs>
      </div>
    );
  },
  Select: function ArcoKitSelect({ value, onChange, options, size, display, width, ...aria }) {
    const { size: arcoSizeValue, height } = useArcoHeight(size);
    const iconChoice = useIconSet();
    // 下拉离输入框的距离取控件规格
    const gap = useContext(HeightContext).popupGap;
    const aligned = useContext(HeightContext).exact;
    const ref = useRef<SelectHandle>(null);
    return (
      <ArcoSelect
        ref={ref}
        // 对齐：Arco 的下拉一收起（Esc、选中、点外面）就让选择框失去焦点，焦点掉到 <body> 上，键盘用户要从头 Tab；
        // 收起以后焦点没去别处时放回选择框（和 Radix、antd 的下拉一样）
        onVisibleChange={(visible) => {
          if (!aligned || visible) return;
          requestAnimationFrame(() => {
            const active = document.activeElement;
            if (!active || active === document.body) ref.current?.focus();
          });
        }}
        value={value}
        onChange={onChange}
        size={arcoSizeValue}
        // Arco 的选择框没有 height 属性；把高度交给 styles.css 里的 .mh-arco-sized
        className={height ? 'mh-arco-sized' : undefined}
        style={{ width, ...(height ? { '--mh-arco-h': `${height}px` } : {}) } as CSSProperties}
        options={options}
        // 下拉箭头用规范图标集里的那一个；不换时不传这个属性（传 undefined，Arco 就不画箭头了）
        {...(height && swapsIcons(iconChoice)
          ? { arrowIcon: <Icon name="chevron-down" className="mh-select-arrow" /> }
          : {})}
        // 接上规范时：下拉左对齐输入框，距离取控件规格（Arco 默认居中对齐）
        triggerProps={{
          autoAlignPopupWidth: false,
          // 下拉至少和选择框一样宽（Arco 不自动对齐宽度时按内容算，选择框宽的时候下拉比它窄）
          ...(gap !== undefined
            ? { position: 'bl', popupAlign: { bottom: gap }, autoAlignPopupMinWidth: true }
            : {}),
        }}
        renderFormat={display ? (_option, v) => display(String(v)) : undefined}
        {...aria}
      />
    );
  },
  Switch: function ArcoKitSwitch({ checked, onChange, disabled, ...aria }) {
    return (
      <ArcoSwitch
        checked={checked}
        onChange={(next) => onChange(next)}
        disabled={disabled}
        {...aria}
      />
    );
  },
  /**
   * 导航菜单：Arco 的 Menu（竖排）。选中、展开都由页面传进来（selectedKeys、openKeys 受控）；
   * 侧栏收起时交给 Menu 的 collapse：Arco 自己把子菜单换成悬停弹出的弹层（SubMenu 的 pop 模式，
   * 内部是一个 hover 触发的 Dropdown），弹层开没开归 Arco 管，不改 open；没有子菜单的项 Arco 自己包一个
   * 悬停显示名字的 Tooltip。
   */
  NavMenu: function ArcoKitNavMenu({
    items,
    selected,
    onSelect,
    open,
    onOpenChange,
    collapsed,
    ...aria
  }) {
    const iconChoice = useIconSet();
    const controls = useContext(ControlsContext);
    const ref = useRef<HTMLDivElement>(null);
    const aligned = !!controls;
    const swap = aligned && swapsIcons(iconChoice);
    // 键盘和读屏：Arco 的子菜单标题（展开时的 inline-header、收起时的 pop-header）能 Tab 聚焦，
    // 但没有角色；接口要求每个看得见的菜单项都是 menuitem。每次渲染后补上（收起、展开会换成另一种标题）。
    useLayoutEffect(() => {
      if (!aligned) return;
      ref.current
        ?.querySelectorAll('.arco-menu-inline-header, .arco-menu-pop-header')
        .forEach((header) => header.setAttribute('role', 'menuitem'));
    });
    // 空格：Arco 的菜单项、子菜单标题只认回车，接口要求空格也能选中、展开 / 收起（焦点留在原处）
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (!aligned || event.key !== ' ') return;
      const target = event.target as HTMLElement;
      if (target.getAttribute('role') !== 'menuitem') return;
      event.preventDefault();
      target.click();
    };
    // 一级项的图标放进 Arco 的图标位（带 arco-icon 类名，Arco 的图标间距、颜色、收起后的处理都认它）；
    // 文字包一层，收起时对齐模式把它藏起来但留给读屏
    const title = (item: NavItem) => (
      <span className="mh-arco-nav-title">
        {item.icon && <Icon name={item.icon} className="arco-icon" />}
        <span className="mh-arco-nav-label">{item.label}</span>
      </span>
    );
    return (
      <ArcoMenu
        ref={ref}
        mode="vertical"
        collapse={!!collapsed}
        selectedKeys={[selected]}
        openKeys={open}
        onClickMenuItem={(key) => onSelect(key)}
        // 收起后点子菜单标题不改 open（弹层开没开归 Arco 管）
        onClickSubMenu={(_key, openKeys) => !collapsed && onOpenChange(openKeys)}
        // 子菜单里的项：文字和上一级的文字对齐（Arco 默认每级缩进 20px）
        levelIndent={controls ? controls.nav.subInset - controls.nav.itemInset : undefined}
        icons={
          swap
            ? { horizontalArrowDown: <Icon name="chevron-down" className="mh-arco-nav-arrow" /> }
            : undefined
        }
        // 收起后的子菜单弹层：左边离侧栏右边缘 popup.offset（菜单项右边到侧栏右边缘还隔着菜单的留白和 1px 分隔线），
        // 不要 Arco 的小三角
        triggerProps={
          controls
            ? {
                showArrow: false,
                popupAlign: { right: controls.nav.padding + 1 + controls.popup.offset },
              }
            : undefined
        }
        // 收起后没有子菜单的项悬停显示名字：Arco 自己会包一个 Tooltip（放在右边、上下居中、延时 200ms）。
        // 对齐时去掉小箭头，位置和收起后的子菜单弹层一样，左边离侧栏右边缘 popup.offset；样子在 styles.css
        tooltipProps={
          controls
            ? {
                triggerProps: {
                  showArrow: false,
                  popupAlign: { right: controls.nav.padding + 1 + controls.popup.offset },
                },
              }
            : undefined
        }
        onKeyDown={onKeyDown}
        {...aria}
      >
        {items.map((item) =>
          item.children ? (
            <ArcoMenu.SubMenu key={item.key} title={title(item)}>
              {item.children.map((child) => (
                <ArcoMenu.Item key={child.key}>
                  <span className="mh-arco-nav-label">{child.label}</span>
                </ArcoMenu.Item>
              ))}
            </ArcoMenu.SubMenu>
          ) : (
            <ArcoMenu.Item
              key={item.key}
              // Arco 默认把菜单项的内容整个放进提示（图标 + 文字）；对齐时只放名字
              renderItemInTooltip={aligned ? () => item.label : undefined}
            >
              {title(item)}
            </ArcoMenu.Item>
          ),
        )}
      </ArcoMenu>
    );
  },
  /** 面包屑：Arco 的 Breadcrumb；能点的上级在 Breadcrumb.Item 里放一个链接。 */
  Breadcrumb: function ArcoKitBreadcrumb({ items, onNavigate, ...aria }) {
    const controls = useContext(ControlsContext);
    return (
      <nav {...aria}>
        <ArcoBreadcrumb
          // 分隔符：Arco 默认是斜线图标，控件规格是文字
          {...(controls ? { separator: controls.breadcrumb.separator } : {})}
        >
          {items.map((item, i) => (
            <ArcoBreadcrumb.Item key={item.key}>
              {i === items.length - 1 ? (
                <span aria-current={controls ? 'page' : undefined}>{item.label}</span>
              ) : item.link ? (
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(item.key);
                  }}
                >
                  {item.label}
                </a>
              ) : (
                item.label
              )}
            </ArcoBreadcrumb.Item>
          ))}
        </ArcoBreadcrumb>
      </nav>
    );
  },
  /**
   * 下拉菜单：Arco 的 Dropdown（点击打开），菜单是 Arco 的 Menu。
   * Arco 的下拉菜单不管键盘：回车打开以后焦点还在按钮上，没有方向键，Esc 只在按钮上、而且要开 escToClose 才收起。
   * 对齐时套件补上：回车、空格、↓ 打开并把焦点放进第一项，↑ ↓ 移动，Esc 收起并回到按钮
   * （回车选中、选中后焦点回到按钮是 Arco 自己做的，套件拦住这次回车的默认动作，免得菜单又被打开）。
   */
  Dropdown: function ArcoKitDropdown({ items, onSelect, children, ...aria }) {
    const controls = useContext(ControlsContext);
    const [open, setOpen] = useState(false);
    // 菜单按 id 找、不挂 ref：Arco 的弹层会读子元素的 element.ref，React 19 会在控制台报弃用警告
    const menuId = useId();
    const trigger = useRef<HTMLElement | null>(null);
    const byKeyboard = useRef(false);
    const aligned = !!controls;
    const child = children as ReactElement<TriggerElementProps>;
    // 用键盘打开时，等弹层画出来再把焦点放进第一项；之后一小段时间里焦点要是掉到 body，再放回去。
    // 严格模式（npm run dev）下 effect 会「清理再重跑」一次：Arco 的弹层这时被拆下来、过一会儿才重新挂上
    useEffect(() => {
      if (!open) byKeyboard.current = false;
      if (!open || !byKeyboard.current) return;
      let frame = 0;
      let placed = false;
      const focusFirst = (tries: number) => {
        const menu = document.getElementById(menuId);
        const first = menu?.querySelector<HTMLElement>('[role=menuitem]');
        if (first && (!placed || document.activeElement === document.body)) {
          first.focus();
          placed = true;
        }
        if (tries > 0) frame = requestAnimationFrame(() => focusFirst(tries - 1));
        else byKeyboard.current = false;
      };
      focusFirst(60);
      return () => cancelAnimationFrame(frame);
    }, [open]);
    // Esc：弹层开着的时候，焦点在按钮上、菜单里还是别处都收起，焦点回到按钮
    // （Arco 只在按钮上、而且开了 escToClose 才认 Esc，焦点在菜单里时不管）
    useEffect(() => {
      if (!open || !aligned) return;
      const onEscape = (event: globalThis.KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      };
      document.addEventListener('keydown', onEscape);
      return () => document.removeEventListener('keydown', onEscape);
    }, [open, aligned]);
    const onTriggerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
      if (!aligned) return;
      if (event.key === 'Enter' || event.key === ' ') byKeyboard.current = !open;
      else if (event.key === 'ArrowDown' && !open) {
        event.preventDefault();
        byKeyboard.current = true;
        setOpen(true);
      }
    };
    const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (!aligned) return;
      const options = [...event.currentTarget.querySelectorAll<HTMLElement>('[role=menuitem]')];
      const index = options.indexOf(document.activeElement as HTMLElement);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        options[Math.min(options.length - 1, Math.max(0, index + step))]?.focus();
      } else if (event.key === ' ' && index >= 0) {
        event.preventDefault();
        options[index]!.click();
      } else if (event.key === 'Enter') {
        // Arco 在菜单项上已经选中、收起、把焦点交回按钮；不拦住回车的默认动作，它会接着「点」按钮，菜单又打开
        event.preventDefault();
      }
    };
    return (
      <ArcoDropdown
        trigger="click"
        // 对齐：右边和按钮右边对齐（Arco 默认 bl，左对齐）
        position={controls ? 'br' : undefined}
        popupVisible={open}
        onVisibleChange={setOpen}
        // 弹层离按钮 popup.offset（Arco 默认 4px）
        triggerProps={controls ? { popupAlign: { bottom: controls.popup.offset } } : undefined}
        droplist={
          <ArcoMenu
            id={menuId}
            className="mh-arco-dropdown"
            onClickMenuItem={(key) => onSelect(key)}
            onKeyDown={onMenuKeyDown}
            {...aria}
          >
            {/* 分隔线和菜单项平铺，不用 Fragment 包：Arco 的 Menu 会往每个子元素上塞属性，塞到 Fragment 上 React 会在控制台报错 */}
            {items.flatMap((item) => [
              item.divided && (
                <div
                  key={`${item.key}-divider`}
                  role="separator"
                  className="mh-arco-dropdown-divider"
                />
              ),
              <ArcoMenu.Item
                key={item.key}
                className={item.danger ? 'mh-arco-dropdown-danger' : undefined}
              >
                {item.icon && <Icon name={item.icon} className="arco-icon" />}
                {item.label}
              </ArcoMenu.Item>,
            ])}
          </ArcoMenu>
        }
      >
        {cloneElement(child, {
          // 读屏：按钮管着一个菜单、开没开（Arco 只加一个 arco-dropdown-popup-visible 类名）
          ...(aligned ? { 'aria-haspopup': 'menu' as const, 'aria-expanded': open } : {}),
          // 记下按钮（收起时焦点回到它），再接上页面自己写在按钮上的事件
          onClick: (event: MouseEvent<HTMLElement>) => {
            trigger.current = event.currentTarget;
            child.props.onClick?.(event);
          },
          onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
            trigger.current = event.currentTarget;
            child.props.onKeyDown?.(event);
            onTriggerKeyDown(event);
          },
        })}
      </ArcoDropdown>
    );
  },
  /** 头像：Arco 的 Avatar（圆形，显示文字）。 */
  Avatar: function ArcoKitAvatar({ text }) {
    const controls = useContext(ControlsContext);
    // 直径用 Arco 的 size 属性（它顺带把字号写成直径的一半，字号在 styles.css 里改）
    return <ArcoAvatar size={controls?.avatar.size}>{text}</ArcoAvatar>;
  },
  /** 徽标：Arco 的 Badge（数字，超过 99 显示 99+）。 */
  Badge: function ArcoKitBadge({ count, children }) {
    const controls = useContext(ControlsContext);
    const ref = useRef<HTMLSpanElement>(null);
    // 读屏读不到徽标（数字由页面写进按钮的名字里）；Arco 的 Badge 不给数字那一层传属性
    useLayoutEffect(() => {
      if (!controls) return;
      ref.current?.querySelector('.arco-badge-number')?.setAttribute('aria-hidden', 'true');
    });
    return (
      <ArcoBadge
        ref={ref}
        count={count}
        maxCount={99}
        // Arco 把数字的中心放在离右上角往里 2px 的地方（top: 2px; right: 2px），offset 推回角上
        offset={controls ? [2, -2] : undefined}
      >
        {children}
      </ArcoBadge>
    );
  },
  // 部件地图：用户看得见的那个框是 Arco 的哪个元素（自动检查按这里找，不影响组件本身）
  /**
   * 表格：Arco 的 Table。勾选用 rowSelection（受控，preserveSelectedRowKeys 留住别的页的勾选），
   * 分页关掉（pagination={false}），交给套件的 Pagination；没有行时的内容交给 noDataElement。
   * 排序：原生那一档用列的 sorter + sortOrder（受控、不在本地排：sorter: true）；
   * 对齐时列标题渲染成套件自己的按钮（文字 + 排序图标），不用 Arco 的 sorter（见 adaptations）。
   */
  Table: function ArcoKitTable({
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
    const aligned = useContext(HeightContext).exact;
    const controls = useContext(ControlsContext);
    const choice = useIconSet(); // Hook 每次渲染都要调用，不能写在 && 后面
    const set = iconSetOf(choice);
    const swap = aligned && swapsIcons(choice);
    const ref = useRef<HTMLDivElement>(null);
    // 补读屏：Arco 不把 aria-label 交给 <table>；勾选框的名字写在 <input> 上（Arco 的 Checkbox 把属性交给外面的
    // <label>，表头的复选框不收任何属性）。名字是页面给的，三档都补；加载中的 aria-busy 只在对齐档
    useLayoutEffect(() => {
      const root = ref.current;
      const table = root?.querySelector('table');
      if (!root || !table) return;
      table.setAttribute('aria-label', aria['aria-label']);
      root
        .querySelector('thead .arco-checkbox > input')
        ?.setAttribute('aria-label', selectAllLabel);
      root.querySelectorAll('tbody > tr').forEach((tr, i) => {
        const row = rows[i];
        const input = tr.querySelector('.arco-checkbox > input');
        if (row && input) input.setAttribute('aria-label', selectLabel(row));
      });
      if (aligned && loading) table.setAttribute('aria-busy', 'true');
      else table.removeAttribute('aria-busy');
    });
    const checkIcon = swap ? <Icon name="check" strokeWidth={set.strokeWidth * 1.5} /> : undefined;
    const orderOf = (key: string) => (sort?.key === key ? sort.order : null);
    const arcoColumns: ArcoColumnProps<TableRow>[] = columns.map((column) => {
      const order = orderOf(column.key);
      const base = {
        key: column.key,
        dataIndex: column.key,
        width: column.width,
        align: column.align,
        render: (_: unknown, row: TableRow) => renderCell(row, column),
      };
      if (!column.sortable) return { ...base, title: column.title };
      // 对齐：Arco 的排序是整个表头格子能点（不能 Tab、没有 aria-sort），图标是上下两个小三角，
      // 悬停时整格变灰、还有一个「点击升序」的提示。统一成表头里一个按钮（文字 + 排序图标），th 上写 aria-sort
      if (aligned)
        return {
          ...base,
          title: (
            <button
              type="button"
              className="mh-arco-table-sort"
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
              ) : order === 'asc' ? (
                <IconSortAscending />
              ) : order === 'desc' ? (
                <IconSortDescending />
              ) : (
                <IconSort />
              )}
            </button>
          ),
          onHeaderCell: () =>
            (order ? { 'aria-sort': order === 'asc' ? 'ascending' : 'descending' } : {}) as never,
        };
      return {
        ...base,
        title: column.title,
        sorter: true,
        sortOrder: order === 'asc' ? 'ascend' : order === 'desc' ? 'descend' : undefined,
      };
    });
    return (
      // 加载中整个表格不能操作（鼠标、键盘），这是接口约定，三档都是
      <div ref={ref} inert={loading || undefined}>
        <ArcoTable<TableRow>
          rowKey="key"
          data={rows}
          columns={arcoColumns}
          pagination={false}
          // 列宽由页面给：对齐时按给的宽度排（Arco 默认 auto，内容会把列撑宽）
          tableLayoutFixed={aligned}
          // Arco 默认有外框（上、右，第一列左边一道线），统一设计没有
          border={aligned ? false : undefined}
          loading={
            aligned
              ? {
                  loading: !!loading,
                  element: swap ? (
                    <Icon name="loading" spin className="mh-arco-table-spinner" />
                  ) : undefined,
                }
              : loading
          }
          noDataElement={empty}
          // 表头的复选框 Arco 不收属性：换对勾图标只能从 components 的 operations 里拿到这个格子再改
          components={swap ? { header: { operations: headerOperations(checkIcon!) } } : undefined}
          rowSelection={
            selected
              ? {
                  type: 'checkbox',
                  selectedRowKeys: selected,
                  preserveSelectedRowKeys: true,
                  columnWidth: controls?.table.selectionWidth,
                  checkboxProps: () => (checkIcon ? { icon: checkIcon } : {}),
                  onChange: (keys) => onSelectedChange?.(keys as string[]),
                }
              : undefined
          }
          onChange={(_pagination, sorter, _filters, extra) => {
            // 只认排序（点表头）；下一个排序按 nextSort 算，不用 Arco 自己算的方向
            if (extra.action !== 'sort') return;
            const one = Array.isArray(sorter) ? sorter[0] : sorter;
            if (one?.field) onSortChange(nextSort(sort, String(one.field)));
          }}
        />
      </div>
    );
  },
  /**
   * 分页：Arco 的 Pagination，「共 N 条」用 showTotal。Arco 的页码是能 Tab 的 <li>（回车翻页），
   * 没有角色、不认空格，aria-current 写的是 true，名字是英文的「page 2」「Go to next page」；
   * 对齐时补上（role=button、aria-current=page、上一页下一页的 aria-label、去掉页码的 aria-label、空格）。
   */
  Pagination: function ArcoKitPagination({
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
    const aligned = useContext(HeightContext).exact;
    const choice = useIconSet();
    const swap = aligned && swapsIcons(choice);
    const ref = useRef<HTMLElement>(null);
    useLayoutEffect(() => {
      if (!ref.current) return;
      for (const li of ref.current.querySelectorAll<HTMLElement>('.arco-pagination-item')) {
        if (li.classList.contains('arco-pagination-item-jumper')) continue;
        // 名字是页面给的，三档都补（Arco 自己写的是语言包里的「第 2 页」「上一页」）
        if (li.classList.contains('arco-pagination-item-prev'))
          li.setAttribute('aria-label', prevLabel);
        else if (li.classList.contains('arco-pagination-item-next'))
          li.setAttribute('aria-label', nextLabel);
        else li.setAttribute('aria-label', pageLabel(Number(li.textContent)));
        // 角色、禁用、当前页只在对齐档补
        if (!aligned) continue;
        li.setAttribute('role', 'button');
        // 到头了：Arco 写 tabindex=-1（点得到、脚本能聚焦），改成和禁用的按钮一样聚焦不到
        if (li.classList.contains('arco-pagination-item-disabled')) {
          li.setAttribute('aria-disabled', 'true');
          li.removeAttribute('tabindex');
        } else li.removeAttribute('aria-disabled');
        if (li.classList.contains('arco-pagination-item-active'))
          li.setAttribute('aria-current', 'page');
        else li.removeAttribute('aria-current');
      }
    });
    return (
      <nav
        {...aria}
        ref={ref}
        // 空格也翻页（Arco 只认回车）
        onKeyDown={(event) => {
          const target = event.target as HTMLElement;
          if (aligned && event.key === ' ' && target.getAttribute('role') === 'button') {
            event.preventDefault();
            target.click();
          }
        }}
      >
        <ArcoPagination
          current={page}
          pageSize={pageSize}
          total={total}
          showTotal={(count) => totalText(count)}
          onChange={(next) => onChange(next)}
          icons={
            swap
              ? { prev: <Icon name="chevron-left" />, next: <Icon name="chevron-right" /> }
              : undefined
          }
        />
      </nav>
    );
  },
  /** 状态标签：Arco 的 Tag，色调交给预设颜色（green、orange、red）；对齐时的尺寸、颜色在 styles.css。 */
  Tag: function ArcoKitTag({ tone = 'default', children }) {
    const color = { default: undefined, success: 'green', warning: 'orange', danger: 'red' }[tone];
    return (
      <ArcoTag color={color} className={`mh-arco-tag-${tone}`}>
        {children}
      </ArcoTag>
    );
  },
  // 第二批（筛选栏的日期范围、编辑对话框）还没做
  /**
   * 日期范围：Arco 的 RangePicker（两个框、并排两个月）。值是「YYYY-MM-DD」，Arco 直接收发字符串。
   * 两个框能打字（键盘选日期的路径，Arco 默认就能打）；两个框的名字用 inputProps 落到 <input> 上（三档都是）。
   * 已经选过一段时再选，从头选两天（clearRangeOnReselect：Arco 默认只改正在聚焦的那一头、点一下就通知页面），
   * 选完两天才通知页面；只有一头的半截值不通知，清空（原生档的清空按钮）通知 null。面板的尺寸在 styles.css。
   * 对齐：打字的回车、Tab、Esc 按接口的规则（见 DateRangeProps），框补 combobox。
   */
  DateRange: function ArcoKitDateRange({
    value,
    onChange,
    placeholder,
    separator,
    labels,
    ...aria
  }) {
    const aligned = useContext(HeightContext).exact;
    const { height } = useArcoHeight();
    const controls = useContext(ControlsContext);
    const choice = useIconSet();
    const swap = aligned && swapsIcons(choice);
    const ref = useRef<HTMLDivElement>(null);
    // 对齐：Arco 只认点击和打字打开面板，回车不开，Esc 也不收；统一成点击、没打过字的回车打开 / 收起，Esc 收起。
    // 打字不打开面板：Arco 一打开面板就把框里的字换回页面给的值（一次粘贴进来的整段日期会被吞掉）
    const [open, setOpen] = useState(false);
    const pointer = useRef(false);
    // 没提交的字回到页面给的值：Arco 把打的字存在自己的状态里（valueShow、inputValue），换一个 key 重新挂上
    const [epoch, setEpoch] = useState(0);
    // Arco 每次收起面板都让框失去焦点（blurInput），焦点掉到 <body> 上；对齐时放回刚才那个框
    const last = useRef(0);
    const inputs = () => [...(ref.current?.querySelectorAll('input') ?? [])];
    const refocus = () => {
      const active = document.activeElement;
      if (!active || active === document.body) inputs()[last.current]?.focus();
    };
    const wasOpen = useRef(false);
    useEffect(() => {
      if (aligned && wasOpen.current && !open) refocus();
      wasOpen.current = open;
    }, [open, aligned]);
    /** 框里的字和页面给的值不一样：用户打过字（或者在面板上点了第一天还没点第二天）。 */
    const typed = () => inputs().some((input, i) => input.value !== (value?.[i] ?? ''));
    const revert = (keepFocus: boolean) => {
      setOpen(false);
      setEpoch((n) => n + 1);
      if (keepFocus) requestAnimationFrame(refocus);
    };
    const box = (i: 0 | 1) => ({
      'aria-label': labels[i],
      autoComplete: 'off',
      ...(aligned
        ? { role: 'combobox', 'aria-haspopup': 'dialog' as const, 'aria-expanded': open }
        : {}),
    });
    return (
      <div
        ref={ref}
        {...aria}
        role="group"
        onFocusCapture={(event) => {
          const i = inputs().indexOf(event.target as HTMLInputElement);
          if (i >= 0) last.current = i;
        }}
        onMouseDownCapture={() => {
          pointer.current = true;
        }}
        // 焦点离开整个日期范围（面板也算在里面）：收起面板，没提交的字回到页面给的值
        onBlur={(event) => {
          if (!aligned) return;
          const next = event.relatedTarget as Element | null;
          if (next && (ref.current?.contains(next) || next.closest('.mh-arco-date-popup'))) return;
          if (typed()) revert(false);
          else setOpen(false);
        }}
        onKeyDownCapture={(event) => {
          pointer.current = false;
          if (!aligned) return;
          if (event.key === 'Enter') {
            event.stopPropagation();
            if (!typed()) {
              // 没打过字：打开 / 收起面板，不提交表单
              event.preventDefault();
              setOpen(!open);
              return;
            }
            // 打过字：两个都是合法日期就通知页面（开始比结束晚就对调），不合法就回到页面给的值；
            // 不拦默认行为，回车照常提交所在的表单（Arco 自己的回车：只有一头时把焦点挪到另一个框，不提交）
            const [a, b] = inputs().map((input) => input.value) as [string, string];
            if (isDate(a) && isDate(b)) {
              onChange(a <= b ? [a, b] : [b, a]);
              setOpen(false);
            } else {
              // 等这次回车提交完表单再换掉框（框不在了，回车就不会提交）
              setTimeout(() => revert(true));
            }
          } else if (event.key === 'Escape' && (open || typed())) {
            event.preventDefault();
            event.stopPropagation();
            if (typed()) revert(true);
            else setOpen(false);
          }
        }}
      >
        <ArcoDatePicker.RangePicker
          key={epoch}
          {...(aligned
            ? {
                popupVisible: open,
                onVisibleChange: (next) => {
                  // 只认鼠标打开（Arco 打字时也要打开面板）；收起照收
                  if (next && !pointer.current) return;
                  pointer.current = false;
                  setOpen(!!next);
                },
              }
            : {})}
          value={value ?? undefined}
          onChange={(dates) => {
            // 清空通知页面；只有一头的半截值不算（接口：两头都有才通知）
            if (!dates) return onChange(null);
            if (dates[0] && dates[1]) onChange([dates[0], dates[1]]);
          }}
          format="YYYY-MM-DD"
          clearRangeOnReselect
          placeholder={placeholder}
          separator={separator}
          inputProps={[box(0), box(1)]}
          // 统一设计没有「清空」：筛选栏的「重置」负责
          allowClear={!aligned}
          dayStartOfWeek={1}
          icons={
            swap
              ? {
                  prev: <Icon name="chevron-left" />,
                  next: <Icon name="chevron-right" />,
                  inputSuffix: <Icon name="calendar" />,
                }
              : undefined
          }
          // 对齐：在面板上按下鼠标不让框失去焦点（Arco 的面板不拦，框先失焦、点完再聚焦回来），
          // 不然上面「焦点离开整个日期范围就收起」会在点日子之前把面板关掉
          panelRender={
            aligned
              ? (panel) => <div onMouseDown={(event) => event.preventDefault()}>{panel}</div>
              : undefined
          }
          // 面板离触发框 popup.offset、左对齐（Arco 默认就是左下、隔 4）
          triggerProps={
            controls
              ? { popupAlign: { bottom: controls.popup.offset }, className: 'mh-arco-date-popup' }
              : undefined
          }
          // 触发框填满外层，高度取规范（Arco 按档位写死 32）
          style={aligned ? { width: '100%', height } : undefined}
        />
      </div>
    );
  },
  /**
   * 对话框：Arco 的 Modal。按 Esc、点右上角的叉都走 onCancel；点遮罩不关（maskClosable={false}，接口约定，三档都是）。
   * Arco 的 Modal 不认 ConfigProvider 的挂载点，getPopupContainer 要单独给；挂载点是 Provider 渲染完才有的，
   * 一开始就开着的对话框要等它出来再开（不然 Arco 已经挂到 body 上，不会再挪）。
   * 对齐：Arco 的关闭按钮是 tabindex=-1 的 <span>（键盘到不了）、在 DOM 最后，换成套件自己的按钮，放在内容最前面
   * （Tab 顺序最前）；打开后焦点进第一个输入框（Arco 的焦点锁默认落在第一个能聚焦的元素上）；
   * 关上以后焦点回到打开它的按钮（Arco 的焦点锁不还焦点）。焦点锁定、Esc 关，Arco 自己做了。
   */
  Dialog: function ArcoKitDialog({ open, onClose, title, children, footer, closeLabel }) {
    const portal = usePortal();
    const aligned = useContext(HeightContext).exact;
    const controls = useContext(ControlsContext);
    const choice = useIconSet();
    const swap = aligned && swapsIcons(choice);
    const opener = useRef<HTMLElement | null>(null);
    const visible = open && !!portal;
    useLayoutEffect(() => {
      if (!aligned) return;
      if (visible) {
        opener.current = document.activeElement as HTMLElement | null;
        return;
      }
      if (opener.current?.isConnected) opener.current.focus();
      opener.current = null;
    }, [visible, aligned]);
    const bodyEl = useRef<HTMLDivElement | null>(null);
    // 原生档：关闭按钮的名字是页面给的（Arco 写死英文的 Close），三档都补
    const nameClose = () => {
      bodyEl.current
        ?.closest('.arco-modal')
        ?.querySelector('.arco-modal-close-icon')
        ?.setAttribute('aria-label', closeLabel);
    };
    useLayoutEffect(nameClose);
    // 打开时把焦点放进第一个输入框（Arco 的焦点锁先把焦点放在第一个能聚焦的元素上；只在打开那一刻做一次）
    const focusOnOpen = useFocusOnOpen(visible, aligned, 'input, textarea, select, [role=combobox]');
    const body = useCallback(
      (el: HTMLDivElement | null) => {
        bodyEl.current = el;
        focusOnOpen(el);
      },
      [focusOnOpen],
    );
    return (
      <ArcoModal
        visible={visible}
        title={title}
        onCancel={onClose}
        footer={footer}
        maskClosable={false}
        closable={!aligned}
        style={controls ? { width: controls.dialog.width } : undefined}
        getPopupContainer={() => portal ?? document.body}
      >
        {aligned && (
          <button
            type="button"
            className="mh-arco-dialog-close"
            aria-label={closeLabel}
            onClick={onClose}
          >
            {swap ? <Icon name="x" /> : <IconClose />}
          </button>
        )}
        <div
          ref={body}
          // Esc 一层一层关：里面的下拉开着时 Esc 先收下拉（Arco 的选择框自己处理）；下拉收着时 Arco 的选择框
          // 照样把 Esc 拦下（stopPropagation），对话框收不到，对齐时在这里先接住、关对话框
          onKeyDownCapture={(event) => {
            if (!aligned || event.key !== 'Escape') return;
            if (event.currentTarget.querySelector('[aria-expanded=true]')) return;
            event.stopPropagation();
            onClose();
          }}
        >
          {children}
        </div>
      </ArcoModal>
    );
  },
  /**
   * 单选：Arco 的 Radio.Group（原生的 radio）。Arco 不把 aria-label 交给 role=radiogroup 的那一层，渲染后补上（三档都是）。
   * 对齐：Arco 不给这一组的 radio 起同一个 name，每一项都是一个 Tab 停靠点、方向键不换选中；给一个 name，
   * 就是原生单选组的键盘（Tab 进到选中的那一项，方向键换）。
   */
  Radio: function ArcoKitRadio({ value, onChange, options, ...aria }) {
    const aligned = useContext(HeightContext).exact;
    const name = useId();
    const ref = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
      ref.current
        ?.querySelector('[role=radiogroup]')
        ?.setAttribute('aria-label', aria['aria-label']);
    });
    return (
      <div ref={ref}>
        <ArcoRadio.Group
          value={value}
          onChange={(next) => onChange(next)}
          options={options}
          name={aligned ? name : undefined}
        />
      </div>
    );
  },
  /** 多行输入：Arco 的 Input.TextArea。上下留白、能往下拖在 styles.css。 */
  Textarea: function ArcoKitTextarea({ value, onChange, invalid, rows, ...rest }) {
    const controls = useContext(ControlsContext);
    return (
      <ArcoInput.TextArea
        {...rest}
        rows={rows ?? controls?.textarea.rows ?? 3}
        value={value}
        status={invalid ? 'error' : undefined}
        aria-invalid={invalid || undefined}
        onChange={(next) => onChange(next)}
      />
    );
  },
  parts: {
    field: '.arco-input-inner-wrapper, .arco-input:not(.arco-input-inner-wrapper .arco-input)',
    select: '.arco-select-view',
    checkbox: '.arco-checkbox-mask',
    button: '.arco-btn:not(.mh-arco-link)',
    tabIndicator: '.arco-tabs-header-ink',
    popup: '.arco-select-popup',
    option: '.arco-select-option',
    switch: '.arco-switch',
    switchThumb: '.arco-switch-dot',
    // 侧栏里的菜单项、子菜单标题（展开时是 inline-header，收起时是 pop-header），以及收起后弹层里的项
    menuItem:
      '.arco-menu-item, .arco-menu-inline-header, .arco-menu-pop-header, .arco-menu-pop-trigger .arco-dropdown-menu-item',
    menuPopup: '.arco-menu-pop-trigger .arco-dropdown-menu',
    breadcrumbLink: '.arco-breadcrumb-item a',
    dropdown: '.arco-dropdown-menu.mh-arco-dropdown',
    dropdownItem: '.mh-arco-dropdown .arco-dropdown-menu-item',
    avatar: '.arco-avatar',
    badge: '.arco-badge-number',
    // 文字提示：有底色的那个框（小箭头是它旁边的 .arco-trigger-arrow，不算）
    tooltip: '.arco-tooltip-content',
    tableHead: '.arco-table-th',
    tableCell: '.arco-table-td',
    // 对齐时是套件自己的按钮（mh-arco-table-sort），原生那一档是 Arco 整格能点的那一层
    tableSort: ':is(.mh-arco-table-sort, .arco-table-cell-with-sorter)',
    tag: '.arco-tag',
    pageItem: ':is(.arco-pagination-item:not(.arco-pagination-item-jumper))',
    // 触发框（面板里还有一层 .arco-picker-range，不算）
    dateRange: '.arco-picker.arco-picker-range',
    datePopup: '.arco-picker-range-container',
    dateCell: '.arco-picker-date',
    dialog: '.arco-modal',
    radio: '.arco-radio-mask',
    textarea: 'textarea.arco-textarea',
  },
  profile: {
    framework: 'react',
    site: 'https://arco.design',
    tags: [
      { zh: 'Less 样式表', en: 'Compiled Less' },
      { zh: '尺寸编译时写死', en: 'Sizes fixed at build time' },
    ],
    styling: {
      zh: 'Less 编译出的固定样式表。颜色和圆角是 CSS 变量（颜色写成 RGB 三元组：rgb(var(--primary-6))）；尺寸、字号大多直接写死在编译结果里。',
      en: 'A precompiled Less stylesheet. Colors and radii are CSS variables (colors as RGB triplets: rgb(var(--primary-6))); sizes and font sizes are mostly fixed in the compiled CSS.',
    },
    theming: {
      zh: '运行时能改颜色和圆角变量；尺寸要在构建时改 Less 变量重新编译。ConfigProvider 管全局尺寸档位和弹层挂载点；它的 theme 也能在运行时换主题色，但写在 body 上（整个页面一起变），只算悬停、按下两档，浅色几档不算。',
      en: 'At runtime the color and radius variables can change; sizes need a Less rebuild. ConfigProvider sets the global size step and popup container; its theme can swap the primary at runtime, but it writes to body (the whole page changes) and derives only hover and active, not the light steps.',
    },
    sizing: {
      zh: 'mini / small / default / large 四档，24 / 28 / 32 / 36px，每档的高度、内边距、字号都写死；输入框另有 height 属性可以设任意高度。',
      en: 'mini / small / default / large at 24 / 28 / 32 / 36px, each with fixed height, padding and font size; inputs also accept a height prop.',
    },
    look: {
      zh: '主色 #165DFF，输入框和选择框是灰底、没有描边，复选框 14px、2px 灰边，次要按钮是灰底。',
      en: 'Primary #165DFF, gray-filled borderless inputs and selects, 14px checkbox with a 2px gray border, gray secondary buttons.',
    },
    icons: {
      zh: '图标随组件库一起发布，在 @arco-design/web-react/icon 里（IconDown、IconEye……）。选择框的 arrowIcon、复选框的 icon 可以换；密码框的眼睛和按钮的加载图标写死在组件里，换不掉。',
      en: 'Icons ship with the library in @arco-design/web-react/icon (IconDown, IconEye…). arrowIcon on Select and icon on Checkbox can be replaced; the password eye and the button loading icon are built in and cannot be replaced.',
    },
    accessibility: {
      zh: '角色大多现成：开关是 <button role=switch>，标签栏有 tablist / tab / aria-selected，选择框是 combobox + listbox，菜单是 menu / menuitem，都能 Tab 聚焦，开关键盘聚焦时有 2px 外圈。缺口在细处：侧栏的子菜单标题能聚焦但没有角色；下拉菜单的按钮没有 aria-haspopup / aria-expanded；面包屑的当前页没有 aria-current；徽标的数字读屏读得到。表格的排序是整格能点的 div（不能 Tab、没有 aria-sort），勾选框的名字落在 <label> 上读不到，表头复选框不收任何属性；分页的页码是能 Tab 的 <li>（只认回车、没有角色、aria-current 写 true）。日期范围只认点击和打字打开（一打字打开面板，一次插入的整段日期会被吞掉），回车、Esc 都没用，面板一收起焦点就掉到 <body>，框没有角色；加载中的表格白色遮罩只挡鼠标，键盘还能进去；对话框的关闭按钮是 tabindex=-1 的 <span>（名字是英文 Close），焦点锁不还焦点，里面的下拉收着时 Esc 被选择框拦下；选择框一收起焦点也掉到 <body>；单选组的 radio 没有同一个 name（每一项都是一个 Tab 停靠点），radiogroup 不收 aria-label。套件在对齐那一档补上：标题补 menuitem、按钮补 aria、当前页补 aria-current、数字加 aria-hidden；表格补排序按钮和 aria-sort、勾选框的名字，分页补 role、aria-current=page、空格；日期范围补回车打开 / 提交打的字、Esc 收起并回到原值、焦点回到框上、combobox；对话框换成能 Tab 的关闭按钮、关上后焦点回到打开它的按钮、Esc 一层一层关；选择框收起后焦点放回；单选给同一个 name。',
      en: 'Roles are mostly built in: the switch is a <button role=switch>, tabs have tablist / tab / aria-selected, Select is a combobox with a listbox, menus are menu / menuitem, all reachable with Tab, and the switch shows a 2px ring on keyboard focus. The gaps are details: sidebar submenu titles are focusable but have no role; the dropdown trigger has no aria-haspopup / aria-expanded; the current breadcrumb has no aria-current; screen readers read the badge count. Table sorting is a clickable div (no Tab stop, no aria-sort), checkbox names land on the <label> where screen readers miss them, and the header checkbox takes no props; page items are tabbable <li> elements (Enter only, no role, aria-current="true"). The date range opens on click or typing only (typing opens the panel, which swallows a date inserted in one go; Enter and Esc do nothing), drops focus to <body> when the panel closes and gives the boxes no role; the loading veil on the table blocks only the mouse; the dialog close button is a tabindex=-1 <span> named “Close”, the focus lock does not return focus, and Esc is swallowed by a closed select inside; Select also drops focus to <body> when it closes; radios in a group share no name (each is a Tab stop) and the radiogroup takes no aria-label. The kit fills these in when aligned: menuitem on titles, aria on the trigger, aria-current on the current page, aria-hidden on the count; a sort button with aria-sort and checkbox names in the table, role / aria-current="page" / Space in pagination; Enter to open or commit typed text, Esc to close and revert, focus return and combobox on the date range; a tabbable close button, focus return and layered Esc in the dialog; focus return on Select; a shared radio name.',
    },
    setup: [
      {
        zh: '引入 @arco-design/web-react/dist/css/arco.css。',
        en: 'Import @arco-design/web-react/dist/css/arco.css.',
      },
      {
        zh: 'React 19 下要先引入它的适配模块（_util/react-19-adapter）。',
        en: 'On React 19, import its adapter (_util/react-19-adapter) first.',
      },
      {
        zh: '样式表带有 html、body 的全局重置，最好放进单独的 CSS 层。',
        en: 'The stylesheet resets html and body; put it in its own cascade layer.',
      },
    ],
  },
  adaptations: [
    // —— 表格、分页、标签（客户列表）——
    adapt(
      'table',
      'size',
      [
        '表头 41 高（th 里一层上下 9、左右 16 的 th-item + 1px 线）、行 41 高（格子上下 9 + 22 行高 + 1px 线，放开关的行 43），勾选列 40 宽；有外框（上、右，第一列左边一道线）',
        'Header 41px (an inner th-item padded 9/16 + 1px rule), rows 41px (9px padding + 22px line + 1px rule; 43px with a switch), 40px selection column; an outer frame (top, right and a left rule on the first column)',
      ],
      [
        '表头 40、行 44、勾选列 48（rowSelection.columnWidth），复选框在格子正中；没有外框（border={false}）',
        'Header 40, rows 44, 48px selection column (rowSelection.columnWidth), checkbox centred; no frame (border={false})',
      ],
      'style-override',
    ),
    adapt(
      'table',
      'color',
      [
        '表头 neutral-2 灰底（rgb(242, 243, 245)）、14px 500 的最深文字色（rgb(29, 33, 41)），左上右上 4 圆角；格子白底；排了序的列表头变深（neutral-3）；勾选的行不变色',
        'Header neutral-2 (rgb(242, 243, 245)) with 14px/500 strongest text (rgb(29, 33, 41)), 4px top corners; white cells; the sorted header darkens (neutral-3); selected rows keep their fill',
      ],
      [
        '表头浅底、12px 500 的次要灰字，没有圆角；格子透明；排序不改底色；勾选的行换底色，悬停不变',
        'Light header with 12px/500 secondary text, no radius; transparent cells; sorting keeps the fill; selected rows get the selected fill and keep it on hover',
      ],
      'style-override',
    ),
    adapt(
      'table',
      'keyboard',
      [
        '排序：整个表头格子能点（cell-with-sorter），但不能 Tab、没有角色和 aria-sort；图标是上下两个 12px 小三角，悬停整格变灰、还弹「点击升序」的提示',
        'Sorting: the whole header cell is clickable (cell-with-sorter) but not tabbable, with no role or aria-sort; two 12px carets, a grey hover fill and a “click to sort ascending” tooltip',
      ],
      [
        '表头里一个按钮：文字 + 图标集的排序图标（隔 4），th 上写 aria-sort；对齐时不用 Arco 的 sorter',
        'A button in the header: label + sort icon from the icon set (4px gap), aria-sort on the th; Arco’s sorter is not used when aligned',
      ],
      'behavior',
    ),
    adapt(
      'table',
      'state',
      [
        '加载中：盖一层 60% 的白（rgba(255, 255, 255, 0.6)），表格本身不变浅，Arco 的 20px 加载图标；白色遮罩只挡鼠标，键盘还能 Tab 进表格；<table> 和勾选框都没有名字，加载中也不写 aria-busy',
        'Loading: a 60% white veil (rgba(255, 255, 255, 0.6)) with the table at full opacity and Arco’s 20px spinner; the veil only blocks the mouse, Tab still reaches the table; no names on <table> or the checkboxes, and no aria-busy',
      ],
      [
        '只变浅、不盖白，图标集的加载图标（20px、主色）在表格正中；加载中整个表格 inert（三档）；<table> 的 aria-label 和勾选框的名字（写在 <input> 上）三档都补，aria-busy 只在对齐档',
        'Fade only, no veil; the icon-set spinner (20px, primary) dead centre; the whole table is inert while loading (every mode); aria-label on <table> and checkbox names on the inputs in every mode, aria-busy when aligned',
      ],
      'style-override',
    ),
    adapt(
      'table',
      'shape',
      [
        '部分选中：主色底里一道 6×2 的白横；没有行时格子上下 9、里面再包一层上下 20 留白、40 行高的 div；最后一行下面也有线',
        'Indeterminate: a 6×2 white bar on the primary fill; the empty cell has 9px padding around a div padded 20px with a 40px line; the last row keeps its rule',
      ],
      [
        '部分选中：图标集的 minus（和对勾一样大）；没有行时格子不留白、不画线；最后一行下面不画线',
        'Indeterminate: the icon-set minus (same size as the check); empty cell has no padding or rule; no rule under the last row',
      ],
      'style-override',
    ),
    adapt(
      'checkbox',
      'state',
      [
        '键盘聚焦、悬停：复选框后面一个 24px 的灰色圆（fill-2）；禁用是灰边灰底（fill-3 / fill-2）',
        'Keyboard focus and hover: a 24px grey circle (fill-2) behind the box; disabled is a grey border on grey (fill-3 / fill-2)',
      ],
      [
        '不画圆，聚焦时控件规格的外圈（3px 浅主色）；禁用的底色取控件规格、边线不变',
        'No circle; the spec focus ring (3px light primary) on focus; disabled fill from the spec with the usual border',
      ],
      'style-override',
    ),
    adapt(
      'pagination',
      'color',
      [
        '当前页浅主色底（rgb(232, 243, 255)）加主色字、没有描边、400 字重；悬停时上一页、下一页变主色；「共 N 条」离页码 8、最深的文字色；上一页、下一页是 Arco 的 12px 箭头',
        'Current page on light primary (rgb(232, 243, 255)) with primary text, no border, 400 weight; prev / next turn primary on hover; the total sits 8px away in the strongest text colour; 12px Arco arrows',
      ],
      [
        '当前页主色描边、白底、主色字、500；悬停只换底色；「共 N 条」离页码 16、次要灰；上一页、下一页用图标集的 16px 箭头（icons 属性）',
        'Current page with a primary border on white, primary text, 500; hover only changes the fill; total 16px away in secondary grey; 16px icon-set arrows (icons prop)',
      ],
      'style-override',
    ),
    adapt(
      'pagination',
      'keyboard',
      [
        '页码是能 Tab 的 <li>，只认回车，没有角色，aria-current 写的是 true，名字是「第 2 页」；到头了的上一页、下一页是 tabindex=-1（还能被点到、被脚本聚焦）',
        'Page items are tabbable <li> elements, Enter only, no role, aria-current="true", named “第 2 页”; the disabled end arrow keeps tabindex=-1',
      ],
      [
        '名字用页面给的 pageLabel、prevLabel、nextLabel（三档都补）；对齐时补 role=button、aria-current="page"，空格也能翻页，到头了 aria-disabled、聚焦不到（和禁用的按钮一样）',
        'Names come from pageLabel / prevLabel / nextLabel (every mode); when aligned, role=button and aria-current="page", Space also pages, and the end arrow is aria-disabled and unfocusable like a disabled button',
      ],
      'behavior',
    ),
    adapt(
      'tag',
      'size',
      [
        '24 高、左右 8、1px 透明描边、2 圆角、12px 500；成功、提醒、危险用 Arco 自己的色板（成功是 rgb(232, 255, 234) 底、rgb(0, 180, 42) 字）',
        '24px tall, 8px padding, a 1px transparent border, 2px radius, 12px/500; success / warning / danger use Arco’s palette (success is rgb(232, 255, 234) on rgb(0, 180, 42))',
      ],
      [
        '20 高、左右 6、没有描边；浅底和字色取控件规格',
        '20px, 6px padding, no border; fills and text colours from the spec',
      ],
      'style-override',
    ),
    // —— 日期范围、对话框、单选、多行输入（客户列表的筛选栏和编辑对话框）——
    adapt(
      'dateRange',
      'size',
      [
        '触发框灰底（fill-2）、没有描边，左 4 右 11 的内边距、框里的字再往里 8；聚焦时正在填的那个框是浅主色底；有值时鼠标停上去，日历图标换成「清空」（×）；日历图标 14px',
        'Gray (fill-2) trigger without a border, padded 4 / 11 with another 8px inside each box; the active box turns light primary on focus; with a value, hovering swaps the 14px calendar icon for a clear button',
      ],
      [
        '和输入框同一组：白底描边、文字离外边框 inset，聚焦或面板开着时外圈；没有清空（allowClear={false}）；图标集的 calendar（16px），填满外层',
        'Same as the input: white with a border, text inset from the edge, a ring while focused or open; no clear button (allowClear={false}); the icon-set calendar (16px), full width',
      ],
      'style-override',
    ),
    adapt(
      'dateRange',
      'shape',
      [
        '面板每个月 265 宽，标题行 41 高（上下 8、下面一道线），按年、按月翻的箭头各一对（12px），「2026年」「6月」两段能点（切到选年、选月）；星期 14px 500；一天是 36 高的格子里一个 24 的圆，范围的浅主色带画在格子上，今天是下面一个 4px 的主色圆点',
        'Each month is 265px wide with a 41px header (8px padding and a rule), year and month arrows (12px), and clickable “2026年” / “6月” labels; weekdays at 14px/500; each day is a 24px circle in a 36px row with the range band on the row and a 4px dot for today',
      ],
      [
        '外框取 popup 一组、留白 12、两个月隔 24；标题行 32、只按月翻（图标集的箭头，按年翻的藏掉）、标题不能点；星期 12px 次要灰；32 的方块紧挨着，范围的浅底画在方块上，开始、结束主色底，今天 1px 主色描边',
        'Popup frame from the spec, 12px padding, 24px between months; a 32px header with month arrows only (icon set; year arrows hidden) and a static title; 12px secondary weekdays; 32px squares side by side with the range fill on the squares, primary start / end and a 1px primary border for today',
      ],
      'style-override',
    ),
    adapt(
      'dateRange',
      'state',
      [
        '框能打字，一打字就打开面板，而打开面板会把框里的字换回原来的值：一次插入一整段日期（粘贴、输入法上屏）会被吞掉；Tab 离开时没打完的字丢掉；已经选过一段时再点，只改正在聚焦的那一头，点一下就通知页面；选第二天时有一条浅主色的悬停预览',
        'The boxes are editable, but typing opens the panel and opening resets the boxes, so a whole date inserted at once (paste, IME) is lost; unfinished text is dropped on Tab; with a range picked, a click moves only the focused end and notifies at once; a light-primary hover preview while picking the second day',
      ],
      [
        '打字不打开面板；回车提交打的字（两个都合法才通知、开始晚于结束就对调；不合法回到原值，照常提交表单）；Esc、焦点离开整个日期范围时没提交的字回到原值（换 key 重新挂上 Arco 的组件）；再选时从头选两天（clearRangeOnReselect，三档都是），半截不通知、清空通知 null；不画悬停预览。Tab 离开一个框时没打完的字仍会丢（Arco 自己清的，拦不住）',
        'Typing no longer opens the panel; Enter commits typed text (both valid → notify, swapped if reversed; otherwise revert and still submit the form); Esc or leaving the range reverts unsubmitted text (by remounting Arco’s component); picking again starts over (clearRangeOnReselect, every mode), half values are not sent and clearing sends null; no hover preview. Unfinished text is still dropped when tabbing between boxes (Arco clears it)',
      ],
      'prop',
    ),
    adapt(
      'dateRange',
      'keyboard',
      [
        '只认点击和打字打开，回车不开；Esc 不收；面板一收起（选完、点外面）就让框失去焦点，焦点掉到 <body> 上；框没有角色',
        'Opens on click or typing only (not Enter); Esc does nothing; closing the panel blurs the box, dropping focus to <body>; the boxes have no role',
      ],
      [
        '没打过字的回车打开 / 收起面板（不提交表单），Esc 收起；收起以后焦点回到刚才那个框；两个框补 role=combobox、aria-haspopup="dialog"、aria-expanded',
        'Enter without typing toggles the panel (no form submit), Esc closes it; focus returns to the box; both boxes get role=combobox, aria-haspopup="dialog" and aria-expanded',
      ],
      'behavior',
    ),
    adapt(
      'dialog',
      'size',
      [
        '标题栏 48 高（左右 20、下面一道线）、16px 500 的标题居中；内容上下 24 左右 20；底部按钮上下 16、上面一道线；4 圆角、没有投影；遮罩 rgba(29, 33, 41, 0.6)',
        'A 48px title bar (20px sides, a rule below) with a centred 16px/500 title; content padded 24 / 20; footer padded 16 / 20 with a rule above; 4px radius, no shadow; mask rgba(29, 33, 41, 0.6)',
      ],
      [
        '四周留白 24、面板圆角、投影；标题 16/24/600 靠左；标题到内容 20、内容到按钮 24，没有分隔线；遮罩取控件规格',
        '24px padding, panel radius and shadow; a left-aligned 16/24/600 title; 20px to the content and 24px to the buttons, no rules; mask from the spec',
      ],
      'style-override',
    ),
    adapt(
      'dialog',
      'a11y',
      [
        '关闭按钮是 tabindex=-1 的 <span>（名字是英文的 Close），在 DOM 最后，键盘到不了；焦点锁不还焦点，关上以后焦点掉到 <body> 上；里面的下拉收着时按 Esc，被选择框拦下，对话框关不上',
        'The close button is a tabindex=-1 <span> named “Close”, last in the DOM and unreachable by keyboard; the focus lock does not return focus, so it drops to <body> on close; with a dropdown inside closed, Esc is swallowed by the select and the dialog stays open',
      ],
      [
        '关闭按钮的名字三档都用 closeLabel（原生档改 Arco 那个 <span> 的 aria-label）；对齐时换成套件自己的按钮（图标集的 x），放在 Tab 顺序最前、右上角 32 的方块，关上以后焦点回到打开它的按钮，Esc 一层一层关',
        'The close button is named by closeLabel in every mode (natively by relabelling Arco’s <span>); when aligned, a kit button (icon-set x) first in Tab order as a 32px square at the top right, focus returning to the opener on close and Esc closing layer by layer',
      ],
      'behavior',
    ),
    adapt(
      'dialog',
      'state',
      [
        '点遮罩就关；不认 ConfigProvider 的挂载点（默认挂到 body）；打开时给挂载点加 overflow: hidden',
        'Clicking the mask closes it; it ignores the ConfigProvider container (defaults to body) and sets overflow: hidden on its container while open',
      ],
      [
        '点遮罩不关（maskClosable={false}，三档都是）；getPopupContainer 指到作用域的挂载点，挂载点出来以后才打开',
        'The mask does not close it (maskClosable={false}, every mode); getPopupContainer points at the scoped mount, and it opens once the mount exists',
      ],
      'prop',
    ),
    adapt(
      'radio',
      'size',
      [
        '14px 的圆、2px 灰边，选中是主色底里一个 4px 的白点；圆的左边 5px 内边距，两项隔 20；悬停、聚焦时后面一个 24px 的灰色圆',
        '14px circles with a 2px gray border; checked is a 4px white dot on primary; 5px left padding, 20px between options; a 24px gray circle behind on hover and focus',
      ],
      [
        '16px、1px 描边、6 的白点；圆和字隔 8、两项隔 24；不画灰色圆，聚焦时控件规格的外圈',
        '16px, 1px border, a 6px dot; 8px to the label and 24px between options; no gray circle, the spec focus ring on focus',
      ],
      'style-override',
    ),
    adapt(
      'radio',
      'a11y',
      [
        '这一组的 radio 没有同一个 name：每一项都是一个 Tab 停靠点；role=radiogroup 那一层不收 aria-label',
        'The radios share no name, so each one is a Tab stop; the role=radiogroup element does not take aria-label',
      ],
      [
        '给一个 name（对齐时），Tab 只进选中的那一项、方向键换；aria-label 渲染后补到 radiogroup 上（三档都是）',
        'A shared name (when aligned): Tab enters the checked option and arrows move; aria-label is added to the radiogroup after render (every mode)',
      ],
      'behavior',
    ),
    adapt(
      'textarea',
      'color',
      [
        '灰底（fill-2）、没有描边，左右 12、上下 4（三行 76 高）',
        'Gray (fill-2) without a border, 12px sides and 4px top / bottom (76px for three rows)',
      ],
      [
        '和输入框一样白底描边、文字离边缘 inset，上下留白 insetBlock（含描边）；只能往下拖',
        'White with a border like the input, text inset from the edge, insetBlock top and bottom (border included); vertical resize only',
      ],
      'style-override',
    ),
    adapt(
      'select',
      'a11y',
      [
        '下拉一收起（Esc、选中、点外面）就让选择框失去焦点，焦点掉到 <body> 上',
        'Closing the dropdown (Esc, a pick, an outside click) blurs the select, dropping focus to <body>',
      ],
      [
        '收起以后焦点没去别处时放回选择框',
        'Focus goes back to the select unless it moved elsewhere',
      ],
      'behavior',
    ),
    adapt(
      'field',
      'state',
      [
        '（套件自己的问题）出错的输入框聚焦时，聚焦的深色描边压过出错的红边',
        '(A kit bug) A focused invalid input showed the focus border instead of the red one',
      ],
      ['出错时聚焦也保持红边', 'Invalid inputs keep the red border while focused'],
      'style-override',
    ),
    // —— 导航菜单（侧栏）——
    adapt(
      'nav',
      'size',
      [
        '菜单项 204×40（line-height 40），上下间隔 4px，菜单留白上下 4、左右 8',
        'Items are 204×40 (line-height 40) with 4px gaps; the menu is padded 4px / 8px',
      ],
      ['36px 高、间隔 2、四周留白 8', '36px tall, 2px gaps, 8px padding all round'],
      'style-override',
    ),
    adapt(
      'nav',
      'type',
      ['菜单文字写死 14px、行高 40px', 'Menu text is fixed at 14px on a 40px line'],
      ['规范的正文字号、一行文字高', 'The spec body size and line height'],
      'style-override',
    ),
    adapt(
      'nav',
      'color',
      [
        '菜单和每一项都是白底（--color-menu-light-bg），文字 text-2、图标 text-3',
        'The menu and every item are white (--color-menu-light-bg); text-2 labels, text-3 icons',
      ],
      [
        '透明（侧栏的底色和分隔线归页面布局），文字、图标颜色取控件规格',
        'Transparent (the sider owns the fill and divider); label and icon colors from the spec',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'icon',
      [
        '图标 1em（14px），离菜单项左边 12、离文字 16，文字在 42px',
        'Icons are 1em (14px), 12px from the left and 16px from the label, which sits at 42px',
      ],
      ['图标 16px，离文字 10，文字在 38px', '16px icons, 10px from the label, which sits at 38px'],
      'style-override',
    ),
    adapt(
      'nav',
      'size',
      [
        '子菜单里的项每级缩进 20px，文字在 32px，比上一级的文字靠左 10px',
        'Submenu items indent 20px per level, so their labels sit at 32px, 10px left of the parent label',
      ],
      [
        '缩进取控件规格（levelIndent 26），文字和上一级的文字对齐（38px）',
        'Indent from the spec (levelIndent 26), aligning with the parent label at 38px',
      ],
      'prop',
    ),
    adapt(
      'nav',
      'icon',
      [
        '子菜单的展开箭头是 Arco 自己的 IconDown（14px），子菜单里有选中项时跟着变主色',
        'The submenu arrow is Arco’s IconDown (14px) and turns primary when a child is selected',
      ],
      [
        '规范图标集的 chevron-down（icons 属性），大小、颜色取 icon 一组，离右边 12',
        'The spec’s chevron-down (icons prop), sized and colored by the icon group, 12px from the right',
      ],
      'prop',
    ),
    adapt(
      'nav',
      'state',
      [
        '选中的项浅灰底（fill-2）加主色字、500；子菜单里有选中项时标题也是主色、500',
        'Selected items get a fill-2 background, primary text, 500; parents of a selected item are primary and 500 too',
      ],
      [
        '选中底色 + 选中色 + 500；子菜单标题只换颜色，400、不加底色',
        'Selected fill and color at 500; the parent only changes color, stays 400 with no fill',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'state',
      [
        '悬停换成浅灰底（fill-2），文字颜色不变',
        'Hover switches to a fill-2 background; text color stays',
      ],
      [
        '悬停底色、文字变深（图标颜色不变）；选中的项悬停不变',
        'Hover fill and a darker label (icon unchanged); selected items do not change on hover',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'keyboard',
      [
        '键盘聚焦是 2px 主色内描边；展开的子菜单内容区 overflow: hidden，外圈会被裁掉',
        'Keyboard focus is a 2px inset primary outline; the open submenu clips anything outside it',
      ],
      [
        '控件规格的 3px 外圈；展开、收起动画以外不裁',
        'The spec’s 3px ring, not clipped outside the expand / collapse animation',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'a11y',
      [
        '子菜单标题能 Tab 聚焦，但没有角色（不是 menuitem，只带 aria-expanded、aria-controls），读屏不知道它是菜单项',
        'Submenu titles are Tab stops without a role (not menuitem, only aria-expanded / aria-controls), so screen readers do not announce a menu item',
      ],
      ['子菜单标题补上 role=menuitem', 'Titles get role=menuitem'],
      'behavior',
    ),
    adapt(
      'nav',
      'keyboard',
      ['菜单项、子菜单标题只认回车，空格没反应', 'Items and titles react to Enter only, not Space'],
      [
        '空格和回车一样选中、展开 / 收起，焦点留在原处',
        'Space works like Enter (select, expand / collapse) and focus stays put',
      ],
      'behavior',
    ),
    adapt(
      'nav',
      'size',
      [
        '收起后菜单 48px 宽（侧栏 64 时右边空 16）、留白 4，项 40×40；文字靠图标 100vw 的右外边距推出菜单',
        'Collapsed, the menu is 48px wide (16px short of a 64px sider), padded 4px, items 40×40; labels are pushed out by a 100vw right margin on the icon',
      ],
      [
        '和侧栏一样宽、留白 8，项 48×36、图标居中；文字藏起来但读屏读得到，不显示箭头',
        'As wide as the sider, 8px padding, 48×36 items with centered icons; labels hidden but readable, no arrow',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'state',
      [
        '收起后有选中子项的子菜单标题只是主色字和图标，没有底色',
        'Collapsed, a parent of the selected item only turns primary, with no fill',
      ],
      ['画成选中的样子（选中底色 + 选中色）', 'Drawn as selected (selected fill and color)'],
      'style-override',
    ),
    adapt(
      'nav',
      'shape',
      [
        '收起后悬停弹出的子菜单（hover 触发的 Dropdown，延时 50ms）在菜单项右边 4px，带一个小三角',
        'The collapsed flyout (a hover Dropdown, 50ms delay) opens 4px right of the item, with an arrow',
      ],
      [
        '左边离侧栏右边缘 popup.offset（离菜单项 13px），顶边和菜单项对齐，没有小三角（triggerProps）',
        'Its left edge sits popup.offset past the sider edge (13px from the item), top-aligned, no arrow (triggerProps)',
      ],
      'prop',
    ),
    adapt(
      'nav',
      'shape',
      [
        '收起后没有子菜单的项，悬停 200ms 出现文字提示（Tooltip）：在菜单项右边 12px、上下居中，带一个 8px 的小箭头；提示里是菜单项的全部内容（图标 + 文字，「工作台」是 80×38）。提示框是 role=tooltip，不连到菜单项上，读屏读的是菜单项自己的文字',
        'Collapsed items without a submenu show a Tooltip after 200ms: 12px right of the item, vertically centered, with an 8px arrow; it holds the whole item content (icon + label; 80×38 for a three-character name). The box is role=tooltip but not linked to the item; screen readers read the item’s own text',
      ],
      [
        '只放名字（Menu.Item 的 renderItemInTooltip）；不要小箭头，左边离侧栏右边缘 popup.offset（离菜单项 13px），上下居中（Menu 的 tooltipProps）',
        'Only the name (renderItemInTooltip on Menu.Item); no arrow, left edge popup.offset past the sider edge (13px from the item), vertically centered (tooltipProps on Menu)',
      ],
      'prop',
    ),
    adapt(
      'nav',
      'shape',
      [
        '提示框 gray-10 深色底（#1D2129）、白字 14/22、左右 12 上下 8、圆角 2（border-radius-small）、阴影 0 4px 10px',
        'The tooltip is gray-10 (#1D2129) with white 14/22 text, 12/8 padding, 2px radius (border-radius-small) and a 0 4px 10px shadow',
      ],
      [
        '取控件规格的 tooltip 一组：底色、字 12/20、左右 8 上下 4、控件圆角，没有阴影',
        'The spec tooltip group: fill, 12/20 text, 8/4 padding, control radius, no shadow',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'shape',
      [
        '弹层再用 transform 往右挪 8px（离菜单项一共 12px）；上下 4px 留白、1px fill-3 描边、4px 圆角、阴影 0 4px 10px，宽度随内容（82px），项 36px 高、选中只加粗',
        'A transform shifts the flyout another 8px (12px in all); 4px vertical padding, 1px fill-3 border, 4px radius, 0 4px 10px shadow, content width (82px), 36px items, selected only bold',
      ],
      [
        '去掉 transform；外框和选项取下拉（popup）一组：四周留白 4、最小宽 160，项 32px、选中浅底加粗',
        'No transform; frame and options from the popup group: 4px padding, 160px min width, 32px options, selected fill and weight',
      ],
      'style-override',
    ),
    // —— 面包屑 ——
    adapt(
      'breadcrumb',
      'icon',
      [
        '分隔符是斜线图标（IconObliqueLine，14px，text-4 色）',
        'The separator is a slash icon (IconObliqueLine, 14px, text-4)',
      ],
      [
        '文字「/」（separator 属性），颜色取控件规格',
        'A text “/” (separator prop) in the spec color',
      ],
      'prop',
    ),
    adapt(
      'breadcrumb',
      'size',
      [
        '每项左右 4px 内边距、行高 24px（整条 24.5px 高），分隔符左右外边距 4',
        'Each item has 4px side padding and a 24px line (24.5px overall); separators get 4px margins',
      ],
      [
        '没有内边距，一行文字高（22px），分隔符左右各 8',
        'No padding, one text line (22px), 8px either side of the separator',
      ],
      'style-override',
    ),
    adapt(
      'breadcrumb',
      'color',
      [
        '上级 text-2，当前页最深的文字色、500',
        'Ancestors are text-2; the current page is the strongest text color at 500',
      ],
      ['上级次要灰，当前页强调色、400', 'Ancestors secondary gray; the current page strong at 400'],
      'style-override',
    ),
    adapt(
      'breadcrumb',
      'state',
      [
        '链接左右 4px 内边距（负外边距抵消），悬停浅灰底（fill-2）、链接蓝',
        'Links have 4px padding (offset by negative margins) and a fill-2 background plus link blue on hover',
      ],
      ['没有内边距、没有底色，悬停文字变深', 'No padding or fill; the text darkens on hover'],
      'style-override',
    ),
    adapt(
      'breadcrumb',
      'keyboard',
      ['链接聚焦是 2px 主色外圈', 'Focused links get a 2px primary ring'],
      ['控件规格的 3px 外圈', 'The spec’s 3px ring'],
      'style-override',
    ),
    adapt(
      'breadcrumb',
      'a11y',
      [
        '当前页只是最后一个 role=listitem，没有 aria-current，读屏听不出哪一项是当前页',
        'The current page is just the last role=listitem with no aria-current, so screen readers cannot tell it is the current page',
      ],
      ['当前页带 aria-current="page"', 'The current page carries aria-current="page"'],
      'behavior',
    ),
    // —— 下拉菜单（用户菜单）——
    adapt(
      'dropdown',
      'shape',
      [
        '默认左对齐按钮（position bl），离按钮 4px',
        'Left-aligned with the trigger by default (position bl), 4px below',
      ],
      [
        '右边和按钮右边对齐，离按钮 popup.offset（position、popupAlign）',
        'Right-aligned with the trigger, popup.offset below (position, popupAlign)',
      ],
      'prop',
    ),
    adapt(
      'dropdown',
      'shape',
      [
        '上下 4px 留白、1px fill-3 描边、4px 圆角、阴影 0 4px 10px，宽度随内容（96px），最高 200px',
        '4px vertical padding, 1px fill-3 border, 4px radius, 0 4px 10px shadow, content width (96px), 200px max height',
      ],
      [
        '四周留白、描边、圆角、阴影取 popup 一组，最小宽 160',
        'Padding, border, radius and shadow from the popup group, 160px min width',
      ],
      'style-override',
    ),
    adapt(
      'dropdown',
      'size',
      [
        '项 94×36、最深的文字色；图标 1em（14px）紧贴文字，和文字同色',
        'Items are 94×36 in the strongest text color; 1em (14px) icons touch the label in the same color',
      ],
      [
        '项高 32，图标 16、离文字 8、次要灰',
        '32px items; 16px icons 8px from the label in secondary gray',
      ],
      'style-override',
    ),
    adapt(
      'dropdown',
      'state',
      [
        '悬停浅灰底（fill-2）；键盘聚焦是 2px 主色内描边',
        'Hover is a fill-2 background; keyboard focus is a 2px inset primary outline',
      ],
      [
        '悬停和键盘高亮都是 popup 的悬停底色',
        'Hover and keyboard highlight share the popup hover fill',
      ],
      'style-override',
    ),
    adapt(
      'dropdown',
      'color',
      [
        'Arco 的下拉菜单没有分隔线和危险项（套件补上，原生模式用 Arco 的边框色 border-2、危险色 danger-6）',
        'No dividers or danger items (the kit adds them; natively in Arco’s border-2 and danger-6)',
      ],
      [
        '分隔线 1px、横跨整个内宽、上下各 4；危险项的字和图标取控件规格',
        '1px divider spanning the inner width with 4px above and below; danger text and icon from the spec',
      ],
      'style-override',
    ),
    adapt(
      'dropdown',
      'keyboard',
      [
        '回车、空格打开以后焦点还在按钮上，没有方向键；Esc 不收起（escToClose 默认关）；在菜单项上按回车，选中、收起以后马上又打开（焦点先交回按钮，这次回车接着点了按钮）',
        'Enter / Space open it but focus stays on the trigger, no arrow keys; Esc does nothing (escToClose is off); Enter on an item selects and closes, then reopens at once (focus goes back to the trigger first and the same Enter clicks it)',
      ],
      [
        '回车、空格、↓ 打开并聚焦第一项，↑ ↓ 移动，回车选中后收起，Esc 收起，焦点都回到按钮',
        'Enter, Space or ↓ open it and focus the first item, ↑ ↓ move, Enter selects and closes, Esc closes; focus returns to the trigger',
      ],
      'behavior',
    ),
    adapt(
      'dropdown',
      'a11y',
      [
        '按钮上没有 aria-haspopup、aria-expanded（开着时只多一个 arco-dropdown-popup-visible 类名），读屏不知道它管着一个菜单、开没开',
        'No aria-haspopup or aria-expanded on the trigger (only an arco-dropdown-popup-visible class when open), so screen readers cannot tell it opens a menu or whether it is open',
      ],
      [
        '按钮带 aria-haspopup="menu" 和 aria-expanded',
        'The trigger carries aria-haspopup="menu" and aria-expanded',
      ],
      'behavior',
    ),
    // —— 头像、徽标 ——
    adapt(
      'avatar',
      'size',
      ['默认 40px，字号是直径的一半（20px）', '40px by default, text at half the diameter (20px)'],
      ['28px（size 属性）', '28px (size prop)'],
      'prop',
    ),
    adapt(
      'avatar',
      'color',
      ['灰底（fill-4）白字，20px、500', 'Gray (fill-4) with white text, 20px at 500'],
      ['浅底深字，12px、500（控件规格）', 'Light fill and dark text, 12px at 500 (the spec)'],
      'style-override',
    ),
    adapt(
      'badge',
      'size',
      [
        '20px 高、最小宽 20、左右 6px，字 12/20、500，外面一圈 2px 白边',
        '20px tall, 20px min width, 6px sides, 12/20 text at 500, a 2px white ring',
      ],
      [
        '16px 高、最小宽 16、左右 4，字 12/16，没有外圈',
        '16px tall, 16px min width, 4px sides, 12/16 text, no ring',
      ],
      'style-override',
    ),
    adapt(
      'badge',
      'shape',
      [
        '数字中心在离右上角往里 2px 的地方（top: 2px; right: 2px）；外层是 inline-block，比图标高一截',
        'The count is centered 2px inside the top-right corner (top / right: 2px); the inline-block wrapper is taller than the icon',
      ],
      [
        '中心对准被标注的东西的右上角（offset 属性），外层正好包住它',
        'Centered on the corner of what it marks (offset prop), with a wrapper that fits it exactly',
      ],
      'prop',
    ),
    adapt(
      'badge',
      'a11y',
      [
        '数字那一层没有 aria-hidden，读屏读得到数字（Badge 也不给这一层传属性）',
        'The count has no aria-hidden, so screen readers read it (Badge passes no props to that element)',
      ],
      [
        'aria-hidden：数字由页面写进按钮的名字里',
        'aria-hidden: the page puts the count in the button’s name',
      ],
      'behavior',
    ),
    adapt(
      'switch',
      'size',
      ['轨道 40×24、圆点 16 离边 4px', 'Track 40×24, 16px thumb 4px from the edge'],
      ['44×22、圆点 18 离边 2px', '44×22, 18px thumb 2px from the edge'],
      'style-override',
    ),
    adapt(
      'switch',
      'color',
      [
        '关是 --color-fill-4（规范里没有对应的角色，只设主题时仍是 Arco 的灰）；圆点没有阴影',
        'Off is --color-fill-4 (no matching role, so it stays Arco gray with only the theme); no thumb shadow',
      ],
      [
        '关是控件边框色，圆点阴影取控件规格',
        'Off uses the control border color; thumb shadow from the spec',
      ],
      'style-override',
    ),
    adapt(
      'switch',
      'state',
      [
        '禁用不降不透明度，换成两种更浅的颜色（主色浅色、浅灰）',
        'Disabled swaps to two lighter colors instead of lowering opacity',
      ],
      ['开关颜色不变，整个 50% 不透明度', 'Same colors at 50% opacity'],
      'style-override',
    ),
    adapt(
      'switch',
      'keyboard',
      [
        '键盘聚焦是 2px 外圈（开时浅主色、关时灰）',
        'Keyboard focus is a 2px ring (light primary when on, gray when off)',
      ],
      ['控件规格的 3px 外圈', 'The 3px ring from the spec'],
      'style-override',
    ),
    adapt(
      'button',
      'size',
      [
        '左右内边距按档位写死：32px 档 15px、36px 档 19px',
        'Padding is fixed per step: 15px at 32px, 19px at 36px',
      ],
      [
        '文字离外边框取控件规格：默认 16px、大号 20px（不跟 Arco 的档位走）',
        'Text inset from the spec: 16px default, 20px large (independent of Arco’s steps)',
      ],
      'prop',
    ),
    adapt(
      'popup',
      'size',
      [
        '下拉的宽度按选项文字算，选择框宽的时候下拉比它窄',
        'The dropdown is as wide as its options, narrower than a wide select',
      ],
      [
        '下拉至少和选择框一样宽（autoAlignPopupMinWidth）',
        'At least as wide as the select (autoAlignPopupMinWidth)',
      ],
      'prop',
    ),
    adapt(
      'button',
      'color',
      ['颜色梯度 1–7 要写成 RGB 三元组', 'The 1–7 color ramp is written as RGB triplets'],
      [
        '由主色混白、混黑生成，第 5 档取规范的悬停色',
        'Mixed from the primary; step 5 is the spec hover',
      ],
      'theme-token',
    ),
    adapt(
      'field',
      'size',
      [
        '控件只有 28 / 32 / 36px 三档，40px 会显示成 36px',
        'Controls come in 28 / 32 / 36px; 40px shows as 36px',
      ],
      [
        '先取最接近的一档，再用输入框的 height 属性和按钮、选择框的高度改成规范值',
        'Picks the nearest step, then sets the exact height via the input height prop and button / select heights',
      ],
      'prop',
    ),
    adapt(
      'field',
      'color',
      ['输入框、选择框是灰底、没有描边', 'Inputs and selects are gray-filled without a border'],
      ['白底 1px 描边', 'White with a 1px border'],
      'style-override',
    ),
    adapt(
      'field',
      'color',
      [
        '输入文字用最深的文字色，占位符用次要灰',
        'Input text uses the strongest color; placeholders use secondary gray',
      ],
      ['正文色、占位色', 'Body color and placeholder color'],
      'style-override',
    ),
    adapt(
      'field',
      'size',
      ['大号输入框文字离边框 16px', 'Large input text sits 16px from the edge'],
      ['12px', '12px'],
      'style-override',
    ),
    adapt(
      'text',
      'type',
      ['按档位写死 14px 字', 'Text is fixed at 14px per size step'],
      ['规范的正文字号', 'The spec body size'],
      'style-override',
    ),
    adapt(
      'checkbox',
      'size',
      [
        '复选框 14px、2px 灰边，左边有 5px 内边距',
        'Checkboxes are 14px with a 2px gray border and 5px left padding',
      ],
      ['16px、1px 描边，去掉内边距', '16px, 1px border, no padding'],
      'style-override',
    ),
    adapt(
      'checkbox',
      'color',
      ['复选框文字用最深的文字色', 'Checkbox labels use the strongest text color'],
      ['正文色', 'Body color'],
      'style-override',
    ),
    adapt(
      'tabs',
      'size',
      ['第一个标签往里缩 16px', 'The first tab is indented 16px'],
      ['第一个标签贴左，间距 32px', 'The first tab is flush left, 32px gaps'],
      'style-override',
    ),
    adapt(
      'tabs',
      'keyboard',
      ['每个标签都能被 Tab 选中，不支持方向键', 'Every tab is a Tab stop; no arrow keys'],
      ['只有选中的标签在 Tab 顺序里，← → 切换', 'Only the active tab is a Tab stop; arrows switch'],
      'behavior',
    ),
    adapt(
      'button',
      'color',
      ['次要按钮是灰底、没有边框', 'Secondary buttons are gray without a border'],
      ['白底描边，悬停浅灰', 'White with a border, light gray on hover'],
      'style-override',
    ),
    adapt(
      'button',
      'size',
      [
        '图标不是 Arco 自己的图标组件时，和文字之间没有间距，文字偏下',
        'Non-Arco icons get no gap and the text sits low',
      ],
      ['间距 8px，一起垂直居中', '8px gap, centered together'],
      'style-override',
    ),
    adapt(
      'link',
      'type',
      [
        '文字按钮用 mini 档：24px 高、12px 字、主色',
        'Text buttons use the mini step: 24px, 12px text, primary color',
      ],
      ['一行文字高、正文字号、链接色', 'One line, body size, link color'],
      'prop',
    ),
    adapt(
      'popup',
      'size',
      ['不传位置时下拉居中对齐输入框', 'Without a position the dropdown is centered on the input'],
      ['左对齐，距离取规格', 'Left-aligned, gap from the spec'],
      'prop',
    ),
    adapt(
      'popup',
      'color',
      ['选项 36px 高、白底，选中浅灰', 'Options are 36px, white, gray when selected'],
      ['32px，选中浅底加粗', '32px, light fill and medium weight when selected'],
      'style-override',
    ),
    adapt(
      'select',
      'icon',
      ['下拉箭头是 Arco 自己的图标', 'The select arrow is Arco’s own icon'],
      ['规范图标集里的下拉箭头（arrowIcon）', 'The arrow from the spec’s icon set (arrowIcon)'],
      'prop',
    ),
    adapt(
      'checkbox',
      'icon',
      ['对勾是 Arco 自己的图标，8px 宽', 'The check is Arco’s own 8px icon'],
      ['规范图标集里的对勾（icon 属性）', 'The check from the spec’s icon set (icon prop)'],
      'prop',
    ),
    adapt(
      'field',
      'icon',
      [
        '密码显隐图标是 Arco 自己的，换不掉',
        'The password toggle icon is Arco’s own and cannot be replaced',
      ],
      ['套件画显隐按钮，图标来自规范图标集', 'The kit draws the toggle with the spec’s icons'],
      'behavior',
    ),
    adapt(
      'button',
      'state',
      ['加载时盖一层白色遮罩', 'Loading adds a white overlay'],
      ['整个按钮按控件规格降低不透明度', 'The whole button fades to the spec’s loading opacity'],
      'behavior',
    ),
    adapt(
      'button',
      'icon',
      ['加载图标写死是 Arco 自己的 IconLoading', 'The loading icon is fixed to Arco’s IconLoading'],
      [
        '套件自己画加载状态，用规范图标集里的加载图标',
        'The kit draws loading with the spec’s loading icon',
      ],
      'behavior',
    ),
  ],
};
