import { h, markRaw } from 'vue';
import {
  createLoginController,
  createLoginDemoAdapter,
  type LoginController,
  type LoginVariant,
} from '@mihua/core';
import { Login } from '@mihua/react';
import { Login as VueLogin } from '@mihua/vue';
import type { Check } from '@mihua/audit/page/types';
import { SPECS } from '../specs';
import type { Scene } from './types';

/**
 * 场景：登录框。所有组件库共用一个控制器（业务状态只有一份），每种布局核对几种状态。
 */

/** 每种布局要核对的状态。 */
export const LOGIN_STATES: Record<LoginVariant, string[]> = {
  centered: ['initial', 'account', 'errors', 'filled', 'loading', 'qr'],
  split: ['initial', 'account', 'errors'],
  step: ['initial', 'errors', 'credentials'],
  social: ['initial', 'errors'],
  qr: ['initial', 'phone', 'errors'],
};

const SPEC_IDS = Object.keys(SPECS);

function makeController(variant: LoginVariant, state: string): LoginController {
  const demo = createLoginDemoAdapter({ locale: 'zh', latency: 0 });
  // 「提交中」要停在那一刻：认证永远不返回
  const adapter =
    state === 'loading' ? { ...demo, authenticate: () => new Promise<never>(() => {}) } : demo;
  return createLoginController({ variant }, adapter);
}

async function enterState(c: LoginController, variant: LoginVariant, state: string) {
  const fill = async () => {
    await c.send({ type: 'field', field: 'identity', value: '13800138000' });
    await c.send({ type: 'field', field: 'code', value: '123456' });
    await c.send({ type: 'agreement', value: true });
  };
  if (state === 'account') await c.send({ type: 'method', method: 'account' });
  if (state === 'qr') await c.send({ type: 'method', method: 'qr' });
  if (state === 'phone') await c.send({ type: 'method', method: 'phone' });
  if (state === 'errors') {
    if (variant === 'qr') await c.send({ type: 'method', method: 'phone' });
    void c.send({ type: 'submit' });
  }
  if (state === 'filled') await fill();
  if (state === 'loading') {
    await fill();
    void c.send({ type: 'submit' });
  }
  if (state === 'credentials') {
    await c.send({ type: 'field', field: 'identity', value: '13800138000' });
    await c.send({ type: 'next' });
  }
}

/** 每个组合做哪些检查：样子每次都量；交互只在初始状态核对，键盘行为和规范无关，只核对第一套规范。 */
function checksFor(spec: string, state: string): Check[] {
  const checks: Check[] = [{ type: 'look' }];
  if (state !== 'initial') return checks;
  checks.push(
    // 聚焦：每个输入框的边线和外圈
    { type: 'focus', targets: [{ selector: 'input[name]:not([type=checkbox])', part: 'field' }] },
    // 下拉：真实点击打开，量取，再按 Esc 收起
    { type: 'popup', label: '下拉', trigger: { part: 'select' }, popup: 'popup', item: 'option' },
    // 悬停：主按钮、次要按钮、文字链接
    { type: 'hover', label: '主按钮', target: { selector: '[data-region=submit] button' } },
    { type: 'hover', label: '次要按钮', target: { selector: '[data-region=providers] button' } },
    { type: 'hover', label: '文字链接', target: { selector: '.mh-login__footnote button' } },
  );
  if (spec !== SPEC_IDS[0]) return checks;
  checks.push(
    { type: 'tabOrder' },
    // 方向键切标签：聚焦当前标签，按 →
    {
      type: 'keys',
      label: '方向键切标签',
      target: { selector: '[role=tab][aria-selected=true]' },
      keys: ['ArrowRight'],
    },
    // 回车提交：在最后一个输入框里按回车
    {
      type: 'keys',
      label: '回车提交',
      target: { selector: '.mh-login input[name]:not([type=checkbox])', index: 'last' },
      keys: ['Enter'],
      read: 'state',
    },
  );
  return checks;
}

export const loginScene: Scene = {
  id: 'login',
  name: '登录框',
  combos: SPEC_IDS.flatMap((spec) =>
    Object.entries(LOGIN_STATES).flatMap(([variant, states]) =>
      states.map((state) => ({ spec, variant, state })),
    ),
  ),
  open(combo) {
    const variant = (combo.variant ?? 'centered') as LoginVariant;
    const state = combo.state ?? 'initial';
    let controller = makeController(variant, state);
    return {
      root: '.mh-login',
      checks: checksFor(combo.spec ?? SPEC_IDS[0]!, state),
      react: () => <Login controller={controller} />,
      // 控制器是普通对象，不需要 Vue 把它变成响应式代理
      vue: () => h(VueLogin, { controller: markRaw(controller) }),
      enter: () => enterState(controller, variant, state),
      renew() {
        controller.dispose();
        controller = makeController(variant, state);
      },
      dispose: () => controller.dispose(),
      snapshot() {
        const s = controller.getSnapshot();
        return {
          method: s.method,
          status: s.status,
          errors: Object.keys(s.errors).sort(),
          stage: s.stage,
        };
      },
    };
  },
};
