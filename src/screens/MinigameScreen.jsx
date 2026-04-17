import { useEffect, useRef, useState } from 'react';
import gameBg from '../assets/game-backgorund.png';
import { TOOLS, GIMMICK_META } from '../constants';
import { useLang } from '../LangContext';
import { GESTURE_SVGS, GESTURE_GLYPHS } from '../gestureData';
import { stopSounds } from '../game/audio';
import { clearParts, updateParts, drawParts } from '../game/particles';
import {
  initBolt, drawBolt, initBug, drawBug, initFireOut, drawFireOut, initMonster, drawMonster,
  initGimmick, drawGimmick, drawAlienGimmick, cleanupGimmick,
} from '../game/minigameEngines';

export default function MinigameScreen({ visible, room, gs, isMobile, onExit, onSuccess, onFail }) {
  const { t } = useLang();
  const canvasRef = useRef(null);
  const alienCanvasRef = useRef(null);
  const animRef = useRef(null);
  const mgRef = useRef({});
  const [selectedTool, setSelectedTool] = useState(null);
  const [feedback, setFeedback] = useState({ msg: '', color: '#fff', show: false });
  const [hintOpen, setHintOpen] = useState(false);
  const fbTimerRef = useRef(null);

  function showFeedback(msg, color, dur = 90) {
    setFeedback({ msg, color, show: true });
    clearTimeout(fbTimerRef.current);
    fbTimerRef.current = setTimeout(() => setFeedback(f => ({ ...f, show: false })), dur / 60 * 1000);
  }

  function selTool(idx) {
    const next = selectedTool === idx ? null : idx;
    setSelectedTool(next);
    mgRef.current.curTool = next !== null ? TOOLS[next] : null;
    if (canvasRef.current) canvasRef.current.style.cursor = next !== null ? 'crosshair' : 'default';
  }

  function handleSuccess() {
    if (mgRef.current.done) return;
    mgRef.current.done = true; mgRef.current.success = true;
    const gained = Math.max(100, 500 - gs.mistakes * 50);
    gs.score += gained;
    gs.clearedRooms.add(room.id);
    onSuccess();
    setTimeout(() => { stopSounds(); onExit(); }, 2000);
  }

  function handleFail() {
    if (mgRef.current.done) return;
    gs.mistakes++; gs.lives = Math.max(0, gs.lives - 1);
    onFail(gs.lives);
    if (gs.lives <= 0) setTimeout(() => { stopSounds(); onExit(true); }, 1200);
  }

  useEffect(() => {
    if (!visible || !room) return;
    const easy = gs.difficulty === 'easy';
    const canvas = canvasRef.current;
    const view = canvas.parentElement;
    canvas.width = view.clientWidth;
    canvas.height = view.clientHeight;
    const ctx = canvas.getContext('2d');

    mgRef.current = { id: room.id, done: false, success: false, curTool: null, keys: gs.keys };
    clearParts();
    stopSounds();
    setSelectedTool(null);
    setHintOpen(false);
    canvas.onclick = null; canvas.onmousemove = null;

    if (easy) {
      initGimmick(room.gimmick, canvas, mgRef.current, showFeedback, handleFail, handleSuccess);
      const alienCvs = alienCanvasRef.current;
      if (alienCvs) {
        const p = alienCvs.parentElement;
        alienCvs.width = p ? p.clientWidth : alienCvs.offsetWidth || 180;
        alienCvs.height = p ? p.clientHeight : alienCvs.offsetHeight || 280;
      }
    } else {
      if (room.id === 'bolt_loose') initBolt(canvas, mgRef.current, showFeedback, handleFail, handleSuccess);
      else if (room.id === 'bug_hunt') initBug(canvas, mgRef.current, showFeedback, handleFail, handleSuccess);
      else if (room.id === 'fire_out') initFireOut(canvas, mgRef.current, showFeedback, handleFail, handleSuccess);
      else if (room.id === 'monster_fight') initMonster(canvas, mgRef.current, showFeedback, handleFail, handleSuccess);
    }

    function loop(now) {
      if (!visible) return;
      const MG = mgRef.current;
      const cw = canvas.width, ch = canvas.height;

      if (easy) {
        drawGimmick(room.gimmick, ctx, MG, now, cw, ch);
        const alienCvs = alienCanvasRef.current;
        if (alienCvs) {
          const actx = alienCvs.getContext('2d');
          drawAlienGimmick(room.gimmick, actx, MG, now, alienCvs.width, alienCvs.height);
        }
      } else {
        if (MG.id === 'bolt_loose') drawBolt(ctx, MG, now, cw, ch);
        else if (MG.id === 'bug_hunt') drawBug(ctx, MG, now, cw, ch);
        else if (MG.id === 'fire_out') drawFireOut(ctx, MG, now, cw, ch);
        else if (MG.id === 'monster_fight') drawMonster(ctx, MG, now, cw, ch);
        if (MG.curTool && !MG.done) {
          ctx.fillStyle = 'rgba(0,245,255,0.65)';
          ctx.font = '11px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          ctx.fillText(`${MG.curTool.emoji}`, 8, 6);
        }
      }

      if (MG._failPending && !MG.done) { MG._failPending = false; handleFail(); }
      updateParts(); drawParts(ctx);

      if (MG.success) {
        ctx.fillStyle = 'rgba(57,255,20,0.1)'; ctx.fillRect(0, 0, cw, ch);
        ctx.fillStyle = '#39ff14'; ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(
          easy ? '✓ CLEARED'
            : MG.id === 'monster_fight' ? '✓ MONSTER DOWN' : '✓ REPAIRED',
          cw / 2, ch / 2,
        );
      }
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);

    function onResize() {
      canvas.width = view.clientWidth;
      canvas.height = view.clientHeight;
      const alienCvs = alienCanvasRef.current;
      if (alienCvs) {
        const p = alienCvs.parentElement;
        alienCvs.width = p ? p.clientWidth : alienCvs.offsetWidth || 180;
        alienCvs.height = p ? p.clientHeight : alienCvs.offsetHeight || 280;
      }
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
      if (easy) {
        cleanupGimmick(canvas, mgRef.current);
      } else {
        if (mgRef.current.alarmInterval) clearInterval(mgRef.current.alarmInterval);
        if (mgRef.current.boltInterval) clearInterval(mgRef.current.boltInterval);
        canvas.onclick = null; canvas.onmousemove = null;
      }
    };
  }, [visible, room]);

  useEffect(() => {
    if (!visible || gs.difficulty === 'easy') return;
    function onKey(e) {
      const n = parseInt(e.key);
      if (n >= 1 && n <= TOOLS.length) {
        const idx = n - 1;
        const next = selectedTool === idx ? null : idx;
        setSelectedTool(next);
        mgRef.current.curTool = next !== null ? TOOLS[next] : null;
        if (canvasRef.current) canvasRef.current.style.cursor = next !== null ? 'crosshair' : 'default';
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, selectedTool]);

  if (!visible || !room) return null;

  const easy = gs.difficulty === 'easy';
  const gimmickMeta = easy && room.gimmick ? GIMMICK_META[room.gimmick] : null;

  return (
    <div id="screen-mg" className="on" style={{ display: 'flex' }}>
      <div id="mg-hint">
        <div id="mg-hint-hdr">⚠ ALIEN SIGNAL</div>
        {easy ? (
          <>
            {gimmickMeta && (
              <div style={{ padding: '6px 10px', fontSize: '10px', letterSpacing: '2px', color: '#00f5ff', textAlign: 'center' }}>
                {gimmickMeta.trait}
              </div>
            )}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <canvas
                ref={alienCanvasRef}
                style={{ display: 'block', width: '100%', height: '100%' }}
              />
            </div>
            {gimmickMeta && (
              isMobile ? (
                <div
                  onClick={() => setHintOpen(v => !v)}
                  style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `1px solid ${hintOpen ? 'rgba(0,245,255,0.25)' : 'rgba(255,107,0,0.3)'}`, borderRadius: '2px', padding: '4px 6px', minWidth: 52, overflow: 'hidden', flexShrink: 0 }}
                >
                  {hintOpen
                    ? <span style={{ fontSize: '9px', letterSpacing: '2px', color: 'rgba(0,245,255,0.55)', writingMode: 'vertical-lr', userSelect: 'none' }}>HINT</span>
                    : <span style={{ fontSize: '8px', color: '#7ab', lineHeight: '1.35', whiteSpace: 'pre-line', overflow: 'hidden' }}>{t.gimmickDesc[room.gimmick] ?? gimmickMeta.traitDesc}</span>
                  }
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setHintOpen(v => !v)}
                    style={{ fontSize: '10px', letterSpacing: '2px', color: hintOpen ? '#00f5ff' : '#ff6b00', background: 'none', border: `1px solid ${hintOpen ? 'rgba(0,245,255,0.4)' : 'rgba(255,107,0,0.4)'}`, padding: '5px 14px', cursor: 'pointer', borderRadius: '2px', width: '100%' }}
                  >
                    {hintOpen ? '▲ HINT' : '▼ HINT'}
                  </button>
                  {hintOpen && (
                    <div className="mg-sigbox" style={{ whiteSpace: 'pre-line', fontSize: '10px', color: '#7ab', padding: '8px 10px', lineHeight: '1.6' }}>
                      {t.gimmickDesc[room.gimmick] ?? gimmickMeta.traitDesc}
                    </div>
                  )}
                </>
              )
            )}
          </>
        ) : (
          <>
            <div id="mg-gest" dangerouslySetInnerHTML={{ __html: GESTURE_SVGS[room.id] || '' }} />
            <div className="mg-sigbox">
              <div className="mg-siglbl">SIGNAL LOG</div>
              <div id="mg-glyphs" dangerouslySetInnerHTML={{ __html: GESTURE_GLYPHS[room.id] || '' }} />
            </div>
          </>
        )}
      </div>
      <div id="mg-right">
        <div id="mg-hud">
          <span className="hl">LIVES</span>
          <div className="mg-hearts">
            {[0, 1, 2].map(i => <span key={i}>{i < gs.lives ? '❤️' : '🖤'}</span>)}
          </div>
          <span className="hl">SCORE</span>
          <span className="hv">{gs.score}</span>
          <span id="mg-rname">{room.name}</span>
          <button id="mg-back" onClick={() => { stopSounds(); onExit(); }}>← MAP</button>
        </div>
        <div id="mg-view" style={{ backgroundImage: `url(${gameBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <canvas ref={canvasRef} id="mg-canvas" style={{ display: 'block', width: '100%', height: '100%' }} />
          <div id="mg-feedback" style={{ opacity: feedback.show ? 1 : 0, color: feedback.color }}>
            {feedback.msg}
          </div>
          {isMobile && !easy && room?.id === 'monster_fight' && (
            <div id="mg-move-btns">
              <button
                onPointerDown={e => { e.preventDefault(); gs.keys['ArrowUp'] = true; }}
                onPointerUp={() => { gs.keys['ArrowUp'] = false; }}
                onPointerLeave={() => { gs.keys['ArrowUp'] = false; }}
              >▲</button>
              <button
                onPointerDown={e => { e.preventDefault(); gs.keys['ArrowDown'] = true; }}
                onPointerUp={() => { gs.keys['ArrowDown'] = false; }}
                onPointerLeave={() => { gs.keys['ArrowDown'] = false; }}
              >▼</button>
            </div>
          )}
        </div>
        {!easy && (
          <div id="mg-tools">
            <div id="mg-tlbl">{isMobile ? 'TOOL' : 'TOOL [1~0]'}</div>
            <div id="mg-tbox">
              {TOOLS.map((tool, i) => (
                <button
                  key={tool.id}
                  className={`tl-btn${selectedTool === i ? ' sel' : ''}`}
                  onClick={() => selTool(i)}
                >
                  <span className="ti">{tool.emoji}</span>
                  {!isMobile && (i < 9 ? `[${i + 1}] ` : '[0] ')}{t.tools[tool.id] ?? tool.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
