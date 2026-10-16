/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ROLE_IDS } from './roles';
import { parseDesignMarkdown, serializeDesignMarkdown } from './markdown';
import { resolveSpec } from './spec';

/**
 * 仓库里的三份 Design.md（designs/）是规范的源头：内置规范、演示页、检查都从它们读。
 * 这里只核对它们读得出来、每个角色都写了、写回去一字不差（格式没被改坏）。
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('仓库里的 Design.md', () => {
  for (const id of ['mono', 'blue', 'stress'])
    it(`designs/${id}/Design.md`, () => {
      const text = readFileSync(join(repo, `designs/${id}/Design.md`), 'utf8');
      const { spec, prose } = parseDesignMarkdown(text);
      expect(spec.id).toBe(id);
      expect(Object.keys(spec.values).sort()).toEqual([...ROLE_IDS].sort());
      expect(Object.keys(resolveSpec(spec))).toHaveLength(ROLE_IDS.length);
      expect(serializeDesignMarkdown(spec, prose, { all: true })).toBe(text);
    });
});
