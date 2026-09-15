/** Painted atlas cells retain transparent padding; collision geometry stays in the model. */
export type Sprite = 'north' | 'east' | 'south' | 'west' | 'core' | 'dock';
const cells: Record<Sprite, [number, number, number]> = { north: [272, 272, 570], east: [770, 266, 570], south: [1290, 268, 610], west: [259, 756, 565], core: [768, 743, 658], dock: [1287, 745, 590] };
export function paintSprite(id: Sprite, x: number, y: number, size: number, extra = '') {
  const [cx, cy, extent] = cells[id];
  // Clip to the original cell first, then center its painted silhouette in a padded viewport.
  const cell = ['north','east','south','west','core','dock'].indexOf(id), ox = cell % 3 * 512, oy = Math.floor(cell / 3) * 512;
  return `<svg ${extra} x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${cx - extent / 2} ${cy - extent / 2} ${extent} ${extent}" overflow="hidden" aria-hidden="true"><svg x="${ox}" y="${oy}" width="512" height="512" viewBox="${ox} ${oy} 512 512" overflow="hidden"><image href="/art/ballast-sprites.webp" width="1536" height="1024"/></svg></svg>`;
}
export function paintedGem(id: Sprite) {
  return `<span class="painted-sprite sprite-${id}" aria-hidden="true"></span>`;
}
export function paintedScene(atlas: 'adjacent-rooms' | 'arcade-covers', cell: number, className: string) {
  return `<svg class="${className}" viewBox="${cell % 3 * 512} ${Math.floor(cell / 3) * 512} 512 512" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="/art/${atlas}.webp" width="1536" height="1024"/></svg>`;
}
