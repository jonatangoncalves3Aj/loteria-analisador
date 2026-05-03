import { usePCPStore } from '../../store/usePCPStore';
import { CHECKLIST_SECTIONS } from '../../data/checklistData';
import { ChecklistSection } from '../shared/ChecklistSection';
import { NavButtons } from '../wizard/NavButtons';

const section = CHECKLIST_SECTIONS.find(s => s.id === 'indicadores')!;

export function Step06_Indicadores() {
  const answers = usePCPStore(s => s.answers.indicadores);
  const setAnswer = usePCPStore(s => s.setAnswer);
  const setObservacoes = usePCPStore(s => s.setObservacoes);
  const nextStep = usePCPStore(s => s.nextStep);
  const prevStep = usePCPStore(s => s.prevStep);

  return (
    <div className="space-y-6">
      <ChecklistSection
        section={section}
        answers={answers}
        onAnswer={(id, val) => setAnswer('indicadores', id, val)}
        onObservacoes={text => setObservacoes('indicadores', text)}
      />
      <NavButtons currentStep="indicadores" onPrev={prevStep} onNext={nextStep} />
    </div>
  );
}
