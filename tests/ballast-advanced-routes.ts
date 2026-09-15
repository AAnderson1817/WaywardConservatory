import type { Mineral } from '../src/games/ballast/model.ts';

export type AdvancedLeg = { dock: number; slots: [Mineral | null, Mineral | null]; release?: { slot: number; axis: 'x' | 'y'; at: number; direction: 1 | -1 }; wait?: number };
export const advancedRoutes: AdvancedLeg[][] = [
  [
    { dock: 1, slots: ['north', 'east'], release: { slot: 0, axis: 'x', at: 350, direction: 1 } },
    { dock: 2, slots: ['south', 'east'], release: { slot: 1, axis: 'y', at: 225, direction: 1 }, wait: 120 },
    { dock: 3, slots: ['south', 'west'], release: { slot: 0, axis: 'x', at: 735, direction: -1 } },
    { dock: 4, slots: ['north', 'west'], release: { slot: 1, axis: 'y', at: 360, direction: -1 } },
  ],
  [
    { dock: 1, slots: ['north', 'east'], release: { slot: 0, axis: 'x', at: 385, direction: 1 } },
    { dock: 2, slots: ['south', 'east'], release: { slot: 1, axis: 'y', at: 200, direction: 1 }, wait: 90 },
    { dock: 3, slots: ['south', 'west'], release: { slot: 0, axis: 'x', at: 750, direction: -1 } },
    { dock: 4, slots: ['north', 'west'], release: { slot: 1, axis: 'y', at: 360, direction: -1 } },
    { dock: 5, slots: ['north', 'east'] },
  ],
  [
    { dock: 1, slots: ['north', 'west'], release: { slot: 1, axis: 'y', at: 265, direction: -1 }, wait: 180 },
    { dock: 2, slots: ['north', 'east'], release: { slot: 0, axis: 'x', at: 435, direction: 1 } },
    { dock: 3, slots: ['south', 'east'], release: { slot: 1, axis: 'y', at: 145, direction: 1 }, wait: 120 },
    { dock: 4, slots: ['south', 'west'], release: { slot: 0, axis: 'x', at: 695, direction: -1 } },
    { dock: 5, slots: ['north', 'west'], release: { slot: 1, axis: 'y', at: 360, direction: -1 } },
    { dock: 6, slots: ['north', 'east'] },
  ],
  [
    { dock: 1, slots: ['north', 'west'], release: { slot: 1, axis: 'y', at: 265, direction: -1 }, wait: 180 },
    { dock: 2, slots: ['north', 'east'], release: { slot: 0, axis: 'x', at: 435, direction: 1 } },
    { dock: 3, slots: ['south', 'east'], release: { slot: 1, axis: 'y', at: 145, direction: 1 }, wait: 120 },
    { dock: 4, slots: ['south', 'west'], release: { slot: 0, axis: 'x', at: 695, direction: -1 } },
    { dock: 5, slots: ['north', 'west'], release: { slot: 1, axis: 'y', at: 360, direction: -1 } },
    { dock: 0, slots: ['south', 'east'], release: { slot: 0, axis: 'x', at: 275, direction: 1 }, wait: 180 },
    { dock: 6, slots: ['north', 'east'], release: { slot: 1, axis: 'y', at: 265, direction: -1 } },
  ],
];

// Each interval varies one release independently; all other decisions stay fixed.
// Endpoints are inclusive offsets from the authored release coordinate.
export const advancedWindows: ([number, number] | null)[][] = [
  [[-25, 40], [-30, 45], [-35, 30], [-40, 30]],
  [[-25, 45], [-30, 55], [-35, 30], [-40, 30], null],
  [[-30, 30], [-30, 30], [-30, 40], [-35, 30], [-35, 30], null],
  [[-30, 30], [-30, 30], [-30, 40], [-35, 30], [-35, 30], [-35, 45], [-45, 25]],
];
