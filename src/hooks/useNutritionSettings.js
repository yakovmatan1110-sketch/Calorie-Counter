import { useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import {
  defaultNutritionSettings,
  normalizeNutritionSettings,
} from '../lib/nutrition'

function userNutritionSettingsDoc(uid) {
  return doc(db, 'users', uid, 'settings', 'nutrition')
}

export function useNutritionSettings(uid, { onError } = {}) {
  const [nutritionSettings, setNutritionSettings] = useState(defaultNutritionSettings)
  const [nutritionForm, setNutritionForm] = useState(defaultNutritionSettings)

  useEffect(() => {
    if (!uid) {
      return undefined
    }

    const settingsRef = userNutritionSettingsDoc(uid)

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const loadedSettings = normalizeNutritionSettings(snapshot.data())
          setNutritionSettings(loadedSettings)
          setNutritionForm(loadedSettings)
          return
        }

        setNutritionSettings(defaultNutritionSettings)
        setNutritionForm(defaultNutritionSettings)
        void setDoc(settingsRef, defaultNutritionSettings, { merge: true })
      },
      (error) => {
        console.error(error)
        onError?.('Could not load nutrition settings right now.')
      },
    )

    return unsubscribe
  }, [uid, onError])

  const showGoalTracking = nutritionSettings.trackingMode === 'goal_tracking'

  const saveNutritionSettings = async (nextSettings) => {
    if (!uid) {
      return false
    }

    try {
      await setDoc(userNutritionSettingsDoc(uid), nextSettings, { merge: true })
      return true
    } catch (error) {
      console.error(error)
      onError?.('Could not save nutrition settings right now.')
      return false
    }
  }

  function applyNutritionSettings(nextSettings) {
    setNutritionSettings(nextSettings)
    setNutritionForm(nextSettings)
    void saveNutritionSettings(nextSettings)
  }

  function handleTrackingModeChange(nextMode) {
    applyNutritionSettings(
      normalizeNutritionSettings({
        ...nutritionForm,
        trackingMode: nextMode,
      }),
    )
  }

  function handleNutritionFormChange(event) {
    const { name, value } = event.target

    setNutritionForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleNutritionFormSubmit(event) {
    event.preventDefault()
    applyNutritionSettings(normalizeNutritionSettings(nutritionForm))
  }

  const trackingModeLabel = useMemo(
    () => (showGoalTracking ? 'Goal Tracking' : 'Tracking Only'),
    [showGoalTracking],
  )

  return {
    nutritionSettings,
    nutritionForm,
    showGoalTracking,
    trackingModeLabel,
    handleNutritionFormChange,
    handleNutritionFormSubmit,
    handleTrackingModeChange,
  }
}
