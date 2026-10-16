// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h, reactive, type VNode } from 'vue';
import { monoSpec, resolveSpec } from '@mihua/spec';
import { elementKit } from './index';

describe('Element tabs instances', () => {
  it('keeps tab/panel ids local to each instance while emitting the original values', async () => {
    const values = reactive({ first: 'phone', second: 'phone' });
    const changes: string[] = [];
    const items = [
      { value: 'phone', label: '手机号' },
      { value: 'account', label: '账号密码' },
    ];
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            'div',
            (['first', 'second'] as const).map((key) =>
              h(elementKit.Tabs, {
                modelValue: values[key],
                items,
                ariaLabel: key,
                'onUpdate:modelValue': (value: string) => {
                  changes.push(value);
                  values[key] = value;
                },
              }),
            ),
          ),
      }),
      { attachTo: document.body },
    );
    try {
      await flushPromises();
      const ids = wrapper.findAll('[id]').map((node) => node.attributes('id'));
      expect(ids.length).toBeGreaterThanOrEqual(8);
      expect(new Set(ids).size).toBe(ids.length);
      for (const tab of wrapper.findAll('[role="tab"]')) {
        const panel = document.getElementById(tab.attributes('aria-controls')!)!;
        expect(panel).not.toBeNull();
        expect(panel.getAttribute('aria-labelledby')).toBe(tab.attributes('id'));
        expect(panel.closest('.mh-kit-element-tabs')).toBe(
          tab.element.closest('.mh-kit-element-tabs'),
        );
      }
      const groups = wrapper.findAll('.mh-kit-element-tabs');
      await groups[1].findAll('[role="tab"]')[1].trigger('click');
      await flushPromises();
      expect(changes).toEqual(['account']);
      expect(values).toEqual({ first: 'phone', second: 'account' });
      expect(groups[0].find('[role="tab"][aria-selected="true"]').text()).toBe('手机号');
      expect(groups[1].find('[role="tab"][aria-selected="true"]').text()).toBe('账号密码');
      await groups[1].findAll('[role="tab"]')[0].trigger('click');
      await flushPromises();
      expect(changes).toEqual(['account', 'phone']);
    } finally {
      wrapper.unmount();
    }
  });
});

/** 对齐那一档：放进套件的 Provider（接上规范）里渲染。 */
const tokens = resolveSpec(monoSpec);
const inKit = (render: () => VNode, aligned = true) =>
  defineComponent({
    setup: () => () => h(elementKit.Provider, aligned ? { tokens } : { tokens: null }, render),
  });

