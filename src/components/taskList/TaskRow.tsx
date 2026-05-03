import React, { useState, useRef } from 'react';
import { useTaskStore, useUIStore } from '../../store';
import { formatDate, toInputDate, fromInputDate } from '../../utils/dateUtils';
import { ProgressBar } from '../ui/ProgressBar';
import type { Task } from '../../types';

interface TaskRowProps {
  task: Task;
  depth: number;
  isCritical: boolean;
  onOpenEdit: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

export function TaskRow({ task, depth, isCritical, onOpenEdit, onContextMenu }: TaskRowProps) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const selectedTaskId = useUIStore((s) => s.selectedTaskId);
  const setSelectedTask = useUIStore((s) => s.setSelectedTask);

  const [editingField, setEditingField] = useState<string | null>(null);
  const isSelected = selectedTaskId === task.id;

  const handleClick = () => setSelectedTask(task.id);
  const handleDoubleClick = () => onOpenEdit(task.id);

  const InlineText = ({ field, value, className = '' }: { field: string; value: string; className?: string }) => {
    const [draft, setDraft] = useState(value);
    if (editingField === field) {
      return (
        <input
          autoFocus
          className="w-full rounded border border-blue-300 bg-white px-1 text-sm outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            updateTask(task.id, { [field]: draft });
            setEditingField(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { updateTask(task.id, { [field]: draft }); setEditingField(null); }
            if (e.key === 'Escape') setEditingField(null);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    return (
      <span className={`truncate cursor-text ${className}`} onDoubleClick={(e) => { e.stopPropagation(); setEditingField(field); }}>
        {value || <span className="text-slate-300">—</span>}
      </span>
    );
  };

  const InlineDate = ({ field, value }: { field: string; value: Date }) => {
    if (editingField === field) {
      return (
        <input
          type="date"
          autoFocus
          className="w-full rounded border border-blue-300 bg-white px-1 text-xs outline-none"
          defaultValue={toInputDate(value)}
          onBlur={(e) => {
            if (e.target.value) updateTask(task.id, { [field]: fromInputDate(e.target.value) });
            setEditingField(null);
          }}
          onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') setEditingField(null); }}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    return (
      <span className="text-xs cursor-text" onDoubleClick={(e) => { e.stopPropagation(); setEditingField(field); }}>
        {formatDate(value, 'dd/MM')}
      </span>
    );
  };

  const InlineNumber = ({ field, value, min = 0, max = 999 }: { field: string; value: number; min?: number; max?: number }) => {
    const [draft, setDraft] = useState(String(value));
    if (editingField === field) {
      return (
        <input
          autoFocus
          type="number"
          min={min}
          max={max}
          className="w-full rounded border border-blue-300 bg-white px-1 text-xs outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            const n = Number(draft);
            if (!isNaN(n)) updateTask(task.id, { [field]: Math.min(max, Math.max(min, n)) });
            setEditingField(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { const n = Number(draft); if (!isNaN(n)) updateTask(task.id, { [field]: n }); setEditingField(null); }
            if (e.key === 'Escape') setEditingField(null);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    return (
      <span className="text-xs cursor-text" onDoubleClick={(e) => { e.stopPropagation(); setEditingField(field); }}>
        {value}
      </span>
    );
  };

  return (
    <div
      className={`flex items-center border-b border-slate-100 cursor-pointer select-none transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'} ${isCritical ? 'border-l-2 border-l-red-400' : ''}`}
      style={{ height: 40 }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, task.id); }}
    >
      <div className="flex flex-1 items-center gap-1 overflow-hidden px-2" style={{ paddingLeft: 8 + depth * 20 }}>
        {task.isMilestone && <span className="text-purple-500 font-bold text-xs">◆</span>}
        <InlineText field="name" value={task.name} className="flex-1" />
      </div>
      <div className="w-24 px-1">
        <InlineDate field="startDate" value={task.startDate} />
      </div>
      <div className="w-24 px-1">
        <InlineDate field="endDate" value={task.endDate} />
      </div>
      <div className="w-14 px-1 text-center">
        {task.isMilestone ? (
          <span className="text-xs text-slate-400">—</span>
        ) : (
          <InlineNumber field="durationDays" value={task.durationDays} min={1} />
        )}
      </div>
      <div className="w-14 px-1">
        <div className="flex flex-col gap-0.5">
          <InlineNumber field="progress" value={task.progress} min={0} max={100} />
          <ProgressBar value={task.progress} color={isCritical ? '#ef4444' : '#3b82f6'} />
        </div>
      </div>
    </div>
  );
}
