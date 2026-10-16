import { useMemo, useSyncExternalStore } from 'react';
import {
  createLoginController,
  createLoginDemoAdapter,
  type LoginAdapter,
  type LoginConfigInput,
  type LoginController,
} from '@mihua/core';
import { useLocale } from '../../context';

/**
 * React 与控制器之间的全部胶水代码：创建控制器，用 useSyncExternalStore 订阅它的快照。
 * 控制器在「没人订阅」时会自动暂停，所以这里不需要手动销毁。
 * 没有传入 adapter 时使用内存里的演示适配器（验证码 123456），方便预览。
 *
 * 也可以直接传入一个现成的控制器：多个视图（甚至 React 和 Vue 各一个）订阅同一个控制器，
 * 它们就是同一个登录过程的不同画法。
 */
export function useLogin(
  config: LoginConfigInput,
  adapter?: LoginAdapter,
  external?: LoginController,
) {
  const locale = useLocale();
  const key = JSON.stringify(config);
  const controller = useMemo(
    () => external ?? createLoginController(config, adapter ?? createLoginDemoAdapter({ locale })),
    // config 按内容比较：父组件每次渲染传入新对象，不应该重建控制器。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [external, key, adapter, locale],
  );
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  return { snapshot, config: controller.config, send: controller.send };
}
