import type { Mineral } from '../src/games/ballast/model.ts';

export type FoundationLeg = { dock: number; load: [Mineral | null, Mineral | null]; releases: { slot: 0 | 1; axis: 'x' | 'y'; op: '>=' | '<='; value: number }[]; arrive: number };
const leg = (dock: number, load: FoundationLeg['load'], value: number, op: '>=' | '<=', arrive: number, slot: 0 | 1 = 0): FoundationLeg => ({ dock, load, releases: [{ slot, axis: 'x', op, value }], arrive });
const outward = () => leg(0, ['north', 'east'], 350, '>=', 1);
const returnLeg = () => leg(1, ['south', 'west'], 575, '<=', 2);
const rise = () => leg(2, ['west', 'north'], 170, '<=', 3);

export const foundationRoutes: FoundationLeg[][] = [
  [outward(), returnLeg()],
  [outward(), returnLeg(), rise()],
  [leg(0, ['east', 'north'], 235, '>=', 1), leg(1, ['east', 'north'], 385, '>=', 2, 1), leg(2, ['south', 'west'], 515, '<=', 3)],
  [leg(0, ['north', 'east'], 400, '>=', 1), leg(1, ['south', 'east'], 730, '>=', 2), leg(2, ['west', 'north'], 655, '<=', 3), leg(3, ['south', 'west'], 410, '<=', 4)],
  [leg(0, ['east', 'north'], 235, '>=', 1), leg(1, ['east', 'north'], 385, '>=', 2, 1), leg(2, ['east', 'south'], 745, '>=', 3, 1), leg(3, ['north', 'west'], 715, '<=', 4)],
];
