import { createRoot } from 'react-dom/client';
import { CELL, START, installHarness } from '@mihua/audit/page';
import { KITS, auditKits } from '../kits';
import { KitView, type LookMode } from '../KitView';
import { SCENES } from '../scenes';
import { specOf } from '../specs';
import '../kits.css';
import './audit.css';

/**
 * 检查页：所有登记的组件库并排渲染同一个场景、同一个组合（1:1，不缩放）。
 * 网址参数决定场景和组合：/audit.html?scene=login&spec=mono&variant=centered&state=errors
 * audit/run.mjs 打开每一种组合，调用 window.__audit 量取并对比。
 */

const params = new URLSearchParams(location.search);
const scene = SCENES.find((s) => s.id === params.get('scene')) ?? SCENES[0]!;
// mode 只给人看、给截图用（原生 / 只设主题 / 对齐三档对比）；自动检查只查对齐这一档，不传它
const mode = (params.get('mode') ?? 'aligned') as LookMode;
// kits 只渲染其中几个组件库（逗号隔开）：新控件先拿两个库探路时用，检查工具的 --kits 会带上它
const only = params.get('kits')?.split(',');
const kits = only ? KITS.filter((entry) => only.includes(entry.kit.id)) : KITS;
const given = Object.fromEntries(
  [...params].filter(([key]) => key !== 'scene' && key !== 'mode' && key !== 'kits'),
);
const combo = Object.keys(given).length ? given : scene.combos[0]!;
const opened = scene.open(combo);
const spec = specOf(combo.spec);

function Page({ generation }: { generation: number }) {
  return (
    // 换一份状态时整页重新渲染（key 变了），每一格都从头挂载
    <div className="audit" key={generation}>
      {kits.map((entry) => (
        <div key={entry.kit.id} className="audit__cell" {...{ [CELL]: entry.kit.id }}>
          {/* 每格前面一个起点，键盘检查从这里按 Tab */}
          <button type="button" className="audit__start" {...{ [START]: '' }}>
            {entry.kit.id}
          </button>
          <p>{entry.kit.name}</p>
          <KitView entry={entry} spec={spec} mode={mode} scene={opened} />
        </div>
      ))}
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
let generation = 0;
root.render(<Page generation={generation} />);

/** 等字体加载、Vue 应用挂载、组件库的过渡动画结束。 */
const settle = async () => {
  await document.fonts.ready;
  await new Promise((resolve) => setTimeout(resolve, 600));
};

installHarness({
  scenes: SCENES.map(({ id, name, combos }) => ({ id, name, combos })),
  kits: auditKits().filter((kit) => !only || only.includes(kit.id)),
  combo,
  scene: {
    root: opened.root,
    checks: opened.checks,
    snapshot: (kit) => opened.snapshot(kit),
    solo: opened.solo ? (kit) => opened.solo!(kit) : undefined,
    reset: async () => {
      opened.renew();
      root.render(<Page generation={++generation} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
      await opened.enter();
      await settle();
    },
  },
  ready: (async () => {
    await opened.enter();
    await settle();
  })(),
});
