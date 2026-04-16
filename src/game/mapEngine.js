import { TS, MW, MH, WALL, FLOOR, ROOMS, START } from '../constants';

import playerFrontIdle  from '../assets/player_front_idle.png';
import playerFrontWalk1 from '../assets/player_front_walk1.png';
import playerFrontWalk2 from '../assets/player_front_walk2.png';
import playerBackIdle   from '../assets/player_back_idle.png';
import playerBackWalk1  from '../assets/player_back_walk1.png';
import playerBackWalk2  from '../assets/player_back_walk2.png';
import playerLeftIdle   from '../assets/player_left_idle.png';
import playerLeftWalk1  from '../assets/player_left_walk1.png';
import playerLeftWalk2  from '../assets/player_left_walk2.png';
import playerRightIdle  from '../assets/player_right_idle.png';
import playerRightWalk1 from '../assets/player_right_walk1.png';
import playerRightWalk2 from '../assets/player_right_walk2.png';

import alienBlue   from '../assets/alien_blue.png';
import alienGreen  from '../assets/alien_green.png';
import alienOrange from '../assets/alien_orange.png';
import alienPink   from '../assets/alien_pink.png';
import alienPurple from '../assets/alien_purple.png';
import alienRed    from '../assets/alien_red.png';
import alienTeal   from '../assets/alien_teal.png';
import alienYellow from '../assets/alien_yellow.png';

const PLAYER_IMGS = {
  down:  { idle: playerFrontIdle,  walk1: playerFrontWalk1,  walk2: playerFrontWalk2 },
  up:    { idle: playerBackIdle,   walk1: playerBackWalk1,   walk2: playerBackWalk2 },
  left:  { idle: playerLeftIdle,   walk1: playerLeftWalk1,   walk2: playerLeftWalk2 },
  right: { idle: playerRightIdle,  walk1: playerRightWalk1,  walk2: playerRightWalk2 },
};

const ALIEN_IMG_MAP = {
  blue: alienBlue, green: alienGreen, orange: alienOrange, pink: alienPink,
  purple: alienPurple, red: alienRed, teal: alienTeal, yellow: alienYellow,
};
const ALIEN_COLOR_KEYS = Object.keys(ALIEN_IMG_MAP);

const _imgs = {};
function getImg(src) {
  if (!_imgs[src]) { const i = new Image(); i.src = src; _imgs[src] = i; }
  return _imgs[src];
}

export function buildMap() {
  const mapData = Array.from({ length: MH }, () => new Uint8Array(MW).fill(WALL));
  const doorOpen = {};

  function digH(y, x0, x1) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
      if (y >= 0 && y < MH && x >= 0 && x < MW) mapData[y][x] = FLOOR;
      if (y + 1 >= 0 && y + 1 < MH && x >= 0 && x < MW) mapData[y + 1][x] = FLOOR;
    }
  }
  function digV(x, y0, y1) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
      if (y >= 0 && y < MH && x >= 0 && x < MW) mapData[y][x] = FLOOR;
      if (y >= 0 && y < MH && x + 1 >= 0 && x + 1 < MW) mapData[y][x + 1] = FLOOR;
    }
  }

  for (let y = START.ry; y < START.ry + START.rh; y++)
    for (let x = START.rx; x < START.rx + START.rw; x++) mapData[y][x] = FLOOR;

  for (const r of ROOMS) {
    for (let y = r.ry; y < r.ry + r.rh; y++)
      for (let x = r.rx; x < r.rx + r.rw; x++) mapData[y][x] = FLOOR;
    mapData[r.doorTy][r.doorTx] = FLOOR;
    if (mapData[r.doorTy + 1]) mapData[r.doorTy + 1][r.doorTx] = FLOOR;
    doorOpen[r.id] = true;
  }

  digV(30, 20, 44);
  digH(24, 13, 30);
  digH(40, 13, 30);
  digH(24, 30, 49);
  digH(40, 30, 49);

  const shuffled = [...ALIEN_COLOR_KEYS].sort(() => Math.random() - 0.5);
  const alienColors = {};
  ROOMS.forEach((r, i) => { alienColors[r.id] = shuffled[i]; });

  return { mapData, doorOpen, alienColors };
}

export function openDoor(mapData, doorOpen, room) {
  doorOpen[room.id] = true;
  mapData[room.doorTy][room.doorTx] = FLOOR;
  if (mapData[room.doorTy + 1]) mapData[room.doorTy + 1][room.doorTx] = FLOOR;
}

export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function easeOut(t) { return 1 - (1 - t) * (1 - t); }
function hash(x, y) { return (((x * 0x9e3779b9) ^ (y * 0x85ebca77)) >>> 0) & 0xff; }

