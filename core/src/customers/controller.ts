import type { TableRow, TableSort } from '@mihua/spec';
import { createCustomers, type Customer, type CustomerLevel, type CustomerStatus } from './data';
import {
  CUSTOMER_LIST,
  EMPTY_FILTERS,
  customerRow,
  filterCustomers,
  type CustomerFilters,
  type CustomerListStructure,
} from './list';

/**
 * 客户列表的业务状态：筛选条件、排序、页码、勾选的行、加载 / 出错、编辑对话框里的表单。
 * 纯 TypeScript，React 用 useSyncExternalStore 订阅，Vue 用 shallowRef 订阅；状态只有一份，
 * 所以换组件库、换外观、换框架都不会丢。表格、分页、对话框这些控件自己不存这些。
 */
export interface CustomerForm {
  name: string;
  phone: string;
  status: CustomerStatus;
  level: CustomerLevel;
  owner: string;
  note: string;
  important: boolean;
}

export type CustomerFormErrors = Partial<Record<'name' | 'phone' | 'note', string>>;

export interface CustomerDialog {
  /** 编辑哪位客户；新建是 null。 */
  key: string | null;
  form: CustomerForm;
  errors: CustomerFormErrors;
  /** 点过保存：之后改一个字就重新校验。 */
  submitted: boolean;
}

export interface CustomerListState {
  customers: Customer[];
  /** 筛选栏里正在填的（点查询才生效）。 */
  draft: CustomerFilters;
  /** 已经查询的筛选条件。 */
  filters: CustomerFilters;
  sort: TableSort | null;
  page: number;
  /** 勾选的行（客户编号），可以跨页。 */
  selected: string[];
  status: 'ready' | 'loading' | 'error';
  dialog: CustomerDialog | null;
  /** 最后一次点的操作（跟进、保存……），没有点过是 null。 */
  lastAction: string | null;
}

export type CustomerListEvent =
  | { type: 'draft'; patch: Partial<CustomerFilters> }
  | { type: 'query' }
  | { type: 'reset' }
  | { type: 'retry' }
  | { type: 'sort'; sort: TableSort | null }
  | { type: 'page'; page: number }
  | { type: 'select'; keys: string[] }
  | { type: 'important'; key: string; value: boolean }
  | { type: 'edit'; key: string | null }
  | { type: 'form'; patch: Partial<CustomerForm> }
  | { type: 'save' }
  | { type: 'close' }
  | { type: 'action'; key: string };

export interface CustomerListController {
  readonly list: CustomerListStructure;
  getSnapshot(): CustomerListState;
  subscribe(listener: () => void): () => void;
  send(event: CustomerListEvent): void;
  dispose(): void;
}

export interface CustomerListOptions {
  /** 点查询以后多久出结果（毫秒）。0：马上出结果，不显示加载中（检查页用，结果不受时间影响）。 */
  latency?: number;
}

/** 关键词是这个时模拟「加载失败」（演示出错的样子）。 */
export const FAILING_KEYWORD = '出错';

const MAX_NAME = 30;
const MAX_NOTE = 200;

export function validateCustomer(form: CustomerForm): CustomerFormErrors {
  const errors: CustomerFormErrors = {};
  const name = form.name.trim();
  if (!name) errors.name = '请输入客户名称';
  else if (name.length > MAX_NAME) errors.name = `客户名称最多 ${MAX_NAME} 个字`;
  if (form.phone && !/^1\d{10}$/.test(form.phone)) errors.phone = '请输入 11 位手机号';
  if (form.note.length > MAX_NOTE) errors.note = `备注最多 ${MAX_NOTE} 个字`;
  return errors;
}

const blankForm = (): CustomerForm => ({
  name: '',
  phone: '',
  status: 'potential',
  level: 'B',
  owner: CUSTOMER_LIST.owners[0]!,
  note: '',
  important: false,
});

const formOf = (c: Customer): CustomerForm => ({
  name: c.name,
  phone: c.phone,
  status: c.status,
  level: c.level,
  owner: c.owner,
  note: c.note,
  important: c.important,
});

