// ============================================================================
//  Motor de cálculo — Fossa séptica, Filtro anaeróbio e Sumidouro.
//  Cada função retorna a "memória de cálculo" passo a passo (CalcStep[]) além
//  dos resultados finais, para que as fórmulas fiquem totalmente explícitas.
// ============================================================================

import {
  TABELA_DETENCAO_FOSSA,
  TABELA_LODO_K,
  TABELA_PROFUNDIDADE_FOSSA,
  TABELA_DETENCAO_FILTRO,
  FOSSA_LARGURA_MIN,
  FOSSA_DIAMETRO_MIN,
  FOSSA_VOLUME_MIN,
  FILTRO_COEF,
  FILTRO_VOLUME_MIN,
  FILTRO_ALTURA_LEITO,
  FILTRO_FUNDO_FALSO,
  FILTRO_DIAMETRO_MIN,
  type FaixaTemp,
} from '../data/nbrTables';

/** Um passo da memória de cálculo. */
export interface CalcStep {
  /** Rótulo curto do passo. */
  label: string;
  /** Fórmula simbólica (ex.: "V = 1000 + N·(C·T + K·Lf)"). */
  formula?: string;
  /** Mesma fórmula com os valores substituídos. */
  substitution?: string;
  /** Resultado já formatado, com unidade. */
  result?: string;
  /** Observação / origem do valor (tabela da norma, etc.). */
  note?: string;
}

export interface CalcOutput {
  label: string;
  value: string;
  destaque?: boolean;
}

export interface CalcResult {
  ok: boolean;
  steps: CalcStep[];
  outputs: CalcOutput[];
  avisos: string[];
  erro?: string;
}

// ---------------------------------------------------------------------------
//  Helpers de formatação
// ---------------------------------------------------------------------------
const nf = (v: number, casas = 2) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

const L = (v: number) => `${nf(v, 0)} L`;
const m3 = (v: number) => `${nf(v / 1000, 2)} m³`;
const m = (v: number) => `${nf(v, 2)} m`;
const m2 = (v: number) => `${nf(v, 2)} m²`;

// ===========================================================================
//  1) FOSSA SÉPTICA — NBR 7229:1993
//     Volume útil:  V = 1000 + N·(C·T + K·Lf)
// ===========================================================================
export interface FossaInput {
  N: number;        // número de contribuintes (unidades de contribuição)
  C: number;        // contribuição de esgoto (L/unidade·dia)
  Lf: number;       // contribuição de lodo fresco (L/unidade·dia)
  faixaTemp: FaixaTemp;
  intervaloLimpeza: number; // anos (1 a 5)
}