export function getCamTarget(px, py, cw, ch) {
  return {
    x: clamp(px + TS / 2 - cw / 2, 0, Math.max(0, MW * TS - cw)),
    y: clamp(py + TS / 2 - ch / 2, 0, Math.max(0, MH * TS - ch)),
  };
}

export function walkable(mapData, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return false;
  return mapData[ty][tx] === FLOOR;
}

export function drawMap(ctx, mapData, doorOpen, clearedRooms, P, camX, camY, cw, ch, now, alienColors = {}) {
  ctx.clearRect(0, 0, cw, ch);
  ctx.save();
  ctx.translate(-Math.round(camX), -Math.round(camY));

  const sx = Math.max(0, Math.floor(camX / TS));
  const sy = Math.max(0, Math.floor(camY / TS));
  const ex = Math.min(MW, Math.ceil((camX + cw) / TS) + 1);
  const ey = Math.min(MH, Math.ceil((camY + ch) / TS) + 1);
  const pulse = 0.5 + 0.5 * Math.sin(now / 500);

  for (let ty = sy; ty < ey; ty++) {
    for (let tx = sx; tx < ex; tx++) {
      const px = tx * TS, py = ty * TS;
      const h = hash(tx, ty);
      const tile = mapData[ty] ? mapData[ty][tx] : WALL;
      if (tile !== WALL) {
        const fv = 16 + (h & 0x06);
        ctx.fillStyle = `rgb(${fv - 2},${fv},${fv + 10})`;
        ctx.fillRect(px, py, TS, TS);
        ctx.fillStyle = 'rgba(0,245,255,0.04)';
        if (tx % 2 === 0) ctx.fillRect(px, py, 1, TS);
        if (ty % 2 === 0) ctx.fillRect(px, py, TS, 1);
        ctx.fillStyle = 'rgba(0,245,255,0.06)';
        ctx.fillRect(px, py, TS, 1); ctx.fillRect(px, py, 1, TS);
      }
    }
  }

  for (const r of ROOMS) {
    const cleared = clearedRooms.has(r.id);
    const rx = r.rx * TS, ry = r.ry * TS, rw = r.rw * TS, rh = r.rh * TS;
    ctx.fillStyle = cleared ? 'rgba(57,255,20,0.05)' : r.color + '66';
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = cleared ? 'rgba(57,255,20,0.4)' : r.border;
    ctx.lineWidth = cleared ? 2 : 1.5;
    ctx.strokeRect(rx + 1, ry + 1, rw - 2, rh - 2);
    ctx.fillStyle = cleared ? 'rgba(57,255,20,0.7)' : 'rgba(255,255,255,0.2)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText((cleared ? '✓ ' : '') + r.name, rx + rw / 2, ry + 4);
    const cl = cleared ? 'rgba(57,255,20,0.3)' : r.border + '66';
    for (const [cx2, cy2] of [[rx + 4, ry + 4], [rx + rw - 4, ry + 4], [rx + 4, ry + rh - 4], [rx + rw - 4, ry + rh - 4]]) {
      ctx.fillStyle = cl;
      ctx.fillRect(cx2 - 3, cy2 - 1, 6, 2); ctx.fillRect(cx2 - 1, cy2 - 3, 2, 6);
    }
    if (!cleared) {
      const dx = r.doorTx * TS, dy = r.doorTy * TS;
      if (doorOpen[r.id]) {
        ctx.fillStyle = 'rgba(0,245,255,0.15)';
        ctx.fillRect(dx, dy, TS, TS * 2);
        ctx.strokeStyle = 'rgba(0,245,255,0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(dx + 2, dy + 2, TS - 4, TS * 2 - 4);
        const grd = ctx.createRadialGradient(dx + TS / 2, dy + TS, 0, dx + TS / 2, dy + TS, TS * 1.5);
        grd.addColorStop(0, `rgba(0,245,255,${0.2 + 0.1 * pulse})`);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd; ctx.fillRect(dx - TS, dy - TS, TS * 3, TS * 4);
      } else {
        ctx.fillStyle = '#0a1020';
        ctx.fillRect(dx, dy, TS, TS * 2);
        for (let s = 0; s < 6; s++) {
          ctx.fillStyle = s % 2 === 0 ? '#0e1828' : '#0c1420';
          ctx.fillRect(dx + 1, dy + 1 + s * (TS * 2 / 6), TS - 2, (TS * 2 / 6) - 1);
        }
        ctx.strokeStyle = r.border; ctx.lineWidth = 1.5;
        ctx.strokeRect(dx + 1, dy + 1, TS - 2, TS * 2 - 2);
        ctx.fillStyle = `rgba(255,80,0,${0.5 + 0.4 * pulse})`;
        ctx.font = '11px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🔒', dx + TS / 2, dy + TS);
      }
      drawMapAlien(ctx, r, P, now, alienColors[r.id] || 'blue');
    }
  }

  ctx.fillStyle = 'rgba(0,100,200,0.08)';
  ctx.fillRect(START.rx * TS, START.ry * TS, START.rw * TS, START.rh * TS);
  ctx.strokeStyle = 'rgba(0,150,255,0.22)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(START.rx * TS + 1, START.ry * TS + 1, START.rw * TS - 2, START.rh * TS - 2);
  ctx.fillStyle = 'rgba(0,150,255,0.3)'; ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('START', (START.rx + START.rw / 2) * TS, (START.ry + START.rh / 2) * TS);

  if (clearedRooms.size >= 3) {
    const epx = 31 * TS, epy = 23 * TS;
    const eg = ctx.createRadialGradient(epx, epy, 0, epx, epy, TS * 2.5);
    eg.addColorStop(0, `rgba(60,255,200,${0.5 + 0.3 * pulse})`);
    eg.addColorStop(1, 'transparent');
    ctx.fillStyle = eg; ctx.fillRect(epx - TS * 2.5, epy - TS * 2.5, TS * 5, TS * 5);
    ctx.fillStyle = `rgba(60,255,200,${0.8 + 0.2 * pulse})`;
    ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✦ EXIT ✦', epx, epy);
  }

  drawPlayer(ctx, P);
  ctx.restore();
}

