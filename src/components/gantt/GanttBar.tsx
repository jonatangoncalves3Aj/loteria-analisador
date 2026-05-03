import React from 'react';
import { dateToPixel, ROW_HEIGHT, PIXELS_PER_DAY } from '../../utils/ganttLayout';
import { useUIStore } from '../../store';
import type { Task } from '../../types';
import type { ZoomLevel } from '../../store';

interface GanttBarProps {
  task: Task;
  rowIndex: number;
  isCritical: boolean;
  projectStart: Date;
  zoom: ZoomLevel;
  onBarPointerDown: (e: React.PointerEvent, id: string, start: Date, end: Date) => void;
  onResizeLeftPointerDown: (e: React.PointerEvent, id: string, start: Date, end: Date) => void;
  onResizeRightPointerDown: (e: React.PointerEvent, id: string, start: Date, end: Date) => void;
  getDragOffset: (id: string) => { dx: number; dw: number };
}

const BAR_HEIGHT = 22;
const MILESTONE_SIZE = 14;

export function GanttBar({
  task, rowIndex, isCritical, projectStart, zoom,
  onBarPointerDown, onResizeLeftPointerDown, onResizeRightPointerDown,
  getDragOffset,
}: GanttBarProps) {
  const ppd = PIXELS_PER_DAY[zoom];
  const selectedTaskId = useUIStore((s) => s.selectedTaskId);
  const setSelectedTask = useUIStore((s) => s.setSelectedTask);
  const setEditingTask = useUIStore((s) => s.setEditingTask);

  const isSelected = selectedTaskId === task.id;
  const { dx, dw } = getDragOffset(task.id);

  const rawLeft = dateToPixel(task.startDate, projectStart, ppd);
  const rawWidth = Math.max(ppd, dateToPixel(task.endDate, projectStart, ppd) - rawLeft);
  const left = rawLeft + dx;
  const width = rawWidth + dw;
  const top = rowIndex * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;

  const barColor = isCritical ? '#ef4444' : (task.color ?? '#3b82f6');
  const barColorDark = isCritical ? '#dc2626' : '#2563eb';

  if (task.isMilestone) {
    const cx = rawLeft + dx;
    const cy = rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
    return (
      <div
        className="absolute cursor-pointer"
        style={{ left: cx - MILESTONE_SIZE / 2, top: cy - MILESTONE_SIZE / 2, width: MILESTONE_SIZE, height: MILESTONE_SIZE, transform: 'rotate(45deg)', background: '#8b5cf6', border: isSelected ? '2px solid #7c3aed' : '2px solid #6d28d9', borderRadius: 2 }}
        onClick={(e) => { e.stopPropagation(); setSelectedTask(task.id); }}
        onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task.id); }}
        title={task.name}
      />
    );
  }

  return (
    <div
      className="absolute rounded overflow-hidden select-none group"
      style={{
        left, top, width: Math.max(4, width), height: BAR_HEIGHT,
        backgroundColor: barColor,
        outline: isSelected ? `2px solid ${barColorDark}` : undefined,
        cursor: 'grab',
        zIndex: isSelected ? 10 : undefined,
      }}
      onClick={(e) => { e.stopPropagation(); setSelectedTask(task.id); }}
      onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task.id); }}
      onPointerDown={(e) => onBarPointerDown(e, task.id, task.startDate, task.endDate)}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      title={task.name}
    >
      {/* Progress fill */}
      {task.progress > 0 && (
        <div
          className="absolute inset-y-0 left-0 rounded opacity-40 bg-white"
          style={{ width: `${task.progress}%` }}
        />
      )}
      {/* Label */}
      <span className="absolute inset-0 flex items-center px-1.5 text-xs font-medium text-white truncate pointer-events-none">
        {task.name}
      </span>
      {/* Resize left handle */}
      <div
        className="absolute left-0 inset-y-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-black/20 hover:bg-black/40"
        onPointerDown={(e) => { e.stopPropagation(); onResizeLeftPointerDown(e, task.id, task.startDate, task.endDate); }}
      />
      {/* Resize right handle */}
      <div
        className="absolute right-0 inset-y-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-black/20 hover:bg-black/40"
        onPointerDown={(e) => { e.stopPropagation(); onResizeRightPointerDown(e, task.id, task.startDate, task.endDate); }}
      />
    </div>
  );
}
