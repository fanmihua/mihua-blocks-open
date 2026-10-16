import type { CSSProperties } from 'react';
import { iconSetOf, type IconName } from '@mihua/spec';
import { useIconSet } from './context';

/**
 * 语义图标：只说要哪个图标，画成哪一套由规范的 icon.set 决定。
 * 视图和套件都用它，不直接引用任何图标库。data-mh-icon 写明是哪个图标，核对时用。
 */
export function Icon({
  name,
  size = 16,
  strokeWidth,
  spin = false,
  className,
  style,
  ...data
}: {
  name: IconName;
  size?: number | string;
  /** 不给就用这一套图标自己的线宽。 */
  strokeWidth?: number;
  /** 一直旋转（加载中）。 */
  spin?: boolean;
  className?: string;
  style?: CSSProperties;
  /** 其余的 data-* 属性原样写到 svg 上（比如表头排序图标的 data-sorted，样式表靠它变色）。 */
  [data: `data-${string}`]: string | undefined;
}) {
  const setId = useIconSet();
  const set = iconSetOf(setId);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth ?? set.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...data}
      aria-hidden
      focusable="false"
      data-mh-icon={name}
      data-mh-icon-set={setId}
      className={['mh-icon', spin && 'mh-icon--spin', className].filter(Boolean).join(' ')}
      style={style}
    >
      {set.glyphs[name].map(([Tag, attrs], i) => (
        <Tag key={i} {...attrs} />
      ))}
    </svg>
  );
}
