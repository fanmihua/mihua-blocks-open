/**
 * 对比：所有组件库量出来的值逐项比较。数字允许 0.6px 的误差（亚像素取整），其余必须完全相同。
 * 返回不一样的地方：路径（哪个区域、哪个部件、哪一项）和每个组件库各是多少。
 */
export const TOLERANCE = 0.6;

export function compare(byKit, path = '') {
  const kits = Object.keys(byKit);
  const values = kits.map((k) => byKit[k]);
  const first = values[0];
  const diffs = [];
  if (values.every((v) => typeof v === 'number')) {
    if (Math.max(...values) - Math.min(...values) > TOLERANCE) diffs.push({ path, values: byKit });
    return diffs;
  }
  if (values.every(Array.isArray)) {
    const lengths = values.map((v) => v.length);
    if (new Set(lengths).size > 1) {
      // 数量不一样时，直接列出各自有哪些
      const summary = Object.fromEntries(
        kits.map((k, i) => [
          k,
          values[i].map((v) => (v && (v.text ?? v.name)) || JSON.stringify(v)).join(' | '),
        ]),
      );
      diffs.push({ path: `${path} 数量`, values: summary });
      return diffs;
    }
    for (let i = 0; i < first.length; i++)
      diffs.push(
        ...compare(Object.fromEntries(kits.map((k, j) => [k, values[j][i]])), `${path}[${i}]`),
      );
    return diffs;
  }
  if (values.every((v) => v && typeof v === 'object')) {
    const keys = new Set(values.flatMap((v) => Object.keys(v)));
    for (const key of keys)
      diffs.push(
        ...compare(
          Object.fromEntries(kits.map((k, j) => [k, values[j][key]])),
          path ? `${path}.${key}` : key,
        ),
      );
    return diffs;
  }
  if (new Set(values.map((v) => JSON.stringify(sameColor(v)))).size > 1)
    diffs.push({ path, values: byKit });
  return diffs;
}

/**
 * 同一个颜色的两种写法算一样：过渡进行中，浏览器把颜色读成 rgba(240, 240, 240, 1)，
 * 过渡结束是 rgb(240, 240, 240)。
 */
const sameColor = (v) =>
  typeof v === 'string' ? v.replace(/rgba\(([^,()]+,[^,()]+,[^,()]+), 1\)/g, 'rgb($1)') : v;

/** 报告里的路径换成看得懂的话：regions.submit.boxes.button[0].bg → 区域 submit › 按钮[0] › 底色。 */
const WORDS = {
  regions: '区域',
  layout: '区域位置',
  texts: '文字',
  inputs: '输入的文字',
  icons: '图标',
  popup: '弹层',
  options: '选项',
  x: '横向位置',
  y: '纵向位置',
  w: '宽',
  h: '高',
  bg: '底色',
  edge: '边线',
  ring: '外圈',
  outline: '轮廓线',
  radius: '圆角',
  opacity: '不透明度',
  size: '字号',
  weight: '字重',
  color: '颜色',
  placeholder: '占位文字颜色',
  name: '名称',
};

export function readable(path) {
  return path
    .replace(/(^|\.)boxes\./g, '$1')
    .split('.')
    .map((seg) => {
      const m = /^([^[ ]+)(.*)$/.exec(seg);
      return m ? (WORDS[m[1]] ?? m[1]) + m[2] : seg;
    })
    .join(' › ');
}
