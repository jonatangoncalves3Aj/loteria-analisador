import { Clock, User, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { ActionPlan, Prazo } from '../../data/actionPlans';

const PRAZO_CONFIG: Record<Prazo, { label: string; classes: string }> = {
  imediato: { label: 'Imediato (0-2 sem.)', classes: 'bg-red-100 text-red-700' },
  curto:    { label: 'Curto prazo (1-3 m.)', classes: 'bg-amber-100 text-amber-700' },
  medio:    { label: 'Médio prazo (3-6 m.)', classes: 'bg-blue-100 text-blue-700' },
};

interface Props {
  plan: ActionPlan;
  itemNumber: number;
}

export function ActionPlanCard({ plan, itemNumber }: Props) {
  const [expanded, setExpanded] = useState(false);
  const prazo = PRAZO_CONFIG[plan.prazo];

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="w-5 h-5 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
          {itemNumber}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-snug">{plan.titulo}</p>
          <div className="flex flex-wrap gap-2 mt-1.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${prazo.classes}`}>
              <Clock size={9} className="inline mr-1" />{prazo.label}
            </span>
            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
              <User size={9} />{plan.responsavel}
            </span>
          </div>
        </div>
        {expanded ? <ChevronUp size={14} className="text-slate-400 flex-shrink-0 mt-1" /> : <ChevronDown size={14} className="text-slate-400 flex-shrink-0 mt-1" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">{plan.descricao}</p>

          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1.5">Passos para implementação:</p>
            <ol className="space-y-1.5">
              {plan.passos.map((passo, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-600">
                  <span className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{passo}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex items-start gap-1.5 bg-slate-50 rounded-md px-3 py-2">
            <BookOpen size={11} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-500 leading-relaxed">
              <span className="font-semibold">Metodologia: </span>{plan.metodologia}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
