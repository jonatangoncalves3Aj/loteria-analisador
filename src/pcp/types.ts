export type SectionId =
  | 'longoPrazo'
  | 'medioPrazo'
  | 'curtoPrazo'
  | 'suprimentos'
  | 'indicadores'
  | 'culturaLean';

export type WizardStep =
  | 'identificacao'
  | SectionId
  | 'impressao'
  | 'relatorio';

export interface CompanyInfo {
  empresa: string;
  cnpj: string;
  responsavel: string;
  cargo: string;
  data: string;
  obraProjeto: string;
}

export interface ChecklistItem {
  id: string;
  texto: string;
}

export interface ChecklistSection {
  id: SectionId;
  titulo: string;
  descricao: string;
  items: ChecklistItem[];
}

export interface SectionAnswers {
  respostas: Record<string, boolean | null>;
  observacoes: string;
}

export interface SectionScore {
  sectionId: SectionId;
  titulo: string;
  percentual: number;
  semaforo: 'red' | 'yellow' | 'green';
  respondidas: number;
  total: number;
}

export interface Impressao {
  observacoesGerais: string;
  prioridades: [string, string, string];
}

export interface PCPState {
  currentStep: WizardStep;
  companyInfo: CompanyInfo;
  answers: Record<SectionId, SectionAnswers>;
  impressao: Impressao;
}
