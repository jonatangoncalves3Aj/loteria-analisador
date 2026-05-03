import type { Task, TaskId, Dependency } from '../types';
import { topologicalSort } from './dependencyUtils';

interface CPMNode {
  es: number; // Earliest Start (days from project start)
  ef: number; // Earliest Finish
  ls: number; // Latest Start
  lf: number; // Latest Finish
  float: number;
}

export function computeCriticalPath(tasks: Task[], deps: Dependency[]): Set<TaskId> {
  if (tasks.length === 0) return new Set();

  const taskIds = tasks.map((t) => t.id);
  const sorted = topologicalSort(taskIds, deps);
  if (sorted.length === 0) return new Set();

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const nodes = new Map<TaskId, CPMNode>();

  // Forward pass
  for (const id of sorted) {
    const task = taskMap.get(id);
    if (!task) continue;
    const preds = deps.filter((d) => d.successorId === id);
    let es = 0;
    for (const dep of preds) {
      const pred = nodes.get(dep.predecessorId);
      if (!pred) continue;
      const finish = dep.type === 'FS'
        ? pred.ef + dep.lagDays
        : dep.type === 'SS'
        ? pred.es + dep.lagDays
        : dep.type === 'FF'
        ? pred.ef + dep.lagDays - task.durationDays
        : pred.es + dep.lagDays - task.durationDays;
      es = Math.max(es, finish);
    }
    const ef = es + task.durationDays;
    nodes.set(id, { es, ef, ls: 0, lf: 0, float: 0 });
  }

  // Project end = max EF
  const projectEnd = Math.max(...Array.from(nodes.values()).map((n) => n.ef));

  // Backward pass
  for (const id of [...sorted].reverse()) {
    const node = nodes.get(id);
    if (!node) continue;
    const task = taskMap.get(id);
    if (!task) continue;
    const succs = deps.filter((d) => d.predecessorId === id);
    let lf = projectEnd;
    for (const dep of succs) {
      const succNode = nodes.get(dep.successorId);
      if (!succNode) continue;
      const start = dep.type === 'FS'
        ? succNode.ls - dep.lagDays
        : dep.type === 'SS'
        ? succNode.ls - dep.lagDays + task.durationDays
        : dep.type === 'FF'
        ? succNode.lf - dep.lagDays
        : succNode.lf - dep.lagDays + task.durationDays;
      lf = Math.min(lf, start);
    }
    const ls = lf - task.durationDays;
    node.lf = lf;
    node.ls = ls;
    node.float = ls - node.es;
  }

  const critical = new Set<TaskId>();
  for (const [id, node] of nodes.entries()) {
    if (Math.abs(node.float) < 0.001) critical.add(id);
  }
  return critical;
}