export function calcularFossa(inp: FossaInput): CalcResult {
  const { N, C, Lf, faixaTemp, intervaloLimpeza } = inp;
  const steps: CalcStep[] = [];
  const avisos: string[] = [];

  if (!(N > 0) || !(C > 0)) {
    return { ok: false, steps: [], outputs: [], avisos: [], erro: 'Informe número de contribuintes e contribuição válidos.' };
  }

  // Passo 1 — vazão de contribuição diária
  const Qdia = N * C;
  steps.push({
    label: '1. Contribuição diária de esgoto (vazão)',
    formula: 'Q = N · C',
    substitution: `Q = ${nf(N, 0)} · ${nf(C, 0)}`,
    result: `${L(Qdia)}  (${m3(Qdia)}/dia)`,
    note: 'N = nº de contribuintes; C = contribuição diária por pessoa (NBR 7229, Tabela 1).',
  });

  // Passo 2 — período de detenção T (Tabela 2), em função de Q
  const faixaT = TABELA_DETENCAO_FOSSA.find((f) => Qdia <= f.ateL)!;
  const T = faixaT.Tdias;
  steps.push({
    label: '2. Período de detenção hidráulica (T)',
    formula: 'T = f(Q)  →  Tabela 2 (NBR 7229)',
    substitution: `Q = ${L(Qdia)}  →  faixa "${faixaT.ateL === Infinity ? 'acima de 9000 L' : 'até ' + nf(faixaT.ateL, 0) + ' L'}"`,
    result: `T = ${nf(T, 2)} dia (${nf(faixaT.Thoras, 0)} h)`,
    note: 'Quanto maior a vazão, menor o tempo de detenção adotado pela norma.',
  });

  // Passo 3 — taxa de acumulação de lodo K (Tabela 3)
  const linhaK = TABELA_LODO_K[intervaloLimpeza];
  if (!linhaK) {
    return { ok: false, steps, outputs: [], avisos: [], erro: 'Intervalo de limpeza deve estar entre 1 e 5 anos.' };
  }
  const K = linhaK[faixaTemp];
  steps.push({
    label: '3. Taxa de acumulação de lodo digerido (K)',
    formula: 'K = f(intervalo de limpeza, temperatura)  →  Tabela 3 (NBR 7229)',
    substitution: `intervalo = ${intervaloLimpeza} ano(s); faixa de temperatura selecionada`,
    result: `K = ${nf(K, 0)} dias`,
    note: 'K representa quantos dias de lodo são acumulados entre limpezas.',
  });

  // Passo 4 — volume útil
  const parcelaEsgoto = C * T;
  const parcelaLodo = K * Lf;
  const V = FOSSA_VOLUME_MIN + N * (parcelaEsgoto + parcelaLodo);
  steps.push({
    label: '4. Volume útil do tanque séptico',
    formula: 'V = 1000 + N · (C·T + K·Lf)',
    substitution: `V = 1000 + ${nf(N, 0)} · (${nf(C, 0)}·${nf(T, 2)} + ${nf(K, 0)}·${nf(Lf, 2)}) = 1000 + ${nf(N, 0)} · (${nf(parcelaEsgoto, 1)} + ${nf(parcelaLodo, 1)})`,
    result: `V = ${L(V)}  (${m3(V)})`,
    note: '1000 L = volume mínimo; C·T = volume de esgoto em detenção; K·Lf = volume de lodo acumulado.',
  });

  // Passo 5 — geometria (profundidade útil e área)
  const faixaH = TABELA_PROFUNDIDADE_FOSSA.find((f) => V <= f.ateL)!;
  const hUtil = faixaH.hMin; // adota-se a profundidade mínima como referência inicial
  const area = V / 1000 / hUtil; // m²  (V em m³ / h)
  steps.push({
    label: '5. Profundidade útil (h) — Tabela 4 (NBR 7229)',
    formula: 'h_mín ≤ h ≤ h_máx',
    substitution: `V = ${m3(V)}  →  ${m(faixaH.hMin)} ≤ h ≤ ${m(faixaH.hMax)}`,
    result: `h adotado = ${m(hUtil)} (mínimo da faixa)`,
  });
  steps.push({
    label: '6. Área superficial necessária',
    formula: 'A = V / h',
    substitution: `A = ${m3(V)} / ${m(hUtil)}`,
    result: m2(area),
  });

  // Geometria retangular sugerida: L = 2·W  →  A = L·W = 2·W²
  const larg = Math.max(FOSSA_LARGURA_MIN, Math.sqrt(area / 2));
  const comp = area / larg;
  steps.push({
    label: '7. Dimensões internas sugeridas (retangular, relação 2:1)',
    formula: 'A = comprimento · largura,  com comp = 2·larg',
    substitution: `largura = √(A/2) = √(${nf(area, 2)}/2);  comprimento = A / largura`,
    result: `largura ≈ ${m(larg)}  ×  comprimento ≈ ${m(comp)}  ×  h = ${m(hUtil)}`,
    note: `Largura mínima da norma = ${m(FOSSA_LARGURA_MIN)}; relação comprimento:largura entre 2:1 e 4:1.`,
  });

  // Alternativa circular
  const diam = Math.max(FOSSA_DIAMETRO_MIN, Math.sqrt((4 * area) / Math.PI));
  steps.push({
    label: '8. Alternativa circular',
    formula: 'D = √(4·A / π)',
    substitution: `D = √(4 · ${nf(area, 2)} / π)`,
    result: `D ≈ ${m(diam)}  ×  h = ${m(hUtil)}`,
    note: `Diâmetro interno mínimo da norma = ${m(FOSSA_DIAMETRO_MIN)}.`,
  });

  if (larg <= FOSSA_LARGURA_MIN + 0.001) {
    avisos.push(`A largura ficou no limite mínimo de ${m(FOSSA_LARGURA_MIN)}; ajuste a profundidade dentro da faixa para otimizar.`);
  }

  const outputs: CalcOutput[] = [
    { label: 'Volume útil', value: `${L(V)}  (${m3(V)})`, destaque: true },
    { label: 'Período de detenção (T)', value: `${nf(T, 2)} dia` },
    { label: 'Taxa de lodo (K)', value: `${nf(K, 0)} dias` },
    { label: 'Profundidade útil', value: m(hUtil) },
    { label: 'Retangular (l × c)', value: `${m(larg)} × ${m(comp)}` },
    { label: 'Circular (Ø)', value: m(diam) },
  ];

  return { ok: true, steps, outputs, avisos };
}

// ===========================================================================
//  2) FILTRO ANAERÓBIO — NBR 13969:1997
//     Volume útil do leito:  V = 1,60 · N · C · T  (mínimo 1000 L)
// ===========================================================================
export interface FiltroInput {
  N: number;
  C: number;
  faixaTemp: FaixaTemp;
}

