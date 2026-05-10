import { PlusIcon } from './icons'

export function FloatingActionButton({ onClick, label = 'Add food' }) {
  return (
    <button type="button" className="fab" onClick={onClick} aria-label={label}>
      <PlusIcon className="fab-icon" />
    </button>
  )
}
