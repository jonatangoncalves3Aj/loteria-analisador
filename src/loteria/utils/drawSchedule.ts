import type { GameConfig } from '../types';

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function getNextDrawDate(game: GameConfig, fromDate: Date): Date {
  const d = new Date(fromDate);
  d.setHours(0, 0, 0, 0);

  for (let i = 0; i <= 7; i++) {
    if (game.drawDays.includes(d.getDay())) return d;
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export function formatDrawDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function toInputDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function fromInputDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getDrawDaysLabel(game: GameConfig): string {
  return game.drawDays.map((d) => WEEKDAYS_PT[d]).join(', ');
}
