import { actions, initialState, key, transition, won } from '../src/games/adjacent/model.ts';
import type { Puzzle, State, Action } from '../src/games/adjacent/model.ts';

export function solve(puzzle: Puzzle, start = initialState(puzzle), allowed = (_state: State, _action: Action) => true): Action[] | null {
  const queue = [{ state: start, path: [] as Action[] }], seen = new Set<string>();
  for (let i = 0; i < queue.length; i++) {
    const { state, path } = queue[i];
    if (seen.has(key(state))) continue;
    seen.add(key(state));
    if (won(state)) return path;
    for (const action of actions(puzzle, state)) {
      if (!allowed(state, action)) continue;
      const next = transition(puzzle, state, action);
      if (next !== state) queue.push({ state: next, path: [...path, action] });
    }
  }
  return null;
}

export function returnAnalysis(puzzle: Puzzle) {
  const queue = [initialState(puzzle)], seen = new Set<string>();
  let pickup = Infinity, preparedPickup = Infinity, safe = 0, trapped = 0;
  for (let i = 0; i < queue.length; i++) {
    const state = queue[i]; if (seen.has(key(state))) continue; seen.add(key(state));
    const canReturn = solve(puzzle, state) !== null;
    if (canReturn) safe++; else trapped++;
    if (state.parcel) {
      pickup = Math.min(pickup, state.moves);
      if (canReturn) preparedPickup = Math.min(preparedPickup, state.moves);
    }
    for (const action of actions(puzzle, state)) {
      const next = transition(puzzle, state, action); if (next !== state) queue.push(next);
    }
  }
  return { states: seen.size, safe, trapped, pickup, preparedPickup };
}
