import { paintedScene } from '../../shared/paint';
import { destinations, temperatureNames, instrumentAt, transition, rooms, puzzles } from './model';
import type { Session, Temperature } from './model';
import { symbols } from '../../shared/art';
import type { Save } from '../../shared/save';
import { AdjacentEffects, seedIcon } from './effects';

export type ViewContext = { game: Session; save: Save; puzzleIndex: number; preview: Temperature | null; notice: string; hintOpen: boolean; hintLevel: number; paused: boolean };
const boardOrder = [0, 3, 5, 1, 4, 2];
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const badge = (t: number) => `<span aria-hidden="true">${symbols[t]}</span> ${temperatureNames[t]}`;
const dialFace = `<div class="dial-face" aria-hidden="true"><svg viewBox="0 0 140 100" fill="none"><path class="dial-track" d="M22 78a55 55 0 0 1 96 0"/><path class="dial-ticks" d="m28 63-7-4m23-18-4-7m30-1v-9m26 17 4-7m12 29 7-4"/><g class="dial-needle"><path d="M70 89V41"/><circle cx="70" cy="86" r="6"/></g><text x="14" y="94" class="temp-0">${symbols[0]}</text><text x="70" y="18" class="temp-1">${symbols[1]}</text><text x="126" y="94" class="temp-2">${symbols[2]}</text></svg><span class="dial-readout"></span></div>`;

