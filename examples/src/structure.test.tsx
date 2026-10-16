// @vitest-environment jsdom
/// <reference types="node" />
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { createApp, defineComponent, h, markRaw, type PropType } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import {
  LOGIN_VARIANTS,
  createAdminController,
  createCustomerListController,
  createLoginController,
  createLoginDemoAdapter,
  type AdminController,
  type CustomerListController,
  type LoginController,
  type LoginVariant,
} from '@mihua/core';
import {
  badgeText,
  monoSpec,
  nextSort,
  type DropdownItem,
  type NavItem,
  type TableColumn,
  type TableRow,
  type TableSort,
} from '@mihua/spec';
import {
  AdminFrame as ReactAdminFrame,
  CustomerList as ReactCustomerList,
  Login as ReactLogin,
  MihuaProvider as ReactProvider,
  type Kit,
} from '@mihua/react';
import {
  AdminFrame as VueAdminFrame,
  CustomerList as VueCustomerList,
  Login as VueLogin,
  MihuaProvider as VueProvider,
  type VueKit,
} from '@mihua/vue';

/**
 * 结构核对：React 和 Vue 各写了一份视图，它们必须渲染出同样的结构——同样的区域、同样的顺序、同样的文字。
 * 为了只比较视图本身，两边都用一个最朴素的套件（只输出普通 HTML），排除组件库之间的差异。
 * 两份视图接同一个控制器，逐个布局、逐个状态对比。
 */

const z = (zh: string) => ({ zh, en: zh });
const PLAIN_PROFILE = {
  framework: 'react' as const,
  site: '',
  tags: [],
  styling: z('普通 HTML'),
  theming: z('无'),
  sizing: z('无'),
  look: z('无'),
  icons: z('无'),
  accessibility: z('无'),
  setup: [],
};
/** 朴素套件不需要部件地图（结构核对不量样子），给一份占位的。 */
const PLAIN_PARTS = {
  field: '[data-control=input]',
  select: '[role=combobox]',
  checkbox: '[data-control=checkbox]',
  button: 'button',
  tabIndicator: '[role=tab][aria-selected=true]',
  popup: '[role=listbox]',
  option: '[role=option]',
  switch: '[role=switch]',
  switchThumb: '[role=switch] > span',
  menuItem: '[role=menuitem]',
  menuPopup: '[data-control=menu-popup]',
  breadcrumbLink: '[data-control=breadcrumb] a',
  dropdown: '[data-control=dropdown]',
  dropdownItem: '[data-control=dropdown] [role=menuitem]',
  avatar: '[data-control=avatar]',
  badge: '[data-control=badge] sup',
  tooltip: '[role=tooltip]',
  tableHead: 'th',
  tableCell: 'td',
  tableSort: 'th button',
  tag: '[data-control=tag]',
  pageItem: '[data-control=pagination] button',
  dateRange: '[data-control=date-range]',
  datePopup: '[data-control=date-popup]',
  dateCell: '[data-control=date-popup] button',
  dialog: '[role=dialog]',
  radio: '[role=radio]',
  textarea: 'textarea',
};

/** 勾选这一页 / 取消这一页（别的页的勾选不动）。 */
const selectPage = (selected: string[], rows: TableRow[], checked: boolean) =>
  checked
    ? [...new Set([...selected, ...rows.map((row) => row.key)])]
    : selected.filter((key) => !rows.some((row) => row.key === key));
const toggleRow = (selected: string[], key: string, checked: boolean) =>
  checked ? [...selected, key] : selected.filter((k) => k !== key);
const pagesOf = (total: number, size: number) =>
  Array.from({ length: Math.max(1, Math.ceil(total / size)) }, (_, i) => i + 1);

/** 展开 / 收起一个子菜单。 */
const toggle = (open: string[], key: string) =>
  open.includes(key) ? open.filter((k) => k !== key) : [...open, key];

