#!/usr/bin/env node
/**
 * 自动检查：同一个场景、同一个状态，所有登记的组件库渲染出来是否一样。
 *
 * 打开检查页（examples/audit.html）上的每个场景、每种组合，用真实的浏览器量取用户看得见的东西
 * （文字的位置、大小、字重、颜色，框的大小、底色、边线、圆角，图标），所有组件库逐项对比；
 * 再用真实的鼠标和键盘核对交互：聚焦、悬停、展开弹层、Esc 收起、Tab 顺序、按键、点击。
 * 有一项不一样就失败。结果写到 output/audit/report.json。
 *
 * 这个程序不认识任何组件库，也不认识任何组件：
 * - 有哪些组件库，看检查页的登记表（examples/src/kits.ts）；每个部件在组件库里是哪个元素，看套件的部件地图；
 * - 有哪些场景、每个组合做哪些检查，看检查页的场景（examples/src/scenes/）。
 * 接一个新组件库、加一个新控件、加一个新页面，都不用改这里。
 *
 * 需要一个 Chrome：设置 CHROME_PATH，或者装有 Google Chrome / puppeteer 的 chrome-headless-shell。
 * 找不到时跳过并提示；设置 AUDIT_REQUIRED=1 时找不到就失败。
 *
 * 用法：npm run audit:kits
 *       npm run audit:kits -- --scene=login            只查一个场景
 *       npm run audit:kits -- --scene=login --variant=centered --spec=mono   只查符合条件的组合
 *       npm run audit:kits -- --scene=admin --kits=shadcn,antd   只比其中几个组件库（新控件先拿两个库探路）
 *       npm run audit:kits -- --scene=customers --kits=antd --mode=native   只量不比：组件库原生的样子
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { findChrome, launch, sleep } from './lib/chrome.mjs';
import { compare, readable } from './lib/compare.mjs';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
/** 检查页所在的应用：并排渲染所有登记的组件库。 */
const PAGE_ROOT = join(repo, 'examples');
const PAGE = 'audit.html';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const { scene: onlyScene, kits: onlyKits, mode, ...filters } = args;
/** 只比其中几个组件库：检查页按网址里的 kits 只渲染这几个。 */
const kitParam = {
  ...(typeof onlyKits === 'string' ? { kits: onlyKits } : {}),
  // 只量不比：--mode=native 量组件库原生的样子（写适配记录要的「原生实测数字」在报告的 values 里），
  // 这时「不一样」是正常的
  ...(typeof mode === 'string' ? { mode } : {}),
};
const J = JSON.stringify;

