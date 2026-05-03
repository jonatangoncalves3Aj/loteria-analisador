import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useTaskStore } from '../../store';
import type { TaskGroup, Task } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface TaskGroupRowProps {
  group: TaskGroup;
  tasks: Task[];
  depth: number;
}

export function TaskGroupRow({ group, tasks, depth }: TaskGroupRowProps) {
  const toggleGroup = useTaskStore((s) => s.toggleGroup);
  const updateGroup = useTaskStore((s) => s.updateGroup);
  const [editingName, setEditingName] = useState(false);
  const [draft, setDraft] = useState(group.name);

  const groupTasks = tasks.filter((t) => t.groupId === group.id);
  const minStart = groupTasks.length > 0
    ? new Date(Math.min(...groupTasks.map((t) => t.startDate.getTime())))
    : null;
  const maxEnd = groupTasks.length > 0
    ? new Date(Math.max(...groupTasks.map((t) => t.endDate.getTime())))
    : null;
  const totalProgress = groupTasks.length > 0
    ? Math.round(groupTasks.reduce((sum, t) => sum + t.progress, 0) / groupTasks.length)
    : 0;

  return (
    <div
      className="flex items-center border-b border-slate-200 bg-slate-50 font-semibold cursor-pointer select-none hover:bg-slate-100"
      style={{ height: 40 }}
      onClick={() => toggleGroup(group.id)}
    >
      <div className="flex flex-1 items-center gap-1 overflow-hidden px-2" style={{ paddingLeft: 4 + depth * 20 }}>
        <span className="text-slate-400">
          {group.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </span>
        {editingName ? (
          <input
            autoFocus
            className="flex-1 rounded border border-blue-300 bg-white px-1 text-sm font-semibold outline-none"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { updateGroup(group.id, { name: draft }); setEditingName(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { updateGroup(group.id, { name: draft }); setEditingName(false); }
              if (e.key === 'Escape') setEditingName(false);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 truncate text-sm"
            onDoubleClick={(e) => { e.stopPropagation(); setEditingName(true); }}
          >
            {group.name}
          </span>
        )}
      </div>
      <div className="w-24 px-1 text-xs text-slate-500">
        {minStart ? formatDate(minStart, 'dd/MM') : '—'}
      </div>
      <div className="w-24 px-1 text-xs text-slate-500">
        {maxEnd ? formatDate(maxEnd, 'dd/MM') : '—'}
      </div>
      <div className="w-14 px-1 text-center text-xs text-slate-500">
        {groupTasks.length > 0 ? `${groupTasks.reduce((s, t) => s + t.durationDays, 0)}d` : '—'}
      </div>
      <div className="w-14 px-1 text-center text-xs text-slate-500">
        {groupTasks.length > 0 ? `${totalProgress}%` : '—'}
      </div>
    </div>
  );
}
