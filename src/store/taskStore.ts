import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { Task, TaskId, TaskGroup, GroupId, Dependency } from '../types';
import { daysBetween, addDays } from '../utils/dateUtils';

interface TaskState {
  tasks: Task[];
  groups: TaskGroup[];
  dependencies: Dependency[];
  addTask: (groupId?: GroupId | null, afterId?: TaskId) => TaskId;
  updateTask: (id: TaskId, partial: Partial<Omit<Task, 'id'>>) => void;
  deleteTask: (id: TaskId) => void;
  moveTask: (id: TaskId, afterId: TaskId | null) => void;
  addGroup: (parentId?: GroupId | null) => GroupId;
  updateGroup: (id: GroupId, partial: Partial<Omit<TaskGroup, 'id'>>) => void;
  deleteGroup: (id: GroupId) => void;
  toggleGroup: (id: GroupId) => void;
  addDependency: (dep: Omit<Dependency, 'id'>) => void;
  removeDependency: (id: string) => void;
}

function makeDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

const now = new Date();
const Y = now.getFullYear();
const M = now.getMonth() + 1;

const SEED_GROUPS: TaskGroup[] = [
  { id: 'g1', name: 'Design', collapsed: false, parentGroupId: null, wbsIndex: [1] },
  { id: 'g2', name: 'Desenvolvimento', collapsed: false, parentGroupId: null, wbsIndex: [2] },
];

const SEED_TASKS: Task[] = [
  {
    id: 't1', name: 'Briefing e requisitos', groupId: 'g1',
    startDate: makeDate(Y, M, 1), endDate: makeDate(Y, M, 5), durationDays: 4,
    progress: 100, resourceIds: ['r1'], isMilestone: false, note: '', color: null, wbsIndex: [1, 1],
  },
  {
    id: 't2', name: 'Wireframes', groupId: 'g1',
    startDate: makeDate(Y, M, 6), endDate: makeDate(Y, M, 12), durationDays: 6,
    progress: 60, resourceIds: ['r1'], isMilestone: false, note: '', color: null, wbsIndex: [1, 2],
  },
  {
    id: 't3', name: 'Design visual', groupId: 'g1',
    startDate: makeDate(Y, M, 13), endDate: makeDate(Y, M, 20), durationDays: 7,
    progress: 20, resourceIds: ['r1'], isMilestone: false, note: '', color: null, wbsIndex: [1, 3],
  },
  {
    id: 't4', name: 'Aprovação de design', groupId: 'g1',
    startDate: makeDate(Y, M, 21), endDate: makeDate(Y, M, 21), durationDays: 0,
    progress: 0, resourceIds: [], isMilestone: true, note: '', color: null, wbsIndex: [1, 4],
  },
  {
    id: 't5', name: 'Setup do ambiente', groupId: 'g2',
    startDate: makeDate(Y, M, 1), endDate: makeDate(Y, M, 3), durationDays: 2,
    progress: 100, resourceIds: ['r2'], isMilestone: false, note: '', color: null, wbsIndex: [2, 1],
  },
  {
    id: 't6', name: 'Desenvolvimento frontend', groupId: 'g2',
    startDate: makeDate(Y, M, 13), endDate: makeDate(Y, M + 1, 5), durationDays: 23,
    progress: 10, resourceIds: ['r2'], isMilestone: false, note: '', color: null, wbsIndex: [2, 2],
  },
  {
    id: 't7', name: 'Testes e QA', groupId: 'g2',
    startDate: makeDate(Y, M + 1, 6), endDate: makeDate(Y, M + 1, 12), durationDays: 6,
    progress: 0, resourceIds: ['r3'], isMilestone: false, note: '', color: null, wbsIndex: [2, 3],
  },
  {
    id: 't8', name: 'Lançamento', groupId: 'g2',
    startDate: makeDate(Y, M + 1, 13), endDate: makeDate(Y, M + 1, 13), durationDays: 0,
    progress: 0, resourceIds: [], isMilestone: true, note: '', color: null, wbsIndex: [2, 4],
  },
];

