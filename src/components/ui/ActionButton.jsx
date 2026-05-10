const variantClassMap = {
  primary: 'primary-button',
  secondary: 'secondary-button',
  ghost: 'ghost-button',
  danger: 'danger-button',
}

export function ActionButton({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...props
}) {
  const variantClass = variantClassMap[variant] ?? variantClassMap.primary

  return (
    <button type={type} className={`${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}
