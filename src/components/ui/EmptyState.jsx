import { Card } from './Card'

export function EmptyState({ kicker, title, body, actions, className = '' }) {
  return (
    <Card as="div" className={`empty-state ${className}`.trim()}>
      {kicker ? <p className="section-kicker">{kicker}</p> : null}
      {title ? <h3>{title}</h3> : null}
      {body ? <p className="section-text">{body}</p> : null}
      {actions ? <div className="empty-state-actions">{actions}</div> : null}
    </Card>
  )
}
