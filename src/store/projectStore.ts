import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Project } from '../types';

interface ProjectState {
  project: Project;
  updateProject: (partial: Partial<Project>) => void;
}

const now = new Date();
const projectStart = new Date(now.getFullYear(), now.getMonth(), 1);
const projectEnd = new Date(now.getFullYear(), now.getMonth() + 3, 0);

export const useProjectStore = create<ProjectState>()(
  immer((set) => ({
    project: {
      id: 'proj1',
      name: 'Lançamento do Website',
      startDate: projectStart,
      endDate: projectEnd,
      description: 'Projeto de desenvolvimento e lançamento do novo website corporativo.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    updateProject: (partial) =>
      set((state) => {
        Object.assign(state.project, partial, { updatedAt: new Date() });
      }),
  }))
);
