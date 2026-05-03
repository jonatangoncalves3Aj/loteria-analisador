import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { Resource } from '../types';

interface ResourceState {
  resources: Resource[];
  addResource: (partial: Partial<Omit<Resource, 'id'>>) => void;
  updateResource: (id: string, partial: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
}

const SEED_RESOURCES: Resource[] = [
  { id: 'r1', name: 'Ana Souza', role: 'Designer', avatarColor: '#8b5cf6', availability: 100 },
  { id: 'r2', name: 'Bruno Lima', role: 'Desenvolvedor', avatarColor: '#3b82f6', availability: 100 },
  { id: 'r3', name: 'Carla Mendes', role: 'QA', avatarColor: '#10b981', availability: 80 },
];

export const useResourceStore = create<ResourceState>()(
  immer((set) => ({
    resources: SEED_RESOURCES,
    addResource: (partial) =>
      set((state) => {
        state.resources.push({
          id: nanoid(),
          name: 'Novo Recurso',
          role: '',
          avatarColor: '#64748b',
          availability: 100,
          ...partial,
        });
      }),
    updateResource: (id, partial) =>
      set((state) => {
        const idx = state.resources.findIndex((r) => r.id === id);
        if (idx >= 0) Object.assign(state.resources[idx], partial);
      }),
    deleteResource: (id) =>
      set((state) => {
        state.resources = state.resources.filter((r) => r.id !== id);
      }),
  }))
);
