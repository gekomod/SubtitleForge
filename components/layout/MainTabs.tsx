'use client'
interface MainTabsProps {
  activeTab: 'translate' | 'search' | 'history'
  onTabChange: (tab: 'translate' | 'search' | 'history') => void
}

const TABS = [
  { id:'translate' as const, icon:'bi-film',         label:'Tłumaczenie',    key:'1',
    desc:'Wgraj i przetłumacz napisy' },
  { id:'search'    as const, icon:'bi-search',       label:'Wyszukaj Napisy', key:'2',
    desc:'Pobierz z bazy OpenSubtitles' },
  { id:'history'   as const, icon:'bi-clock-history',label:'Historia',        key:'3',
    desc:'Poprzednie tłumaczenia' },
]

export default function MainTabs({ activeTab, onTabChange }: MainTabsProps) {
  return (
    <nav className="mb-5">
      <div className="flex gap-1 bg-[var(--s1)] border border-[var(--border)] rounded-[var(--rxxl)] p-1.5">
        {TABS.map((t, idx) => {
          const isActive = activeTab === t.id
          return (
            <button key={t.id} onClick={() => onTabChange(t.id)}
              className={`flex-1 relative flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-2 py-2.5 px-3 rounded-[18px] text-sm font-medium transition-all duration-200 group overflow-hidden
                ${isActive
                  ? 'bg-[var(--s3)] text-[var(--text)]'
                  : 'text-[var(--muted)] hover:text-[var(--text2)] hover:bg-[var(--s2)]'}`}>

              {/* Active background shimmer */}
              {isActive && (
                <div className="absolute inset-0 rounded-[18px] pointer-events-none"
                  style={{background:'linear-gradient(135deg,rgba(240,165,0,0.06) 0%,transparent 60%)'}}></div>
              )}

              <div className={`relative w-7 h-7 sm:w-auto sm:h-auto rounded-lg sm:rounded-none flex items-center justify-center sm:block flex-shrink-0
                ${isActive ? 'bg-[var(--adim)] sm:bg-transparent' : ''}`}>
                <i className={`bi ${t.icon} text-sm ${isActive ? 'text-[var(--amber)]' : 'group-hover:text-[var(--text2)]'}`}></i>
              </div>

              <div className="flex-1 text-left min-w-0 hidden sm:block">
                <div className="text-[13px] font-semibold leading-tight">{t.label}</div>
                <div className={`text-[10px] font-mono leading-tight mt-0.5 truncate ${isActive ? 'text-[var(--muted)]' : 'text-[var(--dim)] group-hover:text-[var(--muted)]'}`}>
                  {t.desc}
                </div>
              </div>
              

              {/* Keyboard hint */}
              <span className={`hidden lg:inline font-mono text-[9px] border rounded px-1 py-0.5 ml-auto flex-shrink-0
                ${isActive ? 'border-[var(--adim2)] text-[var(--muted)] bg-[var(--adim)]' : 'border-[var(--border)] text-[var(--dim)]'}`}>
                {t.key}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-1.5 left-1/2 sm:left-3 -translate-x-1/2 sm:translate-x-0 w-6 sm:w-3 h-0.5 bg-[var(--amber)] rounded-full"
                  style={{boxShadow:'0 0 8px rgba(240,165,0,0.7)'}}></div>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