async function main() {
  const chromePath = findChrome();
  if (!chromePath) {
    const msg = '自动检查：没有找到 Chrome（可以设置 CHROME_PATH）。';
    if (process.env.AUDIT_REQUIRED) throw new Error(msg);
    console.log(`${msg}已跳过。`);
    return;
  }

  const server = await createServer({
    root: PAGE_ROOT,
    configFile: join(PAGE_ROOT, 'vite.config.ts'),
    logLevel: 'error',
    // 不监听文件、不热更新：检查过程中有人（或别的 AI 会话）在改代码，页面也不会中途刷新
    server: { host: '127.0.0.1', port: 4190, strictPort: false, hmr: false, watch: null },
  });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  const browser = await launch(chromePath);
  const ev = (expression) => browser.evaluate(expression);
  const report = [];
  let failed = 0;
  let kits = [];

  /** 记一项结果：所有组件库的值逐项对比。 */
  const check = (name, byKit) => {
    const missing = !byKit || Object.values(byKit).some((v) => v === undefined || v === null);
    const diffs = missing ? [{ path: '没有量到', values: byKit ?? {} }] : compare(byKit);
    report.push({ name, ok: !diffs.length, diffs, values: byKit });
    if (diffs.length) failed++;
    console.log(diffs.length ? `✗ ${name}（${diffs.length} 处不一样）` : `✓ ${name}`);
    for (const d of diffs.slice(0, 6))
      console.log(`    ${readable(d.path)}: ${J(d.values)}`.slice(0, 400));
  };

  /**
   * 在每个组件库里找同一个目标。都找不到：这个组合没有它，跳过这项检查（返回 null）；
   * 有的找得到、有的找不到：记为失败（返回 false）。
   */
  const locate = async (name, target) => {
    const at = {};
    // 场景里有模态弹层时一个一个找（任何时候最多只开一个组件库的对话框）
    const solo = await ev('window.__audit.solo');
    for (const kit of kits) {
      if (solo) await isolate(kit);
      at[kit] = await ev(`window.__audit.center(${J(kit)}, ${J(target)})`);
    }
    if (solo) await isolate();
    const found = Object.values(at).filter(Boolean).length;
    if (!found) return null;
    if (found < kits.length) {
      check(name, at);
      return false;
    }
    return true;
  };
  const centerOf = (kit, target) => ev(`window.__audit.center(${J(kit)}, ${J(target)})`);
  /** 只和这个组件库交互（别的格子 inert）；不给就全部恢复。 */
  const isolate = (kit) => ev(`window.__audit.isolate(${kit ? J(kit) : ''})`);
  /**
   * 把鼠标移开：移到窗口左上角，再动一下。真实的鼠标移开会有好几次移动；有的组件库（Radix 的文字提示）
   * 离开时先画一块「通往弹层的区域」，等下一次移动才判断鼠标是不是真的走了，只跳一步它就一直开着。
   */
  const moveAway = async () => {
    await browser.hover([1, 1]);
    await sleep(30);
    await browser.hover([2, 2]);
  };

  /** 每种检查项怎么做。 */
  const run = {
    async look(_c, label) {
      // 场景里有模态弹层（对话框）时一个一个量：每次只留这个组件库的对话框。
      // 几个对话框同时开着，焦点只能在其中一个里，谁的输入框带着聚焦描边取决于谁最后抢到焦点
      if (await ev('window.__audit.solo')) {
        const byKit = {};
        for (const kit of kits) {
          await isolate(kit);
          byKit[kit] = await ev(`window.__audit.measureIn(${J(kit)})`);
        }
        await isolate();
        return check(`样子 ${label}`, byKit);
      }
      check(`样子 ${label}`, await ev('window.__audit.measure()'));
    },
    async focus(c, label) {
      // 每个组件库单独量一次：九个目标 × 五个组件库一次量完要 30 多秒，超过等待时间
      const byKit = {};
      for (const kit of kits) {
        await isolate(kit);
        byKit[kit] = await ev(`window.__audit.measureFocusIn(${J(kit)}, ${J(c.targets)})`);
      }
      await isolate();
      check(`聚焦 ${label}`, byKit);
    },
    async popup(c, label) {
      const name = `${c.label} ${label}`;
      if (!(await locate(name, c.trigger))) return;
      const popups = {};
      const closed = {};
      const measure = (kit) =>
        ev(`window.__audit.measurePopup(${J(kit)}, ${J(c.trigger)}, ${J(c.popup)}, ${J(c.item)})`);
      const hover = c.open === 'hover';
      for (const kit of kits) {
        await isolate(kit);
        const at = await centerOf(kit, c.trigger);
        if (hover) {
          await browser.hover(at);
          // 悬停打开一般有延时（各组件库 0–300ms），再加上弹出的动画
          await sleep(800);
        } else {
          await browser.click(at);
          await sleep(450);
        }
        popups[kit] = await measure(kit);
        if (hover) {
          await moveAway();
          await sleep(800);
        } else {
          await browser.press('Escape');
          await sleep(400);
        }
        closed[kit] = (await measure(kit)) === null;
      }
      await isolate();
      check(name, popups);
      check(`${hover ? '鼠标移开收起' : 'Esc 收起'}${c.label} ${label}`, closed);
    },
    async hover(c, label) {
      const name = `悬停${c.label} ${label}`;
      if (!(await locate(name, c.target))) return;
      const styles = {};
      for (const kit of kits) {
        await browser.hover(await centerOf(kit, c.target));
        await sleep(300);
        styles[kit] = await ev(`window.__audit.styleOf(${J(kit)}, ${J(c.target)})`);
      }
      await moveAway();
      check(name, styles);
    },
    async tabOrder(_c, label) {
      // 从每格开头按 Tab，记下依次聚焦到什么，直到离开这一格
      const order = {};
      for (const kit of kits) {
        await isolate(kit);
        await ev(`window.__audit.focusStart(${J(kit)})`);
        order[kit] = [];
        // 整页（客户列表）有 70 多个 Tab 停靠点
        for (let i = 0; i < 160; i++) {
          await browser.press('Tab');
          await sleep(60);
          const f = await ev('window.__audit.focused()');
          if (f.kit !== kit || f.start) break;
          order[kit].push(f.desc);
        }
      }
      await isolate();
      check(`Tab 顺序 ${label}`, order);
    },
    async keys(c, label) {
      const name = `${c.label} ${label}`;
      if (!(await locate(name, c.target))) return;
      const results = {};
      for (const kit of kits) {
        // 每次只动一个组件库：先回到初始状态
        await ev('window.__audit.reset()');
        await isolate(kit);
        if (!(await ev(`window.__audit.focusIn(${J(kit)}, ${J(c.target)})`))) continue;
        for (const key of c.keys) {
          if (typeof key === 'object') await browser.type(key.text);
          else await browser.press(key);
          await sleep(c.gap ?? 60);
        }
        await sleep(300);
        const state = await ev(`window.__audit.snapshot(${J(kit)})`);
        const focus = (await ev('window.__audit.focused()')).desc;
        results[kit] = c.read === 'state' ? { state } : { state, focus };
      }
      await isolate();
      check(name, results);
    },
    async click(c, label) {
      const name = `${c.label} ${label}`;
      if (!(await locate(name, c.target))) return;
      const results = {};
      for (const kit of kits) {
        await ev('window.__audit.reset()');
        await isolate(kit);
        await browser.click(await centerOf(kit, c.target));
        await sleep(300);
        for (const step of c.steps ?? []) {
          // 上一下点开的弹层要等它出来（动画）
          await sleep(300);
          const at = await centerOf(kit, step);
          if (at) await browser.click(at);
          await sleep(300);
        }
        results[kit] = await ev(`window.__audit.snapshot(${J(kit)})`);
      }
      await isolate();
      check(name, results);
    },
  };

  try {
    await browser.goto(`${base}${PAGE}?${new URLSearchParams(kitParam)}`);
    const scenes = await ev('window.__audit.scenes');
    kits = await ev('window.__audit.kits');
    console.log(`组件库：${kits.join('、')}\n`);
    for (const scene of scenes) {
      if (onlyScene && onlyScene !== scene.id) continue;
      for (const combo of scene.combos) {
        if (Object.entries(filters).some(([k, v]) => combo[k] !== undefined && combo[k] !== v))
          continue;
        const label = [scene.name, ...Object.values(combo)].join(' · ');
        await browser.goto(
          `${base}${PAGE}?${new URLSearchParams({ scene: scene.id, ...combo, ...kitParam })}`,
        );
        for (const c of await ev('window.__audit.checks')) {
          if (!run[c.type]) throw new Error(`不认识的检查项：${c.type}`);
          await run[c.type](c, label);
        }
      }
    }
  } finally {
    browser.close();
    await server.close();
  }

  const out = join(repo, 'output/audit');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
  const total = report.length;
  const places = report.reduce((sum, item) => sum + item.diffs.length, 0);
  console.log(
    failed
      ? `\n自动检查：${total} 项里有 ${failed} 项组件库之间不一样，一共 ${places} 处。详情见 output/audit/report.json`
      : `\n自动检查：${total} 项，${kits.length} 个组件库全部一致。`,
  );
  if (!total) {
    console.log('一项都没有检查：看看 --scene 和其他条件是不是写错了。');
    process.exitCode = 1;
  }
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
