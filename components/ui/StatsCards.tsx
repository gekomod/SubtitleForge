'use client'
const fmt = (n:number) => n.toLocaleString('pl-PL')
export default function StatsCards({ blocks, chars, estTime }: { blocks:number; chars:number; estTime:string }) {
  const stats = [
    { icon:'bi-collection-play', label:'Bloków',      value:fmt(blocks), accent:'#f5a623', sub:'klatki dialogu' },
    { icon:'bi-type',            label:'Znaków ~',    value:fmt(chars),  accent:'#4a9eff', sub:'do tłumaczenia' },
    { icon:'bi-lightning-charge',label:'Szac. czas',  value:estTime,     accent:'#2bbd7e', sub:'przy śr. prędkości' },
  ]
  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((s,i) => (
        <div key={i} className="bg-[var(--s2)] rounded-xl p-2.5 border border-[var(--border)] hover:border-[var(--border2)] transition-all duration-200">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background:`${s.accent}18` }}>
              <i className={`bi ${s.icon} text-[10px]`} style={{ color:s.accent }}></i>
            </div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--muted)]">{s.label}</span>
          </div>
          <div className="font-mono text-sm font-bold text-[var(--text)] leading-none">{s.value}</div>
          <div className="text-[9px] text-[var(--muted)] mt-0.5 truncate">{s.sub}</div>
        </div>
      ))}
    </div>
  )
}
