import { ActionButton } from './ui'
import { Modal } from './ui'
import { mealLabels, mealOrder } from '../lib/nutrition'

export function MealEditorModal({
  modalState,
  showDeleteConfirm,
  onClose,
  onFormChange,
  onSubmit,
  onRequestDelete,
  onCancelDelete,
}) {
  return (
    <Modal
      open={modalState.open}
      title={modalState.mode === 'edit' ? 'Edit food' : 'Add food'}
      kicker={modalState.mode === 'edit' ? 'Update meal entry' : 'Log a new food'}
      onClose={onClose}
      labelledBy="entryModalTitle"
      actions={
        <>
          {modalState.mode === 'edit' && !showDeleteConfirm ? (
            <ActionButton variant="danger" onClick={onRequestDelete}>
              Delete
            </ActionButton>
          ) : (
            <span />
          )}

          <div className="action-pair">
            <ActionButton variant="ghost" onClick={onClose}>
              Cancel
            </ActionButton>
            <ActionButton type="submit" form="meal-editor-form">
              {modalState.mode === 'edit' ? 'Save changes' : 'Save food'}
            </ActionButton>
          </div>
        </>
      }
    >
      <form id="meal-editor-form" className="entry-form" onSubmit={onSubmit}>
        <label>
          Meal
          <select name="meal" value={modalState.form.meal} onChange={onFormChange}>
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
            onChange={onFormChange}
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
              onChange={onFormChange}
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
              onChange={onFormChange}
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
              onChange={onFormChange}
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
              onChange={onFormChange}
            />
          </label>
        </div>
      </form>

      {showDeleteConfirm ? (
        <div className="confirm-delete" role="alert">
          <p>Are you sure you want to delete this food?</p>
          <div className="action-pair">
            <ActionButton variant="ghost" onClick={onCancelDelete}>
              Cancel
            </ActionButton>
            <ActionButton variant="danger" onClick={onRequestDelete}>
              Yes, delete
            </ActionButton>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
