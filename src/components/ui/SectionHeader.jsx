export function SectionHeader({
  kicker,
  title,
  subtitle,
  actions,
  titleAs: TitleTag = 'h2',
  className = '',
}) {
  return (
    <div className={`section-header ${className}`.trim()}>
      <div className="section-header-copy">
        {kicker ? <p className="section-kicker">{kicker}</p> : null}
        <TitleTag>{title}</TitleTag>
        {subtitle ? <p className="section-text">{subtitle}</p> : null}
      </div>
      {actions ? <div className="section-header-actions">{actions}</div> : null}
    </div>
  )
}
