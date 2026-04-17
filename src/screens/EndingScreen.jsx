import { useEffect, useRef } from 'react';
import { useLang } from '../LangContext';
import easyEnding from '../assets/EASY_ENDING.png';
import hardEnding from '../assets/HARD_ENDING.png';

const CREATORS = [
  'せき しょうき  (SEKI SHOKI)',
  'おかだ えみ  (OKADA EMI)',
  'そけい みお  (SOKEI MIO)',
  '신재희  (Shin JaeHee)',
  '이수이  (SUYI LEE)',
  '우지훈  (Jihoon Woo)',
];

const CREDITS_I18N = {
  ko: { gameTitle: '탈출 성공！', staffTitle: '제작진', closing: '한일 교류회 재밌었습니다!' },
  ja: { gameTitle: '脱出成功！', staffTitle: 'スタッフ', closing: '한일 교류회 재밌었습니다!' },
};

export default function EndingScreen({ difficulty, onRestart }) {
  const img = difficulty === 'easy' ? easyEnding : hardEnding;
  const { lang } = useLang();
  const c = CREDITS_I18N[lang];

  const wrapRef = useRef(null);
  const rafRef = useRef(null);
  const yRef = useRef(window.innerHeight);
  const holdRef = useRef(false);

  useEffect(() => {
    function animate() {
      const speed = holdRef.current ? 6 : 1.5;
      yRef.current -= speed;
      if (wrapRef.current) {
        wrapRef.current.style.transform = `translateX(-50%) translateY(${yRef.current}px)`;
        // 크레딧이 전부 올라가면 자동으로 타이틀로
        const h = wrapRef.current.offsetHeight;
        if (yRef.current < -(h + 80)) {
          onRestart();
          return;
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      onPointerDown={() => { holdRef.current = true; }}
      onPointerUp={() => { holdRef.current = false; }}
      onPointerLeave={() => { holdRef.current = false; }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundImage: `url(${img})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <div
        ref={wrapRef}
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          transform: `translateX(-50%) translateY(${window.innerHeight}px)`,
          width: 'min(90%, 420px)',
          textAlign: 'center',
          color: '#fff',
          textShadow: '0 2px 12px rgba(0,0,0,0.95), 0 0 24px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
          lineHeight: 1.7,
        }}
      >
        <p style={{ fontSize: '1.7rem', fontWeight: 'bold', margin: '0 0 2.4rem', letterSpacing: '0.04em' }}>
          {c.gameTitle}
        </p>

        <p style={{ fontSize: '0.75rem', color: '#a8d8ff', letterSpacing: '0.2em', margin: '0 0 0.5rem' }}>
          {c.staffTitle}
        </p>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '0.8rem' }}>
          {CREATORS.map((name, i) => (
            <p key={i} style={{ fontSize: '1rem', margin: '0.25rem 0' }}>
              {name}
            </p>
          ))}
        </div>

        <p style={{ marginTop: '3rem', marginBottom: '6rem', fontSize: '1.15rem', fontWeight: 'bold', color: '#fff9b0' }}>
          {c.closing}
        </p>
      </div>
    </div>
  );
}
