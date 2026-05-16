export interface ExperienciaItem {
  id: string;
  empresa: string;
  cargo: string;
  inicio: string;
  fim: string;
  atual: boolean;
  descricao: string;
}

export interface FormacaoItem {
  id: string;
  instituicao: string;
  curso: string;
  nivel: string;
  inicio: string;
  fim: string;
  concluido: boolean;
}

export interface Perfil {
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  linkedin: string;
  crea: string;
  resumo: string;
  habilidades: string[];
  experiencias: ExperienciaItem[];
  formacoes: FormacaoItem[];
}

export type StatusCandidatura =
  | 'interesse'
  | 'aplicado'
  | 'entrevista'
  | 'aprovado'
  | 'reprovado';

export interface Candidatura {
  id: string;
  empresa: string;
  cargo: string;
  local: string;
  salario: string;
  url: string;
  fonte: string;
  dataCadastro: string;
  dataAplicacao: string;
  status: StatusCandidatura;
  notas: string;
  contato: string;
}

export const STATUS_LABELS: Record<StatusCandidatura, string> = {
  interesse: 'Interesse',
  aplicado: 'Aplicado',
  entrevista: 'Entrevista',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
};

export const STATUS_COLORS: Record<StatusCandidatura, string> = {
  interesse: 'bg-gray-700 border-gray-600',
  aplicado: 'bg-blue-900 border-blue-700',
  entrevista: 'bg-yellow-900 border-yellow-700',
  aprovado: 'bg-green-900 border-green-700',
  reprovado: 'bg-red-900 border-red-700',
};

export const STATUS_HEADER_COLORS: Record<StatusCandidatura, string> = {
  interesse: 'bg-gray-600 text-gray-100',
  aplicado: 'bg-blue-700 text-blue-100',
  entrevista: 'bg-yellow-700 text-yellow-100',
  aprovado: 'bg-green-700 text-green-100',
  reprovado: 'bg-red-700 text-red-100',
};
