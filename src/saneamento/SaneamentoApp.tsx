import { useMemo, useState } from 'react';
import {
  TABELA_CONTRIBUICAO,
  FAIXAS_TEMPERATURA,
  TABELA_SOLO,
  ciPorPercolacao,
  type FaixaTemp,
} from './data/nbrTables';
import {
  calcularFossa,
  calcularFiltro,
  calcularSumidouro,
} from './utils/calc';
import { Resultado, Campo } from './components/Resultado';

type Aba = 'fossa' | 'filtro' | 'sumidouro';

const ABAS: { id: Aba; label: string; icon: string; norma: string }[] = [
  { id: 'fossa', label: 'Fossa séptica', icon: '🛢️', norma: 'NBR 7229:1993' },
  { id: 'filtro', label: 'Filtro anaeróbio', icon: '🧱', norma: 'NBR 13969:1997' },
  { id: 'sumidouro', label: 'Sumidouro', icon: '🕳️', norma: 'NBR 13969:1997' },
];

export function SaneamentoApp() {
  const [aba, setAba] = useState<Aba>('fossa');

  // Parâmetros compartilhados (a contribuição C/Lf vem do tipo de prédio)
  const [tipoId, setTipoId] = useState(TABELA_CONTRIBUICAO[1].id); // residência padrão médio
  const [N, setN] = useState(5);
  const [faixaTemp, setFaixaTemp] = useState<FaixaTemp>('media');

  const tipo = useMemo(
    () => TABELA_CONTRIBUICAO.find((t) => t.id === tipoId)!,
    [tipoId],
  );

  // Específicos da fossa
  const [intervaloLimpeza, setIntervaloLimpeza] = useState(1);

  // Específicos do sumidouro
  const [modoSolo, setModoSolo] = useState<'tabela' | 'percolacao'>('tabela');
  const [soloId, setSoloId] = useState(TABELA_SOLO[1].id);
  const [percolacao, setPercolacao] = useState(8);
  const [diametro, setDiametro] = useState(2);
  const [usarFundo, setUsarFundo] = useState(false);

  const Ci = useMemo(() => {
    if (modoSolo === 'percolacao') return ciPorPercolacao(percolacao);
    return TABELA_SOLO.find((s) => s.id === soloId)!.Ci;
  }, [modoSolo, soloId, percolacao]);

  const resFossa = useMemo(
    () =>
      aba === 'fossa'
        ? calcularFossa({ N, C: tipo.C, Lf: tipo.Lf, faixaTemp, intervaloLimpeza })
        : null,
    [aba, N, tipo, faixaTemp, intervaloLimpeza],
  );
  const resFiltro = useMemo(
    () => (aba === 'filtro' ? calcularFiltro({ N, C: tipo.C, faixaTemp }) : null),
    [aba, N, tipo, faixaTemp],
  );
  const resSumidouro = useMemo(
    () =>
      aba === 'sumidouro'
        ? calcularSumidouro({ N, C: tipo.C, Ci, diametro, usarFundo })
        : null,
    [aba, N, tipo, Ci, diametro, usarFundo],
  );

  const abaInfo = ABAS.find((a) => a.id === aba)!;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl font-bold text-gray-800">💧 Dimensionamento de Saneamento</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Fossa séptica, filtro anaeróbio e sumidouro conforme ABNT NBR 7229:1993 e NBR 13969:1997
          </p>
        </div>
      </div>

      {/* Abas */}
      <div className="border-b border-gray-200 bg-white px-4">
        <div className="mx-auto flex max-w-5xl gap-1">
          {ABAS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                aba === a.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-1">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">
            {abaInfo.icon} {abaInfo.label}
          </h2>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
            {abaInfo.norma}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
          {/* Coluna de entrada */}
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">
              Dados de entrada
            </h3>

            {/* Tipo de prédio (define C e Lf) */}
            <label className="block">
              <span className="text-xs font-medium text-gray-600">Tipo de ocupação (NBR 7229, Tab. 1)</span>
              <select
                value={tipoId}
                onChange={(e) => setTipoId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              >
                {TABELA_CONTRIBUICAO.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[11px] text-gray-400">
                C = {tipo.C} L/{tipo.unidade}·dia · Lf = {tipo.Lf} L/{tipo.unidade}·dia
              </span>
            </label>

            <Campo
              label={`Número de contribuintes (N)`}
              value={N}
              min={1}
              onChange={setN}
              suffix={tipo.unidade + 's'}
            />

            {aba !== 'sumidouro' && (
              <label className="block">
                <span className="text-xs font-medium text-gray-600">Faixa de temperatura ambiente</span>
                <select
                  value={faixaTemp}
                  onChange={(e) => setFaixaTemp(e.target.value as FaixaTemp)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                >
                  {FAIXAS_TEMPERATURA.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* Específicos da fossa */}
            {aba === 'fossa' && (
              <label className="block">
                <span className="text-xs font-medium text-gray-600">Intervalo entre limpezas</span>
                <select
                  value={intervaloLimpeza}
                  onChange={(e) => setIntervaloLimpeza(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5].map((y) => (
                    <option key={y} value={y}>
                      {y} ano{y > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* Específicos do sumidouro */}
            {aba === 'sumidouro' && (
              <>
                <div>
                  <span className="text-xs font-medium text-gray-600">Coeficiente de infiltração (Ci)</span>
                  <div className="mt-1 flex gap-1 rounded-lg bg-gray-100 p-1 text-xs">
                    <button
                      onClick={() => setModoSolo('tabela')}
                      className={`flex-1 rounded px-2 py-1 ${modoSolo === 'tabela' ? 'bg-white font-semibold shadow-sm' : 'text-gray-500'}`}
                    >
                      Tipo de solo
                    </button>
                    <button
                      onClick={() => setModoSolo('percolacao')}
                      className={`flex-1 rounded px-2 py-1 ${modoSolo === 'percolacao' ? 'bg-white font-semibold shadow-sm' : 'text-gray-500'}`}
                    >
                      Ensaio de percolação
                    </button>
                  </div>
                </div>

                {modoSolo === 'tabela' ? (
                  <label className="block">
                    <span className="text-xs font-medium text-gray-600">Solo</span>
                    <select
                      value={soloId}
                      onChange={(e) => setSoloId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                    >
                      {TABELA_SOLO.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label} — {s.Ci} L/m²·dia
                        </option>
                      ))}
                    </select>
                    <span className="mt-1 block text-[11px] text-gray-400">
                      Percolação típica: {TABELA_SOLO.find((s) => s.id === soloId)!.percolacao}
                    </span>
                  </label>
                ) : (
                  <Campo
                    label="Tempo de percolação"
                    value={percolacao}
                    min={1}
                    step={0.5}
                    onChange={setPercolacao}
                    suffix="min/cm"
                    hint={`Ci interpolado = ${Ci} L/m²·dia (NBR 13969, Anexo A)`}
                  />
                )}

                <Campo
                  label="Diâmetro adotado do sumidouro"
                  value={diametro}
                  min={0.3}
                  step={0.1}
                  onChange={setDiametro}
                  suffix="m"
                />

                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={usarFundo}
                    onChange={(e) => setUsarFundo(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Considerar também a área do fundo na infiltração
                </label>
              </>
            )}

            <p className="rounded-lg bg-gray-50 px-3 py-2 text-[11px] leading-relaxed text-gray-500">
              Ferramenta de estimativa para fins educacionais. O projeto executivo deve ser
              assinado por profissional habilitado e atender às normas e legislações locais
              vigentes.
            </p>
          </div>

          {/* Coluna de resultado */}
          <div>
            {aba === 'fossa' && <Resultado res={resFossa} titulo="Fossa séptica" />}
            {aba === 'filtro' && <Resultado res={resFiltro} titulo="Filtro anaeróbio" />}
            {aba === 'sumidouro' && <Resultado res={resSumidouro} titulo="Sumidouro" />}
          </div>
        </div>
      </div>
    </div>
  );
}
