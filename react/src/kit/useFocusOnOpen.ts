import { useCallback, useEffect, useRef } from 'react';

/**
 * 对话框打开时把焦点放进内容区第一个能输入的元素——只在「打开」的那一刻做一次。
 * 返回一个稳定的 ref 回调，挂在包住内容的元素上。
 *
 * 不能写成每次渲染都新建的 ref 回调：React 每次渲染都会重新调用它，表单里打一个字、页面重新渲染，
 * 焦点就被拉回第一个框（antd、Arco 踩过：在「备注」里逐字打字，第二个字跑进了「客户名称」）。
 * 组件库的内容可能晚一拍才挂上去，所以「打开了」和「内容挂上去了」两件事谁后发生，谁去聚焦。
 */
export function useFocusOnOpen(open: boolean, enabled: boolean, selector: string) {
  const node = useRef<HTMLElement | null>(null);
  const pending = useRef(false);
  const tryFocus = useRef(() => {});
  tryFocus.current = () => {
    const el = node.current;
    if (!pending.current || !el) return;
    pending.current = false;
    requestAnimationFrame(() => el.querySelector<HTMLElement>(selector)?.focus());
  };
  useEffect(() => {
    pending.current = open && enabled;
    tryFocus.current();
  }, [open, enabled]);
  return useCallback((el: HTMLElement | null) => {
    node.current = el;
    tryFocus.current();
  }, []);
}
