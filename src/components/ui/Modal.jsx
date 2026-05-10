import { Card } from './Card'
import { IconButton } from './IconButton'
import { CloseIcon } from '../icons'

export function Modal({
  open,
  title,
  kicker,
  onClose,
  className = '',
  children,
  actions,
  labelledBy,
}) {
  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <Card
        as="section"
        className={`entry-modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            {kicker ? <p className="section-kicker">{kicker}</p> : null}
            <h3 id={labelledBy}>{title}</h3>
          </div>
          <IconButton label="Close dialog" variant="ghost" onClick={onClose}>
            <CloseIcon className="modal-close-icon" />
          </IconButton>
        </div>

        {children}

        {actions ? <div className="modal-actions">{actions}</div> : null}
      </Card>
    </div>
  )
}
