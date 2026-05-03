import { MessageSquare, Star } from 'lucide-react';
import { usePCPStore } from '../../store/usePCPStore';
import { CHECKLIST_SECTIONS } from '../../data/checklistData';
import { calcScore } from '../../utils/scoring';
import { TrafficLight } from '../shared/TrafficLight';
import { ScoreBar } from '../shared/ScoreBar';
import { NavButtons } from '../wizard/NavButtons';

export function Step08_Impressao() {
  const impressao = usePCPStore(s => s.impressao);
  const answers = usePCPStore(s => s.answers);
  const setImpressao = usePCPStore(s => s.setImpressao);
  const setPrioridade = usePCPStore(s => s.setPrioridade);
  const nextStep = usePCPStore(s => s.nextStep);
  const prevStep = usePCPStore(s => s.prevStep);

  const scores = CHECKLIST_SECTIONS.map(sec => calcScore(sec, answers[sec.id]));

  return (
    <div className="space-y-6">
      {/* Summary of scores */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Impressão Geral</h2>
        <p className="text-sm text-slate-500 mb-4">
          Revise os scores de cada seção e registre suas prioridades de ação.
        </p>
        <div className="space-y-3">
          {scores.map(score => (
            <div key={score.sectionId} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-48 flex-shrink-0 truncate">{score.titulo}</span>
              <div className="flex-1">
                <ScoreBar percentual={score.percentual} semaforo={score.semaforo} showLabel={false} />
              </div>
              <TrafficLight semaforo={score.semaforo} size="sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Top 3 priorities */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Star size={16} className="text-amber-500" />
          <h3 className="font-semibold text-slate-800">Top 3 Prioridades de Ação</h3>
        </div>
        <div className="space-y-3">
          {([0, 1, 2] as const).map(idx => (
            <div key={idx} className="flex items-start gap-3">
              <span className="w-6 h-6 bg-amber-400 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-2">
                {idx + 1}
              </span>
              <input
                type="text"
                value={impressao.prioridades[idx]}
                onChange={e => setPrioridade(idx, e.target.value)}
                placeholder={`${idx + 1}ª prioridade de ação...`}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
              />
            </div>
          ))}
        </div>
      </div>

      {/* General observations */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={16} className="text-slate-500" />
          <h3 className="font-semibold text-slate-800">Observações Gerais</h3>
        </div>
        <textarea
          value={impressao.observacoesGerais}
          onChange={e => setImpressao({ observacoesGerais: e.target.value })}
          rows={4}
          placeholder="Descreva sua impressão geral sobre a maturidade do PCP na obra, pontos de destaque, contexto relevante..."
          className="w-full text-sm text-slate-700 placeholder-slate-400 border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <NavButtons currentStep="impressao" onPrev={prevStep} onNext={nextStep} />
    </div>
  );
}
