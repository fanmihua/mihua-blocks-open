import { h, markRaw } from 'vue';
import { createAdminController, type AdminController } from '@mihua/core';
import { AdminFrame } from '@mihua/react';
import { AdminFrame as VueAdminFrame } from '@mihua/vue';
import type { Check, Target } from '@mihua/audit/page/types';
import { SPECS } from '../../specs';
import type { Scene } from '../types';
import './admin.css';

/**
 * 场景：后台页面框架（顶栏、可收起的侧栏、面包屑、页头；内容区是占位；整页的客户列表在 customers 场景）。
 * 业务状态（侧栏收起没有、选中哪一项、哪些子菜单展开）在控制器里：
 * - 检查页：每个组件库一个控制器。一个组件库的副作用（比如挂载时自己发「展开」事件）只记在它自己头上，
 *   报告指得准；
 * - 演示页（组合里带 shared: 'yes'）：所有组件库共用一个，换组件库、换外观、换规范都不会丢。
 * 组合：规范 × 侧栏（展开 / 收起）。按区域量：header、sider、breadcrumb、page-head、content。
 */

const SPEC_IDS = Object.keys(SPECS);
export const SIDER_STATES = ['expanded', 'collapsed'] as const;

/** 侧栏里第几个看得见的菜单项（展开时：工作台、客户管理、客户列表、线索池、联系人、销售推进、经营分析、系统设置）。 */
const menuItem = (index: number): Target => ({
  selector: '[data-region=sider] [role=menuitem]',
  index,
});
const USER: Target = { selector: '.mh-admin__user' };

function checksFor(spec: string, sider: string): Check[] {
  const collapsed = sider === 'collapsed';
  const checks: Check[] = [
    { type: 'look' },
    { type: 'hover', label: '菜单项', target: menuItem(0) },
    { type: 'hover', label: '子菜单标题', target: menuItem(1) },
    { type: 'hover', label: '面包屑链接', target: { part: 'breadcrumbLink' } },
    // 用户菜单：真实点击打开，量弹层和每一项，再按 Esc，核对收起
    { type: 'popup', label: '用户菜单', trigger: USER, popup: 'dropdown', item: 'dropdownItem' },
  ];
  // 侧栏收起以后：鼠标悬停在有子菜单的图标上，弹出子菜单；悬停在没有子菜单的图标上，显示名字
  if (collapsed)
    checks.push(
      {
        type: 'popup',
        label: '收起后的子菜单',
        open: 'hover',
        trigger: menuItem(1),
        popup: 'menuPopup',
        item: 'menuItem',
      },
      {
        type: 'popup',
        label: '收起后的文字提示',
        open: 'hover',
        trigger: menuItem(0),
        popup: 'tooltip',
      },
    );
  // 键盘和点击的行为和规范无关，只核对第一套规范
  if (spec !== SPEC_IDS[0]) return checks;
  checks.push(
    {
      type: 'focus',
      targets: [
        { selector: '[data-region=sider] [role=menuitem]', part: 'menuItem' },
        { selector: '[data-region=breadcrumb] :is(a[href], [role=link])', part: 'breadcrumbLink' },
      ],
    },
    { type: 'tabOrder' },
    { type: 'click', label: '点击菜单项', target: menuItem(0) },
  );
  if (collapsed) return checks;
  checks.push(
    { type: 'click', label: '点击子菜单标题', target: menuItem(5) },
    { type: 'click', label: '点击子菜单里的项', target: menuItem(4) },
    { type: 'click', label: '点击面包屑', target: { part: 'breadcrumbLink' } },
    { type: 'keys', label: '回车展开子菜单', target: menuItem(5), keys: ['Enter'] },
    { type: 'keys', label: '空格收起子菜单', target: menuItem(1), keys: ['Space'] },
    { type: 'keys', label: '回车选中菜单项', target: menuItem(3), keys: ['Enter'] },
    { type: 'keys', label: '空格选中菜单项', target: menuItem(0), keys: ['Space'] },
    {
      type: 'keys',
      label: '用户菜单：回车打开、↓、回车选中',
      target: USER,
      keys: ['Enter', 'ArrowDown', 'Enter'],
    },
    { type: 'keys', label: '用户菜单：Esc 收起', target: USER, keys: ['Enter', 'Escape'] },
    {
      type: 'keys',
      label: '面包屑：回车',
      target: { part: 'breadcrumbLink' },
      keys: ['Enter'],
      read: 'state',
    },
  );
  return checks;
}

export const adminScene: Scene = {
  id: 'admin',
  name: '后台页面框架',
  combos: SPEC_IDS.flatMap((spec) => SIDER_STATES.map((sider) => ({ spec, sider }))),
  open(combo) {
    const sider = combo.sider ?? 'expanded';
    const shared = combo.shared === 'yes';
    const make = () => createAdminController({ collapsed: sider === 'collapsed' });
    let controllers = new Map<string, AdminController>();
    const controllerOf = (kit: string) => {
      const id = shared ? '*' : kit;
      if (!controllers.has(id)) controllers.set(id, make());
      return controllers.get(id)!;
    };
    return {
      root: '.mh-admin',
      checks: checksFor(combo.spec ?? SPEC_IDS[0]!, sider),
      react: (kit) => (
        <div className="ex-admin">
          <AdminFrame controller={controllerOf(kit)} />
        </div>
      ),
      // 控制器是普通对象，不需要 Vue 把它变成响应式代理
      vue: (kit) =>
        h('div', { class: 'ex-admin' }, [
          h(VueAdminFrame, { controller: markRaw(controllerOf(kit)) }),
        ]),
      enter: async () => {},
      renew() {
        controllers = new Map();
      },
      dispose() {},
      snapshot(kit) {
        const s = controllerOf(kit).getSnapshot();
        return { ...s, open: [...s.open].sort() };
      },
    };
  },
};
