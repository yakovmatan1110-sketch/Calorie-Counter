export function Pill({ children, variant = 'default', className = '' }) {
  return <span className={`pill ${variant} ${className}`.trim()}>{children}</span>
}
