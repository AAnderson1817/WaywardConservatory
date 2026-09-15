export type Temperature = 0 | 1 | 2;
export type Instrument = { room: number; targets: number[]; settings: Temperature[]; name: string };
export type Puzzle = { title: string; specimen: string; subtitle: string; hints: [string, string, string]; initial: Temperature[]; instruments: Instrument[] };
export type State = { room: number; temperatures: Temperature[]; parcel: boolean; moves: number };
export type Action = { type: 'travel'; room: number } | { type: 'set'; value: Temperature };
export const rooms = ['Reception', 'Moss Gallery', 'Boiler Room', 'Glasshouse', 'Relay Loft', 'Seed Vault'];
export const temperatureNames = ['Cold', 'Warm', 'Hot'];
export const puzzles: Puzzle[] = [
  {
    title: 'A different kind of near', specimen: 'Mist orchid', subtitle: '01 / Learn the gates',
    hints: [
      'Which room lets you change your own temperature?',
      'The vault stays Hot, and Reception stays Warm. The gallery dial can connect you to either.',
      'From the start: Moss Gallery → Hot → Seed Vault → Moss Gallery → Warm → Reception.',
    ],
    initial: [1, 1, 0, 2, 0, 2],
    instruments: [{ room: 1, targets: [1], settings: [1, 2], name: 'Gallery gate dial' }],
  },
  {
    title: 'A message through the walls', specimen: 'Glassfern', subtitle: '02 / Remote instruments',
    hints: [
      'One dial can change a room you have not entered. Follow its target markers.',
      'Keep the gallery Cold while you use the boiler to reach the Hot vault. You will need that Cold connection on the way back.',
      'From the start: Moss Gallery → Cold → Boiler Room → Hot → Seed Vault → Boiler Room → Cold → Moss Gallery → Warm → Reception.',
    ],
    initial: [1, 1, 0, 2, 0, 2],
    instruments: [
      { room: 1, targets: [1, 2], settings: [0, 1], name: 'Moss exchange dial' },
      { room: 2, targets: [2], settings: [0, 2], name: 'Boiler gate dial' },
    ],
  },
  {
    title: 'Before you leave', specimen: 'Dawnseed', subtitle: '03 / Prepare the return',
    hints: [
      'Getting to the vault is easy. Which dial can bring you back to Warm afterward?',
      'The Relay Loft must be Cold when you leave for the vault. First use the boiler to reach a Warm glasshouse, then cool the gallery remotely so you can enter it from the Cold relay.',
      'From the start: Relay Loft → Warm → Boiler Room → Warm → Glasshouse → Cold → Relay Loft → Cold → Moss Gallery → Hot → Seed Vault → Moss Gallery → Cold → Relay Loft → Warm → Reception. If you left too early, undo or restart first.',
    ],
    initial: [1, 1, 0, 2, 1, 2],
    instruments: [
      { room: 1, targets: [1, 3], settings: [0, 2], name: 'Gallery / glasshouse' },
      { room: 2, targets: [1, 3], settings: [1, 2], name: 'Gallery / glasshouse' },
      { room: 3, targets: [1], settings: [0, 1], name: 'Gallery relay' },
      { room: 4, targets: [2, 4], settings: [0, 1], name: 'Boiler / relay' },
    ],
  },
];
export function initialState(puzzle: Puzzle): State { return { room: 0, temperatures: [...puzzle.initial], parcel: false, moves: 0 }; }
export function won(state: State) { return state.room === 0 && state.parcel; }
export function destinations(state: State): number[] { return state.temperatures.flatMap((t, i) => i !== state.room && t === state.temperatures[state.room] ? [i] : []); }
export function instrumentAt(puzzle: Puzzle, room: number) { return puzzle.instruments.find(i => i.room === room); }
export function transition(puzzle: Puzzle, state: State, action: Action): State {
  if (won(state)) return state;
  if (action.type === 'travel') {
    if (!destinations(state).includes(action.room)) return state;
    return { ...state, room: action.room, parcel: state.parcel || action.room === 5, temperatures: [...state.temperatures], moves: state.moves + 1 };
  }
  const instrument = instrumentAt(puzzle, state.room);
  if (!instrument || !instrument.settings.includes(action.value) || instrument.targets.every(r => state.temperatures[r] === action.value)) return state;
  const temperatures = [...state.temperatures];
  instrument.targets.forEach(r => { temperatures[r] = action.value; });
  return { ...state, temperatures, moves: state.moves + 1 };
}
export function actions(puzzle: Puzzle, state: State): Action[] {
  return [...destinations(state).map(room => ({ type: 'travel' as const, room })), ...(instrumentAt(puzzle, state.room)?.settings ?? []).map(value => ({ type: 'set' as const, value }))];
}
export function key(state: State) { return `${state.room}:${state.temperatures.join('')}:${+state.parcel}`; }
export class Session {
  state: State;
  puzzle: Puzzle;
  history: State[] = [];
  constructor(puzzle: Puzzle) { this.puzzle = puzzle; this.state = initialState(puzzle); }
  act(action: Action) { const next = transition(this.puzzle, this.state, action); if (next === this.state) return false; this.history.push(this.state); this.state = next; return true; }
  undo() { const previous = this.history.pop(); if (previous) this.state = previous; return !!previous; }
  restart() { this.state = initialState(this.puzzle); this.history = []; }
}
