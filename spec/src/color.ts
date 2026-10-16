/**
 * 颜色换算。不同组件库要的颜色格式不一样：
 * antd 接受十六进制，Arco 要 "51,112,255" 这样的 RGB 三元组，Element Plus 需要自己算出浅色梯度。
 * 映射层用这里的函数把同一个语义颜色翻译成各库能听懂的写法。
 */
export type Rgb = [number, number, number];

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value: string): boolean {
  return HEX.test(value.trim());
}

export function hexToRgb(hex: string): Rgb {
  const match = HEX.exec(hex.trim());
  if (!match) throw new Error(`Not a hex color: ${hex}`);
  const digits =
    match[1].length === 3
      ? match[1]
          .split('')
          .map((d) => d + d)
          .join('')
      : match[1];
  return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16)) as Rgb;
}

export function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b]
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`;
}

/** Arco Design 的 CSS 变量写法：`--primary-6: 51,112,255`。 */
export function rgbTriplet(hex: string): string {
  return hexToRgb(hex).join(',');
}

/** 按比例把 `color` 混向 `target`：weight = 0 得到原色，1 得到目标色。 */
export function mix(color: string, target: string, weight: number): string {
  const a = hexToRgb(color);
  const b = hexToRgb(target);
  return rgbToHex(a.map((v, i) => v + (b[i] - v) * weight) as Rgb);
}

export const tint = (color: string, weight: number) => mix(color, '#FFFFFF', weight);
export const shade = (color: string, weight: number) => mix(color, '#000000', weight);

/** WCAG 相对亮度与对比度，用来检查规范是否可读。 */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
