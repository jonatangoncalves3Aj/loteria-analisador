import { ChevronLeft, ChevronRight, FileText, RotateCcw } from 'lucide-react';
import type { WizardStep } from '../../types';

interface Props {
  currentStep: WizardStep;
  onPrev: () => void;
  onNext: () => void;
  onGeneratePDF?: () => void;
  onReset?: () => void;
  canGoNext?: boolean;
}

export function NavButtons({
  currentStep,
  onPrev,
  onNext,
  onGeneratePDF,
  onReset,
  canGoNext = true,
}: Props) {
  const isFirst = currentStep === 'identificacao';
  const isReport = currentStep === 'relatorio';
  const isBeforeReport = currentStep === 'impressao';

  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
      <button
        onClick={onPrev}
        disabled={isFirst}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isFirst
            ? 'invisible'
            : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'
        }`}
      >
        <ChevronLeft size={16} />
        Voltar
      </button>

      <div className="flex gap-2">
        {isReport && onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all"
          >
            <RotateCcw size={14} />
            Reiniciar
          </button>
        )}
        {isReport && onGeneratePDF && (
          <button
            onClick={onGeneratePDF}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-all shadow-sm"
          >
            <FileText size={15} />
            Gerar PDF
          </button>
        )}
        {!isReport && (
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              canGoNext
                ? isBeforeReport
                  ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isBeforeReport ? 'Ver Relatório' : 'Próximo'}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
