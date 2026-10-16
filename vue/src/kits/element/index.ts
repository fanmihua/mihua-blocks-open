import {
  Text,
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
  toRaw,
  useId,
  watch,
  withDirectives,
  type Component,
  type ComponentPublicInstance,
  type InjectionKey,
  type PropType,
  type Ref,
  type VNode,
} from 'vue';
import {
  ElAvatar,
  ElBadge,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElButton,
  ElCheckbox,
  ElConfigProvider,
  ElDatePicker,
  ElDialog,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElIcon,
  ElInput,
  ElMenu,
  ElMenuItem,
  ElOption,
  ElSelect,
  ElSubMenu,
  ElPagination,
  ElRadio,
  ElRadioGroup,
  ElSwitch,
  ElTabPane,
  ElTable,
  ElTableColumn,
  ElTabs,
  ElTooltip,
  ElTag,
  ID_INJECTION_KEY,
  vLoading,
} from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import en from 'element-plus/es/locale/lang/en';
// 日期面板按 dayjs 的语言决定一周从哪天开始：中文（周一开头）要先注册 dayjs 的 zh-cn
import 'dayjs/locale/zh-cn';
import { Hide, Sort, SortDown, SortUp, View } from '@element-plus/icons-vue';
import {
  adapt,
  badgeText,
  nextSort,
  resolveControls,
  swapsIcons,
  roleMapping,
  shade,
  themeMappingValues,
  tint,
  type BreadcrumbItem,
  type ControlSpec,
  type DropdownItem,
  type IconName,
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
 * 语义 token → Element Plus 的 CSS 变量。
 * Element 自己不会从主色推算浅色梯度（light-3 … light-9），这些梯度用在悬停、选中背景和禁用态上，
 * 所以映射层要替它算好；悬停用的 light-3 直接取规范里的「主操作悬停」。
 */
/** 主色派生梯度与独立悬停色分别记录，避免把相同值当成同一来源。 */
export function elementRoleMappings(t: ResolvedTokens) {
  return {
    '--el-color-primary': roleMapping(t, 'action.primary', '直接作为组件库的主操作色。'),
    '--el-color-primary-light-3': roleMapping(
      t,
      'action.primaryHover',
      '由独立的主操作悬停角色赋值。',
    ),
    '--el-color-primary-light-5': roleMapping(
      t,
      'action.primary',
      '混白 50%，用于组件库浅色状态。',
      (v) => tint(v, 0.5),
    ),
    '--el-color-primary-light-7': roleMapping(
      t,
      'action.primary',
      '混白 70%，用于组件库浅色状态。',
      (v) => tint(v, 0.7),
    ),
    '--el-color-primary-light-8': roleMapping(
      t,
      'action.primary',
      '混白 80%，用于组件库浅色状态。',
      (v) => tint(v, 0.8),
    ),
    '--el-color-primary-light-9': roleMapping(
      t,
      'action.primary',
      '混白 90%，用于组件库浅色状态。',
      (v) => tint(v, 0.9),
    ),
    '--el-color-primary-dark-2': roleMapping(
      t,
      'action.primary',
      '混黑 20%，用于组件库深色状态。',
      (v) => shade(v, 0.2),
    ),
    '--el-border-radius-base': roleMapping(t, 'radius.control', '保留 px，赋给组件库的基础圆角。'),
    '--el-border-radius-small': roleMapping(t, 'radius.control', '保留 px，赋给组件库的小号圆角。'),
  };
}

export function elementVariables(t: ResolvedTokens): Record<string, string> {
  const ramp = (name: string, color: string, hover = tint(color, 0.3)) => ({
    [`--el-color-${name}`]: color,
    [`--el-color-${name}-light-3`]: hover,
    [`--el-color-${name}-light-5`]: tint(color, 0.5),
    [`--el-color-${name}-light-7`]: tint(color, 0.7),
    [`--el-color-${name}-light-8`]: tint(color, 0.8),
    [`--el-color-${name}-light-9`]: tint(color, 0.9),
    [`--el-color-${name}-dark-2`]: shade(color, 0.2),
  });
  return {
    ...themeMappingValues(elementRoleMappings(t)),
    ...ramp('danger', t['feedback.danger']),
    ...ramp('error', t['feedback.danger']),
    ...ramp('success', t['feedback.success']),
    ...ramp('warning', t['feedback.warning']),
    '--el-color-white': t['action.onPrimary'],
    '--el-text-color-primary': t['text.strong'],
    '--el-text-color-regular': t['text.body'],
    '--el-text-color-secondary': t['text.secondary'],
    '--el-text-color-placeholder': t['text.placeholder'],
    '--el-text-color-disabled': t['text.disabled'],
    '--el-border-color': t['border.control'],
    '--el-border-color-hover': shade(t['border.control'], 0.2),
    '--el-border-color-light': t['border.default'],
    '--el-border-color-lighter': t['border.default'],
    '--el-fill-color-blank': t['surface.base'],
    '--el-fill-color-light': t['surface.subtle'],
    '--el-bg-color': t['surface.base'],
    '--el-bg-color-overlay': t['surface.base'],
    '--el-component-size': t['size.control'],
    '--el-component-size-large': t['size.controlLarge'],
    '--el-font-size-base': t['type.body'],
    '--el-font-family': t['font.sans'],
    '--el-transition-duration': t['motion.duration'],
    // 菜单的变量 Element 声明在 :root 上，在那里就按 Element 默认的主色、文字色算好了，
    // 外层改 --el-color-primary 够不着：照它的写法在这里重新声明一遍，才跟着规范走
    '--el-menu-active-color': 'var(--el-color-primary)',
    '--el-menu-text-color': 'var(--el-text-color-primary)',
    '--el-menu-hover-text-color': 'var(--el-color-primary)',
    '--el-menu-bg-color': 'var(--el-fill-color-blank)',
    '--el-menu-hover-bg-color': 'var(--el-color-primary-light-9)',
    '--el-menu-item-hover-fill': 'var(--el-color-primary-light-9)',
    '--el-menu-border-color': 'var(--el-border-color)',
  };
}

/** Element 通过组件级 CSS 变量表达错误态（通常由 el-form-item 设置），这里在没有表单时直接给输入框。 */
const invalidInput = {
  '--el-input-border-color': 'var(--el-color-danger)',
  '--el-input-hover-border-color': 'var(--el-color-danger)',
  '--el-input-focus-border-color': 'var(--el-color-danger)',
};

const size = (value?: string) => (value === 'large' ? 'large' : 'default');

/** 接上规范时是控件规格（控件对齐到统一设计）；原生模式为 null，保留 Element 自己的样子。 */
const ControlsKey: InjectionKey<Ref<ControlSpec | null>> = Symbol('mh-element-controls');
/** 下拉菜单的挂载点：在套件作用域内（拿得到 CSS 变量），并抵消祖先的缩放。 */
const PortalKey: InjectionKey<Ref<HTMLElement | null>> = Symbol('mh-element-portal');

/**
 * 页面可能用 CSS zoom 把整个组件缩小显示。React 那边的弹层挂载点会抵消缩放、按 1:1 显示，
 * Element 的下拉也挂到同样处理过的节点上，四个组件库的下拉大小一致。
 */
function cancelAncestorZoom(portal: HTMLElement) {
  const parent = portal.parentElement as (HTMLElement & { currentCSSZoom?: number }) | null;
  const zoom = parent?.currentCSSZoom ?? 1;
  portal.style.zoom = Math.abs(zoom - 1) > 0.001 ? String(1 / zoom) : '';
}

const Provider = defineComponent({
  name: 'ElementKitProvider',
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
    const locale = useLocale();
    provide(ControlsKey, controls);
    provide(PortalKey, portal);
    onMounted(() => portal.value && cancelAncestorZoom(portal.value));
    return () =>
      h(
        'div',
        {
          // --aligned：styles.css 里按统一设计调整高度、标签栏、复选框和下拉（见那里的说明）
          // --icons：规范选了一套图标（icon.set 不是 native）时，换掉 Element 用 CSS 画的对勾
          class: [
            'mh-kit-element',
            aligned.value && 'mh-kit-element--aligned',
            aligned.value && swapsIcons(props.tokens?.['icon.set']) && 'mh-kit-element--icons',
          ],
          style: props.tokens ? elementVariables(props.tokens) : undefined,
          // 打开下拉之前再量一次：外层的缩放可能在挂载之后才变
          onPointerdownCapture: () => portal.value && cancelAncestorZoom(portal.value),
        },
        [
          // Element 的文字（日期面板的月份、星期，读屏用的按钮名字）跟着页面的语言走：接进项目时配语言包
          h(ElConfigProvider, { locale: locale.value === 'zh' ? zhCn : en }, () =>
            slots.default?.(),
          ),
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

/** 接上规范时塞进 Element 图标位的图标（下拉箭头、加载）：来自规范的图标集，不用 Element 自带的。 */
const SelectArrow = markRaw(
  defineComponent({
    name: 'MihuaSelectArrow',
    setup: () => () => h(Icon, { name: 'chevron-down', class: 'mh-select-arrow' }),
  }),
);
const Spinner = markRaw(
  defineComponent({
    name: 'MihuaSpinner',
    setup: () => () => h(Icon, { name: 'loading', spin: true, class: 'mh-btn-spinner' }),
  }),
);

const Button = defineComponent({
  name: 'ElementKitButton',
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
        ElButton,
        {
          // 加载图标用规范图标集里的那一个（Element 默认是自己的 Loading）
          ...(controls.value && swapsIcons(iconChoice.value) ? { loadingIcon: Spinner } : {}),
          type: props.variant === 'primary' || props.variant === 'link' ? 'primary' : undefined,
          link: props.variant === 'link',
          text: props.variant === 'text',
          size: size(props.size),
          loading: props.loading,
          disabled: props.disabled,
          nativeType: props.type,
          'aria-label': props.ariaLabel,
          style: props.block ? { width: '100%' } : undefined,
          onClick: () => emit('click'),
        },
        { default: () => trimText(slots.default?.()), ...(slots.icon ? { icon: slots.icon } : {}) },
      );
  },
});

const Input = defineComponent({
  name: 'ElementKitInput',
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
    const controls = inject(ControlsKey, ref(null));
    const locale = useLocale();
    const iconChoice = useIconSet();
    const visible = ref(false);
    return () => {
      const password = props.type === 'password';
      // 统一设计：密码框右侧的显隐按钮一直显示，图标来自规范的图标集。
      // Element 自带的切换只在输入了内容之后才出现，所以接上规范时由套件自己画（和 React 三个套件的 PasswordToggle 相同）。
      const ownToggle = controls.value !== null && password;
      const zh = locale.value === 'zh';
      const toggle = () =>
        h(
          'button',
          {
            type: 'button',
            class: 'mh-eye',
            'aria-label': visible.value
              ? zh
                ? '隐藏密码'
                : 'Hide password'
              : zh
                ? '显示密码'
                : 'Show password',
            // 点按钮时不让输入框失去焦点
            onMousedown: (event: MouseEvent) => event.preventDefault(),
            onClick: () => (visible.value = !visible.value),
          },
          [
            swapsIcons(iconChoice.value)
              ? h(Icon, { name: visible.value ? 'eye' : 'eye-off' })
              : // 规范写 icon.set: native 时用 Element 自己的眼睛图标
                h(ElIcon, null, () => h(visible.value ? View : Hide)),
          ],
        );
      return h(
        ElInput,
        {
          ...attrs,
          modelValue: props.modelValue,
          'onUpdate:modelValue': (value: string) => emit('update:modelValue', value),
          type: ownToggle ? (visible.value ? 'text' : 'password') : props.type,
          showPassword: password && !ownToggle,
          size: size(props.size),
          ariaLabel: props.ariaLabel,
          'aria-invalid': props.invalid || undefined,
          style: props.invalid ? invalidInput : undefined,
        },
        ownToggle ? { suffix: toggle } : slots.suffix ? { suffix: slots.suffix } : undefined,
      );
    };
  },
});

const Checkbox = defineComponent({
  name: 'ElementKitCheckbox',
  props: { modelValue: { type: Boolean, required: true }, invalid: Boolean },
  emits: ['update:modelValue'],
  setup(props, { slots, emit, attrs }) {
    return () =>
      h(
        ElCheckbox,
        {
          ...attrs,
          modelValue: props.modelValue,
          'onUpdate:modelValue': (value: unknown) => emit('update:modelValue', value === true),
          'aria-invalid': props.invalid || undefined,
          style: props.invalid
            ? { '--el-checkbox-input-border': '1px solid var(--el-color-danger)' }
            : undefined,
        },
        slots,
      );
  },
});

const Tabs = defineComponent({
  name: 'ElementKitTabs',
  props: {
    modelValue: { type: String, required: true },
    items: { type: Array as PropType<Array<{ value: string; label: string }>>, required: true },
    ariaLabel: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // Element 用 pane name 构造 DOM ID；同页多个套件需要独立命名空间。
    // 对外的值仍是 phone/account，前缀只存在于组件库这一侧。
    const prefix = useId();
    const paneName = (value: string) => `${prefix}-${value}`;
    return () =>
      h(
        ElTabs,
        {
          class: 'mh-kit-element-tabs',
          modelValue: paneName(props.modelValue),
          'onUpdate:modelValue': (value: string | number) => {
            const item = props.items.find((entry) => paneName(entry.value) === String(value));
            if (item) emit('update:modelValue', item.value);
          },
          'aria-label': props.ariaLabel,
        },
        () =>
          props.items.map((item) =>
            h(ElTabPane, { key: item.value, name: paneName(item.value), label: item.label }),
          ),
      );
  },
});

const Select = defineComponent({
  name: 'ElementKitSelect',
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
    const portal = inject(PortalKey, ref(null));
    const iconChoice = useIconSet();
    return () =>
      h(
        ElSelect,
        {
          modelValue: props.modelValue,
          'onUpdate:modelValue': (value: string) => emit('update:modelValue', value),
          size: size(props.size),
          // 下拉菜单渲染在组件作用域内的挂载点，才能拿到同一套 CSS 变量。
          ...(portal.value ? { teleported: true, appendTo: portal.value } : { teleported: false }),
          // 统一设计：下拉离输入框的距离取控件规格，没有小箭头（Element 默认 12px 加箭头）。
          // 下拉箭头用规范图标集里的那一个。
          ...(controls.value
            ? {
                offset: controls.value.popup.offset,
                showArrow: false,
                ...(swapsIcons(iconChoice.value) ? { suffixIcon: SelectArrow } : {}),
              }
            : {}),
          ariaLabel: props.ariaLabel,
          style: props.width ? { width: `${props.width}px` } : undefined,
        },
        {
          default: () =>
            props.options.map((option) =>
              h(ElOption, { key: option.value, value: option.value, label: option.label }),
            ),
          ...(props.display
            ? { label: ({ value }: { value: string }) => props.display!(value) }
            : {}),
        },
      );
  },
});

const Switch = defineComponent({
  name: 'ElementKitSwitch',
  props: {
    modelValue: { type: Boolean, required: true },
    disabled: Boolean,
    ariaLabel: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h(ElSwitch, {
        modelValue: props.modelValue,
        'onUpdate:modelValue': (value: string | number | boolean) =>
          emit('update:modelValue', value === true),
        disabled: props.disabled,
        ariaLabel: props.ariaLabel,
      });
  },
});

/**
 * Element 的弹层（ElTooltip）按 ID 找挂载容器：#el-popper-container-<前缀>，前缀来自 ID_INJECTION_KEY，
 * 找不到就在 body 下面新建一个。ElSubMenu 没有 append-to 属性，收起后的子菜单弹层只能这样请进作用域：
 * 在这个控件里换一个前缀，在套件的挂载点（.mh-portal）里放一个同名的容器。
 * 容器要在 Element 的弹层挂载之前就在页面上，所以挂载点准备好之前先不渲染控件（晚一帧）。
 */
function useScopedPopperContainer() {
  const portal = inject(PortalKey, null);
  const prefix = `mh${useId().replace(/[^\w-]/g, '')}`;
  provide(ID_INJECTION_KEY, { prefix: prefix as unknown as number, current: 0 });
  const ready = ref(!portal);
  const container = ref<HTMLElement | null>(null);
  if (portal)
    watch(
      portal,
      (host) => {
        if (container.value || !host) return;
        const div = document.createElement('div');
        div.id = `el-popper-container-${prefix}`;
        host.appendChild(div);
        container.value = div;
        ready.value = true;
      },
      { immediate: true, flush: 'post' },
    );
  onBeforeUnmount(() => container.value?.remove());
  return { ready, container };
}

/** 规范图标集里的图标，做成 Element 图标位接受的组件（下拉菜单项的 icon 属性要一个组件）。 */
const iconComponents = new Map<IconName, ReturnType<typeof defineComponent>>();
function iconComponent(name: IconName) {
  if (!iconComponents.has(name))
    iconComponents.set(
      name,
      markRaw(defineComponent({ name: 'MihuaElementIcon', setup: () => () => h(Icon, { name }) })),
    );
  return iconComponents.get(name)!;
}

/** 换掉悬停时被 Element 拿去聚焦的元素的 focus()。 */
const noop = () => {};

/**
 * 对齐时的补交互（原生那一档保留 Element 自己的做法，演示页如实展示它的缺口）。
 * Element 的菜单在 DOM 上和接口要求不一样的几处，渲染以后逐个补上（Element 没有留属性，只能改元素）：
 * - 子菜单的 role=menuitem 写在外层 li 上（li 里还包着展开的子菜单），看得见的 36px 的框是里面的
 *   .el-sub-menu__title，它也不能 Tab 聚焦：把角色、tabindex、aria-expanded 挪到标题上，li 改成 role=none；
 * - 收起后鼠标移进有子菜单的项（或它的弹层），Element 会把焦点放到 li（或弹层容器）上，
 *   把这几个元素的 focus() 换成空函数，悬停不抢焦点。
 */
function patchMenu(root: ParentNode) {
  for (const li of root.querySelectorAll<HTMLElement>('.el-sub-menu')) {
    if (li.getAttribute('role') !== 'none') li.setAttribute('role', 'none');
    li.removeAttribute('aria-haspopup');
    li.removeAttribute('aria-expanded');
    li.focus = noop;
    const title = li.querySelector<HTMLElement>(':scope > .el-sub-menu__title');
    if (!title) continue;
    // 只改不一样的：观察者也看 aria-expanded，写同样的值也会再触发一次
    const set = (name: string, value: string) =>
      title.getAttribute(name) !== value && title.setAttribute(name, value);
    set('role', 'menuitem');
    set('aria-haspopup', 'true');
    set('aria-expanded', String(li.classList.contains('is-opened')));
    set('tabindex', '0');
  }
  for (const box of root.querySelectorAll<HTMLElement>('.el-menu--popup-container'))
    box.focus = noop;
}

/** 在 root 里的元素有变化时重新补一遍（菜单收起、展开时 Element 会整个重建）。 */
function useMenuPatch(roots: () => Array<ParentNode | null | undefined>) {
  let observer: MutationObserver | null = null;
  const run = () => roots().forEach((root) => root && patchMenu(root));
  onMounted(() => {
    observer = new MutationObserver(run);
    watch(
      roots,
      (list) => {
        observer!.disconnect();
        for (const root of list)
          if (root)
            observer!.observe(root, {
              subtree: true,
              childList: true,
              attributes: true,
              attributeFilter: ['class', 'aria-expanded'],
            });
        run();
      },
      { immediate: true, flush: 'post' },
    );
  });
  onBeforeUnmount(() => observer?.disconnect());
}

/** 子菜单的展开箭头：规范图标集的 chevron-down（展开时由样式转 180°）。 */
const NavArrow = markRaw(
  defineComponent({
    name: 'MihuaNavArrow',
    setup: () => () => h(Icon, { name: 'chevron-down', class: 'mh-el-nav-arrow' }),
  }),
);

/**
 * 导航菜单：Element 的 ElMenu / ElSubMenu / ElMenuItem（vertical 模式）。
 * 选中哪一项（default-active）、哪些子菜单展开、收起没有（collapse）由页面传进来：
 * ElMenu 的展开状态存在它自己身上（default-openeds 只管初始），用它暴露的 open / close 跟着 open 走。
 * 收起后有子菜单的项悬停弹出子菜单（ElSubMenu 自己的弹层），弹层开没开归 Element 管，不改 open；
 * 没有子菜单的项悬停显示名字（文字提示，见 navLeaf）。
 * 三档都成立的是接口约定（展开状态受控、选中通知页面、弹层挂进作用域）；角色、Tab 顺序、键盘、
 * 读屏名字、悬停不抢焦点是对齐时的补交互，原生那一档保留 Element 自己的做法。
 */
const NavMenu = defineComponent({
  name: 'ElementKitNavMenu',
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
    const iconChoice = useIconSet();
    const { ready, container } = useScopedPopperContainer();
    const wrap = ref<HTMLElement | null>(null);
    // 角色、tabindex 挪到看得见的框上，悬停不抢焦点：只在对齐时
    useMenuPatch(() => (controls.value ? [wrap.value, container.value] : []));
    const menu = ref<{
      open: (index: string) => void;
      close: (index: string) => void;
      updateActiveIndex: (index: string) => void;
    } | null>(null);
    const submenus = computed(() => props.items.filter((item) => item.children).map((i) => i.key));
    let syncing = false;
    /** 让 ElMenu 自己存的展开状态跟着 open 走（收起时不动：收起后的弹层归 Element 自己管）。 */
    const sync = () => {
      const m = menu.value;
      if (!m || props.collapsed) return;
      syncing = true;
      try {
        for (const key of submenus.value) (props.open.includes(key) ? m.open : m.close)(key);
      } finally {
        syncing = false;
      }
    };
    watch(
      () => [props.open, props.collapsed, ready.value],
      () => nextTick(sync),
      { flush: 'post' },
    );
    /**
     * ElMenu 除了用户点子菜单标题，还会自己发 open：挂载、重建时把选中项的上级展开（连一级的菜单项也算进去），
     * 收起时鼠标悬停也发。只有点击（含键盘触发的点击）里发出的才是用户要展开 / 收起，其余的不告诉页面，
     * 并把 ElMenu 拉回页面给的状态。
     */
    let clicking = false;
    const toggle = (key: string, next: boolean) => {
      if (syncing) return;
      if (clicking && !props.collapsed && submenus.value.includes(key))
        emit('update:open', next ? [...props.open, key] : props.open.filter((k) => k !== key));
      nextTick(sync);
    };
    /**
     * 键盘（只在对齐时；Element 的竖向菜单没有键盘操作，收起后的弹层只认鼠标）：
     * - 回车、空格在菜单项上就是点击：叶子选中，子菜单标题展开 / 收起，焦点留在原处；
     * - 收起时在有子菜单的项上按回车、空格：打开（再按关上）它的弹层，焦点进到第一项；
     *   弹层里 ↑ ↓ 移动，回车、空格选中，Esc 关上；关上以后焦点回到那一项。
     */
    const titleOf = (key: string) =>
      wrap.value?.querySelector<HTMLElement>(
        `.el-sub-menu[data-key="${key}"] > .el-sub-menu__title`,
      );
    const flyoutItems = () =>
      [
        ...(container.value?.querySelectorAll<HTMLElement>('.mh-el-nav-flyout .el-menu-item') ??
          []),
      ].filter((el) => el.checkVisibility());
    let flyoutKey: string | null = null;
    const closeFlyout = () => {
      if (flyoutKey === null) return;
      const key = flyoutKey;
      flyoutKey = null;
      menu.value?.close(key);
      titleOf(key)?.focus();
    };
    const openFlyout = (key: string) => {
      flyoutKey = key;
      menu.value?.open(key);
      // 弹层显示出来要几帧（Element 的弹层先渲染、再定位）
      let frames = 10;
      const focusFirst = () => {
        const first = flyoutItems()[0];
        if (first) first.focus();
        else if (frames-- > 0) requestAnimationFrame(focusFirst);
      };
      requestAnimationFrame(focusFirst);
    };
    const onKeydown = (event: KeyboardEvent) => {
      // 键盘是对齐时的补交互：原生那一档保留 Element 没有键盘操作的样子
      if (!controls.value) return;
      const target = event.target as HTMLElement;
      if (target.getAttribute('role') !== 'menuitem') return;
      const inFlyout = !!target.closest('.mh-el-nav-flyout');
      if (inFlyout && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        event.preventDefault();
        const items = flyoutItems();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        items[(items.indexOf(target) + step + items.length) % items.length]?.focus();
        return;
      }
      if (inFlyout && event.key === 'Escape') return closeFlyout();
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      const submenu = target.closest<HTMLElement>('.el-sub-menu');
      const key = submenu?.dataset.key;
      if (props.collapsed && key && target.matches('.el-sub-menu__title')) {
        if (!submenu!.classList.contains('is-opened')) return openFlyout(key);
        flyoutKey = key;
        return closeFlyout();
      }
      target.click();
      // 在弹层里选中以后 Element 会关上弹层：焦点回到那一项
      if (inFlyout) closeFlyout();
    };
    // 弹层挂在套件的挂载点里，按键不经过菜单本身：在容器上也听一遍
    watch(
      container,
      (el, _, onCleanup) => {
        if (!el) return;
        el.addEventListener('keydown', onKeydown);
        onCleanup(() => el.removeEventListener('keydown', onKeydown));
      },
      { immediate: true },
    );
    const swap = () => controls.value !== null && swapsIcons(iconChoice.value);
    const focusable = () => (controls.value ? { tabindex: 0 } : {});
    const icon = (item: NavItem) =>
      item.icon && h(ElIcon, { class: 'mh-el-nav-icon' }, () => h(Icon, { name: item.icon! }));
    const label = (text: string) => h('span', { class: 'mh-el-nav-label' }, text);
    /** 收起后的弹层（子菜单、文字提示）离菜单项多远：左边离侧栏右边缘 popup.offset（中间隔着菜单的留白和 1px 分隔线）。 */
    const popperOffset = (c: ControlSpec) => c.nav.padding + 1 + c.popup.offset;
    /**
     * 没有子菜单的一级项。
     * 原生那一档：title 插槽交给 Element，收起后它把名字挪进自己的 ElTooltip（深色、带小箭头、离 12px，
     * 悬停时还把焦点放到提示的触发层上）。ElMenu 不给这个提示传 offset、show-arrow，
     * 所以对齐时名字留在菜单项里（收起后只在视觉上藏起来，读屏读得到），不给 title 插槽，
     * 收起时由套件自己包一层 ElTooltip：位置和子菜单弹层一样、没有小箭头、不挪焦点，样子见 styles.css。
     */
    const navLeaf = (item: NavItem) => {
      // Element 的菜单项 tabindex=-1，不在 Tab 顺序里（对齐时改成 0）
      const base = { key: item.key, index: item.key, ...focusable() };
      const c = controls.value;
      if (!c)
        return h(ElMenuItem, base, { default: () => icon(item), title: () => label(item.label) });
      const node = h(ElMenuItem, base, { default: () => [icon(item), label(item.label)] });
      if (!props.collapsed) return node;
      return h(
        ElTooltip,
        {
          key: item.key,
          content: item.label,
          placement: 'right',
          fallbackPlacements: ['left'],
          offset: popperOffset(c),
          showArrow: false,
          effect: 'dark',
          popperClass: 'mh-el-nav-tooltip',
          // 悬停马上出现（Element 的默认），回车、空格不开关提示（那两个键归菜单项：选中）
          showAfter: 0,
          triggerKeys: [],
        },
        () => node,
      );
    };
    return () =>
      h(
        'div',
        {
          ref: wrap,
          class: 'mh-el-nav-wrap',
          onKeydown,
          onClickCapture: () => (clicking = true),
          onClick: () => (clicking = false),
        },
        [
          ready.value &&
            h(
              ElMenu,
              {
                ref: menu,
                class: 'mh-el-nav',
                defaultActive: props.selected,
                defaultOpeneds: props.open,
                collapse: props.collapsed,
                // 侧栏的宽度变化归页面布局（admin.css），菜单自己不再做一遍宽度动画
                collapseTransition: false,
                // 收起后的子菜单弹层：左边离侧栏右边缘 popup.offset
                ...(controls.value ? { popperOffset: popperOffset(controls.value) } : {}),
                // 收起后 Element 自己的文字提示（原生那一档）带上这个类，自动检查按它找（部件地图的 tooltip）；
                // 子菜单弹层有自己的 popper-class，不受影响
                popperClass: 'mh-el-nav-tooltip',
                'aria-label': props.ariaLabel,
                onSelect: (key: string) => {
                  emit('update:selected', key);
                  // 页面没有接受这次选中时，回到页面给的那一项
                  nextTick(() => menu.value?.updateActiveIndex(props.selected));
                },
                onOpen: (key: string) => toggle(key, true),
                onClose: (key: string) => toggle(key, false),
              },
              () =>
                props.items.map((item) =>
                  item.children
                    ? h(
                        ElSubMenu,
                        {
                          key: item.key,
                          index: item.key,
                          popperClass: 'mh-el-nav-flyout',
                          'data-key': item.key,
                          // 展开箭头换成规范图标集的（两个都给才生效，转动交给样式）
                          ...(swap()
                            ? { expandCloseIcon: NavArrow, expandOpenIcon: NavArrow }
                            : {}),
                        },
                        {
                          title: () => [icon(item), label(item.label)],
                          default: () =>
                            item.children!.map((child) =>
                              h(
                                ElMenuItem,
                                { key: child.key, index: child.key, ...focusable() },
                                { title: () => label(child.label) },
                              ),
                            ),
                        },
                      )
                    : navLeaf(item),
                ),
            ),
        ],
      );
  },
});

