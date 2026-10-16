/**
 * 客户列表的演示数据：50 位客户，放在内存里。每次生成的都一样（固定的伪随机数），
 * 所以检查页每次打开、每个组件库拿到的数据都一样。
 */
export type CustomerStatus = 'potential' | 'active' | 'silent' | 'lost';
export type CustomerLevel = 'A' | 'B' | 'C';

export interface Customer {
  /** 客户编号，也是表格行的 key。 */
  key: string;
  name: string;
  region: string;
  industry: string;
  status: CustomerStatus;
  level: CustomerLevel;
  owner: string;
  phone: string;
  /** 年度潜在金额（元）。 */
  amount: number;
  /** 最近跟进的日期（YYYY-MM-DD）。 */
  lastActivity: string;
  /** 重点客户（表格里的开关）。 */
  important: boolean;
  note: string;
}

export const OWNERS = ['顾清和', '林知夏', '周屿', '沈一帆', '陈默'];

const CITIES = ['上海', '杭州', '苏州', '南京', '深圳', '广州', '成都', '武汉', '北京', '厦门'];
const WORDS = ['云帆', '启明', '恒信', '星河', '远景', '青禾', '海川', '致远', '博纳', '嘉禾'];
const KINDS = [
  ['科技', '软件'],
  ['医疗器械', '医疗'],
  ['供应链', '物流'],
  ['新材料', '制造'],
  ['教育科技', '教育'],
] as const;
const STATUSES: CustomerStatus[] = ['active', 'active', 'potential', 'silent', 'active', 'lost'];
const LEVELS: CustomerLevel[] = ['A', 'B', 'B', 'C'];

/** 固定种子的伪随机数（线性同余），保证每次生成一样的数据。 */
function random(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648;
    return value / 2147483648;
  };
}

export function createCustomers(count = 50): Customer[] {
  const next = random(20261011);
  const pick = <T>(list: readonly T[]) => list[Math.floor(next() * list.length)]!;
  return Array.from({ length: count }, (_, i) => {
    const city = CITIES[i % CITIES.length]!;
    const word = WORDS[(i * 3 + Math.floor(i / CITIES.length)) % WORDS.length]!;
    const [kind, industry] = KINDS[(i * 7) % KINDS.length]!;
    // 最近跟进：2026-06-01 起的 130 天里
    const day = new Date(Date.UTC(2026, 5, 1) + Math.floor(next() * 130) * 86400000);
    return {
      key: `KH-${String(i + 1).padStart(4, '0')}`,
      name: `${city}${word}${kind}有限公司`,
      region: city,
      industry,
      status: pick(STATUSES),
      level: pick(LEVELS),
      owner: OWNERS[i % OWNERS.length]!,
      // 一看就是假的号码（100 开头的手机号不存在），不会撞上真人；照样占一个随机数，后面的金额、日期不变
      phone: (next(), `10000000${String(i + 1).padStart(3, '0')}`),
      amount: Math.round(next() * 190 + 10) * 10000,
      lastActivity: day.toISOString().slice(0, 10),
      important: next() < 0.3,
      note: '',
    };
  });
}
