import { h, markRaw } from 'vue';
import {
  createAdminController,
  createCustomerListController,
  createCustomerListState,
  customerPage,
  openDialog,
  validateCustomer,
  type AdminController,
  type CustomerListController,
  type CustomerListState,
} from '@mihua/core';
import { AdminFrame, CustomerList } from '@mihua/react';
import { AdminFrame as VueAdminFrame, CustomerList as VueCustomerList } from '@mihua/vue';
import type { Check, Combo, Target } from '@mihua/audit/page/types';
import { SPECS } from '../../specs';
import type { Scene } from '../types';
import './customers.css';

/**
 * 场景：客户列表（整个后台页面：页面框架 + 内容区的筛选栏、表格、分页、编辑对话框）。
 * 业务状态（筛选条件、排序、页码、勾选的行、加载 / 空 / 出错、对话框里的表单）在客户列表的控制器里，
 * 页面框架的状态在框架的控制器里：
 * - 检查页：每个组件库各一份。查询马上出结果（不显示加载中），结果不受时间影响；
 * - 演示页（组合里带 shared: 'yes'）：所有组件库共用一份，换组件库、换外观、换规范都不会丢；
 *   查询有 0.6 秒的加载中。
 * 组合：规范 × 状态。按区域量：框架的 header、sider、breadcrumb、page-head、content，
 * 列表的 filter、toolbar、table、pagination（对话框里是 dialog）。
 */

const SPEC_IDS = Object.keys(SPECS);
const [MONO, , STRESS] = SPEC_IDS as [string, string, string];

/** 每种状态的初始数据。 */
const STATES: Record<string, (s: CustomerListState) => Partial<CustomerListState>> = {
  default: () => ({}),
  loading: () => ({ status: 'loading' }),
  empty: () => {
    const filters = { keyword: '没有这位客户', status: 'all' as const, range: null };
    return { draft: filters, filters };
  },
  error: () => {
    const filters = { keyword: '出错', status: 'all' as const, range: null };
    return { draft: filters, filters, status: 'error' };
  },
  // 这一页勾了三行，第二页还勾着一行：表头的复选框是「部分选中」
  selected: (s) => {
    const page1 = customerPage(s).rows;
    const page2 = customerPage({ ...s, page: 2 }).rows;
    return { selected: [page1[0]!.key, page1[2]!.key, page1[3]!.key, page2[0]!.key] };
  },
  sorted: () => ({ sort: { key: 'amount', order: 'desc' }, page: 2 }),
  // 筛选了一段日期：日期面板打开时显示这一段（6、7 月：面板上看不到「今天」，检查结果不随日期变）
  ranged: () => {
    const filters = {
      keyword: '',
      status: 'all' as const,
      range: ['2026-06-08', '2026-06-19'] as [string, string],
    };
    return { draft: filters, filters };
  },
  // 编辑第一位客户的对话框开着
  dialog: (s) => ({ dialog: openDialog(s, customerPage(s).rows[0]!.key) }),
  // 点过保存：名字空着、电话不对
  invalid: (s) => {
    const dialog = openDialog(s, customerPage(s).rows[0]!.key);
    const form = { ...dialog.form, name: '', phone: '1380000' };
    return { dialog: { ...dialog, form, errors: validateCustomer(form), submitted: true } };
  },
};

/** 哪些状态在哪几套规范下检查：样子跟规范走的都查三套，只看状态的查第一套。 */
const COMBOS: Combo[] = [
  ...SPEC_IDS.map((spec) => ({ spec, state: 'default' })),
  ...[MONO, STRESS].map((spec) => ({ spec, state: 'selected' })),
  ...['sorted', 'loading', 'empty', 'error', 'ranged'].map((state) => ({ spec: MONO, state })),
  ...SPEC_IDS.map((spec) => ({ spec, state: 'dialog' })),
  { spec: MONO, state: 'invalid' },
];

const cell = (index: number): Target => ({ part: 'tableCell', index });
const SORT_AMOUNT: Target = { part: 'tableSort', index: 0 };
/** 勾选框：Radix 在按钮旁边还放了一个给表单用的隐藏 input（aria-hidden），不算。 */
const CHECKBOX = ':is([role=checkbox], input[type=checkbox]:not([aria-hidden=true]))';
const HEAD_CHECK: Target = { selector: `[data-region=table] thead ${CHECKBOX}` };
const ROW_CHECK: Target = { selector: `[data-region=table] tbody ${CHECKBOX}` };
const SWITCH: Target = { selector: '[data-region=table] [role=switch]' };
const EDIT: Target = { selector: '[data-region=table] [aria-label^="编辑"]' };
/** 分页里能 Tab 到的项：禁用的（到头了的上一页、下一页）、tabindex=-1 的（antd 的 li 里还嵌着一个按钮）不算。 */
const PAGE_ITEMS =
  '[data-region=pagination] :is(button, [role=button]):not([tabindex="-1"], :disabled, [aria-disabled=true])';
