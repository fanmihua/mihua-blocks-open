import {
  Comment,
  Text,
  cloneVNode,
  computed,
  createTextVNode,
  defineComponent,
  h,
  inject,
  markRaw,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  provide,
  ref,
  watch,
  type InjectionKey,
  type PropType,
  type Ref,
  type VNode,
} from 'vue';
// 从 lib/ 引入：这一份不带样式。默认入口（es/）的每个组件会自己把样式插进页面，
// 那样样式就不在 cascade layer 里了；样式表由 styles.css 统一引入并放进 tdesign 层。
import {
  Avatar as TAvatar,
  Badge as TBadge,
  Breadcrumb as TBreadcrumb,
  BreadcrumbItem as TBreadcrumbItem,
  DateRangePicker as TDateRangePicker,
  Dialog as TDialog,
  Button as TButton,
  Checkbox as TCheckbox,
  ConfigProvider as TConfigProvider,
  Dropdown as TDropdown,
  Input as TInput,
  Menu as TMenu,
  MenuItem as TMenuItem,
  Select as TSelect,
  Pagination as TPagination,
  Radio as TRadio,
  RadioGroup as TRadioGroup,
  Submenu as TSubmenu,
  Switch as TSwitch,
  TabPanel as TTabPanel,
  Table as TTable,
  Tabs as TTabs,
  Tag as TTag,
  Textarea as TTextarea,
} from 'tdesign-vue-next/lib';
import type { PrimaryTableCol, TableSort as TDesignSort } from 'tdesign-vue-next/lib';
import {
  ArrowUpDown1Icon,
  BrowseIcon,
  BrowseOffIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
} from 'tdesign-icons-vue-next';
import {
  adapt,
  badgeText,
  resolveControls,
  roleMapping,
  swapsIcons,
  shade,
  themeMappingValues,
  tint,
  type BreadcrumbItem,
  type ControlSpec,
  type DropdownItem,
  nextSort,
  type NavItem,
  type ResolvedTokens,
  type TableColumn,
  type TableRow,
  type TableSort,
  type TagTone,
} from '@mihua/spec';
import { useIconSet, useLocale } from '../../context';
import { Icon } from '../../icon';
import type { VueKit } from '../../kit/types';

/**
 * 语义 token → TDesign 的 CSS 变量。
 * TDesign 的变量在 :root 上就已经组合好了（--td-brand-color 是 var(--td-brand-color-7)，
 * --td-font-body-medium 是「字号 / 行高 字体」一整条）。CSS 变量在声明它的元素上算好值再往下继承，
 * 所以在外层只改底层的色板、字号不起作用，要直接改组合好的那一层。
 * 浅色、深色的几档 TDesign 不会自己从主色算，这里按比例混白、混黑给它。
 */
export function tdesignRoleMappings(t: ResolvedTokens) {
  return {
    '--td-brand-color': roleMapping(t, 'action.primary', '直接作为组件库的主色。'),
    '--td-brand-color-hover': roleMapping(t, 'action.primaryHover', '由独立的主操作悬停角色赋值。'),
    '--td-brand-color-focus': roleMapping(t, 'action.primary', '混白 80%，用于聚焦外圈。', (v) =>
      tint(v, 0.8),
    ),
    '--td-brand-color-active': roleMapping(t, 'action.primary', '混黑 20%，用于按下。', (v) =>
      shade(v, 0.2),
    ),
    '--td-brand-color-disabled': roleMapping(
      t,
      'action.primary',
      '混白 60%，用于禁用和加载。',
      (v) => tint(v, 0.6),
    ),
    '--td-brand-color-light': roleMapping(
      t,
      'action.primary',
      '混白 90%，用于选中项的浅底。',
      (v) => tint(v, 0.9),
    ),
    '--td-brand-color-light-hover': roleMapping(
      t,
      'action.primary',
      '混白 80%，用于浅底的悬停。',
      (v) => tint(v, 0.8),
    ),
    '--td-radius-default': roleMapping(t, 'radius.control', '保留 px，赋给组件库的默认圆角。'),
  };
}

export function tdesignVariables(t: ResolvedTokens): Record<string, string> {
  const status = (name: string, color: string) => ({
    [`--td-${name}-color`]: color,
    [`--td-${name}-color-hover`]: tint(color, 0.3),
    [`--td-${name}-color-focus`]: tint(color, 0.8),
    [`--td-${name}-color-active`]: shade(color, 0.2),
    [`--td-${name}-color-disabled`]: tint(color, 0.6),
    [`--td-${name}-color-light`]: tint(color, 0.9),
    [`--td-${name}-color-light-hover`]: tint(color, 0.8),
  });
  const font = t['font.sans'];
  return {
    ...themeMappingValues(tdesignRoleMappings(t)),
    ...status('error', t['feedback.danger']),
    ...status('success', t['feedback.success']),
    ...status('warning', t['feedback.warning']),
    '--td-text-color-primary': t['text.body'],
    '--td-text-color-secondary': t['text.secondary'],
    '--td-text-color-placeholder': t['text.placeholder'],
    '--td-text-color-disabled': t['text.disabled'],
    '--td-text-color-anti': t['action.onPrimary'],
    '--td-text-color-brand': t['action.primary'],
    '--td-text-color-link': t['text.link'],
    '--td-border-level-1-color': t['border.default'],
    '--td-component-stroke': t['border.default'],
    '--td-border-level-2-color': t['border.control'],
    '--td-component-border': t['border.control'],
    '--td-bg-color-page': t['surface.canvas'],
    '--td-bg-color-container': t['surface.base'],
    '--td-bg-color-container-hover': t['surface.hover'],
    '--td-bg-color-container-active': t['surface.selected'],
    '--td-bg-color-container-select': t['surface.base'],
    '--td-bg-color-specialcomponent': t['surface.base'],
    '--td-bg-color-secondarycontainer': t['surface.subtle'],
    '--td-bg-color-component-disabled': t['surface.subtle'],
    '--td-comp-size-m': t['size.control'],
    '--td-comp-size-xl': t['size.controlLarge'],
    '--td-font-family': font,
    '--td-font-family-medium': font,
    '--td-font-size-body-medium': t['type.body'],
    '--td-font-size-body-small': t['type.small'],
    '--td-font-body-medium': `${t['type.body']} / var(--td-line-height-body-medium) ${font}`,
    '--td-font-body-small': `${t['type.small']} / var(--td-line-height-body-small) ${font}`,
    '--td-font-body-large': `var(--td-font-size-body-large) / var(--td-line-height-body-large) ${font}`,
  };
}

const size = (value?: string) => (value === 'large' ? 'large' : 'medium');

/** 接上规范时是控件规格（控件对齐到统一设计）；原生模式为 null，保留 TDesign 自己的样子。 */
const ControlsKey: InjectionKey<Ref<ControlSpec | null>> = Symbol('mh-tdesign-controls');
/** 下拉的挂载点：在套件作用域内（拿得到 CSS 变量），并抵消祖先的缩放。 */
const PortalKey: InjectionKey<Ref<HTMLElement | null>> = Symbol('mh-tdesign-portal');

/** 页面可能用 CSS zoom 把整个组件缩小显示；挂载点抵消缩放，下拉按 1:1 显示（和其他套件相同）。 */
function cancelAncestorZoom(portal: HTMLElement) {
  const parent = portal.parentElement as (HTMLElement & { currentCSSZoom?: number }) | null;
  const zoom = parent?.currentCSSZoom ?? 1;
  portal.style.zoom = Math.abs(zoom - 1) > 0.001 ? String(1 / zoom) : '';
}

/**
 * 密码显隐：TDesign 自带的眼睛是一个不能用 Tab 键聚焦、没有名字的 SVG，点它切换明文。
 * 统一设计要一个能聚焦、有名字的按钮（和其他套件相同）。TDesign 允许按名字全局替换组件内置的图标，
 * 就把 BrowseIcon / BrowseOffIcon 换成这个按钮：切换还是 TDesign 自己做（它把点击交给图标），
 * 图标来自规范的图标集；规范写 icon.set: native 时按钮里放 TDesign 自己的眼睛。
 */
function PasswordToggle(shown: boolean) {
  return (attrs: { onClick?: (event: MouseEvent) => void } = {}) => {
    const zh = useLocale().value === 'zh';
    const native = !swapsIcons(useIconSet().value);
    return h(
      'button',
      {
        type: 'button',
        class: 'mh-eye',
        'aria-label': shown
          ? zh
            ? '隐藏密码'
            : 'Hide password'
          : zh
            ? '显示密码'
            : 'Show password',
        // 点按钮时不让输入框失去焦点
        onMousedown: (event: MouseEvent) => event.preventDefault(),
        onClick: attrs.onClick,
      },
      [
        native
          ? h(shown ? BrowseIcon : BrowseOffIcon)
          : h(Icon, { name: shown ? 'eye' : 'eye-off' }),
      ],
    );
  };
}
/** TDesign 在密码隐藏时显示 BrowseOffIcon（点了显示），显示时是 BrowseIcon（点了隐藏）。 */
const PASSWORD_ICONS = { BrowseIcon: PasswordToggle(true), BrowseOffIcon: PasswordToggle(false) };

const Provider = defineComponent({
  name: 'TDesignKitProvider',
  props: {
    tokens: { type: Object as PropType<ResolvedTokens | null>, default: null },
    aligned: { type: Boolean, default: true },
  },
  setup(props, { slots }) {
    const controls = computed(() =>
      props.tokens && props.aligned ? resolveControls(props.tokens) : null,
    );
    const aligned = computed(() => controls.value !== null);
    const portal = ref<HTMLElement | null>(null);
    provide(ControlsKey, controls);
    provide(PortalKey, portal);
    onMounted(() => portal.value && cancelAncestorZoom(portal.value));
    const globalConfig = computed(() => ({
      // 弹层一律挂在作用域内的挂载点（TDesign 默认挂到 body）
      attach: { popup: () => portal.value ?? document.body },
      // 接上规范时，用 TDesign 的「全局替换图标」把密码框的眼睛换成套件的显隐按钮（见 PasswordToggle）
      ...(aligned.value ? { icon: PASSWORD_ICONS } : {}),
    }));
    return () =>
      h(
        'div',
        {
          // --aligned：styles.css 里按统一设计调整尺寸、标签栏、复选框、开关和下拉（见那里的说明）
          // --icons：规范选了一套图标（icon.set 不是 native）时，换掉 TDesign 用 CSS 画的对勾
          class: [
            'mh-kit-tdesign',
            aligned.value && 'mh-kit-tdesign--aligned',
            aligned.value && swapsIcons(props.tokens?.['icon.set']) && 'mh-kit-tdesign--icons',
          ],
          style: props.tokens ? tdesignVariables(props.tokens) : undefined,
          // 打开下拉之前再量一次：外层的缩放可能在挂载之后才变
          onPointerdownCapture: () => portal.value && cancelAncestorZoom(portal.value),
        },
        [
          h(TConfigProvider, { globalConfig: globalConfig.value }, () => slots.default?.()),
          h('div', { class: 'mh-portal', ref: portal }),
        ],
      );
  },
});

/** 模板换行会在按钮文字两端留下一个空格，让文字偏离中心；去掉文字节点两端的空白。 */
function trimText(nodes: VNode[] | undefined) {
  return nodes?.map((node) =>
    node.type === Text && typeof node.children === 'string'
      ? createTextVNode(node.children.trim())
      : node,
  );
}

/** 接上规范时塞进 TDesign 图标位的图标（下拉箭头、加载）：来自规范的图标集，不用 TDesign 自带的。 */
const SelectArrow = markRaw(
  defineComponent({
    name: 'MihuaSelectArrow',
    setup: () => () => h(Icon, { name: 'chevron-down', class: 'mh-select-arrow' }),
  }),
);
const Spinner = () => h(Icon, { name: 'loading', spin: true, class: 'mh-btn-spinner' });

type Host = Ref<{ $el?: Element } | null>;

/**
 * 组件渲染完以后，改它里面某个元素的属性。TDesign 没给这些地方留属性入口（见各处说明），
 * 每次更新后再写一遍；值没变时浏览器什么也不做。
 */
function patchAfterRender(host: Host, patch: (root: Element) => void) {
  const apply = () => {
    const root = host.value?.$el;
    if (root instanceof Element) patch(root);
  };
  onMounted(apply);
  onUpdated(apply);
}

function setAttrs(el: Element | null | undefined, attrs: Record<string, unknown>) {
  if (!el) return;
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) el.removeAttribute(name);
    else el.setAttribute(name, String(value));
  }
}

const Button = defineComponent({
  name: 'TDesignKitButton',
  props: {
    variant: {
      type: String as PropType<'primary' | 'secondary' | 'link' | 'text'>,
      required: true,
    },
    size: String as PropType<'default' | 'large'>,
    block: Boolean,
    loading: Boolean,
    disabled: Boolean,
    type: { type: String as PropType<'button' | 'submit'>, default: 'button' },
    ariaLabel: String,
  },
  emits: ['click'],
  setup(props, { slots, emit }) {
    const controls = inject(ControlsKey, ref(null));
    const iconChoice = useIconSet();
    return () =>
      h(
        TButton,
        {
          theme: props.variant === 'secondary' || props.variant === 'text' ? 'default' : 'primary',
          variant:
            props.variant === 'primary'
              ? 'base'
              : props.variant === 'secondary'
                ? 'outline'
                : 'text',
          size: size(props.size),
          block: props.block,
          loading: props.loading,
          // 加载图标用规范图标集里的那一个（TDesign 默认是自己的渐变圆环）
          ...(controls.value && swapsIcons(iconChoice.value)
            ? { loadingProps: { indicator: Spinner } }
            : {}),
          disabled: props.disabled,
          type: props.type,
          'aria-label': props.ariaLabel,
          onClick: () => emit('click'),
        },
        { default: () => trimText(slots.default?.()), ...(slots.icon ? { icon: slots.icon } : {}) },
      );
  },
});

const Input = defineComponent({
  name: 'TDesignKitInput',
  inheritAttrs: false,
  props: {
    modelValue: { type: String, required: true },
    type: { type: String as PropType<'text' | 'password' | 'email' | 'tel'>, default: 'text' },
    size: String as PropType<'default' | 'large'>,
    invalid: Boolean,
    ariaLabel: String,
  },
  emits: ['update:modelValue'],
  setup(props, { slots, emit, attrs }) {
    const host: Host = ref(null);
    // TDesign 的输入框只把自己认识的属性（name、placeholder、autocomplete、maxlength）交给里面的 <input>，
    // 其余的（aria-label、aria-describedby、inputmode）落在外层的 div 上——读屏找不到输入框的名字。
    // 认识的直接给它，其余的渲染完以后转给真正的 <input>。
    const OWN = new Set([
      'name',
      'placeholder',
      'autocomplete',
      'maxlength',
      'disabled',
      'readonly',
    ]);
    // class、style、事件留给外层；其余不认识的属性转给 <input>
    const forInput = ([key]: [string, unknown]) =>
      !OWN.has(key) && key !== 'class' && key !== 'style' && !/^on[A-Z]/.test(key);
    patchAfterRender(host, (root) =>
      setAttrs(root.querySelector('input'), {
        ...Object.fromEntries(Object.entries(attrs).filter(forInput)),
        'aria-label': props.ariaLabel,
        'aria-invalid': props.invalid || undefined,
      }),
    );
    return () =>
      h(
        TInput,
        {
          ...Object.fromEntries(Object.entries(attrs).filter((entry) => !forInput(entry))),
          ref: host,
          value: props.modelValue,
          onChange: (value: string | number) => emit('update:modelValue', String(value)),
          // TDesign 的 type 没有 email，按 text 处理；密码框的显隐按钮见 PasswordToggle
          type: props.type === 'email' ? 'text' : props.type,
          size: size(props.size),
          status: props.invalid ? 'error' : 'default',
        },
        slots.suffix ? { suffix: slots.suffix } : undefined,
      );
  },
});

