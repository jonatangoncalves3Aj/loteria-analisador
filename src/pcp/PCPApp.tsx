import { usePCPStore } from './store/usePCPStore';
import { WizardShell } from './components/wizard/WizardShell';
import { Step01_Identificacao } from './components/steps/Step01_Identificacao';
import { Step02_LongoPrazo } from './components/steps/Step02_LongoPrazo';
import { Step03_MedioPrazo } from './components/steps/Step03_MedioPrazo';
import { Step04_CurtoPrazo } from './components/steps/Step04_CurtoPrazo';
import { Step05_Suprimentos } from './components/steps/Step05_Suprimentos';
import { Step06_Indicadores } from './components/steps/Step06_Indicadores';
import { Step07_CulturaLean } from './components/steps/Step07_CulturaLean';
import { Step08_Impressao } from './components/steps/Step08_Impressao';
import { Step09_Relatorio } from './components/steps/Step09_Relatorio';
import type { WizardStep } from './types';
import type { ComponentType } from 'react';

const STEP_MAP: Record<WizardStep, ComponentType> = {
  identificacao: Step01_Identificacao,
  longoPrazo: Step02_LongoPrazo,
  medioPrazo: Step03_MedioPrazo,
  curtoPrazo: Step04_CurtoPrazo,
  suprimentos: Step05_Suprimentos,
  indicadores: Step06_Indicadores,
  culturaLean: Step07_CulturaLean,
  impressao: Step08_Impressao,
  relatorio: Step09_Relatorio,
};

export function PCPApp() {
  const currentStep = usePCPStore(s => s.currentStep);
  const StepComponent = STEP_MAP[currentStep];

  return (
    <WizardShell>
      <StepComponent />
    </WizardShell>
  );
}
