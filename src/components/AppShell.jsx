export function AppShell({
  eyebrow = "Today's nutrition",
  title = 'Calorie Compass',
  authSlot,
  children,
  bottomNav,
  floatingActionButton,
}) {
  return (
    <div className="app-shell">
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <header className="topbar">
        <div className="topbar-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>

        <div className="auth-bar">{authSlot}</div>
      </header>

      <main className="app-main">{children}</main>

      {bottomNav}
      {floatingActionButton}
    </div>
  )
}
