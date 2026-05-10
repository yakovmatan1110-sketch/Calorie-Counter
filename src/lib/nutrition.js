export const mealOrder = ['breakfast', 'lunch', 'snack', 'dinner']

export const mealLabels = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
}

export const defaultNutritionSettings = {
  trackingMode: 'goal_tracking',
  calorieGoal: 2200,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 70,
}

export const emptyMealForm = {
  meal: 'breakfast',
  name: '',
  calories: '',
  fat: '',
  carbs: '',
  protein: '',
}

export function createEmptyMealForm(meal = 'breakfast') {
  return {
    ...emptyMealForm,
    meal,
  }
}

export function toPositiveNumber(value, fallback) {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function normalizeMeal(docSnapshot) {
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

export function normalizeNutritionSettings(data = {}) {
  return {
    trackingMode: data.trackingMode === 'tracking_only' ? 'tracking_only' : 'goal_tracking',
    calorieGoal: toPositiveNumber(data.calorieGoal, defaultNutritionSettings.calorieGoal),
    proteinGoal: toPositiveNumber(data.proteinGoal, defaultNutritionSettings.proteinGoal),
    carbsGoal: toPositiveNumber(data.carbsGoal, defaultNutritionSettings.carbsGoal),
    fatGoal: toPositiveNumber(data.fatGoal, defaultNutritionSettings.fatGoal),
  }
}

export function formatMetricValue(value) {
  const safeValue = Number.isFinite(value) ? value : 0
  const rounded = Math.round(safeValue * 10) / 10

  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function sortMealsByCreatedAt(meals) {
  return [...meals].sort((firstMeal, secondMeal) => {
    const firstTime = firstMeal.createdAt?.toMillis?.() ?? 0
    const secondTime = secondMeal.createdAt?.toMillis?.() ?? 0

    return firstTime - secondTime
  })
}

export function getUserLabel(user) {
  return user?.displayName || user?.email || 'Signed in'
}

export function getMealTotals(entries = []) {
  return entries.reduce(
    (accumulator, entry) => {
      accumulator.calories += entry.calories
      accumulator.fat += entry.fat
      accumulator.carbs += entry.carbs
      accumulator.protein += entry.protein

      return accumulator
    },
    { calories: 0, fat: 0, carbs: 0, protein: 0 },
  )
}

export function groupMeals(entries = []) {
  return mealOrder.map((mealKey) => {
    const mealEntries = entries.filter((entry) => entry.meal === mealKey)
    const mealCalories = mealEntries.reduce((sum, entry) => sum + entry.calories, 0)

    return {
      key: mealKey,
      label: mealLabels[mealKey],
      entries: mealEntries,
      calories: mealCalories,
    }
  })
}

export function buildMetricCards({ totals, nutritionSettings, showGoalTracking }) {
  const calorieGoalCompleted =
    showGoalTracking &&
    nutritionSettings.calorieGoal > 0 &&
    totals.calories >= nutritionSettings.calorieGoal

  return [
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
}