const Checkbox = defineComponent({
  name: 'TDesignKitCheckbox',
  props: { modelValue: { type: Boolean, required: true }, invalid: Boolean },
  emits: ['update:modelValue'],
  setup(props, { slots, emit, attrs }) {
    const controls = inject(ControlsKey, ref(null));
    const host: Host = ref(null);
    // 键盘：TDesign 让外层的 <label> 接焦点（tabindex=0），里面真正的复选框 tabindex=-1，
    // 读屏读到的是「一段文字」而不是复选框。接上规范时把焦点还给原生复选框（和其他套件一样）。
    patchAfterRender(host, (label) => {
      if (!controls.value) return;
      const disabled = label.classList.contains('t-is-disabled');
      setAttrs(label, { tabindex: undefined });
      setAttrs(label.querySelector('input[type=checkbox]'), {
        tabindex: disabled ? undefined : '0',
        'aria-invalid': props.invalid || undefined,
      });
    });
    return () =>
      h(
        TCheckbox,
        {
          ...attrs,
          ref: host,
          checked: props.modelValue,
          onChange: (checked: boolean) => emit('update:modelValue', checked === true),
          class: props.invalid ? 'mh-tdesign-invalid' : undefined,
        },
        slots,
      );
  },
});

const Tabs = defineComponent({
  name: 'TDesignKitTabs',
  props: {
    modelValue: { type: String, required: true },
    items: { type: Array as PropType<Array<{ value: string; label: string }>>, required: true },
    ariaLabel: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const controls = inject(ControlsKey, ref(null));
    const host: Host = ref(null);
    const tabsOf = (root: Element) => [...root.querySelectorAll<HTMLElement>('.t-tabs__nav-item')];
    // 键盘：TDesign 的标签是普通 div，没有 role、不能用 Tab 键聚焦，也没有方向键。
    // 接上规范时按 WAI-ARIA 标签页的做法补上：tablist / tab / aria-selected，
    // 只有选中的标签在 Tab 顺序里，← → 移动焦点并切换（和其他套件一致）。
    patchAfterRender(host, (root) => {
      if (!controls.value) return;
      setAttrs(root.querySelector('.t-tabs__nav-wrap'), {
        role: 'tablist',
        'aria-label': props.ariaLabel,
      });
      tabsOf(root).forEach((tab, index) => {
        const selected = props.items[index]?.value === props.modelValue;
        setAttrs(tab, {
          role: 'tab',
          'aria-selected': String(selected),
          tabindex: selected ? '0' : '-1',
        });
      });
    });
    const onKeydown = (event: KeyboardEvent) => {
      if (!controls.value) return;
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      const index =
        (props.items.findIndex((item) => item.value === props.modelValue) +
          step +
          props.items.length) %
        props.items.length;
      // 先移动焦点再切换，和其他套件的顺序相同
      const root = host.value?.$el;
      if (root instanceof Element) tabsOf(root)[index]?.focus();
      emit('update:modelValue', props.items[index]!.value);
    };
    return () =>
      h(
        TTabs,
        {
          ref: host,
          class: 'mh-kit-tdesign-tabs',
          value: props.modelValue,
          onChange: (value: string | number) => emit('update:modelValue', String(value)),
          onKeydown,
        },
        () =>
          props.items.map((item) =>
            h(TTabPanel, { key: item.value, value: item.value, label: item.label }),
          ),
      );
  },
});

const Select = defineComponent({
  name: 'TDesignKitSelect',
  props: {
    modelValue: { type: String, required: true },
    options: { type: Array as PropType<Array<{ value: string; label: string }>>, required: true },
    size: String as PropType<'default' | 'large'>,
    width: Number,
    display: Function as PropType<(value: string) => string>,
    ariaLabel: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const controls = inject(ControlsKey, ref(null));
    const iconChoice = useIconSet();
    const host: Host = ref(null);
    const open = ref(false);
    // TDesign 的选择框里面是一个只读的 <input>，没有 combobox 角色；aria-label 也落不到它身上。
    patchAfterRender(host, (root) =>
      setAttrs(root.querySelector('input'), {
        role: 'combobox',
        'aria-haspopup': 'listbox',
        'aria-expanded': String(open.value),
        'aria-label': props.ariaLabel,
      }),
    );
    return () => {
      const selected = props.options.find((option) => option.value === props.modelValue);
      return h(TSelect, {
        ref: host,
        // 键盘：TDesign 的选择框收着的时候回车不打开（要先按 ↓ 选中一项，回车才打开）；对齐时回车、空格直接打开
        onKeydownCapture: (event: KeyboardEvent) => {
          if (!controls.value || open.value || (event.key !== 'Enter' && event.key !== ' ')) return;
          event.preventDefault();
          open.value = true;
        },
        value: props.modelValue,
        onChange: (value: unknown) => emit('update:modelValue', String(value)),
        options: props.options,
        size: size(props.size),
        popupVisible: open.value,
        onPopupVisibleChange: (visible: boolean) => (open.value = visible),
        // 已选的值显示成文字（TDesign 默认把它写进只读输入框的 value 里）
        valueDisplay: () =>
          props.display ? props.display(props.modelValue) : (selected?.label ?? ''),
        // 下拉箭头用规范图标集里的那一个
        ...(controls.value && swapsIcons(iconChoice.value)
          ? { suffixIcon: () => h(SelectArrow) }
          : {}),
        style: props.width ? { width: `${props.width}px` } : undefined,
      });
    };
  },
});

const Switch = defineComponent({
  name: 'TDesignKitSwitch',
  props: {
    modelValue: { type: Boolean, required: true },
    disabled: Boolean,
    ariaLabel: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const controls = inject(ControlsKey, ref(null));
    // 键盘：TDesign 的开关是一个普通 div，没有 role="switch"，不能用 Tab 键聚焦，空格、回车也没反应。
    // 接上规范时补上角色、焦点和按键（和其他套件一致）。
    const onKeydown = (event: KeyboardEvent) => {
      if (props.disabled || (event.key !== ' ' && event.key !== 'Enter')) return;
      event.preventDefault();
      emit('update:modelValue', !props.modelValue);
    };
    return () =>
      h(TSwitch, {
        value: props.modelValue,
        onChange: (value: unknown) => emit('update:modelValue', value === true),
        disabled: props.disabled,
        'aria-label': props.ariaLabel,
        ...(controls.value
          ? {
              role: 'switch',
              'aria-checked': String(props.modelValue),
              'aria-disabled': props.disabled || undefined,
              tabindex: props.disabled ? undefined : '0',
              onKeydown,
            }
          : {}),
      });
  },
});

/**
 * 菜单项上的回车、空格：TDesign 的菜单项是普通的 li / div，只认鼠标点击；接上规范时把按键换成点击
 * （叶子选中，子菜单标题展开 / 收起，都还是 TDesign 自己做）。
 */
function clickOnEnter(event: KeyboardEvent) {
  if (event.defaultPrevented || (event.key !== 'Enter' && event.key !== ' ')) return;
  const target = event.target as HTMLElement | null;
  if (!target?.classList.contains('t-menu__item')) return;
  event.preventDefault();
  target.click();
}

let navCount = 0;

/**
 * 导航菜单：TDesign 的 Menu / Submenu / MenuItem。选中哪一项（value）、哪些子菜单展开（expanded）
 * 都由页面传进来；收起（collapsed）以后 TDesign 自己把子菜单换成鼠标悬停弹出的弹层。
 */
const NavMenu = defineComponent({
  name: 'TDesignKitNavMenu',
  props: {
    items: { type: Array as PropType<NavItem[]>, required: true },
    selected: { type: String, required: true },
    open: { type: Array as PropType<string[]>, required: true },
    collapsed: Boolean,
    ariaLabel: String,
  },
  emits: ['update:selected', 'update:open'],
  setup(props, { emit }) {
    const controls = inject(ControlsKey, ref(null));
    const portal = inject(PortalKey, ref(null));
    const iconChoice = useIconSet();
    const host: Host = ref(null);
    /** 收起后的弹层上的类名前缀：在挂载点里找到第几个子菜单的弹层。 */
    const uid = `mh-nav-${++navCount}`;
    const same = (a: string[], b: string[]) =>
      a.length === b.length && a.every((key) => b.includes(key));
    // 键盘和读屏：TDesign 的菜单是没有 role、没有 tabindex 的 ul / li / div，不能用 Tab 键聚焦，也没有按键。
    // 接上规范时补上 menu / menuitem、Tab 焦点和回车空格（和其他套件一致）。子菜单里的项在下面直接给属性
    // （收起后的弹层里也是它们）；一级项、子菜单标题没有属性入口，渲染完以后补。
    patchAfterRender(host, (root) => {
      if (!controls.value) return;
      setAttrs(root.querySelector('ul.t-menu'), { role: 'menu', 'aria-label': props.ariaLabel });
      const groups = props.items.filter((item) => item.children);
      root.querySelectorAll('ul.t-menu > li.t-submenu').forEach((li, index) => {
        const group = groups[index];
        setAttrs(li, { role: 'none' });
        setAttrs(li.querySelector(':scope > .t-menu__item'), {
          'aria-haspopup': props.collapsed ? 'menu' : undefined,
          'aria-expanded': props.collapsed
            ? undefined
            : String(props.open.includes(group?.key ?? '')),
        });
        setAttrs(li.querySelector(':scope > .t-menu__sub'), {
          role: 'menu',
          'aria-label': group?.label,
        });
      });
      for (const item of root.querySelectorAll('.t-menu__item')) {
        const title = item.parentElement?.classList.contains('t-submenu');
        setAttrs(item, {
          role: 'menuitem',
          tabindex: '0',
          'aria-current': !title && item.classList.contains('t-is-active') ? 'page' : undefined,
        });
      }
    });
    // 收起后的子菜单：TDesign 只在鼠标移进、移出子菜单时打开、关上弹层，点击、按键都没有反应。
    // 接上规范时让键盘也能用（和参照实现一样）：在子菜单图标上按回车、空格打开弹层（交给 TDesign 自己的
    // mouseenter），焦点进到第一项；弹层里 Tab 移动，回车、空格选中，Esc 关上，关上后焦点回到图标；
    // 焦点离开弹层也关上。
    const submenus = () => [
      ...((host.value?.$el as Element | undefined)?.querySelectorAll<HTMLElement>(
        'ul.t-menu > li.t-submenu',
      ) ?? []),
    ];
    const flyoutItems = (index: number) => [
      ...(portal.value ?? document).querySelectorAll<HTMLElement>(`.${uid}-${index} .t-menu__item`),
    ];
    /** 弹层上的类名记着它是第几个子菜单的（-1：不在弹层里）。 */
    const flyoutIndex = (el: Element | null) => {
      const name = [...(el?.closest('.t-menu__popup')?.classList ?? [])].find((n) =>
        n.startsWith(`${uid}-`),
      );
      return name ? Number(name.slice(uid.length + 1)) : -1;
    };
    const openFlyout = (index: number, tries = 50, opened = false) => {
      const retry = () => setTimeout(() => openFlyout(index, tries - 1, opened), 10);
      if (!opened) {
        // 刚关上、还在淡出：等淡出结束再打开，不然淡出结束时会把刚聚焦的项藏起来、焦点丢掉
        const popup = (portal.value ?? document).querySelector(`.${uid}-${index}`)?.parentElement;
        if (popup?.className.includes('animation-leave') && tries > 0) return void retry();
        submenus()[index]?.dispatchEvent(new MouseEvent('mouseenter'));
        opened = true;
      }
      // 弹层刚打开时还在淡入（visibility: hidden），那时聚焦不上，等它看得见再聚焦
      const first = flyoutItems(index)[0];
      if (first?.checkVisibility({ visibilityProperty: true })) first.focus();
      if (document.activeElement !== first && tries > 0) retry();
    };
    const closeFlyout = (index: number, refocus: boolean) => {
      const li = submenus()[index];
      li?.dispatchEvent(new MouseEvent('mouseleave'));
      if (refocus) li?.querySelector<HTMLElement>(':scope > .t-menu__item')?.focus();
    };
    const onMenuKeydown = (event: KeyboardEvent) => {
      const li = (event.target as HTMLElement).parentElement;
      if (
        props.collapsed &&
        li?.classList.contains('t-submenu') &&
        (event.key === 'Enter' || event.key === ' ')
      ) {
        event.preventDefault();
        openFlyout(submenus().indexOf(li));
      } else clickOnEnter(event);
    };
    const onItemKeydown = (event: KeyboardEvent) => {
      const index = flyoutIndex(event.target as Element);
      if (index < 0) return clickOnEnter(event);
      if (event.key === 'Escape') {
        event.preventDefault();
        closeFlyout(index, true);
      } else if (event.key === 'Enter' || event.key === ' ') {
        clickOnEnter(event);
        closeFlyout(index, true);
      }
    };
    const onItemFocusout = (event: FocusEvent) => {
      const index = flyoutIndex(event.target as Element);
      if (index >= 0 && flyoutIndex(event.relatedTarget as Element | null) !== index)
        closeFlyout(index, false);
    };
    // 菜单图标来自规范图标集；带上 TDesign 的 t-icon 类，原生模式下和 TDesign 自己的图标一样大、一样的间距
    const icon = (item: NavItem) =>
      item.icon ? () => h(Icon, { name: item.icon!, class: 't-icon mh-nav-icon' }) : undefined;
    const leaf = (item: NavItem) =>
      h(
        TMenuItem,
        {
          key: item.key,
          value: item.key,
          icon: icon(item),
          ...(controls.value
            ? {
                role: 'menuitem',
                tabindex: '0',
                'aria-current': item.key === props.selected ? 'page' : undefined,
                onKeydown: onItemKeydown,
                onFocusout: onItemFocusout,
              }
            : {}),
        },
        () => item.label,
      );
    return () => {
      // 子菜单的展开箭头换成规范图标集的 chevron-down（TDesign 的 FakeArrow 没有图标位，放进标题里，样式表藏起 FakeArrow）
      const arrow = !!controls.value && swapsIcons(iconChoice.value) && !props.collapsed;
      return h(
        TMenu,
        {
          ref: host,
          value: props.selected,
          expanded: props.open,
          collapsed: props.collapsed,
          'aria-label': props.ariaLabel,
          // TDesign 的菜单自己定宽（展开 232、收起 64）；接上规范时跟着侧栏（宽度归页面布局）
          ...(controls.value ? { width: ['100%', '100%'], onKeydown: onMenuKeydown } : {}),
          onChange: (value: string | number) => emit('update:selected', String(value)),
          // 收起以后 TDesign 用 expanded 记「哪个弹层开着」（悬停打开时也会通知），那不是页面的展开状态，不转给页面
          onExpand: (values: Array<string | number>) => {
            const keys = values.map(String);
            if (!props.collapsed && !same(keys, props.open)) emit('update:open', keys);
          },
        },
        () =>
          props.items.map((item) =>
            item.children
              ? h(
                  TSubmenu,
                  {
                    key: item.key,
                    value: item.key,
                    icon: icon(item),
                    popupProps: {
                      overlayInnerClassName: `${uid}-${props.items.filter((i) => i.children).indexOf(item)}`,
                    },
                    title: () =>
                      arrow
                        ? [item.label, h(Icon, { name: 'chevron-down', class: 'mh-nav-arrow' })]
                        : item.label,
                  },
                  () => item.children!.map(leaf),
                )
              : leaf(item),
          ),
      );
    };
  },
});

/**
 * 面包屑：TDesign 的 Breadcrumb。能点的上级给 TDesign 一个「路由」（router 属性）：
 * TDesign 点了链接会调 router.push(to)，套件在这里通知页面（navigate），不真的跳转。
 */
const Breadcrumb = defineComponent({
  name: 'TDesignKitBreadcrumb',
  props: {
    items: { type: Array as PropType<BreadcrumbItem[]>, required: true },
    ariaLabel: String,
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    const controls = inject(ControlsKey, ref(null));
    const router = {
      push: (key: string) => emit('navigate', key),
      replace: (key: string) => emit('navigate', key),
    };
    return () => {
      const separator = controls.value?.breadcrumb.separator;
      const last = props.items.length - 1;
      return h(
        TBreadcrumb,
        {
          // TDesign 只在创建时读一次分隔符：换外观时重新创建
          key: separator ?? 'native',
          'aria-label': props.ariaLabel,
          // 分隔符：TDesign 默认是 ChevronRight 图标，接上规范时用控件规格的文字
          ...(separator ? { role: 'navigation', separator } : {}),
        },
        () =>
          props.items.map((item, index) =>
            h(
              TBreadcrumbItem,
              {
                key: item.key,
                ...(item.link && index < last ? { href: '#', to: item.key, router } : {}),
                ...(separator && index === last ? { 'aria-current': 'page' } : {}),
              },
              () => item.label,
            ),
          ),
      );
    };
  },
});