/** 渲染以后（和每次更新以后）对 Element 组件的根元素做一次补丁：Element 没有留属性的地方只能改元素。 */
function usePatch(patch: (root: HTMLElement) => void) {
  const component = ref<ComponentPublicInstance | null>(null);
  const run = () => component.value?.$el instanceof HTMLElement && patch(component.value.$el);
  onMounted(run);
  onUpdated(run);
  return component;
}

/**
 * 面包屑：ElBreadcrumb。能点的上级照 Element 文档的写法放一个链接（这个项目没有 vue-router，不用 to），
 * 回车、点击都通知页面，不真的跳转。
 * Element 给每一项的文字外面都包了 role=link 的 span（不能聚焦、不能用键盘点），当前页、不能点的上级
 * 也被读成链接；aria-current 只在挂载时写一次。对齐时渲染以后去掉这些 role，当前页的标记跟着最后一项走。
 */
const Breadcrumb = defineComponent({
  name: 'ElementKitBreadcrumb',
  props: {
    items: { type: Array as PropType<BreadcrumbItem[]>, required: true },
    ariaLabel: String,
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    const controls = inject(ControlsKey, ref(null));
    // 角色修正只在对齐时（原生那一档保留 Element 的 role=link 包装）
    const root = usePatch((el) => {
      if (!controls.value) return;
      el.querySelectorAll('.el-breadcrumb__inner[role=link]').forEach((inner) =>
        inner.removeAttribute('role'),
      );
      const items = el.querySelectorAll('.el-breadcrumb__item');
      items.forEach((item, i) =>
        i === items.length - 1
          ? item.setAttribute('aria-current', 'page')
          : item.removeAttribute('aria-current'),
      );
    });
    return () =>
      h(
        ElBreadcrumb,
        {
          ref: root,
          'aria-label': props.ariaLabel,
          ...(controls.value ? { separator: controls.value.breadcrumb.separator } : {}),
        },
        () =>
          props.items.map((item, i) =>
            // 首页和工作台是同一个 key，按位置区分
            h(ElBreadcrumbItem, { key: i }, () =>
              i < props.items.length - 1 && item.link
                ? h(
                    'a',
                    {
                      href: '#',
                      onClick: (event: MouseEvent) => {
                        event.preventDefault();
                        emit('navigate', item.key);
                      },
                    },
                    item.label,
                  )
                : item.label,
            ),
          ),
      );
  },
});

