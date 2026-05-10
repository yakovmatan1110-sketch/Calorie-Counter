import { useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import './App.css'

const mealOrder = ['breakfast', 'lunch', 'snack', 'dinner']

const mealLabels = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
}

const navItems = [
  { key: 'home', label: 'Today', icon: HomeIcon },
  { key: 'meals', label: 'Meals', icon: MealsIcon },
  { key: 'profile', label: 'Profile', icon: ProfileIcon },
]

const defaultNutritionSettings = {
  trackingMode: 'goal_tracking',
  calorieGoal: 2200,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 70,
}

const emptyForm = {
  meal: 'breakfast',
  name: '',
  calories: '',
  fat: '',
  carbs: '',
  protein: '',
}

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account',
})

function userMealsCollection(uid) {
  return collection(db, 'users', uid, 'meals')
}

function userMealDoc(uid, mealId) {
  return doc(db, 'users', uid, 'meals', mealId)
}

function userNutritionSettingsDoc(uid) {
  return doc(db, 'users', uid, 'settings', 'nutrition')
}

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

function normalizeNutritionSettings(data = {}) {
  return {
    trackingMode: data.trackingMode === 'tracking_only' ? 'tracking_only' : 'goal_tracking',
    calorieGoal: toPositiveNumber(data.calorieGoal, defaultNutritionSettings.calorieGoal),
    proteinGoal: toPositiveNumber(data.proteinGoal, defaultNutritionSettings.proteinGoal),
    carbsGoal: toPositiveNumber(data.carbsGoal, defaultNutritionSettings.carbsGoal),
    fatGoal: toPositiveNumber(data.fatGoal, defaultNutritionSettings.fatGoal),
  }
}

