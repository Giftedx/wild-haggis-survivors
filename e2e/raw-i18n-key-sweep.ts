import type { Page } from '@playwright/test';
import { expect } from './fixtures';

type RawI18nLeak = {
  source: string;
  value: string;
};

type RawI18nSweepOptions = {
  sceneKeys?: string[];
};

/**
 * Broad hub/menu guard for unresolved localization keys.
 *
 * Canvas text is invisible to normal DOM assertions, while the accessibility
 * focus mirrors are intentionally DOM-backed and sometimes visually hidden.
 * This helper checks both surfaces: accessible DOM names/text and Phaser Text
 * display objects for the active scene(s) under test.
 */
export async function expectNoRawI18nKeyLeaks(
  page: Page,
  options: RawI18nSweepOptions = {},
): Promise<void> {
  const leaks = await page.evaluate(({ sceneKeys }) => {
    const pattern = /\b(?:achievement|biome|captions|enemy|settings|ui|upgrade|variant|weapon)\.[A-Za-z0-9_.-]+\b/;
    const found: RawI18nLeak[] = [];

    const record = (source: string, raw: unknown): void => {
      if (typeof raw !== 'string') return;
      const value = raw.replace(/\s+/g, ' ').trim();
      if (value.length === 0) return;
      if (pattern.test(value)) found.push({ source, value });
    };

    const elements = Array.from(document.querySelectorAll<HTMLElement>('body *'));
    for (const el of elements) {
      const tag = el.tagName.toLowerCase();
      const focusId = el.getAttribute('data-focus-id');
      const id = el.id.length > 0 ? `#${el.id}` : '';
      const label = focusId != null ? `[data-focus-id="${focusId}"]` : `${tag}${id}`;

      record(`dom:${label}:aria-label`, el.getAttribute('aria-label'));
      record(`dom:${label}:title`, el.getAttribute('title'));
      record(`dom:${label}:alt`, el.getAttribute('alt'));

      if (tag === 'button' || tag === 'a' || el.hasAttribute('role') || focusId != null) {
        record(`dom:${label}:text`, el.textContent);
      }
    }

    type DisplayNode = {
      text?: unknown;
      name?: unknown;
      type?: unknown;
      list?: unknown[];
      children?: { list?: unknown[] };
    };

    const visitDisplayNode = (sceneKey: string, node: unknown, path: string): void => {
      const displayNode = node as DisplayNode;
      const type = typeof displayNode.type === 'string' ? displayNode.type : 'object';
      const name = typeof displayNode.name === 'string' && displayNode.name.length > 0
        ? `:${displayNode.name}`
        : '';
      record(`phaser:${sceneKey}:${path}:${type}${name}:text`, displayNode.text);

      const childList = Array.isArray(displayNode.list)
        ? displayNode.list
        : Array.isArray(displayNode.children?.list)
          ? displayNode.children.list
          : [];
      childList.forEach((child, index) => visitDisplayNode(sceneKey, child, `${path}.${index}`));
    };

    type GameWindow = Window & {
      game?: {
        scene?: {
          getScene(key: string): unknown;
        };
      };
    };
    type PhaserScene = {
      children?: { list?: unknown[] };
    };

    const game = (window as GameWindow).game;
    if (game?.scene != null) {
      for (const sceneKey of sceneKeys) {
        const scene = game.scene.getScene(sceneKey) as PhaserScene | null;
        const list = scene?.children?.list;
        if (!Array.isArray(list)) continue;
        list.forEach((child, index) => visitDisplayNode(sceneKey, child, `${index}`));
      }
    }

    return found;
  }, { sceneKeys: options.sceneKeys ?? [] });

  expect(
    leaks,
    `Raw i18n key leaks found:\n${leaks.map((leak) => `${leak.source}: ${leak.value}`).join('\n')}`,
  ).toEqual([]);
}
