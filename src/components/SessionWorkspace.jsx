import { useMemo } from 'react'
import { AppShell } from './AppShell'
import { FloatingActionButton } from './FloatingActionButton'
import { PrimaryNav } from './PrimaryNav'
import { DashboardScreen } from './DashboardScreen'
import { MealsScreen } from './MealsScreen'
import { ProfileScreen } from './ProfileScreen'
import { useMealEditorState } from '../hooks/useMealEditorState'
import { useNutritionSettings } from '../hooks/useNutritionSettings'
import { useUserMeals } from '../hooks/useUserMeals'
import { buildMetricCards } from '../lib/nutrition'

export function SessionWorkspace({
  authSlot,
  currentUser,
  activeTab,
  setActiveTab,
  authBusy,
  authMessage,
  setAuthMessage,
  onSignIn,
  onSignOut,
}) {
  const signedIn = Boolean(currentUser)

  const {
    entries,
    isLoadingMeals,
    totals,
    groupedMeals,
    getEntryById,
    addMeal,
    updateMeal,
    deleteMeal,
  } = useUserMeals(currentUser?.uid)

  const {
    nutritionSettings,
    nutritionForm,
    showGoalTracking,
    trackingModeLabel,
    handleNutritionFormChange,
    handleNutritionFormSubmit,
    handleTrackingModeChange,
  } = useNutritionSettings(currentUser?.uid, {
    onError: setAuthMessage,
  })

  const editor = useMealEditorState({
    currentUser,
    onRequireAuth: (message) => {
      setAuthMessage(message)
      setActiveTab('profile')
    },
    getEntryById,
    addMeal,
    updateMeal,
    deleteMeal,
  })

  const metricCards = useMemo(
    () => buildMetricCards({ totals, nutritionSettings, showGoalTracking }),
    [totals, nutritionSettings, showGoalTracking],
  )

  async function handleSignIn() {
    const didSignIn = await onSignIn()

    if (didSignIn) {
      setActiveTab('home')
    }
  }

  async function handleSignOut() {
    editor.closeModal()

    const didSignOut = await onSignOut()

    if (didSignOut) {
      setActiveTab('profile')
    }
  }

  const resolvedTab = signedIn ? activeTab : 'profile'

  return (
    <AppShell
      authSlot={authSlot}
      bottomNav={<PrimaryNav activeTab={resolvedTab} onChangeTab={setActiveTab} />}
      floatingActionButton={
        signedIn ? <FloatingActionButton onClick={editor.openAddModal} /> : null
      }
    >
      {resolvedTab === 'meals' ? (
        <MealsScreen
          signedIn={signedIn}
          groupedMeals={groupedMeals}
          isLoadingMeals={isLoadingMeals}
          onAddFood={editor.openAddModal}
          onOpenProfile={() => setActiveTab('profile')}
          onSignIn={handleSignIn}
          authBusy={authBusy}
          editor={editor}
        />
      ) : resolvedTab === 'profile' ? (
        <ProfileScreen
          signedIn={signedIn}
          currentUser={currentUser}
          authBusy={authBusy}
          authMessage={authMessage}
          signIn={handleSignIn}
          signOut={handleSignOut}
          onOpenToday={() => setActiveTab('home')}
          onOpenMeals={() => setActiveTab('meals')}
          onOpenAddFood={editor.openAddModal}
          nutritionForm={nutritionForm}
          showGoalTracking={showGoalTracking}
          trackingModeLabel={trackingModeLabel}
          onNutritionFormChange={handleNutritionFormChange}
          onNutritionFormSubmit={handleNutritionFormSubmit}
          onTrackingModeChange={handleTrackingModeChange}
          entriesCount={entries.length}
          totals={totals}
        />
      ) : (
        <DashboardScreen
          signedIn={signedIn}
          showGoalTracking={showGoalTracking}
          nutritionSettings={nutritionSettings}
          totals={totals}
          metricCards={metricCards}
          groupedMeals={groupedMeals}
          isLoadingMeals={isLoadingMeals}
          onAddFood={editor.openAddModal}
          onOpenMeals={() => setActiveTab('meals')}
          onOpenProfile={() => setActiveTab('profile')}
          onSignIn={handleSignIn}
          authBusy={authBusy}
        />
      )}
    </AppShell>
  )
}
