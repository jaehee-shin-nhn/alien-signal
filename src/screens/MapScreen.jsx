import { useEffect, useRef } from 'react';
import mapBg from '../assets/map.png';
import { TS, ROOMS } from '../constants';
import { buildMap, openDoor, walkable, drawMap, drawMinimap, getCamTarget, easeOut } from '../game/mapEngine';

export default function MapScreen({ visible, gs, onEnterRoom, onWin }) {
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

    // Init or reuse map state
    if (!stateRef.current) {
      const { mapData, doorOpen, alienColors } = buildMap();
      const P = { tx: 31, ty: 24, px: 31 * TS, py: 24 * TS, fx: 31 * TS, fy: 24 * TS, animT: 1, dir: 'down', step: 0 };
      const cam = getCamTarget(P.px, P.py, canvas.width, canvas.height);
      stateRef.current = { mapData, doorOpen, alienColors, P, camX: cam.x, camY: cam.y };
      gs.mapData = mapData;
      gs.doorOpen = doorOpen;
    }

    const s = stateRef.current;
    let prev = performance.now();

    function loop(now) {
      if (!visible) return;
      const dt = Math.min(now - prev, 50); prev = now;
      const { mapData, doorOpen, P } = s;
      const cw = canvas.width, ch = canvas.height;

      // Movement
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
      }

      if (P.animT >= 1) {
        if (gs.keys['ArrowLeft'] || gs.keys['a'])       tryMove(-1, 0, 'left');
        else if (gs.keys['ArrowRight'] || gs.keys['d']) tryMove(1, 0, 'right');
        else if (gs.keys['ArrowUp'] || gs.keys['w'])    tryMove(0, -1, 'up');
        else if (gs.keys['ArrowDown'] || gs.keys['s'])  tryMove(0, 1, 'down');
      }

      // Room entry detection
      if (P.animT >= 1) {
        for (const r of ROOMS) {
          if (gs.clearedRooms.has(r.id)) continue;
          if (doorOpen[r.id] && P.tx >= r.rx && P.tx < r.rx + r.rw && P.ty >= r.ry && P.ty < r.ry + r.rh) {
            onEnterRoom(r); return;
          }
        }
        // Win condition
        if (gs.clearedRooms.size >= 3 && Math.abs(P.tx - 31) + Math.abs(P.ty - 23) <= 2) {
          onWin(); return;
        }
      }

      // Camera lerp
      const target = getCamTarget(P.px, P.py, cw, ch);
      s.camX += (target.x - s.camX) * 0.1;
      s.camY += (target.y - s.camY) * 0.1;

      drawMap(ctx, mapData, doorOpen, gs.clearedRooms, P, s.camX, s.camY, cw, ch, now, s.alienColors);
      drawMinimap(mmCtx, mapData, gs.clearedRooms, P, 130, 100, now);

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

  // Sync cleared rooms / door opens from outside
  useEffect(() => {
    if (!stateRef.current) return;
    const s = stateRef.current;
    for (const r of ROOMS) {
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
      <div id="map-tip">WASD / 방향키 이동 &nbsp;│&nbsp; 방 안으로 걸어 들어가기</div>
    </div>
  );
}