let dropdownCount = 0;

/**
 * 下拉菜单：TDesign 的 Dropdown，点击触发按钮（默认插槽）打开。开没开由套件记着（popupProps.visible），
 * 因为键盘要能打开、收起它。「在这一项上面画分隔线」在 TDesign 里是「在上一项下面画」（divider）。
 */
const Dropdown = defineComponent({
  name: 'TDesignKitDropdown',
  props: {
    items: { type: Array as PropType<DropdownItem[]>, required: true },
    ariaLabel: String,
  },
  emits: ['select'],
  setup(props, { emit, slots }) {
    const controls = inject(ControlsKey, ref(null));
    const portal = inject(PortalKey, ref(null));
    /** 弹层上的类名：在挂载点里找到这一个下拉菜单的弹层。 */
    const id = `mh-dropdown-${++dropdownCount}`;
    const open = ref(false);
    let trigger: HTMLElement | null = null;
    let viaKeyboard = false;
    const menuOf = () => (portal.value ?? document).querySelector<HTMLElement>(`.${id}`);
    const itemsOf = () => [...(menuOf()?.querySelectorAll<HTMLElement>('.t-dropdown__item') ?? [])];
    const close = () => {
      open.value = false;
      trigger?.focus();
    };
    // 键盘：TDesign 的下拉菜单只认鼠标（项是没有 role 的 li，没有方向键，Esc 也收不起来）。
    // 接上规范时按 WAI-ARIA 菜单按钮的做法补上：回车、空格、↓ 打开并把焦点放到第一项，↑ ↓ 移动，
    // 回车选中，Esc 收起，收起后焦点回到触发按钮（和其他套件一致）。
    const onDocumentKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      const items = itemsOf();
      const index = items.indexOf(document.activeElement as HTMLElement);
      if (index < 0) return;
      const move = (to: number) => {
        event.preventDefault();
        items[Math.max(0, Math.min(items.length - 1, to))]?.focus();
      };
      if (event.key === 'ArrowDown') move(index + 1);
      else if (event.key === 'ArrowUp') move(index - 1);
      else if (event.key === 'Home') move(0);
      else if (event.key === 'End') move(items.length - 1);
      else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        items[index]!.click();
      } else if (event.key === 'Tab') event.preventDefault();
    };
    /** 弹层打开以后（TDesign 打开时才创建内容）：补上角色；用键盘打开的，焦点进到第一项。 */
    const afterOpen = (tries = 30) => {
      if (!open.value) return;
      const menu = menuOf();
      if (!menu || !itemsOf().length) {
        if (tries > 0) setTimeout(() => afterOpen(tries - 1), 10);
        return;
      }
      setAttrs(menu, { role: 'menu', 'aria-label': props.ariaLabel });
      for (const item of itemsOf()) setAttrs(item, { role: 'menuitem', tabindex: '-1' });
      if (viaKeyboard) itemsOf()[0]?.focus();
      viaKeyboard = false;
    };
    watch(open, (value) => {
      document.removeEventListener('keydown', onDocumentKeydown, true);
      if (!value || !controls.value) return;
      document.addEventListener('keydown', onDocumentKeydown, true);
      nextTick(() => afterOpen());
    });
    onBeforeUnmount(() => document.removeEventListener('keydown', onDocumentKeydown, true));
    const onTriggerKeydown = (event: KeyboardEvent) => {
      if (!controls.value) return;
      // 回车、空格：按钮自己会触发点击，TDesign 照常打开，这里只记下「是键盘打开的」
      if ((event.key === 'Enter' || event.key === ' ') && !open.value) viaKeyboard = true;
      else if (event.key === 'ArrowDown') {
        event.preventDefault();
        viaKeyboard = true;
        open.value = true;
      }
    };
    const options = computed(() =>
      props.items.map((item, index) => ({
        value: item.key,
        content: item.label,
        theme: (item.danger ? 'error' : 'default') as 'error' | 'default',
        divider: !!props.items[index + 1]?.divided,
        ...(item.icon ? { prefixIcon: () => h(Icon, { name: item.icon! }) } : {}),
      })),
    );
    return () =>
      h(
        TDropdown,
        {
          options: options.value,
          trigger: 'click',
          placement: 'bottom-right',
          // TDesign 给每一项写了行内的 max-width: 100px（maxColumnWidth），接上规范时项和弹层一样宽
          ...(controls.value ? { maxColumnWidth: 'none' } : {}),
          popupProps: {
            visible: open.value,
            onVisibleChange: (visible: boolean) => (open.value = visible),
            overlayInnerClassName: id,
          },
          onClick: (data: { value?: unknown }) => {
            emit('select', String(data.value));
            if (controls.value) close();
          },
        },
        {
          // 触发按钮是插槽里的第一个元素（TDesign 只取第一个）；模板里的注释不算
          default: () =>
            slots
              .default?.()
              .filter((node) => node.type !== Comment)
              .map((node, index) =>
                index === 0 && controls.value
                  ? cloneVNode(
                      node,
                      {
                        ref: (el: unknown) => (trigger = el instanceof HTMLElement ? el : null),
                        'aria-haspopup': 'menu',
                        'aria-expanded': String(open.value),
                        onKeydown: onTriggerKeydown,
                      },
                      true,
                    )
                  : node,
              ),
        },
      );
  },
});

/** 头像：TDesign 的 Avatar（圆形，显示文字）。 */
const Avatar = defineComponent({
  name: 'TDesignKitAvatar',
  props: { text: { type: String, required: true } },
  setup: (props) => () => h(TAvatar, { shape: 'circle' }, () => props.text),
});

/** 徽标：TDesign 的 Badge，数字标在被标注的东西的右上角。 */
const Badge = defineComponent({
  name: 'TDesignKitBadge',
  props: { count: { type: Number, required: true } },
  setup(props, { slots }) {
    const controls = inject(ControlsKey, ref(null));
    const host: Host = ref(null);
    // 读屏：数字写在它所标注的按钮的名字里，徽标本身不读（TDesign 的 sup 没有 aria-hidden）
    patchAfterRender(host, (root) =>
      setAttrs(root.querySelector(':scope > sup'), {
        'aria-hidden': controls.value ? 'true' : undefined,
      }),
    );
    return () =>
      h(TBadge, { ref: host, count: badgeText(props.count) }, { default: () => slots.default?.() });
  },
});

/** 表格里的排序按钮、分页的上一页下一页：规范选了 native 图标集时用 TDesign 自己的图标。 */
const NATIVE_SORT_ICON = {
  asc: ChevronUpIcon,
  desc: ChevronDownIcon,
  none: ArrowUpDown1Icon,
} as const;

/**
 * 表格：TDesign 的 Table（PrimaryTable）。勾选用 selectedRowKeys + select-change（受控），
 * 排序用 sort + sort-change（受控，sorter: true 不在本地排），没有行时的内容交给 empty。
 * 表格不分页（页面给的就是这一页），分页交给套件的 Pagination。
 * 对齐时（见各处说明）：表头的排序换成套件自己的按钮，勾选框、表格补上读屏，表格本身不再是一个 Tab 停靠点。
 */
const Table = defineComponent({
  name: 'TDesignKitTable',
  props: {
    columns: { type: Array as PropType<TableColumn[]>, required: true },
    rows: { type: Array as PropType<TableRow[]>, required: true },
    selected: Array as PropType<string[]>,
    sort: { type: Object as PropType<TableSort | null>, default: null },
    loading: Boolean,
    selectLabel: { type: Function as PropType<(row: TableRow) => string>, required: true },
    selectAllLabel: { type: String, required: true },
    ariaLabel: String,
  },
  emits: ['update:selected', 'update:sort'],
  setup(props, { emit, slots }) {
    const controls = inject(ControlsKey, ref(null));
    const iconChoice = useIconSet();
    const host: Host = ref(null);
    // 读屏和键盘：
    // - <table> 和勾选框没有名字（TDesign 不收 aria-label）：名字是页面给的，三档都补；
    // - 对齐时：TDesign 的表格外层 div 是 tabindex=0（给「↑ ↓ 键悬停行、空格勾选」用），Tab 会先停在一个
    //   没有名字的 div 上，格子里的勾选框、按钮本来就能 Tab，去掉它；勾选框和登录框的复选框一样，焦点在外层
    //   label 上（tabindex=0），还给原生复选框；加载中写 aria-busy。
    patchAfterRender(host, (root) => {
      const aligned = !!controls.value;
      if (aligned) setAttrs(root, { tabindex: undefined });
      // 名字（表格、勾选框）是页面给的，三档都补；aria-busy 是状态，只在对齐档
      setAttrs(root.querySelector('table'), {
        'aria-label': props.ariaLabel,
        'aria-busy': (aligned && props.loading) || undefined,
      });
      // 行的顺序就是页面给的顺序（不在本地排序）
      const rows = [...root.querySelectorAll('tbody > tr:not(.t-table__empty-row)')];
      const labelOf = (check: Element) => {
        if (check.closest('thead')) return props.selectAllLabel;
        const row = props.rows[rows.indexOf(check.closest('tr')!)];
        return row && props.selectLabel(row);
      };
      for (const check of root.querySelectorAll('.t-table__cell-check .t-checkbox')) {
        const input = check.querySelector('input[type=checkbox]');
        setAttrs(input, { 'aria-label': labelOf(check) });
        if (!aligned) continue;
        // 焦点还给原生复选框（和登录框的复选框一样）
        setAttrs(check, { tabindex: undefined });
        setAttrs(input, { tabindex: check.classList.contains('t-is-disabled') ? undefined : '0' });
      }
    });
    const orderOf = (key: string) => (props.sort?.key === key ? props.sort.order : null);
    /** 对齐：表头文字和排序图标一起是一个按钮（TDesign 是文字右边两个只能用鼠标点的小箭头）。 */
    const sortButton = (column: TableColumn) => {
      const order = orderOf(column.key);
      const sorted = order ? { 'data-sorted': '' } : {};
      const icon = swapsIcons(iconChoice.value)
        ? h(Icon, {
            name:
              order === 'asc'
                ? 'chevron-up'
                : order === 'desc'
                  ? 'chevron-down'
                  : 'chevrons-up-down',
            ...sorted,
          })
        : h(NATIVE_SORT_ICON[order ?? 'none'], sorted);
      return h(
        'button',
        {
          type: 'button',
          class: 'mh-table-sort',
          onClick: () => emit('update:sort', nextSort(props.sort, column.key)),
        },
        [column.title, icon],
      );
    };
    return () => {
      const aligned = !!controls.value;
      const columns: PrimaryTableCol[] = [
        ...(props.selected
          ? [
              {
                colKey: 'row-select',
                type: 'multiple' as const,
                // 勾选列宽：TDesign 默认 64，对齐时取控件规格
                width: controls.value?.table.selectionWidth,
              },
            ]
          : []),
        ...props.columns.map((column): PrimaryTableCol => {
          const base: PrimaryTableCol = {
            colKey: column.key,
            title: column.title,
            width: column.width,
            align: column.align,
            cell: (_h, { row }) => slots.cell?.({ row: row as TableRow, column }),
          };
          if (!column.sortable) return base;
          if (!aligned) return { ...base, sorter: true };
          const order = orderOf(column.key);
          return {
            ...base,
            title: () => sortButton(column),
            // aria-sort 写在 th 上（attrs 对 th、td 都生效，按 type 分开）
            attrs: ({ type }) =>
              type === 'th' && order
                ? { 'aria-sort': order === 'asc' ? 'ascending' : 'descending' }
                : {},
          };
        }),
      ];
      return h(TTable, {
        ref: host,
        rowKey: 'key',
        data: props.rows,
        columns,
        ...(props.selected ? { selectedRowKeys: props.selected } : {}),
        // 只把行的 key 交给页面（TDesign 的键盘「空格勾选悬停的行」在没有悬停行时会塞进一个 undefined）
        onSelectChange: (keys: Array<string | number>) =>
          emit(
            'update:selected',
            keys.filter((key): key is string => typeof key === 'string'),
          ),
        sort: (props.sort
          ? { sortBy: props.sort.key, descending: props.sort.order === 'desc' }
          : undefined) as TDesignSort,
        onSortChange: (sort: TDesignSort | undefined) => {
          const one = Array.isArray(sort) ? sort[0] : sort;
          emit(
            'update:sort',
            one?.sortBy ? { key: one.sortBy, order: one.descending ? 'desc' : 'asc' } : null,
          );
        },
        loading: props.loading,
        // 加载中整个表格不能操作（鼠标、键盘），接口约定，三档都是
        inert: props.loading || undefined,
        empty: () => slots.empty?.(),
        ...(aligned
          ? {
              // 键盘悬停行（↑ ↓、空格、Esc、A、C）跟着外层 div 的焦点走，外层不再能聚焦，一起关掉
              keyboardRowHover: false,
              class: props.loading ? 'mh-table-loading' : undefined,
              // 加载图标：图标集的那一个（TDesign 是自己的渐变圆环）
              loadingProps: swapsIcons(iconChoice.value)
                ? {
                    indicator: () =>
                      h(Icon, { name: 'loading', spin: true, class: 'mh-table-spinner' }),
                  }
                : undefined,
            }
          : {}),
      });
    };
  },
});

/** 分页的上一页、下一页：图标集的箭头（交给 TDesign 的「按名字替换图标」，只在分页里面生效）。 */
const PAGE_ICONS = {
  ChevronLeftIcon: () => h(Icon, { name: 'chevron-left' }),
  ChevronRightIcon: () => h(Icon, { name: 'chevron-right' }),
};

/**
 * 分页：TDesign 的 Pagination，「共 N 条」交给 totalContent，不要每页条数的选择框。
 * TDesign 的页码是 li、上一页下一页是 div，都没有角色、不能 Tab，键盘用不了；对齐时补上
 * （role=button、tabindex、aria-current、aria-label，回车、空格翻页）。
 */
const Pagination = defineComponent({
  name: 'TDesignKitPagination',
  props: {
    page: { type: Number, required: true },
    pageSize: { type: Number, required: true },
    total: { type: Number, required: true },
    totalText: { type: Function as PropType<(total: number) => string>, required: true },
    pageLabel: { type: Function as PropType<(page: number) => string>, required: true },
    prevLabel: { type: String, required: true },
    nextLabel: { type: String, required: true },
    ariaLabel: String,
  },
  emits: ['update:page'],
  setup(props, { emit }) {
    const controls = inject(ControlsKey, ref(null));
    const iconChoice = useIconSet();
    const nav = ref<HTMLElement | null>(null);
    const host: Host = computed(() => (nav.value ? { $el: nav.value } : null));
    patchAfterRender(host, (root) => {
      for (const item of root.querySelectorAll(
        '.t-pagination__number, .t-pagination__btn-prev, .t-pagination__btn-next',
      )) {
        // 名字是页面给的（接口约定），三档都补：页码「第 2 页」，上一页、下一页
        setAttrs(item, {
          'aria-label': item.classList.contains('t-pagination__btn-prev')
            ? props.prevLabel
            : item.classList.contains('t-pagination__btn-next')
              ? props.nextLabel
              : props.pageLabel(Number(item.textContent)),
        });
        // 角色、Tab、当前页只在对齐档补
        if (!controls.value) continue;
        const disabled = item.classList.contains('t-is-disabled');
        setAttrs(item, {
          role: 'button',
          tabindex: disabled ? undefined : '0',
          'aria-disabled': disabled || undefined,
          'aria-current': item.classList.contains('t-is-current') ? 'page' : undefined,
        });
      }
    });
    const onKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (!controls.value || (event.key !== 'Enter' && event.key !== ' ')) return;
      if (target.getAttribute('role') !== 'button') return;
      event.preventDefault();
      target.click();
    };
    return () => {
      const swap = !!controls.value && swapsIcons(iconChoice.value);
      const pagination = h(TPagination, {
        current: props.page,
        pageSize: props.pageSize,
        total: props.total,
        showPageSize: false,
        totalContent: () =>
          h('div', { class: 't-pagination__total' }, props.totalText(props.total)),
        onChange: ({ current }: { current: number }) => emit('update:page', current),
      });
      return h('nav', { ref: nav, 'aria-label': props.ariaLabel, onKeydown }, [
        // TDesign 在组件创建时读一次图标，换图标要重新创建（key）
        swap
          ? h(
              TConfigProvider,
              { key: 'icons', globalConfig: { icon: PAGE_ICONS } },
              () => pagination,
            )
          : h('div', { key: 'native', style: 'display: contents' }, [pagination]),
      ]);
    };
  },
});

