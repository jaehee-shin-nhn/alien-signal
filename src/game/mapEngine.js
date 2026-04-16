import { TS, MW, MH, WALL, FLOOR, ROOMS } from '../constants';

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

  function carve(x, y) {
    if (x >= 0 && x < MW && y >= 0 && y < MH) mapData[y][x] = FLOOR;
  }
  // 2타일 너비 가로 복도
  function digH(y, x0, x1) {
    const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
    for (let x = lo; x <= hi; x++) { carve(x, y); carve(x, y + 1); }
  }
  // 2타일 너비 세로 복도
  function digV(x, y0, y1) {
    const lo = Math.min(y0, y1), hi = Math.max(y0, y1);
    for (let y = lo; y <= hi; y++) { carve(x, y); carve(x + 1, y); }
  }
  function digRoom(rx, ry, rw, rh) {
    for (let y = ry; y < ry + rh; y++)
      for (let x = rx; x < rx + rw; x++) carve(x, y);
  }
  // L자형으로 두 점 연결 (방향 랜덤)
  function lConnect(ax, ay, bx, by) {
    if (Math.random() < 0.5) { digH(ay, ax, bx); digV(bx, ay, by); }
    else { digV(ax, ay, by); digH(by, ax, bx); }
  }

  // ── START(거점)를 중앙에 랜덤 배치 ──────────────────────────────
  const startRx = 25 + Math.floor(Math.random() * 5); // 25~29
  const startRy = 18 + Math.floor(Math.random() * 4); // 18~21
  const startRw = 10, startRh = 8;
  const start = { rx: startRx, ry: startRy, rw: startRw, rh: startRh };
  const startCx = startRx + Math.floor(startRw / 2);
  const startCy = startRy + Math.floor(startRh / 2);
  digRoom(startRx, startRy, startRw, startRh);

  // ── 4개 구역 정의 (NW / NE / SW / SE) ──────────────────────────
  const RW = 10, RH = 8;
  const QUADS = [
    { xMin: 2,  xMax: 15, yMin: 3,  yMax: 13 }, // NW
    { xMin: 46, xMax: 52, yMin: 3,  yMax: 13 }, // NE
    { xMin: 2,  xMax: 15, yMin: 32, yMax: 42 }, // SW
    { xMin: 46, xMax: 52, yMin: 32, yMax: 42 }, // SE
  ];

  // ── 방 위치 랜덤 생성 ───────────────────────────────────────────
  const rooms = ROOMS.map((def, i) => {
    const q = QUADS[i];
    const rxRange = Math.max(0, q.xMax - q.xMin - RW);
    const ryRange = Math.max(0, q.yMax - q.yMin - RH);
    const rx = q.xMin + Math.floor(Math.random() * (rxRange + 1));
    const ry = q.yMin + Math.floor(Math.random() * (ryRange + 1));
    const roomCenterX = rx + RW / 2;
    const doorRow = ry + Math.floor(RH / 2) - 1;

    let doorTx, doorTy, alienTx, alienTy;
    if (roomCenterX < startCx) {
      // 왼쪽 방 → 오른쪽 벽에 문
      doorTx = rx + RW; doorTy = doorRow;
      alienTx = doorTx + 1; alienTy = doorRow;
    } else {
      // 오른쪽 방 → 왼쪽 벽에 문
      doorTx = rx - 1; doorTy = doorRow;
      alienTx = doorTx - 1; alienTy = doorRow;
    }
    return { ...def, rx, ry, rw: RW, rh: RH, doorTx, doorTy, alienTx, alienTy };
  });

  // ── 방 및 문 타일 파기 ──────────────────────────────────────────
  for (const r of rooms) {
    digRoom(r.rx, r.ry, r.rw, r.rh);
    carve(r.doorTx, r.doorTy);
    carve(r.doorTx, r.doorTy + 1);
    doorOpen[r.id] = true;
  }

  // ── 각 방 → START 구불구불 복도 연결 ───────────────────────────
  for (const r of rooms) {
    const x0 = r.doorTx, y0 = r.doorTy + 1;
    const x1 = startCx,  y1 = startCy;

    // 중간 경유지 1~2개로 S/Z자형 복도 생성
    const numWP = 1 + Math.floor(Math.random() * 2);
    const wps = [[x0, y0]];
    for (let k = 1; k <= numWP; k++) {
      const t = k / (numWP + 1);
      const wx = clamp(
        Math.round(x0 + (x1 - x0) * t + (Math.random() - 0.5) * 10),
        2, MW - 4
      );
      const wy = clamp(
        Math.round(y0 + (y1 - y0) * t + (Math.random() - 0.5) * 7),
        2, MH - 4
      );
      wps.push([wx, wy]);
    }
    wps.push([x1, y1]);

    for (let k = 0; k < wps.length - 1; k++) {
      const [ax, ay] = wps[k];
      const [bx, by] = wps[k + 1];
      lConnect(ax, ay, bx, by);
    }
  }

  // ── 탐색용 막힌 곁가지(dead-end) 추가 ──────────────────────────
  let deadsAdded = 0, tries = 0;
  while (deadsAdded < 8 && tries < 200) {
    tries++;
    const fx = 2 + Math.floor(Math.random() * (MW - 4));
    const fy = 2 + Math.floor(Math.random() * (MH - 4));
    if (mapData[fy]?.[fx] === FLOOR) {
      const len = 5 + Math.floor(Math.random() * 10);
      const dir = Math.floor(Math.random() * 4);
      if (dir === 0)      digH(fy, fx, clamp(fx + len, 2, MW - 3));
      else if (dir === 1) digH(fy, clamp(fx - len, 2, MW - 3), fx);
      else if (dir === 2) digV(fx, fy, clamp(fy + len, 2, MH - 3));
      else                digV(fx, clamp(fy - len, 2, MH - 3), fy);
      deadsAdded++;
    }
  }

  // ── 외계인 색 랜덤 배정 ────────────────────────────────────────
  const shuffled = [...ALIEN_COLOR_KEYS].sort(() => Math.random() - 0.5);
  const alienColors = {};
  rooms.forEach((r, i) => { alienColors[r.id] = shuffled[i]; });

  // ── 안개(fog of war) 배열 (0=미탐색) ──────────────────────────
  const explored = new Uint8Array(MW * MH);

  return { mapData, doorOpen, alienColors, rooms, start, explored };
}

