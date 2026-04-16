import { useState, useRef, useEffect } from 'react';
import TitleScreen from './screens/TitleScreen';
import MapScreen from './screens/MapScreen';
import MinigameScreen from './screens/MinigameScreen';
import ResultScreen from './screens/ResultScreen';
import EndingScreen from './screens/EndingScreen';
import { ROOMS, pickGimmicks } from './constants';
import { useLang } from './LangContext';
import { setEngineLang } from './game/minigameEngines';

const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export default function App() {
  const [phase, setPhase] = useState('title');
  const [gameKey, setGameKey] = useState(0);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [, forceUpdate] = useState(0);
  const [flashColor, setFlashColor] = useState(null);
  const { lang } = useLang();

  useEffect(() => { setEngineLang(lang); }, [lang]);

  const gs = useRef({
    lives: 3, score: 0, mistakes: 0,
    clearedRooms: new Set(),
    keys: {},
    mapData: null, doorOpen: {},
    difficulty: 'hard',
    roomGimmicks: {},
  }).current;

  function flash(color) {
    setFlashColor(color);
    setTimeout(() => setFlashColor(null), 110);
  }

  useEffect(() => {
    function onDown(e) {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
      gs.keys[e.key] = true;
      if (phase === 'mg' && e.key === 'Escape') handleExitMG();
    }
    function onUp(e) { gs.keys[e.key] = false; }
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [phase]);

  function handleStart(difficulty) {
    gs.difficulty = difficulty;
    gs.lives = 3;
    gs.score = 0;
    gs.mistakes = 0;
    gs.clearedRooms = new Set();
    gs.mapData = null;
    gs.doorOpen = {};
    if (difficulty === 'easy') {
      const gimmicks = pickGimmicks();
      ROOMS.forEach((room, i) => { gs.roomGimmicks[room.id] = gimmicks[i]; });
    }
    setGameKey(k => k + 1);
    setPhase('map');
  }

  function handleEnterRoom(room) {
    const r = gs.difficulty === 'easy'
      ? { ...room, gimmick: gs.roomGimmicks[room.id] }
      : room;
    setCurrentRoom(r);
    setPhase('mg');
  }

  function handleExitMG(lose = false) {
    setCurrentRoom(null);
    setPhase(lose ? 'result' : 'map');
    forceUpdate(n => n + 1);
  }

  function handleMGSuccess() {
    flash('rgba(57,255,20,0.22)');
    forceUpdate(n => n + 1);
  }

  function handleMGFail() {
    flash('rgba(255,23,68,0.25)');
    forceUpdate(n => n + 1);
  }

  return (
    <>
      {phase === 'title' && <TitleScreen onStart={handleStart} />}

      <MapScreen
        key={gameKey}
        visible={phase === 'map'}
        gs={gs}
        isMobile={isMobile}
        onEnterRoom={handleEnterRoom}
        onWin={() => setPhase('ending')}
      />

      <MinigameScreen
        visible={phase === 'mg'}
        room={currentRoom}
        gs={gs}
        isMobile={isMobile}
        onExit={handleExitMG}
        onSuccess={handleMGSuccess}
        onFail={handleMGFail}
      />

      {phase === 'result' && (
        <ResultScreen
          score={gs.score}
          mistakes={gs.mistakes}
          isWin={gs.clearedRooms.size >= 3}
        />
      )}

      {phase === 'ending' && (
        <EndingScreen
          difficulty={gs.difficulty}
          onRestart={() => setPhase('title')}
        />
      )}

      {flashColor && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 700,
          pointerEvents: 'none', background: flashColor,
        }} />
      )}
    </>
  );
}