export function calcularFiltro(inp: FiltroInput): CalcResult {
  const { N, C, faixaTemp } = inp;
  const steps: CalcStep[] = [];
  const avisos: string[] = [];

  if (!(N > 0) || !(C > 0)) {
    return { ok: false, steps: [], outputs: [], avisos: [], erro: 'Informe número de contribuintes e contribuição válidos.' };
  }

  // Passo 1 — vazão
  const Qdia = N * C;
  steps.push({
    label: '1. Vazão de contribuição diária',
    formula: 'Q = N · C',
    substitution: `Q = ${nf(N, 0)} · ${nf(C, 0)}`,
    result: `${L(Qdia)}  (${m3(Qdia)}/dia)`,
  });

  // Passo 2 — T (Tabela 4 NBR 13969)
  const faixaT = TABELA_DETENCAO_FILTRO.find((f) => Qdia <= f.ateL)!;
  const T = faixaT.T[faixaTemp];
  steps.push({
    label: '2. Tempo de detenção hidráulica (T)',
    formula: 'T = f(Q, temperatura)  →  Tabela 4 (NBR 13969)',
    substitution: `Q = ${L(Qdia)}; faixa de temperatura selecionada`,
    result: `T = ${nf(T, 2)} dia`,
  });

  // Passo 3 — volume útil
  let V = FILTRO_COEF * N * C * T;
  steps.push({
    label: '3. Volume útil do filtro (leito filtrante)',
    formula: 'V = 1,60 · N · C · T',
    substitution: `V = 1,60 · ${nf(N, 0)} · ${nf(C, 0)} · ${nf(T, 2)}`,
    result: `${L(V)}  (${m3(V)})`,
    note: '1,60 = coeficiente da norma que considera o volume ocupado pelo meio filtrante (brita).',
  });

  if (V < FILTRO_VOLUME_MIN) {
    steps.push({
      label: '3b. Volume mínimo normativo',
      formula: 'V ≥ 1000 L',
      substitution: `Calculado ${L(V)} < ${L(FILTRO_VOLUME_MIN)}`,
      result: `V adotado = ${L(FILTRO_VOLUME_MIN)}`,
    });
    avisos.push('Volume calculado abaixo do mínimo; adotado 1000 L conforme NBR 13969.');
    V = FILTRO_VOLUME_MIN;
  }

  // Passo 4 — área superficial (altura do leito fixa = 1,20 m)
  const area = V / 1000 / FILTRO_ALTURA_LEITO;
  steps.push({
    label: '4. Área superficial do filtro',
    formula: 'A = V / H_leito',
    substitution: `A = ${m3(V)} / ${m(FILTRO_ALTURA_LEITO)}`,
    result: m2(area),
    note: `Altura útil do leito de brita fixada em ${m(FILTRO_ALTURA_LEITO)} (NBR 13969).`,
  });

  // Passo 5 — diâmetro (filtro cilíndrico)
  const diam = Math.max(FILTRO_DIAMETRO_MIN, Math.sqrt((4 * area) / Math.PI));
  const profTotal = FILTRO_ALTURA_LEITO + FILTRO_FUNDO_FALSO;
  steps.push({
    label: '5. Diâmetro interno (filtro cilíndrico)',
    formula: 'D = √(4·A / π)',
    substitution: `D = √(4 · ${nf(area, 2)} / π)`,
    result: `D ≈ ${m(diam)}`,
    note: `Diâmetro mínimo = ${m(FILTRO_DIAMETRO_MIN)}.`,
  });
  steps.push({
    label: '6. Profundidade total da câmara',
    formula: 'H_total = H_leito + fundo falso',
    substitution: `H = ${m(FILTRO_ALTURA_LEITO)} + ${m(FILTRO_FUNDO_FALSO)}`,
    result: m(profTotal),
    note: 'O fundo falso aloja o dreno de fundo e a câmara de distribuição do afluente.',
  });

  const outputs: CalcOutput[] = [
    { label: 'Volume útil', value: `${L(V)}  (${m3(V)})`, destaque: true },
    { label: 'Tempo de detenção (T)', value: `${nf(T, 2)} dia` },
    { label: 'Área superficial', value: m2(area) },
    { label: 'Diâmetro interno', value: m(diam) },
    { label: 'Profundidade total', value: m(profTotal) },
  ];

  return { ok: true, steps, outputs, avisos };
}

// ===========================================================================
//  3) SUMIDOURO — NBR 13969:1997
//     Área de infiltração:  A = Q / Ci
// ===========================================================================
export interface SumidouroInput {
  N: number;
  C: number;
  Ci: number;       // coeficiente de infiltração (L/m²·dia)
  diametro: number; // diâmetro adotado do sumidouro (m)
  usarFundo: boolean; // considerar também a área do fundo na infiltração
}

