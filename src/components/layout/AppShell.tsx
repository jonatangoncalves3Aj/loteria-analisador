import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore, useTaskStore } from '../../store';
import { Toolbar } from './Toolbar';
import { Splitter } from './Splitter';
import { TaskListPanel } from '../taskList/TaskListPanel';
import { GanttPanel } from '../gantt/GanttPanel';
import { TaskEditModal } from '../modals/TaskEditModal';
import { AddDependencyModal } from '../modals/AddDependencyModal';
import { useTaskKeyboard } from '../../hooks/useTaskKeyboard';
import { Button } from '../ui/Button';

interface ContextMenuState {
  x: number;
  y: number;
  taskId: string;
}

export function AppShell() {
  useTaskKeyboard();

  const taskListWidth = useUIStore((s) => s.taskListWidth);
  const editingTaskId = useUIStore((s) => s.editingTaskId);
  const setEditingTask = useUIStore((s) => s.setEditingTask);
  const setSelectedTask = useUIStore((s) => s.setSelectedTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const addTask = useTaskStore((s) => s.addTask);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [depModal, setDepModal] = useState<string | null>(null);

  const handleOpenEdit = useCallback((id: string) => {
    setEditingTask(id);
    setContextMenu(null);
  }, [setEditingTask]);

  const handleContextMenu = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setSelectedTask(taskId);
    setContextMenu({ x: e.clientX, y: e.clientY, taskId });
  }, [setSelectedTask]);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  return (
    <div className="flex flex-col h-screen overflow-hidden" onClick={closeContextMenu}>
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <div style={{ width: taskListWidth, flexShrink: 0 }} className="flex overflow-hidden">
          <TaskListPanel onOpenEdit={handleOpenEdit} onContextMenu={handleContextMenu} />
        </div>
        <Splitter />
        <div className="flex flex-1 overflow-hidden">
          <GanttPanel />
        </div>
      </div>

      {/* Task edit modal */}
      {editingTaskId && (
        <TaskEditModal taskId={editingTaskId} onClose={() => setEditingTask(null)} />
      )}

      {/* Add dependency modal */}
      {depModal && (
        <AddDependencyModal successorId={depModal} onClose={() => setDepModal(null)} />
      )}

      {/* Context menu */}
      {contextMenu && createPortal(
        <div
          className="fixed z-50 min-w-[160px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg text-sm"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700"
            onClick={() => handleOpenEdit(contextMenu.taskId)}
          >
            Editar tarefa
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700"
            onClick={() => { addTask(null, contextMenu.taskId); closeContextMenu(); }}
          >
            Adicionar tarefa abaixo
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700"
            onClick={() => { setDepModal(contextMenu.taskId); closeContextMenu(); }}
          >
            Adicionar dependência
          </button>
          <hr className="my-1 border-slate-100" />
          <button
            className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-red-600"
            onClick={() => {
              deleteTask(contextMenu.taskId);
              setSelectedTask(null);
              closeContextMenu();
            }}
          >
            Excluir tarefa
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
