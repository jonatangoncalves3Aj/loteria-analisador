import React, { useRef, useEffect, useMemo } from 'react';
import { useTaskStore, useUIStore } from '../../store';
import { useCriticalPath } from '../../hooks/useCriticalPath';
import { useGanttDrag } from '../../hooks/useGanttDrag';
import { useZoom } from '../../hooks/useZoom';
import { GanttTimeline } from './GanttTimeline';
import { GanttGrid } from './GanttGrid';
import { GanttToday } from './GanttToday';
import { GanttBars } from './GanttBars';
import { GanttDependencies } from './GanttDependencies';
import { useProjectStore } from '../../store';
import { PIXELS_PER_DAY, ROW_HEIGHT, HEADER_HEIGHT, getTotalWidth } from '../../utils/ganttLayout';
import { addDays } from '../../utils/dateUtils';
import type { Task, TaskGroup } from '../../types';

interface VisibleRow {
  type: 'task';
  task: Task;
}

function buildVisibleTasks(groups: TaskGroup[], tasks: Task[]): Task[] {
  const result: Task[] = [];
  const collapsed = new Set(groups.filter((g) => g.collapsed).map((g) => g.id));

  function addGroup(group: TaskGroup) {
    if (collapsed.has(group.id)) return;
    const childGroups = groups.filter((g) => g.parentGroupId === group.id);
    for (const cg of childGroups) addGroup(cg);
    const groupTasks = tasks.filter((t) => t.groupId === group.id);
    result.push(...groupTasks);
  }

  const topGroups = groups.filter((g) => g.parentGroupId === null);
  for (const g of topGroups) addGroup(g);
  const topTasks = tasks.filter((t) => t.groupId === null);
  result.push(...topTasks);
  return result;
}

export function GanttPanel() {
  const tasks = useTaskStore((s) => s.tasks);
  const groups = useTaskStore((s) => s.groups);
  const project = useProjectStore((s) => s.project);
  const scrollTop = useUIStore((s) => s.scrollTop);
  const setScrollTop = useUIStore((s) => s.setScrollTop);
  const { zoom, onWheel } = useZoom();

  const criticalIds = useCriticalPath();
  const projectStart = addDays(project.startDate, -3);
  const projectEnd = addDays(project.endDate, 7);
  const ppd = PIXELS_PER_DAY[zoom];
  const totalWidth = getTotalWidth(projectStart, projectEnd, ppd);

  const visibleTasks = useMemo(() => buildVisibleTasks(groups, tasks), [groups, tasks]);
  const totalHeight = visibleTasks.length * ROW_HEIGHT;

  const { onBarPointerDown, onResizeLeftPointerDown, onResizeRightPointerDown, onPointerMove, onPointerUp, getDragOffset } =
    useGanttDrag(projectStart);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isSyncing.current) return;
    if (el.scrollTop !== scrollTop) {
      isSyncing.current = true;
      el.scrollTop = scrollTop;
      requestAnimationFrame(() => { isSyncing.current = false; });
    }
  }, [scrollTop]);

  const handleScroll = () => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    setScrollTop(scrollRef.current?.scrollTop ?? 0);
    requestAnimationFrame(() => { isSyncing.current = false; });
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white" onWheel={onWheel}>
      <div className="overflow-x-auto overflow-y-hidden" style={{ minWidth: 0 }}>
        <div style={{ width: totalWidth }}>
          <GanttTimeline projectStart={projectStart} projectEnd={projectEnd} zoom={zoom} />
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => useUIStore.getState().setSelectedTask(null)}
      >
        <div className="relative" style={{ width: totalWidth, height: totalHeight }}>
          <GanttGrid
            projectStart={projectStart}
            projectEnd={projectEnd}
            zoom={zoom}
            totalRows={visibleTasks.length}
            totalWidth={totalWidth}
          />
          <svg className="absolute inset-0 pointer-events-none overflow-visible" width={totalWidth} height={totalHeight}>
            <GanttToday projectStart={projectStart} zoom={zoom} totalHeight={totalHeight} />
          </svg>
          <GanttBars
            visibleTasks={visibleTasks}
            isCritical={(id) => criticalIds.has(id)}
            projectStart={projectStart}
            zoom={zoom}
            onBarPointerDown={onBarPointerDown}
            onResizeLeftPointerDown={onResizeLeftPointerDown}
            onResizeRightPointerDown={onResizeRightPointerDown}
            getDragOffset={getDragOffset}
          />
          <GanttDependencies
            projectStart={projectStart}
            zoom={zoom}
            visibleTasks={visibleTasks}
            criticalIds={criticalIds}
            totalWidth={totalWidth}
            totalHeight={totalHeight}
          />
        </div>
      </div>
    </div>
  );
}
