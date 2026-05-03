import type { ChecklistSection, SectionAnswers, SectionScore } from '../types';

export function calcScore(
  section: ChecklistSection,
  answers: SectionAnswers,
): SectionScore {
  const total = section.items.length;
  const respondidas = section.items.filter(
    item => answers.respostas[item.id] !== null && answers.respostas[item.id] !== undefined,
  ).length;
  const simCount = section.items.filter(item => answers.respostas[item.id] === true).length;
  const percentual = total === 0 ? 0 : Math.round((simCount / total) * 100);
  const semaforo: 'red' | 'yellow' | 'green' =
    percentual <= 40 ? 'red' : percentual <= 70 ? 'yellow' : 'green';

  return {
    sectionId: section.id,
    titulo: section.titulo,
    percentual,
    semaforo,
    respondidas,
    total,
  };
}

export function semaforoColor(semaforo: 'red' | 'yellow' | 'green'): string {
  if (semaforo === 'green') return 'bg-green-500';
  if (semaforo === 'yellow') return 'bg-amber-400';
  return 'bg-red-500';
}

export function semaforoLabel(semaforo: 'red' | 'yellow' | 'green'): string {
  if (semaforo === 'green') return 'Consolidado';
  if (semaforo === 'yellow') return 'Em Desenvolvimento';
  return 'Crítico';
}

export function semaforoTextColor(semaforo: 'red' | 'yellow' | 'green'): string {
  if (semaforo === 'green') return 'text-green-700';
  if (semaforo === 'yellow') return 'text-amber-700';
  return 'text-red-700';
}

export function semaforoBgLight(semaforo: 'red' | 'yellow' | 'green'): string {
  if (semaforo === 'green') return 'bg-green-50 border-green-200';
  if (semaforo === 'yellow') return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}
