import type { PartMap, PartName, PartSelector } from '@mihua/spec';
import type { FocusTarget } from './types';

/**
 * 量取一个组件库渲染出来的样子：只量用户看得到的东西（文字在哪、多大多粗什么颜色，
 * 框有多大、什么底色和边线），和组件库内部怎么写的无关。所有组件库量出来应该一样。
 *
 * 按区域量：场景里标了 data-region 的元素各是一个区域（登录框的标签栏、提交区……，
 * 以后列表页的顶栏、筛选栏、表格）。每个区域里的东西按区域自己的左上角量，区域本身的位置另记在 layout 里。
 * 这样页面上一处偏了，报告只指出那一个区域，不会让后面所有东西的坐标都跟着变。
 */

const r = (n: number) => Math.round(n * 2) / 2;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface TextRun extends Rect {
  text: string;
  size: string;
  weight: string;
  color: string;
}
export interface Box extends Rect {
  bg: string;
  edge: string;
  radius: string;
  /**
   * 只画在某几条边上的线（表格的行线只在下边）：四条边一样或都没有时是 none（edge 已经记了）。
   */
  lines: string;
  /** 投影（不含聚焦外圈和画边框用的内阴影）。 */
  shadow: string;
  /** 实际的不透明度（连同外层一起算，到场景的根为止），加载中的按钮靠它变浅。 */
  opacity: number;
}
/** 一个图标：哪个语义图标（不是规范图标集里的就记成 library），位置、大小、颜色。 */
export interface IconRun extends Rect {
  name: string;
  color: string;
}
export interface InputRun {
  name: string;
  x: number;
  size: string;
  color: string;
  placeholder: string;
}
export interface RegionMeasurement {
  texts: TextRun[];
  inputs: InputRun[];
  /** 按部件分组：每种部件的框，没有的部件不列。 */
  boxes: Partial<Record<PartName, Box[]>>;
  icons: IconRun[];
}
export interface SceneMeasurement {
  /** 每个区域在场景里的位置和大小（页面排得对不对）。场景的根叫「整体」。 */
  layout: Record<string, Rect>;
  /** 每个区域里面的东西，位置相对区域自己的左上角。 */
  regions: Record<string, RegionMeasurement>;
}

/** 场景的根算一个区域，叫「整体」：不在任何标了 data-region 的元素里的东西都归它。 */
export const ROOT_REGION = '整体';

/**
 * 圆角按看得见的算：CSS 会把超过短边一半的圆角压到短边一半，百分比按短边换成像素。
 * 「完全圆」在各组件库里写法不同（antd 100px、Element 11px、shadcn 9999px、Arco 50%），量出来应该一样。
 */
export function radiusOf(value: string, w: number, h: number): string {
  const half = Math.min(w, h) / 2;
  return value
    .split(' ')
    .map((part) => {
      const n = parseFloat(part);
      if (Number.isNaN(n)) return part;
      const px = part.endsWith('%') ? (n / 100) * Math.min(w, h) : n;
      return `${r(Math.min(px, half))}px`;
    })
    .join(' ');
}

export const visible = (el: Element) =>
  el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) &&
  el.getBoundingClientRect().width > 1;

/**
 * 看得见的边线：真边框，或 1px 内阴影（Element 用这种方式画边框）。
 * 和底色同色的边框看不出来，算作没有。
 */
export function edge(el: Element): string {
  const cs = getComputedStyle(el);
  let color = 'none';
  if (parseFloat(cs.borderTopWidth) >= 1 && cs.borderTopStyle !== 'none') color = cs.borderTopColor;
  else {
    const inset = /(rgba?\([^)]*\)) 0px 0px 0px 1px inset/.exec(cs.boxShadow);
    if (inset) color = inset[1]!;
  }
  return color === 'rgba(0, 0, 0, 0)' || color === cs.backgroundColor ? 'none' : color;
}

/**
 * 只画在某几条边上的线：表格的行线、表头下面的线只在下边，edge 只看上边量不到。
 * 四条边都一样（普通的框）或都没有时记 none，按 edge 比；否则逐条记「哪条边 宽度 颜色」。
 */
