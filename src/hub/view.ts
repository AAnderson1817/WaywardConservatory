import { paintedScene } from '../shared/paint';
const games = [
  { id: '01', title: 'Adjacent', art: 'gate', description: 'Find your way through rooms connected by temperature.' },
  { id: '02', title: 'Ballast', art: 'ballast', description: 'Launch a precious core through fields of attraction and repulsion.' },
  { id: '04', title: 'Borrowed Properties', art: 'borrowed', description: 'Move useful properties from one object to another.' },
  { id: '05', title: 'Heat Shepherd', art: 'herd', description: 'Lead heat-feeding grazers to make a passage over water.' },
  { id: '06', title: 'Pocket Biome', art: 'biome', description: 'Keep a small collection of living equipment in balance.' },
];

const lock = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="15" r="1.5" fill="currentColor"/></svg>`;
const play = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m8 4 12 8L8 20Z" fill="currentColor"/></svg>`;

export function renderArcade(restored: boolean, ballastRestored = false) {
  return `<main class="arcade-screen">
    <h1 class="arcade-title"><span>The Wayward</span>Conservatory</h1>
    <div class="arcade-games" aria-label="Choose a game">
      ${games.map((game, index) => `<button
        class="arcade-game arcade-game-${index}${index === 0 && restored || index === 1 && ballastRestored ? ' restored' : ''}"
        id="station-${game.id}" data-station="${index}"
        aria-label="${game.title}${index > 1 ? ', not yet available' : ''}"
        aria-describedby="description-${game.id}" ${index > 1 ? 'aria-disabled="true"' : ''}>
        <div class="arcade-art">
          ${paintedScene('arcade-covers', index, 'arcade-cover')}
          <span class="arcade-availability">${index > 1 ? lock : play}</span>
        </div>
        <h2>${game.title}</h2>
        <p id="description-${game.id}">${game.description}</p>
      </button>`).join('')}
    </div>
  </main>`;
}
