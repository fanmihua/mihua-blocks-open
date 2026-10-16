// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MihuaProvider } from '../index';
import type { Kit } from '../kit/types';
import { antdKit } from './antd';
import { arcoKit } from './arco';
import { shadcnKit } from './shadcn';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const OPTIONS = [
  { value: 'a', label: '甲' },
  { value: 'b', label: '乙' },
];

const NAV = [
  { key: 'home', label: '工作台', icon: 'home' as const },
  {
    key: 'group',
    label: '客户管理',
    icon: 'users' as const,
    children: [{ key: 'list', label: '客户列表' }],
  },
];

/** 演示页切换外观时，同一批控件在「对齐」和「原生」之间来回渲染，Hook 的调用顺序必须每次一样。 */
function controls(kit: Kit) {
  const {
    Button,
    Input,
    Select,
    NavMenu,
    Breadcrumb,
    Dropdown,
    Avatar,
    Badge,
    Table,
    Pagination,
    Tag,
  } = kit;
  return (
    <>
      <Button variant="primary">登录</Button>
      <Input type="password" value="" onChange={() => {}} aria-label="密码" />
      <Select value="a" onChange={() => {}} options={OPTIONS} aria-label="状态" />
      <NavMenu
        items={NAV}
        selected="list"
        onSelect={() => {}}
        open={['group']}
        onOpenChange={() => {}}
        aria-label="导航"
      />
      <Breadcrumb
        items={[
          { key: 'home', label: '首页', link: true },
          { key: 'list', label: '客户列表' },
        ]}
        onNavigate={() => {}}
        aria-label="当前位置"
      />
      <Dropdown
        items={[{ key: 'a', label: '个人中心', icon: 'user' }]}
        onSelect={() => {}}
        aria-label="账户菜单"
      >
        <button type="button">
          <Avatar text="顾" />
        </button>
      </Dropdown>
      <Badge count={5}>
        <span>铃铛</span>
      </Badge>
      <Table
        columns={[
          { key: 'name', title: '客户名称' },
          { key: 'amount', title: '年度金额', sortable: true, align: 'right' },
        ]}
        rows={[{ key: 'KH-1', name: '甲', amount: 1 }]}
        renderCell={(row, column) => String(row[column.key])}
        selected={[]}
        onSelectedChange={() => {}}
        sort={{ key: 'amount', order: 'asc' }}
        onSortChange={() => {}}
        empty="没有"
        selectLabel={(row) => `选择 ${row.key}`}
        selectAllLabel="全选"
        aria-label="客户列表"
      />
      <Pagination
        page={1}
        pageSize={10}
        total={50}
        onChange={() => {}}
        totalText={(total) => `共 ${total} 条`}
        pageLabel={(page) => `第 ${page} 页`}
        prevLabel="上一页"
        nextLabel="下一页"
        aria-label="分页"
      />
      <Tag tone="success">活跃</Tag>
    </>
  );
}

describe.each([antdKit, arcoKit, shadcnKit])('$name: switching the look', (kit) => {
  it('calls hooks in the same order', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(<MihuaProvider kit={kit}>{controls(kit)}</MihuaProvider>);
    // 对齐 → 原生 → 对齐 → 只设主题 → 对齐
    for (const look of [{ native: true }, {}, { align: false }, {}])
      rerender(
        <MihuaProvider kit={kit} {...look}>
          {controls(kit)}
        </MihuaProvider>,
      );
    const hookErrors = errors.mock.calls.filter((args) => String(args[0]).includes('Hooks'));
    expect(hookErrors).toEqual([]);
  });
});