describe('Element nav menu', () => {
  const items = [
    { key: 'workbench', label: '工作台', icon: 'home' as const },
    {
      key: 'customers',
      label: '客户管理',
      icon: 'users' as const,
      children: [
        { key: 'customer-list', label: '客户列表' },
        { key: 'lead-pool', label: '线索池' },
      ],
    },
  ];
  const mountMenu = (
    initial: { selected: string; open: string[]; collapsed?: boolean },
    aligned: boolean,
  ) => {
    const state = reactive({ collapsed: false, ...initial });
    const opens: string[][] = [];
    const wrapper = mount(
      inKit(
        () =>
          h(elementKit.NavMenu, {
            items,
            selected: state.selected,
            open: state.open,
            collapsed: state.collapsed,
            ariaLabel: '主导航',
            'onUpdate:selected': (key: string) => (state.selected = key),
            'onUpdate:open': (keys: string[]) => {
              opens.push(keys);
              state.open = keys;
            },
          }),
        aligned,
      ),
      { attachTo: document.body },
    );
    return { state, opens, wrapper };
  };

  it('aligned: follows the page’s open state, reports user toggles, keyboard on the visible box', async () => {
    // 选中项在「客户管理」里，页面却说它收着：ElMenu 挂载时会自己展开它，不能告诉页面
    const { state, opens, wrapper } = mountMenu({ selected: 'customer-list', open: [] }, true);
    try {
      await flushPromises();
      expect(opens).toEqual([]);
      const submenu = () => wrapper.find('.el-sub-menu');
      expect(submenu().classes()).not.toContain('is-opened');
      // 角色和 Tab 顺序在看得见的标题上
      const title = wrapper.find('.el-sub-menu__title');
      expect(submenu().attributes('role')).toBe('none');
      expect(title.attributes('role')).toBe('menuitem');
      expect(title.attributes('tabindex')).toBe('0');
      expect(title.attributes('aria-expanded')).toBe('false');
      // 回车展开，焦点留在原处
      (title.element as HTMLElement).focus();
      await title.trigger('keydown', { key: 'Enter' });
      await flushPromises();
      expect(opens).toEqual([['customers']]);
      expect(submenu().classes()).toContain('is-opened');
      expect(title.attributes('aria-expanded')).toBe('true');
      expect(document.activeElement).toBe(title.element);
      // 页面改 open，ElMenu 跟着走
      state.open = [];
      await flushPromises();
      expect(submenu().classes()).not.toContain('is-opened');
      // 叶子：空格选中，在 Tab 顺序里
      const leaf = wrapper.find('.el-menu-item');
      expect(leaf.attributes('tabindex')).toBe('0');
      await leaf.trigger('keydown', { key: ' ' });
      await flushPromises();
      expect(state.selected).toBe('workbench');
      expect(opens).toEqual([['customers']]);
    } finally {
      wrapper.unmount();
    }
  });

  it('native: keeps Element’s roles and keyboard gaps, but state stays controlled', async () => {
    const { state, opens, wrapper } = mountMenu({ selected: 'customer-list', open: [] }, false);
    try {
      await flushPromises();
      expect(opens).toEqual([]);
      const submenu = () => wrapper.find('.el-sub-menu');
      expect(submenu().classes()).not.toContain('is-opened');
      const title = wrapper.find('.el-sub-menu__title');
      expect(submenu().attributes('role')).toBe('menuitem');
      expect(title.attributes('role')).toBeUndefined();
      expect(wrapper.find('.el-menu-item').attributes('tabindex')).toBe('-1');
      // 回车没反应（Element 的竖向菜单没有键盘操作）
      await title.trigger('keydown', { key: 'Enter' });
      await flushPromises();
      expect(opens).toEqual([]);
      // 点击照常告诉页面，页面改 open 时 ElMenu 跟着走
      await title.trigger('click');
      await flushPromises();
      expect(opens).toEqual([['customers']]);
      expect(submenu().classes()).toContain('is-opened');
      state.open = [];
      await flushPromises();
      expect(submenu().classes()).not.toContain('is-opened');
    } finally {
      wrapper.unmount();
    }
  });

  /** 收起后悬停一级项，等 Element 的提示出来（show-after 0 也是一个 setTimeout）。 */
  const hover = async (el: Element) => {
    el.dispatchEvent(new MouseEvent('mouseenter'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    await flushPromises();
  };
  const tooltip = () =>
    [...document.querySelectorAll<HTMLElement>('.el-popper.mh-el-nav-tooltip')].find(
      (el) => el.style.display !== 'none',
    );

  it('aligned: collapsed leaves show the kit’s own tooltip, no arrow, focus stays put', async () => {
    const { state, wrapper } = mountMenu(
      { selected: 'customer-list', open: [], collapsed: true },
      true,
    );
    const outside = document.body.appendChild(document.createElement('button'));
    try {
      await flushPromises();
      const leaf = wrapper.find('.el-menu-item');
      // 名字留在菜单项里（只在视觉上藏起来），不用 Element 的提示触发层
      expect(leaf.text()).toBe('工作台');
      expect(leaf.find('.el-menu-tooltip__trigger').exists()).toBe(false);
      outside.focus();
      await hover(leaf.element);
      const tip = tooltip()!;
      expect(tip).toBeDefined();
      expect(tip.textContent).toBe('工作台');
      expect(tip.getAttribute('role')).toBe('tooltip');
      expect(tip.querySelector('.el-popper__arrow')).toBeNull();
      // 挂在套件作用域里的挂载点，不挂 body
      expect(tip.closest('.mh-portal')).not.toBeNull();
      // 提示开着时 aria-describedby 在菜单项自己身上；悬停不挪焦点
      expect(leaf.attributes('aria-describedby')).toBe(tip.id);
      expect(document.activeElement).toBe(outside);
      // 展开以后没有提示
      state.collapsed = false;
      await flushPromises();
      const expanded = wrapper.find('.el-menu-item');
      expect(expanded.classes()).not.toContain('el-tooltip__trigger');
    } finally {
      outside.remove();
      wrapper.unmount();
    }
  });

  it('native: collapsed leaves keep Element’s tooltip (arrow, name moved out of the item)', async () => {
    const { wrapper } = mountMenu({ selected: 'customer-list', open: [], collapsed: true }, false);
    try {
      await flushPromises();
      const leaf = wrapper.find('.el-menu-item');
      const trigger = leaf.find('.el-menu-tooltip__trigger');
      expect(trigger.exists()).toBe(true);
      expect(leaf.text()).toBe('');
      await hover(trigger.element);
      const tip = tooltip()!;
      expect(tip.textContent).toContain('工作台');
      expect(tip.querySelector('.el-popper__arrow')).not.toBeNull();
    } finally {
      wrapper.unmount();
    }
  });
});

describe('Element breadcrumb and badge', () => {
  it('aligned: only real links are links, the last item is the current page', async () => {
    const navigated: string[] = [];
    const wrapper = mount(
      inKit(() =>
        h(elementKit.Breadcrumb, {
          items: [
            { key: 'workbench', label: '首页', link: true },
            { key: 'customers', label: '客户管理' },
            { key: 'customer-list', label: '客户列表' },
          ],
          ariaLabel: '当前位置',
          onNavigate: (key: string) => navigated.push(key),
        }),
      ),
    );
    await flushPromises();
    expect(wrapper.findAll('[role=link]')).toHaveLength(0);
    const links = wrapper.findAll('a[href]');
    expect(links.map((a) => a.text())).toEqual(['首页']);
    expect(wrapper.find('[aria-current=page]').text()).toContain('客户列表');
    await links[0]!.trigger('click');
    expect(navigated).toEqual(['workbench']);
    wrapper.unmount();
  });

  it('aligned: hides the count from screen readers', async () => {
    const wrapper = mount(
      inKit(() => h(elementKit.Badge, { count: 120 }, () => h('span', 'bell'))),
    );
    await flushPromises();
    const badge = wrapper.find('.el-badge__content');
    expect(badge.text()).toBe('99+');
    expect(badge.attributes('aria-hidden')).toBe('true');
    wrapper.unmount();
  });
});

describe('Element table and pagination', () => {
  const columns = [
    { key: 'name', title: '名称' },
    { key: 'amount', title: '金额', sortable: true },
  ];
  const page1 = [
    { key: 'a', name: '甲', amount: 1 },
    { key: 'b', name: '乙', amount: 2 },
  ];
  const mountTable = (
    initial: { selected: string[]; sort: { key: string; order: 'asc' | 'desc' } | null },
    aligned: boolean,
    { accept = true } = {},
  ) => {
    const state = reactive({
      rows: page1 as Array<Record<string, unknown> & { key: string }>,
      ...initial,
    });
    const selections: string[][] = [];
    const sorts: unknown[] = [];
    const wrapper = mount(
      inKit(
        () =>
          h(elementKit.Table, {
            columns,
            rows: state.rows,
            selected: state.selected,
            sort: state.sort,
            selectLabel: (row: { name: string }) => `选择 ${row.name}`,
            selectAllLabel: '选择这一页',
            ariaLabel: '客户',
            'onUpdate:selected': (keys: string[]) => {
              selections.push(keys);
              if (accept) state.selected = keys;
            },
            'onUpdate:sort': (sort: typeof state.sort) => {
              sorts.push(sort);
              if (accept) state.sort = sort;
            },
          }),
        aligned,
      ),
      { attachTo: document.body },
    );
    return { state, selections, sorts, wrapper };
  };
  const settle = async () => {
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await flushPromises();
  };
  const checked = (wrapper: ReturnType<typeof mount>) =>
    wrapper.findAll('tbody .el-checkbox__input').map((box) => box.classes('is-checked'));

  it('aligned: selection follows the page, the header only covers this page, one sort button', async () => {
    // 别的页勾了一行（x）：这一页一行都没勾，表头不是「部分选中」
    const { state, selections, sorts, wrapper } = mountTable({ selected: ['x'], sort: null }, true);
    try {
      await settle();
      expect(selections).toEqual([]);
      expect(sorts).toEqual([]);
      expect(checked(wrapper)).toEqual([false, false]);
      const head = () => wrapper.find('thead .el-checkbox__input');
      expect(head().classes()).not.toContain('is-indeterminate');
      // 页面勾上 b：Element 跟着走
      state.selected = ['x', 'b'];
      await settle();
      expect(checked(wrapper)).toEqual([false, true]);
      expect(head().classes()).toContain('is-indeterminate');
      // 用户勾 a：别的页的 x 原样带上
      await wrapper.findAll('tbody .el-checkbox__original')[0]!.trigger('click');
      await settle();
      expect(selections.at(-1)?.sort()).toEqual(['a', 'b', 'x']);
      // 一个 <table>，读屏属性补上
      expect(wrapper.findAll('table')).toHaveLength(1);
      expect(wrapper.find('table').attributes('aria-label')).toBe('客户');
      expect(wrapper.find('thead .el-checkbox__original').attributes('aria-label')).toBe(
        '选择这一页',
      );
      expect(
        wrapper
          .findAll('tbody .el-checkbox__original')
          .map((input) => input.attributes('aria-label')),
      ).toEqual(['选择 甲', '选择 乙']);
      // 排序：表头里一个按钮，没有 Element 的小三角；点了按 nextSort 通知页面，th 上写 aria-sort
      expect(wrapper.find('.caret-wrapper').exists()).toBe(false);
      const button = wrapper.find('.mh-el-table-sort');
      await button.trigger('click');
      await settle();
      expect(sorts).toEqual([{ key: 'amount', order: 'asc' }]);
      expect(wrapper.findAll('thead th')[2]!.attributes('aria-sort')).toBe('ascending');
      await button.trigger('click');
      await button.trigger('click');
      expect(sorts.slice(1)).toEqual([{ key: 'amount', order: 'desc' }, null]);
    } finally {
      wrapper.unmount();
    }
  });

  it('aligned: a page that refuses the change keeps Element on the page’s selection', async () => {
    const { selections, wrapper } = mountTable({ selected: [], sort: null }, true, {
      accept: false,
    });
    try {
      await settle();
      await wrapper.findAll('tbody .el-checkbox__original')[1]!.trigger('click');
      await settle();
      expect(selections).toEqual([['b']]);
      expect(checked(wrapper)).toEqual([false, false]);
    } finally {
      wrapper.unmount();
    }
  });

  it('native: Element’s own sort, kept in step with the page without reporting it', async () => {
    const { state, sorts, wrapper } = mountTable({ selected: [], sort: null }, false);
    try {
      await settle();
      const th = () => wrapper.findAll('thead th')[2]!;
      expect(wrapper.find('.caret-wrapper').exists()).toBe(true);
      // 页面改排序：Element 的列跟着变，不当成用户操作
      state.sort = { key: 'amount', order: 'desc' };
      await settle();
      expect(th().classes()).toContain('descending');
      expect(sorts).toEqual([]);
      // 用户点表头：降序 → 不排序
      await th().trigger('click');
      await settle();
      expect(sorts).toEqual([null]);
      expect(th().classes()).not.toContain('descending');
    } finally {
      wrapper.unmount();
    }
  });

  it('pagination: user paging only, roles and names when aligned', async () => {
    const state = reactive({ page: 1, total: 50 });
    const pages: number[] = [];
    const wrapper = mount(
      inKit(() =>
        h(elementKit.Pagination, {
          page: state.page,
          pageSize: 10,
          total: state.total,
          totalText: (n: number) => `共 ${n} 条`,
          pageLabel: (n: number) => `第 ${n} 页`,
          prevLabel: '上一页',
          nextLabel: '下一页',
          ariaLabel: '分页',
          'onUpdate:page': (page: number) => {
            pages.push(page);
            state.page = page;
          },
        }),
      ),
      { attachTo: document.body },
    );
    try {
      await flushPromises();
      expect(wrapper.text()).toContain('共 50 条');
      const items = () => wrapper.findAll('.el-pager li');
      expect(items().map((li) => li.attributes('role'))).toEqual(Array(5).fill('button'));
      expect(items()[0]!.attributes('aria-current')).toBe('page');
      expect(items()[1]!.attributes('aria-current')).toBeUndefined();
      expect(items()[1]!.attributes('aria-label')).toBe('第 2 页');
      expect(wrapper.find('.btn-next').attributes('aria-label')).toBe('下一页');
      // 空格翻页
      await items()[2]!.trigger('keydown', { key: ' ' });
      await flushPromises();
      expect(pages).toEqual([3]);
      expect(items()[2]!.attributes('aria-current')).toBe('page');
      expect(items()[0]!.attributes('aria-current')).toBeUndefined();
      // 页数变少：Element 自己把页码改小，不是用户的操作，不通知页面
      state.page = 5;
      await flushPromises();
      state.total = 20;
      await flushPromises();
      expect(pages).toEqual([3]);
    } finally {
      wrapper.unmount();
    }
  });
});

describe('Element date range, dialog, radio, textarea', () => {
  it('date range (aligned): typed dates commit on Enter, swapped; bad or half input goes back', async () => {
    const state = reactive<{ range: [string, string] | null }>({ range: null });
    const changes: Array<[string, string] | null> = [];
    const submits: number[] = [];
    const wrapper = mount(
      inKit(() =>
        h('form', { onSubmit: (event: Event) => (event.preventDefault(), submits.push(1)) }, [
          h(elementKit.DateRange, {
            modelValue: state.range,
            placeholder: ['开始日期', '结束日期'],
            separator: '至',
            labels: ['开始日期', '结束日期'],
            ariaLabel: '日期范围',
            'onUpdate:modelValue': (range: [string, string] | null) => {
              changes.push(range);
              state.range = range;
            },
          }),
        ]),
      ),
      { attachTo: document.body },
    );
    const settle = async () => {
      await flushPromises();
      await new Promise((resolve) => setTimeout(resolve, 20));
      await flushPromises();
    };
    try {
      await settle();
      const [start, end] = wrapper.findAll('input');
      const type = async (input: typeof start, text: string) => {
        input!.element.value = text;
        await input!.trigger('input');
      };
      // 两个都合法：开始比结束晚就对调
      await type(start, '2026-06-19');
      await type(end, '2026-06-08');
      await end!.trigger('keydown', { key: 'Enter' });
      await settle();
      expect(changes).toEqual([['2026-06-08', '2026-06-19']]);
      expect(start!.element.value).toBe('2026-06-08');
      // 不合法：回到页面给的值，不通知页面
      await type(start, '2026-02-30');
      await start!.trigger('keydown', { key: 'Enter' });
      await settle();
      expect(changes).toHaveLength(1);
      expect(start!.element.value).toBe('2026-06-08');
      // Esc：没提交的字回去
      await type(end, '2026-07-01');
      await end!.trigger('keydown', { key: 'Escape' });
      expect(end!.element.value).toBe('2026-06-19');
    } finally {
      wrapper.unmount();
    }
  });

  const settle = async () => {
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await flushPromises();
  };

  it('date range: names on both boxes in every tier; combobox boxes that take typing', async () => {
    for (const aligned of [true, false]) {
      const wrapper = mount(
        inKit(
          () =>
            h(elementKit.DateRange, {
              modelValue: ['2026-06-08', '2026-06-19'],
              placeholder: ['开始日期', '结束日期'],
              separator: '至',
              labels: ['开始日期', '结束日期'],
              ariaLabel: '日期范围',
            }),
          aligned,
        ),
        { attachTo: document.body },
      );
      try {
        await settle();
        const inputs = wrapper.findAll('input');
        expect(inputs.map((input) => input.attributes('aria-label'))).toEqual([
          '开始日期',
          '结束日期',
        ]);
        expect(inputs.map((input) => input.element.value)).toEqual(['2026-06-08', '2026-06-19']);
        expect(inputs[0]!.attributes('readonly')).toBeUndefined();
        expect(inputs[0]!.attributes('role')).toBe('combobox');
        expect(inputs[0]!.attributes('aria-haspopup')).toBe('dialog');
        // 统一设计没有清空按钮
        expect(wrapper.find('.el-range__close-icon').exists()).toBe(!aligned);
      } finally {
        wrapper.unmount();
      }
    }
  });

  it('dialog: Esc and the close button only ask the page; a click on the mask does nothing', async () => {
    const state = reactive({ open: true });
    const closes: number[] = [];
    const wrapper = mount(
      inKit(() =>
        h(
          elementKit.Dialog,
          {
            open: state.open,
            title: '编辑客户',
            closeLabel: '关闭',
            onClose: () => closes.push(1),
          },
          { default: () => h('input', { name: 'first' }), footer: () => h('button', '保存') },
        ),
      ),
      { attachTo: document.body },
    );
    try {
      await settle();
      const dialog = () => document.querySelector<HTMLElement>('.el-overlay');
      expect(dialog()?.style.display).not.toBe('none');
      // 点遮罩不关
      document.querySelector<HTMLElement>('.el-overlay-dialog')!.click();
      await settle();
      expect(closes).toEqual([]);
      // 关闭按钮：通知页面；页面不关，对话框还开着
      document.querySelector<HTMLElement>('.el-dialog__headerbtn')!.click();
      await settle();
      expect(closes).toEqual([1]);
      expect(dialog()?.style.display).not.toBe('none');
      // Esc 也一样
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));
      await settle();
      expect(closes).toEqual([1, 1]);
      // 页面关
      state.open = false;
      await settle();
      expect(closes).toEqual([1, 1]);
    } finally {
      wrapper.unmount();
    }
  });

  it('dialog (aligned): an Esc swallowed inside the content still closes when nothing is expanded', async () => {
    const closes: number[] = [];
    const wrapper = mount(
      inKit(() =>
        h(
          elementKit.Dialog,
          { open: true, title: '编辑客户', closeLabel: '关闭', onClose: () => closes.push(1) },
          {
            default: () =>
              h('input', {
                name: 'swallow',
                'aria-expanded': 'false',
                // 像 Element 的选择框：收到 Esc 一律 stopPropagation
                onKeydown: (event: KeyboardEvent) => event.stopPropagation(),
              }),
          },
        ),
      ),
      { attachTo: document.body },
    );
    try {
      await settle();
      const input = document.querySelector<HTMLInputElement>('input[name=swallow]')!;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await settle();
      expect(closes).toEqual([1]);
      // 弹层展开着时 Esc 归弹层
      input.setAttribute('aria-expanded', 'true');
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await settle();
      expect(closes).toEqual([1]);
    } finally {
      wrapper.unmount();
    }
  });

  it('radio and textarea: controlled values, attributes on the real elements', async () => {
    const state = reactive({ level: 'a', note: '' });
    const wrapper = mount(
      inKit(() =>
        h('div', [
          h(elementKit.Radio, {
            modelValue: state.level,
            options: [
              { value: 'a', label: 'A' },
              { value: 'b', label: 'B' },
            ],
            ariaLabel: '等级',
            'onUpdate:modelValue': (level: string) => (state.level = level),
          }),
          h(elementKit.Textarea, {
            id: 'note',
            name: 'note',
            modelValue: state.note,
            invalid: true,
            'aria-describedby': 'note-error',
            'onUpdate:modelValue': (note: string) => (state.note = note),
          }),
        ]),
      ),
      { attachTo: document.body },
    );
    try {
      await settle();
      expect(wrapper.find('[role=radiogroup]').attributes('aria-label')).toBe('等级');
      await wrapper.findAll('input[type=radio]')[1]!.setValue(true);
      expect(state.level).toBe('b');
      const textarea = wrapper.find('textarea');
      expect(textarea.attributes()).toMatchObject({
        id: 'note',
        name: 'note',
        rows: '3',
        'aria-invalid': 'true',
        'aria-describedby': 'note-error',
      });
      await textarea.setValue('备注');
      expect(state.note).toBe('备注');
    } finally {
      wrapper.unmount();
    }
  });
});
