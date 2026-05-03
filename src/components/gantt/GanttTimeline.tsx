import React from 'react';
import { HEADER_HEIGHT, PIXELS_PER_DAY, getTimelineHeaders } from '../../utils/ganttLayout';
import { addDays } from '../../utils/dateUtils';
import type { ZoomLevel } from '../../store';

interface GanttTimelineProps {
  projectStart: Date;
  projectEnd: Date;
  zoom: ZoomLevel;
}

export function GanttTimeline({ projectStart, projectEnd, zoom }: GanttTimelineProps) {
  const ppd = PIXELS_PER_DAY[zoom];
  const { top, bottom } = getTimelineHeaders(projectStart, projectEnd, zoom, ppd);

  return (
    <div className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 select-none" style={{ height: HEADER_HEIGHT }}>
      {/* Top row */}
      <div className="relative border-b border-slate-200" style={{ height: HEADER_HEIGHT / 2 }}>
        {top.map((cell, i) => (
          <div
            key={i}
            className="absolute inset-y-0 flex items-center justify-start px-2 text-xs font-semibold text-slate-600 border-r border-slate-200 overflow-hidden"
            style={{ left: cell.x, width: cell.width }}
          >
            {cell.label}
          </div>
        ))}
      </div>
      {/* Bottom row */}
      <div className="relative" style={{ height: HEADER_HEIGHT / 2 }}>
        {bottom.map((cell, i) => (
          <div
            key={i}
            className="absolute inset-y-0 flex items-center justify-center text-xs text-slate-500 border-r border-slate-200 overflow-hidden"
            style={{ left: cell.x, width: Math.max(1, cell.width) }}
          >
            {cell.width >= 12 ? cell.label : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
