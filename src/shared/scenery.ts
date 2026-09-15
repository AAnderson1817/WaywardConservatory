// This discrete game needs no engine loop. CSS handles its optional ambient motion.
const backdrop = document.querySelector<HTMLElement>('#scenery')!;
for (let i = 0; i < 14; i++) {
  const mote = document.createElement('i');
  mote.style.cssText = `left:${(i * 37 + 11) % 100}%;top:${(i * 23 + 7) % 100}%;animation-delay:-${i * .7}s`;
  backdrop.append(mote);
}
export function setMotion(value: boolean) { document.documentElement.classList.toggle('reduced', value); }
export function pauseScenery(value: boolean) { document.documentElement.classList.toggle('paused', value); }