const SEED_DEPS: Dependency[] = [
  { id: 'd1', predecessorId: 't1', successorId: 't2', type: 'FS', lagDays: 0 },
  { id: 'd2', predecessorId: 't2', successorId: 't3', type: 'FS', lagDays: 0 },
  { id: 'd3', predecessorId: 't3', successorId: 't4', type: 'FS', lagDays: 0 },
  { id: 'd4', predecessorId: 't4', successorId: 't6', type: 'FS', lagDays: 0 },
  { id: 'd5', predecessorId: 't6', successorId: 't7', type: 'FS', lagDays: 0 },
  { id: 'd6', predecessorId: 't7', successorId: 't8', type: 'FS', lagDays: 0 },
];

export const useTaskStore = create<TaskState>()(
  immer((set) => ({
    tasks: SEED_TASKS,
    groups: SEED_GROUPS,
    dependencies: SEED_DEPS,

    addTask: (groupId = null, afterId) => {
      const id = nanoid(8);
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const end = addDays(start, 4);
      set((state) => {
        const task: Task = {
          id, name: 'Nova Tarefa', groupId: groupId ?? null,
          startDate: start, endDate: end, durationDays: 4,
          progress: 0, resourceIds: [], isMilestone: false, note: '', color: null, wbsIndex: [],
        };
        if (afterId) {
          const idx = state.tasks.findIndex((t) => t.id === afterId);
          state.tasks.splice(idx + 1, 0, task);
        } else {
          state.tasks.push(task);
        }
      });
      return id;
    },

    updateTask: (id, partial) =>
      set((state) => {
        const idx = state.tasks.findIndex((t) => t.id === id);
        if (idx < 0) return;
        const task = state.tasks[idx];
        Object.assign(task, partial);
        // Recompute duration if dates changed
        if (partial.startDate || partial.endDate) {
          task.durationDays = Math.max(0, daysBetween(task.startDate, task.endDate));
        }
        // Recompute endDate if durationDays changed directly
        if (partial.durationDays !== undefined && !partial.endDate) {
          task.endDate = addDays(task.startDate, partial.durationDays);
        }
      }),

    deleteTask: (id) =>
      set((state) => {
        state.tasks = state.tasks.filter((t) => t.id !== id);
        state.dependencies = state.dependencies.filter(
          (d) => d.predecessorId !== id && d.successorId !== id
        );
      }),

    moveTask: (id, afterId) =>
      set((state) => {
        const fromIdx = state.tasks.findIndex((t) => t.id === id);
        if (fromIdx < 0) return;
        const [task] = state.tasks.splice(fromIdx, 1);
        if (afterId === null) {
          state.tasks.unshift(task);
        } else {
          const toIdx = state.tasks.findIndex((t) => t.id === afterId);
          state.tasks.splice(toIdx + 1, 0, task);
        }
      }),

    addGroup: (parentId = null) => {
      const id = nanoid(8);
      set((state) => {
        state.groups.push({
          id, name: 'Novo Grupo', collapsed: false,
          parentGroupId: parentId ?? null, wbsIndex: [],
        });
      });
      return id;
    },

    updateGroup: (id, partial) =>
      set((state) => {
        const idx = state.groups.findIndex((g) => g.id === id);
        if (idx >= 0) Object.assign(state.groups[idx], partial);
      }),

    deleteGroup: (id) =>
      set((state) => {
        state.groups = state.groups.filter((g) => g.id !== id);
        // Move tasks in this group to top-level
        for (const task of state.tasks) {
          if (task.groupId === id) task.groupId = null;
        }
      }),

    toggleGroup: (id) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === id);
        if (group) group.collapsed = !group.collapsed;
      }),

    addDependency: (dep) =>
      set((state) => {
        state.dependencies.push({ ...dep, id: nanoid(8) });
      }),

    removeDependency: (id) =>
      set((state) => {
        state.dependencies = state.dependencies.filter((d) => d.id !== id);
      }),
  }))
);