const TAG_THEME: Record<TagTone, 'default' | 'success' | 'warning' | 'danger'> = {
  default: 'default',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

/**
 * 状态标签：TDesign 的 Tag，色调交给 theme。TDesign 默认是深色实底白字（variant: dark），
 * 对齐时用浅底（light），去掉文字上的悬停提示（title）；尺寸、颜色在 styles.css。
 */
const Tag = defineComponent({
  name: 'TDesignKitTag',
  props: { tone: { type: String as PropType<TagTone>, default: 'default' } },
  setup(props, { slots }) {
    const controls = inject(ControlsKey, ref(null));
    return () =>
      h(
        TTag,
        {
          theme: TAG_THEME[props.tone],
          ...(controls.value ? { variant: 'light', title: false } : {}),
        },
        { default: () => slots.default?.() },
      );
  },
});

let dateCount = 0;

/** 日期面板翻月份的箭头：图标集的那一对（TDesign 按名字换图标，只在这个日期范围外面套一层生效）。 */
const DATE_ICONS = {
  ChevronLeftIcon: () => h(Icon, { name: 'chevron-left' }),
  ChevronRightIcon: () => h(Icon, { name: 'chevron-right' }),
};

/** 面板头上的年、月下拉里写着的是哪个月（「2026」「10 月」），换算成从公元 0 年算起的第几个月。 */
function panelMonth(panel: Element) {
  const [month, year] = [
    ...panel.querySelectorAll<HTMLInputElement>('.t-date-picker__header input'),
  ];
  const m = parseInt(month?.value ?? '', 10);
  const y = parseInt(year?.value ?? '', 10);
  return Number.isNaN(m) || Number.isNaN(y) ? null : y * 12 + m - 1;
}

/**
 * 日期范围：TDesign 的 DateRangePicker（两个框、并排两个月的面板）。值是「YYYY-MM-DD」。
 * 接口约定（三档都是）：框能打字（allowInput）；选好两天、或打完字回车才通知页面。TDesign 在原来有值时，
 * 点第一天就把「新的开始 + 原来的结束」发出来，没选完就关上时还会把这一半的值确认掉；套件只认点满两天、
 * 打字回车这两种，其余的拦下来，再把框里的字拉回页面给的值；焦点离开整个日期范围时没提交的字也拉回去。
 * 两个框的名字用 labels（三档）。对齐时（补交互）：没打过字的回车打开 / 收起面板，Esc 收起、退回打的字；
 * 两个框按 combobox 告诉读屏；选完焦点回到打开它的框。
 * 面板头：TDesign 是年、月两个下拉加「上一月、今天、下一月」，两个月各翻各的；统一成「2026年10月」的标题、
 * 左边月份往前、右边月份往后，两个月一起翻（见 syncPanel）。
 */
const DateRange = defineComponent({
  name: 'TDesignKitDateRange',
  props: {
    modelValue: { type: Array as unknown as PropType<[string, string] | null>, default: null },
    placeholder: { type: Array as unknown as PropType<[string, string]>, required: true },
    separator: { type: String, required: true },
    labels: { type: Array as unknown as PropType<[string, string]>, required: true },
    ariaLabel: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const controls = inject(ControlsKey, ref(null));
    const portal = inject(PortalKey, ref(null));
    const iconChoice = useIconSet();
    const uid = `mh-date-popup-${++dateCount}`;
    const root = ref<HTMLElement | null>(null);
    /** 这次打开以后点了几天；是哪个框打开的（选完焦点回到那里）。 */
    let picks = 0;
    let opener: HTMLElement | null = null;
    /** 换一个新数组交给 TDesign：它按数组是不是同一个来决定要不要重读，框里的字就回到页面给的值。 */
    const resync = ref(0);
    const revert = () => (resync.value += 1);
    const value = computed(() => {
      void resync.value;
      return props.modelValue ? [...props.modelValue] : [];
    });
    const inputs = () => [...(root.value?.querySelectorAll<HTMLInputElement>('input') ?? [])];
    /** 框里的字和页面给的值不一样：打过字、还没提交。 */
    const typed = () => inputs().some((input, i) => input.value !== (props.modelValue?.[i] ?? ''));
    const popup = () => portal.value?.querySelector<HTMLElement>(`.${uid}`) ?? null;
    /** 面板开没开：TDesign 自己存着（选完、打字回车时它自己收起，不发事件），按页面上看得见的算。 */
    const isOpen = () => {
      const el = popup();
      return !!el && getComputedStyle(el).display !== 'none';
    };
    const onVisibleChange = (visible: boolean) => {
      if (visible) {
        if (!isOpen()) opener = inputs().find((input) => input === document.activeElement) ?? null;
        return;
      }
      if (picks || typed()) revert();
      picks = 0;
    };
    /** 收起面板：TDesign 的弹层只认「点在外面」，Esc 不管；套件发一个「点在外面」给它。 */
    const close = () => document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    /**
     * 对齐时的键盘（在 TDesign 之前处理）：没打过字的回车打开 / 收起面板、不提交表单；打过字的回车交给 TDesign
     * （两个框都合法才提交，不合法它自己退回页面给的值），回车照常提交表单。Esc 收起面板、打的字退回去；
     * Tab 离开整个日期范围时收起面板。空格不打开（框能打字）。
     */
    const onKeydownCapture = (event: KeyboardEvent) => {
      const target = event.target as HTMLInputElement;
      if (!controls.value || target.tagName !== 'INPUT') return;
      if (event.key === 'Enter') {
        if (typed()) return;
        event.preventDefault();
        event.stopPropagation();
        if (isOpen()) close();
        else target.click();
      } else if (event.key === 'Escape') {
        if (!isOpen() && !typed()) return;
        event.preventDefault();
        if (isOpen()) close();
        revert();
      } else if (event.key === 'Tab' && isOpen()) {
        const [first, second] = inputs();
        if ((event.shiftKey && target === first) || (!event.shiftKey && target === second)) {
          close();
          revert();
        }
      }
    };
    // 焦点离开整个日期范围：没提交的字回到页面给的值（接口约定，三档都是）。面板开着时不算离开——
    // 在面板里点日子，焦点会先离开框（点的是 div），选到一半拉回去就选不成了；面板收起时再拉（onVisibleChange）
    const onFocusout = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;
      if (next && (root.value?.contains(next) || popup()?.contains(next))) return;
      if (!isOpen() && typed()) revert();
    };
    // 两个框的名字（页面给的，三档都补：TDesign 的 RangeInput 不收 aria-label）；
    // 对齐时按 combobox 告诉读屏，aria-expanded 跟着面板
    onMounted(() => sync());
    onUpdated(() => sync());
    function sync() {
      const expanded = String(isOpen());
      inputs().forEach((input, i) =>
        setAttrs(input, {
          'aria-label': props.labels[i],
          ...(controls.value
            ? { role: 'combobox', 'aria-haspopup': 'dialog', 'aria-expanded': expanded }
            : {}),
        }),
      );
    }
    /**
     * 对齐时的面板头：在每个月上面写「2026年10月」，两个月保持相邻（TDesign 两个月各翻各的，
     * 原来的值跨了几个月时还会把开始、结束所在的两个月并排）。左边的月份动了，右边跟着；右边动了，左边跟着
     * ——点那个月藏起来的箭头。
     */
    let last: [number, number] | null = null;
    function syncPanel() {
      const popup = portal.value?.querySelector(`.${uid}`);
      if (!controls.value || !popup) return (last = null);
      const panels = [...popup.querySelectorAll('.t-date-picker__panel-date')];
      if (panels.length !== 2) return;
      const [left, right] = panels.map(panelMonth) as [number | null, number | null];
      if (left === null || right === null) return;
      const step = (panel: Element, dir: 'prev' | 'next', times: number) => {
        for (let i = 0; i < times; i++)
          panel.querySelector<HTMLElement>(`.t-pagination-mini__${dir}`)?.click();
      };
      if (right !== left + 1) {
        if (!last || left !== last[0]) {
          step(panels[1]!, right > left + 1 ? 'prev' : 'next', Math.abs(right - left - 1));
        } else {
          step(panels[0]!, right - 1 > left ? 'next' : 'prev', Math.abs(right - 1 - left));
        }
        return;
      }
      last = [left, right];
      panels.forEach((panel, i) => {
        const header = panel.querySelector('.t-date-picker__header');
        if (!header) return;
        let title = header.querySelector(':scope > .mh-date-title');
        if (!title) {
          title = document.createElement('span');
          title.className = 'mh-date-title';
          header.prepend(title);
        }
        const month = i ? right : left;
        const text = `${Math.floor(month / 12)}年${(month % 12) + 1}月`;
        if (title.textContent !== text) title.textContent = text;
      });
    }
    let observer: MutationObserver | null = null;
    onMounted(() => {
      if (!portal.value) return;
      observer = new MutationObserver(() => {
        syncPanel();
        sync();
      });
      // 面板开关是改 style（display），也要看
      observer.observe(portal.value, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['style'],
      });
    });
    onBeforeUnmount(() => observer?.disconnect());
    return () => {
      const aligned = !!controls.value;
      const swap = aligned && swapsIcons(iconChoice.value);
      const picker = h(TDateRangePicker, {
        value: value.value,
        format: 'YYYY-MM-DD',
        valueType: 'YYYY-MM-DD',
        placeholder: props.placeholder,
        separator: props.separator,
        // 框能打字（键盘选日期的路径），三档都是
        allowInput: true,
        onPick: () => (picks += 1),
        // 只认两种：打字以后回车（TDesign 已经核对过两个都是合法日期、早的在前），这次打开以后点满两天。
        // 点第一天时的「新开始 + 原结束」、没选完就关上的确认、清空（这里没有清空按钮，只有把字删光）都拦下
        onChange: (next: unknown, context?: { trigger?: string }) => {
          const trigger = context?.trigger;
          if (trigger !== 'enter' && !(trigger === 'pick' && picks >= 2)) return;
          picks = 0;
          const [start, end] = (Array.isArray(next) ? next : []) as string[];
          if (!start || !end) return;
          emit('update:modelValue', [start, end]);
          if (aligned && trigger === 'pick') nextTick(() => opener?.focus());
        },
        popupProps: { onVisibleChange, overlayClassName: aligned ? ['mh-date-popup', uid] : uid },
        // TDesign 选了开始以后，比它早的日子都不能点；统一成先后随便点、早的算开始（对齐时）
        ...(aligned ? { cancelRangeSelectLimit: true } : {}),
        ...(swap ? { suffixIcon: () => h(Icon, { name: 'calendar' }) } : {}),
      });
      return h(
        'div',
        {
          ref: root,
          role: 'group',
          'aria-label': props.ariaLabel,
          class: 'mh-tdesign-date-range',
          onKeydownCapture,
          onFocusout,
        },
        [
          // TDesign 在组件创建时读一次图标，换图标要重新创建（key）；嵌套的 ConfigProvider 不继承外层的，弹层挂载点再给一次
          swap
            ? h(
                TConfigProvider,
                {
                  key: 'icons',
                  globalConfig: {
                    attach: { popup: () => portal.value ?? document.body },
                    icon: DATE_ICONS,
                  },
                },
                () => picker,
              )
            : h('div', { key: 'native', style: 'display: contents' }, [picker]),
        ],
      );
    };
  },
});

let dialogCount = 0;

/** 对话框里能用 Tab 走到的元素（按页面上的顺序）。 */
function tabStops(root: Element) {
  return [
    ...root.querySelectorAll<HTMLElement>(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    ),
  ].filter(
    (el) =>
      el.tabIndex >= 0 &&
      !(el as HTMLInputElement).disabled &&
      el.getClientRects().length > 0 &&
      getComputedStyle(el).visibility !== 'hidden',
  );
}

/**
 * 对话框：TDesign 的 Dialog。接口约定（三档都是）：开没开由页面给（visible），按 Esc、点关闭按钮通知页面（close），
 * 点遮罩不关；挂在作用域的挂载点里，不锁 body 的滚动（TDesign 默认往 body 上加 overflow: hidden）。
 * 对齐时（补交互）：TDesign 的对话框没有 role、没有名字，打开时把焦点扔到 body 上、不锁焦点、关上不还焦点，
 * 关闭按钮是一个不能聚焦、没有名字的 span。套件补上 role=dialog、aria-modal、aria-labelledby，
 * 关闭按钮换成 <button>（Tab 顺序最前），打开后焦点进第一个输入框、Tab 在对话框里转圈，
 * 关上以后焦点回到打开它的按钮。Esc 一层一层关 TDesign 自己做了（里面的选择框开着时它拦住这一下）。
 */
