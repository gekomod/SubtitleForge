'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import MainTabs from '@/components/layout/MainTabs'
import LibraryBanner from '@/components/library/LibraryBanner'
import TranslateTab from '@/components/tabs/TranslateTab'
import SearchTab from '@/components/tabs/SearchTab'
import HistoryTab from '@/components/tabs/HistoryTab'
import Footer from '@/components/layout/Footer'
import CacheStats from '@/components/ui/CacheStats'
import { useTranslationStore } from '@/lib/store/translationStore'
import { useKeyboardShortcuts } from '@/lib/utils/useKeyboardShortcuts'

type Tab = 'translate' | 'search' | 'history'

export default function Home() {
  const [tab, setTab] = useState<Tab>('translate')
  const { totalTranslations, loadTotalTranslations } = useTranslationStore()

  useEffect(() => { loadTotalTranslations() }, [loadTotalTranslations])

  useKeyboardShortcuts({
    onTab1: () => setTab('translate'),
    onTab2: () => setTab('search'),
    onTab3: () => setTab('history'),
  })

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-6 pb-16">
      <Header totalTranslations={totalTranslations} />
      <LibraryBanner />
      <MainTabs activeTab={tab} onTabChange={setTab} />

      {/* Cache stats — subtle indicator */}
      <div className="flex justify-end mb-3">
        <CacheStats />
      </div>

      <div>
        {tab === 'translate' && <TranslateTab />}
        {tab === 'search'    && <SearchTab />}
        {tab === 'history'   && <HistoryTab />}
      </div>

      <Footer />
    </div>
  )
}
