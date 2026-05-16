import { useState } from 'react';
import { PCPApp } from './pcp/PCPApp';
import { LoteriaApp } from './loteria/LoteriaApp';
import MentalApp from './mental/App.jsx';
import { VagasApp } from './vagas/VagasApp';

type View = 'pcp' | 'loteria' | 'mental' | 'vagas';

export default function App() {
  const [view, setView] = useState<View>('vagas');

  return (
    <div className={view === 'mental' ? '' : undefined}>
      <div className="flex gap-1 p-2 bg-gray-800 text-xs">
        <NavBtn label="💼 Vagas"   active={view === 'vagas'}   onClick={() => setView('vagas')}   />
        <NavBtn label="🎰 Loteria" active={view === 'loteria'} onClick={() => setView('loteria')} />
        <NavBtn label="📋 PCP"     active={view === 'pcp'}     onClick={() => setView('pcp')}     />
        <NavBtn label="🧠 Mental"  active={view === 'mental'}  onClick={() => setView('mental')}  />
      </div>
      {view === 'vagas'   && <VagasApp />}
      {view === 'loteria' && <LoteriaApp />}
      {view === 'pcp'     && <PCPApp />}
      {view === 'mental'  && <MentalApp />}
    </div>
  );
}

function NavBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded font-medium transition-colors ${
        active ? 'bg-white text-gray-800' : 'text-gray-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}