export function lines(el: Element): string {
  const cs = getComputedStyle(el);
  const sides = (['top', 'right', 'bottom', 'left'] as const).map((side) => {
    const width = parseFloat(cs.getPropertyValue(`border-${side}-width`));
    const style = cs.getPropertyValue(`border-${side}-style`);
    const color = cs.getPropertyValue(`border-${side}-color`);
    const shown =
      width >= 1 &&
      style !== 'none' &&
      color !== 'rgba(0, 0, 0, 0)' &&
      color !== cs.backgroundColor;
    return shown ? `${side[0]} ${r(width)}px ${color}` : '';
  });
  const uniform = sides.every((s) => s && s.slice(2) === sides[0]!.slice(2));
  return uniform || sides.every((s) => !s) ? 'none' : sides.filter(Boolean).join(', ');
}

/** 外圈：向外扩展的阴影（聚焦外环），写成「宽度 颜色」。 */
export function ring(el: Element): string {
  const shadows = getComputedStyle(el).boxShadow.split(/,(?![^(]*\))/);
  for (const s of shadows) {
    const m = /(rgba?\([^)]*\)) 0px 0px 0px (\d+(?:\.\d+)?)px$/.exec(s.trim());
    if (m && Number(m[2]) > 1 && !/rgba\([^)]*, 0\)/.test(m[1]!)) return `${m[2]}px ${m[1]}`;
  }
  return 'none';
}

/**
 * 投影：有偏移或模糊的阴影，写成一串。只向外扩展的（聚焦外圈、Element 画边框的 1px 内阴影）另外量，
 * 完全透明的（Tailwind 的占位阴影）不算。
 */
export function shadow(el: Element, pseudo?: string): string {
  const value = getComputedStyle(el, pseudo).boxShadow;
  if (!value || value === 'none') return 'none';
  const drops = value
    .split(/,(?![^(]*\))/)
    .map((part) => part.trim())
    .filter((part) => {
      const color = /[a-z]+\([^)]*\)/.exec(part)?.[0] ?? '';
      if (/,\s*0\)$|\/\s*0\)$/.test(color)) return false;
      const [x = 0, y = 0, blur = 0] = part
        .replace(color, '')
        .replace('inset', '')
        .trim()
        .split(/\s+/)
        .map(parseFloat);
      return x !== 0 || y !== 0 || blur !== 0;
    });
  return drops.length ? drops.join(', ') : 'none';
}

/** 轮廓线（outline）：有的组件库用它画聚焦外圈。 */
export function outline(el: Element): string {
  const cs = getComputedStyle(el);
  return cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) === 0
    ? 'none'
    : `${cs.outlineWidth} ${cs.outlineColor}`;
}

const bg = (el: Element) => {
  const c = getComputedStyle(el).backgroundColor;
  return c === 'rgba(0, 0, 0, 0)' ? 'none' : c;
};

function relative(rect: DOMRect, origin: DOMRect): Rect {
  return {
    x: r(rect.left - origin.left),
    y: r(rect.top - origin.top),
    w: r(rect.width),
    h: r(rect.height),
  };
}

/** 部件选择器：伪元素部件按宿主元素找。 */
export const hostSelector = (part: PartSelector) =>
  typeof part === 'string' ? part : part.selector;

/** 元素连同外层（到场景的根为止）的不透明度。 */
function opacityOf(el: Element, root: Element) {
  let value = 1;
  for (
    let node: Element | null = el;
    node && node !== root.parentElement;
    node = node.parentElement
  )
    value *= parseFloat(getComputedStyle(node).opacity);
  return Math.round(value * 100) / 100;
}

function box(el: Element, origin: DOMRect, root: Element): Box {
  const rect = el.getBoundingClientRect();
  return {
    ...relative(rect, origin),
    bg: bg(el),
    edge: edge(el),
    lines: lines(el),
    radius: radiusOf(getComputedStyle(el).borderRadius, rect.width, rect.height),
    shadow: shadow(el),
    opacity: opacityOf(el, root),
  };
}

/**
 * 伪元素画的部件（比如 shadcn 标签栏的指示条）：按「绝对定位在宿主里」算出它的位置。
 * 宿主没有这个伪元素（content 为 none）时返回 null。
 */
