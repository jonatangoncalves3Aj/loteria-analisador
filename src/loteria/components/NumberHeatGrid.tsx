import type { NumberStats } from '../types';

interface Props {
  stats: NumberStats[];
  highlightedNumbers?: number[];
}

export function NumberHeatGrid({ stats, highlightedNumbers = [] }: Props) {
  if (stats.length === 0) return null;

  const highlighted = new Set(highlightedNumbers);

  return (
    <div className="flex flex-wrap gap-1">
      {stats.map((s) => (
        <NumberCell key={s.number} stat={s} highlighted={highlighted.has(s.number)} />
      ))}
    </div>
  );
}

function NumberCell({ stat, highlighted }: { stat: NumberStats; highlighted: boolean }) {
  const base =
    stat.temp === 'hot'
      ? 'bg-red-500 text-white'
      : stat.temp === 'cold'
      ? 'bg-blue-400 text-white'
      : 'bg-amber-400 text-white';

  return (
    <div
      title={`Freq: ${stat.frequency} | Atraso: ${stat.delay}`}
      className={`relative w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold cursor-default transition-transform ${base} ${
        highlighted ? 'ring-2 ring-offset-1 ring-gray-800 scale-110' : 'opacity-80 hover:opacity-100 hover:scale-105'
      }`}
    >
      {stat.number.toString().padStart(2, '0')}
    </div>
  );
}
