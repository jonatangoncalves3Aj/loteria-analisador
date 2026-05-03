import { useState } from 'react';
import { PCPApp } from './pcp/PCPApp';
import { LoteriaApp } from './loteria/LoteriaApp';

type View = 'pcp' | 'loteria';

export default function App() {
  const [view, setView] = useState<View>('loteria');

  return (
    <div>
      <div className="flex gap-1 p-2 bg-gray-800 text-xs">
        <NavBtn label="🎰 Loteria" active={view === 'loteria'} onClick={() => setView('loteria')} />
        <NavBtn label="📋 PCP" active={view === 'pcp'} onClick={() => setView('pcp')} />
      </div>
      {view === 'loteria' ? <LoteriaApp /> : <PCPApp />}
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