// 플레이어 주변 반경 reveal
export function revealExplored(explored, cx, cy, radius) {
  for (let dy = -radius; dy <= radius; dy++)
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const tx = cx + dx, ty = cy + dy;
      if (tx >= 0 && tx < MW && ty >= 0 && ty < MH)
        explored[ty * MW + tx] = 1;
    }
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

export function drawMap(ctx, mapData, doorOpen, clearedRooms, rooms, start, P, camX, camY, cw, ch, now, alienColors = {}) {
  ctx.clearRect(0, 0, cw, ch);
  ctx.save();
  ctx.translate(-Math.round(camX), -Math.round(camY));

  const sx = Math.max(0, Math.floor(camX / TS));
  const sy = Math.max(0, Math.floor(camY / TS));
  const ex = Math.min(MW, Math.ceil((camX + cw) / TS) + 1);
  const ey = Math.min(MH, Math.ceil((camY + ch) / TS) + 1);
  const pulse = 0.5 + 0.5 * Math.sin(now / 500);

  // 바닥 타일 렌더
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

  // 방 렌더
  for (const r of rooms) {
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

  // START 구역
  ctx.fillStyle = 'rgba(0,100,200,0.08)';
  ctx.fillRect(start.rx * TS, start.ry * TS, start.rw * TS, start.rh * TS);
  ctx.strokeStyle = 'rgba(0,150,255,0.22)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(start.rx * TS + 1, start.ry * TS + 1, start.rw * TS - 2, start.rh * TS - 2);
  ctx.fillStyle = 'rgba(0,150,255,0.3)'; ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('START', (start.rx + start.rw / 2) * TS, (start.ry + start.rh / 2) * TS);

  // EXIT (3개 이상 클리어 시)
  if (clearedRooms.size >= 3) {
    const epx = (start.rx + Math.floor(start.rw / 2)) * TS;
    const epy = (start.ry + Math.floor(start.rh / 2) - 1) * TS;
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

export function drawMinimap(mmCtx, mapData, clearedRooms, rooms, P, mw, mh, now, explored) {
  const sx = mw / (MW * TS), sy = mh / (MH * TS);
  mmCtx.fillStyle = '#010206'; mmCtx.fillRect(0, 0, mw, mh);

  // 탐색한 바닥만 표시 (fog of war)
  mmCtx.fillStyle = 'rgba(0,245,255,0.07)';
  for (let ty = 0; ty < MH; ty++)
    for (let tx = 0; tx < MW; tx++)
      if (mapData[ty] && mapData[ty][tx] === FLOOR && explored[ty * MW + tx])
        mmCtx.fillRect(tx * TS * sx, ty * TS * sy, Math.ceil(TS * sx) + 1, Math.ceil(TS * sy) + 1);

  // 탐색한 방만 표시
  for (const r of rooms) {
    const cl = clearedRooms.has(r.id);
    // 방 타일 중 하나라도 탐색됐는지 확인
    let roomSeen = false;
    outer: for (let ty = r.ry; ty < r.ry + r.rh; ty++) {
      for (let tx = r.rx; tx < r.rx + r.rw; tx++) {
        if (explored[ty * MW + tx]) { roomSeen = true; break outer; }
      }
    }
    if (!roomSeen && !cl) continue;

    const blink = Math.floor(now / 500) % 2 === 0;
    mmCtx.fillStyle = cl ? 'rgba(57,255,20,0.3)' : (blink ? 'rgba(180,50,50,0.35)' : 'rgba(100,30,30,0.2)');
    mmCtx.fillRect(r.rx * TS * sx, r.ry * TS * sy, r.rw * TS * sx, r.rh * TS * sy);
    mmCtx.strokeStyle = cl ? 'rgba(57,255,20,0.5)' : r.border + '88';
    mmCtx.lineWidth = 1;
    mmCtx.strokeRect(r.rx * TS * sx, r.ry * TS * sy, r.rw * TS * sx, r.rh * TS * sy);
  }

  // 플레이어 점
  mmCtx.fillStyle = '#00f5ff';
  mmCtx.beginPath();
  mmCtx.arc(P.px * sx + TS * sx / 2, P.py * sy + TS * sy / 2, 3, 0, Math.PI * 2);
  mmCtx.fill();
}
