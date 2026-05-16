import { useState, useEffect } from 'react';
import { useVagasStore } from './store/useVagasStore';
import { PerfilTab } from './tabs/PerfilTab';
import { BuscarTab } from './tabs/BuscarTab';
import { CandidaturasTab } from './tabs/CandidaturasTab';
import { CartaTab } from './tabs/CartaTab';
import { User, Search, KanbanSquare, FileText, Download, X } from 'lucide-react';

type Tab = 'perfil' | 'buscar' | 'candidaturas' | 'carta';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function VagasApp() {
  const [tab, setTab] = useState<Tab>('buscar');
  const { candidaturas, perfil } = useVagasStore();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);
    setIsStandalone(standalone);

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      if (!standalone) setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show iOS banner after 3s if not installed
    if (ios && !standalone) {
      const t = setTimeout(() => setShowInstallBanner(true), 3000);
      return () => { clearTimeout(t); window.removeEventListener('beforeinstallprompt', handler); };
    }
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') { setInstallPrompt(null); setShowInstallBanner(false); }
    }
  };

  const totais = {
    entrevistas: candidaturas.filter(c => c.status === 'entrevista').length,
    total: candidaturas.length,
  };

  const profilePct = [
    perfil.nome, perfil.email, perfil.telefone, perfil.cidade,
    perfil.resumo, perfil.habilidades.length > 0,
  ].filter(Boolean).length;

  const TABS = [
    { id: 'buscar' as Tab,       label: 'Buscar',        icon: Search,       badge: 0 },
    { id: 'candidaturas' as Tab, label: 'Candidaturas',  icon: KanbanSquare, badge: totais.entrevistas },
    { id: 'carta' as Tab,        label: 'Carta',         icon: FileText,     badge: 0 },
    { id: 'perfil' as Tab,       label: 'Perfil',        icon: User,         badge: profilePct < 4 ? 1 : 0 },
  ];

  return (
    <div className="min-h-screen min-h-dvh bg-gray-950 text-white flex flex-col select-none">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 flex items-center justify-between"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: '12px' }}>
        <div>
          <h1 className="text-sm font-bold text-white leading-tight">Vagas Automatizada</h1>
          <p className="text-[11px] text-gray-500">Engenheiro Civil</p>
        </div>
        <div className="flex items-center gap-2">
          {totais.total > 0 && (
            <span className="text-xs text-gray-500">{totais.total} vagas</span>
          )}
          {totais.entrevistas > 0 && (
            <span className="bg-yellow-600 text-yellow-100 text-[11px] px-2 py-0.5 rounded-full font-semibold">
              {totais.entrevistas} entrevista{totais.entrevistas > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      {/* Install banner — Android */}
      {showInstallBanner && !isIOS && installPrompt && !isStandalone && (
        <div className="bg-blue-900/90 border-b border-blue-800 px-4 py-3 flex items-center gap-3 fade-in">
          <Download size={16} className="text-blue-300 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-100">Instalar no celular</p>
            <p className="text-[11px] text-blue-400">Acesse como um app, funciona offline</p>
          </div>
          <button onClick={handleInstall} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium flex-shrink-0">
            Instalar
          </button>
          <button onClick={() => setShowInstallBanner(false)} className="text-blue-500">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Install banner — iOS */}
      {showInstallBanner && isIOS && !isStandalone && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 fade-in">
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0">📲</span>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-200">Instalar no iPhone</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong>
              </p>
            </div>
            <button onClick={() => setShowInstallBanner(false)} className="text-gray-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Content — padding-bottom accounts for bottom nav + safe area */}
      <main className="flex-1 overflow-auto pb-safe overscroll-none">
        <div className="max-w-2xl mx-auto p-4">
          {tab === 'buscar'       && <BuscarTab />}
          {tab === 'candidaturas' && <CandidaturasTab />}
          {tab === 'carta'        && <CartaTab />}
          {tab === 'perfil'       && <PerfilTab />}
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 flex safe-bottom z-40">
        {TABS.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 pt-3 pb-2 relative transition-colors active:bg-gray-800/50 ${
              tab === id ? 'text-blue-400' : 'text-gray-600'
            }`}
          >
            <span className="relative">
              <Icon size={22} strokeWidth={tab === id ? 2.5 : 1.8} />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {badge}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">{label}</span>
            {tab === id && (
              <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-blue-400 rounded-b" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
