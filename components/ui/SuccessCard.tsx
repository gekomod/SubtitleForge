'use client'

interface SuccessCardProps {
  blocks: number
  elapsedTime: string
  downloadUrl: string
  onReset: () => void
}

export default function SuccessCard({ blocks, elapsedTime, downloadUrl, onReset }: SuccessCardProps) {
  return (
    <div className="success-card">
      <i className="bi bi-check-circle-fill text-5xl text-green block mb-3.5"></i>
      <h4 className="text-2xl font-extrabold mb-1.5">Tłumaczenie gotowe!</h4>
      <p className="text-muted text-sm mb-6">
        {blocks} bloków przetłumaczono w {elapsedTime}
      </p>
      <div>
        <a href={downloadUrl} className="btn-dl" download>
          <i className="bi bi-download"></i> Pobierz
        </a>
        <button className="btn-reset" onClick={onReset}>
          Nowe tłumaczenie
        </button>
      </div>
    </div>
  )
}