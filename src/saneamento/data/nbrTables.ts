// ============================================================================
//  Tabelas normativas — Dimensionamento de Fossa Séptica, Filtro Anaeróbio e
//  Sumidouro.
//
//  Referências:
//   • ABNT NBR 7229:1993  — Projeto, construção e operação de sistemas de
//                            tanques sépticos.
//   • ABNT NBR 13969:1997 — Tanques sépticos: unidades de tratamento
//                            complementar e disposição final dos efluentes
//                            líquidos (filtro anaeróbio, sumidouro, valas,
//                            ensaio de percolação).
//
//  Atenção: ferramenta educacional/estimativa. Sempre confirme os
//  coeficientes na versão vigente da norma e valide o projeto com um
//  responsável técnico habilitado (ART/RRT).
// ============================================================================

/** Contribuição de despejos (C) e de lodo fresco (Lf) — NBR 7229, Tabela 1. */
export interface ContribuicaoTipo {
  id: string;
  /** Descrição da ocupação/prédio. */
  label: string;
  /** Contribuição de esgoto C — litros por unidade por dia. */
  C: number;
  /** Contribuição de lodo fresco Lf — litros por unidade por dia. */
  Lf: number;
  /** Unidade de contribuição (pessoa, refeição, etc.). */
  unidade: string;
}

export const TABELA_CONTRIBUICAO: ContribuicaoTipo[] = [
  // ----- Ocupantes permanentes -----
  { id: 'res_alto',   label: 'Residência — padrão alto',                 C: 160, Lf: 1,    unidade: 'pessoa' },
  { id: 'res_medio',  label: 'Residência — padrão médio',                C: 130, Lf: 1,    unidade: 'pessoa' },
  { id: 'res_baixo',  label: 'Residência — padrão baixo',                C: 100, Lf: 1,    unidade: 'pessoa' },
  { id: 'hotel',      label: 'Hotel (exceto lavanderia e cozinha)',      C: 100, Lf: 1,    unidade: 'pessoa' },
  { id: 'alojamento', label: 'Alojamento provisório',                    C: 80,  Lf: 1,    unidade: 'pessoa' },
  // ----- Ocupantes temporários -----
  { id: 'fabrica',    label: 'Fábrica em geral',                         C: 70,  Lf: 0.30, unidade: 'pessoa' },
  { id: 'escritorio', label: 'Escritório',                               C: 50,  Lf: 0.20, unidade: 'pessoa' },
  { id: 'publico',    label: 'Edifício público ou comercial',            C: 50,  Lf: 0.20, unidade: 'pessoa' },
  { id: 'escola',     label: 'Escola (externato) e local de longa perm.',C: 50,  Lf: 0.20, unidade: 'pessoa' },
  { id: 'bar',        label: 'Bar',                                      C: 6,   Lf: 0.10, unidade: 'pessoa' },
  { id: 'restaurante',label: 'Restaurante e similar',                    C: 25,  Lf: 0.10, unidade: 'refeição' },
  { id: 'cinema',     label: 'Cinema, teatro e local de curta perm.',    C: 2,   Lf: 0.02, unidade: 'lugar' },
  { id: 'sanitario',  label: 'Sanitário público (por bacia)',            C: 480, Lf: 4.0,  unidade: 'bacia' },
];

/** Período de detenção dos despejos (T) — NBR 7229, Tabela 2.
 *  Função do volume de contribuição diária total (N × C), em litros. */
export interface FaixaDetencao {
  /** Limite superior da faixa de vazão diária (L/dia). Infinity = última faixa. */
  ateL: number;
  /** Período de detenção em dias. */
  Tdias: number;
  /** Período de detenção em horas (informativo). */
  Thoras: number;
}

export const TABELA_DETENCAO_FOSSA: FaixaDetencao[] = [
  { ateL: 1500,     Tdias: 1.00, Thoras: 24 },
  { ateL: 3000,     Tdias: 0.92, Thoras: 22 },
  { ateL: 4500,     Tdias: 0.83, Thoras: 20 },
  { ateL: 6000,     Tdias: 0.75, Thoras: 18 },
  { ateL: 7500,     Tdias: 0.67, Thoras: 16 },
  { ateL: 9000,     Tdias: 0.58, Thoras: 14 },
  { ateL: Infinity, Tdias: 0.50, Thoras: 12 },
];

/** Taxa de acumulação total de lodo (K), em dias — NBR 7229, Tabela 3.
 *  Função do intervalo entre limpezas (anos) e da temperatura ambiente. */
export type FaixaTemp = 'fria' | 'media' | 'quente';

export const FAIXAS_TEMPERATURA: { id: FaixaTemp; label: string }[] = [
  { id: 'fria',   label: 'Temperatura ≤ 10 °C' },
  { id: 'media',  label: '10 °C < temperatura ≤ 20 °C' },
  { id: 'quente', label: 'Temperatura > 20 °C' },
];

/** K[intervaloAnos][faixaTemp]. */
export const TABELA_LODO_K: Record<number, Record<FaixaTemp, number>> = {
  1: { fria: 94,  media: 65,  quente: 57 },
  2: { fria: 134, media: 105, quente: 97 },
  3: { fria: 174, media: 145, quente: 137 },
  4: { fria: 214, media: 185, quente: 177 },
  5: { fria: 254, media: 225, quente: 217 },
};

/** Profundidade útil mínima e máxima do tanque séptico — NBR 7229, Tabela 4. */
export interface FaixaProfundidade {
  ateL: number;
  hMin: number; // m
  hMax: number; // m
}