/** ElDropdown 实例上用到的几样（它是选项式组件，setup 返回的都在实例上）。 */
type ElDropdownInstance = ComponentPublicInstance & {
  handleClose: () => void;
  contentRef?: HTMLElement;
};

/**
 * 下拉菜单：ElDropdown，点击触发按钮（默认插槽）打开，弹层挂在作用域内的挂载点。
 * Element 把 id、role=button、tabindex 加在触发按钮上（不另包一层），Tab 顺序里还是那一个按钮。
 * 键盘：Element 在触发按钮上按回车、空格、↓ 打开，但要等弹出动画（约 300ms）放完才把焦点放进菜单，
 * 这之前按的键还落在触发按钮上（再按 ↓ 会把菜单关上）；选了一项、按 Esc 以后焦点也不一定回到按钮。
 * 对齐时套件补上：键盘打开时菜单一显示就把焦点放到第一项；选了一项、按 Esc 都关上并把焦点放回触发按钮。
 */
const Dropdown = defineComponent({
  name: 'ElementKitDropdown',
  props: {
    items: { type: Array as PropType<DropdownItem[]>, required: true },
    ariaLabel: String,
  },
  emits: ['select'],
  setup(props, { emit, slots }) {
    const controls = inject(ControlsKey, ref(null));
    const portal = inject(PortalKey, ref(null));
    const dropdown = ref<ElDropdownInstance | null>(null);
    const trigger = () =>
      (dropdown.value?.$el as HTMLElement | undefined)?.querySelector<HTMLElement>('[role=button]');
    const OPEN_KEYS = ['Enter', ' ', 'ArrowDown'];
    let byKeyboard = false;
    const backToTrigger = () => {
      dropdown.value?.handleClose();
      trigger()?.focus();
    };
    return () =>
      h(
        ElDropdown,
        {
          ref: dropdown,
          trigger: 'click',
          ...(portal.value ? { teleported: true, appendTo: portal.value } : { teleported: false }),
          // 统一设计：弹层右边和按钮右边对齐，离按钮 popup.offset，没有小箭头
          // （Element 默认在按钮正下方居中、离 12px、带箭头；ElDropdown 没有 offset 属性，交给 popper 的 offset）
          ...(controls.value
            ? {
                placement: 'bottom-end',
                showArrow: false,
                popperOptions: {
                  modifiers: [
                    { name: 'offset', options: { offset: [0, controls.value.popup.offset] } },
                  ],
                },
              }
            : {}),
          // 触发按钮上的按键冒泡到这里时，Element 已经按它打开了菜单
          onKeydown: (event: KeyboardEvent) => {
            if (!controls.value) return;
            if (OPEN_KEYS.includes(event.key) && event.target === trigger()) byKeyboard = true;
          },
          onVisibleChange: (visible: boolean) => {
            if (!visible || !byKeyboard) return;
            byKeyboard = false;
            nextTick(() =>
              dropdown.value?.contentRef
                ?.querySelector<HTMLElement>('.el-dropdown-menu__item:not(.is-disabled)')
                ?.focus(),
            );
          },
          onCommand: (key: string) => {
            emit('select', key);
            if (controls.value) trigger()?.focus();
          },
        },
        {
          default: () => slots.default?.(),
          dropdown: () =>
            h(
              ElDropdownMenu,
              {
                'aria-label': props.ariaLabel,
                onKeydown: (event: KeyboardEvent) =>
                  controls.value && event.key === 'Escape' && backToTrigger(),
              },
              () =>
                props.items.map((item) =>
                  h(
                    ElDropdownItem,
                    {
                      key: item.key,
                      command: item.key,
                      divided: item.divided,
                      // 图标位放规范图标集里的图标
                      icon: item.icon ? iconComponent(item.icon) : undefined,
                      class: item.danger ? 'mh-el-dropdown-danger' : undefined,
                    },
                    () => item.label,
                  ),
                ),
            ),
        },
      );
  },
});

/** 头像：ElAvatar（圆形），显示一两个字。对齐时直径用 size 属性（Element 默认 40px）。 */
const Avatar = defineComponent({
  name: 'ElementKitAvatar',
  props: { text: { type: String, required: true } },
  setup(props) {
    const controls = inject(ControlsKey, ref(null));
    return () =>
      h(ElAvatar, controls.value ? { size: controls.value.avatar.size } : null, () => props.text);
  },
});

/**
 * 徽标：ElBadge，数字标在默认插槽（被标注的东西）的右上角。
 * 数字已经写在按钮的名字里，读屏不再读它：Element 的 sup 没有留属性，对齐时渲染以后补 aria-hidden。
 */
const Badge = defineComponent({
  name: 'ElementKitBadge',
  props: { count: { type: Number, required: true } },
  setup(props, { slots }) {
    const controls = inject(ControlsKey, ref(null));
    const root = usePatch(
      (el) =>
        controls.value &&
        el.querySelector('.el-badge__content')?.setAttribute('aria-hidden', 'true'),
    );
    return () => h(ElBadge, { ref: root, value: badgeText(props.count) }, slots);
  },
});

/** ElTable 实例上用到的几样（它暴露的方法）。 */
type ElTableInstance = ComponentPublicInstance & {
  getSelectionRows: () => TableRow[];
  toggleRowSelection: (row: TableRow, selected?: boolean) => void;
  sort: (prop: string, order: string) => void;
  clearSort: () => void;
};

const elOrder = (sort: TableSort) => (sort.order === 'asc' ? 'ascending' : 'descending');

/** 只写不一样的值（null 是去掉）：观察者也看这些属性，写同样的值也会再触发它自己。 */
function setAttr(el: Element | null | undefined, name: string, value: string | null) {
  if (!el || el.getAttribute(name) === value) return;
  if (value === null) el.removeAttribute(name);
  else el.setAttribute(name, value);
}

/**
 * 对齐时给 Element 渲染出来的元素补属性（Element 没留属性的地方）。Element 会自己重新渲染、新建元素
 * （换页时的新行、翻页后的页码），所以除了套件自己更新时补，还用 MutationObserver 盯着：
 * 元素增删、这几个属性被 Element 改回去时再补一遍。补丁只写不一样的值，不会自己触发自己。
 */
function useDomPatch(patch: (root: HTMLElement) => void, attributes: string[]) {
  const root = ref<HTMLElement | null>(null);
  let observer: MutationObserver | null = null;
  const run = () => root.value && patch(root.value);
  onMounted(() => {
    observer = new MutationObserver(run);
    observer.observe(root.value!, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: attributes,
    });
    run();
  });
  onUpdated(run);
  onBeforeUnmount(() => observer?.disconnect());
  return root;
}

/** 对齐时表头里的排序按钮：文字 + 排序图标（图标集的 chevrons-up-down / chevron-up / chevron-down）。 */
const SortButton = defineComponent({
  name: 'ElementKitSortButton',
  props: {
    title: { type: String, required: true },
    order: { type: String as PropType<'asc' | 'desc' | null>, default: null },
  },
  emits: ['sort'],
  setup(props, { emit }) {
    const iconChoice = useIconSet();
    return () =>
      h('button', { type: 'button', class: 'mh-el-table-sort', onClick: () => emit('sort') }, [
        props.title,
        swapsIcons(iconChoice.value)
          ? h(Icon, {
              name:
                props.order === 'asc'
                  ? 'chevron-up'
                  : props.order === 'desc'
                    ? 'chevron-down'
                    : 'chevrons-up-down',
              ...(props.order ? { 'data-sorted': '' } : {}),
            })
          : // 规范没选图标集：用 Element 图标包里的排序图标
            h(ElIcon, null, () =>
              h(props.order === 'asc' ? SortUp : props.order === 'desc' ? SortDown : Sort),
            ),
      ]);
  },
});

/**
 * 表格：Element 的 ElTable + ElTableColumn。行、勾选、排序都由页面传进来，表格不分页、不自己排序。
 * 三档都成立（接口约定）：
 * - 勾选：Element 的勾选列（type=selection）把勾了哪些行存在自己身上（toggleRowSelection 改）。
 *   只让它存这一页的行（不用 reserve-selection：它把别的页的行也算进去，这一页一行没勾时表头也显示
 *   「部分选中」），页面的 selected、行变了就同步一遍；用户点了（select、select-all）才通知页面，
 *   别的页的勾选原样带上。
 * - 排序（原生、只设主题）：sortable="custom"（Element 不在本地排），排序状态 Element 也自己存一份
 *   （列的 order），跟着页面的 sort 走；它的 sort() 也会发 sort-change，同步时不当成用户操作。
 * 只在对齐时：
 * - 排序：列标题换成套件自己的按钮（文字 + 图标集的排序图标），按 nextSort 通知页面，th 上补 aria-sort；
 *   不用 Element 的排序（整格能点、文字后面两个小三角的按钮，点中间落在下面那个三角上就是降序）。
 * - 一个 <table>：Element 默认（table-layout fixed）把表头和行画成两个 <table>，读屏在行里读不到列名；
 *   table-layout auto 时表头在同一个 <table> 里。aria-label、aria-busy 补在它上面。
 * - 勾选的行加类名，换底色（Element 不标勾选的行）。
 * 勾选框的名字三档都补（接口约定）：Element 写在外面的 label 上（语言包的「选择所有行」「选择当前行」，
 * 每行都一样），补到 input 上，用 selectAllLabel、selectLabel(row)。
 * - 加载中：不用 v-loading（盖一层 90% 的白，转圈是 Element 的 SVG，换不了图标），表格变浅，
 *   中间放图标集的加载图标。
 */
