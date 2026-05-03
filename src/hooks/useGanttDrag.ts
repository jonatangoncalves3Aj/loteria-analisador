import { useRef, useState, useCallback } from 'react';
import { useTaskStore } from '../store';
import { useUIStore } from '../store';
import { pixelToDate, PIXELS_PER_DAY } from '../utils/ganttLayout';
import { addDays } from '../utils/dateUtils';
import type { TaskId } from '../types';

type DragMode = 'move' | 'resize-left' | 'resize-right';

interface DragState {
  taskId: TaskId;
  mode: DragMode;
  startX: number;
  originalStart: Date;
  originalEnd: Date;
  deltaX: number;
}

export function useGanttDrag(projectStart: Date) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const zoom = useUIStore((s) => s.zoom);
  const [drag, setDrag] = useState<DragState | null>(null);

  const ppd = PIXELS_PER_DAY[zoom];

  const onBarPointerDown = useCallback(
    (e: React.PointerEvent, taskId: TaskId, startDate: Date, endDate: Date) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.stopPropagation();
      setDrag({
        taskId, mode: 'move',
        startX: e.clientX,
        originalStart: startDate,
        originalEnd: endDate,
        deltaX: 0,
      });
    },
    []
  );

  const onResizeLeftPointerDown = useCallback(
    (e: React.PointerEvent, taskId: TaskId, startDate: Date, endDate: Date) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.stopPropagation();
      setDrag({
        taskId, mode: 'resize-left',
        startX: e.clientX,
        originalStart: startDate,
        originalEnd: endDate,
        deltaX: 0,
      });
    },
    []
  );

  const onResizeRightPointerDown = useCallback(
    (e: React.PointerEvent, taskId: TaskId, startDate: Date, endDate: Date) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.stopPropagation();
      setDrag({
        taskId, mode: 'resize-right',
        startX: e.clientX,
        originalStart: startDate,
        originalEnd: endDate,
        deltaX: 0,
      });
    },
    []
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag) return;
      setDrag((d) => d ? { ...d, deltaX: e.clientX - d.startX } : null);
    },
    [drag]
  );

  const onPointerUp = useCallback(() => {
    if (!drag) return;
    const daysDelta = Math.round(drag.deltaX / ppd);
    const { taskId, mode, originalStart, originalEnd } = drag;

    if (mode === 'move') {
      const newStart = addDays(originalStart, daysDelta);
      const newEnd = addDays(originalEnd, daysDelta);
      updateTask(taskId, { startDate: newStart, endDate: newEnd });
    } else if (mode === 'resize-left') {
      const newStart = addDays(originalStart, daysDelta);
      if (newStart < originalEnd) {
        updateTask(taskId, { startDate: newStart });
      }
    } else if (mode === 'resize-right') {
      const newEnd = addDays(originalEnd, daysDelta);
      if (newEnd > originalStart) {
        updateTask(taskId, { endDate: newEnd });
      }
    }
    setDrag(null);
  }, [drag, ppd, updateTask]);

  const getDragOffset = useCallback(
    (taskId: TaskId): { dx: number; dw: number } => {
      if (!drag || drag.taskId !== taskId) return { dx: 0, dw: 0 };
      const daysDelta = Math.round(drag.deltaX / ppd);
      const px = daysDelta * ppd;
      if (drag.mode === 'move') return { dx: px, dw: 0 };
      if (drag.mode === 'resize-left') return { dx: px, dw: -px };
      if (drag.mode === 'resize-right') return { dx: 0, dw: px };
      return { dx: 0, dw: 0 };
    },
    [drag, ppd]
  );

  return {
    drag,
    onBarPointerDown,
    onResizeLeftPointerDown,
    onResizeRightPointerDown,
    onPointerMove,
    onPointerUp,
    getDragOffset,
  };
}
