import React from 'react';
import { eachDayOfInterval } from 'date-fns';
import { dateToPixel, PIXELS_PER_DAY, ROW_HEIGHT } from '../../utils/ganttLayout';
import { isWeekend, addDays } from '../../utils/dateUtils';
import type { ZoomLevel } from '../../store';

interface GanttGridProps {
  projectStart: Date;
  projectEnd: Date;
  zoom: ZoomLevel;
  totalRows: number;
  totalWidth: number;
}

export function GanttGrid({ projectStart, projectEnd, zoom, totalRows, totalWidth }: GanttGridProps) {
  const ppd = PIXELS_PER_DAY[zoom];
  const totalHeight = totalRows * ROW_HEIGHT;
  const days = eachDayOfInterval({ start: projectStart, end: projectEnd });

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={totalWidth}
      height={totalHeight}
      style={{ overflow: 'visible' }}
    >
      {/* Weekend shading */}
      {zoom === 'day' && days.map((day, i) => {
        if (!isWeekend(day)) return null;
        const x = dateToPixel(day, projectStart, ppd);
        return (
          <rect key={i} x={x} y={0} width={ppd} height={totalHeight} fill="#f1f5f9" opacity={0.7} />
        );
      })}

      {/* Vertical grid lines */}
      {(zoom === 'day' ? days : zoom === 'week'
        ? days.filter((_, i) => i % 7 === 0)
        : days.filter((d) => d.getDate() === 1)
      ).map((day, i) => {
        const x = dateToPixel(day, projectStart, ppd);
        return <line key={i} x1={x} y1={0} x2={x} y2={totalHeight} stroke="#e2e8f0" strokeWidth={1} />;
      })}

      {/* Horizontal row lines */}
      {Array.from({ length: totalRows }, (_, i) => (
        <line key={i} x1={0} y1={(i + 1) * ROW_HEIGHT} x2={totalWidth} y2={(i + 1) * ROW_HEIGHT} stroke="#f1f5f9" strokeWidth={1} />
      ))}
    </svg>
  );
}
