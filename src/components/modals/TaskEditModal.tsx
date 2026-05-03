import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { useTaskStore, useUIStore, useResourceStore } from '../../store';
import type { Task } from '../../types';
import { addDays, daysBetween } from '../../utils/dateUtils';

interface TaskEditModalProps {
  taskId: string;
  onClose: () => void;
}

export function TaskEditModal({ taskId, onClose }: TaskEditModalProps) {
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const resources = useResourceStore((s) => s.resources);
  const setSelectedTask = useUIStore((s) => s.setSelectedTask);

  const [form, setForm] = useState<Partial<Task>>(task ? { ...task } : {});

  if (!task) return null;

  const set = (field: keyof Task, val: unknown) => setForm((f) => ({ ...f, [field]: val }));

  const handleSave = () => {
    const patch = { ...form };
    if (patch.startDate && patch.endDate) {
      patch.durationDays = Math.max(0, daysBetween(patch.startDate, patch.endDate));
    }
    updateTask(taskId, patch);
    onClose();
  };

  const handleDelete = () => {
    deleteTask(taskId);
    setSelectedTask(null);
    onClose();
  };

  const toggleResource = (rid: string) => {
    const current = (form.resourceIds ?? task.resourceIds) as string[];
    const next = current.includes(rid) ? current.filter((r) => r !== rid) : [...current, rid];
    set('resourceIds', next);
  };

  const resourceIds = (form.resourceIds ?? task.resourceIds) as string[];

  return (
    <Modal
      title="Editar Tarefa"
      onClose={onClose}
      footer={
        <>
          <Button variant="danger" size="sm" onClick={handleDelete}>Excluir</Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>Salvar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Nome da tarefa"
          value={(form.name ?? task.name) as string}
          onChange={(e) => set('name', e.target.value)}
        />
        <div className="flex gap-3">
          <DatePicker
            label="Início"
            value={(form.startDate ?? task.startDate) as Date}
            onChange={(d) => {
              set('startDate', d);
              const dur = (form.durationDays ?? task.durationDays) as number;
              set('endDate', addDays(d, dur));
            }}
          />
          <DatePicker
            label="Término"
            value={(form.endDate ?? task.endDate) as Date}
            onChange={(d) => set('endDate', d)}
          />
        </div>
        <Input
          label="Duração (dias)"
          type="number"
          min={0}
          value={String(form.durationDays ?? task.durationDays)}
          onChange={(e) => {
            const dur = Number(e.target.value);
            set('durationDays', dur);
            const start = (form.startDate ?? task.startDate) as Date;
            set('endDate', addDays(start, dur));
          }}
        />
        <Input
          label="Progresso (%)"
          type="number"
          min={0}
          max={100}
          value={String(form.progress ?? task.progress)}
          onChange={(e) => set('progress', Number(e.target.value))}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="milestone"
            checked={(form.isMilestone ?? task.isMilestone) as boolean}
            onChange={(e) => set('isMilestone', e.target.checked)}
          />
          <label htmlFor="milestone" className="text-sm text-slate-700">Marco (milestone)</label>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-600 mb-1">Recursos atribuídos</p>
          <div className="flex flex-col gap-1">
            {resources.map((r) => (
              <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resourceIds.includes(r.id)}
                  onChange={() => toggleResource(r.id)}
                />
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: r.avatarColor }}
                >
                  {r.name[0]}
                </span>
                <span className="text-sm">{r.name}</span>
                <span className="text-xs text-slate-400">{r.role}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Notas</label>
          <textarea
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 resize-none"
            rows={3}
            value={(form.note ?? task.note) as string}
            onChange={(e) => set('note', e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
