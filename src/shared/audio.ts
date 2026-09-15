let context: AudioContext | undefined;
export function sound(kind: 'travel' | 'dial' | 'undo' | 'pickup' | 'win', muted: boolean) {
  if (muted) return;
  try {
    context ??= new AudioContext(); void context.resume();
    const notes = { travel: [392, 587], dial: [220, 330], undo: [392, 262], pickup: [587, 784, 988], win: [392, 494, 587, 784] }[kind];
    notes.forEach((frequency, i) => {
      const oscillator = context!.createOscillator(), gain = context!.createGain(), time = context!.currentTime + i * .075;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(.045, time + .01); gain.gain.exponentialRampToValueAtTime(.001, time + .22);
      oscillator.connect(gain); gain.connect(context!.destination); oscillator.start(time); oscillator.stop(time + .24);
    });
  } catch { /* Audio is optional; blocked audio never interrupts play. */ }
}
export function suspendAudio() { if (context?.state === 'running') void context.suspend(); }
