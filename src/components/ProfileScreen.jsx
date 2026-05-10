import { ActionButton, Card, Pill, StatChip, SectionHeader } from './ui'
import { getUserLabel } from '../lib/nutrition'

export function ProfileScreen({
  signedIn,
  currentUser,
  authBusy,
  authMessage,
  signIn,
  signOut,
  onOpenToday,
  onOpenMeals,
  onOpenAddFood,
  nutritionForm,
  showGoalTracking,
  trackingModeLabel,
  onNutritionFormChange,
  onNutritionFormSubmit,
  onTrackingModeChange,
  entriesCount,
  totals,
}) {
  if (!signedIn) {
    return (
      <section className="screen screen-profile">
        <SectionHeader kicker="Profile" title="Sign in to sync your meals and save your goal." />

        <Card className="auth-card">
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
            <ActionButton onClick={signIn} disabled={authBusy}>
              {authBusy ? 'Signing in...' : 'Continue with Google'}
            </ActionButton>
          </div>

          {authMessage ? <p className="auth-message">{authMessage}</p> : null}
        </Card>
      </section>
    )
  }

  return (
    <section className="screen screen-profile">
      <SectionHeader kicker="Profile" title="Account, nutrition mode, and quick actions." />

      <div className="profile-grid">
        <Card className="profile-card account-card">
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
            <StatChip value={entriesCount} label="foods logged" />
            <StatChip value={totals.calories} label="calories eaten" />
            <StatChip value={showGoalTracking ? 'On' : 'Off'} label="goal tracking" />
          </div>

          <div className="profile-actions">
            <ActionButton variant="secondary" onClick={onOpenToday}>
              View today
            </ActionButton>
            <ActionButton variant="ghost" onClick={onOpenMeals}>
              Open meals
            </ActionButton>
            <ActionButton variant="danger" onClick={signOut}>
              {authBusy ? 'Signing out...' : 'Log out'}
            </ActionButton>
          </div>
        </Card>

        <Card className="profile-card settings-card">
          <div className="profile-header">
            <div>
              <p className="section-kicker">Settings</p>
              <h3>Nutrition Tracking Mode</h3>
            </div>
            <Pill>{trackingModeLabel}</Pill>
          </div>

          <div className="mode-toggle" role="group" aria-label="Nutrition Tracking Mode">
            <button
              type="button"
              className={showGoalTracking ? 'mode-option active' : 'mode-option'}
              onClick={() => onTrackingModeChange('goal_tracking')}
            >
              <strong>Goal Tracking</strong>
              <span>Show goals and progress bars.</span>
            </button>
            <button
              type="button"
              className={!showGoalTracking ? 'mode-option active' : 'mode-option'}
              onClick={() => onTrackingModeChange('tracking_only')}
            >
              <strong>Tracking Only</strong>
              <span>Hide goals for a minimal dashboard.</span>
            </button>
          </div>

          {showGoalTracking ? (
            <form className="nutrition-form" onSubmit={onNutritionFormSubmit}>
              <div className="form-grid nutrition-form-grid">
                <label>
                  Calorie goal
                  <input
                    name="calorieGoal"
                    type="number"
                    min="1"
                    step="1"
                    value={nutritionForm.calorieGoal}
                    onChange={onNutritionFormChange}
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
                    onChange={onNutritionFormChange}
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
                    onChange={onNutritionFormChange}
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
                    onChange={onNutritionFormChange}
                  />
                </label>
              </div>
              <div className="settings-actions">
                <ActionButton type="submit">Save goals</ActionButton>
              </div>
            </form>
          ) : (
            <div className="tracking-only-note">
              <p className="section-text">
                Goals are hidden while Tracking Only mode is active. Switch back to Goal Tracking to
                edit calorie and macro targets.
              </p>
              <div className="settings-actions">
                <ActionButton variant="secondary" onClick={() => onTrackingModeChange('goal_tracking')}>
                  Switch to Goal Tracking
                </ActionButton>
              </div>
            </div>
          )}
        </Card>

        <Card className="profile-card shortcuts-card">
          <p className="section-kicker">Quick actions</p>
          <div className="profile-action-grid">
            <button type="button" className="profile-action-button" onClick={onOpenToday}>
              <span>Today</span>
              <small>Check your progress</small>
            </button>
            <button type="button" className="profile-action-button" onClick={onOpenMeals}>
              <span>Meals</span>
              <small>Review and edit entries</small>
            </button>
            <button type="button" className="profile-action-button accent" onClick={onOpenAddFood}>
              <span>Add food</span>
              <small>Log a meal instantly</small>
            </button>
          </div>
          {authMessage ? <p className="auth-message">{authMessage}</p> : null}
        </Card>
      </div>
    </section>
  )
}
