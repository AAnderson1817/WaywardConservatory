import './style.css';
import './hub/style.css';
import './games/adjacent/style.css';
import './games/adjacent/flow.css';
import './games/ballast/style.css';
import { BallastScreen } from './games/ballast/screen';
import { renderArcade } from './hub/view';
import { AdjacentView } from './games/adjacent/view';
import { Session, puzzles, rooms, destinations, temperatureNames, won } from './games/adjacent/model';
import type { Action, Temperature } from './games/adjacent/model';
import { emblem } from './shared/art';
import { readSave, writeSave } from './shared/save';
import { sound, suspendAudio } from './shared/audio';
import { setMotion, pauseScenery } from './shared/scenery';

const root = document.querySelector<HTMLDivElement>('#app')!;
const loaded = readSave();
let save = loaded.save, storageWarning = loaded.unavailable;
let view: 'hub' | 'game' | 'ballast' = 'hub', puzzleIndex = 0, game = new Session(puzzles[0]);
let dialog: 'pause' | 'help' | 'result' | null = null;
let preview: Temperature | null = null, hintOpen = false, hintLevel = 0;
let notice = 'Visit a room that shares your temperature.', restoreFocus = '';
function persist() { if (!writeSave(save)) storageWarning = true; }
function stamp() { return save.completed.length === 3; }
function header() {
  return `<header class="game-topbar"><button class="text-button" data-action="hub" id="return-hub">← Arcade</button><nav aria-label="Settings"><button class="tool" id="mute" data-action="mute" aria-label="Mute sound"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4Z"/><path class="sound-waves" d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/><path class="sound-cross" d="m17 9 5 6m0-6-5 6"/></svg></button><button class="tool" id="motion" data-action="motion" aria-label="Reduce motion"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h6a3 3 0 1 1-3 3"/></svg></button><button class="round-tool" id="help" data-action="help" aria-label="Instructions" title="Instructions">?</button></nav></header>`;
}
function modal() {
  if (!dialog) return '';
  let content = '', title = '';
  if (dialog === 'pause') { title = 'A moment among the leaves.'; content = `<div class="modal-emblem">${emblem}</div><div class="eyebrow">ASSIGNMENT PAUSED</div><h2 id="dialog-title">${title}</h2><p>Your rooms are exactly as you left them.</p><button class="primary" id="resume" data-action="resume">Continue tending ↗</button><button class="text-button" data-action="hub">Return to conservatory</button>`; }
  if (dialog === 'help') { content = `<div class="eyebrow">A FIELDKEEPER'S QUICK GUIDE</div><h2 id="dialog-title">Near is a temperature.</h2><p>Travel between any rooms that share <b>Cold, Warm, or Hot</b>. Their position on the map does not matter.</p><div class="help-steps"><p><b>1. Follow a gate.</b> Click a connected room, or press its number 1–6.</p><p><b>2. Work the instruments.</b> Dials work only where you stand. Their labels name every target. Choose a temperature, inspect the preview, then apply.</p><p><b>3. Bring it home.</b> Enter the vault to collect its sealed case, then return to Reception. Opening one route can close another.</p></div><p class="help-small">Tab / Enter: all controls · Z: unlimited undo · R: restart · Esc: pause<br>Progress and settings save on this device. Three returns earn one stamp.</p><button class="primary" id="close-help" data-action="close">Understood ↗</button>`; }
  if (dialog === 'result') { content = `<div class="modal-emblem success">${emblem}</div><div class="eyebrow">${stamp() ? 'THERMAL GATEHOUSE RESTORED' : 'SEEDCASE RETURNED'}</div><h2 id="dialog-title">${stamp() ? 'A little life, returned.' : `${game.puzzle.specimen}, safely home.`}</h2><p>${stamp() ? 'All three specimens are back. Your fieldkeeper stamp is earned, and the gatehouse is glowing again.' : `A complete round trip in ${game.state.moves} actions. ${save.completed.length} of 3 seedcases returned to the conservatory.`}</p><div class="result-seeds">${puzzles.map((p, i) => `<span class="${save.completed.includes(i) ? 'collected' : ''}">◇ ${p.specimen}</span>`).join('')}</div><button class="primary" id="next" data-action="${puzzleIndex < 2 ? 'next' : 'hub'}">${puzzleIndex < 2 ? 'Next seedcase ↗' : 'See the conservatory ↗'}</button><div class="modal-actions"><button data-action="undo">↶ Undo last move</button><button data-action="restart">↻ Replay this puzzle</button><button data-action="hub">← Conservatory</button></div>`; }
  return `<div class="modal-backdrop ${dialog === 'result' ? 'result-backdrop' : ''}"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${content}</section></div>`;
}
root.innerHTML = '<div id="frame" class="app-frame"><div id="header-slot"></div><div id="content-slot" style="display:contents"></div><div id="warning-slot"></div></div><div id="modal-slot"></div>';
const frame = root.querySelector<HTMLElement>('#frame')!;
const headerSlot = root.querySelector<HTMLElement>('#header-slot')!;
const contentSlot = root.querySelector<HTMLElement>('#content-slot')!;
const modalSlot = root.querySelector<HTMLElement>('#modal-slot')!;
const warningSlot = root.querySelector<HTMLElement>('#warning-slot')!;
let mountedView: 'hub' | 'game' | 'ballast' | null = null, adjacentView: AdjacentView | null = null, ballastScreen: BallastScreen | null = null, lastModal = '', lastWarning = false;
function hub() { view = 'hub'; dialog = null; preview = null; hintOpen = false; suspendAudio(); pauseScenery(false); render('station-02'); }
function startBallast() { view = 'ballast'; dialog = null; render('b-slot-0'); }
function render(focus?: string) {
  const prior = document.activeElement as HTMLElement | null;
  document.documentElement.classList.toggle('arcade-mode', view === 'hub');
  if (view !== 'ballast') frame.inert = !!dialog;
  frame.className = view === 'hub' ? 'app-frame arcade-frame' : 'app-frame';
  if (mountedView !== view) {
    adjacentView?.dispose();
    ballastScreen?.dispose(); ballastScreen = null; adjacentView = null;
    modalSlot.innerHTML = ''; lastModal = '';
    headerSlot.innerHTML = view !== 'hub' ? header() : '';
    if (view === 'hub') contentSlot.innerHTML = renderArcade(stamp(), save.ballastStamp);
    else if (view === 'game') adjacentView = new AdjacentView(contentSlot);
    else ballastScreen = new BallastScreen({ host: contentSlot, frame, modalHost: modalSlot, save: () => save, complete: index => { if (!save.ballastCompleted.includes(index)) { save.ballastCompleted.push(index); if (save.ballastCompleted.length === 12) save.ballastStamp = true; persist(); render(); } }, hub });
    mountedView = view;
  }
  if (view !== 'hub') {
    if (view === 'game') adjacentView!.update({ game, save, puzzleIndex, preview, notice, hintOpen, hintLevel, paused: dialog === 'pause' || dialog === 'help' });
    else ballastScreen!.preferencesChanged();
    const mute = document.getElementById('mute')!, motion = document.getElementById('motion')!;
    mute.setAttribute('aria-pressed', String(save.muted));
    mute.setAttribute('aria-label', save.muted ? 'Unmute sound' : 'Mute sound');
    mute.classList.toggle('is-muted', save.muted);
    mute.title = save.muted ? 'Unmute sound' : 'Mute sound';
    motion.setAttribute('aria-pressed', String(save.reduced));
    motion.setAttribute('aria-label', save.reduced ? 'Enable motion' : 'Reduce motion');
    motion.classList.toggle('motion-off', save.reduced);
    motion.title = save.reduced ? 'Enable motion' : 'Reduce motion';
  }
  const warning = storageWarning && view !== 'hub';
  if (warning !== lastWarning) {
    warningSlot.innerHTML = warning ? '<div class="storage-warning" role="status">Progress cannot be saved in this browser.</div>' : '';
    lastWarning = warning;
  }
  if (view === 'ballast') { if (focus) document.getElementById(focus)?.focus({ preventScroll: true }); return; }
  const nextModal = dialog ? [dialog, puzzleIndex, game.state.moves, save.completed.join(',')].join(':') : '';
  const modalChanged = lastModal !== nextModal;
  if (modalChanged) { modalSlot.innerHTML = modal(); lastModal = nextModal; }
  if (dialog && modalChanged) modalSlot.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
  else if (focus) document.getElementById(focus)?.focus({ preventScroll: true });
  else if (prior?.id && !prior.isConnected) document.getElementById(prior.id)?.focus({ preventScroll: true });
}
function start(index: number) {
  puzzleIndex = index; game = new Session(puzzles[index]); view = 'game'; dialog = null; preview = null; hintOpen = false; hintLevel = 0;
  notice = ['Matching rooms share a gate.', 'Linked dials change every marked room.', 'Plan the return before entering the vault.'][index];
  pauseScenery(false); render('room-0');
}
function act(action: Action) {
  if (view !== 'game' || dialog) return;
  const before = game.state;
  if (!game.act(action)) { notice = action.type === 'travel' ? action.room === before.room ? 'You are here. Choose a dial or a connected room.' : `${rooms[action.room]} is ${temperatureNames[before.temperatures[action.room]]}. You need a ${temperatureNames[before.temperatures[before.room]]} destination.` : 'Those rooms already have this temperature.'; render(); if (action.type === 'travel') adjacentView?.reject(action.room); return; }
  preview = null;
  sound(game.state.parcel && !before.parcel ? 'pickup' : action.type === 'travel' ? 'travel' : 'dial', save.muted);
  notice = action.type === 'set' ? `${game.puzzle.instruments.find(c => c.room === before.room)!.targets.map(r => rooms[r]).join(' + ')} → ${temperatureNames[action.value]}` : game.state.parcel && !before.parcel ? 'Seedcase collected. Bring it home.' : `${rooms[before.room]} → ${rooms[game.state.room]}`;
  if (won(game.state)) { if (!save.completed.includes(puzzleIndex)) { save.completed.push(puzzleIndex); persist(); } dialog = 'result'; sound('win', save.muted); pauseScenery(true); }
  render(action.type === 'travel' ? `room-${game.state.room}` : `setting-${action.value}`);
}
function openDialog(value: typeof dialog) { restoreFocus = (document.activeElement as HTMLElement)?.id ?? ''; dialog = value; pauseScenery(true); suspendAudio(); render(); }
root.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button || button.disabled || button.closest('[inert]')) return;
  if (view === 'ballast' && !['mute', 'motion'].includes(button.dataset.action ?? '')) { ballastScreen!.handleButton(button); return; }
  if (button.dataset.room !== undefined) { act({ type: 'travel', room: Number(button.dataset.room) }); return; }
  if (button.dataset.setting !== undefined) { preview = Number(button.dataset.setting) as Temperature; render(); return; }
  if (button.dataset.station !== undefined) { if (button.dataset.station === '0') start(0); if (button.dataset.station === '1') startBallast(); return; }
  if (button.dataset.challenge !== undefined) { start(Number(button.dataset.challenge)); return; }
  switch (button.dataset.action) {
    case 'hub': view = 'hub'; dialog = null; preview = null; hintOpen = false; suspendAudio(); pauseScenery(false); render('station-01'); break;
    case 'mute': save.muted = !save.muted; if (save.muted) suspendAudio(); persist(); render(); break;
    case 'motion': save.reduced = !save.reduced; setMotion(save.reduced); persist(); render(); break;
    case 'help': openDialog('help'); break;
    case 'pause': openDialog('pause'); break;
    case 'resume': case 'close': dialog = null; pauseScenery(false); render(restoreFocus); break;
    case 'restart': start(puzzleIndex); break;
    case 'next': start(puzzleIndex + 1); break;
    case 'undo': if (game.undo()) { dialog = null; preview = null; pauseScenery(false); notice = 'Undone. Rooms, position, and seedcase restored.'; sound('undo', save.muted); render('undo'); } break;
    case 'hint': hintOpen = !hintOpen; render('hint'); break;
    case 'hint-more': hintLevel = Math.min(2, hintLevel + 1); render(hintLevel < 2 ? 'hint-more' : 'close-hint'); break;
    case 'apply': if (preview !== null) act({ type: 'set', value: preview }); break;
  }
});
document.addEventListener('keydown', event => {
  if (view === 'ballast') { ballastScreen!.handleKey(event); return; }
  if (event.key === 'Tab' && dialog) {
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('.modal button:not(:disabled)')];
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    if (dialog && dialog !== 'result') { dialog = null; pauseScenery(false); render(restoreFocus); }
    else if (!dialog && view === 'game') openDialog('pause');
    return;
  }
  if (!dialog && view === 'hub' && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    const choices = [...root.querySelectorAll<HTMLButtonElement>('.arcade-game')];
    const index = choices.indexOf(document.activeElement as HTMLButtonElement);
    const next = index < 0 ? 0 : (index + (event.key === 'ArrowRight' ? 1 : choices.length - 1)) % choices.length;
    choices[next]?.focus();
  }
  if (dialog || view !== 'game') return;
  if (/^[1-6]$/.test(event.key)) { event.preventDefault(); act({ type: 'travel', room: Number(event.key) - 1 }); }
  if (event.key.toLowerCase() === 'z') { event.preventDefault(); document.getElementById('undo')?.click(); }
  if (event.key.toLowerCase() === 'r') { event.preventDefault(); start(puzzleIndex); }
});
window.addEventListener('blur', () => { if (view === 'game' && !dialog) openDialog('pause'); if (view === 'ballast') ballastScreen?.pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && view === 'game' && !dialog) openDialog('pause'); if (document.hidden && view === 'ballast') ballastScreen?.pause(); });
if (import.meta.env.DEV) {
  Object.defineProperty(window, '__WAYWARD__', { value: { inspect: () => view === 'ballast' ? structuredClone({ view, ...ballastScreen!.inspect(), save }) : structuredClone({ view, puzzleIndex, state: game.state, history: game.history, destinations: destinations(game.state), preview, dialog, save, hintLevel }), puzzles: structuredClone(puzzles) } });
}
setMotion(save.reduced); render();