/* ———— React 朴素套件 ———— */
const plainReact: Kit = {
  id: 'antd',
  name: 'plain',
  Provider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Button: ({ variant, type = 'button', icon, onClick, children, ...aria }) => (
    <button type={type} data-variant={variant} onClick={onClick} {...aria}>
      {icon}
      {children}
    </button>
  ),
  Input: ({ value, onChange, suffix, invalid, size: _size, type = 'text', ...rest }) => (
    <span data-control="input">
      <input
        {...rest}
        type={type}
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {suffix}
    </span>
  ),
  Checkbox: ({ checked, onChange, children, invalid: _invalid, ...aria }) => (
    <label data-control="checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        {...aria}
      />
      {children}
    </label>
  ),
  Tabs: ({ value, onChange, items, ...aria }) => (
    <div role="tablist" {...aria}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={item.value === value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
  Select: ({ value, display, 'aria-label': label }) => (
    <button type="button" role="combobox" aria-label={label}>
      {display ? display(value) : value}
    </button>
  ),
  Switch: ({ checked, onChange, disabled, ...aria }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      {...aria}
    />
  ),
  NavMenu: ({ items, selected, onSelect, open, onOpenChange, collapsed, ...aria }) => (
    <ul role="menu" {...aria}>
      {items.map((item) => (
        <li key={item.key}>
          <button
            type="button"
            role="menuitem"
            aria-current={item.key === selected ? 'page' : undefined}
            onClick={() =>
              item.children ? onOpenChange(toggle(open, item.key)) : onSelect(item.key)
            }
          >
            {item.label}
          </button>
          {item.children && open.includes(item.key) && !collapsed && (
            <ul role="menu">
              {item.children.map((child) => (
                <li key={child.key}>
                  <button type="button" role="menuitem" onClick={() => onSelect(child.key)}>
                    {child.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  ),
  Breadcrumb: ({ items, onNavigate, ...aria }) => (
    <nav data-control="breadcrumb" {...aria}>
      {items.map((item) =>
        item.link ? (
          <a key={item.key} href="#" onClick={() => onNavigate(item.key)}>
            {item.label}
          </a>
        ) : (
          <span key={item.key}>{item.label}</span>
        ),
      )}
    </nav>
  ),
  Dropdown: ({ children }) => children,
  Avatar: ({ text }) => <span data-control="avatar">{text}</span>,
  Badge: ({ count, children }) => (
    <span data-control="badge">
      {children}
      <sup>{badgeText(count)}</sup>
    </span>
  ),
  Table: ({
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
  }) => (
    <table data-control="table" aria-busy={loading || undefined} {...aria}>
      <thead>
        <tr>
          {selected && (
            <th>
              <input
                type="checkbox"
                aria-label={selectAllLabel}
                checked={rows.length > 0 && rows.every((row) => selected.includes(row.key))}
                onChange={(e) => onSelectedChange?.(selectPage(selected, rows, e.target.checked))}
              />
            </th>
          )}
          {columns.map((column) => (
            <th key={column.key}>
              {column.sortable ? (
                <button type="button" onClick={() => onSortChange(nextSort(sort, column.key))}>
                  {column.title}
                </button>
              ) : (
                column.title
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length ? (
          rows.map((row) => (
            <tr key={row.key}>
              {selected && (
                <td>
                  <input
                    type="checkbox"
                    aria-label={selectLabel(row)}
                    checked={selected.includes(row.key)}
                    onChange={(e) =>
                      onSelectedChange?.(toggleRow(selected, row.key, e.target.checked))
                    }
                  />
                </td>
              )}
              {columns.map((column) => (
                <td key={column.key}>{renderCell(row, column)}</td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length + (selected ? 1 : 0)}>{empty}</td>
          </tr>
        )}
      </tbody>
    </table>
  ),
  Pagination: ({
    page,
    pageSize,
    total,
    onChange,
    totalText,
    pageLabel,
    prevLabel,
    nextLabel,
    ...aria
  }) => (
    <nav data-control="pagination" {...aria}>
      <span>{totalText(total)}</span>
      <button type="button" aria-label={prevLabel} onClick={() => onChange(page - 1)}>
        ‹
      </button>
      {pagesOf(total, pageSize).map((p) => (
        <button key={p} type="button" aria-label={pageLabel(p)} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
      <button type="button" aria-label={nextLabel} onClick={() => onChange(page + 1)}>
        ›
      </button>
    </nav>
  ),
  Tag: ({ children }) => <span data-control="tag">{children}</span>,
  // 第二批（日期范围、对话框）的视图还没用到
  DateRange: () => null,
  Dialog: () => null,
  Radio: () => null,
  Textarea: () => null,
  adaptations: [],
  profile: PLAIN_PROFILE,
  parts: PLAIN_PARTS,
};

/* ———— Vue 朴素套件：和上面一一对应 ———— */
const plainVue: VueKit = {
  id: 'element',
  name: 'plain',
  Provider: defineComponent({
    props: { tokens: { type: Object, default: null } },
    setup:
      (_, { slots }) =>
      () =>
        h('div', slots.default?.()),
  }),
  Button: defineComponent({
    props: {
      variant: { type: String, required: true },
      size: String,
      block: Boolean,
      loading: Boolean,
      disabled: Boolean,
      type: { type: String, default: 'button' },
      ariaLabel: String,
    },
    emits: ['click'],
    setup:
      (props, { slots, emit }) =>
      () =>
        h(
          'button',
          {
            type: props.type,
            'data-variant': props.variant,
            'aria-label': props.ariaLabel,
            onClick: () => emit('click'),
          },
          [slots.icon?.(), slots.default?.()],
        ),
  }),
  Input: defineComponent({
    inheritAttrs: false,
    props: {
      modelValue: { type: String, required: true },
      type: { type: String, default: 'text' },
      size: String,
      invalid: Boolean,
      ariaLabel: String,
    },
    emits: ['update:modelValue'],
    setup:
      (props, { slots, attrs, emit }) =>
      () =>
        h('span', { 'data-control': 'input' }, [
          h('input', {
            ...attrs,
            type: props.type,
            value: props.modelValue,
            'aria-label': props.ariaLabel,
            'aria-invalid': props.invalid || undefined,
            onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value),
          }),
          slots.suffix?.(),
        ]),
  }),
  Checkbox: defineComponent({
    props: { modelValue: { type: Boolean, required: true }, invalid: Boolean },
    emits: ['update:modelValue'],
    setup:
      (props, { slots, attrs, emit }) =>
      () =>
        h('label', { 'data-control': 'checkbox' }, [
          h('input', {
            ...attrs,
            type: 'checkbox',
            checked: props.modelValue,
            onChange: (e: Event) =>
              emit('update:modelValue', (e.target as HTMLInputElement).checked),
          }),
          slots.default?.(),
        ]),
  }),
  Tabs: defineComponent({
    props: {
      modelValue: { type: String, required: true },
      items: { type: Array as PropType<Array<{ value: string; label: string }>>, required: true },
      ariaLabel: String,
    },
    emits: ['update:modelValue'],
    setup:
      (props, { emit }) =>
      () =>
        h(
          'div',
          { role: 'tablist', 'aria-label': props.ariaLabel },
          props.items.map((item) =>
            h(
              'button',
              {
                type: 'button',
                role: 'tab',
                'aria-selected': item.value === props.modelValue,
                onClick: () => emit('update:modelValue', item.value),
              },
              item.label,
            ),
          ),
        ),
  }),
  Select: defineComponent({
    props: {
      modelValue: { type: String, required: true },
      options: Array,
      size: String,
      width: Number,
      display: Function as PropType<(value: string) => string>,
      ariaLabel: String,
    },
    setup: (props) => () =>
      h(
        'button',
        { type: 'button', role: 'combobox', 'aria-label': props.ariaLabel },
        props.display ? props.display(props.modelValue) : props.modelValue,
      ),
  }),
  Switch: defineComponent({
    props: { modelValue: { type: Boolean, required: true }, disabled: Boolean, ariaLabel: String },
    emits: ['update:modelValue'],
    setup:
      (props, { emit }) =>
      () =>
        h('button', {
          type: 'button',
          role: 'switch',
          'aria-checked': props.modelValue,
          'aria-label': props.ariaLabel,
          disabled: props.disabled,
          onClick: () => emit('update:modelValue', !props.modelValue),
        }),
  }),
  NavMenu: defineComponent({
    props: {
      items: { type: Array as PropType<NavItem[]>, required: true },
      selected: { type: String, required: true },
      open: { type: Array as PropType<string[]>, required: true },
      collapsed: Boolean,
      ariaLabel: String,
    },
    emits: ['update:selected', 'update:open'],
    setup:
      (props, { emit }) =>
      () =>
        h(
          'ul',
          { role: 'menu', 'aria-label': props.ariaLabel },
          props.items.map((item) =>
            h('li', { key: item.key }, [
              h(
                'button',
                {
                  type: 'button',
                  role: 'menuitem',
                  onClick: () =>
                    item.children
                      ? emit('update:open', toggle(props.open, item.key))
                      : emit('update:selected', item.key),
                },
                item.label,
              ),
              item.children && props.open.includes(item.key) && !props.collapsed
                ? h(
                    'ul',
                    { role: 'menu' },
                    item.children.map((child) =>
                      h('li', { key: child.key }, [
                        h(
                          'button',
                          {
                            type: 'button',
                            role: 'menuitem',
                            onClick: () => emit('update:selected', child.key),
                          },
                          child.label,
                        ),
                      ]),
                    ),
                  )
                : null,
            ]),
          ),
        ),
  }),
  Breadcrumb: defineComponent({
    props: {
      items: { type: Array as PropType<Array<{ key: string; label: string; link?: boolean }>> },
      ariaLabel: String,
    },
    emits: ['navigate'],
    setup:
      (props, { emit }) =>
      () =>
        h(
          'nav',
          { 'data-control': 'breadcrumb', 'aria-label': props.ariaLabel },
          props.items!.map((item) =>
            item.link
              ? h(
                  'a',
                  { key: item.key, href: '#', onClick: () => emit('navigate', item.key) },
                  item.label,
                )
              : h('span', { key: item.key }, item.label),
          ),
        ),
  }),
  Dropdown: defineComponent({
    props: { items: Array as PropType<DropdownItem[]>, ariaLabel: String },
    emits: ['select'],
    setup:
      (_, { slots }) =>
      () =>
        slots.default?.(),
  }),
  Avatar: defineComponent({
    props: { text: { type: String, required: true } },
    setup: (props) => () => h('span', { 'data-control': 'avatar' }, props.text),
  }),
  Badge: defineComponent({
    props: { count: { type: Number, required: true } },
    setup:
      (props, { slots }) =>
      () =>
        h('span', { 'data-control': 'badge' }, [
          slots.default?.(),
          h('sup', badgeText(props.count)),
        ]),
  }),
  Table: defineComponent({
    props: {
      columns: { type: Array as PropType<TableColumn[]>, required: true },
      rows: { type: Array as PropType<TableRow[]>, required: true },
      selected: Array as PropType<string[]>,
      sort: Object as PropType<TableSort | null>,
      loading: Boolean,
      selectLabel: { type: Function as PropType<(row: TableRow) => string>, required: true },
      selectAllLabel: { type: String, required: true },
      ariaLabel: String,
    },
    emits: ['update:selected', 'update:sort'],
    setup:
      (props, { emit, slots }) =>
      () => {
        const selected = props.selected;
        return h(
          'table',
          {
            'data-control': 'table',
            'aria-busy': props.loading || undefined,
            'aria-label': props.ariaLabel,
          },
          [
            h('thead', [
              h('tr', [
                selected &&
                  h('th', [
                    h('input', {
                      type: 'checkbox',
                      'aria-label': props.selectAllLabel,
                      checked:
                        props.rows.length > 0 &&
                        props.rows.every((row) => selected.includes(row.key)),
                      onChange: (e: Event) =>
                        emit(
                          'update:selected',
                          selectPage(selected, props.rows, (e.target as HTMLInputElement).checked),
                        ),
                    }),
                  ]),
                ...props.columns.map((column) =>
                  h(
                    'th',
                    { key: column.key },
                    column.sortable
                      ? [
                          h(
                            'button',
                            {
                              type: 'button',
                              onClick: () =>
                                emit('update:sort', nextSort(props.sort ?? null, column.key)),
                            },
                            column.title,
                          ),
                        ]
                      : column.title,
                  ),
                ),
              ]),
            ]),
            h(
              'tbody',
              props.rows.length
                ? props.rows.map((row) =>
                    h('tr', { key: row.key }, [
                      selected &&
                        h('td', [
                          h('input', {
                            type: 'checkbox',
                            'aria-label': props.selectLabel(row),
                            checked: selected.includes(row.key),
                            onChange: (e: Event) =>
                              emit(
                                'update:selected',
                                toggleRow(
                                  selected,
                                  row.key,
                                  (e.target as HTMLInputElement).checked,
                                ),
                              ),
                          }),
                        ]),
                      ...props.columns.map((column) =>
                        h('td', { key: column.key }, slots.cell?.({ row, column })),
                      ),
                    ]),
                  )
                : [
                    h('tr', [
                      h(
                        'td',
                        { colspan: props.columns.length + (selected ? 1 : 0) },
                        slots.empty?.(),
                      ),
                    ]),
                  ],
            ),
          ],
        );
      },
  }),
  Pagination: defineComponent({
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
    setup:
      (props, { emit }) =>
      () =>
        h('nav', { 'data-control': 'pagination', 'aria-label': props.ariaLabel }, [
          h('span', props.totalText(props.total)),
          h(
            'button',
            {
              type: 'button',
              'aria-label': props.prevLabel,
              onClick: () => emit('update:page', props.page - 1),
            },
            '‹',
          ),
          ...pagesOf(props.total, props.pageSize).map((p) =>
            h(
              'button',
              {
                key: p,
                type: 'button',
                'aria-label': props.pageLabel(p),
                onClick: () => emit('update:page', p),
              },
              String(p),
            ),
          ),
          h(
            'button',
            {
              type: 'button',
              'aria-label': props.nextLabel,
              onClick: () => emit('update:page', props.page + 1),
            },
            '›',
          ),
        ]),
  }),
  Tag: defineComponent({
    props: { tone: String },
    setup:
      (_, { slots }) =>
      () =>
        h('span', { 'data-control': 'tag' }, slots.default?.()),
  }),
  DateRange: defineComponent({ setup: () => () => null }),
  Dialog: defineComponent({ setup: () => () => null }),
  Radio: defineComponent({ setup: () => () => null }),
  Textarea: defineComponent({ setup: () => () => null }),
  adaptations: [],
  profile: PLAIN_PROFILE,
  parts: PLAIN_PARTS,
};

/* ———— 把 DOM 写成一份可以对比的大纲 ———— */
const KEPT = [
  'data-region',
  'data-variant',
  'data-control',
  'role',
  'type',
  'name',
  'aria-label',
  'aria-selected',
  'aria-invalid',
];

function outline(root: Element, depth = 0): string[] {
  const lines: string[] = [];
  for (const el of root.children) {
    if (el.tagName === 'svg' || el.tagName === 'SVG') {
      lines.push(`${'  '.repeat(depth)}<svg>`);
      continue;
    }
    const attrs = KEPT.map((name) => {
      const v = el.getAttribute(name);
      return v === null ? '' : `${name}=${v}`;
    }).filter(Boolean);
    const classes = [...el.classList].filter((c) => c.startsWith('mh-')).sort();
    const text = [...el.childNodes]
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join(' ');
    lines.push(
      `${'  '.repeat(depth)}<${el.tagName.toLowerCase()}${classes.length ? ` .${classes.join('.')}` : ''}${attrs.length ? ` ${attrs.join(' ')}` : ''}>${text}`,
    );
    lines.push(...outline(el, depth + 1));
  }
  return lines;
}

/* ———— 同一个控制器，React 和 Vue 各渲染一份 ———— */
const cleanups: Array<() => void> = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
});

/** React、Vue 各渲染一份同样的视图，读出两份大纲（root 是视图的根元素）。 */
async function renderBoth(reactView: ReactNode, vueView: () => ReturnType<typeof h>, root: string) {
  const reactHost = document.createElement('div');
  const vueHost = document.createElement('div');
  document.body.append(reactHost, vueHost);
  const reactRoot = createRoot(reactHost);
  await act(async () =>
    reactRoot.render(
      <ReactProvider kit={plainReact} spec={monoSpec}>
        {reactView}
      </ReactProvider>,
    ),
  );
  const app = createApp({
    render: () => h(VueProvider, { kit: plainVue, spec: monoSpec }, () => vueView()),
  });
  app.mount(vueHost);
  cleanups.push(() => {
    act(() => reactRoot.unmount());
    app.unmount();
    reactHost.remove();
    vueHost.remove();
  });
  return {
    reactHost,
    vueHost,
    async outlines() {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      const r = reactHost.querySelector(root)!;
      const v = vueHost.querySelector(root)!;
      return { react: outline(r).join('\n'), vue: outline(v).join('\n') };
    },
  };
}

const render = (controller: LoginController) =>
  renderBoth(
    <ReactLogin controller={controller} />,
    () => h(VueLogin, { controller: markRaw(controller) }),
    '.mh-login',
  );

/** 不一致时把两份大纲写到 output/，方便逐行对比。 */
function dump(name: string, react: string, vue: string) {
  if (vue === react) return;
  const dir = join(process.cwd(), 'output/structure');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.react.txt`), react);
  writeFileSync(join(dir, `${name}.vue.txt`), vue);
}

type Step = (c: LoginController) => Promise<void> | void;
const STATES: Record<string, Step> = {
  初始: () => {},
  账号登录: (c) => c.send({ type: 'method', method: 'account' }),
  扫码: (c) => c.send({ type: 'method', method: 'qr' }),
  手机号: (c) => c.send({ type: 'method', method: 'phone' }),
  校验失败: (c) => void c.send({ type: 'submit' }),
  第二步: async (c) => {
    await c.send({ type: 'field', field: 'identity', value: '13800138000' });
    await c.send({ type: 'next' });
  },
};

describe('React 和 Vue 的视图结构一致', () => {
  for (const variant of Object.keys(LOGIN_VARIANTS) as LoginVariant[])
    for (const [state, step] of Object.entries(STATES))
      it(`${LOGIN_VARIANTS[variant].name.zh} · ${state}`, async () => {
        const controller = createLoginController(
          { variant },
          createLoginDemoAdapter({ locale: 'zh', latency: 0 }),
        );
        const view = await render(controller);
        await act(async () => {
          await step(controller);
        });
        const { react, vue } = await view.outlines();
        dump(`${variant}-${state}`, react, vue);
        expect(vue).toBe(react);
        controller.dispose();
      });
});

/* ———— 后台页面框架：同一个控制器，React 和 Vue 的结构一样，点了以后状态一样 ———— */
const renderAdmin = (controller: AdminController) =>
  renderBoth(
    <ReactAdminFrame controller={controller} />,
    () => h(VueAdminFrame, { controller: markRaw(controller) }),
    '.mh-admin',
  );

const ADMIN_STATES: Record<string, (c: AdminController) => void> = {
  初始: () => {},
  收起侧栏: (c) => c.send({ type: 'collapse', collapsed: true }),
  选中工作台: (c) => c.send({ type: 'select', key: 'workbench' }),
  展开销售推进: (c) => c.send({ type: 'open', keys: ['customers', 'sales'] }),
  选中合同: (c) => c.send({ type: 'select', key: 'contracts' }),
};

describe('后台页面框架：React 和 Vue 的视图结构一致', () => {
  for (const [state, step] of Object.entries(ADMIN_STATES))
    it(state, async () => {
      const controller = createAdminController();
      const view = await renderAdmin(controller);
      await act(async () => step(controller));
      const { react, vue } = await view.outlines();
      dump(`admin-${state}`, react, vue);
      expect(vue).toBe(react);
    });

  it('选中合同与续约：它的子菜单记成展开，面包屑和页头跟着变', async () => {
    const controller = createAdminController({ collapsed: true });
    const view = await renderAdmin(controller);
    await act(async () => controller.send({ type: 'select', key: 'contracts' }));
    expect(controller.getSnapshot().open).toEqual(['customers', 'sales']);
    for (const host of [view.reactHost, view.vueHost]) {
      expect(host.querySelector('[data-region=breadcrumb]')!.textContent).toBe(
        '首页销售推进合同与续约',
      );
      expect(host.querySelector('.mh-admin__title')!.textContent).toBe('合同与续约');
    }
  });

  it('在 React、Vue 里点菜单项，改的是同一份状态', async () => {
    const controller = createAdminController();
    const view = await renderAdmin(controller);
    const click = async (host: HTMLElement, label: string) =>
      act(async () =>
        [...host.querySelectorAll<HTMLElement>('[role=menuitem]')]
          .find((el) => el.textContent === label)!
          .click(),
      );
    await click(view.reactHost, '线索池');
    expect(controller.getSnapshot().selected).toBe('lead-pool');
    await click(view.vueHost, '销售推进');
    expect(controller.getSnapshot().open).toEqual(['customers', 'sales']);
    await act(async () =>
      view.vueHost.querySelector<HTMLElement>('.mh-admin__sider-foot button')!.click(),
    );
    expect(controller.getSnapshot().collapsed).toBe(true);
  });
});

/* ———— 客户列表：同一个控制器，React 和 Vue 的结构一样，点了以后状态一样 ———— */
const renderList = (controller: CustomerListController) =>
  renderBoth(
    <ReactCustomerList controller={controller} />,
    () => h(VueCustomerList, { controller: markRaw(controller) }),
    '.mh-list',
  );

const LIST_STATES: Record<string, (c: CustomerListController) => void> = {
  初始: () => {},
  勾选两行: (c) => c.send({ type: 'select', keys: ['KH-0001', 'KH-0002'] }),
  按金额降序第二页: (c) => {
    c.send({ type: 'sort', sort: { key: 'amount', order: 'desc' } });
    c.send({ type: 'page', page: 2 });
  },
  没有结果: (c) => {
    c.send({ type: 'draft', patch: { keyword: '没有这位客户' } });
    c.send({ type: 'query' });
  },
  出错: (c) => {
    c.send({ type: 'draft', patch: { keyword: '出错' } });
    c.send({ type: 'query' });
  },
};

describe('客户列表：React 和 Vue 的视图结构一致', () => {
  for (const [state, step] of Object.entries(LIST_STATES))
    it(state, async () => {
      const controller = createCustomerListController({}, { latency: 0 });
      const view = await renderList(controller);
      await act(async () => step(controller));
      const { react, vue } = await view.outlines();
      dump(`customers-${state}`, react, vue);
      expect(vue).toBe(react);
    });

  it('在 React、Vue 里勾选、排序、翻页，改的是同一份状态', async () => {
    const controller = createCustomerListController({}, { latency: 0 });
    const view = await renderList(controller);
    await act(async () =>
      view.reactHost.querySelector<HTMLElement>('thead input[type=checkbox]')!.click(),
    );
    expect(controller.getSnapshot().selected).toHaveLength(10);
    await act(async () => view.vueHost.querySelector<HTMLElement>('th button')!.click());
    expect(controller.getSnapshot().sort).toEqual({ key: 'amount', order: 'asc' });
    const pageTwo = [
      ...view.reactHost.querySelectorAll<HTMLElement>('[data-region=pagination] button'),
    ].find((b) => b.textContent === '2')!;
    await act(async () => pageTwo.click());
    expect(controller.getSnapshot().page).toBe(2);
  });
});
