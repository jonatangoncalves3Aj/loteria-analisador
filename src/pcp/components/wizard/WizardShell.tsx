import type { ReactNode } from 'react';
import { usePCPStore } from '../../store/usePCPStore';
import { StepIndicator } from './StepIndicator';
import logoHorizontal from '../../assets/logo-horizontal.png';

interface Props {
  children: ReactNode;
}

export function WizardShell({ children }: Props) {
  const currentStep = usePCPStore(s => s.currentStep);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <img src={logoHorizontal} alt="Jonatan Jean Gonçalves — Engenheiro Civil" className="h-10 w-auto" />
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-700 leading-none">Diagnóstico PCP</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Planejamento e Controle da Produção</p>
            </div>
          </div>
          <StepIndicator currentStep={currentStep} />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