const Table = defineComponent({
  name: 'ElementKitTable',
  props: {
    columns: { type: Array as PropType<TableColumn[]>, required: true },
    rows: { type: Array as PropType<TableRow[]>, required: true },
    selected: { type: Array as PropType<string[]>, default: undefined },
    sort: { type: Object as PropType<TableSort | null>, default: null },
    loading: Boolean,
    selectLabel: { type: Function as PropType<(row: TableRow) => string>, required: true },
    selectAllLabel: { type: String, required: true },
    ariaLabel: String,
  },
  emits: ['update:selected', 'update:sort'],
  setup(props, { emit, slots }) {
    const controls = inject(ControlsKey, ref(null));
    const table = ref<ElTableInstance | null>(null);
    // Element 的勾选跟着页面的 selected 走（只管这一页的行）
    const syncSelection = () => {
      const el = table.value;
      if (!el || !props.selected) return;
      const want = new Set(props.selected);
      const have = new Set(el.getSelectionRows().map((row) => row.key));
      for (const row of props.rows)
        if (want.has(row.key) !== have.has(row.key)) el.toggleRowSelection(row, want.has(row.key));
    };
    // Element 的排序跟着页面的 sort 走（只在用 Element 排序的两档）；sort() 会发 sort-change，这时不通知页面
    let syncing = false;
    const syncSort = () => {
      const el = table.value;
      if (!el || controls.value) return;
      syncing = true;
      if (props.sort) el.sort(props.sort.key, elOrder(props.sort));
      else el.clearSort();
      syncing = false;
    };
    watch(() => [props.rows, props.selected, controls.value], syncSelection, { flush: 'post' });
    watch(() => props.sort, syncSort, { flush: 'post' });
    onMounted(() => nextTick(syncSelection));
    // 用户勾选：这一页勾了哪些（Element 只存这一页），别的页的原样带上
    const reportSelection = (selection: Array<Record<string, unknown>>) => {
      const page = new Set(props.rows.map((row) => row.key));
      emit('update:selected', [
        ...(props.selected ?? []).filter((key) => !page.has(key)),
        ...selection.map((row) => row.key as string),
      ]);
      // 页面不改的话，把 Element 拉回页面给的状态
      nextTick(syncSelection);
    };
    const orderOf = (key: string) => (props.sort?.key === key ? props.sort.order : null);
    // 勾选框的名字（selectLabel、selectAllLabel）落到 input 上是接口约定，三档都做：Element 把语言包里的
    // 「选择当前行」写在外面的 label 上，每行一样。表格的名字、加载中、排序状态是对齐时补的读屏属性
    const root = useDomPatch(
      (el) => {
        const aligned = !!controls.value;
        const label = (box: Element | null, name: string) => {
          setAttr(box?.querySelector('.el-checkbox__original'), 'aria-label', name);
          if (aligned) setAttr(box, 'aria-label', null);
        };
        label(el.querySelector('thead .el-checkbox'), props.selectAllLabel);
        el.querySelectorAll('tbody > tr.el-table__row').forEach((tr, i) => {
          const row = props.rows[i];
          if (row) label(tr.querySelector('.el-checkbox'), props.selectLabel(row));
        });
        if (!aligned) return;
        const tableEl = el.querySelector('table.el-table__body');
        setAttr(tableEl, 'aria-label', props.ariaLabel ?? null);
        setAttr(tableEl, 'aria-busy', props.loading ? 'true' : null);
        const offset = props.selected ? 1 : 0;
        el.querySelectorAll('thead th').forEach((th, i) => {
          const column = props.columns[i - offset];
          const order = column?.sortable ? orderOf(column.key) : null;
          setAttr(th, 'aria-sort', order && (order === 'asc' ? 'ascending' : 'descending'));
        });
      },
      ['aria-label', 'aria-sort'],
    );
    return () => {
      const aligned = !!controls.value;
      const columns = props.columns.map((column) =>
        h(
          ElTableColumn,
          {
            key: column.key,
            prop: column.key,
            label: column.title,
            width: column.width,
            align: column.align,
            sortable: column.sortable && !aligned ? 'custom' : false,
          },
          {
            default: ({ row }: { row: TableRow }) => slots.cell?.({ row: toRaw(row), column }),
            ...(column.sortable && aligned
              ? {
                  header: () =>
                    h(SortButton, {
                      title: column.title,
                      order: orderOf(column.key),
                      onSort: () => emit('update:sort', nextSort(props.sort, column.key)),
                    }),
                }
              : {}),
          },
        ),
      );
      const elTable = h(
        ElTable,
        {
          // 换档时整个表格重建：两档的排序做法、布局不一样
          key: aligned ? 'aligned' : 'native',
          ref: table,
          data: props.rows,
          rowKey: 'key',
          ...(aligned
            ? {
                tableLayout: 'auto',
                rowClassName: ({ row }: { row: Record<string, unknown> }) =>
                  props.selected?.includes(row.key as string) ? 'mh-el-row-selected' : '',
              }
            : {
                defaultSort: props.sort
                  ? { prop: props.sort.key, order: elOrder(props.sort) }
                  : undefined,
                'aria-label': props.ariaLabel,
              }),
          onSelect: reportSelection,
          onSelectAll: reportSelection,
          onSortChange: ({ prop, order }: { prop: string | null; order: string | null }) => {
            if (syncing || aligned) return;
            emit(
              'update:sort',
              prop && order ? { key: prop, order: order === 'ascending' ? 'asc' : 'desc' } : null,
            );
            nextTick(syncSort);
          },
        },
        {
          default: () => [
            ...(props.selected
              ? [
                  h(ElTableColumn, {
                    key: '__select',
                    type: 'selection',
                    ...(aligned ? { width: controls.value!.table.selectionWidth } : {}),
                  }),
                ]
              : []),
            ...columns,
          ],
          empty: () => slots.empty?.(),
        },
      );
      return h(
        'div',
        {
          ref: root,
          class: ['mh-el-table', aligned && props.loading && 'mh-el-table--loading'],
          // 加载中整个表格不能操作（鼠标、键盘）：接口约定，三档都是
          inert: props.loading || undefined,
        },
        [
          aligned ? elTable : withDirectives(elTable, [[vLoading, props.loading]]),
          aligned && props.loading
            ? h('div', { class: 'mh-el-table-loading', 'aria-hidden': 'true' }, [
                h(Icon, { name: 'loading', spin: true }),
              ])
            : null,
        ],
      );
    };
  },
});

/**
 * 分页：ElPagination，页码由页面传进来（current-page），用户翻页才通知页面。
 * 「共 N 条」的文字由页面给：用 layout 里的 slot 自己画（Element 的 total 是语言包里的「共 N 条」，不能换）。
 * Element 页数变少时会自己把页码改小并发 update:current-page，这不是用户的操作，拦下来。
 * Element 的页码是能 Tab 的 <li>（没有角色，只认回车，aria-current 是 true / false，名字是语言包的
 * 「第 1 页」），上一页、下一页是 <button>（名字是语言包的「上一页」「下一页」）。
 * 名字是页面给的，三档都补：页码用 pageLabel，上一页、下一页用 prevLabel、nextLabel。
 * 对齐时补上：页码 role=button、当前页 aria-current="page"，空格也翻页；图标用图标集的 chevron-left / chevron-right。
 */
const Pagination = defineComponent({
  name: 'ElementKitPagination',
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
    // 用户的点击、按键冒泡到这里之前，记下「这是用户的操作」
    let byUser = false;
    const mark = () => {
      byUser = true;
      setTimeout(() => (byUser = false));
    };
    const root = useDomPatch(
      (el) => {
        // 名字是页面给的（pageLabel、prevLabel、nextLabel），三档都补：替掉语言包里的「第 2 页」「上一页」
        for (const li of el.querySelectorAll('.el-pager li.number'))
          setAttr(li, 'aria-label', props.pageLabel(Number(li.textContent)));
        setAttr(el.querySelector('.btn-prev'), 'aria-label', props.prevLabel);
        setAttr(el.querySelector('.btn-next'), 'aria-label', props.nextLabel);
        // 角色、当前页只在对齐档补
        if (!controls.value) return;
        for (const li of el.querySelectorAll('.el-pager li')) {
          setAttr(li, 'role', 'button');
          setAttr(li, 'aria-current', li.classList.contains('is-active') ? 'page' : null);
        }
      },
      ['aria-label', 'aria-current', 'role'],
    );
    return () => {
      const swap = !!controls.value && swapsIcons(iconChoice.value);
      return h(
        'nav',
        {
          ref: root,
          'aria-label': props.ariaLabel,
          onClickCapture: mark,
          onKeyupCapture: mark,
          // 空格也翻页（Element 的页码只认回车）
          onKeydown: (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (controls.value && event.key === ' ' && target.matches('.el-pager li')) {
              event.preventDefault();
              target.click();
            }
          },
        },
        [
          h(
            ElPagination,
            {
              currentPage: props.page,
              pageSize: props.pageSize,
              total: props.total,
              layout: 'slot, prev, pager, next',
              ...(swap
                ? {
                    prevIcon: iconComponent('chevron-left'),
                    nextIcon: iconComponent('chevron-right'),
                  }
                : {}),
              'onUpdate:currentPage': (page: number) => {
                if (byUser && page !== props.page) emit('update:page', page);
              },
            },
            () => h('span', { class: 'el-pagination__total' }, props.totalText(props.total)),
          ),
        ],
      );
    };
  },
});

/** 状态标签：ElTag，色调交给它的 type（默认是 info 的灰）；对齐时尺寸、颜色在 styles.css。 */
const TAG_TYPE = {
  default: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
} as const;
const Tag = defineComponent({
  name: 'ElementKitTag',
  props: { tone: { type: String as PropType<TagTone>, default: 'default' } },
  setup(props, { slots }) {
    const controls = inject(ControlsKey, ref(null));
    // 对齐时不要出现动画（Element 的标签挂载时从中间放大）
    return () =>
      h(ElTag, { type: TAG_TYPE[props.tone], disableTransitions: !!controls.value }, slots);
  },
});

