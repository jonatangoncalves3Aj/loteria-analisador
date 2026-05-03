import { Building2, Calendar, User, Briefcase, MapPin, Hash, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { usePCPStore } from '../../store/usePCPStore';
import { CHECKLIST_SECTIONS } from '../../data/checklistData';
import { ACTION_PLANS } from '../../data/actionPlans';
import { calcScore } from '../../utils/scoring';
import { TrafficLight } from '../shared/TrafficLight';
import { ScoreBar } from '../shared/ScoreBar';
import { ActionPlanCard } from '../shared/ActionPlanCard';
import { NavButtons } from '../wizard/NavButtons';
import { generatePCPReport } from '../pdf/generatePCPReport';

export function Step09_Relatorio() {
  const state = usePCPStore(s => s);
  const prevStep = usePCPStore(s => s.prevStep);
  const reset = usePCPStore(s => s.reset);
  const { companyInfo, answers, impressao } = state;
  const [actionPlanOpen, setActionPlanOpen] = useState(true);

  const scores = CHECKLIST_SECTIONS.map(sec => calcScore(sec, answers[sec.id]));
  const avgScore = Math.round(scores.reduce((sum, s) => sum + s.percentual, 0) / scores.length);
  const avgSemaforo = avgScore <= 40 ? 'red' : avgScore <= 70 ? 'yellow' : 'green';

  // Build action plans for all items answered "Não"
  const actionPlansBySec = CHECKLIST_SECTIONS.map(sec => {
    const secAnswers = answers[sec.id];
    const failedItems = sec.items.filter(item => secAnswers.respostas[item.id] === false);
    const plans = failedItems
      .map(item => ACTION_PLANS.find(ap => ap.itemId === item.id))
      .filter((ap): ap is NonNullable<typeof ap> => ap !== undefined);
    return { section: sec, plans };
  }).filter(s => s.plans.length > 0);

  const totalActions = actionPlansBySec.reduce((sum, s) => sum + s.plans.length, 0);

  const handlePDF = () => {
    generatePCPReport({
      currentStep: state.currentStep,
      companyInfo,
      answers,
      impressao,
    });
  };

  return (
    <div className="space-y-6">
      {/* Overall score banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl p-5 text-white shadow-md">
        <p className="text-sm font-medium text-blue-200 mb-1">Score Médio Geral</p>
        <div className="flex items-end justify-between">
          <span className="text-5xl font-black">{avgScore}%</span>
          <TrafficLight semaforo={avgSemaforo} size="lg" />
        </div>
        <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 bg-white rounded-full transition-all duration-700"
            style={{ width: `${avgScore}%` }}
          />
        </div>
      </div>

      {/* Company info summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Building2 size={15} className="text-slate-400" />
          Dados do Diagnóstico
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            { icon: Building2, label: 'Empresa', value: companyInfo.empresa },
            { icon: Hash, label: 'CNPJ', value: companyInfo.cnpj },
            { icon: User, label: 'Responsável', value: companyInfo.responsavel },
            { icon: Briefcase, label: 'Cargo', value: companyInfo.cargo },
            { icon: Calendar, label: 'Data', value: companyInfo.data },
            { icon: MapPin, label: 'Obra / Projeto', value: companyInfo.obraProjeto },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">{label}</span>
                <span className="text-slate-700 font-medium">{value || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section scores */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-4">Resultados por Seção</h3>
        <div className="space-y-4">
          {scores.map((score, i) => (
            <div key={score.sectionId}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700">
                  <span className="text-slate-400 mr-1.5">{i + 1}.</span>
                  {score.titulo}
                </span>
                <TrafficLight semaforo={score.semaforo} size="sm" />
              </div>
              <ScoreBar percentual={score.percentual} semaforo={score.semaforo} />
            </div>
          ))}
        </div>
      </div>

      {/* Top 3 priorities */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-3">Top 3 Prioridades</h3>
        <div className="space-y-2">
          {impressao.prioridades.map((p, i) => (
            <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
              <span className="w-6 h-6 bg-amber-400 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-amber-900">{p || <em className="text-amber-400">Não informado</em>}</span>
            </div>
          ))}
        </div>
      </div>

      {/* General observations */}
      {impressao.observacoesGerais.trim() && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-2">Observações Gerais</h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {impressao.observacoesGerais}
          </p>
        </div>
      )}

      {/* Action Plans */}
      {totalActions > 0 && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setActionPlanOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lightbulb size={15} className="text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-800">Plano de Ação Detalhado</h3>
                <p className="text-xs text-slate-500">{totalActions} ações recomendadas para os itens com resposta "Não"</p>
              </div>
            </div>
            {actionPlanOpen
              ? <ChevronUp size={16} className="text-slate-400" />
              : <ChevronDown size={16} className="text-slate-400" />}
          </button>

          {actionPlanOpen && (
            <div className="border-t border-blue-100 px-5 pb-5 pt-4 space-y-6">
              {actionPlansBySec.map(({ section, plans }) => (
                <div key={section.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                      {section.titulo}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
                      {plans.length} ação{plans.length > 1 ? 'ões' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {plans.map((plan, i) => (
                      <ActionPlanCard key={plan.itemId} plan={plan} itemNumber={i + 1} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {totalActions === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-sm font-semibold text-green-700">Todos os itens foram marcados como "Sim".</p>
          <p className="text-xs text-green-600 mt-1">Nenhum plano de ação necessário. Mantenha os processos em funcionamento!</p>
        </div>
      )}

      <NavButtons
        currentStep="relatorio"
        onPrev={prevStep}
        onNext={() => {}}
        onGeneratePDF={handlePDF}
        onReset={reset}
      />
    </div>
  );
}
