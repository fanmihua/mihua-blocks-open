import { useEffect, useId, useRef } from 'react';
import { createApp, type VNode } from 'vue';

/**
 * 在 React 页面里挂一个 Vue 应用。演示页和检查页用 React 写，但 Vue 组件库必须是真正的 Vue 渲染，
 * 而不是用 React 模仿——这样「换框架」才是真的换框架。
 * deps 变了（换场景、换规范、换外观）就重新挂载；业务状态在控制器里，重新挂载不会丢。
 * Vue 应用不会跟着 React 重新渲染：render 用到的、会变的东西都要放进 deps。
 */
export function VueHost({ render, deps }: { render: () => VNode; deps: unknown[] }) {
  const host = useRef<HTMLDivElement>(null);
  // 同一页上有好几个 Vue 应用：每个应用的 useId 前缀不同，生成的元素 ID 才不会重复
  const prefix = useId().replace(/[^a-zA-Z0-9]/g, '');
  const latest = useRef(render);
  latest.current = render;
  useEffect(() => {
    const app = createApp({ render: () => latest.current() });
    app.config.idPrefix = `v${prefix}`;
    app.mount(host.current!);
    return () => app.unmount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix, ...deps]);
  return <div ref={host} />;
}
