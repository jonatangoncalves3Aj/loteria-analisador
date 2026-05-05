import { useNavigate, useLocation } from 'react-router-dom'

// 5 tabs principais — os demais acessíveis via Home
const TABS = [
  { path: '/',        emoji: '🏠', label: 'Início'   },
  { path: '/routine', emoji: '🔄', label: 'Rotina'   },
  { path: '/goals',   emoji: '🎯', label: 'Metas'    },
  { path: '/journal', emoji: '📊', label: 'Diário'   },
  { path: '/affirmations', emoji: '🃏', label: 'Forja' },
]

export default function NavBar() {
  const navigate    = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-forja-surface/90 backdrop-blur-lg border-t border-white/5">
      <div className="flex justify-around items-center px-1 py-2 max-w-lg mx-auto">
        {TABS.map(tab => {
          const active = pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 min-w-0
                ${active
                  ? 'bg-forja-primary/15 text-forja-primary'
                  : 'text-forja-muted hover:text-forja-text'
                }`}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
