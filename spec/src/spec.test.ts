import { describe, expect, it } from 'vitest';
import {
  ROLES,
  ROLE_IDS,
  contrast,
  cssVar,
  blueSpec,
  mix,
  monoSpec,
  parseDesignMarkdown,
  resolveSpec,
  rgbTriplet,
  serializeDesignMarkdown,
  toCssVariables,
  validateSpec,
} from './index';

describe('roles', () => {
  it('turns role ids into stable CSS variable names', () => {
    expect(cssVar('action.primary')).toBe('--mh-action-primary');
    expect(cssVar('size.controlLarge')).toBe('--mh-size-control-large');
  });

  it('gives every role a valid fallback', () => {
    for (const id of ROLE_IDS)
      expect(() =>
        validateSpec({ ...monoSpec, values: { [id]: ROLES[id].fallback } }),
      ).not.toThrow();
  });
});

describe('specs', () => {
  it('fills missing roles with the mono fallback', () => {
    const tokens = resolveSpec(blueSpec);
    expect(tokens['action.primary']).toBe('#3370FF');
    expect(tokens['radius.control']).toBe('6px');
    expect(Object.keys(toCssVariables(tokens))).toHaveLength(ROLE_IDS.length);
  });

  it('rejects unknown roles and out-of-range values', () => {
    expect(() => validateSpec({ ...monoSpec, values: { 'action.brand': '#000000' } })).toThrow(
      '未知的角色',
    );
    expect(() => validateSpec({ ...monoSpec, values: { 'radius.control': '99px' } })).toThrow(
      '超出范围',
    );
    expect(() => validateSpec({ ...monoSpec, values: { 'action.primary': 'red' } })).toThrow(
      '十六进制',
    );
  });

  it('keeps built-in text readable on its surfaces', () => {
    for (const spec of [monoSpec, blueSpec]) {
      const t = resolveSpec(spec);
      expect(contrast(t['text.body'], t['surface.base'])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t['text.secondary'], t['surface.base'])).toBeGreaterThanOrEqual(4.5);
      // 按钮文字按 WCAG 对大号 / 加粗界面文字的 3:1 要求；蓝色主色上的白字约为 4.3:1。
      expect(contrast(t['action.onPrimary'], t['action.primary'])).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('Design.md', () => {
  it('round-trips a spec through Markdown', () => {
    const text = serializeDesignMarkdown(blueSpec);
    const { spec } = parseDesignMarkdown(text);
    // 与默认值相同的角色不会写进文件，所以比较的是「最终生效的取值」。
    expect(resolveSpec(spec)).toEqual(resolveSpec(blueSpec));
    expect(spec.name).toBe('蓝色');
  });

  it('keeps prose and ignores comments inside the token block', () => {
    const doc = parseDesignMarkdown(
      '---\nid: acme\nname: Acme\nrevision: 2\n---\n\n# Acme\n\n品牌说明。\n\n```mihua-tokens\n# 颜色\naction.primary: #FF5500\n```\n',
    );
    expect(doc.spec.revision).toBe(2);
    expect(doc.prose).toContain('品牌说明');
    expect(doc.spec.values['action.primary']).toBe('#FF5500');
  });

  it('refuses documents without a token block', () => {
    expect(() => parseDesignMarkdown('---\nid: x\nname: X\nrevision: 1\n---\n# X')).toThrow(
      'mihua-tokens',
    );
  });
});

describe('color', () => {
  it('converts to the formats different libraries expect', () => {
    expect(rgbTriplet('#3370FF')).toBe('51,112,255');
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });
});