/** 打的字是不是一个真实存在的日期（YYYY-MM-DD）。 */
function isDate(text: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const [y, m, d] = text.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** 日期范围用的值：Element 的 value-format 是 YYYY-MM-DD，进出都是字符串。 */
type DateRangeValue = [string, string] | null;

/** ElDatePicker 实例上用到的几样（它暴露的方法）。 */
type ElPickerInstance = ComponentPublicInstance & {
  handleOpen: () => void;
  handleClose: () => void;
};

/**
 * 日期范围：ElDatePicker type="daterange"（两个框、并排两个月）。起止日期由页面传进来，
 * 选完两天 Element 才发 update:model-value，套件转给页面。三档都成立（接口约定）：
 * - 两个框能打字（editable），只有一头的半截值不通知页面，清空通知 null；
 * - 两个框的名字（labels）落到两个 input 上：Element 只有一个 aria-label，两个框同名，渲染以后补上。
 * Element 原生的打字：框里的字它自己存一份（userInput），失焦、在框里回车时解析，两头都对才发；
 * 回车会拦住表单提交（preventDefault + stopPropagation）。读屏上两个框本来就是 combobox
 * （aria-haspopup="dialog"、aria-expanded 跟着面板），对齐档照用。
 * 只在对齐时：
 * - 聚焦不打开（automatic-dropdown=false：Element 默认一聚焦就打开），点击、回车才打开；
 * - 打字照接口的规则由套件处理（Element 不知道框里打了字）：打过字的回车两个都合法才通知页面（晚的在后），
 *   不合法回到页面给的值，然后照常提交表单；没打过字的回车交给 Element 开关面板；Esc、焦点离开整个日期范围时
 *   没提交的字回到页面给的值；
 * - 两个框和输入框同一组样子、填满外层，文字靠左（Element 居中）；日历图标挪到右边（prefix-icon 换成图标集的
 *   calendar，样式里排到最后），没有清空按钮；
 * - 面板：左对齐、离触发框 popup.offset、没有小箭头；只按月翻（按年翻的按钮藏掉，月份箭头用图标集的），
 *   标题「2026 年」「10 月」在 Element 里是能点的按钮（点了切到选年、选月），对齐时只是文字。
 */
const DateRange = defineComponent({
  name: 'ElementKitDateRange',
  props: {
    modelValue: { type: Array as unknown as PropType<DateRangeValue>, default: null },
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
    const popperClass = `mh-el-date-popup mh-el-date-popup-${useId().replace(/[^\w-]/g, '')}`;
    const picker = ref<ElPickerInstance | null>(null);
    let open = false;
    const root = useDomPatch(
      (el) =>
        el
          .querySelectorAll('input')
          .forEach((input, i) => setAttr(input, 'aria-label', props.labels[i] ?? null)),
      ['aria-label'],
    );
    const inputs = () => [...(root.value?.querySelectorAll('input') ?? [])];
    const pageValue = (i: number) => props.modelValue?.[i] ?? '';
    /** 框里的字和页面给的值不一样：用户打过字（还没提交）。 */
    const typed = () => inputs().some((input, i) => input.value !== pageValue(i));
    /** 没提交的字回到页面给的值（Element 不知道框里打了字，只改框里的字）。 */
    const revert = () => inputs().forEach((input, i) => (input.value = pageValue(i)));
    /** 提交打的字：两个都是合法日期才通知页面（开始比结束晚就对调），不合法就回到页面给的值。 */
    const commit = () => {
      const [a = '', b = ''] = inputs().map((input) => input.value);
      if (isDate(a) && isDate(b)) emit('update:modelValue', a <= b ? [a, b] : [b, a]);
      revert();
    };
    const panel = () => portal.value?.querySelector(`.${popperClass.split(' ')[1]}`);
    // 对齐：面板标题只是文字（Element 的年份、月份是能点、能 Tab 的按钮，点了切到选年、选月）
    const patchPanel = () => {
      if (!controls.value) return;
      panel()
        ?.querySelectorAll('.el-date-range-picker__header-label')
        .forEach((label) => {
          setAttr(label, 'role', null);
          setAttr(label, 'tabindex', null);
          setAttr(label, 'aria-live', null);
        });
    };
    return () => {
      const c = controls.value;
      const swap = !!c && swapsIcons(iconChoice.value);
      return h(
        'div',
        {
          ref: root,
          class: 'mh-el-date-range',
          role: 'group',
          'aria-label': props.ariaLabel,
          // 对齐：框里打的字由套件管，不交给 Element（它会自己存一份、自己解析）
          onInputCapture: (event: Event) => c && event.stopPropagation(),
          onChangeCapture: (event: Event) => c && event.stopPropagation(),
          onKeydownCapture: (event: KeyboardEvent) => {
            if (!c || !(event.target as HTMLElement).matches('input') || !typed()) return;
            if (event.key === 'Enter') {
              // 打过字的回车：提交，然后照常提交表单（不交给 Element：它会拦住表单提交）
              event.stopPropagation();
              commit();
              if (open) picker.value?.handleClose();
            } else if (event.key === 'Escape') revert();
          },
          // 焦点离开整个日期范围（不是去另一个框、也不是去面板）：没提交的字回到页面给的值
          onFocusout: (event: FocusEvent) => {
            const next = event.relatedTarget as Node | null;
            if (!c || root.value?.contains(next) || panel()?.contains(next)) return;
            revert();
          },
        },
        [
          // ElDatePicker 的属性类型太复杂，h() 的重载对不上，按普通组件传
          h(
            ElDatePicker as Component,
            {
              ref: picker,
              type: 'daterange',
              modelValue: props.modelValue,
              // 两头都有才通知页面；清空（两头都空）通知 null；只有一头的半截值不算
              'onUpdate:modelValue': (value: DateRangeValue | undefined) => {
                if (!value?.[0] && !value?.[1]) emit('update:modelValue', null);
                else if (value[0] && value[1]) emit('update:modelValue', [value[0], value[1]]);
              },
              onVisibleChange: (visible: boolean) => {
                open = visible;
                if (visible) nextTick(patchPanel);
              },
              onPanelChange: () => nextTick(patchPanel),
              format: 'YYYY-MM-DD',
              valueFormat: 'YYYY-MM-DD',
              startPlaceholder: props.placeholder[0],
              endPlaceholder: props.placeholder[1],
              rangeSeparator: props.separator,
              ...(portal.value
                ? { teleported: true, appendTo: portal.value }
                : { teleported: false }),
              ...(c
                ? {
                    automaticDropdown: false,
                    clearable: false,
                    clearIcon: null,
                    ...(swap ? { prefixIcon: iconComponent('calendar') } : {}),
                    popperClass,
                    placement: 'bottom-start',
                    fallbackPlacements: ['bottom-start', 'top-start'],
                    offset: c.popup.offset,
                    showArrow: false,
                  }
                : {}),
            },
            swap
              ? {
                  'prev-month': () => h(Icon, { name: 'chevron-left' }),
                  'next-month': () => h(Icon, { name: 'chevron-right' }),
                }
              : undefined,
          ),
        ],
      );
    };
  },
});

/** 对话框内容里第一个能聚焦的元素（输入框优先）。 */
const FIRST_FIELD = 'input:not([type=hidden]):not([tabindex="-1"]), textarea, select, button';

/**
 * 对话框：ElDialog。开没开由页面传进来（model-value）；Esc、关闭按钮都先问 before-close，
 * 套件只通知页面（close），不让 Element 自己关：页面把 open 改成 false 才关。点遮罩不关是接口约定，三档都是。
 * 对话框挂在作用域的挂载点里（append-to），不锁 body 的滚动（lock-scroll 关掉：挂在作用域里，锁 body 没意义）。
 * Element 自己做了焦点锁定、Esc（焦点锁定发 release-requested）、关上以后焦点回到打开前的元素。
 * 只在对齐时：在窗口正中（align-center，Element 默认离顶部 15vh）、宽度取控件规格；
 * 打开后焦点进第一个输入框（Element 落在对话框的外框上）；关闭按钮的图标用图标集的 x。
 * 关闭按钮的名字用 closeLabel：接口给的名字，三档都补。
 */
const Dialog = defineComponent({
  name: 'ElementKitDialog',
  props: {
    open: { type: Boolean, required: true },
    title: { type: String, required: true },
    closeLabel: { type: String, required: true },
  },
  emits: ['close'],
  setup(props, { emit, slots }) {
    const controls = inject(ControlsKey, ref(null));
    const portal = inject(PortalKey, ref(null));
    const iconChoice = useIconSet();
    const body = ref<HTMLElement | null>(null);
    /**
     * 对齐：Esc 一层一层关。Element 的对话框在 document 上听 Esc，可里面的选择框不管下拉开没开，
     * 收到 Esc 都 stopPropagation：焦点在选择框上时，下拉收起以后再按 Esc 也关不了对话框。
     * 套件在内容区先看一眼（捕获阶段）：按下时没有展开的弹层（aria-expanded 不是 true），
     * 而这个 Esc 没有冒泡回内容区（被里面的组件吞了），就由套件通知页面关。
     */
    let swallowed: KeyboardEvent | null = null;
    const onEscCapture = (event: KeyboardEvent) => {
      if (!controls.value || event.key !== 'Escape') return;
      if ((event.target as Element).getAttribute('aria-expanded') === 'true') return;
      swallowed = event;
      setTimeout(() => {
        if (swallowed !== event) return;
        swallowed = null;
        emit('close');
      });
    };
    const onEscBubble = (event: KeyboardEvent) => {
      if (swallowed === event) swallowed = null;
    };
    // 关闭按钮的名字用 closeLabel（接口给的名字，三档都补；Element 用语言包里的「关闭此对话框」，没留属性）
    const patchClose = () => {
      const button = body.value
        ?.closest('.el-dialog')
        ?.querySelector<HTMLElement>('.el-dialog__headerbtn');
      setAttr(button, 'aria-label', props.closeLabel);
    };
    return () => {
      const c = controls.value;
      return h(
        ElDialog,
        {
          modelValue: props.open,
          title: props.title,
          closeOnClickModal: false,
          lockScroll: false,
          beforeClose: () => emit('close'),
          ...(portal.value ? { appendTo: portal.value } : {}),
          ...(c
            ? {
                alignCenter: true,
                width: c.dialog.width,
                ...(swapsIcons(iconChoice.value) ? { closeIcon: iconComponent('x') } : {}),
              }
            : {}),
          // Element 的焦点锁定发完 open-auto-focus 以后，下一拍才把焦点放到对话框外框上（这个事件不带
          // event，拦不住）：等它放完，补关闭按钮的名字；对齐时再把焦点挪到第一个输入框
          onOpenAutoFocus: () =>
            setTimeout(() => {
              patchClose();
              if (controls.value) body.value?.querySelector<HTMLElement>(FIRST_FIELD)?.focus();
            }),
        },
        {
          default: () =>
            h(
              'div',
              {
                ref: body,
                class: 'mh-el-dialog-body',
                onKeydownCapture: onEscCapture,
                onKeydown: onEscBubble,
              },
              slots.default?.(),
            ),
          ...(slots.footer ? { footer: slots.footer } : {}),
        },
      );
    };
  },
});

/** 单选（一组）：ElRadioGroup + ElRadio（原生的 radio：Tab 进到选中的那一项，方向键换选中）。 */
const Radio = defineComponent({
  name: 'ElementKitRadio',
  props: {
    modelValue: { type: String, required: true },
    options: { type: Array as PropType<Array<{ value: string; label: string }>>, required: true },
    ariaLabel: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h(
        ElRadioGroup,
        {
          modelValue: props.modelValue,
          'onUpdate:modelValue': (value: string | number | boolean | undefined) =>
            emit('update:modelValue', String(value)),
          ariaLabel: props.ariaLabel,
        },
        () =>
          props.options.map((option) =>
            h(ElRadio, { key: option.value, value: option.value }, () => option.label),
          ),
      );
  },
});

/** 多行输入：ElInput type="textarea"；id、name、aria-describedby 这些交给 ElInput 落到 textarea 上。 */
const Textarea = defineComponent({
  name: 'ElementKitTextarea',
  inheritAttrs: false,
  props: {
    modelValue: { type: String, required: true },
    rows: Number,
    invalid: Boolean,
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    const controls = inject(ControlsKey, ref(null));
    return () =>
      h(ElInput, {
        ...attrs,
        type: 'textarea',
        modelValue: props.modelValue,
        'onUpdate:modelValue': (value: string) => emit('update:modelValue', value),
        rows: props.rows ?? controls.value?.textarea.rows,
        'aria-invalid': props.invalid || undefined,
        style: props.invalid ? invalidInput : undefined,
      });
  },
});

export const elementKit: VueKit = {
  id: 'element',
  name: 'Element Plus',
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
  // 部件地图：用户看得见的那个框是 Element 的哪个元素（自动检查按这里找，不影响组件本身）
  Table,
  Pagination,
  Tag,
  // 第二批（筛选栏的日期范围、编辑对话框）还没做
  DateRange,
  Dialog,
  Radio,
  Textarea,
  parts: {
    // 日期范围的触发框也是 .el-input__wrapper，它是另一个部件（dateRange）
    field: '.el-input__wrapper:not(.el-range-editor)',
    select: '.el-select__wrapper',
    checkbox: '.el-checkbox__inner',
    button: '.el-button:not(.is-link, .is-text)',
    tabIndicator: '.el-tabs__active-bar',
    popup: '.el-select__popper',
    option: '.el-select-dropdown__item',
    // 开关：看得见的是 .el-switch__core（role=switch 在旁边隐藏的 input 上）
    switch: '.el-switch__core',
    switchThumb: '.el-switch__action',
    // 导航菜单：一级项、子菜单里的项是 li.el-menu-item，子菜单标题是 li 里面的 .el-sub-menu__title
    menuItem: '.el-menu-item, .el-sub-menu__title',
    // 收起后的子菜单弹层：ElSubMenu 的 popper-class 同时加在弹层（.el-popper）和里面的容器上，量外面那层
    menuPopup: '.el-popper.mh-el-nav-flyout',
    breadcrumbLink: '.el-breadcrumb__inner a',
    dropdown: '.el-dropdown__popper',
    // 分隔线是单独的 li.el-dropdown-menu__item--divided，不算菜单项
    dropdownItem: '.el-dropdown-menu__item',
    avatar: '.el-avatar',
    badge: '.el-badge__content',
    // 收起后的文字提示：ElTooltip 的弹层（.el-popper，小箭头是它里面的 .el-popper__arrow，不算在框里）
    tooltip: '.el-popper.mh-el-nav-tooltip',
    // 表格：fixed 布局时表头和行是两个 <table>；没有行时 Element 把空状态画在 <table> 外面的 .el-table__empty-block
    // 表格：表头的格子（对齐时 table-layout auto，表头和行在同一个 <table> 里；原生是两个）；
    // 没有行时 Element 把空状态画在 <table> 外面的 .el-table__empty-block，部件也算它
    tableHead: 'thead th.el-table__cell',
    tableCell: 'tbody td.el-table__cell, .el-table__empty-block',
    // 对齐时是套件自己的按钮；原生是 Element 的两个小三角
    tableSort: ':is(.mh-el-table-sort, th .caret-wrapper)',
    tag: '.el-tag',
    pageItem: '.el-pagination :is(.el-pager li, .btn-prev, .btn-next)',
    dateRange: '.el-range-editor',
    // 面板的外框：ElTooltip 的弹层（.el-popper，描边和投影在它上面），里面的 .el-picker-panel 是内容
    datePopup: '.el-picker__popper',
    // 日子：td 里那个 32 的方块（对齐时浅底、主色底、今天的描边都画在它上面）
    dateCell: '.el-date-table td .el-date-table-cell',
    dialog: '.el-dialog',
    radio: '.el-radio__inner',
    textarea: '.el-textarea__inner',
  },
  profile: {
    framework: 'vue',
    site: 'https://element-plus.org',
    tags: [
      { zh: 'SCSS 样式表', en: 'Compiled SCSS' },
      { zh: 'CSS 变量', en: 'CSS variables' },
    ],
    styling: {
      zh: 'SCSS 编译出的一份样式表，几乎所有取值都走 CSS 变量（--el-*）；但很多组件会在自己身上重新声明变量，外层改不到。',
      en: 'A stylesheet compiled from SCSS with almost every value as a CSS variable (--el-*); many components redeclare variables on themselves, out of reach from outside.',
    },
    theming: {
      zh: '运行时覆盖 CSS 变量（在 :root 或外层容器上），或者构建时改 SCSS 变量。主色的浅色梯度（light-3 … light-9）要自己算好给它。',
      en: 'Override CSS variables at runtime (on :root or a wrapper) or SCSS variables at build time. The light shades (light-3 … light-9) must be computed for it.',
    },
    sizing: {
      zh: 'small / default / large 三档，24 / 32 / 40px，来自 --el-component-size；可大号按钮、选择框又自己写死了 40px，输入框和复选框写死 14px 字。',
      en: 'small / default / large at 24 / 32 / 40px from --el-component-size, yet large buttons and selects hard-code 40px and inputs / checkboxes hard-code 14px text.',
    },
    look: {
      zh: '主色 #409EFF，圆角 4px，复选框 14px，标签栏下面一条 2px 灰线，按钮和标签字重 500；下拉离输入框 12px，带小箭头。',
      en: 'Primary #409EFF, 4px radius, 14px checkbox, a 2px gray line under tabs, weight-500 buttons and tabs; dropdowns sit 12px below with an arrow.',
    },
    icons: {
      zh: '图标在单独的包 @element-plus/icons-vue 里，要另外安装，每个图标是一个 Vue 组件（ArrowDown、View、Hide……），放进 ElIcon 里按 1em 显示。选择框的 suffix-icon、按钮的 loading-icon 可以换；密码框的眼睛只在输入后出现；复选框里的对勾是 CSS 画的旋转边框。',
      en: 'Icons live in the separate @element-plus/icons-vue package, installed on its own, one Vue component each (ArrowDown, View, Hide…), shown at 1em inside ElIcon. suffix-icon on Select and loading-icon on Button can be replaced; the password eye only appears after typing; the checkbox check is a rotated CSS border.',
    },
    accessibility: {
      zh: '表单类组件的角色和键盘是现成的（标签栏 tablist / tab、选择框 combobox + listbox、开关和复选框是真的 input、下拉菜单 role=button + menu）；缺口集中在后台那几个：竖向菜单 Tab 进不去、menuitem 落在包着子菜单的 li 上、收起后名字读屏读不到、悬停抢焦点，面包屑每项都包一个不能聚焦的 role=link，徽标的数字没有 aria-hidden。数据和表单这一批：表格的表头和行是两个 <table>（行里读不到列名），勾选框的名字写在外面的 label 上、每行都一样，排序按钮点正中是降序；加载中 v-loading 只挡鼠标、键盘还能进表格；分页的页码是没有角色、只认回车的 <li>；日期范围两个框是同名的 combobox、一聚焦就打开，框里回车拦住表单提交，面板标题里的年份月份是能 Tab 的按钮；对话框的 role=dialog 在铺满窗口的遮罩层上，里面的选择框会吞掉 Esc（焦点在它上面时关不了对话框），打开后焦点落在外框上。单选（原生 radio）和多行输入是现成的。这些地方 Element 没留属性，套件在对齐那一档渲染以后改元素补上（收起后的文字提示换成自己包的 ElTooltip），原生那一档保留原样；接口给的名字（勾选框、日期的两个框、对话框的关闭按钮、分页的页码和上一页下一页）和加载中表格不能操作（inert）三档都做。',
      en: 'Form controls come with roles and keyboard support (tabs as tablist / tab, select as combobox + listbox, real inputs for switch and checkbox, dropdown as role=button + menu). The gaps are in the admin pieces: the vertical menu is out of the Tab order with menuitem on the li that wraps the submenu, collapsed labels are hidden from screen readers and hovering steals focus; every breadcrumb label sits in an unfocusable role=link; the badge count is not aria-hidden. In the data and form controls: the table renders header and body as two <table>s (cells lose their column headers), checkbox names sit on the outer label and repeat on every row, and a click in the middle of the sort button sorts descending; loading only blocks the mouse, not the keyboard; page items are role-less <li>s that only take Enter; the date range boxes are two combobox inputs sharing one name that open on focus and swallow Enter (no form submit), with tabbable year / month buttons in the panel title; the dialog puts role=dialog on the full-window overlay, an inner Select swallows Esc (so the dialog cannot close while it has focus), and focus lands on the frame when it opens. Radio (native inputs) and textarea are fine. Element has no props for these, so the aligned kit patches the DOM after render (and wraps the collapsed tooltip in its own ElTooltip); the native tier keeps them as they are, except the names the interface provides (checkboxes, the two date boxes, the dialog close button, page items and prev / next) and the inert table while loading, which every tier gets.',
    },
    setup: [
      { zh: '引入 element-plus/dist/index.css。', en: 'Import element-plus/dist/index.css.' },
      {
        zh: '中文要用 ElConfigProvider 配 element-plus 的 zh-cn 语言包（日期面板的月份、星期，读屏用的按钮名字），日期面板周一开头还要引入 dayjs/locale/zh-cn。',
        en: 'For Chinese, wrap with ElConfigProvider and the zh-cn locale (month and weekday names, button names for screen readers); for weeks starting on Monday also import dayjs/locale/zh-cn.',
      },
      {
        zh: '弹层默认传送到 body，拿不到外层容器上的 CSS 变量；用 teleported / append-to 改。',
        en: 'Popups teleport to body and miss wrapper CSS variables; use teleported / append-to.',
      },
      {
        zh: '收起后的子菜单弹层（ElSubMenu）没有 append-to：Element 按 ID 找弹层容器（#el-popper-container-<前缀>），换一个前缀（ID_INJECTION_KEY）、在自己的容器里放一个同名的元素，它就挂进来。',
        en: 'The collapsed submenu flyout (ElSubMenu) has no append-to: Element finds its popper container by id (#el-popper-container-<prefix>), so provide another prefix (ID_INJECTION_KEY) and put an element with that id in your own container.',
      },
    ],
  },
  adaptations: [
    adapt(
      'table',
      'size',
      [
        '表头 41.5 高、行 49 高（格子上下 8、左右 12，开关外层占 32 高，再加 1px 线），勾选列 48，复选框 14',
        'Header 41.5px, rows 49px (8px vertical / 12px horizontal cell padding, a 32px switch wrapper, 1px rule); 48px selection column, 14px checkbox',
      ],
      [
        '表头 40、行 44、格子左右 16，勾选列 48、复选框 16 在格子正中',
        'Header 40, rows 44, 16px cell inset; 48px selection column with the 16px checkbox centred',
      ],
      'style-override',
    ),
    adapt(
      'table',
      'color',
      [
        '表头白底、14px 600 的灰字；勾选的行不换底色；最后一行下面有线，表格最下面还另画一条（.el-table__inner-wrapper::before）',
        'White header with 14px/600 grey text; selected rows keep a white fill; the last row has a rule and the table draws one more below it',
      ],
      [
        '表头浅底、12px 500 的次要灰字（.el-table 上的组件变量）；勾选的行换底色（row-class-name 加类名）；最后一行下面不画线',
        'Light header with 12px/500 secondary text (component variables on .el-table); selected rows get a fill (row-class-name); no rule under the last row',
      ],
      'component-token',
    ),
    adapt(
      'table',
      'keyboard',
      [
        '排序：整个表头格子能点，文字后面一个能 Tab 的按钮（「按 年度金额 排序」）里叠着两个 10px 的小三角，点按钮正中落在下面那个三角上，直接变成降序；没排序时 th 上是 aria-sort=""',
        'Sorting: the whole header cell is clickable, and a tabbable button (“Sort by …”) holds two stacked 10px carets; a click in its centre hits the lower caret and sorts descending; unsorted columns carry aria-sort=""',
      ],
      [
        '表头里一个按钮：文字 + 图标集的排序图标（隔 4），按 nextSort 切换，th 上写 aria-sort；对齐时不用 Element 的排序（sortable）',
        'A button in the header: label + icon-set sort icon (4px gap) cycling by nextSort, aria-sort on the th; Element’s sortable is not used when aligned',
      ],
      'behavior',
    ),
    adapt(
      'table',
      'a11y',
      [
        '表头和行是两个 <table>（table-layout fixed），读屏在行里读不到列名；aria-label 落在外层 div 上，加载中没有 aria-busy，v-loading 的遮罩只挡鼠标、键盘还能 Tab 进表格勾选、排序；勾选框的名字写在外面的 label 上，每行都是语言包的「选择当前行」，表头是「选择所有行」',
        'Header and body are two separate <table>s (fixed layout), so cells have no column headers; aria-label lands on the outer div and loading sets no aria-busy, and the v-loading mask only stops the mouse (the keyboard can still tab in and select or sort); checkbox names sit on the outer label and read the locale’s “Select this row” on every row',
      ],
      [
        'table-layout auto（表头和行在同一个 <table> 里），补 aria-label、aria-busy；加载中整个表格 inert、勾选框的名字补在 input 上（selectAllLabel、selectLabel）——这两条是接口约定，三档都做',
        'table-layout auto (one <table> with header and body) plus aria-label and aria-busy; while loading the whole table is inert, and checkbox names go on the input from selectAllLabel / selectLabel — both interface contracts, in all three tiers',
      ],
      'behavior',
    ),
    adapt(
      'table',
      'state',
      [
        '加载中：v-loading 盖一层 90% 的白，中间是 Element 的 42px 转圈（SVG 写在指令里，换不了图标）；没有行：至少 60 高的框，文字只占一半宽、60 行高、次要灰',
        'Loading: v-loading lays a 90% white mask with Element’s 42px spinner (an SVG baked into the directive); empty: a box at least 60px tall, text at half width, 60px line height, secondary grey',
      ],
      [
        '加载中不用 v-loading：表格 50% 不透明、不盖白，图标集的加载图标（20px、主色）在表格正中；没有行时框不留白，内容由页面给',
        'No v-loading: the table fades to 50% with no mask, the icon-set spinner (20px, primary) dead centre; the empty box adds no space of its own',
      ],
      'behavior',
    ),
    adapt(
      'table',
      'shape',
      [
        '部分选中：主色底加一道 CSS 画的白条',
        'Indeterminate: primary fill with a CSS-drawn white bar',
      ],
      [
        '主色底加白色短横（图标集的 minus，CSS 遮罩）；没有行时表头的复选框禁用，底色取控件规格',
        'Primary fill with a white dash (icon-set minus as a CSS mask); with no rows the header checkbox is disabled with the spec fill',
      ],
      'style-override',
    ),
    adapt(
      'checkbox',
      'keyboard',
      ['键盘聚焦：2px 的主色轮廓线', 'Keyboard focus: a 2px primary outline'],
      ['控件规格的外圈（3px 浅主色）', 'The spec focus ring (3px light primary)'],
      'style-override',
    ),
    adapt(
      'pagination',
      'size',
      [
        '32 的方块、相邻两项之间没有间隔、圆角 2；当前页主色字 700、没有描边，悬停变主色字；「共 N 条」正文色；上一页、下一页是 Element 的 12px 箭头',
        '32px squares with no gap between them, 2px radius; the current page is primary text at 700 with no border, hover turns text primary; the total uses body colour; 12px Element arrows',
      ],
      [
        '方块之间隔 8、圆角取规范，当前页主色描边加主色字 500，悬停浅灰底；「共 N 条」次要灰、离上一页 16；图标集的 16px 箭头（prev-icon、next-icon）',
        '8px gaps and the spec radius; the current page has a primary border and primary text at 500, hover is a light grey fill; the total is secondary grey 16px from prev; 16px icon-set arrows (prev-icon / next-icon)',
      ],
      'component-token',
    ),
    adapt(
      'pagination',
      'a11y',
      [
        '页码是能 Tab 的 <li>，没有角色、只认回车，aria-current 写 true / false，名字是语言包的「第 2 页」；上一页、下一页的名字是语言包的「上一页」「下一页」；「共 N 条」也来自语言包（用 layout 的 slot 换成页面给的文字）',
        'Page items are tabbable <li>s with no role, Enter only, aria-current as true / false, named by the locale (“page 2”); prev / next named by the locale too; the total comes from the locale (replaced through the layout slot)',
      ],
      [
        '名字用页面给的 pageLabel（页码）、prevLabel、nextLabel（接口约定，三档都补）；对齐时补 role=button、当前页 aria-current="page"，空格也能翻页',
        'Names come from the page’s pageLabel, prevLabel and nextLabel (an interface contract, in all three tiers); when aligned, role=button, aria-current="page" on the current page and Space to page',
      ],
      'behavior',
    ),
    adapt(
      'dateRange',
      'size',
      [
        '触发框 350 宽（--el-date-editor-daterange-width）、左右 10，日历图标在左边，两个框里的字居中、分隔文字正文色，有清空按钮',
        '350px wide (--el-date-editor-daterange-width) with 10px padding, the calendar icon on the left, centred text in both boxes, body-colour separator, a clear button',
      ],
      [
        '和输入框一样：填满外层、左右 field.inset、字靠左，分隔文字次要灰、左右 8，图标集的 calendar 排到最右边（prefix-icon + 样式里的 order），没有清空按钮',
        'Like an input: full width, field.inset padding, left-aligned text; a grey separator with 8px on each side; the icon-set calendar moved to the right end (prefix-icon + order); no clear button',
      ],
      'style-override',
    ),
    adapt(
      'dateRange',
      'keyboard',
      [
        '一聚焦就打开面板（automatic-dropdown 默认开），回车、↓ 打开；能打字，打的字 Element 自己存一份、失焦或在框里回车时解析，两头都对才发；框里的回车一律拦住表单提交（preventDefault + stopPropagation），筛选栏打完字回车不会查询；Tab 能走到结束日期、再离开（没有键盘陷阱）',
        'Focus alone opens the panel (automatic-dropdown is on by default); Enter and ↓ open it; typing works, with Element keeping its own copy of the text and parsing it on blur or Enter (both ends needed); Enter in a box always blocks form submission, so typing a range and pressing Enter never runs the search; Tab moves on to the end date and out (no keyboard trap)',
      ],
      [
        '聚焦不打开（automatic-dropdown=false），点击、没打过字的回车开关面板；打字由套件按接口处理：打过字的回车两个都合法才通知页面（晚的在后）、不合法回到页面给的值，然后照常提交表单；Esc、焦点离开整个日期范围时没提交的字回去',
        'Focus no longer opens it (automatic-dropdown=false); click or Enter without typing toggles the panel; typing follows the interface, handled by the kit: Enter after typing commits only two valid dates (ordered), otherwise reverts, then submits the form as usual; Esc or leaving the whole range reverts uncommitted text',
      ],
      'behavior',
    ),
    adapt(
      'dateRange',
      'a11y',
      [
        '两个框都是 role=combobox（aria-haspopup=dialog、aria-expanded），但名字是同一个 aria-label；标题里的年份、月份是能 Tab 的 role=button（点了切到选年、选月）',
        'Both boxes are role=combobox (aria-haspopup=dialog, aria-expanded) but share one aria-label; the year and month in the panel title are tabbable role=button elements (switching to year / month views)',
      ],
      [
        '两个框的名字用 labels（接口约定，三档都补）；combobox 一组属性照用（统一设计也是 combobox）；对齐时面板标题只是文字',
        'The boxes are named from labels (an interface contract, in all three tiers); Element’s combobox attributes stay (the unified design is a combobox too); when aligned the panel title is plain text',
      ],
      'behavior',
    ),
    adapt(
      'dateRange',
      'shape',
      [
        '面板离触发框 12、带小箭头、在触发框下面居中，648 宽：每个月四周 16 的留白，中间一条竖线；标题 28 高，两边是按年、按月翻的双箭头和单箭头；星期下面一条线；日子是 32×30 的格子里一个 24 的圆，范围的浅底画在格子里（开始、结束那天缩进 5 带半圆），今天是主色粗体字',
        'The panel sits 12px below with an arrow, centred, 648px wide: 16px padding per month with a divider; a 28px title with year and month arrows; a rule under the weekdays; days are 24px circles in 32×30 cells with the range fill in the cell (start / end inset 5px with half-round ends); today is bold primary text',
      ],
      [
        '左对齐、离触发框 4、没有小箭头，外框取 popup 一组；留白 12、两个月隔 24；标题 32（只按月翻，按年翻的藏掉，箭头用图标集的）；星期 32；日子 32 的方块紧挨着，浅底、主色底、今天的 1px 描边都画在方块上',
        'Left-aligned 4px below without an arrow, frame from the popup spec; 12px padding, 24px between months; 32px title (month arrows only, from the icon set); 32px weekday row; 32px day squares side by side carrying the range fill, the primary fill and today’s 1px border',
      ],
      'style-override',
    ),
    adapt(
      'dialog',
      'size',
      [
        '宽 50%（检查页的窗口 1200 时 600）、离顶部 15vh；留白 16、圆角 4；标题 18px 400、行高 24；关闭按钮是右上角 48 的方块，图标 16、悬停变主色；标题和内容、内容和按钮之间各 16；遮罩 50% 的黑',
        '50% wide (600 in a 1200 window), 15vh from the top; 16px padding, 4px radius; 18px / 400 title on a 24px line; the close button is a 48px square in the top-right corner with a 16px icon that turns primary on hover; 16px between title, body and footer; a 50% black mask',
      ],
      [
        '在窗口正中（align-center）、宽 520（width）；留白 24、面板圆角、标题 16/24/600；关闭按钮 32 的方块离上、右 20，图标集的 x，悬停浅灰底；标题到内容 20、内容到按钮 24；遮罩取控件规格',
        'Centred in the window (align-center), 520 wide (width); 24px padding, panel radius, a 16/24/600 title; a 32px close button 20px from the top and right with the icon-set x and a light hover fill; 20px under the title, 24px above the footer; the mask from the spec',
      ],
      'component-token',
    ),
    adapt(
      'dialog',
      'keyboard',
      [
        '打开后焦点落在对话框的外框上；焦点锁定、Esc 关、关上以后焦点回到打开前的元素都有，但对话框在 document 上听 Esc，里面的选择框收到 Esc 一律 stopPropagation：焦点在选择框上时，下拉收起以后再按 Esc 也关不了对话框',
        'On open, focus lands on the dialog frame; focus trapping, Esc and focus restore all work, but the dialog listens for Esc on document and an inner Select always stops propagation, so with focus on a Select a second Esc never closes the dialog',
      ],
      [
        '打开后焦点进第一个输入框；Esc 一层一层关：没有展开的弹层、Esc 又被里面的组件吞了时，由套件通知页面关',
        'Focus moves to the first field on open; Esc closes layer by layer: when nothing is expanded and an inner component swallowed the Esc, the kit asks the page to close',
      ],
      'behavior',
    ),
    adapt(
      'dialog',
      'a11y',
      [
        'role=dialog 和 aria-label（标题）落在铺满窗口的 .el-overlay-dialog 上，不在看得见的对话框上；关闭按钮的名字是语言包的「关闭此对话框」',
        'role=dialog and aria-label (the title) sit on the full-window .el-overlay-dialog, not on the visible dialog; the close button is named by the locale',
      ],
      [
        '关闭按钮的名字用 closeLabel（Element 没留属性，打开后补上；接口给的名字，三档都补）；role=dialog 的位置保留（对读屏没有影响）',
        'The close button is named from closeLabel (patched after open, Element has no prop; an interface-provided name, so in every tier); role=dialog stays where it is (no effect for screen readers)',
      ],
      'behavior',
    ),
    adapt(
      'radio',
      'size',
      [
        '14 的圆、4 的白点，文字 500、选中后变主色；每项 32 高、右边 30 的外边距；键盘聚焦是 2px 的主色轮廓线',
        '14px circle with a 4px dot; 500-weight labels that turn primary when checked; 32px rows with a 30px right margin; keyboard focus is a 2px primary outline',
      ],
      [
        '16 的圆、6 的白点，文字正文色 400、一行文字高，圆和字隔 8、两项隔 24；聚焦是控件规格的外圈',
        '16px circle with a 6px dot, 400 body-colour labels on one text line, 8px to the label and 24px between options; focus is the spec ring',
      ],
      'component-token',
    ),
    adapt(
      'textarea',
      'size',
      [
        '默认 2 行，上下 5、左右 11、行高 1.5（21），聚焦只有边框变色',
        '2 rows by default, 5px / 11px padding, 1.5 line height (21px); focus only recolours the border',
      ],
      [
        '3 行（rows 取控件规格），文字离上下边缘 insetBlock、左右 field.inset，行高取规范，聚焦加外圈；只能往下拖（Element 默认就是）',
        '3 rows (from the spec), insetBlock / field.inset padding, the spec line height, a focus ring; resizes vertically only (Element’s default)',
      ],
      'style-override',
    ),
    adapt(
      'tag',
      'size',
      [
        '24 高、左右 9、1px 同色系描边、字重 400；浅底由 Element 的 light-9 梯度来（成功是 rgb(240, 249, 235)），默认色调用 info 的灰',
        '24px tall, 9px padding, a 1px tinted border, weight 400; fills come from Element’s light-9 shades (success is rgb(240, 249, 235)); the default tone uses info grey',
      ],
      [
        '20 高、左右 6、没有描边、500；浅底和字色取控件规格（声明在 .el-tag 上的组件变量）',
        '20px, 6px padding, no border, 500; fills and text colours from the spec (component variables on .el-tag)',
      ],
      'component-token',
    ),
    adapt(
      'switch',
      'size',
      [
        '轨道 40×20、圆点 16（离边 1px，外加一圈同色的 1px 边框），外面一层写死 32px 高',
        'Track 40×20, 16px thumb (1px from the edge plus a same-color 1px border), wrapped in a fixed 32px-tall box',
      ],
      [
        '44×22、圆点 18 离边 2px，外层不再多占高度',
        '44×22, 18px thumb 2px from the edge, no extra height around it',
      ],
      'style-override',
    ),
    adapt(
      'switch',
      'state',
      ['禁用时 60% 不透明度；圆点没有阴影', 'Disabled at 60% opacity; no thumb shadow'],
      ['禁用时 50% 不透明度；圆点阴影取控件规格', 'Disabled at 50%; thumb shadow from the spec'],
      'style-override',
    ),
    adapt(
      'switch',
      'keyboard',
      ['键盘聚焦是 2px 的主色轮廓线', 'Keyboard focus is a 2px primary outline'],
      ['控件规格的 3px 外圈', 'The 3px ring from the spec'],
      'style-override',
    ),
    adapt(
      'button',
      'size',
      [
        '默认按钮的高度写死 32px，只有大号、小号读 --el-button-size；左右内边距默认 15px、大号 19px',
        'Default buttons hard-code 32px (only large and small read --el-button-size); padding is 15px, 19px when large',
      ],
      [
        '默认按钮也读规范高度；文字离外边框取控件规格：默认 16px、大号 20px',
        'Default buttons follow the spec height too; text inset from the spec: 16px default, 20px large',
      ],
      'style-override',
    ),
    adapt(
      'button',
      'color',
      [
        '不会从主色推算浅色梯度（light-3 … light-9）',
        'Does not derive light shades (light-3 … light-9)',
      ],
      [
        '映射层按比例混白生成，light-3 取规范的悬停色；和手调的梯度可能略有差别',
        'The mapping mixes them with white; light-3 is the spec hover. May differ slightly from hand-tuned ramps',
      ],
      'theme-token',
    ),
    adapt(
      'button',
      'size',
      [
        '大号按钮自己声明 --el-button-size: 40px，不跟组件尺寸变量走',
        'Large buttons declare --el-button-size: 40px and ignore the size variable',
      ],
      ['改成规范的大号控件高度', 'Set to the spec large height'],
      'component-token',
    ),
    adapt(
      'select',
      'size',
      ['大号选择框写死 40px 最小高度', 'Large selects are fixed at a 40px minimum height'],
      ['取规范的高度', 'Uses the spec height'],
      'style-override',
    ),
    adapt(
      'text',
      'type',
      ['大号输入框、复选框写死 14px 字', 'Large inputs and checkboxes are fixed at 14px'],
      ['规范的正文字号', 'The spec body size'],
      'component-token',
    ),
    adapt(
      'checkbox',
      'size',
      ['复选框 14px，整行 32px 高', 'Checkboxes are 14px in a 32px row'],
      ['16px，整行一行文字高', '16px in a one-line row'],
      'component-token',
    ),
    adapt(
      'checkbox',
      'type',
      ['勾选后文字加粗并变成主色', 'Checked labels turn bold and primary'],
      ['正文字重、正文色', 'Body weight and color'],
      'component-token',
    ),
    adapt(
      'checkbox',
      'shape',
      ['对勾是 1px 旋转边框，按 14px 写死', 'The check is a 1px rotated border sized for 14px'],
      ['加粗到 2px，位置由 Element 自己居中', 'Thickened to 2px; Element keeps it centered'],
      'style-override',
    ),
    adapt(
      'tabs',
      'size',
      [
        '标签之间 40px，下方 2px 灰线，标签栏 39px（底部 -1px）',
        'Tabs are 40px apart over a 2px line; the bar is 39px (−1px margin)',
      ],
      ['间距 32px、1px 分隔线、高度取规范', '32px gaps, a 1px divider, spec height'],
      'style-override',
    ),
    adapt(
      'tabs',
      'type',
      ['标签文字都是字重 500', 'All tab labels are weight 500'],
      ['未选中 400，选中 500', '400 inactive, 500 active'],
      'style-override',
    ),
    adapt(
      'field',
      'size',
      ['大号输入框文字离边框 15px', 'Large input text sits 15px from the edge'],
      ['12px', '12px'],
      'style-override',
    ),
    adapt(
      'field',
      'state',
      ['聚焦只有描边变色，没有外圈', 'Focus only recolors the border'],
      ['加 3px 浅色外圈', 'Adds a 3px light ring'],
      'style-override',
    ),
    adapt(
      'field',
      'state',
      [
        '密码显隐图标只在输入了内容之后出现',
        'The password toggle only shows once there is content',
      ],
      ['一直显示，隐藏时是闭眼', 'Always shown; closed eye while hidden'],
      'behavior',
    ),
    adapt(
      'button',
      'state',
      ['次要按钮悬停变成主色浅底加主色字', 'Secondary hover turns light primary'],
      ['浅灰底', 'Light gray'],
      'component-token',
    ),
    adapt(
      'button',
      'size',
      ['按钮里的图标框固定 1em，图标和文字间距 6px', 'The icon box is fixed at 1em with a 6px gap'],
      ['图标框按图标大小撑开，间距 8px', 'The icon box fits the icon; 8px gap'],
      'style-override',
    ),
    adapt(
      'link',
      'size',
      [
        '链接按钮有 2px 内边距、1px 边框、居中对齐，会把一行文字撑高',
        'Link buttons have 2px padding, a 1px border and middle alignment that stretch the line',
      ],
      ['只占一行文字高', 'Takes one line of text'],
      'style-override',
    ),
    adapt(
      'link',
      'color',
      ['链接按钮用主色', 'Link buttons use the primary'],
      ['用链接色', 'Use the link color'],
      'component-token',
    ),
    adapt(
      'popup',
      'size',
      ['下拉离输入框 12px，带小箭头', 'The dropdown sits 12px below with an arrow'],
      ['4px，没有箭头', '4px, no arrow'],
      'prop',
    ),
    adapt(
      'popup',
      'color',
      [
        '选项 34px 高、左 20 右 32px，选中只加粗变主色',
        'Options are 34px, padded 20 / 32px; selected is bold primary',
      ],
      [
        '32px、左右 12px，选中浅底加粗',
        '32px, 12px padding, light fill and medium weight when selected',
      ],
      'style-override',
    ),
    adapt(
      'select',
      'icon',
      ['下拉箭头是 Element 自己的图标', 'The select arrow is Element’s own icon'],
      ['规范图标集里的下拉箭头（suffix-icon）', 'The arrow from the spec’s icon set (suffix-icon)'],
      'prop',
    ),
    adapt(
      'checkbox',
      'icon',
      ['对勾是旋转的 1px 边框', 'The check is a rotated 1px border'],
      [
        '规范图标集里的对勾，用 CSS 遮罩画',
        'The check from the spec’s icon set, drawn as a CSS mask',
      ],
      'style-override',
    ),
    adapt(
      'button',
      'icon',
      [
        '加载图标是 Element 自己的，图标框整个转动',
        'The loading icon is Element’s own and its box rotates',
      ],
      [
        '规范图标集里的加载图标（loading-icon），图标自己转',
        'The spec’s loading icon (loading-icon), spinning itself',
      ],
      'prop',
    ),
    adapt(
      'button',
      'state',
      [
        '加载时盖一层白色遮罩，鼠标仍是手形',
        'Loading adds a white overlay and keeps the pointer cursor',
      ],
      ['整个按钮按控件规格降低不透明度', 'The whole button fades to the spec’s loading opacity'],
      'style-override',
    ),
    adapt(
      'field',
      'icon',
      [
        '密码显隐图标是 Element 的 View / Hide',
        'The password toggle uses Element’s View / Hide icons',
      ],
      ['套件画显隐按钮，图标来自规范图标集', 'The kit draws the toggle with the spec’s icons'],
      'behavior',
    ),
    // —— 导航菜单（ElMenu 竖向）——
    adapt(
      'nav',
      'size',
      [
        '每项 56px 高（子菜单里的 50px）、占满侧栏整宽（219px，菜单自带 1px 右边线），没有四周留白和上下间隔、直角；一级项左右 20px，子菜单项再缩进 20px；字 14px、行高等于项高',
        'Items are 56px (50px inside submenus) and span the full width (219px plus a 1px right border), no padding, gaps or radius; 20px side padding, submenu items indented another 20px; 14px text with the line height equal to the item height',
      ],
      [
        '菜单四周留白 8px，每项 36px 高、圆角、上下隔 2px；文字 14/22，一级项和子菜单项的文字都在 38px',
        '8px around the menu, 36px rounded items 2px apart; 14/22 text, all labels at 38px',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'size',
      [
        '菜单图标按 18px 字号画、图标位 24px 宽、右边 5px（图标在 x=23）',
        'Icons render at 18px in a 24px slot with a 5px gap (icon at x=23)',
      ],
      ['16px，离左 12px，和文字隔 10px', '16px, 12px from the left, 10px from the label'],
      'style-override',
    ),
    adapt(
      'nav',
      'icon',
      [
        '展开箭头是 Element 的 ArrowDown，12px、离右 20px，展开时转 180°',
        'The submenu arrow is Element’s ArrowDown, 12px and 20px from the right, rotating 180° when open',
      ],
      [
        '规范图标集的 chevron-down（expand-close-icon、expand-open-icon 两个都给才生效），16px、离右 12px；Element 换了箭头就不再转，转 180° 交给样式',
        'The spec’s chevron-down (both expand-close-icon and expand-open-icon must be given), 16px and 12px from the right; Element stops rotating custom arrows, so styles rotate it',
      ],
      'prop',
    ),
    adapt(
      'nav',
      'color',
      [
        '菜单自带白底和 1px 右边线；字是标题色 #303133；悬停主色浅底（#ECF5FF）、字不变；选中只把字变成主色 #409EFF，没有底色',
        'The menu has its own white fill and 1px right border; text is #303133; hover is a light primary fill (#ECF5FF); selected only turns the text primary (#409EFF), no fill',
      ],
      [
        '菜单透明、不画线（分隔线归页面布局）；悬停浅灰底深色字，图标不变色；选中浅底、选中色、字重 500，悬停不变；有选中项的子菜单标题字和图标用 parentSelectedColor',
        'Transparent menu without a border (the divider belongs to the layout); light gray hover with dark text; selected gets a light fill, the selected color and weight 500; a submenu title with a selected child uses parentSelectedColor',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'color',
      [
        '菜单的变量（--el-menu-active-color 等）声明在 :root 上、在那里就算好了，外层改 --el-color-primary 够不着：只设主题时选中项还是 Element 的蓝',
        'Menu variables (--el-menu-active-color…) are declared and resolved on :root, so a wrapper’s --el-color-primary never reaches them: with theme only, the selected item stays Element blue',
      ],
      [
        '在套件外层照 Element 的写法重新声明一遍，跟着规范的主色、文字色走',
        'Redeclared on the kit wrapper with Element’s own expressions, so they follow the spec',
      ],
      'theme-token',
    ),
    adapt(
      'nav',
      'state',
      [
        '收起后 64px 宽（63px 的项加 1px 线）、项 56px 高、图标在 x=23；有选中子项的子菜单只把图标变成主色',
        'Collapsed it is 64px (63px items plus a 1px border), 56px items, icons at x=23; a submenu with a selected child only turns its icon primary',
      ],
      [
        '宽度跟侧栏走，每项 48×36、图标水平居中；有选中子项的子菜单画成选中的样子（选中底色、选中色图标）',
        'Width follows the sider; 48×36 items with centered icons; a submenu with a selected child looks selected',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'state',
      [
        '收起、展开时 ElMenu 自己再做一遍 300ms 的宽度过渡（先收旧菜单、再显示新菜单）',
        'ElMenu runs its own 300ms width transition when collapsing or expanding (old menu out, then new menu in)',
      ],
      [
        '关掉（collapse-transition=false），侧栏宽度的变化只归页面布局',
        'Turned off (collapse-transition=false); the sider width change belongs to the layout',
      ],
      'prop',
    ),
    adapt(
      'nav',
      'a11y',
      [
        '收起后菜单项没有名字：子菜单标题的名字用 visibility: hidden 藏起来，读屏也读不到；一级项的名字整个挪进悬停提示，只在鼠标悬停时用 aria-describedby 挂在菜单项里面一层 div 上',
        'Collapsed items have no accessible name: submenu titles hide theirs with visibility: hidden (screen readers miss it too); top-level labels move into the hover tooltip, linked by aria-describedby on an inner div only while the mouse hovers',
      ],
      [
        '名字留在菜单项里，只在视觉上藏起来，读屏读得到；提示开着时 aria-describedby 在菜单项（role=menuitem）上',
        'Labels stay inside the items, hidden visually only and still read; while the tooltip is open, aria-describedby sits on the menuitem itself',
      ],
      'behavior',
    ),
    adapt(
      'nav',
      'shape',
      [
        '收起后一级项悬停显示 Element 的深色提示（ElTooltip，effect=dark）：标题色 #303133 底、白字、同色 1px 描边，12/20、左右 11 上下 5、圆角 4，带 10px 的小箭头，没有阴影；马上出现（show-after 0，0.2 秒淡入）、移开 200ms 后再 0.2 秒淡出；在菜单项右边 12px、上下居中；和子菜单弹层挂在同一个弹层容器里。ElMenu 不给这个提示传 offset、show-arrow',
        'Collapsed top-level items show Element’s dark tooltip (ElTooltip, effect=dark): #303133 fill, white text, a same-color 1px border, 12/20, 11/5 padding, 4px radius, a 10px arrow, no shadow; shows at once (show-after 0, 0.2s fade-in) and fades out over 0.2s starting 200ms after leaving; 12px right of the item, vertically centered; mounted in the same popper container as the flyouts. ElMenu passes no offset or show-arrow to it',
      ],
      [
        '套件自己包一层 ElTooltip（offset = 留白 8 + 分隔线 1 + 4，show-arrow=false，不挪焦点），左边离侧栏右边缘 4、上下居中；样子取控件规格的 tooltip 一组：左右 8 上下 4、控件圆角、没有描边和阴影',
        'The kit wraps the item in its own ElTooltip (offset = 8 padding + 1 divider + 4, show-arrow=false, no focus move), 4px off the sider edge and vertically centered; the look comes from the spec tooltip: 8/4 padding, control radius, no border or shadow',
      ],
      'prop',
    ),
    adapt(
      'nav',
      'shape',
      [
        '收起后的子菜单弹层离菜单项 6px（popper-offset）；最小宽 200px、上下 5px 内边距，选项 56px 高、左右 20px，选中只变主色字；外框 4px 圆角、1px 线，阴影画在里面一层',
        'The collapsed flyout sits 6px from the item (popper-offset); at least 200px wide with 5px vertical padding, 56px options padded 20px, selected only turns primary; 4px radius and a 1px border outside, the shadow on an inner layer',
      ],
      [
        '左边离侧栏右边缘 popup.offset（popper-offset = 留白 8 + 分隔线 1 + 4），最小宽 160；外框和选项取下拉（popup）一组，选中浅底加粗',
        'popup.offset from the sider edge (popper-offset = 8 padding + 1 divider + 4), at least 160 wide; frame and options from the popup spec, selected with a light fill',
      ],
      'style-override',
    ),
    adapt(
      'nav',
      'a11y',
      [
        '竖向菜单只用键盘用不了：菜单项 tabindex=-1，Tab 进不去；子菜单的 role=menuitem 在外层 li 上（li 还包着展开的子菜单），标题不能聚焦；回车、空格没反应；收起后的弹层只认鼠标；聚焦没有外圈',
        'The vertical menu is unusable from the keyboard: items are tabindex=-1, out of the Tab order; a submenu’s role=menuitem sits on the outer li (which also wraps the open submenu) and its title is not focusable; Enter and Space do nothing; the collapsed flyout is mouse-only; no focus ring',
      ],
      [
        '每个看得见的项（含子菜单标题）能 Tab 聚焦，role=menuitem 在 36px 的框上；回车、空格选中或展开 / 收起；收起后在子菜单上回车、空格打开弹层，↑ ↓ 移动、Esc 关上；聚焦外圈 3px',
        'Every visible item (titles included) is tabbable with role=menuitem on the 36px box; Enter and Space select or toggle; collapsed, Enter / Space opens the flyout, arrows move, Esc closes; a 3px focus ring',
      ],
      'behavior',
    ),
    adapt(
      'nav',
      'state',
      [
        '哪些子菜单展开存在 ElMenu 自己身上（default-openeds 只管初始）；挂载、重建时自己展开选中项的上级（一级菜单项也被当成子菜单「展开」），收起后悬停也发 open',
        'Open submenus live inside ElMenu (default-openeds is only the initial value); on mount it opens the selected item’s parents (even a top-level item counts as “opened”), and hovering when collapsed emits open too',
      ],
      [
        '用它暴露的 open / close 跟着页面的 open 走，只有用户点击（含键盘）发出的展开、收起才告诉页面',
        'Driven by the page’s open through its exposed open / close; only user clicks (and keys) are reported to the page',
      ],
      'behavior',
    ),
    adapt(
      'nav',
      'a11y',
      [
        '收起后鼠标悬停会抢焦点：移进有子菜单的项（或它的弹层），Element 把焦点放到外层 li（或弹层容器）上；移进一级项，文字提示（focus-on-target）把焦点放到提示的触发层上、马上又拿掉它的 tabindex，焦点掉到 body。原来聚焦的东西（比如正在输入的框）都会失焦',
        'Collapsed, hovering steals focus: a submenu item (or its flyout) moves focus to the outer li (or the flyout container); on a top-level item the tooltip (focus-on-target) focuses its trigger layer and drops its tabindex at once, so focus falls to body. Whatever had focus (an input being typed in) loses it',
      ],
      [
        '悬停不挪焦点：li、弹层容器的 focus() 换成空函数；文字提示是套件自己的 ElTooltip，不开 focus-on-target',
        'Hovering leaves focus alone: focus() on the li and flyout container is a no-op; the tooltip is the kit’s own ElTooltip without focus-on-target',
      ],
      'behavior',
    ),
    // —— 面包屑（ElBreadcrumb）——
    adapt(
      'breadcrumb',
      'type',
      [
        '整行 14px、行高 1（14px 高）；能点的上级加粗 700',
        '14px with line-height 1 (14px tall); links are bold (700)',
      ],
      ['一行文字高（14/22），都是 400', 'One text line (14/22), all at 400'],
      'style-override',
    ),
    adapt(
      'breadcrumb',
      'color',
      [
        '能点的上级是标题色 #303133、悬停变主色；其余上级和当前页都是正文色 #606266',
        'Links are #303133 and turn primary on hover; other ancestors and the current page are #606266',
      ],
      [
        '上级次要灰、悬停变深，当前页强调色',
        'Ancestors secondary gray, darker on hover; the current page strong',
      ],
      'style-override',
    ),
    adapt(
      'breadcrumb',
      'shape',
      [
        '分隔符「/」左右各 9px、加粗、占位色 #A8ABB2',
        'The “/” separator has 9px on each side, bold, #A8ABB2',
      ],
      ['左右各 8px、400、分隔符色', '8px each side, weight 400, the separator color'],
      'style-override',
    ),
    adapt(
      'breadcrumb',
      'a11y',
      [
        '每一项的文字外面都包一层 role=link 的 span（不能聚焦、不能用键盘点），当前页、不能点的上级也被读成链接；aria-current 只在挂载时写一次；跳转要靠 vue-router（to）',
        'Every label is wrapped in a role=link span (not focusable, not keyboard-operable), so the current page and plain ancestors read as links; aria-current is set once on mount; navigation relies on vue-router (to)',
      ],
      [
        '能点的上级是真链接（a href，回车、点击通知页面，不跳转），其余去掉 role；当前页标记跟着最后一项；聚焦外圈 3px',
        'Real links for clickable ancestors (a href; Enter and click notify the page, no navigation), roles removed elsewhere; aria-current follows the last item; a 3px focus ring',
      ],
      'behavior',
    ),
    // —— 下拉菜单（ElDropdown）——
    adapt(
      'dropdown',
      'size',
      [
        '在触发按钮正下方居中、离 12px、带小箭头；宽随内容（这里 109px）',
        'Centered under the trigger, 12px away with an arrow; as wide as its content (109px here)',
      ],
      [
        '右边和按钮右边对齐（placement=bottom-end），离 popup.offset（ElDropdown 没有 offset 属性，交给 popper-options 的 offset），没有箭头',
        'Right-aligned with the trigger (placement=bottom-end), popup.offset away (ElDropdown has no offset prop, so via popper-options), no arrow',
      ],
      'prop',
    ),
    adapt(
      'dropdown',
      'shape',
      [
        '外框 4px 圆角、1px 浅线、Element 的阴影，上下 5px 内边距；项上下 5 左右 16px（32px 高）、直角；图标 14px（1em）和文字隔 5px；分隔线上下 6px、只画在项的宽度里',
        '4px radius, a 1px light border and Element’s shadow with 5px vertical padding; items padded 5 / 16px (32px), square; 14px (1em) icons 5px from the label; dividers 6px above and below, item-wide',
      ],
      [
        '外框取下拉（popup）一组、最小宽 160；项 32px 高、左右 12、圆角；图标 16px 隔 8px；分隔线横跨整个内宽（盖住左右内边距），上下各 4',
        'Frame from the popup spec, at least 160 wide; 32px items padded 12 with a radius; 16px icons 8px apart; dividers span the full inner width, 4px above and below',
      ],
      'style-override',
    ),
    adapt(
      'dropdown',
      'color',
      [
        '项是正文色 #606266；悬停、键盘高亮是主色浅底（#ECF5FF）加主色字；危险项没有单独的颜色',
        'Items are #606266; hover and keyboard highlight are a light primary fill with primary text; no danger color',
      ],
      [
        '字和图标取控件规格，高亮只加浅灰底；退出登录的字和图标是危险色',
        'Text and icon colors from the spec, highlight is a light gray fill; sign-out text and icon use the danger color',
      ],
      'style-override',
    ),
    adapt(
      'dropdown',
      'type',
      [
        '包在触发按钮外面的 .el-dropdown 自带行高 1、字号和颜色，页面画的触发按钮跟着变（文字上移半像素）',
        'The .el-dropdown wrapper around the trigger sets line-height 1, its own font size and color, which the page’s trigger inherits (text shifts half a pixel)',
      ],
      ['外层继承页面的字', 'The wrapper inherits the page’s type'],
      'style-override',
    ),
    adapt(
      'dropdown',
      'keyboard',
      [
        '回车、空格、↓ 打开，但要等弹出动画（约 300ms）放完焦点才进菜单，这之前按的键落在触发按钮上（再按 ↓ 会把菜单关上）；选了一项、按 Esc 以后焦点不回到按钮',
        'Enter, Space and ↓ open it, but focus only moves in after the ~300ms animation; keys pressed before that hit the trigger (↓ closes it again); after choosing or Esc focus does not return to the trigger',
      ],
      [
        '菜单一显示就把焦点放到第一项；选了一项、按 Esc 都关上并把焦点放回触发按钮',
        'Focus moves to the first item as soon as the menu shows; choosing or Esc closes it and returns focus to the trigger',
      ],
      'behavior',
    ),
    // —— 头像、徽标 ——
    adapt(
      'avatar',
      'size',
      ['直径 40px', '40px across'],
      ['28px（size 属性）', '28px (size prop)'],
      'prop',
    ),
    adapt(
      'avatar',
      'color',
      [
        '灰底（禁用文字色 #C0C4CC）白字，14px、400',
        'Gray fill (the disabled text color #C0C4CC) with white 14px text at 400',
      ],
      [
        '头像底色、头像字色，12px、500（--el-avatar-* 组件变量，字重另写）',
        'Avatar fill and text colors, 12px at 500 (--el-avatar-* variables, weight set separately)',
      ],
      'component-token',
    ),
    adapt(
      'badge',
      'size',
      [
        '18px 高、左右 6px（一位数 21.4px 宽）、圆角 10px',
        '18px tall with 6px padding (21.4px wide for one digit), 10px radius',
      ],
      [
        '16px 高、最小宽 16、左右 4、圆角 8，字 12/16（--el-badge-* 组件变量）',
        '16px tall, at least 16 wide, 4px padding, 8px radius, 12/16 text (--el-badge-* variables)',
      ],
      'component-token',
    ),
    adapt(
      'badge',
      'shape',
      [
        '外加 1px 白边、字重 400；右上角往里收 9px（right: 1px + 半个高度，再右移自身宽度），外层按一行文字撑到 17px 高，数字中心比图标右上角偏右 0.7、偏上 1.4px',
        'A 1px white border, weight 400; tucked 9px in from the right (right: 1px + half the height, then shifted by its width) in a wrapper stretched to a 17px line, so its center sits 0.7px right and 1.4px above the icon corner',
      ],
      [
        '没有边、500；中心对准被标注的东西的右上角（translate(50%, -50%)），外层贴着它（inline-flex）',
        'No border, weight 500; centered on the corner (translate(50%, -50%)) of a wrapper that hugs the icon (inline-flex)',
      ],
      'style-override',
    ),
    adapt(
      'badge',
      'a11y',
      [
        '数字没有 aria-hidden：读屏读完按钮的名字（里面已经有这个数）再读一遍',
        'The number has no aria-hidden: screen readers read it again after the button name, which already includes it',
      ],
      [
        'aria-hidden（Element 没留属性，渲染以后补上）',
        'aria-hidden (added after render; Element has no prop)',
      ],
      'behavior',
    ),
  ],
};