export const TABELA_PROFUNDIDADE_FOSSA: FaixaProfundidade[] = [
  { ateL: 6000,     hMin: 1.2, hMax: 2.2 },
  { ateL: 10000,    hMin: 1.5, hMax: 2.5 },
  { ateL: Infinity, hMin: 1.8, hMax: 2.8 },
];

// Limites geométricos do tanque séptico (NBR 7229)
export const FOSSA_LARGURA_MIN = 0.8;   // m — largura interna mínima
export const FOSSA_DIAMETRO_MIN = 1.1;  // m — diâmetro interno mínimo (circular)
export const FOSSA_VOLUME_MIN = 1000;   // L — embutido na fórmula
export const FOSSA_REL_COMP_LARG_MIN = 2; // relação comprimento:largura mínima
export const FOSSA_REL_COMP_LARG_MAX = 4; // relação comprimento:largura máxima

// ----------------------------------------------------------------------------
//  Filtro anaeróbio — NBR 13969:1997
// ----------------------------------------------------------------------------

/** Tempo de detenção hidráulica (T) do filtro anaeróbio — NBR 13969, Tabela 4.
 *  Função da vazão diária (L/dia) e da faixa de temperatura média do mês mais
 *  frio. T em dias. */
export const TABELA_DETENCAO_FILTRO: { ateL: number; T: Record<FaixaTemp, number> }[] = [
  { ateL: 1500,     T: { fria: 1.17, media: 1.00, quente: 0.92 } },
  { ateL: 3000,     T: { fria: 1.08, media: 0.92, quente: 0.83 } },
  { ateL: 4500,     T: { fria: 1.00, media: 0.83, quente: 0.75 } },
  { ateL: 6000,     T: { fria: 0.92, media: 0.75, quente: 0.67 } },
  { ateL: 7500,     T: { fria: 0.83, media: 0.67, quente: 0.58 } },
  { ateL: 9000,     T: { fria: 0.75, media: 0.58, quente: 0.50 } },
  { ateL: Infinity, T: { fria: 0.67, media: 0.50, quente: 0.42 } },
];

export const FILTRO_COEF = 1.6;          // coeficiente da fórmula V = 1,60·N·C·T
export const FILTRO_VOLUME_MIN = 1000;   // L — volume útil mínimo
export const FILTRO_ALTURA_LEITO = 1.2;  // m — altura útil do leito filtrante (brita)
export const FILTRO_FUNDO_FALSO = 0.25;  // m — altura do fundo falso (dreno)
export const FILTRO_DIAMETRO_MIN = 0.95; // m — diâmetro interno mínimo
export const FILTRO_PROF_TOTAL_MAX = 3.0; // m — profundidade total recomendada

// ----------------------------------------------------------------------------
//  Sumidouro / disposição no solo — NBR 13969:1997 e NBR 7229
// ----------------------------------------------------------------------------

/** Coeficiente de infiltração (Ci) aproximado por tipo de solo — L/m²·dia.
 *  O valor preciso deve vir do ensaio de percolação (NBR 13969, Anexo A). */
export interface TipoSolo {
  id: string;
  label: string;
  /** Coeficiente de infiltração — L/m²·dia. */
  Ci: number;
  /** Faixa típica do tempo de percolação (min/cm) associada. */
  percolacao: string;
}

export const TABELA_SOLO: TipoSolo[] = [
  { id: 'arenoso',       label: 'Arenoso (alta permeabilidade)',          Ci: 90, percolacao: '≤ 4 min/cm' },
  { id: 'areno_argiloso',label: 'Areno-argiloso',                         Ci: 60, percolacao: '4 a 8 min/cm' },
  { id: 'siltoso',       label: 'Siltoso / médio',                        Ci: 40, percolacao: '8 a 20 min/cm' },
  { id: 'argilo_arenoso',label: 'Argilo-arenoso',                         Ci: 25, percolacao: '20 a 40 min/cm' },
  { id: 'argiloso',      label: 'Argiloso (baixa permeabilidade)',        Ci: 20, percolacao: '> 40 min/cm' },
];

/** Pontos da curva do ensaio de percolação (NBR 13969, Anexo A — aproximação).
 *  Relaciona o tempo para o nível baixar 1 cm com o coeficiente de infiltração. */
export const CURVA_PERCOLACAO: { percMinCm: number; Ci: number }[] = [
  { percMinCm: 1,  Ci: 120 },
  { percMinCm: 2,  Ci: 96 },
  { percMinCm: 4,  Ci: 80 },
  { percMinCm: 6,  Ci: 70 },
  { percMinCm: 10, Ci: 55 },
  { percMinCm: 20, Ci: 35 },
  { percMinCm: 30, Ci: 27 },
  { percMinCm: 40, Ci: 20 },
];

/** Interpola o coeficiente de infiltração a partir do tempo de percolação. */
export function ciPorPercolacao(percMinCm: number): number {
  const pts = CURVA_PERCOLACAO;
  if (percMinCm <= pts[0].percMinCm) return pts[0].Ci;
  if (percMinCm >= pts[pts.length - 1].percMinCm) return pts[pts.length - 1].Ci;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (percMinCm >= a.percMinCm && percMinCm <= b.percMinCm) {
      const frac = (percMinCm - a.percMinCm) / (b.percMinCm - a.percMinCm);
      return Math.round(a.Ci + frac * (b.Ci - a.Ci));
    }
  }
  return pts[pts.length - 1].Ci;
}