export function createCustomerListState(
  initial: Partial<CustomerListState> = {},
): CustomerListState {
  return {
    customers: createCustomers(),
    draft: EMPTY_FILTERS,
    filters: EMPTY_FILTERS,
    sort: null,
    page: 1,
    selected: [],
    status: 'ready',
    dialog: null,
    lastAction: null,
    ...initial,
  };
}

/** 这一页的行、一共多少条、一共几页。 */
export function customerPage(state: CustomerListState, list = CUSTOMER_LIST) {
  const all =
    state.status === 'error' ? [] : filterCustomers(state.customers, state.filters, state.sort);
  const pageCount = Math.max(1, Math.ceil(all.length / list.pageSize));
  const page = Math.min(state.page, pageCount);
  const rows: TableRow[] = all
    .slice((page - 1) * list.pageSize, page * list.pageSize)
    .map(customerRow);
  return { rows, total: all.length, page, pageCount };
}

/** 打开对话框：编辑一位客户（key），或者新建（null）。 */
export function openDialog(state: CustomerListState, key: string | null): CustomerDialog {
  const customer = key ? state.customers.find((c) => c.key === key) : undefined;
  return {
    key: customer?.key ?? null,
    form: customer ? formOf(customer) : blankForm(),
    errors: {},
    submitted: false,
  };
}

export function createCustomerListController(
  initial: Partial<CustomerListState> = {},
  { latency = 600 }: CustomerListOptions = {},
): CustomerListController {
  let state = createCustomerListState(initial);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const set = (patch: Partial<CustomerListState>) => {
    state = { ...state, ...patch };
    for (const listener of listeners) listener();
  };
  /** 按 filters 查询：显示加载中，latency 以后出结果。 */
  const load = (filters: CustomerFilters) => {
    clearTimeout(timer);
    const done = () =>
      set({ status: filters.keyword.trim() === FAILING_KEYWORD ? 'error' : 'ready' });
    set({ filters, page: 1, selected: [], status: latency ? 'loading' : state.status });
    if (latency) timer = setTimeout(done, latency);
    else done();
  };
  const patchForm = (patch: Partial<CustomerForm>) => {
    if (!state.dialog) return;
    const form = { ...state.dialog.form, ...patch };
    const errors = state.dialog.submitted ? validateCustomer(form) : state.dialog.errors;
    set({ dialog: { ...state.dialog, form, errors } });
  };
  const save = () => {
    const dialog = state.dialog;
    if (!dialog) return;
    const errors = validateCustomer(dialog.form);
    if (Object.keys(errors).length) {
      return set({ dialog: { ...dialog, errors, submitted: true } });
    }
    const form = { ...dialog.form, name: dialog.form.name.trim() };
    if (dialog.key) {
      const customers = state.customers.map((c) => (c.key === dialog.key ? { ...c, ...form } : c));
      return set({ customers, dialog: null, lastAction: `save:${dialog.key}` });
    }
    const key = `KH-${String(state.customers.length + 1).padStart(4, '0')}`;
    const created: Customer = {
      key,
      ...form,
      region: '—',
      industry: '—',
      amount: 0,
      lastActivity: new Date().toISOString().slice(0, 10),
    };
    set({ customers: [created, ...state.customers], dialog: null, lastAction: `create:${key}` });
  };

  return {
    list: CUSTOMER_LIST,
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    send(event) {
      switch (event.type) {
        case 'draft':
          return set({ draft: { ...state.draft, ...event.patch } });
        case 'query':
          return load(state.draft);
        case 'reset':
          set({ draft: EMPTY_FILTERS });
          return load(EMPTY_FILTERS);
        case 'retry':
          return load(state.filters);
        case 'sort':
          // 换了排序回到第一页
          return set({ sort: event.sort, page: 1 });
        case 'page':
          return event.page === state.page ? undefined : set({ page: event.page });
        case 'select':
          return set({ selected: [...event.keys] });
        case 'important':
          return set({
            customers: state.customers.map((c) =>
              c.key === event.key ? { ...c, important: event.value } : c,
            ),
          });
        case 'edit':
          return set({ dialog: openDialog(state, event.key) });
        case 'form':
          return patchForm(event.patch);
        case 'save':
          return save();
        case 'close':
          return state.dialog ? set({ dialog: null }) : undefined;
        case 'action':
          return set({ lastAction: event.key });
      }
    },
    dispose() {
      clearTimeout(timer);
    },
  };
}
