let audioCtx = null;
let soundIds = [];

function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

export function beep(freq, dur, delay = 0, type = 'sine') {
  try {
    const ctx = getAudio();
    const id = setTimeout(() => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq; o.type = type;
      g.gain.setValueAtTime(0.07, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + dur);
    }, delay * 1000);
    soundIds.push(id);
  } catch (e) {}
}

export function stopSounds() {
  soundIds.forEach(clearTimeout);
  soundIds = [];
}