const NEXT: Target = { selector: '[data-region=pagination] [aria-label="下一页"]' };
const RANGE: Target = { part: 'dateRange' };
const RANGE_START: Target = { selector: '[data-region=filter] input[aria-label="开始日期"]' };
/** 对话框里的状态下拉：点击用看得见的框（第 0 个是筛选栏的）；键盘聚焦用 combobox（有的组件库框本身不能聚焦）。 */
const DIALOG_SELECT: Target = { part: 'select', index: 1 };
const DIALOG_COMBO: Target = { selector: '[data-region=dialog-form] [role=combobox]' };
const CLOSE: Target = { selector: '[role=dialog] [aria-label="关闭"]' };
const SAVE: Target = { selector: '[data-region=dialog-footer] button', index: 1 };
const DATE_POPUP = {
  type: 'popup',
  label: '日期范围',
  trigger: RANGE,
  popup: 'datePopup',
  item: 'dateCell',
} as const;

function checksFor(spec: string, state: string): Check[] {
  const checks: Check[] = [{ type: 'look' }];
  if (state === 'default') {
    checks.push(
      { type: 'hover', label: '表格的行', target: cell(1) },
      { type: 'hover', label: '分页的页码', target: { part: 'pageItem', index: 2 } },
      {
        type: 'popup',
        label: '状态下拉',
        trigger: { part: 'select' },
        popup: 'popup',
        item: 'option',
      },
      DATE_POPUP,
    );
  }
  if (state === 'ranged') checks.push(DATE_POPUP);
  if (state === 'dialog')
    checks.push({
      type: 'popup',
      label: '对话框里的下拉',
      trigger: DIALOG_SELECT,
      popup: 'popup',
      item: 'option',
    });
  if (state === 'selected') checks.push({ type: 'hover', label: '勾选的行', target: cell(1) });
  // 键盘和点击的行为和规范无关，只核对第一套规范
  if (spec !== MONO) return checks;
  if (state === 'default')
    checks.push(
      {
        type: 'focus',
        targets: [
          { selector: `[data-region=table] thead ${CHECKBOX}`, part: 'checkbox' },
          {
            selector: '[data-region=table] th :is(button, [role=button]):not([role=checkbox])',
            part: 'tableSort',
          },
          { selector: PAGE_ITEMS, part: 'pageItem' },
        ],
      },
      { type: 'tabOrder' },
      { type: 'click', label: '点击排序', target: SORT_AMOUNT },
      { type: 'click', label: '点击表头的复选框', target: HEAD_CHECK },
      { type: 'click', label: '点击一行的复选框', target: ROW_CHECK },
      { type: 'click', label: '点击开关', target: SWITCH },
      { type: 'click', label: '点击下一页', target: NEXT },
      { type: 'click', label: '点击页码', target: { part: 'pageItem', index: 2 } },
      { type: 'click', label: '点击编辑', target: EDIT },
      { type: 'keys', label: '排序：回车', target: SORT_AMOUNT, keys: ['Enter'] },
      { type: 'keys', label: '排序：空格两次', target: SORT_AMOUNT, keys: ['Space', 'Space'] },
      { type: 'keys', label: '表头的复选框：空格', target: HEAD_CHECK, keys: ['Space'] },
      { type: 'keys', label: '开关：空格', target: SWITCH, keys: ['Space'] },
      { type: 'keys', label: '下一页：回车', target: NEXT, keys: ['Enter'] },
      {
        type: 'keys',
        label: '页码：回车',
        target: { part: 'pageItem', index: 2 },
        keys: ['Enter'],
      },
      // 选一段日期：打开面板，点第 10 格、第 16 格（没选过时面板显示这个月和下个月）
      {
        type: 'click',
        label: '选一段日期',
        target: RANGE,
        steps: [
          { part: 'dateCell', index: 10 },
          { part: 'dateCell', index: 16 },
        ],
      },
      // 键盘选日期：在两个框里打字，回车提交
      {
        type: 'keys',
        label: '日期范围：打字、Tab、打字、回车',
        target: RANGE_START,
        keys: [{ text: '2026-06-08' }, 'Tab', { text: '2026-06-19' }, 'Enter'],
      },
      // 打了字没提交就 Esc：回到原来的值
      {
        type: 'keys',
        label: '日期范围：打字以后 Esc',
        target: RANGE_START,
        keys: [{ text: '2026-06-08' }, 'Escape', 'Tab'],
      },
      {
        type: 'keys',
        label: '日期范围：回车打开、Esc 收起',
        target: RANGE_START,
        keys: ['Enter', 'Escape'],
      },
      { type: 'keys', label: '编辑：回车打开对话框', target: EDIT, keys: ['Enter'] },
      { type: 'keys', label: '编辑：打开再 Esc 关上', target: EDIT, keys: ['Enter', 'Escape'] },
    );
  if (state === 'selected')
    checks.push({ type: 'click', label: '部分选中时点表头的复选框', target: HEAD_CHECK });
  // 加载中：表格整个不能操作，Tab 跳过表格里的勾选框、排序按钮、开关、按钮
  if (state === 'loading') checks.push({ type: 'tabOrder' });
  if (state === 'sorted') checks.push({ type: 'click', label: '再点排序', target: SORT_AMOUNT });
  if (state === 'dialog')
    checks.push(
      {
        type: 'focus',
        targets: [
          { selector: '[role=dialog] :is([role=radio], input[type=radio])', part: 'radio' },
          { selector: '[role=dialog] textarea', part: 'textarea' },
        ],
      },
      // Esc 一层一层关：先收起对话框里的下拉，再按一次才关对话框
      {
        type: 'keys',
        label: '对话框里的下拉：Esc 先收起下拉',
        target: DIALOG_COMBO,
        keys: ['Enter', 'Escape'],
      },
      {
        type: 'keys',
        label: '对话框里的下拉：再按 Esc 关对话框',
        target: DIALOG_COMBO,
        keys: ['Enter', 'Escape', 'Escape'],
        read: 'state',
        // 按人的速度：antd 的下拉收起动画（约 0.2 秒）没放完时，第二次 Esc 还算在下拉头上
        gap: 300,
      },
      // 焦点锁在对话框里：从关闭按钮按 10 次 Tab（对话框里一共 10 个停靠点），回到关闭按钮
      {
        type: 'keys',
        label: '焦点锁在对话框里',
        target: CLOSE,
        keys: ['Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Tab'],
      },
      // 在「备注」里逐字打字（像拼音输入法一个字一个字上屏）：焦点要一直在备注里
      {
        type: 'keys',
        label: '在备注里逐字打字',
        target: { selector: '[data-region=dialog-form] textarea' },
        keys: [{ text: '下' }, { text: '周' }, { text: '回' }, { text: '访' }],
        gap: 150,
      },
      { type: 'click', label: '点保存', target: SAVE },
      { type: 'click', label: '点关闭按钮', target: CLOSE },
    );
  if (state === 'invalid') checks.push({ type: 'click', label: '出错时点保存', target: SAVE });
  return checks;
}

