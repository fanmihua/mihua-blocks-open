import type { BreadcrumbItem, DropdownItem, NavItem } from '@mihua/spec';

/**
 * 后台页面框架的结构：有哪些区域、导航项、文案。React 和 Vue 的视图都只读这一份，
 * 所以两个框架渲染出来的区域、顺序、文字完全一样。
 *
 * 页面布局（顶栏、侧栏、内容区怎么排、间距多少）归结构层，写在 core/styles/admin.css，
 * 不用组件库的 Layout；导航菜单、面包屑、下拉菜单、头像、徽标这些控件由套件交给组件库画。
 *
 * 结构取材于一个基于 Ant Design 的客户经营后台（顶栏 + 侧栏），精简成一个案例页。
 */
export interface AdminPageInfo {
  title: string;
  description: string;
}

export interface AdminFrameStructure {
  brand: { mark: string; name: string };
  /** 侧栏导航。 */
  nav: NavItem[];
  /** 首页：面包屑的第一项回到这里。 */
  home: { key: string; label: string };
  /** 每个能选中的菜单项对应的页面标题和说明。 */
  pages: Record<string, AdminPageInfo>;
  user: { name: string; avatar: string };
  userMenu: DropdownItem[];
  /** 未读通知数（徽标）。 */
  unread: number;
  /** 页头的操作按钮，从左到右。 */
  actions: Array<{ key: string; label: string; variant: 'primary' | 'secondary' }>;
  text: {
    nav: string;
    breadcrumb: string;
    userMenu: string;
    collapse: string;
    expand: string;
    notifications: (unread: number) => string;
    placeholder: (title: string) => string;
  };
}

export const ADMIN_FRAME: AdminFrameStructure = {
  brand: { mark: 'M', name: '客户经营平台' },
  nav: [
    { key: 'workbench', label: '工作台', icon: 'home' },
    {
      key: 'customers',
      label: '客户管理',
      icon: 'users',
      children: [
        { key: 'customer-list', label: '客户列表' },
        { key: 'lead-pool', label: '线索池' },
        { key: 'contacts', label: '联系人' },
      ],
    },
    {
      key: 'sales',
      label: '销售推进',
      icon: 'trending-up',
      children: [
        { key: 'pipeline', label: '商机管道' },
        { key: 'contracts', label: '合同与续约' },
      ],
    },
    { key: 'analytics', label: '经营分析', icon: 'chart' },
    { key: 'settings', label: '系统设置', icon: 'settings' },
  ],
  home: { key: 'workbench', label: '首页' },
  pages: {
    workbench: { title: '工作台', description: '今天要跟进的客户、待办和提醒。' },
    'customer-list': {
      title: '客户列表',
      description: '统一查看客户资料、归属和跟进状态，支持筛选、批量操作和编辑。',
    },
    'lead-pool': { title: '线索池', description: '新进入的线索，按来源和响应时限分配。' },
    contacts: { title: '联系人', description: '客户的联系人和他们的角色。' },
    pipeline: { title: '商机管道', description: '按阶段查看商机和预计成交金额。' },
    contracts: { title: '合同与续约', description: '合同到期和续约提醒。' },
    analytics: { title: '经营分析', description: '客户、商机和回款的趋势。' },
    settings: { title: '系统设置', description: '组织、角色和业务规则。' },
  },
  user: { name: '顾清和', avatar: '顾' },
  userMenu: [
    { key: 'profile', label: '个人中心', icon: 'user' },
    { key: 'preferences', label: '账号设置', icon: 'settings' },
    { key: 'sign-out', label: '退出登录', icon: 'log-out', danger: true, divided: true },
  ],
  unread: 5,
  actions: [
    { key: 'export', label: '导出', variant: 'secondary' },
    { key: 'create', label: '新建客户', variant: 'primary' },
  ],
  text: {
    nav: '主导航',
    breadcrumb: '当前位置',
    userMenu: '账户菜单',
    collapse: '收起侧栏',
    expand: '展开侧栏',
    notifications: (unread) => (unread ? `通知，${unread} 条未读` : '通知'),
    placeholder: (title) => `内容区：${title}`,
  },
};

/** 一个菜单项所在的子菜单（一级项返回 null）。 */
export function parentOf(nav: NavItem[], key: string): NavItem | null {
  return nav.find((item) => item.children?.some((child) => child.key === key)) ?? null;
}

/** 菜单项本身（找不到返回 null）。 */
export function navItemOf(nav: NavItem[], key: string): NavItem | null {
  for (const item of nav) {
    if (item.key === key) return item;
    const child = item.children?.find((c) => c.key === key);
    if (child) return child;
  }
  return null;
}

/** 面包屑：首页 / 子菜单 / 当前页。首页能点；子菜单本身没有页面，不能点；最后一项是当前页。 */
export function breadcrumbOf(frame: AdminFrameStructure, selected: string): BreadcrumbItem[] {
  const item = navItemOf(frame.nav, selected);
  const parent = parentOf(frame.nav, selected);
  const trail: BreadcrumbItem[] = [{ key: frame.home.key, label: frame.home.label, link: true }];
  if (parent) trail.push({ key: parent.key, label: parent.label });
  if (item && item.key !== frame.home.key) trail.push({ key: item.key, label: item.label });
  else trail.push({ key: frame.home.key, label: navItemOf(frame.nav, frame.home.key)!.label });
  return trail;
}
