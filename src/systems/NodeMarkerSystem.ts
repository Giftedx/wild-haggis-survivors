/**
 * NodeMarkerSystem — in-world art markers for Moor Road nodes.
 *
 * NodeMapSystem remains the headless trigger authority; this class only
 * mirrors the current NodeMapState into small image markers and updates
 * their visited/current/future visual state.
 */
import * as Phaser from 'phaser';
import type { NodeDef } from '../data/nodeTypes';
import type { NodeMapState } from './NodeMapSystem';

interface MarkerView {
  image: Phaser.GameObjects.Image;
  index: number;
  baseScale: number;
}

const TYPE_TEXTURES: Record<NodeDef['type'], string> = {
  encounter: 'node_marker_encounter',
  elite: 'node_marker_elite',
  rest: 'node_marker_rest',
  hidden: 'node_marker_hidden',
  shrine: 'node_marker_shrine',
  wee_trader: 'node_marker_trader',
  bargain: 'node_marker_bargain',
};

function textureForNode(node: NodeDef): string {
  const key = node.key;
  if (key.includes('pictish')) return 'node_marker_pictish_stone';
  if (key.includes('clootie')) return 'node_marker_clootie_tree';
  if (key.includes('fairy')) return 'node_marker_fairy_ring';
  if (key.includes('rowan')) return 'node_marker_rowan';
  if (key.includes('loch') || key.includes('votive')) return 'node_marker_loch_votive';
  return TYPE_TEXTURES[node.type];
}

export class NodeMarkerSystem {
  private scene: Phaser.Scene | null = null;
  private state: NodeMapState | null = null;
  private markers: MarkerView[] = [];
  private elapsedMs = 0;

  setMap(scene: Phaser.Scene, state: NodeMapState | null): void {
    this.destroy();
    this.scene = scene;
    this.state = state;
    this.elapsedMs = 0;
    if (!state) return;

    for (let i = 0; i < state.nodes.length; i++) {
      const node = state.nodes[i];
      const pos = state.worldPositions[i];
      const texture = textureForNode(node);
      const textureKey = scene.textures.exists(texture) ? texture : TYPE_TEXTURES[node.type];
      const image = scene.add.image(pos.x, pos.y - 8, textureKey)
        .setDepth(-1)
        .setAlpha(0.62)
        .setScale(0.9);
      image.setVisible(true);
      this.markers.push({ image, index: i, baseScale: 0.9 });
    }
  }

  update(currentIndex: number, deltaMs = 16): void {
    if (!this.state || !this.scene) return;
    this.elapsedMs += deltaMs;
    const breathe = Math.sin(this.elapsedMs * 0.004);
    for (const marker of this.markers) {
      const visited = this.state.visited[marker.index];
      const isCurrent = marker.index === currentIndex;
      const future = marker.index > currentIndex;
      marker.image.setAlpha(visited ? 0.24 : isCurrent ? 0.94 : future ? 0.5 : 0.62);
      marker.image.setScale(marker.baseScale * (isCurrent ? 1.03 + breathe * 0.06 : 0.9));
      marker.image.setTint(visited ? 0x9a9a9a : 0xffffff);
    }
  }

  destroy(): void {
    if (this.scene) {
      for (const marker of this.markers) {
        this.scene.tweens.killTweensOf(marker.image);
        marker.image.destroy();
      }
    } else {
      for (const marker of this.markers) marker.image.destroy();
    }
    this.markers = [];
    this.state = null;
    this.scene = null;
    this.elapsedMs = 0;
  }
}
