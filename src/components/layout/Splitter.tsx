import React, { useCallback, useRef } from 'react';
import { useUIStore } from '../../store';

export function Splitter() {
  const setTaskListWidth = useUIStore((s) => s.setTaskListWidth);
  const dragging = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    setTaskListWidth(Math.max(200, Math.min(700, e.clientX)));
  }, [setTaskListWidth]);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  return (
    <div
      className="w-1 cursor-col-resize bg-slate-200 hover:bg-blue-400 transition-colors flex-shrink-0"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  );
}