export function calcularSumidouro(inp: SumidouroInput): CalcResult {
  const { N, C, Ci, diametro, usarFundo } = inp;
  const steps: CalcStep[] = [];
  const avisos: string[] = [];

  if (!(N > 0) || !(C > 0)) {
    return { ok: false, steps: [], outputs: [], avisos: [], erro: 'Informe número de contribuintes e contribuição válidos.' };
  }
  if (!(Ci > 0)) {
    return { ok: false, steps, outputs: [], avisos: [], erro: 'Coeficiente de infiltração (Ci) deve ser maior que zero.' };
  }
  if (!(diametro > 0)) {
    return { ok: false, steps, outputs: [], avisos: [], erro: 'Informe um diâmetro de sumidouro válido.' };
  }

  // Passo 1 — vazão
  const Qdia = N * C;
  steps.push({
    label: '1. Vazão de efluente a infiltrar',
    formula: 'Q = N · C',
    substitution: `Q = ${nf(N, 0)} · ${nf(C, 0)}`,
    result: `${L(Qdia)}  (${m3(Qdia)}/dia)`,
  });

  // Passo 2 — área de infiltração necessária
  const areaInf = Qdia / Ci;
  steps.push({
    label: '2. Área de infiltração necessária',
    formula: 'A = Q / Ci',
    substitution: `A = ${nf(Qdia, 0)} / ${nf(Ci, 0)}`,
    result: m2(areaInf),
    note: 'Ci = coeficiente de infiltração do solo (ensaio de percolação — NBR 13969, Anexo A).',
  });

  // Passo 3 — geometria do sumidouro cilíndrico
  const areaFundo = (Math.PI * diametro * diametro) / 4;
  const areaDisponivelPorMetro = Math.PI * diametro; // área lateral por metro de profundidade
  const areaUtilFundo = usarFundo ? areaFundo : 0;

  steps.push({
    label: '3. Geometria — área de absorção do sumidouro cilíndrico',
    formula: usarFundo
      ? 'A_total(h) = π·D·h  +  π·D²/4   (paredes + fundo)'
      : 'A_total(h) = π·D·h   (somente paredes laterais)',
    substitution: `D = ${m(diametro)}  →  lateral = π·${nf(diametro, 2)}·h = ${nf(areaDisponivelPorMetro, 2)}·h${usarFundo ? `  ;  fundo = ${m2(areaFundo)}` : ''}`,
    result: `${nf(areaDisponivelPorMetro, 2)} m²/m de parede${usarFundo ? ` + ${m2(areaFundo)} de fundo` : ''}`,
    note: 'Recomenda-se usar prioritariamente as paredes laterais (o fundo tende a colmatar).',
  });

  // Passo 4 — profundidade útil necessária
  const profUtil = (areaInf - areaUtilFundo) / areaDisponivelPorMetro;
  const profUtilPos = Math.max(0, profUtil);
  steps.push({
    label: '4. Profundidade útil necessária (h)',
    formula: usarFundo
      ? 'h = (A − π·D²/4) / (π·D)'
      : 'h = A / (π·D)',
    substitution: usarFundo
      ? `h = (${nf(areaInf, 2)} − ${nf(areaFundo, 2)}) / ${nf(areaDisponivelPorMetro, 2)}`
      : `h = ${nf(areaInf, 2)} / ${nf(areaDisponivelPorMetro, 2)}`,
    result: m(profUtilPos),
  });

  const areaTotalObtida = areaDisponivelPorMetro * profUtilPos + areaUtilFundo;
  steps.push({
    label: '5. Verificação da área de absorção',
    formula: 'A_obtida ≥ A_necessária',
    substitution: `${m2(areaTotalObtida)} ≥ ${m2(areaInf)}`,
    result: areaTotalObtida + 0.001 >= areaInf ? 'OK ✓' : 'Insuficiente ✗',
  });

  if (profUtilPos > 3) {
    avisos.push(`Profundidade útil de ${m(profUtilPos)} é elevada. Considere aumentar o diâmetro ou executar mais de um sumidouro em paralelo.`);
  }
  avisos.push('O fundo do sumidouro deve ficar no mínimo 1,5 m acima do nível máximo do lençol freático (NBR 13969).');

  const outputs: CalcOutput[] = [
    { label: 'Área de infiltração necessária', value: m2(areaInf), destaque: true },
    { label: 'Profundidade útil', value: m(profUtilPos), destaque: true },
    { label: 'Diâmetro adotado', value: m(diametro) },
    { label: 'Área lateral por metro', value: `${nf(areaDisponivelPorMetro, 2)} m²/m` },
  ];

  return { ok: true, steps, outputs, avisos };
}
