'use client'

interface MainTabsProps {
  activeTab: 'translate' | 'search' | 'history'
  onTabChange: (tab: 'translate' | 'search' | 'history') => void
}

export default function MainTabs({ activeTab, onTabChange }: MainTabsProps) {
  return (
    <div className="main-tabs">
      <button
        className={`main-tab ${activeTab === 'translate' ? 'active' : ''}`}
        onClick={() => onTabChange('translate')}
      >
        <i className="bi bi-translate"></i>
        Tłumaczenie
      </button>
      <button
        className={`main-tab ${activeTab === 'search' ? 'active' : ''}`}
        onClick={() => onTabChange('search')}
      >
        <i className="bi bi-search"></i>
        Wyszukaj napisy
      </button>
      <button
        className={`main-tab ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => onTabChange('history')}
      >
        <i className="bi bi-clock-history"></i>
        Historia
      </button>
    </div>
  )
}