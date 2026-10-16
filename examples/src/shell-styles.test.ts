/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// 演示页、检查页的外壳样式只管外壳自己。放组件的格子（.demo__cell、.audit__cell）里是五个组件库的真实组件，
// 外壳要是用后代选择器伸进去（比如「.demo__cell h2」），会改掉组件自己的样式：检查页量出来是对的，演示页上却走了样
// （登录框标题、shadcn/ui 对话框标题曾被压成 13px）。外壳元素一律用自己的类名选中。
const SHELLS = ['demo/demo.css', 'audit/audit.css'];
const CELL = /\.(?:demo|audit)__cell(?![\w-])/;

function selectors(file: string): string[] {
  const css = readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/([^{}]+)\{/g)].flatMap((m) => m[1].split(',').map((s) => s.trim()));
}

describe('外壳样式不伸进组件库格子', () => {
  for (const file of SHELLS) {
    it(file, () => {
      // 格子类名后面紧跟空格再接别的选择器 = 后代组合符，会选中格子里任何深度的元素
      const leaks = selectors(file).filter((s) => {
        const at = s.search(CELL);
        return at >= 0 && /^\s+[^\s>+~]/.test(s.slice(at).replace(CELL, ''));
      });
      expect(leaks).toEqual([]);
    });
  }
});