/** Board nodes and controls persist between actions; only changed regions update. */
export class AdjacentView {
  private host: HTMLElement;
  private puzzle = -1;
  private panelKey = '';
  private hintKey = '';
  private session?: Session;
  private effects: AdjacentEffects;
  private connectionKey = '';
  constructor(host: HTMLElement) {
    this.host = host;
    host.innerHTML = `<main class="game-view">
      <div class="game-heading"><h1>Adjacent <span id="puzzle-title"></span></h1><div class="case-progress">${seedIcon}<span id="case-progress" aria-live="polite"></span><span class="journey-track" aria-hidden="true"><i></i><b></b><i></i><b></b><i></i></span></div></div>
      <div class="assignment-bar"><div class="challenge-tabs" aria-label="Choose a challenge">${puzzles.map((p, i) => `<button id="challenge-${i}" data-challenge="${i}" aria-label="Challenge ${i + 1}: ${p.title}"><span class="challenge-mark"></span>${['Matching rooms', 'Coupled dials', 'Prepare the return'][i]}</button>`).join('')}</div><span class="rule">Same temperature. Connected rooms.</span></div>
      <div class="play-area"><section class="room-map" aria-label="Six rooms of the thermal gatehouse"><svg class="connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>${boardOrder.map(r => `<button class="room" id="room-${r}" data-room="${r}"><span class="thermal-wash" aria-hidden="true"></span><span class="gate-light" aria-hidden="true"></span><div class="room-heading"><span class="room-number">${r + 1}</span><strong>${rooms[r]}</strong><span class="temperature"></span></div><div class="room-art">${paintedScene('adjacent-rooms', r, 'room-paint')}${r === 5 ? '<span class="specimen-case painted-case" aria-hidden="true"></span>' : ''}<span class="keeper-anchor" aria-hidden="true"></span><span class="case-label" hidden></span><span class="target-label" hidden></span></div><div class="room-meta"><span class="room-state"></span><span class="dial-mark"></span></div></button>`).join('')}</section><aside class="instrument-panel" aria-label="Current room instrument"></aside></div>
      <div class="game-feedback" role="status"></div>
      <footer class="game-controls"><div><button data-action="undo" id="undo">↶ Undo <kbd>Z</kbd></button><button data-action="restart" id="restart">↻ Restart <kbd>R</kbd></button><button data-action="pause" id="pause">Ⅱ Pause <kbd>Esc</kbd></button><button data-action="hint" id="hint" aria-expanded="false">? Hint</button></div><span><span id="action-count"></span> actions <i>·</i> Rooms <kbd>1–6</kbd></span></footer>
      <div id="hint-slot"></div>
    </main>`;
    this.effects = new AdjacentEffects(host);
  }
  private get<T extends Element = HTMLElement>(selector: string) { return this.host.querySelector<T>(selector)!; }
  update(ctx: ViewContext) {
    const { game, save, puzzleIndex, preview, notice, hintOpen, hintLevel, paused } = ctx;
    const state = game.state, control = instrumentAt(game.puzzle, state.room);
    const connected = destinations(state);
    const predicted = preview === null ? null : transition(game.puzzle, state, { type: 'set', value: preview });
    const future = predicted ? destinations(predicted) : connected;
    const changedPuzzle = this.puzzle !== puzzleIndex;

    this.get('#puzzle-title').textContent = `/ ${game.puzzle.title}`;
    this.get('#case-progress').textContent = state.parcel ? 'Return to Reception' : 'Find the seedcase';
    this.get('.case-progress').dataset.stage = state.parcel ? state.room === 0 ? 'home' : 'return' : 'outward';
    puzzles.forEach((_, i) => {
      const button = this.get(`#challenge-${i}`);
      button.classList.toggle('active', i === puzzleIndex);
      button.setAttribute('aria-current', i === puzzleIndex ? 'step' : 'false');
      button.querySelector('.challenge-mark')!.textContent = save.completed.includes(i) ? '✓' : String(i + 1);
    });

    for (const r of boardOrder) {
      const node = this.get<HTMLButtonElement>(`#room-${r}`), t = state.temperatures[r];
      const local = instrumentAt(game.puzzle, r), current = r === state.room, reachable = connected.includes(r);
      const target = control?.targets.includes(r) ?? false;
      node.dataset.temperature = String(t);
      node.classList.toggle('current', current);
      node.classList.toggle('reachable', reachable);
      node.classList.toggle('target', target);
      node.classList.toggle('empty', r === 5 && state.parcel);
      node.classList.toggle('preview-connects', preview !== null && future.includes(r) && !reachable);
      node.classList.toggle('preview-closes', preview !== null && reachable && !future.includes(r));
      node.setAttribute('aria-current', current ? 'location' : 'false');
      node.setAttribute('aria-label', `${r + 1}. ${rooms[r]}. ${temperatureNames[t]}. ${current ? 'You are here' : reachable ? 'Connected, travel here' : 'Different temperature, no connection'}.${local ? ` Dial controls ${local.targets.map(n => rooms[n]).join(' and ')}; settings ${local.settings.map(v => temperatureNames[v]).join(' or ')}.` : ''}`);
      const thermometer = node.querySelector<HTMLElement>('.temperature')!;
      if (thermometer.dataset.value !== String(t)) { thermometer.innerHTML = badge(t); thermometer.className = `temperature temp-${t}`; thermometer.dataset.value = String(t); }
      node.querySelector('.room-state')!.textContent = current ? '◉ HERE' : reachable ? '↗ ENTER' : '';
      if (changedPuzzle) node.querySelector('.dial-mark')!.innerHTML = local ? `◴ → ${local.targets.map(n => `<span class="target-number">${n + 1}</span>`).join('')}<span class="dial-setting-symbols" aria-hidden="true">${local.settings.map(v => `<span class="temp-${v}">${symbols[v]}</span>`).join(' ')}</span>` : '';
      const caseLabel = node.querySelector<HTMLElement>('.case-label')!;
      caseLabel.hidden = !(r === 5 && !state.parcel || r === 0 && state.parcel);
      caseLabel.textContent = r === 5 ? 'SEEDCASE' : 'RETURN';
      const previewLabel = node.querySelector<HTMLElement>('.target-label')!;
      previewLabel.hidden = !(target && predicted);
      previewLabel.textContent = target && predicted ? `${symbols[t]} → ${symbols[predicted.temperatures[r]]} ${temperatureNames[predicted.temperatures[r]]}` : '';
    }
    this.updateConnections(state.room, connected, control?.targets ?? [], preview === null ? [] : future.filter(r => !connected.includes(r)));

    const nextPanelKey = `${state.room}:${control ? 'dial' : state.parcel}`;
    if (changedPuzzle || this.panelKey !== nextPanelKey) {
      const panel = this.get('.instrument-panel');
      panel.innerHTML = control ? `<h2>Thermostat</h2><span class="dial-origin">${rooms[state.room]}</span>${dialFace}<div class="target-chips">${control.targets.map(r => `<span class="target-chip"><span class="target-number">${r + 1}</span>${rooms[r]}</span>`).join('')}</div><div class="dial-options" aria-label="Preview a thermostat setting">${control.settings.map(value => `<button id="setting-${value}" data-setting="${value}" class="setting temp-${value}" aria-pressed="false">${badge(value)}</button>`).join('')}</div><div class="preview" aria-live="polite"></div><button class="primary apply" data-action="apply" id="apply" disabled>Apply <span>↻</span></button>` : `<h2>${state.parcel ? 'Bring it home.' : 'Follow a gate.'}</h2><p class="quiet-instruction"><span class="gate-symbol" aria-hidden="true">${state.parcel ? seedIcon : '⇄'}</span>${state.parcel ? 'Reach Reception with the seedcase.' : 'Move to a room with the same temperature.'}</p><p class="dial-key">◴ → room numbers show what each dial controls.</p>`;
    }
    if (control) {
      const common = control.targets.every(r => state.temperatures[r] === state.temperatures[control.targets[0]]) ? state.temperatures[control.targets[0]] : null;
      const shown = preview ?? common, face = this.get<HTMLElement>('.dial-face');
      face.style.setProperty('--dial-angle', `${((shown ?? 1) - 1) * 60}deg`);
      face.dataset.temperature = String(shown);
      face.classList.toggle('pending', predicted !== null && predicted !== state);
      this.get('.dial-readout').textContent = `${preview === null ? 'Targets' : 'Preview'} · ${shown === null ? 'Mixed' : temperatureNames[shown]}`;
      for (const value of control.settings) {
        const option = this.get<HTMLButtonElement>(`#setting-${value}`);
        option.classList.toggle('selected', value === preview);
        option.setAttribute('aria-pressed', String(value === preview));
      }
      const added = future.filter(r => !connected.includes(r)), removed = connected.filter(r => !future.includes(r));
      this.get('.preview').innerHTML = preview === null ? '<span>Choose a temperature to preview.</span>' : predicted === state ? '<span>Already set.</span>' : `${added.length ? `<span class="preview-line added">+ ${added.map(r => rooms[r]).join(', ')}</span>` : ''}${removed.length ? `<span class="preview-line removed">− ${removed.map(r => rooms[r]).join(', ')}</span>` : ''}${!added.length && !removed.length ? '<span>Current connections stay open.</span>' : ''}`;
      this.get<HTMLButtonElement>('#apply').disabled = !predicted || predicted === state;
    }
    this.get('.game-feedback').textContent = notice;
    this.get('#action-count').textContent = String(state.moves);
    this.get<HTMLButtonElement>('#undo').disabled = game.history.length === 0;
    this.get('#hint').setAttribute('aria-expanded', String(hintOpen));
    const nextHintKey = `${puzzleIndex}:${hintOpen}:${hintLevel}`;
    if (this.hintKey !== nextHintKey) {
      this.get('#hint-slot').innerHTML = hintOpen ? `<section class="field-note" aria-label="Optional hint"><span class="hint-step">${hintLevel + 1} / 3</span><strong>${['A question', 'A closer look', 'Complete route'][hintLevel]}</strong><p>${esc(game.puzzle.hints[hintLevel])}</p>${hintLevel < 2 ? `<button class="hint-more" data-action="hint-more" id="hint-more">${hintLevel === 0 ? 'Another clue' : 'Show the complete route'}</button>` : ''}<button data-action="hint" id="close-hint" aria-label="Close hint">×</button></section>` : '';
      this.hintKey = nextHintKey;
    }
    this.puzzle = puzzleIndex;
    this.panelKey = nextPanelKey;
    this.effects.sync(state, this.session !== game, save.reduced, paused);
    this.session = game;
  }
  reject(room: number) { this.effects.reject(room); }
  dispose() { this.effects.dispose(); }
  private updateConnections(room: number, connected: number[], targets: number[], added: number[]) {
    const next = `${room}:${connected}:${targets}:${added}`;
    if (this.connectionKey === next) return;
    this.connectionKey = next;
    const pos = (r: number) => { const n = boardOrder.indexOf(r); return { x: (n % 3) * 33.333 + 16.667, y: n < 3 ? 25 : 75 }; };
    const a = pos(room);
    const lines = (list: number[], type: string) => list.filter(r => r !== room).map(r => { const b = pos(r); return `<path class="${type}" d="M${a.x} ${a.y}L${b.x} ${b.y}"/>`; }).join('');
    this.get('.connections').innerHTML = lines(connected, 'travel-link') + lines(targets, 'control-link') + lines(added, 'future-link');
  }
}
