'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import MainTabs from '@/components/layout/MainTabs'
import LibraryBanner from '@/components/library/LibraryBanner'
import TranslateTab from '@/components/tabs/TranslateTab'
import SearchTab from '@/components/tabs/SearchTab'
import HistoryTab from '@/components/tabs/HistoryTab'
import Footer from '@/components/layout/Footer'
import { useTranslationStore } from '@/lib/store/translationStore'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'translate' | 'search' | 'history'>('translate')
  const { totalTranslations, loadTotalTranslations } = useTranslationStore()

  useEffect(() => {
    loadTotalTranslations()
  }, [loadTotalTranslations])

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-7 pb-16">
      <Header totalTranslations={totalTranslations} />
      
      <LibraryBanner />
      
      <MainTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="mt-5">
        {activeTab === 'translate' && <TranslateTab />}
        {activeTab === 'search' && <SearchTab />}
        {activeTab === 'history' && <HistoryTab />}
      </div>
      
      <Footer />
    </div>
  )
}