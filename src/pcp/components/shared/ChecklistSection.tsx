import type { ChecklistSection as ChecklistSectionType, SectionAnswers } from '../../types';
import { calcScore } from '../../utils/scoring';
import { TrafficLight } from './TrafficLight';
import { ScoreBar } from './ScoreBar';

interface Props {
  section: ChecklistSectionType;
  answers: SectionAnswers;
  onAnswer: (itemId: string, value: boolean | null) => void;
  onObservacoes: (text: string) => void;
}

export function ChecklistSection({ section, answers, onAnswer, onObservacoes }: Props) {
  const score = calcScore(section, answers);

  return (
    <div className="space-y-6">
      {/* Section header with live score */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{section.titulo}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{section.descricao}</p>
          </div>
          <TrafficLight semaforo={score.semaforo} size="lg" />
        </div>
        <ScoreBar percentual={score.percentual} semaforo={score.semaforo} />
        <p className="text-xs text-slate-400 mt-1.5">
          {score.respondidas} de {score.total} itens respondidos
        </p>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {section.items.map((item, index) => {
          const value = answers.respostas[item.id] ?? null;
          return (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-4 hover:border-slate-300 transition-colors"
            >
              <span className="text-xs font-bold text-slate-400 mt-0.5 w-5 flex-shrink-0">
                {index + 1}
              </span>
              <p className="flex-1 text-sm text-slate-700 leading-relaxed">{item.texto}</p>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => onAnswer(item.id, value === true ? null : true)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    value === true
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-green-100 hover:text-green-700'
                  }`}
                >
                  Sim
                </button>
                <button
                  onClick={() => onAnswer(item.id, value === false ? null : false)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    value === false
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-700'
                  }`}
                >
                  Não
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Observations */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Observações desta seção
        </label>
        <textarea
          value={answers.observacoes}
          onChange={e => onObservacoes(e.target.value)}
          rows={3}
          placeholder="Descreva pontos relevantes, contexto ou situações específicas observadas..."
          className="w-full text-sm text-slate-700 placeholder-slate-400 border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
