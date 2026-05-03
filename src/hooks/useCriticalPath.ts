import { useMemo } from 'react';
import { useTaskStore } from '../store';
import { computeCriticalPath } from '../utils/criticalPath';
import type { TaskId } from '../types';

export function useCriticalPath(): Set<TaskId> {
  const tasks = useTaskStore((s) => s.tasks);
  const dependencies = useTaskStore((s) => s.dependencies);
  return useMemo(() => computeCriticalPath(tasks, dependencies), [tasks, dependencies]);
}
