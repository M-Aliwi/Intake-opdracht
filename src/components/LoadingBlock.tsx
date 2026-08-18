export function LoadingBlock({ label = 'Laden…' }: { label?: string }) {
  return (
    <div className="loading-block" role="status" aria-live="polite">
      <span className="spinner" aria-hidden />
      {label}
    </div>
  )
}
