import easyEnding from '../assets/EASY_ENDING.png';
import hardEnding from '../assets/HARD_ENDING.png';

export default function EndingScreen({ difficulty, onRestart }) {
  const img = difficulty === 'easy' ? easyEnding : hardEnding;

  return (
    <div
      onClick={onRestart}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundImage: `url(${img})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        cursor: 'pointer',
      }}
    />
  );
}