const Dialog = defineComponent({
  name: 'TDesignKitDialog',
  props: {
    open: Boolean,
    title: { type: String, required: true },
    closeLabel: { type: String, required: true },
  },
  emits: ['close'],
  setup(props, { emit, slots }) {
    const controls = inject(ControlsKey, ref(null));
    const portal = inject(PortalKey, ref(null));
    const iconChoice = useIconSet();
    const uid = `mh-dialog-${++dialogCount}`;
    const titleId = `${uid}-title`;
    const box = () => portal.value?.querySelector<HTMLElement>(`.${uid}`) ?? null;
    /** 打开前焦点在哪（编辑按钮）：关上以后回到那里。TDesign 打开时会先把它 blur 掉，所以同步记下。 */
    let opener: HTMLElement | null = null;
    watch(
      () => props.open,
      (open, was) => {
        if (open && !was) opener = document.activeElement as HTMLElement | null;
      },
      { flush: 'sync' },
    );
    /** TDesign 的对话框挂上去要晚一拍（先渲染、再搬进挂载点）：等它出来再补属性、放焦点。 */
    const afterShown = (focus: boolean) =>
      nextTick(() =>
        requestAnimationFrame(() => {
          patch();
          const body = box()?.querySelector('.t-dialog__body');
          if (focus && body) tabStops(body)[0]?.focus();
        }),
      );
    watch(
      () => props.open,
      (open) => {
        if (!controls.value) return;
        if (open) afterShown(true);
        else
          nextTick(() => {
            if (opener?.isConnected) opener.focus();
            opener = null;
          });
      },
    );
    function patch() {
      setAttrs(box(), {
        role: controls.value ? 'dialog' : undefined,
        'aria-modal': controls.value ? 'true' : undefined,
        'aria-labelledby': controls.value ? titleId : undefined,
      });
      // 关闭按钮的名字是页面给的，三档都补：原生档 TDesign 的关闭按钮是一个 span，名字只能写在它上面
      if (!controls.value)
        setAttrs(box()?.querySelector('.t-dialog__close'), { 'aria-label': props.closeLabel });
    }
    onMounted(() => afterShown(props.open && !!controls.value));
    onUpdated(() => afterShown(false));
    /** 套件的作用域（这个组件库的那一块页面）：只管发生在这里面的按键和焦点。 */
    const inScope = (node: EventTarget | null) =>
      node === document.body ||
      (node instanceof Node && !!portal.value?.closest('.mh-kit-tdesign')?.contains(node));
    // Tab 在对话框里转圈；焦点在 body 上（点了遮罩以后）按 Tab 也回到对话框里
    const onKeydown = (event: KeyboardEvent) => {
      const el = box();
      if (event.key !== 'Tab' || !controls.value || !props.open || !el) return;
      if (!inScope(event.target)) return;
      const stops = tabStops(el);
      const first = stops[0];
      const lastStop = stops[stops.length - 1];
      if (!first || !lastStop) return;
      const target = event.target as HTMLElement;
      const inside = el.contains(target);
      if (event.shiftKey && (target === first || !inside)) {
        event.preventDefault();
        lastStop.focus();
      } else if (!event.shiftKey && (target === lastStop || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };
    // 焦点落到对话框后面的页面上（页面自己调了 focus 这类）：拉回来
    const onFocusin = (event: FocusEvent) => {
      const el = box();
      if (!controls.value || !props.open || !el) return;
      const target = event.target as Node;
      if (el.contains(target) || target === document.body || !inScope(target)) return;
      // 弹层（对话框里的下拉）也挂在挂载点里，不算外面
      if (portal.value?.contains(target)) return;
      tabStops(el)[0]?.focus();
    };
    onMounted(() => {
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('focusin', onFocusin);
    });
    onBeforeUnmount(() => {
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('focusin', onFocusin);
    });
    return () => {
      const aligned = !!controls.value;
      const swap = aligned && swapsIcons(iconChoice.value);
      return h(
        TDialog,
        {
          visible: props.open,
          header: aligned ? () => h('span', { id: titleId }, props.title) : props.title,
          attach: () => portal.value ?? document.body,
          closeOnOverlayClick: false,
          preventScrollThrough: false,
          dialogClassName: uid,
          onClose: () => emit('close'),
          ...(aligned
            ? {
                placement: 'center',
                width: controls.value?.dialog.width,
                closeBtn: () =>
                  h(
                    'button',
                    { type: 'button', class: 'mh-dialog-close', 'aria-label': props.closeLabel },
                    [swap ? h(Icon, { name: 'x' }) : h(CloseIcon)],
                  ),
              }
            : {}),
        },
        { default: () => slots.default?.(), footer: () => slots.footer?.() },
      );
    };
  },
});

let radioCount = 0;

/**
 * 单选：TDesign 的 RadioGroup。TDesign 每一项都是一个 Tab 停靠点（外层 label tabindex=0），方向键没反应，
 * 外层没有 radiogroup 角色；用 options 时每次渲染都给选项换一个随机的 key（整组重建，焦点丢掉）。
 * 对齐时（补交互）：选项自己写成 Radio（key 固定），焦点还给原生单选框，只有选中的那一项在 Tab 顺序里，
 * ← → ↑ ↓ 换选中（焦点跟过去），外层是 radiogroup、名字用 ariaLabel。
 */
const Radio = defineComponent({
  name: 'TDesignKitRadio',
  props: {
    modelValue: { type: String, required: true },
    options: { type: Array as PropType<Array<{ value: string; label: string }>>, required: true },
    ariaLabel: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const controls = inject(ControlsKey, ref(null));
    const host: Host = ref(null);
    const name = `mh-radio-${++radioCount}`;
    let refocus = false;
    patchAfterRender(host, (root) => {
      if (!controls.value) return;
      setAttrs(root, { role: 'radiogroup', 'aria-label': props.ariaLabel });
      const index = Math.max(
        0,
        props.options.findIndex((option) => option.value === props.modelValue),
      );
      root.querySelectorAll('.t-radio').forEach((label, i) => {
        setAttrs(label, { tabindex: undefined });
        const input = label.querySelector<HTMLInputElement>('input[type=radio]');
        setAttrs(input, { tabindex: i === index ? '0' : '-1' });
        if (refocus && i === index) input?.focus();
      });
      refocus = false;
    });
    const onKeydown = (event: KeyboardEvent) => {
      if (!controls.value) return;
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const count = props.options.length;
      const index = props.options.findIndex((option) => option.value === props.modelValue);
      const next = props.options[(index + step + count) % count]!;
      refocus = true;
      emit('update:modelValue', next.value);
    };
    return () =>
      controls.value
        ? h(
            TRadioGroup,
            {
              ref: host,
              name,
              value: props.modelValue,
              onChange: (value: unknown) => emit('update:modelValue', String(value)),
              onKeydown,
            },
            () =>
              props.options.map((option) =>
                h(TRadio, { key: option.value, value: option.value }, () => option.label),
              ),
          )
        : h(TRadioGroup, {
            ref: host,
            value: props.modelValue,
            options: props.options,
            onChange: (value: unknown) => emit('update:modelValue', String(value)),
          });
  },
});

/**
 * 多行输入：TDesign 的 Textarea。和输入框一样（三档都是）：TDesign 只把认识的属性（name、placeholder……）
 * 交给里面的 <textarea>，其余的（id、rows、aria-*）落在外层 div 上，label 的 for、读屏都找不到它；
 * 渲染完以后转过去。
 */
const Textarea = defineComponent({
  name: 'TDesignKitTextarea',
  inheritAttrs: false,
  props: {
    modelValue: { type: String, required: true },
    name: String,
    placeholder: String,
    rows: Number,
    invalid: Boolean,
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    const controls = inject(ControlsKey, ref(null));
    const host: Host = ref(null);
    const forTextarea = ([key]: [string, unknown]) =>
      key !== 'class' && key !== 'style' && !/^on[A-Z]/.test(key);
    patchAfterRender(host, (root) =>
      setAttrs(root.querySelector('textarea'), {
        ...Object.fromEntries(Object.entries(attrs).filter(forTextarea)),
        rows: props.rows ?? controls.value?.textarea.rows,
        'aria-invalid': props.invalid || undefined,
      }),
    );
    return () =>
      h(TTextarea, {
        ...Object.fromEntries(Object.entries(attrs).filter((entry) => !forTextarea(entry))),
        ref: host,
        value: props.modelValue,
        name: props.name,
        placeholder: props.placeholder,
        status: props.invalid ? 'error' : 'default',
        onChange: (value: string | number) => emit('update:modelValue', String(value)),
      });
  },
});

export const tdesignKit: VueKit = {
  id: 'tdesign',
  name: 'TDesign',
  Provider,
  Button,
  Input,
  Checkbox,
  Tabs,
  Select,
  Switch,
  NavMenu,
  Breadcrumb,
  Dropdown,
  Avatar,
  Badge,
  // 部件地图：用户看得见的那个框是 TDesign 的哪个元素（自动检查按这里找，不影响组件本身）
  Table,
  Pagination,
  Tag,
  DateRange,
  Dialog,
  Radio,
  Textarea,
  parts: {
    // 选择框、日期范围的框里面也是 .t-input，输入框外框要排除它
    field: '.t-input:not(.t-select .t-input, .t-range-input .t-input)',
    select: '.t-select .t-input',
    checkbox: '.t-checkbox__input',
    button: '.t-button:not(.t-button--variant-text)',
    // 接上规范时 TDesign 的指示条（.t-tabs__bar）藏起来，由套件在选中的标签下面画（见 styles.css）
    tabIndicator: { selector: '.t-tabs__nav-item.t-is-active', pseudo: '::after' },
    // .t-popup 只负责定位，看得见的（底色、阴影、圆角）是里面的 .t-popup__content
    popup: '.t-select__dropdown .t-popup__content',
    option: '.t-select-option',
    switch: '.t-switch',
    switchThumb: '.t-switch__handle',
    // 菜单项：叶子是 li.t-menu__item，子菜单标题是 li.t-submenu 里面的 div.t-menu__item，
    // 收起后弹层里的项也是 .t-menu__item
    menuItem: '.t-menu__item',
    // 收起后的子菜单弹层：.t-popup 只负责定位，看得见的是里面的 .t-popup__content（带 .t-menu__popup）
    menuPopup: '.t-menu__popup',
    breadcrumbLink: '.t-breadcrumb__item a.t-link',
    // 下拉菜单：.t-dropdown 就是弹层里看得见的那个框（.t-popup__content）
    dropdown: '.t-popup__content.t-dropdown',
    dropdownItem: '.t-dropdown__item',
    avatar: '.t-avatar',
    badge: '.t-badge > sup',
    // 文字提示：.t-popup（带 .t-tooltip）只负责定位，有底色的是里面的 .t-popup__content；
    // 小箭头（.t-popup__arrow）在它里面、绝对定位伸到框外，不算框的大小
    tooltip: '.t-tooltip > .t-popup__content',
    tableHead: '.t-table thead > tr > th',
    tableCell: '.t-table tbody > tr > td',
    // 对齐时表头里是套件自己的排序按钮；原生是 TDesign 的两个小箭头
    tableSort: ':is(.mh-table-sort, .t-table__cell--sort-trigger)',
    tag: '.t-tag',
    pageItem: ':is(.t-pagination__number, .t-pagination__btn-prev, .t-pagination__btn-next)',
    dateRange: '.t-range-input',
    datePopup: '.t-date-range-picker__panel-container .t-popup__content',
    dateCell: '.t-date-picker__cell-inner',
    dialog: '.t-dialog',
    radio: '.t-radio__input',
    textarea: '.t-textarea__inner',
  },
  profile: {
    framework: 'vue',
    site: 'https://tdesign.tencent.com/vue-next',
    tags: [
      { zh: 'Less 样式表', en: 'Compiled Less' },
      { zh: 'CSS 变量', en: 'CSS variables' },
    ],
    styling: {
      zh: 'Less 编译出的一份样式表，几乎所有取值都走 CSS 变量（--td-*），类名固定前缀 t-、没有随机后缀。变量在 :root 上就组合好了（--td-brand-color 是 var(--td-brand-color-7)），外层只改底层色板不起作用。默认入口的每个组件会自己把样式插进页面，lib/ 这一份不带样式。',
      en: 'One stylesheet compiled from Less; almost every value is a CSS variable (--td-*), with a fixed t- prefix and no hashed class names. Variables are composed on :root (--td-brand-color is var(--td-brand-color-7)), so overriding the base palette on a wrapper has no effect. The default entry injects each component’s CSS itself; the lib/ build ships none.',
    },
    theming: {
      zh: '运行时在外层容器上覆盖 CSS 变量；要直接改组合好的那一层（--td-brand-color、-hover、-focus、-active、-disabled、-light），浅色、深色几档要自己算。官方主题生成器出一整套 10 档色板。动效时长写死 0.2s，没有变量。ConfigProvider 只管文案、弹层挂载点、图标这类全局配置，不管颜色尺寸。',
      en: 'Override CSS variables on a wrapper at runtime, at the composed level (--td-brand-color, -hover, -focus, -active, -disabled, -light); the light and dark steps must be computed. The official generator emits a 10-step palette. Motion is hard-coded at 0.2s. ConfigProvider covers copy, popup containers and icons, not colors or sizes.',
    },
    sizing: {
      zh: 'small / medium / large 三档，24 / 32 / 40px，来自 --td-comp-size-xs / m / xl，能改成任意高度；但大号控件的字号跟着变成 16px，大号按钮左右留白 24px；输入框文字离边框 9px（大号 13px）；标签栏一项 48px 高；开关 20px 高、宽是高 ÷ 0.618。',
      en: 'small / medium / large at 24 / 32 / 40px from --td-comp-size-xs / m / xl, any height possible; but large controls switch to 16px text and large buttons to 24px padding; input text sits 9px in (13px large); a tab is 48px tall; the switch is 20px tall and height ÷ 0.618 wide.',
    },
    look: {
      zh: '主色 #0052D9，圆角 3px，复选框 16px；标签栏指示条 3px、选中字用 0.3px 文字阴影加粗，未选中的标签悬停有灰底；输入框悬停描边变主色，聚焦 2px 浅主色外圈；下拉离选择框 8px、圆角 6px，选中项主色字加浅主色底；开关开的时候圆点从 12px 变成 15px；按钮字重 400，点击有水波纹。',
      en: 'Primary #0052D9, 3px radius, 16px checkbox; a 3px tab indicator with a 0.3px text-shadow for the active label and a gray hover fill; inputs turn primary on hover with a 2px light ring on focus; dropdowns sit 8px below with 6px corners, selected options are primary on a light fill; the switch thumb grows from 12px to 15px when on; weight-400 buttons with a ripple.',
    },
    icons: {
      zh: '图标在 tdesign-icons-vue-next 里（tdesign-vue-next 自己依赖它），每个图标一个 Vue 组件。ConfigProvider 的 globalConfig.icon 能按名字全局替换组件内置的图标（BrowseIcon、BrowseOffIcon……）；选择框的 suffixIcon、按钮的 loadingProps.indicator 能单个换；选择框箭头是会转动的 SVG；复选框的对勾是 CSS 画的旋转边框。',
      en: 'Icons live in tdesign-icons-vue-next (a dependency of tdesign-vue-next), one Vue component each. ConfigProvider’s globalConfig.icon replaces built-in icons by name (BrowseIcon, BrowseOffIcon…); suffixIcon on Select and loadingProps.indicator on Button replace one at a time; the select arrow is a rotating SVG; the checkbox check is a rotated CSS border.',
    },
    accessibility: {
      zh: '组件里几乎不写 ARIA（用到的这些组件里只有按钮加载时的 aria-disabled、复选框组的 role=group）。现成的：按钮是 <button>，输入框、选择框里是原生 <input>，选择框能用 ↑ ↓、Esc（收着时回车不打开，要先按 ↓），复选框能用空格、回车；对话框的 Esc 会先让给里面开着的选择框。缺口：开关、标签栏是普通 div，没有角色、Tab 进不去、按键没反应；导航菜单是没有 role、tabindex 的 ul / li，收起后菜单项的文字 display: none，悬停出来的文字提示也没有 role、不和菜单项关联，读屏读不到名字；下拉菜单只认鼠标，项没有角色；复选框的焦点落在外层 <label> 上；选择框的只读输入框不是 combobox；输入框的 aria-* 落在外层 div；密码显隐是不能聚焦、没有名字的 SVG；面包屑外层是 div，链接 outline: none；徽标数字没有 aria-hidden。套件在对齐那一档补上角色、Tab 焦点、按键和控件规格的 3px 聚焦外圈；输入框转属性、选择框补 combobox 这两处三档都做（接口给的 aria-label 要落到真正的输入框上）。表格：排序箭头是只认鼠标的 span，外层 div 却是 tabindex=0（Tab 会停在一个没名字的 div 上）；分页的页码、上一页、下一页是没有 role 的 li / div，键盘翻不了页。日期范围：两个框没有名字（只有占位文字）、默认只读不能打字，回车打不开面板，Esc 收不起来，日子是没有角色的 div。表格加载中只用白色遮罩挡鼠标，键盘还能 Tab 进去。页面给的名字（勾选框、页码、上一页下一页、日期框、关闭按钮）三档都补，原生档只能写在 TDesign 的元素上。对话框：没有 role、aria-modal、名字，关闭按钮是不能聚焦、没有名字的 span，打开时把焦点扔到 body、不锁焦点、关上不还焦点。单选：每一项都是 Tab 停靠点、方向键没反应、没有 radiogroup，用 options 时每次渲染都重建整组（按空格选中以后焦点丢掉）。多行输入：id、aria-* 落在外层 div，label 的 for 找不到它。',
      en: 'Almost no ARIA in the components (among those used here, only aria-disabled on a loading button and role=group on checkbox groups). Built in: buttons are <button>, inputs and selects wrap a native <input>, the select handles ↑ ↓ and Esc (Enter does not open it until ↓ highlights an option), the checkbox handles Space and Enter; the dialog’s Esc yields to an open select inside it. Gaps: switch and tabs are plain divs with no roles, no Tab focus and no keys; the nav menu is ul / li without roles or tabindex, collapsed labels are display: none and the hover tooltip has no role and no link to the item, so items have no accessible name; the dropdown menu is mouse-only with role-less items; checkbox focus lands on the outer <label>; the select’s read-only input is not a combobox; aria-* on Input lands on the wrapper div; the password toggle is an unfocusable, unnamed SVG; the breadcrumb wrapper is a div and links set outline: none; the badge count lacks aria-hidden. The kit adds roles, Tab focus, keys and the spec’s 3px focus ring in the aligned mode; forwarding Input attributes and the select’s combobox role happen in every mode (the interface’s aria-label must reach the real input). Table: sort carets are mouse-only spans while the wrapper div is tabindex=0 (an unnamed tab stop); pagination items and prev / next are role-less lis / divs, so the keyboard cannot page. Date range: the two boxes are unnamed (placeholders only) and read-only by default, Enter does not open the panel, Esc does not close it, and days are role-less divs. A loading table only blocks the mouse with a veil; Tab still gets in. Page-given names (checkboxes, page numbers, prev / next, date boxes, close button) are set in every mode, on TDesign’s own elements in the native mode. Dialog: no role, aria-modal or name; the close button is an unfocusable, unnamed span; opening blurs focus to body, focus is not trapped or restored. Radio: every item is a tab stop, arrows do nothing, no radiogroup, and with options every render rebuilds the group (focus is lost after Space). Textarea: id and aria-* land on the wrapper div, so label for= misses it.',
    },
    setup: [
      {
        zh: '组件从 tdesign-vue-next/lib 引入（不带样式），自己引入 tdesign-vue-next/dist/tdesign.css 并放进单独的层；默认入口会把样式直接插进页面。',
        en: 'Import components from tdesign-vue-next/lib (no styles) and import tdesign-vue-next/dist/tdesign.css into its own layer; the default entry injects styles itself.',
      },
      {
        zh: '图标包 tdesign-icons-vue-next 的默认入口也会自己插一份不在层里的图标样式（.t-icon { width: 1em }），把菜单图标压成 14px；构建配置里把它指到不带样式的 tdesign-icons-vue-next/lib/index.js（见 examples/vite.config.ts），基础样式 tdesign.css 里已经有了。',
        en: 'The icon package’s default entry also injects an unlayered icon style (.t-icon { width: 1em }) that shrinks menu icons to 14px; alias tdesign-icons-vue-next to its style-free lib/index.js in the bundler (see examples/vite.config.ts); tdesign.css already has the base icon styles.',
      },
      {
        zh: '弹层默认挂到 body，拿不到外层容器上的 CSS 变量；用 ConfigProvider 的 globalConfig.attach 挂进作用域。',
        en: 'Popups attach to body and miss wrapper CSS variables; use ConfigProvider’s globalConfig.attach.',
      },
    ],
  },
  adaptations: [
    adapt(
      'button',
      'color',
      [
        '不会从主色推算悬停、聚焦、按下、禁用、浅底这几档（官方用主题生成器出一整套 10 档色板）',
        'Does not derive hover, focus, active, disabled and light steps (the official generator emits a 10-step palette)',
      ],
      [
        '映射层直接写组合好的那一层（--td-brand-color、-hover……），悬停取规范的悬停色，其余按比例混白、混黑',
        'The mapping writes the composed level (--td-brand-color, -hover…): hover from the spec, the rest mixed with white or black',
      ],
      'theme-token',
    ),
    adapt(
      'text',
      'type',
      [
        '大号控件（按钮、输入框、选择框、下拉选项）字号跟着变成 16px',
        'Large controls (buttons, inputs, selects, options) switch to 16px text',
      ],
      ['两档都是规范的正文字号', 'The spec body size for both sizes'],
      'style-override',
    ),
    adapt(
      'button',
      'size',
      [
        '左右内边距默认 15px、大号 23px（不含 1px 边框）',
        'Padding is 15px, 23px when large (plus a 1px border)',
      ],
      [
        '文字离外边框取控件规格：默认 16px、大号 20px',
        'Text inset from the spec: 16px default, 20px large',
      ],
      'style-override',
    ),
    adapt(
      'button',
      'size',
      [
        '按钮文字框是一整行高；字号是奇数（15px）时，文字比别的组件库低半个像素',
        'The label box is a full line tall; at odd sizes (15px) text sits half a pixel lower',
      ],
      ['文字只占一个字高，由按钮上下居中', 'The label is one em tall, centered by the button'],
      'style-override',
    ),
    adapt(
      'button',
      'size',
      [
        '只给紧跟在 svg 后面的文字留 8px，图标是别的元素时没有间距',
        'Only text right after an svg gets 8px; other icon elements get no gap',
      ],
      ['图标和文字间距都取控件规格的 8px', 'The 8px icon gap from the spec in all cases'],
      'style-override',
    ),
    adapt(
      'button',
      'type',
      ['按钮字重 400', 'Buttons are weight 400'],
      ['500', '500'],
      'style-override',
    ),
    adapt(
      'button',
      'state',
      [
        '次要按钮悬停时描边和字都变成主色悬停色',
        'Secondary hover turns the border and text to the primary hover color',
      ],
      ['浅灰底，字变深，描边不变', 'Light gray fill, darker text, same border'],
      'style-override',
    ),
    adapt(
      'button',
      'state',
      ['加载时换成浅主色底', 'Loading switches to a light primary fill'],
      [
        '底色不变，整个按钮按控件规格降低不透明度',
        'Same fill; the whole button fades to the spec’s loading opacity',
      ],
      'style-override',
    ),
    adapt(
      'button',
      'icon',
      ['加载图标是 TDesign 自己的渐变圆环', 'The loading icon is TDesign’s gradient ring'],
      [
        '规范图标集里的加载图标（loadingProps.indicator）',
        'The spec’s loading icon (loadingProps.indicator)',
      ],
      'prop',
    ),
    adapt(
      'link',
      'size',
      [
        '文字按钮和普通按钮一样高（默认 32px），左右 15px 内边距',
        'Text buttons are as tall as buttons (32px by default) with 15px padding',
      ],
      ['只占一行文字高', 'Takes one line of text'],
      'style-override',
    ),
    adapt(
      'link',
      'color',
      ['用主色，悬停加灰底', 'Primary color with a gray hover fill'],
      ['用链接色，悬停只变色', 'The link color; hover only recolors'],
      'style-override',
    ),
    adapt(
      'field',
      'size',
      [
        '文字离边框 9px（8px 内边距加 1px 边框），大号 13px',
        'Text sits 9px from the edge (8px padding plus the border), 13px when large',
      ],
      ['两档都是 12px', '12px in both sizes'],
      'style-override',
    ),
    adapt(
      'field',
      'state',
      ['聚焦外圈 2px', 'A 2px focus ring'],
      ['控件规格的 3px 外圈', 'The 3px ring from the spec'],
      'style-override',
    ),
    adapt(
      'field',
      'a11y',
      [
        '只把认识的属性（name、placeholder……）交给里面的 <input>，aria-label、aria-describedby、inputmode 落在外层 div 上，读屏读不到输入框的名字',
        'Only known attributes reach the inner <input>; aria-label, aria-describedby and inputmode land on the wrapper div, so screen readers miss the name',
      ],
      [
        '套件渲染完以后把它们转给 <input>（三档都做：接口给的属性要落在对的元素上）',
        'The kit moves them onto the <input> after rendering (in every mode: interface attributes must land on the right element)',
      ],
      'behavior',
    ),
    adapt(
      'field',
      'a11y',
      [
        '密码显隐是一个不能用 Tab 键聚焦、没有名字的 SVG（BrowseOffIcon / BrowseIcon）',
        'The password toggle is an unfocusable, unnamed SVG (BrowseOffIcon / BrowseIcon)',
      ],
      [
        '用 TDesign 的全局替换图标（globalConfig.icon）换成能聚焦、有名字的按钮，图标来自规范图标集；切换仍由 TDesign 做',
        'TDesign’s global icon override (globalConfig.icon) swaps in a focusable, named button with the spec’s icons; TDesign still toggles',
      ],
      'behavior',
    ),
    adapt(
      'select',
      'type',
      [
        '已选的值写在一个只读输入框的 value 里',
        'The selected value is the value of a read-only input',
      ],
      [
        '显示成文字（valueDisplay），和其他组件库一样',
        'Shown as text (valueDisplay), like the other libraries',
      ],
      'prop',
    ),
    adapt(
      'select',
      'a11y',
      [
        '里面的只读输入框没有 combobox 角色，aria-label 也落不到它身上（↑ ↓、Esc 本来就能用）',
        'The inner read-only input has no combobox role and never gets the aria-label (↑ ↓ and Esc already work)',
      ],
      [
        '补上 role=combobox、aria-expanded 和名字（三档都做）',
        'Adds role=combobox, aria-expanded and the name (in every mode)',
      ],
      'behavior',
    ),
    adapt(
      'select',
      'icon',
      [
        '下拉箭头是 TDesign 自己的 SVG，占位文字的颜色',
        'The arrow is TDesign’s own SVG in the placeholder color',
      ],
      [
        '规范图标集里的下拉箭头（suffixIcon），辅助图标色',
        'The spec’s arrow (suffixIcon) in the secondary icon color',
      ],
      'prop',
    ),
    adapt(
      'popup',
      'size',
      [
        '下拉离选择框 8px，内边距 6px（大号 8px），相邻选项之间 2px',
        'The dropdown sits 8px below, 6px padding (8px large), 2px between options',
      ],
      [
        '离选择框 4px，内边距 4px，选项之间不留空',
        '4px below, 4px padding, no gap between options',
      ],
      'style-override',
    ),
    adapt(
      'popup',
      'shape',
      [
        '圆角 6px，用 0.5px 的内阴影画描边，外面三层阴影',
        '6px corners, a 0.5px inset-shadow outline and a three-layer shadow',
      ],
      ['控件规格的圆角、1px 描边和阴影', 'Corners, a 1px border and the shadow from the spec'],
      'style-override',
    ),
    adapt(
      'popup',
      'color',
      [
        '选项 28px 高（大号 36px）、左右 8px（大号 12px），选中是主色字加浅主色底',
        'Options are 28px (36px large) with 8px padding (12px large); selected is primary text on a light fill',
      ],
      [
        '32px、左右 12px，选中浅底加粗',
        '32px, 12px padding, light fill and medium weight when selected',
      ],
      'style-override',
    ),
    adapt(
      'checkbox',
      'shape',
      [
        '圆角跟着全局圆角走（规范是 6px 时复选框也是 6px）',
        'The corner follows the global radius (6px when the spec says 6px)',
      ],
      ['最多 4px（控件规格）', 'At most 4px (from the spec)'],
      'style-override',
    ),
    adapt(
      'checkbox',
      'icon',
      ['对勾是旋转的 2px 边框', 'The check is a rotated 2px border'],
      [
        '规范图标集里的对勾，用 CSS 遮罩画',
        'The check from the spec’s icon set, drawn as a CSS mask',
      ],
      'style-override',
    ),
    adapt(
      'checkbox',
      'a11y',
      [
        '键盘焦点落在外层的 <label>（tabindex=0），里面的原生复选框 tabindex=-1，读屏读到的是一段文字',
        'Focus lands on the outer <label> (tabindex=0) while the native checkbox is tabindex=-1, so screen readers hear plain text',
      ],
      ['焦点还给原生复选框', 'Focus goes back to the native checkbox'],
      'behavior',
    ),
    adapt(
      'tabs',
      'size',
      [
        '一项 48px 高；标签之间靠各 8px 的内边距和外边距隔开',
        'Each tab is 48px tall; tabs are spaced by 8px padding plus 8px margin',
      ],
      ['高度取规范，间距 32px', 'Spec height, 32px gaps'],
      'style-override',
    ),
    adapt(
      'tabs',
      'shape',
      [
        '指示条 3px、带圆角，宽度按整项算（比文字宽 32px），由 JS 按前面各项的宽度之和写成行内样式',
        'A 3px rounded indicator as wide as the whole item (32px wider than the text), positioned by JS as an inline style',
      ],
      [
        '藏起 TDesign 的指示条，套件在选中的标签下面画 2px、和文字一样宽',
        'TDesign’s indicator is hidden; the kit draws a 2px bar as wide as the label',
      ],
      'style-override',
    ),
    adapt(
      'tabs',
      'type',
      [
        '选中的字用 0.3px 文字阴影加粗；未选中的悬停有灰底',
        'The active label is bolded with a 0.3px text shadow; inactive tabs get a gray hover fill',
      ],
      ['未选中 400、选中 500；悬停只变色', '400 inactive, 500 active; hover only recolors'],
      'style-override',
    ),
    adapt(
      'tabs',
      'a11y',
      [
        '标签是普通 div：没有 role、不能用 Tab 键聚焦、没有方向键',
        'Tabs are plain divs: no roles, no Tab focus, no arrow keys',
      ],
      [
        '补上 tablist / tab / aria-selected，只有选中的标签在 Tab 顺序里，← → 移动焦点并切换',
        'Adds tablist / tab / aria-selected; only the active tab is a Tab stop and arrows move and switch',
      ],
      'behavior',
    ),
    adapt(
      'switch',
      'size',
      [
        '20px 高、宽是高 ÷ 0.618（32.4px）；圆点 12px 离边 4px，开的时候变成 15px 离边 2.5px',
        '20px tall and height ÷ 0.618 wide (32.4px); a 12px thumb 4px in that grows to 15px, 2.5px in, when on',
      ],
      [
        '44×22、圆点 18 离边 2px，开关时大小不变',
        '44×22, an 18px thumb 2px in, same size on and off',
      ],
      'style-override',
    ),
    adapt(
      'switch',
      'shape',
      [
        '圆点是 ::before 画的白圆，三层大阴影在外层',
        'The thumb is a white ::before circle with a three-layer shadow on its parent',
      ],
      ['圆点自己带底色，阴影取控件规格', 'The thumb carries its own fill and the spec shadow'],
      'style-override',
    ),
    adapt(
      'switch',
      'state',
      [
        '关是灰色（主题里没有对应的角色）；悬停开、关都变色；禁用换成两种更浅的颜色、去掉圆点阴影',
        'Off is a gray with no matching role; hover recolors both states; disabled switches to two lighter colors and drops the thumb shadow',
      ],
      [
        '关是控件边框色；悬停不变；禁用时整个 50% 不透明度、颜色和阴影不变',
        'Off uses the control border color; no hover change; disabled fades to 50% keeping colors and shadow',
      ],
      'style-override',
    ),
    adapt(
      'switch',
      'a11y',
      [
        '开关是普通 div：没有 role=switch、不能用 Tab 键聚焦、空格回车没反应，也没有聚焦样式',
        'The switch is a plain div: no role=switch, no Tab focus, no Space / Enter, no focus style',
      ],
      [
        '补上 role、aria-checked、Tab 焦点和空格 / 回车切换，聚焦是控件规格的 3px 外圈',
        'Adds the role, aria-checked, Tab focus, Space / Enter toggling and the spec’s 3px focus ring',
      ],
      'behavior',
    ),
    adapt(
      'nav',
      'size',
      [
        '菜单自己定宽：展开 232px、收起 64px（行内样式），比 220px 的侧栏宽 12px',
        'The menu sets its own width inline: 232px expanded, 64px collapsed, 12px wider than the 220px sider',
      ],
      [
        '宽度属性给 100%，跟着侧栏（宽度归页面布局）',
        'The width prop is 100%, following the sider (layout owns width)',
      ],
      'prop',
    ),
    adapt(
      'nav',
      'size',
      [
        '白底；四周留白上下 16px、左右 8px；一项 216×36、相邻隔 4px；文字离左边 16px、子菜单里的项 44px；图标 20px、和文字隔 8px；圆角 3px',
        'White fill; 16px / 8px padding; 216×36 items 4px apart; text 16px in, 44px for submenu items; 20px icons 8px from the text; 3px corners',
      ],
      [
        '不加底色；留白 8px；204×36、隔 2px；图标 16px 离左边 12px、和文字隔 10px，子菜单里的项文字和上一级的文字对齐（38px）；圆角取控件规格',
        'No fill; 8px padding; 204×36 items 2px apart; a 16px icon 12px in and 10px from the text, submenu text aligned with its parent (38px); spec corners',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'color',
      [
        '没选中的字和图标是次要色（rgba(0,0,0,.6)），悬停浅灰底、字不变；选中是浅主色底加主色字、字重 400；子菜单里有选中项时标题是深色字（rgba(0,0,0,.9)）',
        'Unselected text and icons are secondary (rgba(0,0,0,.6)); hover adds a light gray fill only; selected is primary on a light primary fill at weight 400; a submenu title with a selected child turns dark (rgba(0,0,0,.9))',
      ],
      [
        '字取正文色、图标取次要色；悬停浅灰底、字变深、图标不变；选中浅底加选中色、字重 500，悬停不变；有选中子项的标题字和图标取父级选中色、不加底色',
        'Body text with secondary icons; hover adds the fill and darkens text only; selected uses the spec fill and color at weight 500, unchanged on hover; a parent of the selection takes the parent-selected color with no fill',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'icon',
      [
        '子菜单箭头是 TDesign 自己画的 FakeArrow（一条折线，展开时改路径朝上），16px、和文字同色，离右边 10px，没有图标位',
        'The submenu arrow is TDesign’s own FakeArrow (a path that flips when open), 16px in the text color, 10px from the right, with no icon slot',
      ],
      [
        '规范图标集的 chevron-down 放进子菜单标题里，辅助图标色，离右边 12px，展开时转 180°；FakeArrow 藏起来',
        'The spec’s chevron-down goes into the submenu title in the secondary icon color, 12px from the right, rotating 180° when open; FakeArrow is hidden',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'state',
      [
        '收起后每项 48×36、左右 14px；宽度和内边距有 0.28s 的过渡',
        'Collapsed items are 48×36 with 14px padding; width and padding animate over 0.28s',
      ],
      [
        '图标居中、不留内边距；没有宽度、内边距过渡',
        'Centered icons with no padding; no width or padding transition',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'a11y',
      [
        '收起后菜单项的文字是 display: none，读屏也读不到；悬停出来的文字提示没有 role、不和菜单项关联，只在悬停时才有——收起后的菜单项没有名字',
        'Collapsed labels are display: none, hidden from screen readers too; the hover tooltip has no role, is not linked to the item and only exists while hovered, so collapsed items have no name',
      ],
      [
        '文字只在视觉上藏起来（裁成 1px），读屏照样读到名字；文字提示只给鼠标用户看，不另外关联（名字菜单项自己已经有了）',
        'Labels are only visually hidden (clipped to 1px), so screen readers still get the name; the tooltip is for mouse users and stays unlinked (the item already has its name)',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'shape',
      [
        '收起后没有子菜单的一级项悬停 250ms 出文字提示（菜单项自己包的 Tooltip，没有属性入口）：深灰底 #242424、白字 14/22、上下 4 左右 8、圆角 6px（不跟全局圆角）、0.5px 灰色内阴影描边，左边一个 8px 的小箭头；离菜单项右边 16px（离侧栏右边缘 7px），上下居中；移开 150ms 后 0.2s 淡出',
        'Collapsed top-level items without a submenu show a tooltip 250ms after hover (a Tooltip the item wraps itself in, with no props exposed): #242424 fill, white 14/22 text, 4/8 padding, 6px corners (not the global radius), a 0.5px gray inset outline and an 8px arrow on the left; 16px right of the item (7px off the sider edge), vertically centered; it fades out over 0.2s 150ms after leaving',
      ],
      [
        '取控件规格的文字提示：底色、字色、12/20 字重 400、左右 8 上下 4、控件圆角，没有小箭头、描边和阴影；左边离侧栏右边缘 popup.offset，上下居中；延时还是 TDesign 的',
        'The spec tooltip: fill, text color, 12/20 at weight 400, 8/4 padding, control radius, no arrow, outline or shadow; popup.offset off the sider edge, vertically centered; TDesign’s own delays',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'state',
      [
        '收起后鼠标移进子菜单约 50ms 弹出、移开 100ms 关上，TDesign 用 expanded 记「哪个弹层开着」，弹出、关上都会触发 onExpand',
        'Collapsed submenus pop out about 50ms after hover and close 100ms after leaving; TDesign tracks the open flyout in expanded and fires onExpand for it',
      ],
      [
        '收起时不把 onExpand 转给页面：弹层开没开归组件库，页面的展开状态不变',
        'onExpand is not forwarded while collapsed: the flyout is the library’s business and the page’s open submenus stay as they are',
      ],
      'behavior',
    ),
    adapt(
      'nav',
      'shape',
      [
        '收起后的弹层离菜单项右边 2px、顶边对齐，最小宽 160px，圆角 6px、没有描边、三层阴影，内边距 6px；项 28px 高、左右 16px、相邻隔 2px，选中是浅主色底加深色字',
        'The flyout sits 2px right of the item, top-aligned, at least 160px wide, with 6px corners, no border, a three-layer shadow and 6px padding; options are 28px with 16px padding, 2px apart, selected on a light primary fill with dark text',
      ],
      [
        '左边离侧栏右边缘 popup.offset、顶边对齐；外框、内边距、阴影、选项高度和选中样式取下拉（popup）一组，最小宽取控件规格',
        'popup.offset from the sider edge, top-aligned; frame, padding, shadow, option height and selected style from the popup group, min width from the spec',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'a11y',
      [
        '菜单是没有 role、没有 tabindex 的 ul / li / div：不能用 Tab 键聚焦，回车空格没反应，读屏不知道是菜单；收起后的子菜单只认鼠标',
        'The menu is plain ul / li / div with no roles or tabindex: no Tab focus, no Enter / Space, nothing for screen readers; collapsed submenus are mouse-only',
      ],
      [
        '补上 menu / menuitem、aria-current、aria-expanded，每个看得见的项都在 Tab 顺序里，回车空格选中或展开、收起，聚焦是控件规格的 3px 外圈；收起后在子菜单图标上按回车空格打开弹层、焦点进到第一项，Esc 关上',
        'Adds menu / menuitem, aria-current and aria-expanded; every visible item is a Tab stop, Enter / Space select or toggle, and focus shows the spec’s 3px ring; collapsed, Enter / Space open the flyout with focus on its first item and Esc closes it',
      ],
      'behavior',
    ),
    adapt(
      'breadcrumb',
      'icon',
      [
        '用 ChevronRight 图标（16px、占位文字色）隔开，左右各 4px',
        'Separated by a ChevronRight icon (16px, placeholder color) with 4px on each side',
      ],
      [
        '分隔符属性给控件规格的文字「/」，分隔符色，左右各 separatorGap',
        'The separator prop takes the spec’s “/” in the separator color, separatorGap on each side',
      ],
      'prop',
    ),
    adapt(
      'breadcrumb',
      'color',
      [
        '上级和中间不能点的项都是占位文字色（rgba(0,0,0,.4)），悬停（连不能点的）变主色；当前页深色；文字行高写死 22px',
        'Ancestors, clickable or not, use the placeholder color (rgba(0,0,0,.4)) and all turn primary on hover; the current page is dark; line height is fixed at 22px',
      ],
      [
        '上级次要灰，只有能点的悬停变深；当前页强调色、字重取控件规格；行高取规范',
        'Secondary gray, with only links darkening on hover; the current page in the strong color and spec weight; line height from the spec',
      ],
      'style-override',
    ),
    adapt(
      'breadcrumb',
      'state',
      [
        '链接点了（或按回车）直接改 window.location（href）',
        'Links set window.location (href) on click or Enter',
      ],
      [
        '给 TDesign 一个 router（push 时通知页面，不真的跳转）',
        'A router object is passed so TDesign calls push, which notifies the page instead of navigating',
      ],
      'prop',
    ),
    adapt(
      'breadcrumb',
      'a11y',
      [
        '外层是普通 div，没有导航角色、当前页没有 aria-current；链接写了 outline: none，键盘聚焦时看不出来，也没有圆角',
        'The wrapper is a plain div with no navigation role and no aria-current; links set outline: none, so keyboard focus is invisible, and have square corners',
      ],
      [
        '补上 navigation 角色和 aria-current；聚焦是控件规格的圆角和 3px 外圈',
        'Adds the navigation role and aria-current; focus uses the spec corners and 3px ring',
      ],
      'behavior',
    ),
    adapt(
      'dropdown',
      'size',
      [
        '离按钮 8px，内边距 6px；项 28px 高（上下 3px 加一行）、左右 8px、相邻隔 2px，每项行内写死最宽 100px，弹层没有最小宽',
        '8px below the trigger with 6px padding; options are 28px (3px plus a line) with 8px padding, 2px apart, each capped inline at 100px wide, and no minimum width',
      ],
      [
        '离按钮 popup.offset，内边距、项高、左右留白取下拉（popup）一组，项之间不留空，最小宽取控件规格，项和弹层一样宽（maxColumnWidth）',
        'popup.offset below; padding, option height and inset from the popup group with no gaps; spec min width; options as wide as the menu (maxColumnWidth)',
      ],
      'style-override',
    ),
    adapt(
      'dropdown',
      'shape',
      [
        '圆角 6px、0.5px 描边、三层阴影；分隔线左右各缩进 8px、上 4px 下 2px',
        '6px corners, a 0.5px border and a three-layer shadow; dividers are inset 8px with 4px above and 2px below',
      ],
      [
        '控件规格的圆角、1px 描边和阴影；分隔线横跨整个内宽（盖住左右内边距），上下各 popup.padding',
        'Spec corners, a 1px border and the shadow; dividers span the full inner width (over the padding) with popup.padding above and below',
      ],
      'style-override',
    ),
    adapt(
      'dropdown',
      'color',
      [
        '图标和文字同色（深色），危险项整个是错误色；悬停浅灰底',
        'Icons share the dark text color, danger items are fully the error color; hover adds a light gray fill',
      ],
      [
        '文字取正文色、图标取次要色、和文字隔 8px，危险项文字和图标取危险色；悬停或键盘高亮取下拉的悬停底色',
        'Body text with secondary icons 8px from the text, danger text and icon in the danger color; hover or keyboard highlight uses the popup hover fill',
      ],
      'style-override',
    ),
    adapt(
      'dropdown',
      'a11y',
      [
        '只认鼠标：项是没有 role、tabindex 的 li，没有方向键；回车打开后焦点留在按钮上；Esc 收不起来',
        'Mouse-only: options are li without roles or tabindex, there are no arrow keys, focus stays on the trigger after Enter opens it, and Esc does not close it',
      ],
      [
        '开没开由套件记着（popupProps.visible）；补上 menu / menuitem，回车、空格、↓ 打开并聚焦第一项，↑ ↓ 移动，回车选中，Esc 收起，收起后焦点回到按钮',
        'The kit holds the open state (popupProps.visible); adds menu / menuitem; Enter, Space or ↓ open with focus on the first option, ↑ ↓ move, Enter selects, Esc closes and focus returns to the trigger',
      ],
      'behavior',
    ),
    adapt(
      'avatar',
      'size',
      [
        '32px（默认控件高度），浅主色底（brand-color-focus）、主色字 16px、字重 400',
        '32px (the default control height), a light primary fill (brand-color-focus), 16px primary text at weight 400',
      ],
      [
        '控件规格的 28px、底色、字色、12px、字重 500',
        'The spec’s 28px, fill, text color, 12px and weight 500',
      ],
      'style-override',
    ),
    adapt(
      'badge',
      'size',
      [
        '20px 高、左右 6px、最小宽 8px（不含内边距）、圆角 10px、12px 字重 400；外层是一整行高（22px）的块，数字对准的是这一行的右上角，比图标的右上角高 4.4px',
        '20px tall with 6px padding, an 8px min width (content-box), 10px corners, 12px text at weight 400; the wrapper is a full 22px line, so the count centers on the line’s corner, 4.4px above the icon’s',
      ],
      [
        '控件规格的 16px 高、最小宽 16px、左右 4px、字重 500；外层只包住图标，中心对准图标的右上角',
        'The spec’s 16px height, 16px min width, 4px inset and weight 500; the wrapper hugs the icon so the count centers on its corner',
      ],
      'style-override',
    ),
    adapt(
      'badge',
      'a11y',
      ['数字是普通的 sup，读屏会读到', 'The count is a plain sup that screen readers announce'],
      [
        '加上 aria-hidden（数字写在按钮的名字里）',
        'aria-hidden (the count is in the button’s name)',
      ],
      'behavior',
    ),
    adapt(
      'table',
      'size',
      [
        '格子上下 12、左右 16 的内边距：表头 46.5 高，行 57 高（这一页格子里有 32 高的按钮），勾选列 64 宽',
        '12px vertical and 16px horizontal cell padding: a 46.5px header, 57px rows (the page puts 32px buttons in cells), a 64px selection column',
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
        '表头白底、14px 400 的占位灰字（40% 黑）；格子的底色继承行（白）；悬停的行不变色（hover 默认关），勾选的行也不变色；最后一行下面也有线',
        'White header with 14px/400 placeholder text (40% black); cells inherit the white row fill; no hover fill (hover is off by default) and no fill for selected rows; the last row keeps its rule',
      ],
      [
        '表头浅底、12px 500 的次要灰字；悬停、勾选的行换底色（画在格子上）；最后一行下面不画线',
        'Light header with 12px/500 secondary text; hover and selected fills painted on the cells; no rule under the last row',
      ],
      'style-override',
    ),
    adapt(
      'table',
      'keyboard',
      [
        '排序：文字右边上下两个 16px 的小箭头（span，不能 Tab），点上箭头升序、点下箭头降序、再点一次取消，悬停有文字提示',
        'Sorting: two stacked 16px carets after the label (spans, not tabbable); the up caret sorts ascending, the down caret descending, a second click clears; hover tooltips',
      ],
      [
        '表头里一个按钮：文字 + 图标集的排序图标（隔 4），th 上写 aria-sort；对齐时不用 TDesign 的 sorter',
        'A button in the header: label + sort icon from the icon set (4px gap), aria-sort on the th; TDesign’s sorter is not used when aligned',
      ],
      'behavior',
    ),
    adapt(
      'table',
      'keyboard',
      [
        '整个表格的外层 div 是 tabindex=0（聚焦后 ↑ ↓ 悬停行、空格勾选、Esc 清空勾选、A 全选），Tab 先停在一个没有名字的 div 上；勾选框的焦点在外层 label 上、没有名字；<table> 没有 aria-label',
        'The table wrapper is tabindex=0 (once focused, ↑ ↓ move a row hover, Space selects, Esc clears, A selects all), so Tab stops on an unnamed div; checkbox focus sits on an unnamed label; no aria-label on <table>',
      ],
      [
        '外层不再能聚焦、关掉键盘悬停行；勾选框的焦点还给原生复选框；勾选框的名字用 selectLabel / selectAllLabel、<table> 补上 aria-label（名字三档都补）',
        'The wrapper is no longer focusable and row hover keys are off; focus goes to the native checkboxes; checkboxes are named by selectLabel / selectAllLabel and <table> gets aria-label (names in every mode)',
      ],
      'behavior',
    ),
    adapt(
      'table',
      'state',
      [
        '加载中：表格不变浅，盖一层 60% 的白，中间是 TDesign 的渐变圆环（约 20px、主色）；<table> 上没有 aria-busy',
        'Loading: no fade but a 60% white veil, with TDesign’s ~20px gradient ring in primary; no aria-busy on <table>',
      ],
      [
        '表头和行一起变浅（50%）、不盖白，图标集的加载图标（20px、主色）在表格正中；补上 aria-busy',
        'Header and rows fade to 50% with no veil; the icon-set spinner (20px, primary) dead centre; aria-busy added',
      ],
      'style-override',
    ),
    adapt(
      'table',
      'state',
      [
        '加载中：白色遮罩挡住了鼠标，键盘还能 Tab 进表格里的勾选框、开关、按钮，按空格照样能勾选',
        'Loading: the veil blocks the mouse, but Tab still reaches checkboxes, switches and buttons inside, and Space still toggles them',
      ],
      [
        '整个表格设成 inert，鼠标、键盘都不能操作（接口约定，三档都是）',
        'The whole table is inert to mouse and keyboard (interface contract, every mode)',
      ],
      'prop',
    ),
    adapt(
      'table',
      'shape',
      [
        '没有行：格子里是一个至少 120 高、内容居中的框，字是禁用灰（26% 黑），页面给的空状态跟着变灰',
        'No rows: the cell holds a 120px-min centred box in disabled grey (26% black), which greys out the page’s empty state',
      ],
      [
        '格子不留白、悬停不变色，内容的颜色和排布由页面给',
        'The cell has no padding or hover fill; the page’s content keeps its own colours and layout',
      ],
      'style-override',
    ),
    adapt(
      'table',
      'icon',
      [
        '部分选中：主色底上一道 CSS 画的 8×2 白色短横；没有行时表头的复选框禁用，底色 #eee',
        'Indeterminate: an 8×2 white CSS bar on primary; with no rows the header checkbox is disabled on #eee',
      ],
      [
        '短横换成图标集的 minus；禁用的底色取控件规格',
        'The bar becomes the icon-set minus; the disabled fill comes from the spec',
      ],
      'style-override',
    ),
    adapt(
      'checkbox',
      'state',
      [
        '键盘聚焦：外层 label 上一圈 2px 主色轮廓线，离开 4px，连同文字一起框住',
        'Keyboard focus: a 2px primary outline on the label, 4px out, around box and text',
      ],
      ['方块上控件规格的外圈（3px 浅主色）', 'The spec ring (3px light primary) on the box'],
      'style-override',
    ),
    adapt(
      'pagination',
      'color',
      [
        '页码是带 1px 灰描边（#ddd）的 32 方块、圆角 3，当前页主色实底白字（400），悬停描边和字变主色、按下变主色实底；「共 N 条」紧挨着上一页（0 距离），60% 黑',
        'Page numbers are 32px squares with a 1px #ddd border and 3px corners; the current page is solid primary with white 400 text; hover turns border and text primary, press fills primary; the total sits flush against prev (0 gap) in 60% black',
      ],
      [
        '没有描边、悬停浅灰底；当前页主色描边加主色字（500）；「共 N 条」离第一项 16、次要灰',
        'No border, light grey hover; the current page has a primary border and primary 500 text; the total sits 16px away in secondary grey',
      ],
      'style-override',
    ),
    adapt(
      'pagination',
      'keyboard',
      [
        '页码是 li、上一页下一页是 div，没有角色、不在 Tab 顺序里，键盘翻不了页；当前页、到头的上一页下一页只靠颜色区分',
        'Page numbers are lis and prev / next are divs with no role and no tab stop, so paging is mouse-only; the current page and disabled ends differ only by colour',
      ],
      [
        '补 role=button、tabindex、aria-current，回车、空格翻页；到头了 aria-disabled、不在 Tab 顺序里。名字三档都补：页码用 pageLabel（「第 2 页」），上一页、下一页用 prevLabel / nextLabel',
        'Adds role=button, tabindex and aria-current; Enter and Space page; disabled ends get aria-disabled and leave the tab order. Names in every mode: pageLabel for page numbers, prevLabel / nextLabel for the arrows',
      ],
      'behavior',
    ),
    adapt(
      'pagination',
      'icon',
      ['上一页、下一页是 TDesign 的 chevron', 'Prev / next use TDesign’s chevrons'],
      [
        '图标集的 chevron-left / chevron-right（只在分页外面套一层 ConfigProvider 按名字换，不影响别的组件）',
        'Icon-set chevron-left / chevron-right, swapped by name in a ConfigProvider around the pagination only',
      ],
      'prop',
    ),
    adapt(
      'tag',
      'color',
      [
        '默认深色实底白字（variant: dark，成功是 #2ba471 底）',
        'Solid fill with white text by default (variant: dark; success is #2ba471)',
      ],
      [
        '浅底（variant: light），四种色调的底色和字色取控件规格',
        'Light variant, with fills and text colours for the four tones from the spec',
      ],
      'style-override',
    ),
    adapt(
      'tag',
      'size',
      [
        '24 高、左右 8、12px 400、1px 透明描边；文字上有悬停提示（title）',
        '24px tall, 8px padding, 12px/400, a 1px transparent border; a hover tooltip (title) on the text',
      ],
      [
        '20 高、左右 6、500，没有描边；去掉悬停提示',
        '20px, 6px padding, 500, no border; no tooltip',
      ],
      'style-override',
    ),
    adapt(
      'select',
      'keyboard',
      [
        '收着的时候回车不打开：要先按 ↓ 让一项高亮，回车才打开',
        'Enter does nothing while closed: an option must be highlighted with ↓ first',
      ],
      ['回车、空格直接打开', 'Enter and Space open it directly'],
      'behavior',
    ),
    adapt(
      'dateRange',
      'shape',
      [
        '外框 32 高、左右 8 的内边距；两个框各是一块圆角 3 的底，聚焦的那个是灰底（#e8e8e8），框之间 8、分隔文字是正文色；聚焦 2px 外圈',
        '32px tall with 8px padding; each box is its own 3px-radius pill, the focused one grey (#e8e8e8), 8px apart with a body-coloured separator; a 2px focus ring',
      ],
      [
        '和输入框一样的一个框（左右 field.inset）；两个框没有底色，分隔文字左右各 8、占位灰；聚焦和面板开着时 3px 外圈',
        'One box like an input (field.inset padding); the inner boxes have no fill, the separator sits 8px either side in placeholder grey; a 3px ring while focused or open',
      ],
      'style-override',
    ),
    adapt(
      'dateRange',
      'icon',
      ['TDesign 自己的日历图标和翻月份的箭头', 'TDesign’s own calendar icon and month arrows'],
      [
        '图标集的 calendar（suffixIcon）、chevron-left / chevron-right（日期范围外面套一层 ConfigProvider 按名字换）',
        'Icon-set calendar (suffixIcon) and chevron-left / chevron-right, swapped by name in a ConfigProvider around the picker',
      ],
      'prop',
    ),
    adapt(
      'dateRange',
      'keyboard',
      [
        '框默认只读、不能打字；只有点击才打开，回车不打开；Esc 不收起（弹层只认点在外面）；Tab 离开时面板还开着',
        'The boxes are read-only by default; opens on click only, not Enter; Esc does not close it (the popup only closes on an outside click); the panel stays open when Tab leaves',
      ],
      [
        '框能打字（allowInput，三档）。对齐时：没打过字的回车打开 / 收起面板、不提交表单，打过字的回车交给 TDesign 提交、照常提交表单；Esc 收起面板、退回打的字，焦点留在框上；Tab 离开时收起；选完两天焦点回到打开它的框',
        'The boxes accept typing (allowInput, every mode). When aligned: Enter without typing opens / closes the panel without submitting; Enter after typing lets TDesign commit and submits the form; Esc closes and reverts typing, keeping focus; Tab out closes the panel; after two picks focus returns to the box that opened it',
      ],
      'behavior',
    ),
    adapt(
      'dateRange',
      'a11y',
      [
        '两个框没有名字（RangeInput 不收 aria-label，只有占位文字）；日子是没有角色的 div',
        'The two boxes have no names (RangeInput drops aria-label; only placeholders); days are role-less divs',
      ],
      [
        '两个框的名字用 labels、外层 role=group 加 aria-label（三档都有）；对齐时两个框按 combobox 告诉读屏（aria-haspopup="dialog"、aria-expanded 跟着面板）',
        'The boxes are named by labels and the wrapper is role=group with aria-label (every mode); when aligned the boxes are comboboxes (aria-haspopup="dialog", aria-expanded follows the panel)',
      ],
      'behavior',
    ),
    adapt(
      'dateRange',
      'state',
      [
        '原来有值时点第一天就把「新的开始 + 原来的结束」发出去，没选完就关上还会把这一半确认掉；选了开始以后比它早的日子不能点',
        'With a value, the first pick already emits “new start + old end”, and closing mid-way commits that half; days before the start become unclickable',
      ],
      [
        '只在点满两天、或打完字回车（两个都合法）以后通知页面，其余的拦下、框里的字拉回页面给的值；焦点离开整个日期范围、面板收起时没提交的字也拉回去（接口约定，三档都是）；对齐时先后随便点、早的算开始（cancelRangeSelectLimit）',
        'Only the second pick or Enter after typing two valid dates notifies the page; the rest is dropped and the boxes snap back, also when focus leaves the range or the panel closes (interface contract, every mode); when aligned either order works and the earlier day becomes the start (cancelRangeSelectLimit)',
      ],
      'behavior',
    ),
    adapt(
      'dateRange',
      'size',
      [
        '面板：每个月 280 宽、四周 12 的留白，离框 8；日子是 36×30 格子里一个 24 的方块（字重 500）；星期一行 22 高、上下再各空 4、14px',
        'Panel: 280px per month with 12px padding, 8px below the box; each day is a 24px square in a 36×30 cell (weight 500); the weekday row is 22px plus 4px gaps above and below, 14px',
      ],
      [
        '外框取 popup 一组、离框 4；两个月隔 24；日子 32 的方块紧挨着；星期一行 32、12px 次要灰',
        'Frame from the popup group, 4px below; months 24px apart; 32px day squares edge to edge; a 32px weekday row in 12px secondary grey',
      ],
      'style-override',
    ),
    adapt(
      'dateRange',
      'color',
      [
        '选中的范围是格子 ::before 上一条 24 高的浅主色带；今天是浅主色底加主色字',
        'The range is a 24px light-primary band on each cell’s ::before; today is light primary with primary text',
      ],
      [
        '范围的浅底画在方块上连成一条，开始、结束主色底白字，今天 1px 主色描边',
        'The range fill sits on the squares as one strip, start and end are primary with white text, today has a 1px primary border',
      ],
      'style-override',
    ),
    adapt(
      'dateRange',
      'shape',
      [
        '面板头是年、月两个下拉加「上一月、今天、下一月」三个按钮，两个月各翻各的；原来的值跨了几个月时，并排的是开始和结束所在的两个月（不相邻）',
        'Each header has year and month selects plus prev / today / next buttons, and the two months page independently; a value spanning months shows the start and end months side by side (not adjacent)',
      ],
      [
        '标题写「2026年10月」，左边月份只留往前的箭头、右边只留往后的，两个月一起翻、始终相邻（套件写标题、点藏起来的箭头把另一边带过去）',
        'A “2026年10月” caption, a back arrow on the left month and a forward arrow on the right; both months page together and stay adjacent (the kit writes the caption and clicks the hidden arrow on the other side)',
      ],
      'behavior',
    ),
    adapt(
      'dialog',
      'size',
      [
        '480 宽、离窗口顶部 20vh、四周 32 的留白、1px 描边、没有投影；内容上下各 16 的留白',
        '480px wide, 20vh from the top, 32px padding, a 1px border and no shadow; 16px above and below the body',
      ],
      [
        '520 宽、在窗口正中、四周 24、没有描边、控件规格的投影；标题到内容 20、内容到底部按钮 24',
        '520px, centred, 24px padding, no border, the spec shadow; 20px from title to body, 24px from body to footer',
      ],
      'style-override',
    ),
    adapt(
      'dialog',
      'color',
      [
        '遮罩 60% 的黑；内容区是次要灰（60% 黑），表单里没写颜色的字跟着变灰；标题用 TDesign 自己的字体栈；底部相邻两个按钮之间多 8',
        'A 60% black mask; the body is secondary grey (60% black), greying any form text without its own colour; the title uses TDesign’s own font stack; 8px extra between footer buttons',
      ],
      [
        '遮罩 45%；内容用页面的颜色，标题用规范的字体，按钮之间的距离归页面',
        'A 45% mask; the body keeps the page colours, the title uses the spec font, button spacing belongs to the page',
      ],
      'style-override',
    ),
    adapt(
      'dialog',
      'a11y',
      [
        '对话框没有 role、aria-modal、名字；关闭按钮是不能聚焦、没有名字的 20px span；打开时把焦点 blur 到 body、不锁焦点（Tab 会走到后面的页面），关上不还焦点',
        'No role, aria-modal or name; the close button is an unfocusable, unnamed 20px span; opening blurs focus to body, focus is not trapped (Tab reaches the page behind) and is not restored on close',
      ],
      [
        '补 role=dialog、aria-modal、aria-labelledby；关闭按钮换成有名字的 <button>（32 的方块、Tab 顺序最前）；打开后焦点进第一个输入框、Tab 在对话框里转圈，关上以后焦点回到打开它的按钮。关闭按钮的名字三档都补（原生档写在 TDesign 的 span 上）',
        'Adds role=dialog, aria-modal and aria-labelledby; the close button becomes a named 32px <button> first in tab order; focus moves to the first input, Tab cycles inside, and focus returns to the opener on close. The close name is set in every mode (on TDesign’s span in the native mode)',
      ],
      'behavior',
    ),
    adapt(
      'dialog',
      'state',
      [
        '点遮罩就关；打开时往 body 上加 overflow: hidden（整页不能滚）；挂到 body',
        'Clicking the mask closes it; opening adds overflow: hidden to body; it mounts on body',
      ],
      [
        '点遮罩不关、不锁 body、挂进作用域的挂载点（接口约定，三档都是）',
        'The mask does not close it, body is not locked, and it mounts in the scoped container (interface contract, every mode)',
      ],
      'prop',
    ),
    adapt(
      'radio',
      'shape',
      [
        '选中是主色描边加 8 的主色圆点（白底），悬停描边变主色；两项之间靠每项右边 24 的外边距（最后一项也有）；圆圈和文字两个 inline-block，一行比行高多 1.5px',
        'Checked is a primary ring with an 8px primary dot on white, hover turns the ring primary; items are spaced by a 24px right margin (the last one too); circle and label are inline-blocks, 1.5px taller than a line',
      ],
      [
        '选中是主色底加 6 的白点，悬停不变；两项之间 optionGap；圆圈和文字排成一行 flex',
        'Checked is a primary fill with a 6px white dot, no hover change; optionGap between items; circle and label in one flex row',
      ],
      'style-override',
    ),
    adapt(
      'radio',
      'a11y',
      [
        '每一项都是 Tab 停靠点（外层 label tabindex=0，原生单选框 tabindex=-1、name 是空的），方向键没反应，外层没有 radiogroup；用 options 时每次渲染都给选项换随机 key，按空格选中以后整组重建、焦点丢到 body',
        'Every item is a tab stop (label tabindex=0, native radio tabindex=-1 with an empty name), arrows do nothing and there is no radiogroup; with options every render uses random keys, so Space rebuilds the group and focus drops to body',
      ],
      [
        '选项自己写成 Radio（key 固定）；只有选中的那一项在 Tab 顺序里、焦点在原生单选框上，← → ↑ ↓ 换选中、焦点跟过去；外层 role=radiogroup 加名字',
        'Items are rendered as Radio with stable keys; only the checked one is a tab stop, focus sits on the native radio, arrows change the selection and focus follows; the wrapper is a named radiogroup',
      ],
      'behavior',
    ),
    adapt(
      'radio',
      'state',
      [
        '键盘聚焦：外层 label 上一圈 2px 主色轮廓线，离开 4px，连同文字一起框住',
        'Keyboard focus: a 2px primary outline on the label, 4px out, around circle and text',
      ],
      ['圆圈上控件规格的外圈（3px 浅主色）', 'The spec ring (3px light primary) on the circle'],
      'style-override',
    ),
    adapt(
      'textarea',
      'size',
      [
        '固定 56 高（不看行数）、上下 5 左右 8 的内边距',
        'A fixed 56px height (rows ignored), 5px / 8px padding',
      ],
      [
        '行数决定高度（3 行），上下 insetBlock、左右 field.inset（都含 1px 描边），只能往下拖',
        'Height from rows (3), insetBlock / field.inset padding including the 1px border, vertical resize only',
      ],
      'style-override',
    ),
    adapt(
      'textarea',
      'state',
      ['悬停描边变主色，聚焦 2px 外圈', 'Hover turns the border primary; a 2px focus ring'],
      [
        '悬停不变，聚焦 3px 外圈；出错描边取控件规格',
        'No hover change, a 3px ring; the invalid border from the spec',
      ],
      'style-override',
    ),
    adapt(
      'textarea',
      'a11y',
      [
        '只把认识的属性（name、placeholder……）交给 <textarea>，id、rows、aria-* 落在外层 div 上：label 的 for 找不到它，读屏读不到出错提示',
        'Only known attributes reach the <textarea>; id, rows and aria-* land on the wrapper div, so label for= misses it and the error description is lost',
      ],
      [
        '渲染完以后转给 <textarea>（三档都做：接口给的属性要落在对的元素上）',
        'Moved onto the <textarea> after rendering (in every mode)',
      ],
      'behavior',
    ),
  ],
};
