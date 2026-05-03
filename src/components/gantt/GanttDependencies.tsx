import React from 'react';
import { useTaskStore } from '../../store';
import { GanttDependencyArrow } from './GanttDependencyArrow';
import { dateToPixel, ROW_HEIGHT, PIXELS_PER_DAY } from '../../utils/ganttLayout';
import type { ZoomLevel } from '../../store';
import type { Task, TaskGroup } from '../../types';

interface GanttDependenciesProps {
  projectStart: Date;
  zoom: ZoomLevel;
  visibleTasks: Task[];
  criticalIds: Set<string>;
  totalWidth: number;
  totalHeight: number;
}

const BAR_HEIGHT = 22;

export function GanttDependencies({ projectStart, zoom, visibleTasks, criticalIds, totalWidth, totalHeight }: GanttDependenciesProps) {
  const dependencies = useTaskStore((s) => s.dependencies);
  const ppd = PIXELS_PER_DAY[zoom];

  const taskIndexMap = new Map(visibleTasks.map((t, i) => [t.id, i]));

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      width={totalWidth}
      height={totalHeight}
    >
      {dependencies.map((dep) => {
        const predIdx = taskIndexMap.get(dep.predecessorId);
        const succIdx = taskIndexMap.get(dep.successorId);
        if (predIdx === undefined || succIdx === undefined) return null;

        const pred = visibleTasks[predIdx];
        const succ = visibleTasks[succIdx];

        const x1 = dateToPixel(pred.endDate, projectStart, ppd) + ppd;
        const y1 = predIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
        const x2 = dateToPixel(succ.startDate, projectStart, ppd);
        const y2 = succIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

        const isCritical = criticalIds.has(dep.predecessorId) && criticalIds.has(dep.successorId);

        return (
          <GanttDependencyArrow
            key={dep.id}
            id={dep.id}
            x1={x1} y1={y1}
            x2={x2} y2={y2}
            isCritical={isCritical}
          />
        );
      })}
    </svg>
  );
}
