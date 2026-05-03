import React, { useRef, useEffect } from 'react';
import { useTaskStore, useUIStore } from '../../store';
import { useCriticalPath } from '../../hooks/useCriticalPath';
import { TaskListHeader } from './TaskListHeader';
import { TaskGroupRow } from './TaskGroupRow';
import { TaskRow } from './TaskRow';
import type { TaskGroup, Task } from '../../types';

interface TaskListPanelProps {
  onOpenEdit: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

interface RowItem {
  type: 'group' | 'task';
  group?: TaskGroup;
  task?: Task;
  depth: number;
}

function buildRows(groups: TaskGroup[], tasks: Task[], collapsed: Set<string>): RowItem[] {
  const rows: RowItem[] = [];

  function addGroup(group: TaskGroup, depth: number) {
    rows.push({ type: 'group', group, depth });
    if (collapsed.has(group.id)) return;
    // Child groups
    const childGroups = groups.filter((g) => g.parentGroupId === group.id);
    for (const cg of childGroups) addGroup(cg, depth + 1);
    // Tasks in this group
    const groupTasks = tasks.filter((t) => t.groupId === group.id);
    for (const t of groupTasks) rows.push({ type: 'task', task: t, depth: depth + 1 });
  }

  const topGroups = groups.filter((g) => g.parentGroupId === null);
  for (const g of topGroups) addGroup(g, 0);

  // Top-level tasks
  const topTasks = tasks.filter((t) => t.groupId === null);
  for (const t of topTasks) rows.push({ type: 'task', task: t, depth: 0 });

  return rows;
}

export function TaskListPanel({ onOpenEdit, onContextMenu }: TaskListPanelProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const groups = useTaskStore((s) => s.groups);
  const scrollTop = useUIStore((s) => s.scrollTop);
  const setScrollTop = useUIStore((s) => s.setScrollTop);
  const criticalIds = useCriticalPath();

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

  const collapsed = new Set(groups.filter((g) => g.collapsed).map((g) => g.id));
  const rows = buildRows(groups, tasks, collapsed);

  return (
    <div className="flex flex-col border-r border-slate-200 bg-white overflow-hidden">
      <TaskListHeader />
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        onScroll={handleScroll}
      >
        {rows.map((row) =>
          row.type === 'group' && row.group ? (
            <TaskGroupRow key={row.group.id} group={row.group} tasks={tasks} depth={row.depth} />
          ) : row.task ? (
            <TaskRow
              key={row.task.id}
              task={row.task}
              depth={row.depth}
              isCritical={criticalIds.has(row.task.id)}
              onOpenEdit={onOpenEdit}
              onContextMenu={onContextMenu}
            />
          ) : null
        )}
      </div>
    </div>
  );
}
