import { DLGDATA } from '../constants';
import { GESTURE_GLYPHS } from '../gestureData';
import { useLang } from '../LangContext';

export default function DialogScreen({ room, onEnter, onCancel }) {
  const { t } = useLang();
  if (!room) return null;
  const d = DLGDATA[room.id];
  const glyphs = GESTURE_GLYPHS[room.id] || '';

  return (
    <div id="screen-dialog" style={{ display: 'flex' }}>
      <div id="dialog-box">
        <div id="dlg-bar">
          <div id="dlg-face">{d.face}</div>
          <div id="dlg-name">{t.dlgNames[room.id] ?? d.name}</div>
          <div id="dlg-status">● SIGNALING</div>
        </div>
        <div id="dlg-glyphs" dangerouslySetInnerHTML={{ __html: glyphs }} />
        <div id="dlg-sub">{t.dlgSubs[room.id] ?? d.sub}</div>
        <div id="dlg-choices">
          <button className="dlg-btn enter" onClick={onEnter}>{t.enterRoom}</button>
          <button className="dlg-btn" onClick={onCancel}>{t.later}</button>
        </div>
      </div>
    </div>
  );
}
