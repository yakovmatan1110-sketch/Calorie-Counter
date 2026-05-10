import { ActionButton, Card, Pill } from './ui'
import { formatMetricValue } from '../lib/nutrition'

function getRingStyle(current, goal, showGoal) {
  if (!showGoal || goal <= 0) {
    return {
      '--ring-progress': '0deg',
    }
  }

  const progress = Math.min(1, current / goal)

  return {
    '--ring-progress': `${progress * 360}deg`,
  }
}

function MacroCard({
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
    <article className={`macro-card ${accent} ${completed ? 'completed' : ''}`}>
      <div className="macro-card-head">
        <p className="section-kicker">{label}</p>
        <strong className="macro-card-value">
          {showGoal ? `${currentText} / ${goalText}` : currentText}
          <span>{unit}</span>
        </strong>
      </div>

      {showGoal ? (
        <div className="macro-track" aria-hidden="true">
          <div className="macro-track-fill" style={{ width: `${progressWidth}%` }} />
        </div>
      ) : null}

      <div className="macro-card-footer">
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

function HeroCard({ showGoalTracking, totals, nutritionSettings, onAddFood, onOpenProfile }) {
  const calorieGoal = nutritionSettings.calorieGoal
  const caloriesConsumed = totals.calories
  const caloriesRemaining = Math.max(0, calorieGoal - caloriesConsumed)
  const caloriesProgress = calorieGoal > 0 ? Math.min(100, (caloriesConsumed / calorieGoal) * 100) : 0
  const caloriesRingClass = caloriesRemaining === 0 ? 'complete' : ''

  return (
    <Card className="hero-panel dashboard-hero">
      <div className="hero-topline">
        <div className="hero-copy">
          <Pill variant="subtle">Today</Pill>
          <h2>
            {showGoalTracking
              ? 'Your daily calorie rhythm, at a glance.'
              : 'A calm snapshot of today’s intake.'}
          </h2>
          <p className="section-text">
            {showGoalTracking
              ? 'A focused summary of calories and macros with live progress.'
              : 'Tracking Only keeps the dashboard minimal while totals stay up to date.'}
          </p>
        </div>

        <div className={`hero-ring ${caloriesRingClass}`} style={getRingStyle(caloriesConsumed, calorieGoal, showGoalTracking)}>
          <div className="hero-ring-inner">
            <span className="hero-ring-label">Calories</span>
            <strong>{formatMetricValue(caloriesConsumed)}</strong>
            <small>{showGoalTracking ? `${formatMetricValue(calorieGoal)} goal` : 'Today'}</small>
          </div>
        </div>
      </div>

      <div className="hero-stats">
        <div className="hero-stat">
          <span>Remaining</span>
          <strong>{showGoalTracking ? formatMetricValue(caloriesRemaining) : formatMetricValue(caloriesConsumed)}</strong>
        </div>
        <div className="hero-stat">
          <span>Consumed</span>
          <strong>{formatMetricValue(caloriesConsumed)}</strong>
        </div>
        <div className="hero-stat">
          <span>Goal mode</span>
          <strong>{showGoalTracking ? 'On' : 'Off'}</strong>
        </div>
      </div>

      <div className="hero-actions">
        <ActionButton variant="primary" onClick={onAddFood}>
          Add food
        </ActionButton>
        <ActionButton variant="secondary" onClick={onOpenProfile}>
          Nutrition settings
        </ActionButton>
      </div>

      {showGoalTracking ? (
        <div className="hero-footnote">
          <span className="hero-footnote-track">
            <i style={{ width: `${caloriesProgress}%` }} />
          </span>
          <small>{calorieGoal > 0 ? 'Ring fills as calories are logged.' : 'Set a calorie goal to track progress.'}</small>
        </div>
      ) : (
        <p className="hero-footnote minimal">No goal-focused widgets are shown in this mode.</p>
      )}
    </Card>
  )
}

export function DashboardScreen({
  signedIn,
  showGoalTracking,
  nutritionSettings,
  totals,
  metricCards,
  groupedMeals,
  isLoadingMeals,
  onAddFood,
  onOpenMeals,
  onOpenProfile,
  onSignIn,
  authBusy,
}) {
  if (!signedIn) {
    return (
      <section className="locked-state">
        <Card className="auth-card">
          <p className="section-kicker">Account required</p>
          <h2>Unlock your personal dashboard.</h2>
          <p className="section-text">
            Sign in to load your meals from Firestore and keep your nutrition tracking synced
            across devices.
          </p>
          <div className="hero-actions">
            <ActionButton variant="primary" onClick={onOpenProfile}>
              Go to profile
            </ActionButton>
            <ActionButton variant="secondary" onClick={onSignIn} disabled={authBusy}>
              {authBusy ? 'Signing in...' : 'Sign in with Google'}
            </ActionButton>
          </div>
        </Card>
      </section>
    )
  }

  return (
    <section className="screen screen-home">
      <HeroCard
        showGoalTracking={showGoalTracking}
        totals={totals}
        nutritionSettings={nutritionSettings}
        onAddFood={onAddFood}
        onOpenProfile={onOpenProfile}
      />

      <section className="macro-section" aria-label="Macro tracking">
        {metricCards.map((metric) => (
          <MacroCard
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

      <Card className="summary-card meal-preview-card">
        <div className="summary-header">
          <div>
            <p className="section-kicker">Meal preview</p>
            <h3>Today at a glance</h3>
          </div>
          <ActionButton variant="ghost" onClick={onOpenMeals}>
            See all meals
          </ActionButton>
        </div>

        <div className="meal-preview-grid">
          {groupedMeals.map((meal) => (
            <button
              type="button"
              key={meal.key}
              className="meal-preview"
              onClick={onOpenMeals}
            >
              <div className="meal-preview-topline">
                <span>{meal.label}</span>
                <strong>{meal.calories} cal</strong>
              </div>
              <small>{meal.entries.length} foods logged</small>
            </button>
          ))}
        </div>

        {isLoadingMeals ? <p className="section-text">Loading meal history...</p> : null}
      </Card>
    </section>
  )
}