function pseudoBox(host: Element, pseudo: string, origin: DOMRect, root: Element): Box | null {
  const style = getComputedStyle(host, pseudo);
  if (style.content === 'none' || style.display === 'none') return null;
  const hostRect = host.getBoundingClientRect();
  const hostStyle = getComputedStyle(host);
  const rect = new DOMRect(
    hostRect.left + parseFloat(hostStyle.borderLeftWidth) + (parseFloat(style.left) || 0),
    hostRect.top + parseFloat(hostStyle.borderTopWidth) + (parseFloat(style.top) || 0),
    parseFloat(style.width),
    parseFloat(style.height),
  );
  const color = style.backgroundColor;
  return {
    ...relative(rect, origin),
    bg: color === 'rgba(0, 0, 0, 0)' ? 'none' : color,
    edge: 'none',
    lines: 'none',
    radius: radiusOf(style.borderRadius, rect.width, rect.height),
    shadow: shadow(host, pseudo),
    opacity: opacityOf(host, root),
  };
}

/** 场景里所有区域：根算「整体」，同名的区域按出现顺序编号（fields、fields#2）。 */
function regionNames(root: Element): Map<Element, string> {
  const names = new Map<Element, string>();
  const count: Record<string, number> = {};
  for (const el of [root, ...root.querySelectorAll('[data-region]')]) {
    if (el !== root && !visible(el)) continue;
    const base = el === root ? ROOT_REGION : el.getAttribute('data-region')!;
    count[base] = (count[base] ?? 0) + 1;
    names.set(el, count[base] > 1 ? `${base}#${count[base]}` : base);
  }
  return names;
}

/** 一个元素属于哪个区域：离它最近的、看得见的区域。 */
function regionOf(el: Element, root: Element, names: Map<Element, string>): Element {
  for (let node: Element | null = el; node && node !== root; node = node.parentElement)
    if (names.has(node)) return node;
  return root;
}

function textRuns(container: Element): Array<{ node: Text; parent: Element; rect: DOMRect }> {
  const out: Array<{ node: Text; parent: Element; rect: DOMRect }> = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.textContent?.trim();
    const parent = node.parentElement;
    if (!text || !parent || !visible(parent)) continue;
    // 只量字形：模板换行会在文字节点两端留空格（Vue 和 React 写法不同），空格不算
    const raw = node.textContent ?? '';
    const lead = raw.length - raw.trimStart().length;
    const range = document.createRange();
    range.setStart(node, lead);
    range.setEnd(node, lead + text.length);
    const rect = range.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    out.push({ node: node as Text, parent, rect });
  }
  return out;
}

function textRun(node: Text, parent: Element, rect: DOMRect, origin: DOMRect): TextRun {
  const cs = getComputedStyle(parent);
  return {
    text: node.textContent!.trim(),
    ...relative(rect, origin),
    size: cs.fontSize,
    weight: cs.fontWeight,
    color: cs.color,
  };
}

const byPosition = <T extends Rect>(a: T, b: T) => a.y - b.y || a.x - b.x;
/**
 * 文字、图标先按内容（哪几个字、哪个图标）、再按位置排序，逐项对比时同一段文字和同一段文字比。
 * 只按位置排的话，一个组件库的文字低了 0.5px（在误差之内），排序就翻过来，后面逐项对比全部错位，
 * 一处变成二十几处；「差不到多少算同一行」也不行，总有组件库正好落在界线两边。
 */
const byContent =
  <T extends Rect>(key: (item: T) => string) =>
  (a: T, b: T) =>
    key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : byPosition(a, b);

/**
 * 图标。SVG 图标读 data-mh-icon（规范图标集画的才有）；
 * 组件库用 CSS 画的图标（antd、Element 复选框里的对勾）读伪元素上的遮罩，遮罩图形里也写着 data-mh-icon。
 */
