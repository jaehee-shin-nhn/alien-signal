import { beep, stopSounds } from './audio';
import { spawnParts } from './particles';
import { TRANSLATIONS } from '../i18n';

let _engineLang = 'ko';
export function setEngineLang(lang) { _engineLang = lang; }
function _hint(key) { return TRANSLATIONS[_engineLang]?.canvasHints?.[key] ?? TRANSLATIONS.ko.canvasHints[key]; }
function _msg(key) { return TRANSLATIONS[_engineLang]?.[key] ?? TRANSLATIONS.ko[key]; }

// ── BOLT 미니게임 ──
export function initBolt(mgCvs, MG, showFeedback, mgFail, mgSuccess) {
  const cw = mgCvs.width, ch = mgCvs.height;
  const cx = cw * 0.62, cy = ch * 0.5;
  const offsets = [[-88, -56], [88, -56], [-88, 56], [88, 56]];
  MG.bolts = offsets.map(([dx, dy]) => ({ x: cx + dx, y: cy + dy, oiled: false, done: false, shakeT: 0 }));

  mgCvs.onclick = e => {
    if (MG.done) return;
    if (!MG.curTool) { showFeedback('🛠️?', '#ff9900'); return; }
    const rect = mgCvs.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    for (const b of MG.bolts) {
      if (b.done) continue;
      const dx = mx - b.x, dy = my - b.y;
      if (dx * dx + dy * dy <= 32 * 32) {
        if (MG.curTool.id === 'oil') {
          if (!b.oiled) { b.oiled = true; spawnParts(b.x, b.y, '#ffcc00', 12); beep(400, 0.1); showFeedback('💧✓', '#ffcc44'); }
          else showFeedback('💧', '#666666');
        } else if (MG.curTool.id === 'wrench') {
          if (!b.oiled) { b.shakeT = 22; beep(140, 0.2, 0, 'sawtooth'); spawnParts(b.x, b.y, '#ff6600', 5); showFeedback('🔧❌', '#ff6600'); }
          else {
            b.done = true; spawnParts(b.x, b.y, '#39ff14', 14); beep(520, 0.08); setTimeout(() => beep(700, 0.12), 110);
            const n = MG.bolts.filter(bt => bt.done).length;
            if (MG.bolts.every(bt => bt.done)) { showFeedback('✓✓✓✓', '#39ff14'); setTimeout(() => mgSuccess(), 400); }
            else showFeedback(`✓ ${n}/4`, '#ffcc00');
          }
        } else showFeedback('❌', '#884400');
        return;
      }
    }
    showFeedback('❓', '#ffaa00');
  };
  mgCvs.onmousemove = e => {
    const rect = mgCvs.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    for (const b of MG.bolts) {
      if (b.done) continue;
      const dx = mx - b.x, dy = my - b.y;
      if (dx * dx + dy * dy <= 32 * 32) { mgCvs.style.cursor = 'crosshair'; return; }
    }
    mgCvs.style.cursor = MG.curTool ? 'cell' : 'default';
  };
}

