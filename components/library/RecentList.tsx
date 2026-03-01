'use client'

interface RecentEntry {
  id: number
  norm_title: string
  target_lang: string
  engine: string
}

interface RecentListProps {
  entries: RecentEntry[]
  onSelect: (title: string) => void
}

export default function RecentList({ entries, onSelect }: RecentListProps) {
  if (!entries.length) {
    return (
      <div className="text-[#666980] text-xs p-3">
        Brak wpisów w bibliotece
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
      {entries.map(entry => (
        <div
          key={entry.id}
          className="bg-[#13151f] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-3 cursor-pointer hover:border-[rgba(124,90,240,0.28)] transition-colors"
          onClick={() => onSelect(entry.norm_title)}
        >
          <div className="font-semibold text-xs text-[#dde0ed] break-words" title={entry.norm_title}>
            {entry.norm_title}
          </div>
          <div className="flex gap-1.5 items-center text-[10px] text-[#666980] mt-1 flex-wrap">
            <span className="bg-[rgba(124,90,240,0.14)] text-[#9d7ef5] rounded-full px-1.5 py-0.5 text-[10px] font-bold">
              {entry.target_lang.toUpperCase()}
            </span>
            <span>{entry.engine}</span>
          </div>
        </div>
      ))}
    </div>
  )
}