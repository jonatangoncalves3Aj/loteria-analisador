import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useTaskStore } from '../../store';
import { detectCycle } from '../../utils/dependencyUtils';
import type { DependencyType } from '../../types';

interface AddDependencyModalProps {
  successorId: string;
  onClose: () => void;
}

export function AddDependencyModal({ successorId, onClose }: AddDependencyModalProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const dependencies = useTaskStore((s) => s.dependencies);
  const addDependency = useTaskStore((s) => s.addDependency);

  const [predecessorId, setPredecessorId] = useState('');
  const [type, setType] = useState<DependencyType>('FS');
  const [lagDays, setLagDays] = useState(0);
  const [error, setError] = useState('');

  const availableTasks = tasks.filter((t) => t.id !== successorId);

  const handleAdd = () => {
    if (!predecessorId) { setError('Selecione uma tarefa predecessora.'); return; }
    const taskIds = tasks.map((t) => t.id);
    const testDeps = [...dependencies, { id: 'test', predecessorId, successorId, type, lagDays }];
    if (detectCycle(taskIds, testDeps)) {
      setError('Esta dependência criaria um ciclo — operação não permitida.');
      return;
    }
    addDependency({ predecessorId, successorId, type, lagDays });
    onClose();
  };

  return (
    <Modal
      title="Adicionar Dependência"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={handleAdd}>Adicionar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Tarefa predecessora</label>
          <select
            className="rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
            value={predecessorId}
            onChange={(e) => { setPredecessorId(e.target.value); setError(''); }}
          >
            <option value="">Selecione...</option>
            {availableTasks.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Tipo de dependência</label>
          <select
            className="rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
            value={type}
            onChange={(e) => setType(e.target.value as DependencyType)}
          >
            <option value="FS">Término-Início (FS)</option>
            <option value="SS">Início-Início (SS)</option>
            <option value="FF">Término-Término (FF)</option>
            <option value="SF">Início-Término (SF)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Espera (dias)</label>
          <input
            type="number"
            className="rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
            value={lagDays}
            onChange={(e) => setLagDays(Number(e.target.value))}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </Modal>
  );
}
