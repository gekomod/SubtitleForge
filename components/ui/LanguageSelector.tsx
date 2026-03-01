'use client'

interface LanguageSelectorProps {
  sourceLang: string
  targetLang: string
  onSourceChange: (lang: string) => void
  onTargetChange: (lang: string) => void
  detectedLang?: string
}

const LANGUAGES = [
  { value: 'auto', label: '🔍 Wykryj automatycznie' },
  { value: 'en', label: '🇬🇧 Angielski' },
  { value: 'pl', label: '🇵🇱 Polski' },
  { value: 'de', label: '🇩🇪 Niemiecki' },
  { value: 'fr', label: '🇫🇷 Francuski' },
  { value: 'es', label: '🇪🇸 Hiszpański' },
  { value: 'it', label: '🇮🇹 Włoski' },
  { value: 'ru', label: '🇷🇺 Rosyjski' },
  { value: 'uk', label: '🇺🇦 Ukraiński' },
  { value: 'cs', label: '🇨🇿 Czeski' },
  { value: 'sk', label: '🇸🇰 Słowacki' },
]

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'Angielski',
  pl: 'Polski',
  de: 'Niemiecki',
  fr: 'Francuski',
  es: 'Hiszpański',
  it: 'Włoski',
  ru: 'Rosyjski',
  uk: 'Ukraiński',
  cs: 'Czeski',
  sk: 'Słowacki',
}

const TARGET_LANGUAGES = LANGUAGES.filter(l => l.value !== 'auto')

export default function LanguageSelector({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  detectedLang,
}: LanguageSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3.5">
      <div className="lang-item">
        <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#666980] mb-1.5">
          <i className="bi bi-arrow-right-circle text-[#7c5af0] text-xs"></i>
          Z języka
          {sourceLang === 'auto' && (
            <span className="bg-[#7c5af0] text-white py-0.5 px-2 rounded-full text-[9px] font-bold ml-1.5 uppercase tracking-normal">
              AUTO
            </span>
          )}
        </label>
        <select
          className="w-full p-3 border border-[rgba(255,255,255,0.07)] rounded-[14px] bg-[#13151f] text-[#dde0ed] text-sm cursor-pointer transition-colors duration-180 appearance-none focus:border-[#7c5af0] focus:outline-none"
          value={sourceLang}
          onChange={(e) => onSourceChange(e.target.value)}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24'%3E%3Cpath fill='%23666980' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center'
          }}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div className="lang-item">
        <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#666980] mb-1.5">
          <i className="bi bi-arrow-left-circle text-[#7c5af0] text-xs"></i>
          Na język
        </label>
        <select
          className="w-full p-3 border border-[rgba(255,255,255,0.07)] rounded-[14px] bg-[#13151f] text-[#dde0ed] text-sm cursor-pointer transition-colors duration-180 appearance-none focus:border-[#7c5af0] focus:outline-none"
          value={targetLang}
          onChange={(e) => onTargetChange(e.target.value)}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24'%3E%3Cpath fill='%23666980' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center'
          }}
        >
          {TARGET_LANGUAGES.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
