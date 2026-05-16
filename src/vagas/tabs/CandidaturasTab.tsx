import { useState } from 'react';
import { useVagasStore } from '../store/useVagasStore';
import type { Candidatura, StatusCandidatura } from '../types';
import { STATUS_LABELS, STATUS_COLORS, STATUS_HEADER_COLORS } from '../types';

const COLUNAS: StatusCandidatura[] = ['interesse', 'aplicado', 'entrevista', 'aprovado', 'reprovado'];

export function CandidaturasTab() {
  const { candidaturas, updateCandidatura, removeCandidatura, moveStatus } = useVagasStore();
  const [selected, setSelected] = useState<Candidatura | null>(null);
  const [filtro, setFiltro] = useState('');

  const filtered = filtro
    ? candidaturas.filter(c =>
        c.empresa.toLowerCase().includes(filtro.toLowerCase()) ||
        c.cargo.toLowerCase().includes(filtro.toLowerCase()) ||
        c.local.toLowerCase().includes(filtro.toLowerCase()))
    : candidaturas;

  const byStatus = (s: StatusCandidatura) => filtered.filter(c => c.status === s);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('candidaturaId', id);
  };

  const handleDrop = (e: React.DragEvent, status: StatusCandidatura) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('candidaturaId');
    if (id) moveStatus(id, status);
  };

  const total = candidaturas.length;
  const aprovados = candidaturas.filter(c => c.status === 'aprovado').length;
  const entrevistas = candidaturas.filter(c => c.status === 'entrevista').length;

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="flex gap-3">
        <Stat label="Total" value={total} color="text-gray-300" />
        <Stat label="Entrevistas" value={entrevistas} color="text-yellow-400" />
        <Stat label="Aprovados" value={aprovados} color="text-green-400" />
        <div className="flex-1">
          <input
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            placeholder="Filtrar por empresa, cargo ou local..."
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
          />
        </div>
      </div>

      {candidaturas.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          Nenhuma candidatura registrada. Vá em "Buscar Vagas" e adicione as vagas do seu interesse.
        </div>
      )}

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
        {COLUNAS.map(status => (
          <div
            key={status}
            className="flex-shrink-0 w-56 flex flex-col rounded-lg overflow-hidden border border-gray-700"
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, status)}
          >
            <div className={`${STATUS_HEADER_COLORS[status]} px-3 py-2 flex justify-between items-center`}>
              <span className="text-xs font-semibold uppercase tracking-wide">{STATUS_LABELS[status]}</span>
              <span className="text-xs opacity-75 bg-black bg-opacity-20 rounded-full px-1.5">{byStatus(status).length}</span>
            </div>
            <div className="flex-1 bg-gray-900 p-2 space-y-2 min-h-24">
              {byStatus(status).map(c => (
                <KanbanCard
                  key={c.id}
                  candidatura={c}
                  onDragStart={handleDragStart}
                  onClick={() => setSelected(c)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal detalhe */}
      {selected && (
        <DetailModal
          candidatura={selected}
          onClose={() => setSelected(null)}
          onUpdate={(patch) => { updateCandidatura(selected.id, patch); setSelected({ ...selected, ...patch }); }}
          onRemove={() => { removeCandidatura(selected.id); setSelected(null); }}
          onMove={(s) => { moveStatus(selected.id, s); setSelected({ ...selected, status: s }); }}
        />
      )}
    </div>
  );
}

function KanbanCard({
  candidatura: c, onDragStart, onClick,
}: {
  candidatura: Candidatura;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, c.id)}
      onClick={onClick}
      className={`${STATUS_COLORS[c.status]} border rounded p-2 cursor-pointer hover:brightness-110 transition-all`}
    >
      <p className="text-xs font-medium text-white truncate">{c.empresa}</p>
      <p className="text-xs text-gray-300 truncate">{c.cargo}</p>
      {c.local && <p className="text-xs text-gray-500 truncate">{c.local}</p>}
      {c.dataAplicacao && <p className="text-xs text-gray-500 mt-1">{c.dataAplicacao}</p>}
      {c.salario && <p className="text-xs text-green-400">{c.salario}</p>}
    </div>
  );
}

function DetailModal({
  candidatura: c, onClose, onUpdate, onRemove, onMove,
}: {
  candidatura: Candidatura;
  onClose: () => void;
  onUpdate: (patch: Partial<Candidatura>) => void;
  onRemove: () => void;
  onMove: (s: StatusCandidatura) => void;
}) {
  const [notas, setNotas] = useState(c.notas);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-xl w-full max-w-md p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-white font-semibold">{c.empresa}</h3>
            <p className="text-gray-400 text-sm">{c.cargo}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {c.local && <Info label="Local" value={c.local} />}
          {c.salario && <Info label="Salário" value={c.salario} />}
          {c.fonte && <Info label="Portal" value={c.fonte} />}
          {c.dataAplicacao && <Info label="Candidatura" value={c.dataAplicacao} />}
          {c.contato && <Info label="Contato" value={c.contato} span />}
        </div>

        {c.url && (
          <a href={c.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-400 hover:underline truncate">
            Ver vaga original →
          </a>
        )}

        <div>
          <label className="block text-xs text-gray-400 mb-1">Notas</label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            onBlur={() => onUpdate({ notas })}
            rows={3}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Mover para</label>
          <div className="flex flex-wrap gap-1">
            {COLUNAS.map(s => (
              <button
                key={s}
                onClick={() => onMove(s)}
                className={`text-xs px-2 py-1 rounded transition-colors ${c.status === s ? STATUS_HEADER_COLORS[s] : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onRemove}
          className="w-full py-1.5 bg-red-900 hover:bg-red-800 text-red-200 rounded text-xs"
        >
          Remover candidatura
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-800 rounded-lg px-3 py-2 text-center min-w-16">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function Info({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <span className="text-gray-500">{label}: </span>
      <span className="text-gray-200">{value}</span>
    </div>
  );
}
