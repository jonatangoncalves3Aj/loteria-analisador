import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { PCPState, WizardStep, SectionId, CompanyInfo, SectionAnswers, Impressao } from '../types';
import { SECTION_IDS } from '../data/checklistData';

const STEP_ORDER: WizardStep[] = [
  'identificacao',
  'longoPrazo',
  'medioPrazo',
  'curtoPrazo',
  'suprimentos',
  'indicadores',
  'culturaLean',
  'impressao',
  'relatorio',
];

function emptyAnswers(): Record<SectionId, SectionAnswers> {
  return Object.fromEntries(
    SECTION_IDS.map(id => [id, { respostas: {}, observacoes: '' }]),
  ) as Record<SectionId, SectionAnswers>;
}

interface PCPStore extends PCPState {
  stepOrder: WizardStep[];
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setCompanyInfo: (info: Partial<CompanyInfo>) => void;
  setAnswer: (sectionId: SectionId, itemId: string, value: boolean | null) => void;
  setObservacoes: (sectionId: SectionId, text: string) => void;
  setImpressao: (partial: Partial<Impressao>) => void;
  setPrioridade: (index: 0 | 1 | 2, text: string) => void;
  reset: () => void;
}

export const usePCPStore = create<PCPStore>()(
  immer((set) => ({
    stepOrder: STEP_ORDER,
    currentStep: 'identificacao',
    companyInfo: {
      empresa: '',
      cnpj: '',
      responsavel: '',
      cargo: '',
      data: '',
      obraProjeto: '',
    },
    answers: emptyAnswers(),
    impressao: { observacoesGerais: '', prioridades: ['', '', ''] },

    setStep: (step) => set(s => { s.currentStep = step; }),

    nextStep: () =>
      set(s => {
        const idx = STEP_ORDER.indexOf(s.currentStep);
        if (idx < STEP_ORDER.length - 1) s.currentStep = STEP_ORDER[idx + 1];
      }),

    prevStep: () =>
      set(s => {
        const idx = STEP_ORDER.indexOf(s.currentStep);
        if (idx > 0) s.currentStep = STEP_ORDER[idx - 1];
      }),

    setCompanyInfo: (info) =>
      set(s => { Object.assign(s.companyInfo, info); }),

    setAnswer: (sectionId, itemId, value) =>
      set(s => { s.answers[sectionId].respostas[itemId] = value; }),

    setObservacoes: (sectionId, text) =>
      set(s => { s.answers[sectionId].observacoes = text; }),

    setImpressao: (partial) =>
      set(s => { Object.assign(s.impressao, partial); }),

    setPrioridade: (index, text) =>
      set(s => { s.impressao.prioridades[index] = text; }),

    reset: () =>
      set(s => {
        s.currentStep = 'identificacao';
        s.companyInfo = { empresa: '', cnpj: '', responsavel: '', cargo: '', data: '', obraProjeto: '' };
        s.answers = emptyAnswers();
        s.impressao = { observacoesGerais: '', prioridades: ['', '', ''] };
      }),
  })),
);
