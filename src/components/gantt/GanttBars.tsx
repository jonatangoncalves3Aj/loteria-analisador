import React from 'react';
import { GanttBar } from './GanttBar';
import { ROW_HEIGHT, PIXELS_PER_DAY } from '../../utils/ganttLayout';
import type { Task, TaskGroup } from '../../types';
import type { ZoomLevel } from '../../store';

interface GanttBarsProps {
  visibleTasks: Task[];
  isCritical: (id: string) => boolean;
  projectStart: Date;
  zoom: ZoomLevel;
  onBarPointerDown: (e: React.PointerEvent, id: string, start: Date, end: Date) => void;
  onResizeLeftPointerDown: (e: React.PointerEvent, id: string, start: Date, end: Date) => void;
  onResizeRightPointerDown: (e: React.PointerEvent, id: string, start: Date, end: Date) => void;
  getDragOffset: (id: string) => { dx: number; dw: number };
}

export function GanttBars({
  visibleTasks, isCritical, projectStart, zoom,
  onBarPointerDown, onResizeLeftPointerDown, onResizeRightPointerDown, getDragOffset,
}: GanttBarsProps) {
  return (
    <div className="absolute inset-0">
      {visibleTasks.map((task, i) => (
        <GanttBar
          key={task.id}
          task={task}
          rowIndex={i}
          isCritical={isCritical(task.id)}
          projectStart={projectStart}
          zoom={zoom}
          onBarPointerDown={onBarPointerDown}
          onResizeLeftPointerDown={onResizeLeftPointerDown}
          onResizeRightPointerDown={onResizeRightPointerDown}
          getDragOffset={getDragOffset}
        />
      ))}
    </div>
  );
}
