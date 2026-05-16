import { useState } from 'react';
import { useVagasStore } from './store/useVagasStore';
import { PerfilTab } from './tabs/PerfilTab';
import { BuscarTab } from './tabs/BuscarTab';
import { CandidaturasTab } from './tabs/CandidaturasTab';
import { CartaTab } from './tabs/CartaTab';

type Tab = 'perfil' | 'buscar' | 'candidaturas' | 'carta';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'perfil', label: 'Perfil', emoji: '👤' },
  { id: 'buscar', label: 'Buscar Vagas', emoji: '🔍' },
  { id: 'candidaturas', label: 'Candidaturas', emoji: '📋' },
  { id: 'carta', label: 'Carta', emoji: '✉️' },
];

export function VagasApp() {
  const [tab, setTab] = useState<Tab>('buscar');
  const { candidaturas } = useVagasStore();

  const entrevistas = candidaturas.filter(c => c.status === 'entrevista').length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <h2 className="text-sm font-bold text-white mb-1">Vagas — Engenheiro Civil</h2>
        <div className="flex gap-1 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                tab === t.id ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {t.emoji} {t.label}
              {t.id === 'candidaturas' && entrevistas > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {entrevistas}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {tab === 'perfil' && <PerfilTab />}
        {tab === 'buscar' && <BuscarTab />}
        {tab === 'candidaturas' && <CandidaturasTab />}
        {tab === 'carta' && <CartaTab />}
      </div>
    </div>
  );
}
