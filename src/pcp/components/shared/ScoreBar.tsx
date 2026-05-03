import { semaforoColor } from '../../utils/scoring';

interface Props {
  percentual: number;
  semaforo: 'red' | 'yellow' | 'green';
  showLabel?: boolean;
}

export function ScoreBar({ percentual, semaforo, showLabel = true }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${semaforoColor(semaforo)}`}
          style={{ width: `${percentual}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-semibold text-slate-700 w-10 text-right">
          {percentual}%
        </span>
      )}
    </div>
  );
}
