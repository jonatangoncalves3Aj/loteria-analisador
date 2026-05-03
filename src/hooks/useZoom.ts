import { useCallback } from 'react';
import { useUIStore } from '../store';
import type { ZoomLevel } from '../store';

const ZOOM_ORDER: ZoomLevel[] = ['day', 'week', 'month'];

export function useZoom() {
  const zoom = useUIStore((s) => s.zoom);
  const setZoom = useUIStore((s) => s.setZoom);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const idx = ZOOM_ORDER.indexOf(zoom);
      if (e.deltaY < 0 && idx > 0) setZoom(ZOOM_ORDER[idx - 1]);
      if (e.deltaY > 0 && idx < ZOOM_ORDER.length - 1) setZoom(ZOOM_ORDER[idx + 1]);
    },
    [zoom, setZoom]
  );

  return { zoom, setZoom, onWheel };
}
