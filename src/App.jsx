import { db } from "./firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import "./App.css";

const mealOrder = ['breakfast', 'lunch', 'snack', 'dinner']

const mealLabels = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
}

const emptyForm = {
  meal: 'breakfast',
  name: '',
  calories: '',
  fat: '',
  carbs: '',
  protein: '',
}

const mealsCollection = collection(db, 'meals')

function normalizeMeal(docSnapshot) {
  const data = docSnapshot.data()

  return {
    id: docSnapshot.id,
    meal: data.meal ?? 'breakfast',
    name: data.name ?? data.food ?? 'Untitled food',
    calories: Number(data.calories) || 0,
    fat: Number(data.fat) || 0,
    carbs: Number(data.carbs) || 0,
    protein: Number(data.protein) || 0,
    createdAt: data.createdAt ?? null,
  }
}

function sortMealsByCreatedAt(meals) {
  return [...meals].sort((firstMeal, secondMeal) => {
    const firstTime = firstMeal.createdAt?.toMillis?.() ?? 0
    const secondTime = secondMeal.createdAt?.toMillis?.() ?? 0

    return firstTime - secondTime
  })
}

function App() {
  
  const [activeTab, setActiveTab] = useState('home')
  const [calorieGoal, setCalorieGoal] = useState(2200)
  const [entries, setEntries] = useState([])
  const [showGoalEditor, setShowGoalEditor] = useState(false)
  const [goalInput, setGoalInput] = useState('2200')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isLoadingMeals, setIsLoadingMeals] = useState(true)
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'add',
    entryId: null,
    form: emptyForm,
  })

  useEffect(() => {
    async function loadMeals() {
      try {
        const snapshot = await getDocs(mealsCollection)
        const loadedMeals = snapshot.docs.map(normalizeMeal)
        setEntries(sortMealsByCreatedAt(loadedMeals))
      } catch (error) {
        console.error(error)
        alert('Could not load meals from Firebase')
      } finally {
        setIsLoadingMeals(false)
      }
    }

    loadMeals()
  }, [mealsCollection])

  const totals = entries.reduce(
    (accumulator, entry) => {
      accumulator.calories += entry.calories
      accumulator.fat += entry.fat
      accumulator.carbs += entry.carbs
      accumulator.protein += entry.protein
      return accumulator
    },
    { calories: 0, fat: 0, carbs: 0, protein: 0 },
  )

  const caloriesRemaining = Math.max(0, calorieGoal - totals.calories)
  const caloriesConsumedPercent = Math.min(
    100,
    Math.max(0, Math.round((totals.calories / calorieGoal) * 100)),
  )

  const groupedMeals = mealOrder.map((mealKey) => {
    const mealEntries = entries.filter((entry) => entry.meal === mealKey)
    const mealCalories = mealEntries.reduce((sum, entry) => sum + entry.calories, 0)

    return {
      key: mealKey,
      label: mealLabels[mealKey],
      entries: mealEntries,
      calories: mealCalories,
    }
  })

  function openAddModal(meal = 'breakfast') {
    setModalState({
      open: true,
      mode: 'add',
      entryId: null,
      form: { ...emptyForm, meal },
    })
  }

  function openEditModal(entry) {
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
  }

  function closeModal() {
    setShowDeleteConfirm(false)
    setModalState({
      open: false,
      mode: 'add',
      entryId: null,
      form: emptyForm,
    })
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

    try {
      if (modalState.mode === 'edit') {
        const mealDocRef = doc(db, 'meals', modalState.entryId)
        const existingMeal = entries.find((entry) => entry.id === modalState.entryId)

        await updateDoc(mealDocRef, {
          ...mealPayload,
          createdAt: existingMeal?.createdAt ?? mealPayload.createdAt,
        })

        setEntries((currentEntries) =>
          currentEntries.map((entry) =>
            entry.id === modalState.entryId
              ? {
                  ...entry,
                  ...mealPayload,
                  createdAt: existingMeal?.createdAt ?? mealPayload.createdAt,
                }
              : entry,
          ),
        )
      } else {
        const docRef = await addDoc(mealsCollection, mealPayload)

        setEntries((currentEntries) =>
          sortMealsByCreatedAt([
            ...currentEntries,
            {
              id: docRef.id,
              ...mealPayload,
            },
          ]),
        )
      }

      closeModal()
    } catch (error) {
      console.error(error)
      alert('Could not save this meal to Firebase')
    }
  }

  async function handleDeleteEntry(entryId) {
    try {
      await deleteDoc(doc(db, 'meals', entryId))
      setEntries((currentEntries) =>
        currentEntries.filter((entry) => entry.id !== entryId),
      )
      closeModal()
    } catch (error) {
      console.error(error)
      alert('Could not delete this meal from Firebase')
    }
  }

  function handleGoalSubmit(event) {
    event.preventDefault()
    const nextGoal = Number(goalInput)

    if (nextGoal > 0) {
      setCalorieGoal(nextGoal)
      setShowGoalEditor(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <header className="topbar">
        <div>
          <p className="eyebrow">Today&apos;s nutrition</p>
          <h1>Calorie Compass</h1>
        </div>

      </header>

      <main className="app-grid">
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="section-kicker">Focused tracker</p>
            <h2>One clean dashboard for calories and macros.</h2>
            <p className="section-text">
              Calories show how many you have left. Fat, carbs, and protein
              show how much you&apos;ve eaten so far today.
            </p>
          </div>

          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={() => openAddModal()}>
              Add food
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setActiveTab('meals')}
            >
              Open meals
            </button>

          </div>

          {showGoalEditor ? (
            <form className="goal-card" onSubmit={handleGoalSubmit}>
              <label htmlFor="goalInput">Daily calorie goal</label>
              <div className="goal-row">
                <input
                  id="goalInput"
                  name="goalInput"
                  type="number"
                  min="1"
                  step="1"
                  value={goalInput}
                  onChange={(event) => setGoalInput(event.target.value)}
                />
                <button type="submit" className="ghost-button strong">
                  Save
                </button>
              </div>
            </form>
          ) : null}
        </section>

        <nav className="tabbar" aria-label="Tracker sections">
          <button
            type="button"
            className={activeTab === 'home' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('home')}
          >
            Home
          </button>
          <button
            type="button"
            className={activeTab === 'meals' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('meals')}
          >
            Meals
          </button>
        </nav>

        {activeTab === 'home' ? (
          <section className="dashboard-view">
            <article className="ring-card calorie-card">
              <div
                className="metric-ring large"
                style={{
                  '--ring-fill': `${caloriesConsumedPercent}%`,
                }}
              >
                <div className="metric-inner">
                  <span className="metric-label">Calories remaining</span>
                  <strong>{caloriesRemaining}</strong>
                  <span className="metric-subtext">
                    {totals.calories} eaten of {calorieGoal}
                  </span>
                </div>
              </div>
            </article>

            <div className="macro-grid">
              <MacroCircle label="Fat" value={totals.fat} accent="sun" unit="g" />
              <MacroCircle label="Carbs" value={totals.carbs} accent="leaf" unit="g" />
              <MacroCircle
                label="Protein"
                value={totals.protein}
                accent="berry"
                unit="g"
              />
            </div>

            <section className="summary-card">
              <div className="summary-header">
                <div>
                  <p className="section-kicker">Meal preview</p>
                  <h3>Today at a glance</h3>
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setActiveTab('meals')}
                >
                  See all meals
                </button>
              </div>

              <div className="meal-preview-grid">
                {groupedMeals.map((meal) => (
                  <button
                    type="button"
                    key={meal.key}
                    className="meal-preview"
                    onClick={() => setActiveTab('meals')}
                  >
                    <span>{meal.label}</span>
                    <strong>{meal.calories} cal</strong>
                    <small>{meal.entries.length} foods</small>
                  </button>
                ))}
              </div>
            </section>
          </section>
        ) : (
          <section className="meals-view">
            {groupedMeals.map((meal) => (
              <article className="meal-card" key={meal.key}>
                <div className="meal-card-header">
                  <div>
                    <p className="section-kicker">{meal.entries.length} foods logged</p>
                    <h3>{meal.label}</h3>
                  </div>
                  <div className="meal-card-actions">
                    <span className="meal-total">{meal.calories} cal</span>
                    <button
                      type="button"
                      className="ghost-button strong"
                      onClick={() => openAddModal(meal.key)}
                    >
                      Add food
                    </button>
                  </div>
                </div>

                {meal.entries.length ? (
                  <ul className="entry-list">
                    {meal.entries.map((entry) => (
                      <li className="entry-row" key={entry.id}>
                        <button
                          type="button"
                          className="entry-button"
                          onClick={() => openEditModal(entry)}
                        >
                          <span className="entry-name">{entry.name}</span>
                          <span className="entry-macros">
                            {entry.calories} cal | {entry.fat}F | {entry.carbs}C |{' '}
                            {entry.protein}P
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="empty-meal">
                    <p>{isLoadingMeals ? 'Loading meals...' : 'No foods added yet.'}</p>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => openAddModal(meal.key)}
                    >
                      Add your first item
                    </button>
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
      </main>

      {modalState.open ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <section
            className="entry-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="entryModalTitle"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="section-kicker">
                  {modalState.mode === 'edit' ? 'Update meal entry' : 'Log a new food'}
                </p>
                <h3 id="entryModalTitle">
                  {modalState.mode === 'edit' ? 'Edit food' : 'Add food'}
                </h3>
              </div>
              <button type="button" className="ghost-button" onClick={closeModal}>
                Close
              </button>
            </div>

            <form className="entry-form" onSubmit={handleSubmitEntry}>
              <label>
                Meal
                <select
                  name="meal"
                  value={modalState.form.meal}
                  onChange={handleFormChange}
                >
                  {mealOrder.map((mealKey) => (
                    <option key={mealKey} value={mealKey}>
                      {mealLabels[mealKey]}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Food name
                <input
                  name="name"
                  type="text"
                  placeholder="Turkey sandwich"
                  value={modalState.form.name}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <div className="form-grid">
                <label>
                  Calories
                  <input
                    name="calories"
                    type="number"
                    min="0"
                    step="1"
                    value={modalState.form.calories}
                    onChange={handleFormChange}
                  />
                </label>

                <label>
                  Fat
                  <input
                    name="fat"
                    type="number"
                    min="0"
                    step="0.1"
                    value={modalState.form.fat}
                    onChange={handleFormChange}
                  />
                </label>

                <label>
                  Carbs
                  <input
                    name="carbs"
                    type="number"
                    min="0"
                    step="0.1"
                    value={modalState.form.carbs}
                    onChange={handleFormChange}
                  />
                </label>

                <label>
                  Protein
                  <input
                    name="protein"
                    type="number"
                    min="0"
                    step="0.1"
                    value={modalState.form.protein}
                    onChange={handleFormChange}
                  />
                </label>
              </div>

              <div className="modal-actions">
                {modalState.mode === 'edit' ? (
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete
                  </button>
                ) : (
                  <span />
                )}
                <div className="action-pair">
                  <button type="button" className="ghost-button" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-button">
                    {modalState.mode === 'edit' ? 'Save changes' : 'Save food'}
                  </button>
                </div>
              </div>
            </form>

            {showDeleteConfirm ? (
              <div className="confirm-delete" role="alert">
                <p>Are you sure you want to delete this food?</p>
                <div className="action-pair">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleDeleteEntry(modalState.entryId)}
                  >
                    Yes, delete
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  )
}

function MacroCircle({ label, value, accent, unit }) {
  return (
    <article className={`ring-card macro-card ${accent}`}>
      <div className="metric-ring small">
        <div className="metric-inner">
          <span className="metric-label">{label}</span>
          <strong>
            {value}
            <span>{unit}</span>
          </strong>
          <span className="metric-subtext">Consumed today</span>
        </div>
      </div>
    </article>
  )
}

export default App
