import type { TableColumn, TableRow, TableSort, TagTone } from '@mihua/spec';
import { OWNERS, type Customer, type CustomerLevel, type CustomerStatus } from './data';

/**
 * 客户列表的结构：筛选栏、表格的列、对话框的表单、文案。React 和 Vue 的视图都只读这一份。
 * 取材于一个基于 Ant Design 的客户经营后台的客户列表（精简：一张表、一个对话框）。
 */
export const CUSTOMER_LIST = {
  statuses: [
    { value: 'potential', label: '潜在', tone: 'default' },
    { value: 'active', label: '活跃', tone: 'success' },
    { value: 'silent', label: '沉默', tone: 'warning' },
    { value: 'lost', label: '流失', tone: 'danger' },
  ] satisfies Array<{ value: CustomerStatus; label: string; tone: TagTone }>,
  levels: [
    { value: 'A', label: 'A 级' },
    { value: 'B', label: 'B 级' },
    { value: 'C', label: 'C 级' },
  ] satisfies Array<{ value: CustomerLevel; label: string }>,
  owners: OWNERS,
  /** 表格的列（勾选列由表格自己加）。没给宽度的「客户名称」分剩下的宽度。 */
  columns: [
    { key: 'name', title: '客户名称' },
    { key: 'status', title: '状态', width: 88 },
    { key: 'owner', title: '负责人', width: 96 },
    { key: 'amount', title: '年度金额', width: 128, align: 'right', sortable: true },
    { key: 'lastActivity', title: '最近跟进', width: 120, sortable: true },
    { key: 'important', title: '重点客户', width: 96 },
    { key: 'actions', title: '操作', width: 120 },
  ] satisfies TableColumn[],
  pageSize: 10,
  text: {
    keyword: '客户名称 / 负责人',
    keywordLabel: '关键词',
    status: '状态',
    allStatuses: '全部状态',
    dateRange: '最近跟进',
    rangeStart: '开始日期',
    rangeEnd: '结束日期',
    rangeSeparator: '至',
    query: '查询',
    reset: '重置',
    table: '客户列表',
    selectAll: '选择这一页的全部客户',
    select: (name: string) => `选择 ${name}`,
    important: (name: string) => `重点客户：${name}`,
    edit: '编辑',
    follow: '跟进',
    editLabel: (name: string) => `编辑 ${name}`,
    followLabel: (name: string) => `跟进 ${name}`,
    count: (total: number) => `共 ${total} 位客户`,
    selected: (count: number) => `已选择 ${count} 位客户`,
    clearSelection: '取消选择',
    pagination: '分页',
    total: (total: number) => `共 ${total} 条`,
    page: (page: number) => `第 ${page} 页`,
    prev: '上一页',
    next: '下一页',
    emptyTitle: '没有符合条件的客户',
    emptyDescription: '换个筛选条件试试，或者重置筛选。',
    errorTitle: '客户列表加载失败',
    errorDescription: '网络开了小差，请重试。',
    retry: '重试',
    loading: '加载中',
    createTitle: '新建客户',
    editTitle: '编辑客户',
    cancel: '取消',
    save: '保存',
    close: '关闭',
    fields: {
      name: '客户名称',
      phone: '联系电话',
      status: '状态',
      level: '客户等级',
      owner: '负责人',
      note: '备注',
      important: '重点客户',
    },
    namePlaceholder: '请输入客户名称',
    phonePlaceholder: '11 位手机号',
    notePlaceholder: '最多 200 个字',
  },
};

export type CustomerListStructure = typeof CUSTOMER_LIST;

/**
 * 筛选条件。status 是 all 时不按状态筛（不用空字符串：Radix 的 Select 不许选项的值是空字符串）；
 * range 是最近跟进的起止日期（YYYY-MM-DD，含两头）。
 */
export interface CustomerFilters {
  keyword: string;
  status: CustomerStatus | 'all';
  range: [string, string] | null;
}

export const EMPTY_FILTERS: CustomerFilters = { keyword: '', status: 'all', range: null };

/** 金额：¥ 1,280,000。 */
export const formatAmount = (amount: number) => `¥ ${amount.toLocaleString('en-US')}`;

/** 一行客户交给表格的样子（格子里画什么由视图决定）。 */
export const customerRow = (c: Customer): TableRow => ({ ...c });

/** 按筛选条件过滤、按排序排好。 */
export function filterCustomers(
  customers: Customer[],
  filters: CustomerFilters,
  sort: TableSort | null,
): Customer[] {
  const keyword = filters.keyword.trim();
  const rows = customers.filter(
    (c) =>
      (!keyword || c.name.includes(keyword) || c.owner.includes(keyword)) &&
      (filters.status === 'all' || c.status === filters.status) &&
      (!filters.range ||
        (c.lastActivity >= filters.range[0] && c.lastActivity <= filters.range[1])),
  );
  if (!sort) return rows;
  const key = sort.key as 'amount' | 'lastActivity';
  const sign = sort.order === 'asc' ? 1 : -1;
  // 同样大的按客户编号排，每次结果一样
  return [...rows].sort((a, b) =>
    a[key] < b[key] ? -sign : a[key] > b[key] ? sign : a.key < b.key ? -1 : 1,
  );
}
