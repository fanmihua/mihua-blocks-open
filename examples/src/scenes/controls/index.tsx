import { h } from 'vue';
import type { Check } from '@mihua/audit/page/types';
import { SPECS } from '../../specs';
import type { Scene } from '../types';
import { ControlsView } from './ControlsView';
import { ControlsView as VueControlsView } from './ControlsViewVue';
import { INITIAL, createStore, type ControlsState, type Store } from './state';
import './controls.css';

/**
 * 场景：控件样张。每种基础控件、默认和大号两档尺寸各摆一行，用来核对「默认尺寸」那一档
 * （后台页面用默认尺寸，登录框是大号），以后新加的控件也先放到这里核对。
 * 每个组件库各有一份状态。
 */

const SPEC_IDS = Object.keys(SPECS);

function checksFor(spec: string): Check[] {
  const checks: Check[] = [
    { type: 'look' },
    {
      type: 'focus',
      targets: [
        { selector: 'input[name]', part: 'field' },
        { selector: '[role=switch]', part: 'switch' },
      ],
    },
    {
      type: 'popup',
      label: '默认下拉',
      trigger: { part: 'select', index: 0 },
      popup: 'popup',
      item: 'option',
    },
    {
      type: 'popup',
      label: '大号下拉',
      trigger: { part: 'select', index: 1 },
      popup: 'popup',
      item: 'option',
    },
    { type: 'hover', label: '默认主按钮', target: { selector: '[data-region=button] button' } },
    {
      type: 'hover',
      label: '默认次要按钮',
      target: { selector: '[data-region=button] button', index: 1 },
    },
    { type: 'hover', label: '开关（开）', target: { part: 'switch', index: 0 } },
    { type: 'hover', label: '开关（关）', target: { part: 'switch', index: 1 } },
  ];
  // 键盘和点击的行为和规范无关，只核对第一套规范
  if (spec === SPEC_IDS[0])
    checks.push(
      { type: 'tabOrder' },
      { type: 'click', label: '点击开关', target: { part: 'switch', index: 1 } },
      {
        type: 'keys',
        label: '空格切换开关',
        target: { selector: '[role=switch]', index: 0 },
        keys: ['Space'],
      },
      {
        type: 'keys',
        label: '回车切换开关',
        target: { selector: '[role=switch]', index: 0 },
        keys: ['Enter'],
      },
    );
  return checks;
}

export const controlsScene: Scene = {
  id: 'controls',
  name: '控件样张',
  combos: SPEC_IDS.map((spec) => ({ spec })),
  open(combo) {
    let stores = new Map<string, Store<ControlsState>>();
    const storeOf = (kit: string) => {
      if (!stores.has(kit)) stores.set(kit, createStore(INITIAL));
      return stores.get(kit)!;
    };
    return {
      root: '.ex-controls',
      checks: checksFor(combo.spec ?? SPEC_IDS[0]!),
      react: (kit) => <ControlsView store={storeOf(kit)} />,
      vue: (kit) => h(VueControlsView, { store: storeOf(kit) }),
      enter: async () => {},
      renew() {
        stores = new Map();
      },
      snapshot: (kit) => storeOf(kit).get(),
      dispose() {},
    };
  },
};