function iconRuns(
  root: Element,
): Array<{ el: Element; icon: Omit<IconRun, keyof Rect>; rect: DOMRect }> {
  const out: Array<{ el: Element; icon: Omit<IconRun, keyof Rect>; rect: DOMRect }> = [];
  for (const svg of root.querySelectorAll('svg')) {
    if (!visible(svg) || svg.parentElement?.closest('svg')) continue;
    // 大小读样式，不读外接框：转动中的加载图标，外接框随角度变大
    const cs = getComputedStyle(svg);
    const rect = svg.getBoundingClientRect();
    const w = parseFloat(cs.width);
    const h = parseFloat(cs.height);
    out.push({
      el: svg,
      icon: { name: svg.getAttribute('data-mh-icon') ?? 'library', color: cs.color },
      rect: new DOMRect(rect.left + (rect.width - w) / 2, rect.top + (rect.height - h) / 2, w, h),
    });
  }
  for (const host of root.querySelectorAll('*')) {
    if (!visible(host)) continue;
    for (const pseudo of ['::before', '::after']) {
      const after = getComputedStyle(host, pseudo);
      const mask = after.maskImage || after.getPropertyValue('-webkit-mask-image');
      // 藏起来的不算（Element 部分选中时把对勾那一层 display: none，改用另一层画短横）
      if (!mask || mask === 'none' || after.content === 'none' || after.display === 'none')
        continue;
      // 没勾选时对勾缩成 0
      if (/matrix\(0, 0, 0, 0/.test(after.transform)) continue;
      const name = /data-mh-icon%3D%22([a-z-]+)%22/.exec(mask)?.[1] ?? 'library';
      const hr = host.getBoundingClientRect();
      const w = parseFloat(after.width);
      const h = parseFloat(after.height);
      out.push({
        el: host,
        icon: { name, color: after.backgroundColor },
        rect: new DOMRect(hr.left + (hr.width - w) / 2, hr.top + (hr.height - h) / 2, w, h),
      });
    }
  }
  return out;
}

/** 量一个场景：按区域、按部件。 */
export function measureScene(root: Element, parts: PartMap): SceneMeasurement {
  const names = regionNames(root);
  const rootRect = root.getBoundingClientRect();
  const layout: Record<string, Rect> = {};
  const regions: Record<string, RegionMeasurement> = {};
  const rects = new Map<Element, DOMRect>();
  for (const [el, name] of names) {
    const rect = el.getBoundingClientRect();
    rects.set(el, rect);
    layout[name] = relative(rect, rootRect);
    regions[name] = { texts: [], inputs: [], boxes: {}, icons: [] };
  }
  const into = (el: Element) => {
    const region = regionOf(el, root, names);
    return { region: regions[names.get(region)!]!, origin: rects.get(region)! };
  };

  for (const { node, parent, rect } of textRuns(root)) {
    const { region, origin } = into(parent);
    region.texts.push(textRun(node, parent, rect, origin));
  }

  for (const input of root.querySelectorAll<HTMLInputElement>('input[name]')) {
    if (input.type === 'checkbox' || !visible(input)) continue;
    const { region, origin } = into(input);
    const cs = getComputedStyle(input);
    const rect = input.getBoundingClientRect();
    region.inputs.push({
      name: input.name,
      x: r(rect.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth) - origin.left),
      size: cs.fontSize,
      color: cs.color,
      placeholder: getComputedStyle(input, '::placeholder').color,
    });
  }

  for (const [part, selector] of Object.entries(parts) as Array<[PartName, PartSelector]>) {
    for (const el of root.querySelectorAll(hostSelector(selector))) {
      if (!visible(el)) continue;
      const { region, origin } = into(el);
      const measured =
        typeof selector === 'string'
          ? box(el, origin, root)
          : pseudoBox(el, selector.pseudo, origin, root);
      if (measured) (region.boxes[part] ??= []).push(measured);
    }
  }

  for (const { el, icon, rect } of iconRuns(root)) {
    const { region, origin } = into(el);
    region.icons.push({ ...icon, ...relative(rect, origin) });
  }

  for (const region of Object.values(regions)) {
    region.texts.sort(byContent((t) => t.text));
    region.icons.sort(byContent((i) => i.name));
    for (const list of Object.values(region.boxes)) list.sort(byPosition);
  }
  return { layout, regions };
}

/**
 * 弹层：相对触发它的元素的位置和大小，每个选项的位置、底色和文字。
 * 没有选项的弹层（文字提示）量它自己的文字。
 */
