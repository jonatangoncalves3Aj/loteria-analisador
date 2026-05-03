import type { TaskId } from '../types';
import type { Dependency } from '../types';

export function buildSuccessorMap(deps: Dependency[]): Map<TaskId, TaskId[]> {
  const map = new Map<TaskId, TaskId[]>();
  for (const dep of deps) {
    if (!map.has(dep.predecessorId)) map.set(dep.predecessorId, []);
    map.get(dep.predecessorId)!.push(dep.successorId);
  }
  return map;
}

export function buildPredecessorMap(deps: Dependency[]): Map<TaskId, TaskId[]> {
  const map = new Map<TaskId, TaskId[]>();
  for (const dep of deps) {
    if (!map.has(dep.successorId)) map.set(dep.successorId, []);
    map.get(dep.successorId)!.push(dep.predecessorId);
  }
  return map;
}

export function topologicalSort(taskIds: TaskId[], deps: Dependency[]): TaskId[] {
  const predMap = buildPredecessorMap(deps);
  const inDegree = new Map<TaskId, number>();
  for (const id of taskIds) inDegree.set(id, 0);
  for (const dep of deps) {
    if (inDegree.has(dep.successorId)) {
      inDegree.set(dep.successorId, (inDegree.get(dep.successorId) ?? 0) + 1);
    }
  }

  const queue = taskIds.filter((id) => (inDegree.get(id) ?? 0) === 0);
  const result: TaskId[] = [];
  const succMap = buildSuccessorMap(deps);

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    for (const succ of succMap.get(node) ?? []) {
      const newDeg = (inDegree.get(succ) ?? 1) - 1;
      inDegree.set(succ, newDeg);
      if (newDeg === 0) queue.push(succ);
    }
  }

  return result;
}

export function detectCycle(taskIds: TaskId[], deps: Dependency[]): boolean {
  const sorted = topologicalSort(taskIds, deps);
  return sorted.length !== taskIds.length;
}
