export const SAVE_KEY = 'wayward-conservatory-v1';
export type Save = { version: 1; muted: boolean; reduced: boolean; completed: number[]; ballastCompleted: number[]; ballastEdition: 2; ballastStamp: boolean };
export function parseSave(raw: string | null, reduced = false): Save {
  const fallback: Save = { version: 1, muted: false, reduced, completed: [], ballastCompleted: [], ballastEdition: 2, ballastStamp: false };
  try {
    const value = JSON.parse(raw ?? 'null');
    if (!value || value.version !== 1) return fallback;
    const completions = (list: unknown, max = 2): number[] => Array.isArray(list) ? [...new Set<number>(list.filter((i: unknown) => Number.isInteger(i) && Number(i) >= 0 && Number(i) <= max))] : [];
    const current = value.ballastEdition === 2;
    const ballastCompleted = completions(value.ballastCompleted, current ? 11 : 2);
    const ballastStamp = current ? value.ballastStamp === true || ballastCompleted.length === 12 : [0, 1, 2].every(i => ballastCompleted.includes(i));
    return { version: 1, muted: typeof value.muted === 'boolean' ? value.muted : false, reduced: typeof value.reduced === 'boolean' ? value.reduced : reduced, completed: completions(value.completed), ballastCompleted, ballastEdition: 2, ballastStamp };
  } catch { return fallback; }
}
export function readSave(): { save: Save; unavailable: boolean } {
  try { return { save: parseSave(localStorage.getItem(SAVE_KEY), matchMedia('(prefers-reduced-motion: reduce)').matches), unavailable: false }; }
  catch { return { save: parseSave(null), unavailable: true }; }
}
export function writeSave(save: Save) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch { return false; } }
