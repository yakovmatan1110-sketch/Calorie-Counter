import { useState } from 'react'
import './App.css'
import { SessionWorkspace } from './components/SessionWorkspace'
import { ActionButton, Card } from './components/ui'
import { useAuthSession } from './hooks/useAuthSession'
import { getUserLabel } from './lib/nutrition'

function App() {
  const [activeTab, setActiveTab] = useState('home')

  const {
    currentUser,
    authReady,
    authBusy,
    authMessage,
    setAuthMessage,
    signInWithGoogle,
    signOutUser,
  } = useAuthSession()

  const signedIn = Boolean(currentUser)
  const resolvedTab = signedIn ? activeTab : 'profile'

  async function handleSignIn() {
    const didSignIn = await signInWithGoogle()

    if (didSignIn) {
      setActiveTab('home')
    }

    return didSignIn
  }

  async function handleSignOut() {
    const didSignOut = await signOutUser()

    if (didSignOut) {
      setActiveTab('profile')
    }

    return didSignOut
  }

  const authSlot = authReady ? (
    signedIn ? (
      <button type="button" className="user-chip" onClick={() => setActiveTab('profile')}>
        {currentUser.photoURL ? (
          <img className="user-avatar" src={currentUser.photoURL} alt="" aria-hidden="true" />
        ) : (
          <span className="user-avatar fallback" aria-hidden="true">
            {getUserLabel(currentUser).slice(0, 1).toUpperCase()}
          </span>
        )}
        <span>{getUserLabel(currentUser)}</span>
      </button>
    ) : (
      <ActionButton variant="ghost" className="strong" onClick={() => setActiveTab('profile')}>
        Sign in
      </ActionButton>
    )
  ) : null

  if (!authReady) {
    return (
      <div className="app-shell">
        <div className="ambient ambient-left" aria-hidden="true" />
        <div className="ambient ambient-right" aria-hidden="true" />

        <main className="app-main">
          <Card as="section" className="loading-surface">
            <p className="section-kicker">Preparing your session</p>
            <h2>Loading your saved calorie tracker.</h2>
            <p className="section-text">
              We are checking your Firebase login so your meals can load back in after a refresh.
            </p>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <SessionWorkspace
      key={currentUser?.uid || 'guest'}
      authSlot={authSlot}
      currentUser={currentUser}
      activeTab={resolvedTab}
      setActiveTab={setActiveTab}
      authBusy={authBusy}
      authMessage={authMessage}
      setAuthMessage={setAuthMessage}
      onSignIn={handleSignIn}
      onSignOut={handleSignOut}
    />
  )
}

export default App
