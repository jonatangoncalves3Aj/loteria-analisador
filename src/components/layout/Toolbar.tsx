import React from 'react';
import { Plus, FolderPlus, ZoomIn, ZoomOut, Calendar, BarChart2 } from 'lucide-react';
import { useTaskStore, useUIStore, useProjectStore } from '../../store';
import { useZoom } from '../../hooks/useZoom';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import type { ZoomLevel } from '../../store';

export function Toolbar() {
  const addTask = useTaskStore((s) => s.addTask);
  const addGroup = useTaskStore((s) => s.addGroup);
  const project = useProjectStore((s) => s.project);
  const { zoom, setZoom } = useZoom();

  const ZOOMS: { level: ZoomLevel; label: string }[] = [
    { level: 'day', label: 'Dia' },
    { level: 'week', label: 'Semana' },
    { level: 'month', label: 'Mês' },
  ];

  return (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2 flex-shrink-0">
      <div className="flex items-center gap-2 mr-4">
        <BarChart2 size={18} className="text-blue-500" />
        <span className="font-semibold text-slate-800 text-sm">{project.name}</span>
      </div>

      <Tooltip text="Adicionar Tarefa">
        <Button variant="primary" size="sm" onClick={() => addTask()}>
          <Plus size={14} />
          Tarefa
        </Button>
      </Tooltip>

      <Tooltip text="Adicionar Grupo">
        <Button variant="secondary" size="sm" onClick={() => addGroup()}>
          <FolderPlus size={14} />
          Grupo
        </Button>
      </Tooltip>

      <div className="h-5 w-px bg-slate-200 mx-1" />

      <div className="flex items-center gap-1">
        {ZOOMS.map(({ level, label }) => (
          <button
            key={level}
            onClick={() => setZoom(level)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              zoom === level
                ? 'bg-blue-500 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <span className="text-xs text-slate-400">
        Ctrl+Scroll para zoom • Del para excluir • Enter para editar
      </span>
    </div>
  );
}
