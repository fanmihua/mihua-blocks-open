/*
 * 颜色小工具（给文档里的交互用）。
 * generate：照搬 Ant Design 推色板的算法（@ant-design/colors 8.0.1 的 generate.js，常数和步骤一样），
 *   给一个主色，返回 10 档：前 5 档往浅推、第 6 档是主色、后 4 档往深推。
 * tint / shade / contrast：和仓库 spec/src/color.ts 里的一样（按比例混白、混黑；WCAG 对比度）。
 */
(function (global) {
  const hexToRgb = (hex) => {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return null;
    const d = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
    return [0, 2, 4].map((i) => parseInt(d.slice(i, i + 2), 16));
  };
  const rgbToHex = (rgb) =>
    '#' + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  const rgbToHsv = ([r, g, b]) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return { h, s: max ? d / max : 0, v: max };
  };
  const hsvToRgb = ({ h, s, v }) => {
    const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    let [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  };
  // —— Ant Design 的常数（generate.js:2-8）——
  const hueStep = 2, saturationStep = 0.16, saturationStep2 = 0.05, brightnessStep1 = 0.05, brightnessStep2 = 0.15, lightColorCount = 5, darkColorCount = 4;
  const getHue = (hsv, i, light) => {
    const H = Math.round(hsv.h);
    let hue = H >= 60 && H <= 240 ? (light ? H - hueStep * i : H + hueStep * i) : light ? H + hueStep * i : H - hueStep * i;
    if (hue < 0) hue += 360; else if (hue >= 360) hue -= 360;
    return hue;
  };
  const getSaturation = (hsv, i, light) => {
    if (hsv.h === 0 && hsv.s === 0) return hsv.s; // 灰色不改饱和度
    let s;
    if (light) s = hsv.s - saturationStep * i;
    else if (i === darkColorCount) s = hsv.s + saturationStep;
    else s = hsv.s + saturationStep2 * i;
    if (s > 1) s = 1;
    if (light && i === lightColorCount && s > 0.1) s = 0.1;
    if (s < 0.06) s = 0.06;
    return Math.round(s * 100) / 100;
  };
  const getValue = (hsv, i, light) => {
    let v = light ? hsv.v + brightnessStep1 * i : hsv.v - brightnessStep2 * i;
    v = Math.max(0, Math.min(1, v));
    return Math.round(v * 100) / 100;
  };
  function generate(color) {
    const rgb = hexToRgb(color); if (!rgb) return null;
    const hsv = rgbToHsv(rgb);
    const out = [];
    for (let i = lightColorCount; i > 0; i--) out.push({ h: getHue(hsv, i, true), s: getSaturation(hsv, i, true), v: getValue(hsv, i, true) });
    out.push(hsv);
    for (let i = 1; i <= darkColorCount; i++) out.push({ h: getHue(hsv, i, false), s: getSaturation(hsv, i, false), v: getValue(hsv, i, false) });
    return out.map((c, i) => ({ hex: i === 5 ? rgbToHex(rgb) : rgbToHex(hsvToRgb(c)), hsv: c }));
  }
  const mix = (a, b, w) => { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((v, i) => v + (B[i] - v) * w)); };
  const tint = (c, w) => mix(c, '#FFFFFF', w);
  const shade = (c, w) => mix(c, '#000000', w);
  const luminance = (hex) => { const [r, g, b] = hexToRgb(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contrast = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  const hsb = (hex) => { const { h, s, v } = rgbToHsv(hexToRgb(hex)); return { h: Math.round(h), s: Math.round(s * 100), b: Math.round(v * 100) }; };
  const rgbTriplet = (hex) => hexToRgb(hex).join(',');
  const isHex = (s) => !!hexToRgb(s || '');
  // 浏览器给出的任何颜色写法（rgb()、oklch()……）换成十六进制：画到一个像素上再读回来；完全透明的返回 null
  let ctx = null;
  const cssToHex = (css) => {
    if (!css || /^transparent$/i.test(css) || /rgba\([^)]*,\s*0\)$/.test(css)) return null;
    try {
      ctx = ctx || Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000';
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return a === 0 ? null : rgbToHex([r, g, b]);
    } catch (e) { return null; }
  };
  global.MhColor = { cssToHex, generate, mix, tint, shade, contrast, hsb, rgbTriplet, isHex, hexToRgb, rgbToHex };
})(typeof window !== 'undefined' ? window : globalThis);
