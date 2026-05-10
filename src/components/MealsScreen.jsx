import { ActionButton, Card, EmptyState, SectionHeader } from './ui'
import { MealEditorModal } from './MealEditorModal'

export function MealsScreen({
  signedIn,
  groupedMeals,
  isLoadingMeals,
  onAddFood,
  onOpenProfile,
  onSignIn,
  authBusy,
  editor,
}) {
  if (!signedIn) {
    return (
      <section className="locked-state">
        <Card className="auth-card">
          <p className="section-kicker">Account required</p>
          <h2>Sign in to see your meals.</h2>
          <p className="section-text">
            Your meal list is stored per user in Firestore, so logging in is required before the
            tracker can load it.
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
    <section className="screen screen-meals">
      <SectionHeader
        kicker="Meals"
        title="Your meal cards, tuned for quick thumb taps."
        actions={<ActionButton onClick={onAddFood}>Add food</ActionButton>}
      />

      <div className="meals-view">
        {groupedMeals.map((meal) => (
          <Card as="article" className="meal-card" key={meal.key}>
            <div className="meal-card-header">
              <div>
                <p className="section-kicker">{meal.entries.length} foods logged</p>
                <h3>{meal.label}</h3>
              </div>
              <div className="meal-card-actions">
                <span className="meal-total">{meal.calories} cal</span>
                <ActionButton variant="ghost" onClick={() => editor.openAddModal(meal.key)}>
                  Add food
                </ActionButton>
              </div>
            </div>

            {meal.entries.length ? (
              <ul className="entry-list">
                {meal.entries.map((entry) => (
                  <li className="entry-row" key={entry.id}>
                    <button
                      type="button"
                      className="entry-button"
                      onClick={() => editor.openEditModal(entry)}
                    >
                      <span className="entry-name">{entry.name}</span>
                      <span className="entry-macros">
                        {entry.calories} cal | {entry.fat}F | {entry.carbs}C | {entry.protein}P
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title={isLoadingMeals ? 'Loading meals...' : 'No foods added yet.'}
                body={isLoadingMeals ? 'Please wait while Firestore loads.' : undefined}
                actions={
                  <ActionButton variant="secondary" onClick={() => editor.openAddModal(meal.key)}>
                    Add your first item
                  </ActionButton>
                }
                className="empty-meal"
              />
            )}
          </Card>
        ))}
      </div>

      <MealEditorModal
        modalState={editor.modalState}
        showDeleteConfirm={editor.showDeleteConfirm}
        onClose={editor.closeModal}
        onFormChange={editor.handleFormChange}
        onSubmit={editor.handleSubmitEntry}
        onRequestDelete={() =>
          editor.showDeleteConfirm
            ? editor.handleDeleteEntry(editor.modalState.entryId)
            : editor.setShowDeleteConfirm(true)
        }
        onCancelDelete={() => editor.setShowDeleteConfirm(false)}
      />
    </section>
  )
}
