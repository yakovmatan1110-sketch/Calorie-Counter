export function StatChip({ value, label, className = '' }) {
  return (
    <div className={`stat-chip ${className}`.trim()}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}
