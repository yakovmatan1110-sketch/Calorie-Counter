const variantClassMap = {
  primary: 'icon-button primary',
  secondary: 'icon-button secondary',
  ghost: 'icon-button ghost',
  danger: 'icon-button danger',
}

export function IconButton({
  label,
  variant = 'ghost',
  className = '',
  children,
  type = 'button',
  ...props
}) {
  const variantClass = variantClassMap[variant] ?? variantClassMap.ghost

  return (
    <button
      type={type}
      aria-label={label}
      className={`${variantClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
