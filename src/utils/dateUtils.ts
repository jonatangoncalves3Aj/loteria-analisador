import {
  differenceInCalendarDays,
  addDays as dfnsAddDays,
  format,
  isWeekend as dfnsIsWeekend,
  eachDayOfInterval,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameWeek,
} from 'date-fns';

export { eachDayOfInterval, startOfWeek, startOfMonth, endOfMonth, isSameMonth, isSameWeek };

export function daysBetween(a: Date, b: Date): number {
  return differenceInCalendarDays(b, a);
}

export function addDays(date: Date, n: number): Date {
  return dfnsAddDays(date, n);
}

export function formatDate(date: Date, fmt = 'dd/MM/yyyy'): string {
  return format(date, fmt);
}

export function isWeekend(date: Date): boolean {
  return dfnsIsWeekend(date);
}

export function toInputDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function fromInputDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}
