import { useEffect } from 'react';
import { useTaskStore, useUIStore } from '../store';

export function useTaskKeyboard() {
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const selectedTaskId = useUIStore((s) => s.selectedTaskId);
  const setSelectedTask = useUIStore((s) => s.setSelectedTask);
  const setEditingTask = useUIStore((s) => s.setEditingTask);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedTaskId) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteTask(selectedTaskId);
        setSelectedTask(null);
      }
      if (e.key === 'Enter') {
        setEditingTask(selectedTaskId);
      }
      if (e.key === 'Escape') {
        setSelectedTask(null);
        setEditingTask(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedTaskId, deleteTask, setSelectedTask, setEditingTask]);
}
