import { useLayoutEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  controlCssVariables,
  iconCssVariables,
  monoSpec,
  resolveControls,
  resolveSpec,
  toCssVariables,
  type Spec,
} from '@mihua/spec';
import type { Locale } from '@mihua/core';
import { ContextProviders } from './context';
import type { Kit } from './kit/types';
import '@mihua/core/styles/root.css';

/**
 * 三件事在这里汇合：
 * 1. 规范 → CSS 变量（--mh-*），组件自己的布局、文字、面板都读这些变量；
 * 2. 规范 → 组件库主题，由套件的 Provider 完成；native 为 true 时跳过，保留组件库原生外观；
 * 3. 语言与弹层挂载点。
 */
export function MihuaProvider({
  kit,
  spec = monoSpec,
  native = false,
  align = true,
  locale = 'zh',
  className,
  children,
}: {
  kit: Kit;
  spec?: Spec;
  native?: boolean;
  /** 为 false 时只把取值交给组件库的主题变量，不按控件规格对齐（用来对比）。 */
  align?: boolean;
  locale?: Locale;
  className?: string;
  children: ReactNode;
}) {
  const tokens = useMemo(() => resolveSpec(spec), [spec]);
  // 规范的取值（--mh-*）加上由它算出的控件规格（--mh-c-*），套件对齐时读后者
  const style = useMemo(
    () =>
      ({
        ...toCssVariables(tokens),
        ...controlCssVariables(resolveControls(tokens)),
        // 组件库只能用 CSS 画的图标（复选框的对勾），套件用这些变量做遮罩
        ...iconCssVariables(tokens['icon.set']),
      }) as CSSProperties,
    [tokens],
  );
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (portal) cancelAncestorZoom(portal);
  }, [portal]);
  return (
    <div
      className={['mh-root', className].filter(Boolean).join(' ')}
      data-kit={kit.id}
      data-native={native || undefined}
      lang={locale === 'zh' ? 'zh-CN' : 'en'}
      style={style}
      // 打开下拉之前再量一次：外层的缩放可能在挂载之后才变
      onPointerDownCapture={() => portal && cancelAncestorZoom(portal)}
    >
      <ContextProviders kit={kit} locale={locale} portal={portal} iconSet={tokens['icon.set']}>
        <kit.Provider tokens={native ? null : tokens} aligned={align}>
          {/* 挂载点出来以后再渲染内容：一开始就开着的弹层（对话框）在第一次渲染时拿不到挂载点，
              组件库会先挂到 body 上，以后也不挪（Arco 的 Modal）。ref 回调里更新状态会在画出来之前同步重渲染，不闪 */}
          {portal && children}
          <div className="mh-portal" ref={setPortal} />
        </kit.Provider>
      </ContextProviders>
    </div>
  );
}

/**
 * 页面可能用 CSS zoom 把整个组件缩小显示（比如在一屏里并排放四个）。Arco 和 Radix（shadcn）
 * 计算弹层位置时不考虑祖先的 zoom，下拉会偏到别处。让弹层挂载点抵消祖先的缩放：
 * 弹层按 1:1 显示，位置和触发它的控件对齐。不支持 currentCSSZoom 的浏览器不做处理。
 */
function cancelAncestorZoom(portal: HTMLElement) {
  const parent = portal.parentElement as (HTMLElement & { currentCSSZoom?: number }) | null;
  const zoom = parent?.currentCSSZoom ?? 1;
  portal.style.zoom = Math.abs(zoom - 1) > 0.001 ? String(1 / zoom) : '';
}
