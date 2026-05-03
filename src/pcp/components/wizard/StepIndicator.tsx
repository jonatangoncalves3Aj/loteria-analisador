import { Check } from 'lucide-react';
import type { WizardStep } from '../../types';

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'identificacao', label: 'Empresa' },
  { id: 'longoPrazo', label: 'L. Prazo' },
  { id: 'medioPrazo', label: 'M. Prazo' },
  { id: 'curtoPrazo', label: 'C. Prazo' },
  { id: 'suprimentos', label: 'Suprim.' },
  { id: 'indicadores', label: 'Indicad.' },
  { id: 'culturaLean', label: 'Lean' },
  { id: 'impressao', label: 'Impressão' },
  { id: 'relatorio', label: 'Relatório' },
];

interface Props {
  currentStep: WizardStep;
}

export function StepIndicator({ currentStep }: Props) {
  const currentIdx = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-0 overflow-x-auto py-2 px-2">
      {STEPS.map((step, idx) => {
        const isPast = idx < currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isPast
                    ? 'bg-blue-600 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {isPast ? <Check size={12} strokeWidth={3} /> : idx + 1}
              </div>
              <span
                className={`text-[10px] font-medium leading-none ${
                  isCurrent ? 'text-blue-700' : isPast ? 'text-blue-500' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-6 mx-0.5 mb-4 transition-all ${
                  idx < currentIdx ? 'bg-blue-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
