import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { getMealTotals, groupMeals, normalizeMeal, sortMealsByCreatedAt } from '../lib/nutrition'

function userMealsCollection(uid) {
  return collection(db, 'users', uid, 'meals')
}

function userMealDoc(uid, mealId) {
  return doc(db, 'users', uid, 'meals', mealId)
}

export function useUserMeals(uid) {
  const [entries, setEntries] = useState([])
  const [isLoadingMeals, setIsLoadingMeals] = useState(() => Boolean(uid))

  useEffect(() => {
    if (!uid) {
      return undefined
    }

    const mealsRef = userMealsCollection(uid)

    const unsubscribe = onSnapshot(
      mealsRef,
      (snapshot) => {
        const loadedMeals = snapshot.docs.map(normalizeMeal)
        setEntries(sortMealsByCreatedAt(loadedMeals))
        setIsLoadingMeals(false)
      },
      (error) => {
        console.error(error)
        setIsLoadingMeals(false)
        alert('Could not load meals from Firebase')
      },
    )

    return unsubscribe
  }, [uid])

  const totals = useMemo(() => getMealTotals(entries), [entries])
  const groupedMeals = useMemo(() => groupMeals(entries), [entries])

  function getEntryById(entryId) {
    return entries.find((entry) => entry.id === entryId)
  }

  async function addMeal(payload) {
    if (!uid) {
      return false
    }

    try {
      await addDoc(userMealsCollection(uid), payload)
      return true
    } catch (error) {
      console.error(error)
      alert('Could not save this meal to Firebase')
      return false
    }
  }

  async function updateMeal(entryId, payload) {
    if (!uid) {
      return false
    }

    try {
      const mealDocRef = userMealDoc(uid, entryId)
      const existingMeal = getEntryById(entryId)

      await updateDoc(mealDocRef, {
        ...payload,
        createdAt: existingMeal?.createdAt ?? payload.createdAt,
      })

      return true
    } catch (error) {
      console.error(error)
      alert('Could not save this meal to Firebase')
      return false
    }
  }

  async function deleteMeal(entryId) {
    if (!uid) {
      return false
    }

    try {
      await deleteDoc(userMealDoc(uid, entryId))
      return true
    } catch (error) {
      console.error(error)
      alert('Could not delete this meal from Firebase')
      return false
    }
  }

  return {
    entries,
    isLoadingMeals,
    totals,
    groupedMeals,
    getEntryById,
    addMeal,
    updateMeal,
    deleteMeal,
  }
}