function toPositiveNumber(value, fallback) {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function formatMetricValue(value) {
  const rounded = Math.round(value * 10) / 10

  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

function sortMealsByCreatedAt(meals) {
  return [...meals].sort((firstMeal, secondMeal) => {
    const firstTime = firstMeal.createdAt?.toMillis?.() ?? 0
    const secondTime = secondMeal.createdAt?.toMillis?.() ?? 0

    return firstTime - secondTime
  })
}

function getUserLabel(user) {
  return user.displayName || user.email || 'Signed in'
}

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [nutritionSettings, setNutritionSettings] = useState(defaultNutritionSettings)
  const [nutritionForm, setNutritionForm] = useState(defaultNutritionSettings)
  const [entries, setEntries] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isLoadingMeals, setIsLoadingMeals] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [authBusy, setAuthBusy] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'add',
    entryId: null,
    form: emptyForm,
  })

  useEffect(() => {
    let unsubscribeMeals = () => {}
    let unsubscribeSettings = () => {}

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setAuthReady(true)

      unsubscribeMeals()
      unsubscribeSettings()

      if (!user) {
        setEntries([])
        setIsLoadingMeals(false)
        setShowDeleteConfirm(false)
        setNutritionSettings(defaultNutritionSettings)
        setNutritionForm(defaultNutritionSettings)
        setModalState({
          open: false,
          mode: 'add',
          entryId: null,
          form: emptyForm,
        })
        setActiveTab('profile')
        return
      }

      setIsLoadingMeals(true)

      const mealsRef = userMealsCollection(user.uid)
      const settingsRef = userNutritionSettingsDoc(user.uid)

      unsubscribeMeals = onSnapshot(
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

      unsubscribeSettings = onSnapshot(
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
        },
      )
    })

    return () => {
      unsubscribeMeals()
      unsubscribeSettings()
      unsubscribeAuth()
    }
  }, [])

  const signedIn = Boolean(currentUser)
  const showGoalTracking = nutritionSettings.trackingMode === 'goal_tracking'

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

  const calorieGoalCompleted =
    showGoalTracking &&
    nutritionSettings.calorieGoal > 0 &&
    totals.calories >= nutritionSettings.calorieGoal

  const metricCards = [
    {
      key: 'calories',
      label: 'Calories',
      current: totals.calories,
      goal: nutritionSettings.calorieGoal,
      unit: 'cal',
      accent: 'calories',
      completed: calorieGoalCompleted,
      completionLabel: 'Goal completed',
    },
    {
      key: 'protein',
      label: 'Protein',
      current: totals.protein,
      goal: nutritionSettings.proteinGoal,
      unit: 'g',
      accent: 'protein',
      completed: showGoalTracking && totals.protein >= nutritionSettings.proteinGoal,
      completionLabel: 'Goal met',
    },
    {
      key: 'carbs',
      label: 'Carbs',
      current: totals.carbs,
      goal: nutritionSettings.carbsGoal,
      unit: 'g',
      accent: 'carbs',
      completed: showGoalTracking && totals.carbs >= nutritionSettings.carbsGoal,
      completionLabel: 'Goal met',
    },
    {
      key: 'fat',
      label: 'Fat',
      current: totals.fat,
      goal: nutritionSettings.fatGoal,
      unit: 'g',
      accent: 'fat',
      completed: showGoalTracking && totals.fat >= nutritionSettings.fatGoal,
      completionLabel: 'Goal met',
    },
  ]

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
    if (!currentUser) {
      setAuthMessage('Please sign in to add meals.')
      setActiveTab('profile')
      return
    }

    setModalState({
      open: true,
      mode: 'add',
      entryId: null,
      form: { ...emptyForm, meal },
    })
  }

  function openEditModal(entry) {
    if (!currentUser) {
      setAuthMessage('Please sign in to edit meals.')
      setActiveTab('profile')
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

  async function handleGoogleSignIn() {
    setAuthBusy(true)
    setAuthMessage('')

    try {
      await signInWithPopup(auth, googleProvider)
      setActiveTab('home')
    } catch (error) {
      console.error(error)
      setAuthMessage('Google sign-in did not complete. Please try again.')
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleSignOutClick() {
    setAuthBusy(true)
    setAuthMessage('')

    try {
      await signOut(auth)
    } catch (error) {
      console.error(error)
      setAuthMessage('Could not sign out right now. Please try again.')
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleSubmitEntry(event) {
    event.preventDefault()

    if (!currentUser) {
      setAuthMessage('Please sign in to save meals.')
      setActiveTab('profile')
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

    try {
      if (modalState.mode === 'edit') {
        const mealDocRef = userMealDoc(currentUser.uid, modalState.entryId)
        const existingMeal = entries.find((entry) => entry.id === modalState.entryId)

        await updateDoc(mealDocRef, {
          ...mealPayload,
          createdAt: existingMeal?.createdAt ?? mealPayload.createdAt,
        })
      } else {
        await addDoc(userMealsCollection(currentUser.uid), mealPayload)
      }

      closeModal()
    } catch (error) {
      console.error(error)
      alert('Could not save this meal to Firebase')
    }
  }

  async function handleDeleteEntry(entryId) {
    if (!currentUser) {
      setAuthMessage('Please sign in to delete meals.')
      setActiveTab('profile')
      return
    }

    try {
      await deleteDoc(userMealDoc(currentUser.uid, entryId))
      closeModal()
    } catch (error) {
      console.error(error)
      alert('Could not delete this meal from Firebase')
    }
  }

  async function saveNutritionSettings(nextSettings) {
    if (!currentUser) {
      return
    }

    try {
      await setDoc(userNutritionSettingsDoc(currentUser.uid), nextSettings, { merge: true })
    } catch (error) {
      console.error(error)
      setAuthMessage('Could not save nutrition settings right now.')
    }
  }

  function applyNutritionSettings(nextSettings) {
    setNutritionSettings(nextSettings)
    setNutritionForm(nextSettings)
    void saveNutritionSettings(nextSettings)
  }

  function handleTrackingModeChange(nextMode) {
    if (!currentUser) {
      setAuthMessage('Please sign in to save nutrition settings.')
      setActiveTab('profile')
      return
    }

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

    if (!currentUser) {
      setAuthMessage('Please sign in to save nutrition settings.')
      setActiveTab('profile')
      return
    }

    applyNutritionSettings(normalizeNutritionSettings(nutritionForm))
  }

  function renderLockedState(title, body) {
    return (
      <section className="locked-state">
        <article className="profile-card auth-card">
          <p className="section-kicker">Account required</p>
          <h2>{title}</h2>
          <p className="section-text">{body}</p>
          <div className="hero-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => setActiveTab('profile')}
            >
              Go to profile
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleGoogleSignIn}
              disabled={authBusy}
            >
              {authBusy ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>
        </article>
      </section>
    )
  }

  function renderTodayTab() {
    if (!signedIn) {
      return renderLockedState(
        'Unlock your personal dashboard.',
        'Sign in to load your meals from Firestore and keep your nutrition tracking synced across devices.',
      )
    }

    return (
      <section className="screen screen-home">
        <section className="hero-panel home-hero">
          <div className="hero-copy">
            <p className="section-kicker">Today</p>
            <h2>
              {showGoalTracking ? 'Calories and macros with live progress.' : 'Minimal nutrition totals.'}
            </h2>
            <p className="section-text">
              {showGoalTracking
                ? 'Your daily goals stay in sync with Firestore and update the dashboard instantly.'
                : 'Tracking Only mode keeps the dashboard clean with totals only.'}
            </p>
          </div>

          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={() => openAddModal()}>
              Add food
            </button>
            <button type="button" className="secondary-button" onClick={() => setActiveTab('profile')}>
              Nutrition settings
            </button>
          </div>
        </section>

        <section className="nutrition-grid">
          {metricCards.map((metric) => (
            <NutritionMetricCard
              key={metric.key}
              label={metric.label}
              current={metric.current}
              goal={metric.goal}
              unit={metric.unit}
              accent={metric.accent}
              showGoal={showGoalTracking}
              completed={metric.completed}
              completionLabel={metric.completionLabel}
            />
          ))}
        </section>

        <section className="summary-card">
          <div className="summary-header">
            <div>
              <p className="section-kicker">Meal preview</p>
              <h3>Today at a glance</h3>
            </div>
            <button type="button" className="ghost-button" onClick={() => setActiveTab('meals')}>
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
    )
  }

  function renderMealsTab() {
    if (!signedIn) {
      return renderLockedState(
        'Sign in to see your meals.',
        'Your meal list is stored per user in Firestore, so logging in is required before the tracker can load it.',
      )
    }

    return (
      <section className="screen screen-meals">
        <div className="screen-header">
          <div>
            <p className="section-kicker">Meals</p>
            <h2>Your meal cards, tuned for quick thumb taps.</h2>
          </div>
          <button type="button" className="primary-button" onClick={() => openAddModal()}>
            Add food
          </button>
        </div>

        <div className="meals-view">
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
        </div>
      </section>
    )
  }

  function renderProfileTab() {
    if (!signedIn) {
      return (
        <section className="screen screen-profile">
          <div className="screen-header">
            <div>
              <p className="section-kicker">Profile</p>
              <h2>Sign in to sync your meals and save your goal.</h2>
            </div>
          </div>

          <article className="profile-card auth-card">
            <div className="profile-summary">
              <div className="profile-avatar fallback" aria-hidden="true">
                P
              </div>
              <div className="profile-meta">
                <strong>Google account login</strong>
                <p>Your meals stay tied to your Firebase user ID.</p>
              </div>
            </div>

            <div className="hero-actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleGoogleSignIn}
                disabled={authBusy}
              >
                {authBusy ? 'Signing in...' : 'Continue with Google'}
              </button>
            </div>

            {authMessage ? <p className="auth-message">{authMessage}</p> : null}
          </article>
        </section>
      )
    }

    return (
      <section className="screen screen-profile">
        <div className="screen-header">
          <div>
            <p className="section-kicker">Profile</p>
            <h2>Account, nutrition mode, and quick actions.</h2>
          </div>
        </div>

        <div className="profile-grid">
          <article className="profile-card account-card">
            <div className="profile-summary">
              {currentUser.photoURL ? (
                <img className="profile-avatar" src={currentUser.photoURL} alt="" aria-hidden="true" />
              ) : (
                <div className="profile-avatar fallback" aria-hidden="true">
                  {getUserLabel(currentUser).slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="profile-meta">
                <strong>{getUserLabel(currentUser)}</strong>
                <p>{currentUser.email}</p>
              </div>
            </div>

            <div className="stat-grid">
              <div className="stat-chip">
                <strong>{entries.length}</strong>
                <span>foods logged</span>
              </div>
              <div className="stat-chip">
                <strong>{totals.calories}</strong>
                <span>calories eaten</span>
              </div>
              <div className="stat-chip">
                <strong>{showGoalTracking ? 'On' : 'Off'}</strong>
                <span>goal tracking</span>
              </div>
            </div>

            <div className="profile-actions">
              <button type="button" className="secondary-button" onClick={() => setActiveTab('home')}>
                View today
              </button>
              <button
                type="button"
                className="ghost-button strong"
                onClick={() => setActiveTab('meals')}
              >
                Open meals
              </button>
              <button type="button" className="danger-button" onClick={handleSignOutClick}>
                {authBusy ? 'Signing out...' : 'Log out'}
              </button>
            </div>
          </article>

          <article className="profile-card settings-card">
            <div className="profile-header">
              <div>
                <p className="section-kicker">Settings</p>
                <h3>Nutrition Tracking Mode</h3>
              </div>
              <span className="mode-pill">
                {showGoalTracking ? 'Goal Tracking' : 'Tracking Only'}
              </span>
            </div>

            <div className="mode-toggle" role="group" aria-label="Nutrition Tracking Mode">
              <button
                type="button"
                className={
                  showGoalTracking ? 'mode-option active' : 'mode-option'
                }
                onClick={() => handleTrackingModeChange('goal_tracking')}
              >
                <strong>Goal Tracking</strong>
                <span>Show goals and progress bars.</span>
              </button>
              <button
                type="button"
                className={
                  !showGoalTracking ? 'mode-option active' : 'mode-option'
                }
                onClick={() => handleTrackingModeChange('tracking_only')}
              >
                <strong>Tracking Only</strong>
                <span>Hide goals for a minimal dashboard.</span>
              </button>
            </div>

            {showGoalTracking ? (
              <form className="nutrition-form" onSubmit={handleNutritionFormSubmit}>
                <div className="form-grid nutrition-form-grid">
                  <label>
                    Calorie goal
                    <input
                      name="calorieGoal"
                      type="number"
                      min="1"
                      step="1"
                      value={nutritionForm.calorieGoal}
                      onChange={handleNutritionFormChange}
                    />
                  </label>
                  <label>
                    Protein goal
                    <input
                      name="proteinGoal"
                      type="number"
                      min="1"
                      step="1"
                      value={nutritionForm.proteinGoal}
                      onChange={handleNutritionFormChange}
                    />
                  </label>
                  <label>
                    Carbs goal
                    <input
                      name="carbsGoal"
                      type="number"
                      min="1"
                      step="1"
                      value={nutritionForm.carbsGoal}
                      onChange={handleNutritionFormChange}
                    />
                  </label>
                  <label>
                    Fat goal
                    <input
                      name="fatGoal"
                      type="number"
                      min="1"
                      step="1"
                      value={nutritionForm.fatGoal}
                      onChange={handleNutritionFormChange}
                    />
                  </label>
                </div>
                <div className="settings-actions">
                  <button type="submit" className="primary-button">
                    Save goals
                  </button>
                </div>
              </form>
            ) : (
              <div className="tracking-only-note">
                <p className="section-text">
                  Goals are hidden while Tracking Only mode is active. Switch back to Goal
                  Tracking to edit calorie and macro targets.
                </p>
                <div className="settings-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleTrackingModeChange('goal_tracking')}
                  >
                    Switch to Goal Tracking
                  </button>
                </div>
              </div>
            )}
          </article>

          <article className="profile-card shortcuts-card">
            <p className="section-kicker">Quick actions</p>
            <div className="profile-action-grid">
              <button type="button" className="profile-action-button" onClick={() => setActiveTab('home')}>
                <span>Today</span>
                <small>Check your progress</small>
              </button>
              <button type="button" className="profile-action-button" onClick={() => setActiveTab('meals')}>
                <span>Meals</span>
                <small>Review and edit entries</small>
              </button>
              <button type="button" className="profile-action-button accent" onClick={() => openAddModal()}>
                <span>Add food</span>
                <small>Log a meal instantly</small>
              </button>
            </div>
            {authMessage ? <p className="auth-message">{authMessage}</p> : null}
          </article>
        </div>
      </section>
    )
  }

  function renderCurrentTab() {
    switch (activeTab) {
      case 'meals':
        return renderMealsTab()
      case 'profile':
        return renderProfileTab()
      case 'home':
      default:
        return renderTodayTab()
    }
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <header className="topbar">
        <div className="topbar-copy">
          <p className="eyebrow">Today&apos;s nutrition</p>
          <h1>Calorie Compass</h1>
        </div>

        <div className="auth-bar">
          {authReady ? (
            signedIn ? (
              <button
                type="button"
                className="user-chip"
                onClick={() => setActiveTab('profile')}
              >
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
              <button
                type="button"
                className="ghost-button strong"
                onClick={() => setActiveTab('profile')}
              >
                Sign in
              </button>
            )
          ) : null}
        </div>
      </header>

      <main className="app-main">
        {!authReady ? (
          <section className="loading-surface">
            <p className="section-kicker">Preparing your session</p>
            <h2>Loading your saved calorie tracker.</h2>
            <p className="section-text">
              We are checking your Firebase login so your meals can load back in after a
              refresh.
            </p>
          </section>
        ) : (
          renderCurrentTab()
        )}
      </main>

      {authReady ? (
        <nav className="bottom-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.key}
                type="button"
                className={activeTab === item.key ? 'bottom-nav-button active' : 'bottom-nav-button'}
                onClick={() => setActiveTab(item.key)}
                aria-current={activeTab === item.key ? 'page' : undefined}
              >
                <Icon className="bottom-nav-icon" />
                <span className="bottom-nav-label">{item.label}</span>
              </button>
            )
          })}
        </nav>
      ) : null}

      {signedIn ? (
        <button
          type="button"
          className="fab"
          onClick={() => openAddModal()}
          aria-label="Add food"
        >
          <PlusIcon className="fab-icon" />
        </button>
      ) : null}

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

function NutritionMetricCard({
  label,
  current,
  goal,
  unit,
  accent,
  showGoal,
  completed,
  completionLabel,
}) {
  const safeGoal = goal > 0 ? goal : 0
  const progressWidth = showGoal && safeGoal > 0 ? Math.min(100, (current / safeGoal) * 100) : 0
  const currentText = formatMetricValue(current)
  const goalText = formatMetricValue(safeGoal)

  return (
    <article className={`nutrition-card ${accent} ${completed ? 'completed' : ''}`}>
      <div className="nutrition-card-head">
        <div className="nutrition-card-title">
          <p className="section-kicker">{label}</p>
          <strong className="nutrition-card-value">
            {showGoal ? `${currentText} / ${goalText}` : currentText}
            <span>{unit}</span>
          </strong>
        </div>
        <span className="mode-pill subtle">
          {showGoal ? 'Goal mode' : 'Totals only'}
        </span>
      </div>

      {showGoal ? (
        <div className="nutrition-progress" aria-hidden="true">
          <div className="nutrition-progress-track">
            <div
              className="nutrition-progress-fill"
              style={{
                width: `${progressWidth}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="nutrition-card-footer">
        {showGoal ? (
          completed ? (
            <span className="nutrition-complete-badge">{completionLabel}</span>
          ) : (
            <span className="nutrition-card-note">Progress updates automatically.</span>
          )
        ) : (
          <span className="nutrition-card-note">Total consumed today.</span>
        )}
      </div>
    </article>
  )
}

function HomeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M4 10.5L12 4l8 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 9.5V20h11V9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MealsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M7 4v16M11 4v16M7 12h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M15 4v8c0 1.7 1.3 3 3 3v5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ProfileIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5.5 20a6.8 6.8 0 0 1 13 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PlusIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default App