export function measurePopup(
  trigger: Element | null,
  scope: Element,
  parts: PartMap,
  popupPart: PartName,
  itemPart?: PartName,
) {
  const popup = [...scope.querySelectorAll(hostSelector(parts[popupPart]))].find(visible);
  if (!trigger || !popup) return null;
  const origin = trigger.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  const textsOf = (el: Element) =>
    textRuns(el).map(({ node, parent, rect }) => {
      const { text, x, y, size, weight, color } = textRun(node, parent, rect, popupRect);
      return { text, x, y, size, weight, color };
    });
  if (!itemPart)
    return { popup: { ...box(popup, origin, popup), ring: ring(popup) }, texts: textsOf(popup) };
  return {
    popup: { ...box(popup, origin, popup), ring: ring(popup) },
    options: [...popup.querySelectorAll(hostSelector(parts[itemPart]))]
      .filter(visible)
      .map((option) => ({
        ...box(option, popupRect, popup),
        texts: textRuns(option).map(({ node, parent, rect }) => {
          const { text, x, size, weight, color } = textRun(node, parent, rect, popupRect);
          return { text, x, size, weight, color };
        }),
      })),
  };
}

/** 和一个元素相关的部件：它自己或外层、它里面、或它旁边（Element 的开关，聚焦的是隐藏的 input，外圈画在旁边的轨道上）。 */
export function relatedPart(el: Element, selector: string): Element {
  return (
    el.closest(selector) ??
    el.querySelector(selector) ??
    el.parentElement?.querySelector(selector) ??
    el
  );
}

/** 逐个聚焦，量对应部件的边线、外圈和轮廓线。 */
export async function measureFocus(root: Element, parts: PartMap, targets: FocusTarget[]) {
  const out: Array<{ target: string; edge: string; ring: string; outline: string }> = [];
  for (const target of targets) {
    for (const el of root.querySelectorAll<HTMLElement>(target.selector)) {
      // 量的是看得见的那个部件；聚焦的元素自己可以是隐藏的（Element 开关里的 input）
      const shown = target.part ? relatedPart(el, hostSelector(parts[target.part])) : el;
      if (!visible(shown)) continue;
      el.focus();
      // 等组件库的聚焦过渡结束（不能把过渡关掉：antd 的弹层定位依赖过渡事件）
      await new Promise((resolve) => setTimeout(resolve, 350));
      out.push({
        // 目标按名字、或者角色和文字记（和 Tab 顺序一样），不按标签名：同一个菜单项，
        // 有的组件库是 <li>、有的是 <button>，对用户和读屏来说是同一种东西
        // 单选、复选框的 name 是这一组的名字，不是它自己的
        target:
          (!/^(radio|checkbox)$/.test((el as HTMLInputElement).type) &&
            (el as HTMLInputElement).name) ||
          el.getAttribute('aria-label') ||
          describe(el),
        edge: edge(shown),
        ring: ring(shown),
        outline: outline(shown),
      });
      el.blur();
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }
  return out;
}

/** 当前聚焦的元素：用角色和名字描述，和组件库内部用的是哪个元素无关。 */
export function describeFocus(): string {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) return 'body';
  return describe(el);
}

/** 一个元素：用角色和名字描述（「menuitem 工作台」「a 首页」），和组件库用的是哪种标签无关。 */
function describe(el: HTMLElement): string {
  // 用角色描述：原生复选框和 role=checkbox 的按钮对读屏和键盘来说是同一种东西
  const role =
    el.getAttribute('role') ??
    (el instanceof HTMLInputElement
      ? el.type === 'checkbox' || el.type === 'radio'
        ? el.type
        : `input:${el.type}`
      : el.tagName.toLowerCase());
  const name =
    el.getAttribute('aria-label') ||
    // 单选、复选框的 name 是这一组的名字，不是它自己的
    (el instanceof HTMLInputElement && !/^(radio|checkbox)$/.test(el.type)
      ? el.placeholder || el.name
      : '') ||
    // 只取看得见的文字（antd 的标签里有给读屏用的隐藏文字「Tab 1 of 2」）
    (el as HTMLElement).innerText?.replace(/Tab \d+ of \d+/, '') ||
    '';
  return `${role} ${name.trim().slice(0, 16)}`.trim();
}

export const frames = (n: number) =>
  new Promise<void>((resolve) => {
    const step = (left: number) =>
      left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1));
    step(n);
  });
