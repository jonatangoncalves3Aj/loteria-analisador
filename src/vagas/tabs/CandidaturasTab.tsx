import { useState } from 'react';
import { useVagasStore } from '../store/useVagasStore';
import type { Candidatura, StatusCandidatura } from '../types';
import { STATUS_LABELS, STATUS_COLORS, STATUS_HEADER_COLORS } from '../types';
import { Building2, MapPin, DollarSign, ExternalLink, ChevronRight, X, Trash2 } from 'lucide-react';

const COLUNAS: StatusCandidatura[] = ['interesse', 'aplicado', 'entrevista', 'aprovado', 'reprovado'];

const STATUS_EMOJI: Record<StatusCandidatura, string> = {
  interesse: '👀', aplicado: '📨', entrevista: '🗣️', aprovado: '✅', reprovado: '❌',
};

export function CandidaturasTab() {
  const { candidaturas, updateCandidatura, removeCandidatura, moveStatus } = useVagasStore();
  const [selected, setSelected] = useState<Candidatura | null>(null);
  const [filtro, setFiltro] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = filtro
    ? candidaturas.filter(c =>
        [c.empresa, c.cargo, c.local].some(v => v.toLowerCase().includes(filtro.toLowerCase()))
      )
    : candidaturas;

  const byStatus = (s: StatusCandidatura) => filtered.filter(c => c.status === s);

  const total = candidaturas.length;
  const entrevistas = candidaturas.filter(c => c.status === 'entrevista').length;
  const aprovados = candidaturas.filter(c => c.status === 'aprovado').length;
  const taxa = total > 0 ? Math.round((aprovados / total) * 100) : 0;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-gray-300 font-medium mb-2">Nenhuma vaga registrada ainda</h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Vá em <strong className="text-gray-400">Buscar Vagas</strong>, encontre vagas nos portais e adicione ao rastreador.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Stat label="Total" value={total} color="text-white" bg="bg-gray-800" />
        <Stat label="Aplicadas" value={candidaturas.filter(c => c.status === 'aplicado').length} color="text-blue-400" bg="bg-blue-950/50" />
        <Stat label="Entrevistas" value={entrevistas} color="text-yellow-400" bg="bg-yellow-950/50" />
        <Stat label="Aprovações" value={aprovados} color="text-green-400" bg="bg-green-950/50" />
      </div>

      {/* Filtro */}
      <input
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
        placeholder="Filtrar por empresa, cargo ou cidade..."
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-600"
      />

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ minHeight: 400 }}>
        {COLUNAS.map(status => {
          const cards = byStatus(status);
          return (
            <div
              key={status}
              className="flex-shrink-0 w-52 flex flex-col rounded-2xl overflow-hidden border border-gray-800"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const id = e.dataTransfer.getData('id');
                if (id) moveStatus(id, status);
                setDragId(null);
              }}
            >
              <div className={`${STATUS_HEADER_COLORS[status]} px-3 py-2.5 flex items-center justify-between`}>
                <span className="text-xs font-semibold">
                  {STATUS_EMOJI[status]} {STATUS_LABELS[status]}
                </span>
                <span className="text-xs opacity-75 bg-black/20 rounded-full px-1.5 py-0.5">{cards.length}</span>
              </div>

              <div
                className={`flex-1 p-2 space-y-2 min-h-24 transition-colors ${
                  dragId ? 'bg-gray-800/80' : 'bg-gray-900/60'
                }`}
              >
                {cards.map(c => (
                  <KanbanCard
                    key={c.id}
                    candidatura={c}
                    onDragStart={id => { setDragId(id); }}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setSelected(c)}
                  />
                ))}
                {cards.length === 0 && (
                  <p className="text-xs text-gray-700 text-center pt-4">Vazio</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selected && (
        <DetailModal
          candidatura={selected}
          onClose={() => setSelected(null)}
          onUpdate={patch => { updateCandidatura(selected.id, patch); setSelected({ ...selected, ...patch }); }}
          onRemove={() => { removeCandidatura(selected.id); setSelected(null); }}
          onMove={s => { moveStatus(selected.id, s); setSelected({ ...selected, status: s }); }}
        />
      )}
    </div>
  );
}

function KanbanCard({ candidatura: c, onDragStart, onDragEnd, onClick }: {
  candidatura: Candidatura;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('id', c.id); onDragStart(c.id); }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`${STATUS_COLORS[c.status]} border rounded-xl p-3 cursor-pointer hover:brightness-110 transition-all active:scale-95 select-none`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">{c.empresa}</p>
          <p className="text-xs text-gray-300 truncate mt-0.5">{c.cargo}</p>
        </div>
        <ChevronRight size={12} className="text-gray-500 flex-shrink-0 mt-0.5" />
      </div>
      <div className="mt-2 space-y-0.5">
        {c.local && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <MapPin size={9} />
            <span className="truncate">{c.local}</span>
          </p>
        )}
        {c.salario && (
          <p className="text-xs text-green-400 flex items-center gap-1">
            <DollarSign size={9} />
            {c.salario}
          </p>
        )}
        {c.dataAplicacao && (
          <p className="text-xs text-gray-600">{c.dataAplicacao}</p>
        )}
      </div>
    </div>
  );
}

function DetailModal({ candidatura: c, onClose, onUpdate, onRemove, onMove }: {
  candidatura: Candidatura;
  onClose: () => void;
  onUpdate: (patch: Partial<Candidatura>) => void;
  onRemove: () => void;
  onMove: (s: StatusCandidatura) => void;
}) {
  const [notas, setNotas] = useState(c.notas);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
              <Building2 size={18} className="text-gray-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{c.empresa}</h3>
              <p className="text-gray-400 text-sm">{c.cargo}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        {/* Info pills */}
        <div className="flex flex-wrap gap-2">
          {c.local && <Pill icon={<MapPin size={10} />} text={c.local} />}
          {c.salario && <Pill icon={<DollarSign size={10} />} text={c.salario} color="text-green-400" />}
          {c.fonte && <Pill text={c.fonte} />}
          {c.dataAplicacao && <Pill text={c.dataAplicacao} />}
        </div>

        {c.url && (
          <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
            <ExternalLink size={12} />
            Ver vaga original
          </a>
        )}

        {/* Notas */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Notas</label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            onBlur={() => onUpdate({ notas })}
            rows={3}
            placeholder="Requisitos, contatos, observações..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Status buttons */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Mover para</p>
          <div className="flex flex-wrap gap-1.5">
            {COLUNAS.map(s => (
              <button
                key={s}
                onClick={() => onMove(s)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  c.status === s
                    ? STATUS_HEADER_COLORS[s]
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {STATUS_EMOJI[s]} {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex gap-2">
            <button onClick={onRemove} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-medium">
              Confirmar remoção
            </button>
            <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 text-gray-400 hover:text-white text-xs">
              Cancelar
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors">
            <Trash2 size={12} />
            Remover candidatura
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`${bg} border border-gray-800 rounded-xl p-3 text-center`}>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function Pill({ icon, text, color = 'text-gray-300' }: { icon?: React.ReactNode; text: string; color?: string }) {
  return (
    <span className={`flex items-center gap-1 bg-gray-800 ${color} text-xs px-2.5 py-1 rounded-full`}>
      {icon}{text}
    </span>
  );
}

const COLUNAS_IMPORT: StatusCandidatura[] = ['interesse', 'aplicado', 'entrevista', 'aprovado', 'reprovado'];
export { COLUNAS_IMPORT as COLUNAS };
