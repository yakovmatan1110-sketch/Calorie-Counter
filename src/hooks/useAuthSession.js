import { useEffect, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth } from '../firebase'

const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({
  prompt: 'select_account',
})

export function useAuthSession() {
  const [currentUser, setCurrentUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)
  const [authMessage, setAuthMessage] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setAuthReady(true)
    })

    return unsubscribe
  }, [])

  async function signInWithGoogle() {
    setAuthBusy(true)
    setAuthMessage('')

    try {
      await signInWithPopup(auth, googleProvider)
      return true
    } catch (error) {
      console.error(error)
      setAuthMessage('Google sign-in did not complete. Please try again.')
      return false
    } finally {
      setAuthBusy(false)
    }
  }

  async function signOutUser() {
    setAuthBusy(true)
    setAuthMessage('')

    try {
      await signOut(auth)
      return true
    } catch (error) {
      console.error(error)
      setAuthMessage('Could not sign out right now. Please try again.')
      return false
    } finally {
      setAuthBusy(false)
    }
  }

  return {
    currentUser,
    authReady,
    authBusy,
    authMessage,
    setAuthMessage,
    signInWithGoogle,
    signOutUser,
  }
}
