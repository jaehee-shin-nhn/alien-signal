import { useEffect, useRef } from 'react';
import mapBg from '../assets/map.png';
import { TS } from '../constants';
import {
  buildMap, openDoor, walkable, drawMap, drawMinimap,
  getCamTarget, easeOut, revealExplored,
} from '../game/mapEngine';

const REVEAL_RADIUS = 7;

export default function MapScreen({ visible, gs, isMobile, onEnterRoom, onWin }) {
  const canvasRef = useRef(null);
  const mmRef = useRef(null);
  const animRef = useRef(null);
  const stateRef = useRef(null);

  useEffect(() => {
    if (!visible) return;

    const canvas = canvasRef.current;
    const mmCvs = mmRef.current;
    const ctx = canvas.getContext('2d');
    const mmCtx = mmCvs.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();

    // 맵 상태 초기화 (재입장 시 유지)
    if (!stateRef.current) {
      const { mapData, doorOpen, alienColors, rooms, start, explored } = buildMap();
      const spawnTx = start.rx + Math.floor(start.rw / 2);
      const spawnTy = start.ry + Math.floor(start.rh / 2);
      const P = {
        tx: spawnTx, ty: spawnTy,
        px: spawnTx * TS, py: spawnTy * TS,
        fx: spawnTx * TS, fy: spawnTy * TS,
        animT: 1, dir: 'down', step: 0,
      };
      const cam = getCamTarget(P.px, P.py, canvas.width, canvas.height);
      stateRef.current = { mapData, doorOpen, alienColors, rooms, start, explored, P, camX: cam.x, camY: cam.y };
      gs.mapData = mapData;
      gs.doorOpen = doorOpen;
      // 스폰 지점 주변 즉시 reveal
      revealExplored(explored, P.tx, P.ty, REVEAL_RADIUS);
    }

    const s = stateRef.current;
    let prev = performance.now();

    function loop(now) {
      if (!visible) return;
      const dt = Math.min(now - prev, 50); prev = now;
      const { mapData, doorOpen, rooms, start, explored, P } = s;
      const cw = canvas.width, ch = canvas.height;

      // 이동 애니메이션
      if (P.animT < 1) {
        P.animT = Math.min(1, P.animT + dt / 200);
        const e = easeOut(P.animT);
        P.px = P.fx + (P.tx * TS - P.fx) * e;
        P.py = P.fy + (P.ty * TS - P.fy) * e;
        if (P.animT >= 1) { P.px = P.tx * TS; P.py = P.ty * TS; }
      }

      function tryMove(dx, dy, dir) {
        P.dir = dir;
        const nx = P.tx + dx, ny = P.ty + dy;
        if (!walkable(mapData, nx, ny)) return;
        P.fx = P.tx * TS; P.fy = P.ty * TS;
        P.tx = nx; P.ty = ny; P.animT = 0; P.step ^= 1;
        revealExplored(explored, nx, ny, REVEAL_RADIUS);
      }

      if (P.animT >= 1) {
        if (gs.keys['ArrowLeft']  || gs.keys['a']) tryMove(-1, 0, 'left');
        else if (gs.keys['ArrowRight'] || gs.keys['d']) tryMove(1, 0, 'right');
        else if (gs.keys['ArrowUp']    || gs.keys['w']) tryMove(0, -1, 'up');
        else if (gs.keys['ArrowDown']  || gs.keys['s']) tryMove(0, 1, 'down');
      }

      // 방 진입 감지
      if (P.animT >= 1) {
        for (const r of rooms) {
          if (gs.clearedRooms.has(r.id)) continue;
          if (doorOpen[r.id] && P.tx >= r.rx && P.tx < r.rx + r.rw && P.ty >= r.ry && P.ty < r.ry + r.rh) {
            onEnterRoom(r); return;
          }
        }
        // 클리어 조건: 3개 이상 수리 후 START 중심 복귀
        const exitTx = start.rx + Math.floor(start.rw / 2);
        const exitTy = start.ry + Math.floor(start.rh / 2);
        if (gs.clearedRooms.size >= 3 && Math.abs(P.tx - exitTx) + Math.abs(P.ty - exitTy) <= 2) {
          onWin(); return;
        }
      }

      // 카메라 lerp
      const target = getCamTarget(P.px, P.py, cw, ch);
      s.camX += (target.x - s.camX) * 0.1;
      s.camY += (target.y - s.camY) * 0.1;

      drawMap(ctx, mapData, doorOpen, gs.clearedRooms, rooms, start, P, s.camX, s.camY, cw, ch, now, s.alienColors);
      drawMinimap(mmCtx, mapData, gs.clearedRooms, rooms, P, 130, 100, now, explored);

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);

    function onResize() { resize(); }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [visible]);

  // 미니게임 클리어 후 문 열림 동기화
  useEffect(() => {
    if (!stateRef.current) return;
    const s = stateRef.current;
    for (const r of s.rooms) {
      if (gs.clearedRooms.has(r.id) || gs.doorOpen?.[r.id]) {
        openDoor(s.mapData, s.doorOpen, r);
      }
    }
  });

  return (
    <div id="screen-map" style={{ display: visible ? 'block' : 'none', backgroundImage: `url(${mapBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <canvas ref={canvasRef} id="map-canvas" style={{ display: 'block', width: '100%', height: '100%' }} />
      <div id="minimap-wrap">
        <div id="mm-label">SHIP MAP</div>
        <canvas ref={mmRef} id="minimap" width={130} height={100} />
      </div>
      <div id="map-hud">
        <div className="hl">REPAIRED</div>
        <div className="hv">{gs.clearedRooms.size} / 3</div>
        <div className="hl" style={{ marginTop: 4 }}>SCORE</div>
        <div className="hv">{gs.score}</div>
      </div>
      {isMobile ? (
        <div id="map-dpad">
          <button className="dp-btn dp-up"
            onPointerDown={e => { e.preventDefault(); gs.keys['ArrowUp'] = true; }}
            onPointerUp={() => { gs.keys['ArrowUp'] = false; }}
            onPointerLeave={() => { gs.keys['ArrowUp'] = false; }}
          >▲</button>
          <button className="dp-btn dp-left"
            onPointerDown={e => { e.preventDefault(); gs.keys['ArrowLeft'] = true; }}
            onPointerUp={() => { gs.keys['ArrowLeft'] = false; }}
            onPointerLeave={() => { gs.keys['ArrowLeft'] = false; }}
          >◀</button>
          <div className="dp-btn dp-center">·</div>
          <button className="dp-btn dp-right"
            onPointerDown={e => { e.preventDefault(); gs.keys['ArrowRight'] = true; }}
            onPointerUp={() => { gs.keys['ArrowRight'] = false; }}
            onPointerLeave={() => { gs.keys['ArrowRight'] = false; }}
          >▶</button>
          <button className="dp-btn dp-down"
            onPointerDown={e => { e.preventDefault(); gs.keys['ArrowDown'] = true; }}
            onPointerUp={() => { gs.keys['ArrowDown'] = false; }}
            onPointerLeave={() => { gs.keys['ArrowDown'] = false; }}
          >▼</button>
        </div>
      ) : (
        <div id="map-tip">WASD / 방향키 이동 &nbsp;│&nbsp; 방 안으로 걸어 들어가기</div>
      )}
    </div>
  );
}