export function drawBolt(ctx, MG, now, cw, ch) {
  const t = now * 0.001;
  ctx.clearRect(0, 0, cw, ch);
  for (let x = 0; x < cw; x += 50) { ctx.fillStyle = 'rgba(255,200,0,0.03)'; ctx.fillRect(x, 0, 1, ch); }
  for (let y = 0; y < ch; y += 50) { ctx.fillStyle = 'rgba(255,200,0,0.03)'; ctx.fillRect(0, y, cw, 1); }
  const cx = cw * 0.62, cy = ch * 0.5;
  ctx.fillStyle = '#0c0c00'; ctx.fillRect(cx - 130, cy - 105, 260, 210);
  ctx.strokeStyle = '#3a3a00'; ctx.lineWidth = 3; ctx.strokeRect(cx - 130, cy - 105, 260, 210);
  ctx.strokeStyle = 'rgba(255,200,0,0.07)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 130, cy); ctx.lineTo(cx + 130, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 105); ctx.lineTo(cx, cy + 105); ctx.stroke();
  ctx.fillStyle = 'rgba(255,160,0,0.25)'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('⚠ STABILIZER PANEL', cx, cy - 100);
  MG.bolts.forEach((b, i) => {
    let bx = b.x, by = b.y;
    if (b.shakeT > 0) { b.shakeT--; bx += (Math.random() - 0.5) * 9; by += (Math.random() - 0.5) * 4; }
    if (b.oiled && !b.done) {
      const og = ctx.createRadialGradient(bx, by, 0, bx, by, 38);
      og.addColorStop(0, 'rgba(255,200,0,0.22)'); og.addColorStop(1, 'transparent');
      ctx.fillStyle = og; ctx.beginPath(); ctx.arc(bx, by, 38, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = b.done ? '#1a3300' : b.oiled ? '#181a00' : '#181818';
    ctx.beginPath(); ctx.arc(bx, by, 24, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = b.done ? '#44ee22' : b.oiled ? 'rgba(255,200,0,0.75)' : 'rgba(255,120,0,0.35)';
    ctx.lineWidth = 2.5; ctx.stroke();
    ctx.save(); ctx.translate(bx, by);
    if (!b.done && b.oiled) ctx.rotate(t * 0.8 + i);
    ctx.fillStyle = b.done ? '#33dd11' : b.oiled ? '#ccaa00' : '#555533';
    ctx.beginPath();
    for (let j = 0; j < 6; j++) { const a = j * Math.PI / 3; j === 0 ? ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14) : ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 7); ctx.stroke();
    ctx.restore();
    if (b.oiled && !b.done) { ctx.fillStyle = 'rgba(255,200,0,0.85)'; ctx.font = '11px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('💧', bx, by + 26); }
    if (!b.done && !b.oiled) { ctx.fillStyle = 'rgba(255,100,0,0.45)'; ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('LOCKED', bx, by + 27); }
  });
  const done = MG.bolts.filter(b => b.done).length;
  ctx.fillStyle = 'rgba(255,200,0,0.65)'; ctx.font = '11px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(`🔩 ${done}/4`, cw / 2, 8);
}

// ── BUG 미니게임 ──
export function initBug(mgCvs, MG, showFeedback, mgFail, mgSuccess) {
  const cw = mgCvs.width, ch = mgCvs.height;
  MG.targetCount = 5; MG.killed = 0; MG.bugs = [];
  for (let i = 0; i < 5; i++) {
    const ceil = i < 2;
    MG.bugs.push({ x: cw * (0.25 + Math.random() * 0.5), y: ceil ? ch * (0.07 + Math.random() * 0.15) : ch * (0.55 + Math.random() * 0.28), vx: (Math.random() < 0.5 ? 1 : -1) * (1.8 + Math.random() * 1.2), vy: (Math.random() - 0.5) * 1.2, r: 18, color: 'red', alive: true, ceiling: ceil, leg: Math.random() * Math.PI * 2 });
  }
  for (let i = 0; i < 4; i++) {
    const ceil = i < 1;
    MG.bugs.push({ x: cw * (0.2 + Math.random() * 0.6), y: ceil ? ch * (0.05 + Math.random() * 0.18) : ch * (0.5 + Math.random() * 0.33), vx: (Math.random() < 0.5 ? 1 : -1) * (1.5 + Math.random() * 1.0), vy: (Math.random() - 0.5) * 1.0, r: 16, color: 'safe', alive: true, ceiling: ceil, leg: Math.random() * Math.PI * 2 });
  }
  mgCvs.onclick = e => {
    if (MG.done) return;
    if (!MG.curTool) { showFeedback('🛠️?', '#ff9900'); return; }
    const rect = mgCvs.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    for (const bug of MG.bugs) {
      if (!bug.alive) continue;
      const dx = mx - bug.x, dy = my - bug.y;
      if (dx * dx + dy * dy <= bug.r * bug.r) {
        if (MG.curTool.id === 'pesticide') {
          if (bug.color === 'red') {
            bug.alive = false; spawnParts(bug.x, bug.y, '#ff4444', 10); spawnParts(bug.x, bug.y, '#ffaa00', 5);
            beep(600, 0.07); setTimeout(() => beep(800, 0.05), 80); MG.killed++;
            if (MG.killed >= MG.targetCount) { showFeedback('✓✓✓', '#39ff14'); setTimeout(() => mgSuccess(), 600); }
            else showFeedback(`✓ ${MG.killed}/${MG.targetCount}`, '#ffcc00');
          } else { spawnParts(bug.x, bug.y, '#4488ff', 8); beep(200, 0.25, 0, 'sawtooth'); showFeedback('💙❌', '#ff4444'); mgFail(); }
        } else showFeedback('❌', '#884400');
        return;
      }
    }
    showFeedback('❓', '#ffaa00');
  };
  mgCvs.onmousemove = e => { mgCvs.style.cursor = MG.curTool ? 'crosshair' : 'default'; };
}

export function drawBug(ctx, MG, now, cw, ch) {
  ctx.clearRect(0, 0, cw, ch);
  ctx.strokeStyle = 'rgba(100,0,200,0.18)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, ch * 0.33); ctx.lineTo(cw, ch * 0.33); ctx.stroke();
  ctx.fillStyle = '#100308'; ctx.fillRect(0, ch * 0.86, cw, ch * 0.14);
  ctx.strokeStyle = 'rgba(150,30,30,0.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, ch * 0.86); ctx.lineTo(cw, ch * 0.86); ctx.stroke();
  for (let x = 0; x < cw; x += 60) { ctx.fillStyle = 'rgba(60,20,90,0.04)'; ctx.fillRect(x, 0, 1, ch); }
  for (let y = 0; y < ch; y += 60) { ctx.fillStyle = 'rgba(60,20,90,0.04)'; ctx.fillRect(0, y, cw, 1); }
  ctx.fillStyle = 'rgba(120,60,200,0.18)'; ctx.font = '9px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('▲ CEILING', 4, 4);
  ctx.fillStyle = 'rgba(150,30,30,0.18)'; ctx.textBaseline = 'bottom'; ctx.fillText('▼ FLOOR', 4, ch - 2);

  MG.bugs.forEach(bug => {
    if (!bug.alive) return;
    bug.x += bug.vx; bug.y += bug.vy; bug.leg += 0.22;
    if (bug.x < 28 || bug.x > cw - 28) { bug.vx *= -1; bug.x = Math.max(28, Math.min(cw - 28, bug.x)); }
    const yMin = bug.ceiling ? 14 : ch * 0.35, yMax = bug.ceiling ? ch * 0.31 : ch * 0.83;
    if (bug.y < yMin || bug.y > yMax) { bug.vy *= -1; bug.y = Math.max(yMin, Math.min(yMax, bug.y)); }
    const isR = bug.color === 'red';
    ctx.save(); ctx.translate(bug.x, bug.y);
    if (bug.ceiling) ctx.scale(1, -1);
    if (isR) {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, bug.r + 10);
      g.addColorStop(0, 'rgba(255,50,50,0.22)'); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, bug.r + 10, 0, Math.PI * 2); ctx.fill();
    }
    const lc = isR ? '#bb2200' : '#224488';
    for (let l = 0; l < 6; l++) {
      const sd = l < 3 ? -1 : 1, li = l % 3;
      const wave = Math.sin(bug.leg + li * 1.2) * 5 * sd;
      ctx.strokeStyle = lc; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sd * bug.r * 0.5, -bug.r * 0.25 + li * bug.r * 0.28);
      ctx.lineTo(sd * (bug.r * 0.85 + wave), -bug.r * 0.25 + li * bug.r * 0.28 + 4); ctx.stroke();
    }
    ctx.fillStyle = isR ? '#cc2000' : '#1a3080';
    ctx.beginPath(); ctx.ellipse(0, 0, bug.r * 0.72, bug.r * 0.52, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = isR ? '#ff4400' : '#2a50b0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-bug.r * 0.5, 0); ctx.lineTo(bug.r * 0.5, 0); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, bug.r * 0.72, bug.r * 0.52, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = isR ? '#dd2800' : '#1a3888';
    ctx.beginPath(); ctx.ellipse(bug.r * 0.58, 0, bug.r * 0.26, bug.r * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    const ah = bug.r * 0.58;
    ctx.strokeStyle = isR ? '#ff5533' : '#3355cc'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ah, bug.r * 0.08); ctx.lineTo(ah + bug.r * 0.38, -bug.r * 0.32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ah, -bug.r * 0.08); ctx.lineTo(ah + bug.r * 0.32, bug.r * 0.26); ctx.stroke();
    ctx.fillStyle = isR ? '#ffcc00' : '#ffffff';
    ctx.beginPath(); ctx.arc(ah + bug.r * 0.1, bug.r * 0.07, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ah + bug.r * 0.1, -bug.r * 0.07, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });
  const rem = MG.targetCount - (MG.killed || 0);
  ctx.fillStyle = 'rgba(255,80,80,0.7)'; ctx.font = '11px monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(`🐛 ${rem}`, cw / 2, 8);
}

// ── FIRE 미니게임 ──
export function initFireOut(mgCvs, MG, showFeedback, mgFail, mgSuccess) {
  const cw = mgCvs.width, ch = mgCvs.height;
  MG.fires = [
    { x: cw * 0.28, y: ch * 0.65, stage: 2, sz: 1.0 }, { x: cw * 0.43, y: ch * 0.56, stage: 2, sz: 0.85 },
    { x: cw * 0.59, y: ch * 0.68, stage: 2, sz: 1.1 }, { x: cw * 0.72, y: ch * 0.52, stage: 2, sz: 0.9 },
    { x: cw * 0.37, y: ch * 0.5, stage: 2, sz: 0.95 },
  ];
  const alarm = setInterval(() => {
    if (MG.done) { clearInterval(alarm); return; }
    beep(880, 0.04); setTimeout(() => beep(880, 0.04), 150);
  }, 480);
  MG.alarmInterval = alarm;

  mgCvs.onclick = e => {
    if (MG.done) return;
    if (!MG.curTool) { showFeedback('🛠️?', '#ff9900'); return; }
    const rect = mgCvs.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    if (MG.curTool.id === 'coolant') {
      if (MG.fires.every(f => f.stage <= 1)) {
        MG.fires.forEach(f => { f.stage = 0; });
        spawnParts(cw / 2, ch / 2, '#00aaff', 40); spawnParts(cw / 2, ch / 2, '#aaeeff', 20);
        beep(440, 0.05); setTimeout(() => beep(660, 0.05), 100); setTimeout(() => beep(880, 0.15), 200);
        showFeedback('❄️✓', '#39ff14'); setTimeout(() => mgSuccess(), 600);
      } else { showFeedback('🔥→🧯', '#ff6600'); beep(200, 0.15, 0, 'sawtooth'); }
      return;
    }
    if (MG.curTool.id === 'extinguisher') {
      let hit = false;
      for (const f of MG.fires) {
        if (f.stage === 0) continue;
        const hr = 48 * f.sz * (f.stage === 2 ? 1 : 0.6);
        const dx = mx - f.x, dy = my - (f.y - hr * 0.5);
        if (dx * dx + dy * dy <= hr * hr) {
          hit = true;
          if (f.stage === 2) { f.stage = 1; spawnParts(f.x, f.y, '#aaeeff', 12); spawnParts(f.x, f.y, '#ffffff', 5); beep(320, 0.12); showFeedback('🧯✓···', '#88ccff'); }
          else { showFeedback('🧯❌→❄️', '#ff9900'); beep(240, 0.1); }
          break;
        }
      }
      if (!hit) showFeedback('🎯', '#ffaa00');
      if (!MG.done && MG.fires.every(f => f.stage <= 1)) setTimeout(() => { if (!MG.done) showFeedback('❄️!', '#00ccff'); }, 500);
      return;
    }
    showFeedback('❌', '#884400');
  };
  mgCvs.onmousemove = e => { mgCvs.style.cursor = MG.curTool ? 'crosshair' : 'default'; };
}

// ── MONSTER 미니게임 ──
export function initMonster(mgCvs, MG, showFeedback, _mgFail, mgSuccess) {
  const cw = mgCvs.width, ch = mgCvs.height;
  MG.monster = { x: cw * 0.76, y: ch * 0.5, hp: 6, maxHp: 6, shakeT: 0, hitFlash: 0 };
  MG.bolts = [];
  MG.validTool = 'zapper';
  MG.playerY = ch * 0.5;
  MG.autoAttackTimer = 0;
  MG._feedback = showFeedback;
  MG._success = mgSuccess;

  MG.boltInterval = setInterval(() => {
    if (MG.done) { clearInterval(MG.boltInterval); return; }
    const m = MG.monster;
    MG.bolts.push({
      x: m.x - 45, y: m.y + (Math.random() - 0.5) * 60,
      vx: -(4 + Math.random() * 2), vy: (Math.random() - 0.5) * 1.4,
      alive: true,
    });
    beep(280, 0.06, 0, 'square');
  }, 1600);

  mgCvs.onclick = () => {
    if (MG.done) return;
    if (!MG.curTool) showFeedback('🛠️?', '#ff9900');
    else if (MG.curTool.id !== MG.validTool) { beep(140, 0.15, 0, 'sawtooth'); showFeedback(_msg('needZapper'), '#ff4400'); }
  };
  mgCvs.onmousemove = () => { mgCvs.style.cursor = MG.curTool ? 'crosshair' : 'default'; };
}

export function drawMonster(ctx, MG, now, cw, ch) {
  const t = now * 0.001;
  ctx.clearRect(0, 0, cw, ch);
  for (let x = 0; x < cw; x += 60) { ctx.fillStyle = 'rgba(0,80,255,0.04)'; ctx.fillRect(x, 0, 1, ch); }
  for (let y = 0; y < ch; y += 60) { ctx.fillStyle = 'rgba(0,80,255,0.04)'; ctx.fillRect(0, y, cw, 1); }

  // 플레이어 이동
  const keys = MG.keys || {};
  if (!MG.done) {
    if (keys['ArrowUp'] || keys['w']) MG.playerY = Math.max(ch * 0.1, MG.playerY - 3);
    if (keys['ArrowDown'] || keys['s']) MG.playerY = Math.min(ch * 0.9, MG.playerY + 3);
  }
  const px = cw * 0.12, py = MG.playerY;

  // 몬스터 이동 (플레이어 방향으로 접근 + Y 추적)
  const m = MG.monster;
  if (!MG.done) {
    m.x -= 0.55;
    m.y += (py - m.y) * 0.02;
    // 플레이어에 너무 가까워지면 라이프 감소 후 리셋
    if (m.x <= px + 58 && !MG._mhCd) {
      MG._mhCd = 90;
      m.x = cw * 0.76; m.y = ch * 0.5;
      spawnParts(px, py, '#ff3300', 14);
      beep(150, 0.35, 0, 'sawtooth');
      MG._failPending = true;
    }
    if (MG._mhCd > 0) MG._mhCd--;
  }

  // 자동공격 (올바른 도구 선택 시)
  const AUTO_INTERVAL = 75;
  if (!MG.done && MG.curTool && MG.curTool.id === MG.validTool) {
    MG.autoAttackTimer++;
    if (MG.autoAttackTimer >= AUTO_INTERVAL) {
      MG.autoAttackTimer = 0;
      m.hp--; m.shakeT = 12; m.hitFlash = 8;
      spawnParts(m.x, m.y, '#00aaff', 10);
      beep(580, 0.08); setTimeout(() => beep(880, 0.06), 80);
      MG._beam = { life: 14, x1: px + 10, y1: py, x2: m.x - 40, y2: m.y };
      if (MG._feedback) MG._feedback(`⚡ ${Math.max(0, m.hp)}/${m.maxHp}`, '#00ccff');
      if (m.hp <= 0) {
        spawnParts(m.x, m.y, '#39ff14', 30); spawnParts(m.x, m.y, '#ffffff', 12);
        if (MG._feedback) MG._feedback('✓✓✓', '#39ff14');
        const successFn = MG._success;
        setTimeout(() => successFn && successFn(), 500);
      }
    }
  } else {
    MG.autoAttackTimer = 0;
  }

  // 플레이어 그리기
  ctx.strokeStyle = 'rgba(0,220,80,0.22)'; ctx.lineWidth = 1;
  ctx.strokeRect(px - 22, py - 36, 44, 72);
  ctx.fillStyle = 'rgba(0,220,80,0.55)';
  ctx.beginPath(); ctx.arc(px, py - 18, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(px - 7, py - 9, 14, 22);
  ctx.fillRect(px - 12, py - 4, 9, 8);
  ctx.fillStyle = 'rgba(0,220,80,0.3)'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
  ctx.fillText('YOU', px, py + 20);
  ctx.fillText('↑↓', px, py + 30);

  // 자동공격 차지 바
  if (MG.curTool && MG.curTool.id === MG.validTool) {
    const chargeF = MG.autoAttackTimer / AUTO_INTERVAL;
    const bw = 44, bh = 5, bx = px - bw / 2, by = py - 48;
    ctx.fillStyle = '#001122'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = chargeF > 0.8 ? '#ffee00' : '#00ccff';
    ctx.fillRect(bx, by, bw * chargeF, bh);
    ctx.strokeStyle = 'rgba(0,200,255,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
  }

  // 어택 빔
  if (MG._beam && MG._beam.life > 0) {
    const alpha = MG._beam.life / 14;
    MG._beam.life--;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#00eeff'; ctx.lineWidth = 4;
    ctx.shadowColor = '#00eeff'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(MG._beam.x1, MG._beam.y1); ctx.lineTo(MG._beam.x2, MG._beam.y2); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(MG._beam.x1, MG._beam.y1); ctx.lineTo(MG._beam.x2, MG._beam.y2); ctx.stroke();
    ctx.restore();
  }

  // 볼트 이동 + 충돌
  for (let i = MG.bolts.length - 1; i >= 0; i--) {
    const bolt = MG.bolts[i];
    bolt.x += bolt.vx; bolt.y += bolt.vy;
    if (bolt.x <= px + 22 && bolt.y >= py - 36 && bolt.y <= py + 36) {
      spawnParts(px, py, '#ff4400', 8);
      beep(180, 0.25, 0, 'sawtooth');
      if (!MG.done) MG._failPending = true;
      MG.bolts.splice(i, 1); continue;
    }
    if (bolt.x < -20) { MG.bolts.splice(i, 1); continue; }
    const tailLen = 24;
    const grad = ctx.createLinearGradient(bolt.x + tailLen, bolt.y, bolt.x, bolt.y);
    grad.addColorStop(0, 'rgba(255,180,0,0)'); grad.addColorStop(1, 'rgba(255,220,50,0.85)');
    ctx.strokeStyle = grad; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(bolt.x + tailLen, bolt.y); ctx.lineTo(bolt.x, bolt.y); ctx.stroke();
    ctx.fillStyle = '#ffe066';
    ctx.beginPath(); ctx.arc(bolt.x, bolt.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,0,0.22)';
    ctx.beginPath(); ctx.arc(bolt.x, bolt.y, 10, 0, Math.PI * 2); ctx.fill();
  }

  // 몬스터 그리기
  let mx = m.x, my = m.y;
  if (m.shakeT > 0) { m.shakeT--; mx += (Math.random() - 0.5) * 10; my += (Math.random() - 0.5) * 6; }
  if (m.hitFlash > 0) m.hitFlash--;
  const hit = m.hitFlash > 0;
  const gr = ctx.createRadialGradient(mx, my, 0, mx, my, 65 + 8 * Math.sin(t * 2.2));
  gr.addColorStop(0, hit ? 'rgba(0,200,255,0.3)' : 'rgba(160,0,255,0.22)'); gr.addColorStop(1, 'transparent');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(mx, my, 75, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = hit ? '#55ccff' : '#3d006b';
  ctx.beginPath();
  ctx.ellipse(mx, my, 40 + 2 * Math.sin(t * 1.4), 50 + 2 * Math.sin(t * 1.8), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hit ? '#00ffff' : '#9900ff'; ctx.lineWidth = 2.5; ctx.stroke();
  [[-18, 0], [0, -7], [18, 0]].forEach(([ex, ey], ei) => {
    const eyeX = mx + ex, eyeY = my - 8 + ey;
    ctx.fillStyle = '#110020'; ctx.beginPath(); ctx.arc(eyeX, eyeY, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hit ? '#ffffff' : '#ff2200';
    ctx.beginPath(); ctx.arc(eyeX + Math.sin(t * 1.8 + ei) * 2, eyeY + Math.cos(t * 1.5 + ei), 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.beginPath(); ctx.arc(eyeX - 1, eyeY - 1, 2, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = hit ? '#55ccff' : '#3d006b';
  ctx.save(); ctx.translate(mx - 40, my + 8);
  ctx.rotate(-0.25 + Math.sin(t * 2.5) * 0.15);
  ctx.fillRect(-26, -6, 26, 12);
  ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.arc(-26, 0, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(255,160,0,${0.3 + 0.2 * Math.sin(t * 5)})`;
  ctx.beginPath(); ctx.arc(-26, 0, 13, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = hit ? '#55ccff' : '#3d006b';
  ctx.save(); ctx.translate(mx - 40, my - 15);
  ctx.rotate(0.3 + Math.sin(t * 2.2) * 0.12);
  ctx.fillRect(-20, -5, 20, 10); ctx.restore();
  [-14, 14].forEach(lx => { ctx.fillStyle = hit ? '#55ccff' : '#3d006b'; ctx.fillRect(mx + lx - 8, my + 46, 16, 16); });
  // HP 바
  const hpBarW = 84, hpBarH = 9, hpBarX = mx - hpBarW / 2, hpBarY = my - 72;
  ctx.fillStyle = '#1a0028'; ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
  ctx.strokeStyle = '#660088'; ctx.lineWidth = 1; ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);
  const hpF = Math.max(0, m.hp) / m.maxHp;
  ctx.fillStyle = hpF > 0.5 ? '#00ee88' : hpF > 0.25 ? '#ffcc00' : '#ff3300';
  ctx.fillRect(hpBarX + 1, hpBarY + 1, (hpBarW - 2) * hpF, hpBarH - 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '9px monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText(`HP ${Math.max(0, m.hp)}/${m.maxHp}`, mx, hpBarY - 1);
  // 거리 경고
  const dist = m.x - px;
  if (dist < cw * 0.35) {
    const danger = 1 - dist / (cw * 0.35);
    ctx.fillStyle = `rgba(255,0,0,${danger * 0.12})`;
    ctx.fillRect(0, 0, cw, ch);
  }
  // HUD
  ctx.fillStyle = 'rgba(80,120,255,0.7)'; ctx.font = '11px monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('👾 MONSTER', cw / 2, 8);
}

export function drawFireOut(ctx, MG, now, cw, ch) {
  const t = now * 0.001;
  ctx.clearRect(0, 0, cw, ch);
  for (let s = 0; s < 4; s++) {
    const sp = (t * 0.09 + s * 0.25) % 1;
    ctx.globalAlpha = sp * (1 - sp) * 0.13; ctx.fillStyle = '#443322';
    ctx.beginPath(); ctx.arc(cw * (0.15 + s * 0.22), ch * (0.04 + sp * 0.34), 38 + sp * 55, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#120500'; ctx.fillRect(0, ch * 0.8, cw, ch * 0.2);
  ctx.strokeStyle = '#330d00'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, ch * 0.8); ctx.lineTo(cw, ch * 0.8); ctx.stroke();
  MG.fires.forEach((f, i) => {
    if (f.stage === 0) {
      for (let s = 0; s < 2; s++) {
        const sp = (t * 0.38 + s * 0.5 + i * 0.18) % 1;
        ctx.globalAlpha = (1 - sp) * 0.14; ctx.fillStyle = '#555';
        ctx.beginPath(); ctx.arc(f.x + Math.sin(sp * 5) * 7, f.y - sp * 38, 5 + sp * 9, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1; return;
    }
    const fl = 0.85 + 0.15 * Math.sin(t * 12 + i * 2.1);
    const sc = f.stage === 2 ? 1 : 0.48;
    const h = 64 * f.sz * fl * sc, fw = 21 * f.sz * sc;
    const grd = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, h * 1.8);
    if (f.stage === 2) { grd.addColorStop(0, 'rgba(255,200,60,0.68)'); grd.addColorStop(0.4, 'rgba(255,80,0,0.42)'); grd.addColorStop(1, 'transparent'); }
    else { grd.addColorStop(0, 'rgba(255,140,40,0.48)'); grd.addColorStop(0.4, 'rgba(200,60,0,0.28)'); grd.addColorStop(1, 'transparent'); }
    ctx.fillStyle = grd; ctx.fillRect(f.x - h * 2, f.y - h * 2, h * 4, h * 3);
    ctx.fillStyle = `rgba(255,${130 + Math.floor(70 * fl)},0,0.9)`;
    ctx.beginPath(); ctx.moveTo(f.x - fw, f.y + 5);
    ctx.quadraticCurveTo(f.x - fw * 0.4 + Math.sin(t * 4 + i) * 6, f.y - h * 0.4, f.x + Math.sin(t * 2.8 + i) * 8, f.y - h);
    ctx.quadraticCurveTo(f.x + fw * 0.4 + Math.sin(t * 5 + i) * 6, f.y - h * 0.4, f.x + fw, f.y + 5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(255,255,140,${0.68 * fl})`;
    ctx.beginPath(); ctx.ellipse(f.x + Math.sin(t * 3 + i) * 2, f.y - h * 0.26, 7 * f.sz * fl * sc, 13 * f.sz * fl * sc, 0, 0, Math.PI * 2); ctx.fill();
    if (f.stage === 1) { ctx.fillStyle = 'rgba(0,200,255,0.7)'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('↓', f.x, f.y - h - 4); }
  });
  const rem = MG.fires.filter(f => f.stage > 0).length, big = MG.fires.filter(f => f.stage === 2).length;
  let hudText = `🔥 ${rem}/5`;
  if (big === 0 && rem > 0) hudText = '❄️!';
  ctx.fillStyle = 'rgba(255,80,0,0.7)'; ctx.font = '11px monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(hudText, cw / 2, 8);
}

// ═══════════════════════════════════════════════════════
//  EASY MODE — GIMMICK ENGINES (ported from game_10.html)
// ═══════════════════════════════════════════════════════

function _rnd(a, b) { return a + Math.random() * (b - a); }
function _inRect(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
function _shuffle(a) { const b = [...a]; for (let i = b.length-1; i>0; i--) { const j=0|Math.random()*(i+1); [b[i],b[j]]=[b[j],b[i]]; } return b; }

function _alienPosMobile(cw, ch) {
  if (cw > ch * 1.5) {
    const sc = Math.min(0.8, ch / 140);
    return { ax: ch * 0.45, ay: ch * 0.45, sc };
  }
  return { ax: cw / 2, ay: ch * 0.55, sc: 0.85 };
}

function _drawAlienFig(ctx, cx, cy, sc, bodyCol, eyeCol, tilt, extraFn) {
  const bx = cx + (tilt || 0);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(cx, cy+22*sc, 14*sc, 4*sc, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = bodyCol;
  ctx.fillRect(bx-11*sc, cy+14*sc, 9*sc, 14*sc);
  ctx.fillRect(bx+2*sc, cy+14*sc, 9*sc, 14*sc);
  ctx.fillRect(bx-24*sc, cy-2*sc, 13*sc, 7*sc);
  ctx.fillRect(bx+11*sc, cy-2*sc, 13*sc, 7*sc);
  ctx.beginPath(); ctx.ellipse(bx, cy, 14*sc, 18*sc, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = eyeCol || '#9b6ec0';
  ctx.beginPath(); ctx.arc(bx, cy-24*sc, 12*sc, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.ellipse(bx-4*sc, cy-25*sc, 3.5*sc, 2.5*sc, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bx+4*sc, cy-25*sc, 3.5*sc, 2.5*sc, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#1a003a';
  ctx.beginPath(); ctx.arc(bx-4*sc, cy-25*sc, 1.5*sc, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(bx+4*sc, cy-25*sc, 1.5*sc, 0, Math.PI*2); ctx.fill();
  if (extraFn) extraFn(ctx, bx, cy, sc);
}

// ── 1. COLOR BTN ──
function _initColorBtn(mgCvs, MG, showFeedback, mgFail, mgSuccess) {
  const n = 5;
  MG.cbSeq = Array.from({length:n}, () => Math.random() < 0.5 ? 0 : 1);
  MG.cbBtns = Array(n).fill(-1);
  MG.cbFlash = false; MG.cbStep = 0;

  function flashStep() {
    if (MG.done) return;
    MG.cbFlash = true; MG.cbStep = MG.cbStep % n;
    beep(MG.cbSeq[MG.cbStep] === 1 ? 660 : 330, 0.12);
    const t1 = setTimeout(() => {
      MG.cbFlash = false; MG.cbStep++;
      if (MG.cbStep >= n) { const t2 = setTimeout(() => { MG.cbStep = 0; flashStep(); }, 2500); MG._timers.push(t2); }
      else { const t3 = setTimeout(flashStep, 600); MG._timers.push(t3); }
    }, 800);
    MG._timers.push(t1);
  }
  const t0 = setTimeout(flashStep, 400); MG._timers.push(t0);

  mgCvs.onclick = e => {
    if (MG.done) return;
    const rect = mgCvs.getBoundingClientRect();
    const mx = e.clientX-rect.left, my = e.clientY-rect.top;
    const cw = mgCvs.width, ch = mgCvs.height;
    const bw=54, bh=46, gap=12, total=n*(bw+gap)-gap;
    for (let i = 0; i < n; i++) {
      const bx=(cw-total)/2+i*(bw+gap), ry=ch*0.54, gy=ch*0.54+bh+8;
      if (mx>=bx&&mx<=bx+bw&&my>=ry&&my<=ry+bh) { MG.cbBtns[i]=MG.cbBtns[i]===0?-1:0; beep(280,0.08); return; }
      if (mx>=bx&&mx<=bx+bw&&my>=gy&&my<=gy+bh) { MG.cbBtns[i]=MG.cbBtns[i]===1?-1:1; beep(550,0.08); return; }
    }
    const cb={x:cw/2-65,y:ch*0.86,w:130,h:42};
    if (_inRect(mx,my,cb)) {
      if (MG.cbBtns.some(b=>b===-1)) { showFeedback('SET ALL!','#ffaa00'); return; }
      if (MG.cbBtns.every((b,i)=>b===MG.cbSeq[i])) {
        spawnParts(cw/2,ch/2,'#39ff14',40); const t=setTimeout(()=>mgSuccess(),400); MG._timers.push(t);
      } else { MG.cbBtns=Array(n).fill(-1); showFeedback('✗ WRONG','#ff3333'); mgFail(); }
    }
  };
}
function _drawColorBtn(ctx, MG, now, cw, ch) {
  const t=now*0.001;
  ctx.clearRect(0, 0, cw, ch);
  for(let x=0;x<cw;x+=48){ctx.fillStyle='rgba(80,0,100,0.07)';ctx.fillRect(x,0,1,ch);}
  const n=MG.cbSeq?MG.cbSeq.length:5, bw=54,bh=46,gap=12,total=n*(bw+gap)-gap, startX=(cw-total)/2;
  ctx.fillStyle='rgba(20,0,30,0.75)'; ctx.fillRect(startX-20,ch*0.50,total+40,ch*0.42);
  ctx.strokeStyle='rgba(180,0,220,0.3)'; ctx.lineWidth=1.5; ctx.strokeRect(startX-20,ch*0.50,total+40,ch*0.42);
  const p=0.5+0.5*Math.sin(t*3);
  for(let i=0;i<n;i++){
    const bx=startX+i*(bw+gap),ry=ch*0.54,gy=ch*0.54+bh+8;
    const selR=MG.cbBtns&&MG.cbBtns[i]===0, selG=MG.cbBtns&&MG.cbBtns[i]===1;
    ctx.fillStyle=selR?'rgba(255,40,40,0.6)':'rgba(80,10,10,0.5)'; ctx.fillRect(bx,ry,bw,bh);
    ctx.strokeStyle=selR?'#ff4444':'#440000'; ctx.lineWidth=2; ctx.strokeRect(bx,ry,bw,bh);
    if(selR){ctx.fillStyle='rgba(255,100,100,0.4)';ctx.beginPath();ctx.arc(bx+bw/2,ry+bh/2,14,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle=selR?'#ffaaaa':'#883333'; ctx.font='bold 18px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('■',bx+bw/2,ry+bh/2);
    ctx.fillStyle=selG?'rgba(40,255,80,0.6)':'rgba(10,60,10,0.5)'; ctx.fillRect(bx,gy,bw,bh);
    ctx.strokeStyle=selG?'#44ff44':'#004400'; ctx.lineWidth=2; ctx.strokeRect(bx,gy,bw,bh);
    if(selG){ctx.fillStyle='rgba(100,255,120,0.4)';ctx.beginPath();ctx.arc(bx+bw/2,gy+bh/2,14,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle=selG?'#aaffaa':'#338833'; ctx.font='bold 18px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('■',bx+bw/2,gy+bh/2);
  }
  const cb={x:cw/2-65,y:ch*0.86,w:130,h:42};
  ctx.fillStyle=`rgba(0,245,255,${0.1+0.06*p})`; ctx.fillRect(cb.x,cb.y,cb.w,cb.h);
  ctx.strokeStyle=`rgba(0,245,255,${0.55+0.35*p})`; ctx.lineWidth=2; ctx.strokeRect(cb.x,cb.y,cb.w,cb.h);
  ctx.fillStyle='#00f5ff'; ctx.font='bold 14px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('▶ CONFIRM',cw/2,cb.y+21);
  ctx.fillStyle='rgba(200,150,255,0.5)'; ctx.font='10px monospace'; ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillText(_hint('color_btn'),cw*0.04,ch*0.04);
}
function _drawAlienColorBtn(ctx, MG, now, cw, ch) {
  const {ax,ay,sc}=_alienPosMobile(cw,ch);
  ctx.clearRect(0, 0, cw, ch);
  const step=MG.cbStep||0,seq=MG.cbSeq||[],isFlash=MG.cbFlash;
  const col=isFlash&&seq[step]!==undefined?(seq[step]===1?'#22cc00':'#cc2200'):'#2a1a3a';
  if(isFlash){const grd=ctx.createRadialGradient(ax,ay,0,ax,ay,55);grd.addColorStop(0,col+'99');grd.addColorStop(1,'transparent');ctx.fillStyle=grd;ctx.fillRect(ax-60,ay-60,120,120);}
  _drawAlienFig(ctx,ax,ay,sc,isFlash?col:'#2a1a3a','#9b6ec0',0);
}

// ── 2. RUN JUMP ──
function _initRunJump(mgCvs, MG, showFeedback, mgFail, mgSuccess) {
  MG.rjY=0; MG.rjVY=0; MG.rjObs=[]; MG.rjScore=0; MG.rjGoal=6;
  MG.rjAlert=false; MG.rjSpeed=220; MG.rjOnGround=true; MG._rjPrev=0;

  function scheduleObs() {
    if(MG.done) return;
    const tid=setTimeout(()=>{if(!MG.done){MG.rjObs.push({x:1.12,passed:false,alerted:false});scheduleObs();}},_rnd(1600,2800));
    MG._timers.push(tid);
  }
  scheduleObs();

  function doJump(){if(!MG.rjOnGround||MG.done)return;MG.rjVY=320;MG.rjOnGround=false;beep(440,0.07);}
  const keyFn=e=>{if(e.code==='Space'){e.preventDefault();doJump();}};
  document.addEventListener('keydown',keyFn);
  MG._keyFns.push({fn:keyFn,type:'keydown'});
  mgCvs.onclick=doJump;
  const touchJumpFn=e=>{e.preventDefault();doJump();};
  mgCvs.addEventListener('touchstart',touchJumpFn,{passive:false});
  MG._canvasFns.push({fn:touchJumpFn,type:'touchstart'});

  MG._rjUpdate=(dt,cw,ch)=>{
    if(MG.done) return;
    const sec=Math.min(dt/1000,0.05);
    if(MG.rjOnGround){MG.rjVY=0;}else{MG.rjVY-=600*sec;MG.rjY+=MG.rjVY*sec;if(MG.rjY<=0){MG.rjY=0;MG.rjVY=0;MG.rjOnGround=true;}}
    const playerX=0.18,alertDist=0.04+0.55*MG.rjSpeed/cw;
    for(const o of MG.rjObs) o.x-=MG.rjSpeed*sec/cw;
    MG.rjAlert=false;
    for(let i=MG.rjObs.length-1;i>=0;i--){
      const o=MG.rjObs[i];
      if(o.x<-0.15){MG.rjObs.splice(i,1);continue;}
      const dist=o.x-playerX;
      if(dist>0&&dist<alertDist){MG.rjAlert=true;if(!o.alerted){o.alerted=true;beep(300+_rnd(0,80),0.2,0,'sawtooth');}}
      if(!o.passed&&dist<0.04&&dist>-0.08){
        o.passed=true;
        if(MG.rjY<32){MG.rjObs.splice(i,1);showFeedback('✗ CRASH!','#ff3333');mgFail();beep(110,0.4);}
        else{MG.rjScore++;showFeedback(`✓ ${MG.rjScore}/${MG.rjGoal}`,'#39ff14');beep(880,0.09);if(MG.rjScore>=MG.rjGoal){spawnParts(cw*0.2,ch*0.65,'#39ff14',40);const t=setTimeout(()=>mgSuccess(),500);MG._timers.push(t);}}
      }
    }
  };
}
function _drawRunJump(ctx, MG, now, cw, ch) {
  const dt=MG._rjPrev?Math.min(now-MG._rjPrev,50):16; MG._rjPrev=now;
  if(MG._rjUpdate) MG._rjUpdate(dt,cw,ch);
  const t=now*0.001,floor=ch*0.72;
  ctx.clearRect(0, 0, cw, ch);
  const px=cw*0.18,bodyY=floor-MG.rjY,isJump=MG.rjY>10;
  const shadowScale=Math.max(0.2,1-MG.rjY/180);
  ctx.fillStyle='rgba(0,0,0,0.35)';ctx.beginPath();ctx.ellipse(px,floor+4,18*shadowScale,4*shadowScale,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#2e1e14';
  if(isJump){ctx.fillRect(px-11,bodyY+4,9,14);ctx.fillRect(px+2,bodyY+4,9,14);}
  else{const leg=Math.sin(t*9)*7;ctx.fillRect(px-11,bodyY+4,9,14+leg);ctx.fillRect(px+2,bodyY+4,9,14-leg);}
  ctx.fillStyle='#1a5090';ctx.fillRect(px-13,bodyY-20,26,24);
  ctx.fillStyle='#2280cc';ctx.fillRect(px-13,bodyY-20,13,24);
  ctx.fillStyle='#f5c8a0';ctx.beginPath();ctx.arc(px,bodyY-30,10,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(0,180,255,0.15)';ctx.beginPath();ctx.arc(px,bodyY-30,12,Math.PI,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(0,180,255,0.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(px,bodyY-30,12,Math.PI,Math.PI*2);ctx.stroke();
  if(MG.rjAlert){const ap=0.5+0.5*Math.sin(t*30);ctx.fillStyle=`rgba(255,50,0,${ap*0.2})`;ctx.fillRect(0,0,cw,ch);ctx.fillStyle=`rgba(255,100,0,${0.9+0.1*ap})`;ctx.font='bold 26px monospace';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText('⚠',cw/2,ch*0.05);}
  ctx.fillStyle='rgba(50,200,80,0.7)';ctx.font='bold 13px monospace';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(`${MG.rjScore||0}/${MG.rjGoal}`,cw*0.04,ch*0.04);
  ctx.fillStyle='rgba(255,255,255,0.15)';ctx.font='9px monospace';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText('SPACE / 클릭 = 점프',cw/2,ch-5);
}
function _drawAlienRunJump(ctx, MG, now, cw, ch) {
  const t=now*0.001;const {ax,ay,sc}=_alienPosMobile(cw,ch);
  ctx.clearRect(0, 0, cw, ch);
  const shout=MG.rjAlert,col=shout?'#cc3300':'#7b4ea0';
  if(shout){const grd=ctx.createRadialGradient(ax,ay,0,ax,ay,58);grd.addColorStop(0,'rgba(255,60,0,0.4)');grd.addColorStop(1,'transparent');ctx.fillStyle=grd;ctx.fillRect(ax-64,ay-64,128,128);}
  _drawAlienFig(ctx,ax,ay,sc,col,'#9b6ec0',0,(c,bx,by)=>{
    if(shout){c.fillStyle='#220000';c.beginPath();c.ellipse(bx,by-22*sc,9*sc,11*sc,0,0,Math.PI*2);c.fill();c.strokeStyle='#ff4400';c.lineWidth=1.5;c.beginPath();c.ellipse(bx,by-22*sc,9*sc,11*sc,0,0,Math.PI*2);c.stroke();c.fillStyle='#ff4400';c.font=`bold ${18*sc}px monospace`;c.textAlign='center';c.textBaseline='bottom';c.fillText('!',bx,by-50*sc);}
  });
}

// ── 3. GLOW HOLD ──
function _initGlowHold(mgCvs, MG, showFeedback, mgFail, mgSuccess) {
  MG.ghGlowing=false;MG.ghHolding=false;MG.ghProgress=0;MG.ghGlowDur=0;
  MG.ghRound=0;MG.ghGoal=3;MG.ghFailed=false;MG._ghPrev=0;

  function scheduleGlow(){
    if(MG.done) return;
    const t1=setTimeout(()=>{
      if(MG.done) return;
      MG.ghGlowDur=_rnd(1400,2200);MG.ghGlowing=true;beep(660,0.06);
      const t2=setTimeout(()=>{
        MG.ghGlowing=false;
        if(MG.ghProgress>=1.0){MG.ghRound++;showFeedback(`✓ ${MG.ghRound}/${MG.ghGoal}`,'#39ff14');beep(880,0.1);beep(1100,0.08,0.13);spawnParts(mgCvs.width/2,mgCvs.height*0.45,'#ffcc00',25);MG.ghProgress=0;if(MG.ghRound>=MG.ghGoal){const t=setTimeout(()=>mgSuccess(),400);MG._timers.push(t);}else scheduleGlow();}
        else if(MG.ghHolding&&!MG.ghFailed){MG.ghFailed=true;MG.ghProgress=0;showFeedback('✗ NOT GLOWING!','#ff3333');mgFail();const t=setTimeout(()=>{MG.ghFailed=false;scheduleGlow();},500);MG._timers.push(t);}
        else scheduleGlow();
      },MG.ghGlowDur);MG._timers.push(t2);
    },_rnd(1000,1800));MG._timers.push(t1);
  }
  scheduleGlow();

  function handlePress(holding){
    if(MG.done) return;
    MG.ghHolding=holding;
    if(holding&&!MG.ghGlowing&&!MG.ghFailed){MG.ghFailed=true;MG.ghProgress=0;showFeedback('✗ NOT GLOWING!','#ff3333');mgFail();const t=setTimeout(()=>{MG.ghFailed=false;},500);MG._timers.push(t);}
  }
  const keyFn=e=>{if(MG.done)return;if(e.code==='Space'){e.preventDefault();handlePress(e.type==='keydown');}};
  document.addEventListener('keydown',keyFn);document.addEventListener('keyup',keyFn);
  MG._keyFns.push({fn:keyFn,type:'keydown'});MG._keyFns.push({fn:keyFn,type:'keyup'});
  const mouseFn=e=>handlePress(e.type==='mousedown');
  mgCvs.addEventListener('mousedown',mouseFn);mgCvs.addEventListener('mouseup',mouseFn);
  MG._canvasFns.push({fn:mouseFn,type:'mousedown'});MG._canvasFns.push({fn:mouseFn,type:'mouseup'});
  const touchHoldFn=e=>{e.preventDefault();handlePress(e.type==='touchstart');};
  mgCvs.addEventListener('touchstart',touchHoldFn,{passive:false});
  mgCvs.addEventListener('touchend',touchHoldFn,{passive:false});
  MG._canvasFns.push({fn:touchHoldFn,type:'touchstart'});MG._canvasFns.push({fn:touchHoldFn,type:'touchend'});
}
function _drawGlowHold(ctx, MG, now, cw, ch) {
  const dt=MG._ghPrev?Math.min(now-MG._ghPrev,50):16; MG._ghPrev=now;
  if(MG.ghGlowing&&MG.ghHolding) MG.ghProgress=Math.min(1.0,MG.ghProgress+dt/(MG.ghGlowDur||1800));
  const t=now*0.001;
  ctx.clearRect(0, 0, cw, ch);
  for(let y=0;y<ch;y+=36){ctx.fillStyle='rgba(50,0,70,0.07)';ctx.fillRect(0,y,cw,1);}
  if(MG.ghGlowing){const gp=0.5+0.5*Math.sin(t*22);const grd=ctx.createRadialGradient(cw/2,ch*0.4,0,cw/2,ch*0.4,cw*0.42);grd.addColorStop(0,`rgba(255,220,0,${0.45+0.35*gp})`);grd.addColorStop(1,'transparent');ctx.fillStyle=grd;ctx.fillRect(0,0,cw,ch);}
  const bx=cw*0.12,by=ch*0.7,bw=cw*0.76,bh=24;
  ctx.fillStyle='rgba(30,10,50,0.85)';ctx.fillRect(bx,by,bw,bh);ctx.strokeStyle='rgba(200,150,255,0.35)';ctx.lineWidth=1.5;ctx.strokeRect(bx,by,bw,bh);
  if(MG.ghProgress>0){ctx.fillStyle=MG.ghProgress>=1.0?'#39ff14':'#ffcc00';ctx.fillRect(bx+2,by+2,(bw-4)*MG.ghProgress,bh-4);}
  const hb={x:cw/2-75,y:ch*0.8,w:150,h:52},holding=MG.ghHolding&&MG.ghGlowing;
  ctx.fillStyle=holding?'rgba(255,220,0,0.22)':'rgba(60,30,0,0.2)';ctx.fillRect(hb.x,hb.y,hb.w,hb.h);
  ctx.strokeStyle=holding?'#ffcc00':'rgba(150,80,0,0.4)';ctx.lineWidth=2.5;ctx.strokeRect(hb.x,hb.y,hb.w,hb.h);
  ctx.fillStyle=holding?'#ffcc00':'rgba(200,140,0,0.5)';ctx.font='bold 15px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(holding?'● HOLDING':'HOLD',hb.x+hb.w/2,hb.y+hb.h/2);
  ctx.fillStyle='rgba(200,150,255,0.6)';ctx.font='bold 12px monospace';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(`${MG.ghRound||0}/${MG.ghGoal}`,cw*0.04,ch*0.04);
  ctx.fillStyle='rgba(255,255,255,0.12)';ctx.font='9px monospace';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(_hint('glow_hold'),cw/2,ch-5);
}
function _drawAlienGlowHold(ctx, MG, now, cw, ch) {
  const t=now*0.001;const {ax,ay,sc}=_alienPosMobile(cw,ch);
  ctx.clearRect(0, 0, cw, ch);
  const glowing=MG.ghGlowing,gp=glowing?0.5+0.5*Math.sin(t*22):0;
  if(glowing){const grd=ctx.createRadialGradient(ax,ay,0,ax,ay,62);grd.addColorStop(0,`rgba(255,220,0,${0.5+0.4*gp})`);grd.addColorStop(1,'transparent');ctx.fillStyle=grd;ctx.fillRect(ax-68,ay-68,136,136);}
  const col=glowing?`rgba(255,${180+Math.floor(70*gp)},0,1)`:'#2a1a40';
  _drawAlienFig(ctx,ax,ay,sc,col,glowing?'#ffeeaa':'#9b6ec0',0);
}

// ── 4. SYMBOL BODY ──
const _SYM_DEFS=[
  {name:'★',draw:(c,x,y,s,col)=>{c.fillStyle=col;const r=s*14,ir=s*6,n=5;c.beginPath();for(let i=0;i<n*2;i++){const a=i*Math.PI/n-Math.PI/2,rr=i%2?ir:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fill();}},
  {name:'◆',draw:(c,x,y,s,col)=>{c.fillStyle=col;c.beginPath();c.moveTo(x,y-s*14);c.lineTo(x+s*10,y);c.lineTo(x,y+s*14);c.lineTo(x-s*10,y);c.closePath();c.fill();}},
  {name:'▲',draw:(c,x,y,s,col)=>{c.fillStyle=col;c.beginPath();c.moveTo(x,y-s*14);c.lineTo(x+s*12,y+s*12);c.lineTo(x-s*12,y+s*12);c.closePath();c.fill();}},
  {name:'●',draw:(c,x,y,s,col)=>{c.fillStyle=col;c.beginPath();c.arc(x,y,s*13,0,Math.PI*2);c.fill();}},
  {name:'✚',draw:(c,x,y,s,col)=>{c.fillStyle=col;c.fillRect(x-s*4,y-s*13,s*8,s*26);c.fillRect(x-s*13,y-s*4,s*26,s*8);}},
  {name:'⬡',draw:(c,x,y,s,col)=>{c.fillStyle=col;c.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6;c.lineTo(x+Math.cos(a)*s*13,y+Math.sin(a)*s*13);}c.closePath();c.fill();}},
];
function _getSymBtn(cw,ch,i){const bw=110,bh=70,gap=16,sx=(cw-(2*(bw+gap)-gap))/2+Math.floor(i/2)*(bw+gap),sy=ch*0.56+(i%2)*(bh+gap);return{x:sx,y:sy,w:bw,h:bh};}
function _initSymbolBody(mgCvs, MG, showFeedback, mgFail, mgSuccess) {
  MG.sbTarget=null;MG.sbChoices=[];MG.sbRound=0;MG.sbGoal=5;
  function nextRound(){if(MG.done)return;const pool=_shuffle([..._SYM_DEFS]);MG.sbTarget=pool[0];MG.sbChoices=pool.slice(0,4).sort(()=>Math.random()-0.5);beep(440,0.05);}
  nextRound();
  mgCvs.onclick=e=>{
    if(MG.done||!MG.sbTarget) return;
    const rect=mgCvs.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top;
    const cw=mgCvs.width,ch=mgCvs.height;
    for(let i=0;i<4;i++){
      const b=_getSymBtn(cw,ch,i);
      if(_inRect(mx,my,b)){
        if(MG.sbChoices[i].name===MG.sbTarget.name){MG.sbRound++;beep(880,0.1);beep(1100,0.08,0.13);showFeedback(`✓ ${MG.sbRound}/${MG.sbGoal}`,'#39ff14');spawnParts(b.x+b.w/2,b.y+b.h/2,'#39ff14',18);if(MG.sbRound>=MG.sbGoal){const t=setTimeout(()=>mgSuccess(),400);MG._timers.push(t);}else nextRound();}
        else{beep(180,0.3);showFeedback('✗ WRONG!','#ff3333');mgFail();}
        return;
      }
    }
  };
}
function _drawSymbolBody(ctx, MG, now, cw, ch) {
  const t=now*0.001;
  ctx.clearRect(0, 0, cw, ch);
  if(!MG.sbTarget) return;
  for(let i=0;i<4;i++){
    const b=_getSymBtn(cw,ch,i);
    ctx.fillStyle='rgba(0,20,50,0.85)';ctx.fillRect(b.x,b.y,b.w,b.h);
    ctx.strokeStyle=`rgba(0,200,255,${0.35+0.2*Math.sin(t*2+i)})`;ctx.lineWidth=2;ctx.strokeRect(b.x,b.y,b.w,b.h);
    MG.sbChoices[i].draw(ctx,b.x+b.w/2,b.y+b.h/2,1,'rgba(0,220,255,0.85)');
  }
  ctx.fillStyle='rgba(0,180,255,0.5)';ctx.font='10px monospace';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(`${MG.sbRound||0}/${MG.sbGoal}  외계인 몸의 기호를 찾아라`,cw/2,ch*0.04);
}
function _drawAlienSymbolBody(ctx, MG, now, cw, ch) {
  const t=now*0.001;const {ax,ay,sc}=_alienPosMobile(cw,ch);
  ctx.clearRect(0, 0, cw, ch);
  _drawAlienFig(ctx,ax,ay,sc,'#3060cc','#5080cc',0);
  if(MG.sbTarget){const p2=0.7+0.3*Math.sin(t*3.5);MG.sbTarget.draw(ctx,ax,ay+2*sc,sc*0.85,`rgba(0,220,255,${p2})`);}
}

// ── 5. DIRECTION ARROW ──
const _DA_DIRS=['up','down','left','right'],_DA_ARR={up:'▲',down:'▼',left:'◀',right:'▶'};
function _getDABtns(cw,ch){const bw=80,bh=62,cx=cw/2,cy=ch*0.73;return{up:{x:cx-bw/2,y:cy-bh-10,w:bw,h:bh},down:{x:cx-bw/2,y:cy+10,w:bw,h:bh},left:{x:cx-bw-10-bw/2,y:cy-bh/2,w:bw,h:bh},right:{x:cx+10+bw/2,y:cy-bh/2,w:bw,h:bh}};}
function _initDirectionArrow(mgCvs, MG, showFeedback, mgFail, mgSuccess) {
  MG.daDir=null;MG.daWait=false;MG.daRound=0;MG.daGoal=6;
  function nextDir(){if(MG.done)return;MG.daDir=_DA_DIRS[0|_rnd(0,4)];MG.daWait=true;beep(550,0.06);}
  const t0=setTimeout(nextDir,600);MG._timers.push(t0);
  function checkDA(dir){
    MG.daWait=false;
    if(dir===MG.daDir){MG.daRound++;beep(880,0.1);beep(1100,0.08,0.13);showFeedback(`✓ ${MG.daRound}/${MG.daGoal}`,'#39ff14');spawnParts(mgCvs.width/2,mgCvs.height/2,'#39ff14',18);if(MG.daRound>=MG.daGoal){const t=setTimeout(()=>mgSuccess(),400);MG._timers.push(t);}else{const t=setTimeout(nextDir,600);MG._timers.push(t);}}
    else{beep(180,0.3);showFeedback('✗ WRONG!','#ff3333');mgFail();const t=setTimeout(()=>{MG.daWait=false;nextDir();},900);MG._timers.push(t);}
  }
  const keyFn=e=>{if(!MG.daWait||MG.done)return;const m={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};if(m[e.key])checkDA(m[e.key]);};
  document.addEventListener('keydown',keyFn);MG._keyFns.push({fn:keyFn,type:'keydown'});
  mgCvs.onclick=e=>{
    if(!MG.daWait||MG.done) return;
    const rect=mgCvs.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top;
    const btns=_getDABtns(mgCvs.width,mgCvs.height);
    for(const [d,b] of Object.entries(btns)){if(_inRect(mx,my,b)){checkDA(d);return;}}
  };
}
function _drawDirectionArrow(ctx, MG, now, cw, ch) {
  ctx.clearRect(0, 0, cw, ch);
  for(let x=0;x<cw;x+=38){ctx.fillStyle='rgba(0,40,80,0.07)';ctx.fillRect(x,0,1,ch);}
  const btns=_getDABtns(cw,ch);
  for(const [d,b] of Object.entries(btns)){
    ctx.fillStyle='rgba(0,15,35,0.55)';ctx.fillRect(b.x,b.y,b.w,b.h);
    ctx.strokeStyle='rgba(0,80,130,0.4)';ctx.lineWidth=1.5;ctx.strokeRect(b.x,b.y,b.w,b.h);
    ctx.fillStyle='rgba(0,120,180,0.6)';ctx.font='bold 28px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(_DA_ARR[d],b.x+b.w/2,b.y+b.h/2);
  }
  ctx.fillStyle='rgba(0,180,255,0.6)';ctx.font='bold 12px monospace';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(`${MG.daRound||0}/${MG.daGoal}`,cw*0.04,ch*0.04);
  ctx.fillStyle='rgba(255,255,255,0.12)';ctx.font='9px monospace';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(_hint('direction_arrow'),cw/2,ch-5);
}
function _drawAlienDirectionArrow(ctx, MG, now, cw, ch) {
  const t=now*0.001;const {ax,ay,sc}=_alienPosMobile(cw,ch);
  ctx.clearRect(0, 0, cw, ch);
  const dir=MG.daDir,waiting=MG.daWait;
  const offMap={left:[-52,0],right:[52,0],up:[0,-38],down:[0,38]};
  const [offX,offY]=waiting&&dir?(offMap[dir]||[0,0]):[0,0];
  const bX=offX*(0.85+0.15*Math.sin(t*6)),bY=offY*(0.85+0.15*Math.sin(t*6));
  if(waiting&&dir){const grd=ctx.createRadialGradient(ax+bX,ay+bY,0,ax+bX,ay+bY,55);grd.addColorStop(0,'rgba(255,220,0,0.45)');grd.addColorStop(1,'transparent');ctx.fillStyle=grd;ctx.fillRect(0,0,cw,ch);}
  _drawAlienFig(ctx,ax+bX,ay+bY,sc,'#aa8800','#ccaa22',0);
}

// ── 6. DIAL TILT ──
const _DT_COLORS=['#ff4444','#ffcc00','#44ff88','#00bbff','#cc55ff'];
const _DT_N=_DT_COLORS.length;
function _dtBodyIdx(slider,freq,phase){return Math.floor(((((slider+1)/2*freq+phase)%1)+1)%1*_DT_N);}
function _dtNextRound(MG){
  const n=_DT_N;
  MG.dtHeadIdx=0|Math.random()*n;
  MG.dtFreq=1.5+Math.random()*1.5;
  const ans=_rnd(-0.8,0.8);
  const frac=(MG.dtHeadIdx+0.5)/n;
  MG.dtPhase=(((frac-(ans+1)/2*MG.dtFreq)%1)+1)%1;
  MG.dtSlider=0;MG.dtConfirmed=false;
}
function _initDialTilt(mgCvs, MG, showFeedback, mgFail, mgSuccess) {
  MG.dtRound=0;MG.dtGoal=3;MG.dtDrag=false;
  _dtNextRound(MG);
  const mouseFn=e=>{
    const rect=mgCvs.getBoundingClientRect(),cw=mgCvs.width,ch=mgCvs.height;
    if(e.type==='mousedown'&&!MG.done){if(Math.abs(e.clientY-rect.top-ch*0.52)<24)MG.dtDrag=true;}
    else if(e.type==='mousemove'&&MG.dtDrag){MG.dtSlider=Math.max(-1,Math.min(1,((e.clientX-rect.left-cw*0.08)/(cw*0.84))*2-1));}
    else MG.dtDrag=false;
  };
  mgCvs.addEventListener('mousedown',mouseFn);mgCvs.addEventListener('mousemove',mouseFn);mgCvs.addEventListener('mouseup',mouseFn);
  MG._canvasFns.push({fn:mouseFn,type:'mousedown'});MG._canvasFns.push({fn:mouseFn,type:'mousemove'});MG._canvasFns.push({fn:mouseFn,type:'mouseup'});
  const touchSliderFn=e=>{
    const rect=mgCvs.getBoundingClientRect(),cw=mgCvs.width,ch=mgCvs.height;
    const touch=e.touches[0]||e.changedTouches[0];
    if(e.type==='touchstart'&&!MG.done){if(Math.abs(touch.clientY-rect.top-ch*0.52)<32){MG.dtDrag=true;e.preventDefault();}}
    else if(e.type==='touchmove'&&MG.dtDrag){e.preventDefault();MG.dtSlider=Math.max(-1,Math.min(1,((touch.clientX-rect.left-cw*0.08)/(cw*0.84))*2-1));}
    else{MG.dtDrag=false;}
  };
  mgCvs.addEventListener('touchstart',touchSliderFn,{passive:false});
  mgCvs.addEventListener('touchmove',touchSliderFn,{passive:false});
  mgCvs.addEventListener('touchend',touchSliderFn,{passive:false});
  MG._canvasFns.push({fn:touchSliderFn,type:'touchstart'});MG._canvasFns.push({fn:touchSliderFn,type:'touchmove'});MG._canvasFns.push({fn:touchSliderFn,type:'touchend'});
  const clickFn=e=>{
    if(MG.done||MG.dtConfirmed)return;
    const rect=mgCvs.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top;
    const cw=mgCvs.width,ch=mgCvs.height;
    if(_inRect(mx,my,{x:cw/2-70,y:ch*0.72,w:140,h:48})){
      const bodyIdx=_dtBodyIdx(MG.dtSlider||0,MG.dtFreq,MG.dtPhase);
      if(bodyIdx===MG.dtHeadIdx){
        MG.dtConfirmed=true;beep(880,0.1);beep(1100,0.08,0.14);
        MG.dtRound++;showFeedback(`✓ ${MG.dtRound}/${MG.dtGoal}`,'#39ff14');
        spawnParts(cw/2,ch/2,'#ffd700',30);
        if(MG.dtRound>=MG.dtGoal){const t=setTimeout(()=>mgSuccess(),600);MG._timers.push(t);}
        else{const t=setTimeout(()=>_dtNextRound(MG),900);MG._timers.push(t);}
      } else {beep(200,0.3);showFeedback('✗ NOT MATCHED!','#ff3333');mgFail();}
    }
  };
  mgCvs.addEventListener('click',clickFn);MG._canvasFns.push({fn:clickFn,type:'click'});
}
function _drawDialTilt(ctx, MG, now, cw, ch) {
  ctx.clearRect(0, 0, cw, ch);
  for(let y=0;y<ch;y+=30){ctx.fillStyle='rgba(40,20,60,0.04)';ctx.fillRect(0,y,cw,1);}
  if(!('dtHeadIdx' in MG))return;
  const bodyIdx=_dtBodyIdx(MG.dtSlider||0,MG.dtFreq,MG.dtPhase);
  const matched=bodyIdx===MG.dtHeadIdx;
  const t=now*0.001,p=0.5+0.5*Math.sin(t*3);
  ctx.fillStyle='rgba(180,140,255,0.45)';ctx.font='11px monospace';ctx.textAlign='center';ctx.textBaseline='top';
  ctx.fillText('슬라이더를 움직여 몸 색을 머리 색에 맞춰라!',cw/2,ch*0.3);
  const bx=cw*0.08,by=ch*0.52,bw=cw*0.84,bh=22;
  ctx.fillStyle='rgba(20,10,40,0.9)';ctx.fillRect(bx,by,bw,bh);ctx.strokeStyle='rgba(180,100,255,0.5)';ctx.lineWidth=2;ctx.strokeRect(bx,by,bw,bh);
  ctx.strokeStyle='rgba(255,255,255,0.35)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(bx+bw/2,by-3);ctx.lineTo(bx+bw/2,by+bh+3);ctx.stroke();
  const kx=bx+(MG.dtSlider+1)/2*bw;
  ctx.fillStyle='rgba(180,100,255,0.3)';ctx.fillRect(bx,by+2,kx-bx,bh-4);
  ctx.fillStyle='#cc88ff';ctx.fillRect(kx-4,by-4,8,bh+8);ctx.strokeStyle='#eeccff';ctx.lineWidth=1;ctx.strokeRect(kx-4,by-4,8,bh+8);
  const cb={x:cw/2-70,y:ch*0.72,w:140,h:48};
  ctx.fillStyle=matched?`rgba(57,255,20,${0.25+0.1*p})`:`rgba(80,40,120,${0.15+0.05*p})`;ctx.fillRect(cb.x,cb.y,cb.w,cb.h);
  ctx.strokeStyle=matched?`rgba(57,255,20,${0.8+0.2*p})`:`rgba(150,80,220,${0.4+0.2*p})`;ctx.lineWidth=matched?3:1.5;ctx.strokeRect(cb.x,cb.y,cb.w,cb.h);
  ctx.fillStyle=matched?'#39ff14':'#9955dd';ctx.font=`bold ${matched?15:13}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(matched?'▶ SUBMIT!':'▶ SUBMIT',cw/2,cb.y+24);
  ctx.fillStyle='rgba(180,120,255,0.6)';ctx.font='bold 11px monospace';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(`${MG.dtRound||0}/${MG.dtGoal}`,8,8);
}
function _drawAlienDialTilt(ctx, MG, now, cw, ch) {
  ctx.clearRect(0, 0, cw, ch);
  if(!('dtHeadIdx' in MG))return;
  const bodyIdx=_dtBodyIdx(MG.dtSlider||0,MG.dtFreq,MG.dtPhase);
  const headColor=_DT_COLORS[MG.dtHeadIdx],bodyColor=_DT_COLORS[bodyIdx];
  const matched=bodyIdx===MG.dtHeadIdx;
  const {ax,ay,sc}=_alienPosMobile(cw,ch);
  if(matched){const gp=0.5+0.5*Math.sin(now*0.009);const grd=ctx.createRadialGradient(ax,ay,0,ax,ay,60);grd.addColorStop(0,`rgba(255,255,100,${0.5*gp})`);grd.addColorStop(1,'transparent');ctx.fillStyle=grd;ctx.fillRect(0,0,cw,ch);}
  ctx.fillStyle='rgba(0,0,0,0.3)';ctx.beginPath();ctx.ellipse(ax,ay+22*sc,14*sc,4*sc,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=bodyColor;ctx.fillRect(ax-11*sc,ay+14*sc,9*sc,14*sc);ctx.fillRect(ax+2*sc,ay+14*sc,9*sc,14*sc);
  ctx.fillStyle=bodyColor;ctx.fillRect(ax-24*sc,ay-2*sc,13*sc,7*sc);ctx.fillRect(ax+11*sc,ay-2*sc,13*sc,7*sc);
  ctx.fillStyle=bodyColor;ctx.beginPath();ctx.ellipse(ax,ay,14*sc,18*sc,0,0,Math.PI*2);ctx.fill();
  if(matched){ctx.strokeStyle='#39ff14';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(ax,ay,14*sc,18*sc,0,0,Math.PI*2);ctx.stroke();ctx.strokeRect(ax-11*sc-1,ay+14*sc-1,9*sc+2,14*sc+2);ctx.strokeRect(ax+2*sc-1,ay+14*sc-1,9*sc+2,14*sc+2);ctx.strokeRect(ax-24*sc-1,ay-2*sc-1,13*sc+2,7*sc+2);ctx.strokeRect(ax+11*sc-1,ay-2*sc-1,13*sc+2,7*sc+2);}
  ctx.fillStyle=headColor;ctx.beginPath();ctx.arc(ax,ay-24*sc,12*sc,0,Math.PI*2);ctx.fill();
  if(matched){ctx.strokeStyle='#39ff14';ctx.lineWidth=2;ctx.beginPath();ctx.arc(ax,ay-24*sc,12*sc,0,Math.PI*2);ctx.stroke();}
  ctx.fillStyle='white';ctx.beginPath();ctx.ellipse(ax-4*sc,ay-25*sc,3.5*sc,2.5*sc,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(ax+4*sc,ay-25*sc,3.5*sc,2.5*sc,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#1a003a';ctx.beginPath();ctx.arc(ax-4*sc,ay-25*sc,1.5*sc,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(ax+4*sc,ay-25*sc,1.5*sc,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(200,180,255,0.5)';ctx.font='9px monospace';ctx.textAlign='center';ctx.textBaseline='top';
  ctx.fillText(matched?'✓ MATCH!':'HEAD = FIXED',cw/2,ch*0.08);
}

// ── 7. WIRE CONNECT ──
const _WIRE_COLORS=['#ff3333','#33ff66','#3399ff','#ffcc00'];
function _getWireBtn(cw,ch,i,side){const bh=44,gap=14,n=4,total=n*(bh+gap)-gap,ty=(ch-total)/2+i*(bh+gap);return side==='wire'?{x:cw*0.08,y:ty,w:cw*0.22,h:bh}:{x:cw*0.7,y:ty,w:cw*0.22,h:bh};}
function _initWireConnect(mgCvs, MG, showFeedback, mgFail, mgSuccess) {
  const n=4;MG.wcMapping=_shuffle([0,1,2,3]);MG.wcPlayerMap=Array(n).fill(-1);MG.wcSelected=-1;MG.wcSelectedSock=-1;MG.wcHintColor=null;
  mgCvs.onclick=e=>{
    if(MG.done) return;
    const rect=mgCvs.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top;
    const cw=mgCvs.width,ch=mgCvs.height;
    for(let i=0;i<n;i++){const wb=_getWireBtn(cw,ch,i,'wire');if(_inRect(mx,my,wb)){if(MG.wcSelected===i){MG.wcSelected=-1;MG.wcHintColor=null;}else{MG.wcSelected=i;MG.wcSelectedSock=-1;MG.wcHintColor=_WIRE_COLORS[i];}beep(440,0.07);return;}}
    for(let j=0;j<n;j++){
      const sb=_getWireBtn(cw,ch,j,'socket');
      if(_inRect(mx,my,sb)){
        if(MG.wcSelected>=0){for(let k=0;k<n;k++)if(MG.wcPlayerMap[k]===j)MG.wcPlayerMap[k]=-1;MG.wcPlayerMap[MG.wcSelected]=j;MG.wcSelected=-1;MG.wcSelectedSock=-1;MG.wcHintColor=null;beep(330,0.08);}
        else{if(MG.wcSelectedSock===j){MG.wcSelectedSock=-1;MG.wcHintColor=null;}else{MG.wcSelectedSock=j;MG.wcSelected=-1;const cw2=MG.wcMapping.findIndex(d=>d===j);MG.wcHintColor=cw2>=0?_WIRE_COLORS[cw2]:null;}}
        if(!MG.wcPlayerMap.includes(-1)){const ok=MG.wcPlayerMap.every((s,wi)=>s===MG.wcMapping[wi]);if(ok){spawnParts(cw/2,ch/2,'#39ff14',45);const t=setTimeout(()=>mgSuccess(),400);MG._timers.push(t);}else{showFeedback('✗ WRONG WIRING','#ff3333');mgFail();MG.wcPlayerMap=Array(n).fill(-1);}}
        return;
      }
    }
    MG.wcSelected=-1;MG.wcSelectedSock=-1;MG.wcHintColor=null;
  };
}
function _drawWireConnect(ctx, MG, now, cw, ch) {
  const t=now*0.001;
  ctx.clearRect(0, 0, cw, ch);
  for(let y=0;y<ch;y+=36){ctx.fillStyle='rgba(20,40,60,0.07)';ctx.fillRect(0,y,cw,1);}
  const n=4;
  for(let i=0;i<n;i++){const soc=MG.wcPlayerMap[i];if(soc<0)continue;const wb=_getWireBtn(cw,ch,i,'wire'),sb=_getWireBtn(cw,ch,soc,'socket');const wx=wb.x+wb.w,wy=wb.y+wb.h/2,sx=sb.x,sy=sb.y+sb.h/2;ctx.strokeStyle=_WIRE_COLORS[i];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(wx,wy);ctx.bezierCurveTo(wx+60,wy,sx-60,sy,sx,sy);ctx.stroke();}
  for(let i=0;i<n;i++){const b=_getWireBtn(cw,ch,i,'wire'),sel=MG.wcSelected===i;ctx.fillStyle=sel?'rgba(255,255,255,0.15)':'rgba(20,30,50,0.8)';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.strokeStyle=sel?'#ffffff':'#334466';ctx.lineWidth=sel?2.5:1.5;ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.fillStyle=_WIRE_COLORS[i];ctx.fillRect(b.x+b.w-16,b.y+b.h/2-5,14,10);ctx.fillStyle='rgba(200,200,200,0.6)';ctx.font='10px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(`WIRE ${i+1}`,b.x+b.w*0.42,b.y+b.h/2);}
  for(let j=0;j<n;j++){const b=_getWireBtn(cw,ch,j,'socket'),occupied=MG.wcPlayerMap.includes(j),selS=MG.wcSelectedSock===j,selW=MG.wcSelected>=0;ctx.fillStyle=selS?'rgba(255,255,255,0.15)':occupied?'rgba(40,60,20,0.7)':'rgba(20,30,50,0.8)';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.strokeStyle=selS?'#ffffff':selW?'rgba(200,200,100,0.6)':occupied?'#446633':'#334466';ctx.lineWidth=selS||selW?2.5:1.5;ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.fillStyle='rgba(60,80,100,0.5)';ctx.beginPath();ctx.arc(b.x+14,b.y+b.h/2,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#446688';ctx.lineWidth=1;ctx.beginPath();ctx.arc(b.x+14,b.y+b.h/2,8,0,Math.PI*2);ctx.stroke();ctx.fillStyle='rgba(180,200,220,0.5)';ctx.font='10px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(`PORT ${j+1}`,b.x+b.w*0.58,b.y+b.h/2);}
  ctx.fillStyle='rgba(0,180,255,0.6)';ctx.font='10px monospace';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(_hint('wire_connect'),cw*0.04,ch*0.04);
  // center hint label
  ctx.fillStyle='rgba(255,255,255,0.1)';ctx.font='8px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('←  WIRES        PORTS  →',cw/2,ch/2);
  void t;
}
function _drawAlienWireConnect(ctx, MG, now, cw, ch) {
  const t=now*0.001;const {ax,ay,sc}=_alienPosMobile(cw,ch);
  ctx.clearRect(0, 0, cw, ch);
  const hintCol=MG.wcHintColor,faceCol=hintCol||'#9b6ec0',bodyCol=hintCol?'#334466':'#2a1a40';
  _drawAlienFig(ctx,ax,ay,sc,bodyCol,faceCol,0,(c,bx,by)=>{
    if(hintCol){const p2=0.5+0.5*Math.sin(t*8);c.strokeStyle=faceCol;c.lineWidth=3;c.beginPath();c.arc(bx,by-24*sc,16*sc,0,Math.PI*2);c.stroke();const grd=c.createRadialGradient(bx,by-24*sc,0,bx,by-24*sc,22*sc);grd.addColorStop(0,faceCol+'77');grd.addColorStop(1,'transparent');c.fillStyle=grd;c.beginPath();c.arc(bx,by-24*sc,22*sc,0,Math.PI*2);c.fill();c.fillStyle=faceCol+'cc';c.beginPath();c.arc(bx,by-24*sc,12*sc,0,Math.PI*2);c.fill();void p2;}
  });
}

// ── 8. VALVE SPIN ──
function _initValveSpin(mgCvs, MG, showFeedback, mgFail, mgSuccess) {
  MG.vsDir=Math.random()<0.5?'left':'right';MG.vsAngle=0;MG.vsAlienAngle=0;MG.vsRound=0;MG.vsGoal=4;
  MG.vsDrag=false;MG.vsDragAngle=0;MG.vsLastDir='';MG.vsTurns=0;MG.vsNetTurns=0;MG.vsNeeded=2;MG._vsDone=false;

  function checkValve(diff){
    const dir=diff>0?'right':'left';MG.vsLastDir=dir;MG.vsAngle+=diff;
    MG.vsNetTurns=(MG.vsNetTurns||0)+diff/(Math.PI*2);
    MG.vsTurns=Math.abs(MG.vsNetTurns);
    if(MG.vsTurns>=MG.vsNeeded&&!MG._vsDone){MG._vsDone=true;const netDir=MG.vsNetTurns>0?'right':'left';if(netDir===MG.vsDir){spawnParts(mgCvs.width/2,mgCvs.height*0.72,'#39ff14',35);beep(880,0.1);beep(1100,0.08,0.14);MG.vsRound++;showFeedback(`✓ ${MG.vsRound}/${MG.vsGoal}`,'#39ff14');if(MG.vsRound>=MG.vsGoal){const t=setTimeout(()=>mgSuccess(),500);MG._timers.push(t);}else{const t=setTimeout(()=>{MG.vsDir=Math.random()<0.5?'left':'right';MG.vsAngle=0;MG.vsNetTurns=0;MG.vsTurns=0;MG._vsDone=false;MG.vsLastDir='';},900);MG._timers.push(t);}}else{showFeedback('✗ WRONG WAY!','#ff3333');mgFail();beep(180,0.3);const t=setTimeout(()=>{MG.vsDir=Math.random()<0.5?'left':'right';MG.vsAngle=0;MG.vsNetTurns=0;MG.vsTurns=0;MG._vsDone=false;MG.vsLastDir='';},900);MG._timers.push(t);}}
  }
  const mouseFn=e=>{
    const rect=mgCvs.getBoundingClientRect(),cw=mgCvs.clientWidth,ch=mgCvs.clientHeight,vcx=cw/2,vcy=ch*0.72;
    if(e.type==='mousedown'){const dx=e.clientX-rect.left-vcx,dy=e.clientY-rect.top-vcy;if(Math.sqrt(dx*dx+dy*dy)<70){MG.vsDrag=true;MG.vsDragAngle=Math.atan2(dy,dx);}}
    else if(e.type==='mousemove'&&MG.vsDrag){const dx=e.clientX-rect.left-vcx,dy=e.clientY-rect.top-vcy,ang=Math.atan2(dy,dx);let diff=ang-MG.vsDragAngle;if(diff>Math.PI)diff-=Math.PI*2;if(diff<-Math.PI)diff+=Math.PI*2;MG.vsDragAngle=ang;if(!MG.done)checkValve(diff);}
    else MG.vsDrag=false;
  };
  mgCvs.addEventListener('mousedown',mouseFn);mgCvs.addEventListener('mousemove',mouseFn);mgCvs.addEventListener('mouseup',mouseFn);
  MG._canvasFns.push({fn:mouseFn,type:'mousedown'});MG._canvasFns.push({fn:mouseFn,type:'mousemove'});MG._canvasFns.push({fn:mouseFn,type:'mouseup'});
  const touchValveFn=e=>{
    const rect=mgCvs.getBoundingClientRect(),cw=mgCvs.clientWidth,ch=mgCvs.clientHeight,vcx=cw/2,vcy=ch*0.72;
    const touch=e.touches[0]||e.changedTouches[0];
    if(e.type==='touchstart'){const dx=touch.clientX-rect.left-vcx,dy=touch.clientY-rect.top-vcy;if(Math.sqrt(dx*dx+dy*dy)<70){MG.vsDrag=true;MG.vsDragAngle=Math.atan2(dy,dx);e.preventDefault();}}
    else if(e.type==='touchmove'&&MG.vsDrag){e.preventDefault();const dx=touch.clientX-rect.left-vcx,dy=touch.clientY-rect.top-vcy,ang=Math.atan2(dy,dx);let diff=ang-MG.vsDragAngle;if(diff>Math.PI)diff-=Math.PI*2;if(diff<-Math.PI)diff+=Math.PI*2;MG.vsDragAngle=ang;if(!MG.done)checkValve(diff);}
    else{MG.vsDrag=false;}
  };
  mgCvs.addEventListener('touchstart',touchValveFn,{passive:false});
  mgCvs.addEventListener('touchmove',touchValveFn,{passive:false});
  mgCvs.addEventListener('touchend',touchValveFn,{passive:false});
  MG._canvasFns.push({fn:touchValveFn,type:'touchstart'});MG._canvasFns.push({fn:touchValveFn,type:'touchmove'});MG._canvasFns.push({fn:touchValveFn,type:'touchend'});
  const keyFn=e=>{if(MG.done)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight')checkValve(e.key==='ArrowRight'?0.12:-0.12);};
  document.addEventListener('keydown',keyFn);MG._keyFns.push({fn:keyFn,type:'keydown'});
}
function _drawValveSpin(ctx, MG, now, cw, ch) {
  ctx.clearRect(0, 0, cw, ch);
  for(let x=0;x<cw;x+=44){ctx.fillStyle='rgba(0,40,60,0.08)';ctx.fillRect(x,0,1,ch);}
  const prog=Math.min(1,(MG.vsTurns||0)/(MG.vsNeeded||2));
  const bx=cw*0.12,bpby=ch*0.55,bw=cw*0.76,bh=10;
  ctx.fillStyle='rgba(0,20,30,0.8)';ctx.fillRect(bx,bpby,bw,bh);
  ctx.fillStyle=prog>=1?'#39ff14':'rgba(0,200,255,0.7)';ctx.fillRect(bx,bpby,bw*Math.max(0,prog),bh);
  ctx.strokeStyle='rgba(0,150,200,0.4)';ctx.lineWidth=1;ctx.strokeRect(bx,bpby,bw,bh);
  const vcx=cw/2,vcy=ch*0.72,vr=50;
  ctx.save();ctx.translate(vcx,vcy);ctx.rotate(MG.vsAngle);
  ctx.strokeStyle='#4488aa';ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,vr,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#336688';ctx.lineWidth=5;for(let s=0;s<6;s++){const a=s*Math.PI/3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*vr,Math.sin(a)*vr);ctx.stroke();}
  ctx.fillStyle='#224466';ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#4488aa';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.stroke();
  ctx.restore();
  ctx.fillStyle='rgba(0,180,255,0.6)';ctx.font='bold 12px monospace';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(`${MG.vsRound||0}/${MG.vsGoal}`,cw*0.04,ch*0.04);
  ctx.fillStyle='rgba(255,255,255,0.12)';ctx.font='9px monospace';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(_hint('valve_spin'),cw/2,ch-5);
}
function _drawAlienValveSpin(ctx, MG, now, cw, ch) {
  const {ax,ay,sc}=_alienPosMobile(cw,ch);
  ctx.clearRect(0, 0, cw, ch);
  MG.vsAlienAngle=(MG.vsAlienAngle||0)+(MG.vsDir==='left'?-1.8:1.8)*0.02;
  const prog=Math.min(1,(MG.vsTurns||0)/(MG.vsNeeded||2));
  const col=prog>=1?'#22cc44':`hsl(${prog*120},80%,45%)`;
  ctx.save();ctx.translate(ax,ay);ctx.rotate(MG.vsAlienAngle);ctx.translate(-ax,-ay);
  _drawAlienFig(ctx,ax,ay,sc,col,'#9b6ec0',0);
  ctx.restore();
  ctx.strokeStyle=prog>=1?'#39ff14':'rgba(0,200,255,0.5)';ctx.lineWidth=4;
  ctx.beginPath();ctx.arc(ax,ay-24*sc,18*sc,-Math.PI/2,-Math.PI/2+prog*Math.PI*2);ctx.stroke();
}

// ── DISPATCHERS ──
export function initGimmick(gimmick, mgCvs, MG, showFeedback, mgFail, mgSuccess) {
  MG._keyFns = []; MG._canvasFns = []; MG._alienCanvasFns = []; MG._timers = [];
  const map = { color_btn:_initColorBtn, run_jump:_initRunJump, glow_hold:_initGlowHold, symbol_body:_initSymbolBody, direction_arrow:_initDirectionArrow, dial_tilt:_initDialTilt, wire_connect:_initWireConnect, valve_spin:_initValveSpin };
  (map[gimmick] || _initColorBtn)(mgCvs, MG, showFeedback, mgFail, mgSuccess);
}

export function drawGimmick(gimmick, ctx, MG, now, cw, ch) {
  const map = { color_btn:_drawColorBtn, run_jump:_drawRunJump, glow_hold:_drawGlowHold, symbol_body:_drawSymbolBody, direction_arrow:_drawDirectionArrow, dial_tilt:_drawDialTilt, wire_connect:_drawWireConnect, valve_spin:_drawValveSpin };
  (map[gimmick] || _drawColorBtn)(ctx, MG, now, cw, ch);
}

export function drawAlienGimmick(gimmick, ctx, MG, now, cw, ch) {
  const map = { color_btn:_drawAlienColorBtn, run_jump:_drawAlienRunJump, glow_hold:_drawAlienGlowHold, symbol_body:_drawAlienSymbolBody, direction_arrow:_drawAlienDirectionArrow, dial_tilt:_drawAlienDialTilt, wire_connect:_drawAlienWireConnect, valve_spin:_drawAlienValveSpin };
  (map[gimmick] || _drawAlienColorBtn)(ctx, MG, now, cw, ch);
}

export function cleanupGimmick(mgCvs, MG) {
  if (!MG) return;
  (MG._keyFns || []).forEach(({ fn, type }) => document.removeEventListener(type, fn));
  (MG._canvasFns || []).forEach(({ fn, type }) => mgCvs && mgCvs.removeEventListener(type, fn));
  (MG._alienCanvasFns || []).forEach(({ fn, type }) => MG.alienCvs && MG.alienCvs.removeEventListener(type, fn));
  (MG._timers || []).forEach(clearTimeout);
  MG._keyFns = []; MG._canvasFns = []; MG._alienCanvasFns = []; MG._timers = [];
}
