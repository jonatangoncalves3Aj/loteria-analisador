import React from 'react';
import { dateToPixel } from '../../utils/ganttLayout';
import type { ZoomLevel } from '../../store';
import { PIXELS_PER_DAY } from '../../utils/ganttLayout';

interface GanttTodayProps {
  projectStart: Date;
  zoom: ZoomLevel;
  totalHeight: number;
}

export function GanttToday({ projectStart, zoom, totalHeight }: GanttTodayProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const x = dateToPixel(today, projectStart, PIXELS_PER_DAY[zoom]);

  return (
    <g>
      <line x1={x} y1={0} x2={x} y2={totalHeight} stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 2" />
      <rect x={x - 16} y={0} width={32} height={14} rx={2} fill="#f59e0b" />
      <text x={x} y={10} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold">Hoje</text>
    </g>
  );
}
