import { useState } from 'react';
import { useLoteriaStore } from '../store/useLoteriaStore';
import { NumberHeatGrid } from './NumberHeatGrid';

type SortKey = 'number' | 'frequency' | 'delay' | 'temp' | 'trend';

export function StatsPanel() {
  const { stats, draws, selectedGame, distribution, columnStats, sumStats, rangeDist, repeatStats } = useLoteriaStore();
  const [sortKey, setSortKey] = useState<SortKey>('frequency');
  const [sortAsc, setSortAsc] = useState(false);
  const [view, setView] = useState<'grid' | 'table'>('grid');

  if (stats.length === 0) return null;

  const trendOrder = { rising: 0, stable: 1, falling: 2 };

  const sorted = [...stats].sort((a, b) => {
    let v: number;
    if (sortKey === 'temp') {
      v = ['hot', 'warm', 'cold'].indexOf(a.temp) - ['hot', 'warm', 'cold'].indexOf(b.temp);
    } else if (sortKey === 'trend') {
      v = trendOrder[a.trend] - trendOrder[b.trend];
    } else {
      v = (a[sortKey] as number) - (b[sortKey] as number);
    }
    return sortAsc ? v : -v;
  });

  const hot = stats.filter((s) => s.temp === 'hot').length;
  const warm = stats.filter((s) => s.temp === 'warm').length;
  const cold = stats.filter((s) => s.temp === 'cold').length;
  const rising = stats.filter((s) => s.trend === 'rising').length;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  }

  const th = (key: SortKey, label: string) => (
    <th
      className="px-3 py-2 text-left text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-800 select-none"
      onClick={() => toggleSort(key)}
    >
      {label} {sortKey === key ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Concursos analisados" value={draws.length} />
        <StatCard label="Dezenas quentes 🔥" value={hot} color="text-red-600" />
        <StatCard label="Dezenas mornas" value={warm} color="text-amber-600" />
        <StatCard label="Dezenas frias 🧊" value={cold} color="text-blue-600" />
      </div>

      {distribution.avgEven > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Média pares/sorteio" value={distribution.avgEven.toFixed(1)} />
          <StatCard label="Média ímpares/sorteio" value={distribution.avgOdd.toFixed(1)} />
          <StatCard label="Média consecutivos" value={distribution.avgConsecutive.toFixed(1)} />
        </div>
      )}

      {/* Repeat & Trend cards */}
      {repeatStats.avgRepeat > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label="Repetição média do sorteio anterior"
            value={`~${repeatStats.avgRepeat.toFixed(1)} dezenas`}
            color="text-indigo-600"
          />
          <StatCard
            label="Dezenas em alta (últimos 15)"
            value={rising}
            color="text-green-600"
          />
          <StatCard
            label="Último sorteio (n° dezenas)"
            value={repeatStats.lastDrawNumbers.length}
          />
        </div>
      )}

      {/* Sum stats */}
      {sumStats.mean > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            📐 Faixa de Soma Histórica
          </h3>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-48">
              <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                {(() => {
                  const min = sumStats.p10;
                  const max = sumStats.p90;
                  const leftPct = (min / (min + max)) * 100;
                  const widthPct = ((max - min) / (min + max)) * 100;
                  return (
                    <div
                      className="absolute top-0 h-full bg-green-400/60 rounded-full"
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    />
                  );
                })()}
                <div
                  className="absolute top-0 h-full w-1 bg-green-600 rounded-full"
                  style={{ left: `${(sumStats.mean / (sumStats.p10 + sumStats.p90)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>P10: {Math.round(sumStats.p10)}</span>
                <span>Média: {Math.round(sumStats.mean)}</span>
                <span>P90: {Math.round(sumStats.p90)}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 text-right">
              <p>Faixa ideal de soma</p>
              <p className="font-bold text-gray-800 text-sm">
                {Math.round(sumStats.p10)} – {Math.round(sumStats.p90)}
              </p>
              <p className="text-gray-400">±{Math.round(sumStats.stdDev)} desvio</p>
            </div>
          </div>
        </div>
      )}

      {/* Range distribution */}
      {rangeDist.slots.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            📊 Distribuição por Faixa (média histórica)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {rangeDist.slots.map((slot) => (
              <div key={slot.label} className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs font-semibold text-gray-600">{slot.label}</p>
                <p className="text-xl font-bold text-gray-800">{slot.avgCount.toFixed(1)}</p>
                <p className="text-[10px] text-gray-400">dezenas/sorteio</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            O gerador tenta equilibrar as combinações respeitando essa distribuição.
          </p>
        </div>
      )}

      {/* Super Sete column stats */}
      {selectedGame.isSuperSete && columnStats.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600">Frequência por Coluna</h3>
          {columnStats.map((col, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-14 shrink-0">Coluna {i + 1}</span>
              <NumberHeatGrid stats={col} />
            </div>
          ))}
        </div>
      )}

      {/* View toggle */}
      {!selectedGame.isSuperSete && (
        <>
          <div className="flex gap-2">
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${view === 'grid' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Grade Visual
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${view === 'table' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Tabela Detalhada
            </button>
          </div>

          {view === 'grid' ? (
            <div>
              <div className="flex gap-4 text-xs mb-2">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Quente</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Morna</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> Fria</span>
              </div>
              <NumberHeatGrid stats={stats} />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {th('number', 'Nº')}
                    {th('frequency', 'Frequência')}
                    {th('delay', 'Atraso')}
                    {th('temp', 'Temperatura')}
                    {th('trend', 'Tendência')}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map((s) => (
                    <tr key={s.number} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 font-mono font-semibold">{s.number.toString().padStart(2, '0')}</td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(s.frequency / Math.max(...stats.map((x) => x.frequency))) * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-600">{s.frequency}x</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-gray-600">{s.delay} concursos</td>
                      <td className="px-3 py-1.5">
                        <TempBadge temp={s.temp} />
                      </td>
                      <td className="px-3 py-1.5">
                        <TrendBadge trend={s.trend} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'text-gray-800' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function TempBadge({ temp }: { temp: 'hot' | 'warm' | 'cold' }) {
  const map = {
    hot: 'bg-red-100 text-red-700',
    warm: 'bg-amber-100 text-amber-700',
    cold: 'bg-blue-100 text-blue-700',
  };
  const label = { hot: '🔥 Quente', warm: '🌡 Morna', cold: '🧊 Fria' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[temp]}`}>
      {label[temp]}
    </span>
  );
}

function TrendBadge({ trend }: { trend: 'rising' | 'stable' | 'falling' }) {
  const map = {
    rising: 'bg-green-100 text-green-700',
    stable: 'bg-gray-100 text-gray-600',
    falling: 'bg-blue-100 text-blue-700',
  };
  const label = { rising: '↑ Em alta', stable: '→ Estável', falling: '↓ Em queda' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[trend]}`}>
      {label[trend]}
    </span>
  );
}
