import { useState } from 'react';
import { useVagasStore } from './store/useVagasStore';
import { PerfilTab } from './tabs/PerfilTab';
import { BuscarTab } from './tabs/BuscarTab';
import { CandidaturasTab } from './tabs/CandidaturasTab';
import { CartaTab } from './tabs/CartaTab';
import { User, Search, KanbanSquare, FileText } from 'lucide-react';

type Tab = 'perfil' | 'buscar' | 'candidaturas' | 'carta';

export function VagasApp() {
  const [tab, setTab] = useState<Tab>('buscar');
  const { candidaturas, perfil } = useVagasStore();

  const totais = {
    entrevistas: candidaturas.filter(c => c.status === 'entrevista').length,
    aplicados: candidaturas.filter(c => c.status === 'aplicado').length,
    total: candidaturas.length,
  };

  const profileComplete = [
    perfil.nome, perfil.email, perfil.telefone, perfil.cidade,
    perfil.resumo, perfil.habilidades.length > 0,
  ].filter(Boolean).length;
  const profilePct = Math.round((profileComplete / 6) * 100);

  const TABS = [
    { id: 'buscar' as Tab, label: 'Buscar Vagas', icon: Search, badge: 0 },
    { id: 'candidaturas' as Tab, label: 'Candidaturas', icon: KanbanSquare, badge: totais.entrevistas },
    { id: 'carta' as Tab, label: 'Carta', icon: FileText, badge: 0 },
    { id: 'perfil' as Tab, label: 'Perfil', icon: User, badge: profilePct < 60 ? 1 : 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white leading-tight">Vagas Automatizada</h1>
          <p className="text-xs text-gray-500">Engenheiro Civil</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {totais.total > 0 && (
            <>
              <span>{totais.total} vagas</span>
              {totais.entrevistas > 0 && (
                <span className="bg-yellow-600 text-yellow-100 px-2 py-0.5 rounded-full font-medium">
                  {totais.entrevistas} entrevista{totais.entrevistas > 1 ? 's' : ''}
                </span>
              )}
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto pb-20">
        <div className="max-w-4xl mx-auto p-4">
          {tab === 'buscar' && <BuscarTab />}
          {tab === 'candidaturas' && <CandidaturasTab />}
          {tab === 'carta' && <CartaTab />}
          {tab === 'perfil' && <PerfilTab />}
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex">
        {TABS.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 relative transition-colors ${
              tab === id ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className="relative">
              <Icon size={20} strokeWidth={tab === id ? 2.5 : 1.5} />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-black text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {badge}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">{label}</span>
            {tab === id && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-blue-400 rounded-t" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