function drawMapAlien(ctx, r, P, now, color) {
  const ax = r.alienTx * TS + TS / 2, ay = r.alienTy * TS + TS / 2;
  const p = 0.5 + 0.5 * Math.sin(now / 300 + r.rx);
  const grd = ctx.createRadialGradient(ax, ay, 0, ax, ay, TS);
  grd.addColorStop(0, r.light + '55'); grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(ax, ay, TS, 0, Math.PI * 2); ctx.fill();
  const img = getImg(ALIEN_IMG_MAP[color] || ALIEN_IMG_MAP.blue);
  const iw = 40, ih = 52;
  ctx.drawImage(img, ax - iw / 2, ay - ih / 2 - 4, iw, ih);
  const dist = Math.abs(P.tx - r.alienTx) + Math.abs(P.ty - r.alienTy);
  if (dist <= 3) {
    ctx.fillStyle = `rgba(255,107,0,${0.7 + 0.3 * p})`;
    ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('?', ax, ay - 30);
  }
}

export function drawPlayer(ctx, P) {
  const cx = P.px + TS / 2;
  const wp = P.animT < 1 ? Math.sin(P.animT * Math.PI) : 0;
  const bob = P.animT < 1 ? -Math.abs(wp) * 3 : 0;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(cx, P.py + TS - 3, 10, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  const dirs = PLAYER_IMGS[P.dir] || PLAYER_IMGS.down;
  const imgSrc = P.animT >= 1 ? dirs.idle : (P.step === 0 ? dirs.walk1 : dirs.walk2);
  const img = getImg(imgSrc);
  const iw = 40, ih = 52;
  ctx.drawImage(img, P.px, P.py + TS - ih + bob, iw, ih);
}

export function drawMinimap(mmCtx, mapData, clearedRooms, P, mw, mh, now) {
  const sx = mw / (MW * TS), sy = mh / (MH * TS);
  mmCtx.fillStyle = '#010206'; mmCtx.fillRect(0, 0, mw, mh);
  mmCtx.fillStyle = 'rgba(0,245,255,0.07)';
  for (let ty = 0; ty < MH; ty++)
    for (let tx = 0; tx < MW; tx++)
      if (mapData[ty] && mapData[ty][tx] === FLOOR)
        mmCtx.fillRect(tx * TS * sx, ty * TS * sy, Math.ceil(TS * sx) + 1, Math.ceil(TS * sy) + 1);
  for (const r of ROOMS) {
    const cl = clearedRooms.has(r.id);
    const blink = Math.floor(now / 500) % 2 === 0;
    mmCtx.fillStyle = cl ? 'rgba(57,255,20,0.3)' : (blink ? 'rgba(180,50,50,0.35)' : 'rgba(100,30,30,0.2)');
    mmCtx.fillRect(r.rx * TS * sx, r.ry * TS * sy, r.rw * TS * sx, r.rh * TS * sy);
    mmCtx.strokeStyle = cl ? 'rgba(57,255,20,0.5)' : r.border + '88';
    mmCtx.lineWidth = 1;
    mmCtx.strokeRect(r.rx * TS * sx, r.ry * TS * sy, r.rw * TS * sx, r.rh * TS * sy);
  }
  mmCtx.fillStyle = '#00f5ff';
  mmCtx.beginPath();
  mmCtx.arc(P.px * sx + TS * sx / 2, P.py * sy + TS * sy / 2, 3, 0, Math.PI * 2);
  mmCtx.fill();
}
