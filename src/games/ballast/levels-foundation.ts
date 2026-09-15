import type { Chamber } from './model.ts';

/** The middle act adds a required decision before adding a narrower passage. */
export const foundationLevels: Chamber[] = [
  {
    title: 'Two deliveries', lesson: 'Each leg must leave a mineral behind.',
    hint: 'Release Skyglass on the outward leg, then Ironroot on the return leg.',
    hints: ['The receiver needs two switches. Where can you change your pair?', 'Keep Sunstone after the first release. At the far dock, prepare Ironroot and Mossjade.', 'Launch Skyglass + Sunstone and release Skyglass beneath A, slightly below the right dock. There, load Ironroot + Mossjade; release Ironroot above B as you approach the receiver’s height.'],
    docks: [{ x: 150, y: 420, r: 38, name: 'Launch' }, { x: 815, y: 175, r: 54, name: 'Refit' }, { x: 270, y: 460, r: 54, name: 'Receiver', exit: true }],
    walls: [{ x: 440, y: 265, w: 195, h: 35 }],
    switches: [{ id: 'sky', mineral: 'north', rect: { x: 305, y: 25, w: 205, h: 22 } }, { id: 'root', mineral: 'south', rect: { x: 465, y: 493, w: 195, h: 22 } }],
    gates: [{ id: 'outward', rect: { x: 690, y: 40, w: 22, h: 200 }, requires: ['sky'] }, { id: 'return', rect: { x: 450, y: 365, w: 22, h: 150 }, requires: ['root'] }],
  },
  {
    title: 'Round the roots', lesson: 'Plan three releases around one connected circuit.',
    hint: 'Work clockwise: Skyglass, Ironroot, then Mossjade.',
    hints: ['Each outer switch needs a different released mineral.', 'Use the right dock, then the low dock. Your third pair needs an upward pull and a leftward pull.', 'Release Skyglass beneath A to reach the right dock, then Ironroot above B to reach the low dock. Launch Mossjade + Skyglass; release Mossjade beside the lower half of C so the core rises into the receiver.'],
    docks: [{ x: 150, y: 420, r: 38, name: 'Launch' }, { x: 815, y: 175, r: 54, name: 'Refit' }, { x: 270, y: 460, r: 48, name: 'Refit' }, { x: 120, y: 180, r: 52, name: 'Receiver', exit: true }],
    walls: [{ x: 390, y: 280, w: 240, h: 35 }],
    switches: [{ id: 'sky', mineral: 'north', rect: { x: 305, y: 25, w: 205, h: 22 } }, { id: 'root', mineral: 'south', rect: { x: 465, y: 493, w: 195, h: 22 } }, { id: 'jade', mineral: 'west', rect: { x: 25, y: 245, w: 22, h: 145 } }],
    gates: [{ id: 'outward', rect: { x: 690, y: 40, w: 22, h: 200 }, requires: ['sky'] }, { id: 'return', rect: { x: 450, y: 365, w: 22, h: 150 }, requires: ['root'] }, { id: 'rise', rect: { x: 40, y: 230, w: 190, h: 20 }, requires: ['jade'] }],
  },
  {
    title: 'Keep your lift', lesson: 'The middle dock supplies Sunstone; carry your Skyglass there.',
    hint: 'Release Sunstone first, keeping Skyglass for the next leg.',
    hints: ['Read the supply arrows at the middle dock before choosing what to release.', 'Your first Sunstone flies right to its switch while the core keeps rising. The dock cannot replace lost Skyglass.', 'Release Sunstone while approaching the first refit from below-left. Keep Skyglass and add Sunstone; release Skyglass beneath B to approach the high dock. Refit Ironroot + Mossjade and release Ironroot above C for the return.'],
    docks: [{ x: 120, y: 440, r: 38, name: 'Launch' }, { x: 280, y: 245, r: 48, name: 'Refit', minerals: ['east'] }, { x: 815, y: 105, r: 54, name: 'Refit' }, { x: 220, y: 450, r: 56, name: 'Receiver', exit: true }],
    walls: [{ x: 420, y: 210, w: 160, h: 15 }],
    switches: [{ id: 'sun', mineral: 'east', rect: { x: 500, y: 235, w: 22, h: 145 } }, { id: 'sky', mineral: 'north', rect: { x: 345, y: 25, w: 195, h: 22 }, requires: ['sun'] }, { id: 'root', mineral: 'south', rect: { x: 420, y: 493, w: 190, h: 22 }, requires: ['sky'] }],
    gates: [{ id: 'upper', rect: { x: 610, y: 40, w: 22, h: 165 }, requires: ['sky'] }, { id: 'lower', rect: { x: 400, y: 400, w: 22, h: 115 }, requires: ['root'] }],
  },
  {
    title: 'The long relay', lesson: 'Carry Sunstone through the first refit, then close the relay.',
    hint: 'Keep Sunstone at the first dock; follow Skyglass, Ironroot, Mossjade, then the second Ironroot switch.',
    hints: ['The first refit supplies Ironroot. Which mineral must arrive with the core?', 'Keep Sunstone through the first dock. Follow the switch wires through the lower-right and upper refits before returning left.', 'Release Skyglass beneath A. Keep Sunstone, add Ironroot, and release Ironroot above B. From the lower-right dock, release Mossjade beside C while keeping Skyglass. At the upper dock, launch Ironroot + Mossjade and release Ironroot above D.'],
    docks: [{ x: 150, y: 470, r: 38, name: 'Launch' }, { x: 500, y: 175, r: 48, name: 'Refit', minerals: ['south'] }, { x: 850, y: 450, r: 48, name: 'Refit' }, { x: 625, y: 130, r: 48, name: 'Refit' }, { x: 80, y: 390, r: 40, name: 'Receiver', exit: true }],
    walls: [{ x: 500, y: 340, w: 95, h: 85 }],
    switches: [{ id: 'sky', mineral: 'north', rect: { x: 305, y: 25, w: 175, h: 22 } }, { id: 'root', mineral: 'south', rect: { x: 695, y: 493, w: 175, h: 22 }, requires: ['sky'] }, { id: 'jade', mineral: 'west', rect: { x: 320, y: 170, w: 22, h: 120 }, requires: ['root'] }, { id: 'root-return', mineral: 'south', rect: { x: 240, y: 493, w: 210, h: 22 }, requires: ['jade'] }],
    gates: [{ id: 'finish', rect: { x: 105, y: 320, w: 20, h: 175 }, requires: ['sky', 'root', 'jade', 'root-return'] }],
  },
  {
    title: 'Carry the current', lesson: 'Two refits depend on the mineral you bring with you.',
    hint: 'Carry Skyglass into the first refit and Sunstone into the second.',
    hints: ['Trace both the supply arrows and the switch wires before launching.', 'Release Sunstone, then Skyglass, then Ironroot. The first two refits can only replace the mineral you just released.', 'Release Sunstone below-left of the first refit. Keep Skyglass and add Sunstone; release Skyglass beneath B. Keep Sunstone and add Ironroot; release Ironroot above C. At the right dock, launch Skyglass + Mossjade and release Skyglass beneath D, slightly above the receiver.'],
    docks: [{ x: 120, y: 440, r: 38, name: 'Launch' }, { x: 280, y: 245, r: 48, name: 'Refit', minerals: ['east'] }, { x: 550, y: 75, r: 48, name: 'Refit', minerals: ['south'] }, { x: 820, y: 315, r: 50, name: 'Refit' }, { x: 120, y: 175, r: 50, name: 'Receiver', exit: true }],
    walls: [{ x: 390, y: 355, w: 230, h: 70 }],
    switches: [{ id: 'sun', mineral: 'east', rect: { x: 500, y: 235, w: 22, h: 145 } }, { id: 'sky', mineral: 'north', rect: { x: 345, y: 25, w: 195, h: 22 }, requires: ['sun'] }, { id: 'root', mineral: 'south', rect: { x: 685, y: 493, w: 175, h: 22 }, requires: ['sky'] }, { id: 'sky-return', mineral: 'north', rect: { x: 610, y: 25, w: 150, h: 22 }, requires: ['root'] }],
    gates: [{ id: 'outward', rect: { x: 650, y: 170, w: 22, h: 190 }, requires: ['sky'] }, { id: 'home', rect: { x: 170, y: 65, w: 22, h: 175 }, requires: ['root', 'sky-return'] }],
  },
];
