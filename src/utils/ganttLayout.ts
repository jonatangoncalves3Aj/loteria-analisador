import { eachDayOfInterval, startOfMonth, isSameMonth, format } from 'date-fns';
import { addDays, isWeekend } from './dateUtils';

export const ROW_HEIGHT = 40;
export const HEADER_HEIGHT = 72;
export const PIXELS_PER_DAY: Record<'day' | 'week' | 'month', number> = {
  day: 40,
  week: 14,
  month: 4,
};

export function dateToPixel(date: Date, projectStart: Date, pixelsPerDay: number): number {
  const diff = (date.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
  return diff * pixelsPerDay;
}

export function pixelToDate(x: number, projectStart: Date, pixelsPerDay: number): Date {
  const days = Math.round(x / pixelsPerDay);
  return addDays(projectStart, days);
}

export function rowToY(rowIndex: number): number {
  return rowIndex * ROW_HEIGHT;
}

export interface TimelineCell {
  label: string;
  x: number;
  width: number;
  date: Date;
}

export interface TimelineHeader {
  top: TimelineCell[];
  bottom: TimelineCell[];
}

export function getTimelineHeaders(
  start: Date,
  end: Date,
  zoom: 'day' | 'week' | 'month',
  ppd: number
): TimelineHeader {
  const days = eachDayOfInterval({ start, end });

  if (zoom === 'day') {
    // Top: months, Bottom: days
    const months: TimelineCell[] = [];
    let monthStart = startOfMonth(start);
    while (monthStart <= end) {
      const x = dateToPixel(monthStart < start ? start : monthStart, start, ppd);
      const nextMonth = startOfMonth(addDays(monthStart, 32));
      const monthEnd = nextMonth > end ? end : addDays(nextMonth, -1);
      const width = dateToPixel(addDays(monthEnd, 1), start, ppd) - x;
      months.push({ label: format(monthStart, 'MMMM yyyy'), x, width, date: monthStart });
      monthStart = nextMonth;
    }
    const daysCells: TimelineCell[] = days.map((d) => ({
      label: format(d, 'd'),
      x: dateToPixel(d, start, ppd),
      width: ppd,
      date: d,
    }));
    return { top: months, bottom: daysCells };
  }

  if (zoom === 'week') {
    // Top: months, Bottom: weeks (Mon label)
    const months: TimelineCell[] = [];
    let monthStart = startOfMonth(start);
    while (monthStart <= end) {
      const x = dateToPixel(monthStart < start ? start : monthStart, start, ppd);
      const nextMonth = startOfMonth(addDays(monthStart, 32));
      const monthEnd = nextMonth > end ? end : addDays(nextMonth, -1);
      const width = dateToPixel(addDays(monthEnd, 1), start, ppd) - x;
      months.push({ label: format(monthStart, 'MMM yyyy'), x, width, date: monthStart });
      monthStart = nextMonth;
    }

    // Group days into weeks
    const weeks: TimelineCell[] = [];
    let i = 0;
    while (i < days.length) {
      const weekStart = days[i];
      const weekDays: Date[] = [];
      while (i < days.length && weekDays.length < 7) {
        weekDays.push(days[i]);
        i++;
      }
      const x = dateToPixel(weekStart, start, ppd);
      const width = weekDays.length * ppd;
      weeks.push({ label: format(weekStart, 'dd/MM'), x, width, date: weekStart });
    }
    return { top: months, bottom: weeks };
  }

  // month zoom: Top: quarters/year, Bottom: months
  const yearCells: TimelineCell[] = [];
  let currentYear = start.getFullYear();
  const endYear = end.getFullYear();
  while (currentYear <= endYear) {
    const yearDate = new Date(currentYear, 0, 1);
    const x = dateToPixel(yearDate < start ? start : yearDate, start, ppd);
    const yearEnd = new Date(currentYear, 11, 31);
    const width = dateToPixel(yearEnd > end ? end : yearEnd, start, ppd) - x + ppd;
    yearCells.push({ label: String(currentYear), x, width, date: yearDate });
    currentYear++;
  }

  const monthCells: TimelineCell[] = [];
  let ms = startOfMonth(start);
  while (ms <= end) {
    const x = dateToPixel(ms < start ? start : ms, start, ppd);
    const nextMs = startOfMonth(addDays(ms, 32));
    const me = nextMs > end ? end : addDays(nextMs, -1);
    const width = Math.max(ppd, dateToPixel(addDays(me, 1), start, ppd) - x);
    monthCells.push({ label: format(ms, 'MMM'), x, width, date: ms });
    ms = nextMs;
  }
  return { top: yearCells, bottom: monthCells };
}

export function getTotalWidth(start: Date, end: Date, ppd: number): number {
  const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
  return days * ppd;
}

export function isWeekendDay(date: Date): boolean {
  return isWeekend(date);
}
