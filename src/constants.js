export const TS = 40, MW = 64, MH = 48;
export const WALL = 0, FLOOR = 1;

export const TOOLS = [
  { id: 'wrench',       name: '렌치',   emoji: '🔧' },
  { id: 'oil',          name: '오일',   emoji: '🛢️' },
  { id: 'pesticide',    name: '해충제', emoji: '🪲' },
  { id: 'extinguisher', name: '소화기', emoji: '🧯' },
  { id: 'coolant',      name: '냉각제', emoji: '❄️' },
  { id: 'zapper',       name: '재퍼',   emoji: '⚡' },
];

export const ROOMS = [
  { id: 'bolt_loose', name: 'BRIDGE',    color: '#080800', border: '#555500', light: '#ffbb00',
    rx: 3,  ry: 20, rw: 10, rh: 8, doorTx: 13, doorTy: 24, alienTx: 14, alienTy: 24 },
  { id: 'bug_hunt',   name: 'STORAGE',   color: '#001510', border: '#006644', light: '#00cc88',
    rx: 50, ry: 20, rw: 11, rh: 8, doorTx: 49, doorTy: 24, alienTx: 48, alienTy: 24 },
  { id: 'fire_out',   name: 'CARGO BAY', color: '#180400', border: '#771100', light: '#ff2200',
    rx: 3,  ry: 36, rw: 10, rh: 8, doorTx: 13, doorTy: 40, alienTx: 14, alienTy: 40 },
  { id: 'monster_fight', name: 'ENGINE ROOM', color: '#000a18', border: '#002266', light: '#0066ff',
    rx: 50, ry: 36, rw: 10, rh: 8, doorTx: 49, doorTy: 40, alienTx: 48, alienTy: 40 },
];

export const START = { rx: 27, ry: 20, rw: 10, rh: 8 };

export const ALL_GIMMICKS = [
  'color_btn', 'run_jump', 'glow_hold', 'symbol_body',
  'direction_arrow', 'dial_tilt', 'wire_connect', 'valve_spin',
];

export const GIMMICK_META = {
  color_btn:       { trait: 'COLOR FLASHER',    traitDesc: '몸이 빨간색/초록색으로 깜빡인다\nON/OFF 버튼으로 순서대로 맞춰라!' },
  run_jump:        { trait: 'SCREAMING ALARM',   traitDesc: '외계인이 소리치면 장애물이 온다\nSPACE / 클릭으로 점프하라!' },
  glow_hold:       { trait: 'GLOW EMITTER',      traitDesc: '외계인이 빛날 때 버튼을 꾹 눌러\n게이지를 완전히 채워라!' },
  symbol_body:     { trait: 'SYMBOL MORPH',      traitDesc: '외계인 몸에 나타난 기호를 보고\n같은 것을 선택하라!' },
  direction_arrow: { trait: 'DIRECTION POINTER', traitDesc: '외계인이 기울어진 방향의\n화살표를 눌러라!' },
  dial_tilt:       { trait: 'COLOR SYNC',         traitDesc: '머리 색은 고정, 슬라이더로 몸 색을 맞춰라!\n일치하면 SUBMIT을 눌러라!' },
  wire_connect:    { trait: 'COLOR GUIDE',       traitDesc: '와이어 선택 시 외계인 얼굴에\n색이 나타난다. 맞는 포트에 연결하라!' },
  valve_spin:      { trait: 'SPIN TRACKER',      traitDesc: '외계인이 도는 방향으로\n밸브를 2바퀴 돌려라!' },
};

export function pickGimmicks() {
  const a = [...ALL_GIMMICKS];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, 4);
}

export const DLGDATA = {
  bolt_loose: { face: '🟡', name: 'KRIX  /  항법담당',  sub: '[볼트를 가리키며 뭔가 고장났음을 알리고 있다]' },
  bug_hunt:   { face: '🟣', name: 'VRIX  /  환기담당',  sub: '[뭔가 작은 것을 손으로 잡는 시늉을 하고 있다]' },
  fire_out:   { face: '🟠', name: 'FLARE  /  화물담당', sub: '[불길을 피하며 다급하게 신호를 보내고 있다]' },
  monster_fight: { face: '🔵', name: 'ZRIX  /  엔진담당', sub: '[특정 무기를 집으며 저쪽을 가리키고 있다]' },
};
