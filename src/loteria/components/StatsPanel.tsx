import { useState } from 'react';
import { useLoteriaStore } from '../store/useLoteriaStore';
import { NumberHeatGrid } from './NumberHeatGrid';

type SortKey = 'number' | 'frequency' | 'delay' | 'temp';

export function StatsPanel() {
  const { stats, draws, selectedGame, distribution, columnStats } = useLoteriaStore();
  const [sortKey, setSortKey] = useState<SortKey>('frequency');
  const [sortAsc, setSortAsc] = useState(false);
  const [view, setView] = useState<'grid' | 'table'>('grid');

  if (stats.length === 0) return null;

  const sorted = [...stats].sort((a, b) => {
    const v = sortKey === 'temp'
      ? (['hot', 'warm', 'cold'].indexOf(a.temp) - ['hot', 'warm', 'cold'].indexOf(b.temp))
      : (a[sortKey] as number) - (b[sortKey] as number);
    return sortAsc ? v : -v;
  });

  const hot = stats.filter((s) => s.temp === 'hot').length;
  const warm = stats.filter((s) => s.temp === 'warm').length;
  const cold = stats.filter((s) => s.temp === 'cold').length;

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
