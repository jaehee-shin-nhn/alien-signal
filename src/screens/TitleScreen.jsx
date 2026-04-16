import { useEffect, useState } from 'react';
import { useLang } from '../LangContext';
import { LANG } from '../i18n';
import titleBg from '../assets/title.png';
import startBg from '../assets/start.png';

export default function TitleScreen({ onStart }) {
  const [difficulty, setDifficulty] = useState(null);
  const [uiReady, setUiReady] = useState(false);
  const { lang, setLang, t } = useLang();

  useEffect(() => {
    const timer = setTimeout(() => setUiReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (difficulty === null) {
    return (
      <div id="screen-title" style={{ backgroundImage: `url(${titleBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {uiReady && (
          <>
            <div className="t-logo" style={{ position: 'relative', zIndex: 1, animation: 'fadeUp .8s both' }}>
              ALIEN<br />SIGNAL
            </div>
            <div className="t-sub" style={{ position: 'relative', zIndex: 1, animation: 'fadeUp .8s .2s both' }}>
              {t.tagline}
            </div>
            <div className="t-story" style={{ position: 'relative', zIndex: 1, animation: 'fadeUp .8s .4s both' }}>
              {t.story[0]}<br />
              {t.story[1]}<strong>{t.story[2]}</strong>{t.story[3]}<br />
              {t.story[4]}
            </div>
            <div style={{ position: 'relative', zIndex: 1, marginTop: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', animation: 'fadeUp .8s .6s both' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                {[LANG.KO, LANG.JA].map(l => (
                  <button key={l} onClick={() => setLang(l)} style={{
                    background: 'none', border: `1px solid ${lang === l ? '#00f5ff' : 'rgba(255,255,255,.15)'}`,
                    color: lang === l ? '#00f5ff' : '#4a6a8a', padding: '4px 12px', cursor: 'pointer',
                    fontSize: '11px', letterSpacing: '2px', borderRadius: '2px',
                  }}>{l === LANG.KO ? 'KO' : 'JA'}</button>
                ))}
              </div>
              <div style={{ fontSize: '10px', letterSpacing: '3px', color: '#2a4060', marginBottom: '4px' }}>DIFFICULTY</div>
              <div style={{ display: 'flex', gap: '14px' }}>
                <button
                  className="btn-start"
                  style={{ marginTop: 0, background: '#39ff14', boxShadow: '0 0 40px rgba(57,255,20,.5)', animation: 'none' }}
                  onClick={() => setDifficulty('easy')}
                >▶ EASY</button>
                <button
                  className="btn-start"
                  style={{ marginTop: 0, background: '#ff4400', boxShadow: '0 0 40px rgba(255,68,0,.5)', animation: 'none' }}
                  onClick={() => setDifficulty('hard')}
                >▶ HARD</button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  const isEasy = difficulty === 'easy';
  return (
    <div id="screen-title" style={{ backgroundImage: `url(${startBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="t-logo" style={{ position: 'relative', zIndex: 1 }}>ALIEN<br />SIGNAL</div>
      <div style={{ position: 'relative', zIndex: 1, fontSize: '12px', letterSpacing: '4px', color: isEasy ? '#39ff14' : '#ff4400', marginTop: '10px', animation: 'fadeUp .8s .3s both' }}>
        ◆ {isEasy ? 'EASY' : 'HARD'} MODE
      </div>
      <div className="t-story" style={{ position: 'relative', zIndex: 1, marginTop: '18px' }}>
        {isEasy
          ? <>{t.easyDesc[0]}<strong>{t.easyDesc[1]}</strong>{t.easyDesc[2]}<br />{t.easyDesc[3]}</>
          : <>{t.hardDesc[0]}<strong>{t.hardDesc[1]}</strong>{t.hardDesc[2]}<br />{t.hardDesc[3]}</>
        }
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '12px', marginTop: '28px' }}>
        <button
          className="btn-start"
          style={{ marginTop: 0, background: isEasy ? '#39ff14' : '#ff4400', boxShadow: `0 0 40px ${isEasy ? 'rgba(57,255,20,.5)' : 'rgba(255,68,0,.5)'}` }}
          onClick={() => onStart(difficulty)}
        >▶ START</button>
        <button
          onClick={() => setDifficulty(null)}
          style={{ marginTop: 0, background: 'none', border: '1px solid rgba(255,255,255,.15)', color: '#4a6a8a', padding: '14px 24px', cursor: 'pointer', borderRadius: '2px', fontSize: '13px', letterSpacing: '2px' }}
        >← BACK</button>
      </div>
    </div>
  );
}
