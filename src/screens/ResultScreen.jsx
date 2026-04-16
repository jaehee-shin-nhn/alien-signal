import { useLang } from '../LangContext';

export default function ResultScreen({ score, mistakes, isWin }) {
  const { t } = useLang();
  let badge, rank, flavor;
  if (!isWin) {
    badge = '💀'; rank = 'SIGNAL LOST'; flavor = t.flavorLost;
  } else if (mistakes === 0) {
    badge = '🏆'; rank = 'PERFECT ESCAPE'; flavor = t.flavorPerfect;
  } else if (mistakes <= 3) {
    badge = '🥇'; rank = 'MASTER DECODER'; flavor = t.flavorMaster;
  } else if (mistakes <= 6) {
    badge = '🥈'; rank = 'SIGNAL READER'; flavor = t.flavorSignal;
  } else {
    badge = '🥉'; rank = 'LUCKY ESCAPE'; flavor = t.flavorLucky;
  }

  return (
    <div id="screen-result" style={{ display: 'flex' }}>
      <div className={`res-title ${isWin ? 'win' : 'lose'}`}>{isWin ? t.winTitle : t.loseTitle}</div>
      <div className="res-badge">{badge}</div>
      <div style={{ fontSize: 15, letterSpacing: 4, color: '#ffd700' }}>{rank}</div>
      <div className="res-grid">
        <div className="res-stat"><div className="rs-v">{score}</div><div className="rs-l">SCORE</div></div>
        <div className="res-stat"><div className="rs-v">{mistakes}</div><div className="rs-l">MISTAKES</div></div>
      </div>
      <div className="res-flavor">{flavor}</div>
      <button className="btn-retry" onClick={() => location.reload()}>▶  RETRY</button>
    </div>
  );
}
