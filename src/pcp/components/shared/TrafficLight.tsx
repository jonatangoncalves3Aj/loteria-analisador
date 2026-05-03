import { semaforoColor, semaforoLabel, semaforoTextColor } from '../../utils/scoring';

interface Props {
  semaforo: 'red' | 'yellow' | 'green';
  size?: 'sm' | 'md' | 'lg';
}

export function TrafficLight({ semaforo, size = 'md' }: Props) {
  const dotSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${textSize} ${semaforoTextColor(semaforo)}`}>
      <span className={`${dotSize} rounded-full flex-shrink-0 ${semaforoColor(semaforo)}`} />
      {semaforoLabel(semaforo)}
    </span>
  );
}
