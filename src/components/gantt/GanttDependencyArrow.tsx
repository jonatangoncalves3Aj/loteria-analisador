import React from 'react';

interface GanttDependencyArrowProps {
  x1: number; y1: number;
  x2: number; y2: number;
  isCritical: boolean;
  id: string;
}

export function GanttDependencyArrow({ x1, y1, x2, y2, isCritical, id }: GanttDependencyArrowProps) {
  const color = isCritical ? '#ef4444' : '#94a3b8';
  const markerId = `arrow-${id}`;

  // Route: right from x1, then vertical to y2, then right to x2
  const midX = x1 + Math.max(20, (x2 - x1) / 2);
  const d = x2 > x1
    ? `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`
    : `M ${x1} ${y1} H ${x1 + 10} V ${y2 - 10} H ${x2 - 10} V ${y2} H ${x2}`;

  return (
    <g>
      <defs>
        <marker id={markerId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 Z" fill={color} />
        </marker>
      </defs>
      <path
        d={d}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        markerEnd={`url(#${markerId})`}
        opacity={0.8}
      />
    </g>
  );
}
