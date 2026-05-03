import { create } from 'zustand';
import type { TaskId } from '../types';

export type ZoomLevel = 'day' | 'week' | 'month';

interface UIState {
  zoom: ZoomLevel;
  scrollTop: number;
  scrollLeft: number;
  selectedTaskId: TaskId | null;
  editingTaskId: TaskId | null;
  taskListWidth: number;
  contextMenu: { x: number; y: number; taskId: TaskId } | null;
  setZoom: (zoom: ZoomLevel) => void;
  setScrollTop: (top: number) => void;
  setScrollLeft: (left: number) => void;
  setSelectedTask: (id: TaskId | null) => void;
  setEditingTask: (id: TaskId | null) => void;
  setTaskListWidth: (w: number) => void;
  setContextMenu: (menu: { x: number; y: number; taskId: TaskId } | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  zoom: 'week',
  scrollTop: 0,
  scrollLeft: 0,
  selectedTaskId: null,
  editingTaskId: null,
  taskListWidth: 400,
  contextMenu: null,
  setZoom: (zoom) => set({ zoom }),
  setScrollTop: (scrollTop) => set({ scrollTop }),
  setScrollLeft: (scrollLeft) => set({ scrollLeft }),
  setSelectedTask: (selectedTaskId) => set({ selectedTaskId }),
  setEditingTask: (editingTaskId) => set({ editingTaskId }),
  setTaskListWidth: (taskListWidth) => set({ taskListWidth }),
  setContextMenu: (contextMenu) => set({ contextMenu }),
}));
