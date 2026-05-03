import type { Combination, GameConfig } from '../types';

interface Props {
  combination: Combination;
  index: number;
  game: GameConfig;
}

export function CombinationCard({ combination, index, game }: Props) {
  const scoreColor =
    combination.score >= 80
      ? 'text-green-600'
      : combination.score >= 60
      ? 'text-amber-600'
      : 'text-red-500';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-500">Combinação #{index + 1}</span>
        <div className="flex items-center gap-1.5">
          <ScoreArc score={combination.score} />
          <span className={`text-sm font-bold ${scoreColor}`}>{combination.score} pts</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {game.isSuperSete
          ? combination.numbers.map((n, col) => (
              <SuperSeteCell key={col} column={col + 1} digit={n} bgColor={game.bgColor} />
            ))
          : combination.numbers.map((n) => (
              <NumberBall key={n} number={n} bgColor={game.bgColor} />
            ))}
      </div>

      <p className="text-xs text-gray-400">{combination.rationale}</p>
    </div>
  );
}

function NumberBall({ number, bgColor }: { number: number; bgColor: string }) {
  return (
    <span
      className={`${bgColor} text-white w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm`}
    >
      {number.toString().padStart(2, '0')}
    </span>
  );
}

function SuperSeteCell({ column, digit, bgColor }: { column: number; digit: number; bgColor: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-gray-400">C{column}</span>
      <span
        className={`${bgColor} text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm`}
      >
        {digit}
      </span>
    </div>
  );
}

function ScoreArc({ score }: { score: number }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#ef4444';
  const r = 10;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
      <circle
        cx="14"
        cy="14"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 14 14)"
      />
    </svg>
  );
}
