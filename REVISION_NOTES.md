# Sprite Revision Notes — Out-of-scope observations

These items were noticed during the P0–P6 sprite revision pass. Not acted on — flagged for human review.

1. **Boss collision radii are generic.** All bosses except the eagle share a default collision radius. With the tour bus now at 96×96, its hitbox may feel too small relative to its visual footprint. Worth playtesting whether `boss_tour_bus` needs a dedicated collision radius in `Enemy.ts`.

2. **Haggis body tilt is simulated, not true rotation.** The drift lean is achieved by offsetting leg positions and the tail, not by rotating the body ellipse (Phaser Graphics doesn't support per-shape rotation). At 56×56 this reads well, but if the sprites are ever scaled larger for a character select screen, the tilt may look like a vertical offset rather than a rotation. A true rotation would require drawing to a RenderTexture and rotating the result.

3. **The `terrier` texture key still says "terrier" despite drawing a midge.** The comment says "Highland Midge — swarm enemy replacing the terrier" but the key was kept for data compatibility. This could confuse future contributors reading `Enemy.ts` collision setup where `config.key === 'terrier'` maps to a midge collision radius of 12.

4. **The generic `boss` fallback (72×72) is never visually tested in normal gameplay** since all 5 bosses have dedicated textures. If it appears, it means a boss key lookup failed. Consider adding a console warning when the fallback is used.
