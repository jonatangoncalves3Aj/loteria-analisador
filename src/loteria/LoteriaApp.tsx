import { useEffect } from 'react';
import { useLoteriaStore } from './store/useLoteriaStore';
import { GameSelector } from './components/GameSelector';
import { StatsPanel } from './components/StatsPanel';
import { CombinationCard } from './components/CombinationCard';
import { getDrawDaysLabel } from './utils/drawSchedule';

export function LoteriaApp() {
  const {
    selectedGame,
    draws,
    loading,
    error,
    combinations,
    combinationCount,
    activeTab,
    historySize,
    targetDateInput,
    resolvedDrawDate,
    loadHistory,
    generateCombs,
    setCombinationCount,
    setActiveTab,
    setHistorySize,
    setTargetDate,
  } = useLoteriaStore();

  useEffect(() => {
    if (draws.length === 0 && !loading) loadHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">🎰 Analisador de Loteria</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Estatísticas e combinações baseadas nos resultados da Caixa Econômica Federal
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={historySize}
              onChange={(e) => setHistorySize(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700"
              disabled={loading}
            >
              <option value={50}>50 concursos</option>
              <option value={100}>100 concursos</option>
              <option value={200}>200 concursos</option>
              <option value={500}>500 concursos</option>
            </select>
            <select
              value={combinationCount}
              onChange={(e) => setCombinationCount(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} combinaç{n === 1 ? 'ão' : 'ões'}</option>
              ))}
            </select>
            <button
              onClick={generateCombs}
              disabled={loading || draws.length === 0}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                loading || draws.length === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : `${selectedGame.bgColor} text-white hover:opacity-90 shadow-sm`
              }`}
            >
              ✨ Gerar Combinações
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Game selector */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Jogo</h2>
          <GameSelector />
        </section>

        {/* Date picker */}
        <section className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-48">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                📅 Data do sorteio desejado
              </label>
              <input
                type="date"
                value={targetDateInput}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300"
              />
              <p className="text-xs text-gray-400 mt-1">
                {selectedGame.name} sorteios: {getDrawDaysLabel(selectedGame)}
              </p>
            </div>
            <div className={`flex-1 min-w-48 rounded-xl p-3 ${selectedGame.bgColor} text-white`}>
              <p className="text-xs font-medium text-white/70">Próximo sorteio para essa data</p>
              <p className="text-sm font-bold mt-0.5 capitalize">{resolvedDrawDate}</p>
              <p className="text-xs text-white/70 mt-1">
                As combinações serão geradas para este sorteio
              </p>
            </div>
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
            <Spinner />
            <span className="text-sm">Carregando histórico de concursos...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
            <span>⚠️</span>
            <div>
              <p className="font-medium">Erro ao carregar dados</p>
              <p className="text-xs mt-0.5">{error}</p>
              <button onClick={loadHistory} className="mt-2 text-xs underline hover:no-underline">
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Main content */}
        {!loading && draws.length > 0 && (
          <>
            {/* Last draw info */}
            <div className={`${selectedGame.bgColor} rounded-xl p-4 text-white`}>
              <p className="text-xs font-medium text-white/70">Último concurso analisado</p>
              <p className="text-lg font-bold mt-0.5">
                {selectedGame.name} — Concurso {draws[0]?.contest}
              </p>
              <p className="text-sm text-white/80">{draws[0]?.date}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {draws[0]?.numbers.slice(0, selectedGame.isSuperSete ? 7 : undefined).map((n, i) => (
                  <span key={i} className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {selectedGame.isSuperSete ? `C${i + 1}:${n}` : n.toString().padStart(2, '0')}
                  </span>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex gap-4">
                {(['stats', 'combinations'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? `border-current ${selectedGame.color}`
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'stats' ? '📊 Estatísticas' : `🎯 Combinações${combinations.length > 0 ? ` (${combinations.length})` : ''}`}
                  </button>
                ))}
              </nav>
            </div>

            {activeTab === 'stats' && <StatsPanel />}

            {activeTab === 'combinations' && (
              <div>
                {combinations.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-4xl mb-3">🎲</p>
                    <p className="text-sm font-medium text-gray-500">
                      Sorteio selecionado: <span className="capitalize">{resolvedDrawDate}</span>
                    </p>
                    <p className="text-xs mt-2">Clique em "Gerar Combinações" para criar sugestões para este sorteio.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 mb-3 capitalize">
                      🗓 Combinações para o sorteio de: <strong>{combinations[0]?.targetDate}</strong>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {combinations.map((combo, i) => (
                        <CombinationCard key={i} combination={combo} index={i} game={selectedGame} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="text-center py-6 text-xs text-gray-400 px-4">
        ⚠️ Este app é apenas para fins informativos. Jogos de loteria envolvem sorte e não há garantia de acerto.
        Jogue com responsabilidade.
      </footer>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
