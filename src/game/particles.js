let particles = [];

export function spawnParts(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, spd = 1.5 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 2,
      life: 35 + Math.random() * 20, color,
      sz: 2 + Math.random() * 3,
    });
  }
}

export function updateParts() {
  particles = particles.filter(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.life--;
    return p.life > 0;
  });
}

export function drawParts(ctx) {
  for (const p of particles) {
    ctx.globalAlpha = Math.min(1, p.life / 40);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function clearParts() {
  particles = [];
}