export const customersScene: Scene = {
  id: 'customers',
  name: '客户列表',
  combos: COMBOS,
  open(combo) {
    const state = combo.state && combo.state in STATES ? combo.state : 'default';
    const shared = combo.shared === 'yes';
    const modal = state === 'dialog' || state === 'invalid';
    /**
     * 对话框开着的状态：检查页上任何时候最多只开一个组件库的对话框（见 solo），一打开页面一个都不开；
     * 演示页（shared）照常打开。
     */
    let soloKit: string | null = null;
    const make = (kit: string) => {
      const base = createCustomerListState();
      const initial = STATES[state]!(base);
      const list = createCustomerListController(
        modal && !shared && soloKit !== kit ? { ...initial, dialog: null } : initial,
        { latency: shared ? 600 : 0 },
      );
      return { list, admin: createAdminController() };
    };
    let controllers = new Map<string, { list: CustomerListController; admin: AdminController }>();
    const of = (kit: string) => {
      const id = shared ? '*' : kit;
      if (!controllers.has(id)) controllers.set(id, make(id));
      return controllers.get(id)!;
    };
    const create = (list: CustomerListController) => (key: string) => {
      if (key === 'create') list.send({ type: 'edit', key: null });
    };
    return {
      root: '.mh-root',
      checks: checksFor(combo.spec ?? MONO, state),
      react: (kit) => {
        const { list, admin } = of(kit);
        return (
          <div className="ex-list">
            <AdminFrame controller={admin} onAction={create(list)}>
              <CustomerList controller={list} />
            </AdminFrame>
          </div>
        );
      },
      // 控制器是普通对象，不需要 Vue 把它变成响应式代理
      vue: (kit) => {
        const { list, admin } = of(kit);
        return h('div', { class: 'ex-list' }, [
          h(
            VueAdminFrame,
            { controller: markRaw(admin), onAction: create(list) },
            { default: () => h(VueCustomerList, { controller: markRaw(list) }) },
          ),
        ]);
      },
      enter: async () => {},
      renew() {
        for (const { list } of controllers.values()) list.dispose();
        controllers = new Map();
      },
      dispose() {
        for (const { list } of controllers.values()) list.dispose();
      },
      // 对话框开着的状态：和一个组件库交互、量它的样子时，只打开它的对话框（几个模态对话框会互相抢焦点）
      ...(modal
        ? {
            solo(kit: string | null) {
              soloKit = kit;
            },
          }
        : {}),
      snapshot(kit) {
        const s = of(kit).list.getSnapshot();
        return {
          draft: s.draft,
          filters: s.filters,
          sort: s.sort,
          page: s.page,
          selected: [...s.selected].sort(),
          status: s.status,
          dialog: s.dialog && { key: s.dialog.key, form: s.dialog.form, errors: s.dialog.errors },
          lastAction: s.lastAction,
          important: s.customers.filter((c) => c.important).map((c) => c.key),
        };
      },
    };
  },
};
