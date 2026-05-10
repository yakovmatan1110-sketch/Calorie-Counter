import { useState } from 'react'
import { createEmptyMealForm } from '../lib/nutrition'

const initialModalState = {
  open: false,
  mode: 'add',
  entryId: null,
  form: createEmptyMealForm(),
}

export function useMealEditorState({
  currentUser,
  onRequireAuth,
  getEntryById,
  addMeal,
  updateMeal,
  deleteMeal,
}) {
  const [modalState, setModalState] = useState(initialModalState)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function openAddModal(meal = 'breakfast') {
    if (!currentUser) {
      onRequireAuth?.('Please sign in to add meals.')
      return
    }

    setModalState({
      open: true,
      mode: 'add',
      entryId: null,
      form: createEmptyMealForm(meal),
    })
    setShowDeleteConfirm(false)
  }

  function openEditModal(entry) {
    if (!currentUser) {
      onRequireAuth?.('Please sign in to edit meals.')
      return
    }

    if (!entry) {
      return
    }

    setModalState({
      open: true,
      mode: 'edit',
      entryId: entry.id,
      form: {
        meal: entry.meal,
        name: entry.name,
        calories: String(entry.calories),
        fat: String(entry.fat),
        carbs: String(entry.carbs),
        protein: String(entry.protein),
      },
    })
    setShowDeleteConfirm(false)
  }

  function closeModal() {
    setShowDeleteConfirm(false)
    setModalState(initialModalState)
  }

  function handleFormChange(event) {
    const { name, value } = event.target

    setModalState((current) => ({
      ...current,
      form: {
        ...current.form,
        [name]: value,
      },
    }))
  }

  async function handleSubmitEntry(event) {
    event.preventDefault()

    if (!currentUser) {
      onRequireAuth?.('Please sign in to save meals.')
      return
    }

    const trimmedName = modalState.form.name.trim()
    if (!trimmedName) {
      return
    }

    const mealPayload = {
      meal: modalState.form.meal,
      name: trimmedName,
      calories: Number(modalState.form.calories) || 0,
      fat: Number(modalState.form.fat) || 0,
      carbs: Number(modalState.form.carbs) || 0,
      protein: Number(modalState.form.protein) || 0,
      createdAt: new Date(),
    }

    const wasSaved =
      modalState.mode === 'edit'
        ? await updateMeal(modalState.entryId, mealPayload)
        : await addMeal(mealPayload)

    if (wasSaved) {
      closeModal()
    }
  }

  async function handleDeleteEntry(entryId) {
    if (!currentUser) {
      onRequireAuth?.('Please sign in to delete meals.')
      return
    }

    const wasDeleted = await deleteMeal(entryId)
    if (wasDeleted) {
      closeModal()
    }
  }

  function getEditingMeal() {
    if (!modalState.entryId) {
      return null
    }

    return getEntryById(modalState.entryId)
  }

  return {
    modalState,
    showDeleteConfirm,
    setShowDeleteConfirm,
    openAddModal,
    openEditModal,
    closeModal,
    handleFormChange,
    handleSubmitEntry,
    handleDeleteEntry,
    getEditingMeal,
  }
}
