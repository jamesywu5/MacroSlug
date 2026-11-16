import assert from 'node:assert/strict';
import test from 'node:test';

import {
  copyNutritionGoals,
  NUTRITION_GOAL_FIELDS,
  updateNutritionGoal,
} from './model.ts';
import { EMPTY_NUTRITION_GOALS } from './types.ts';

test('defines all four daily goal fields with the correct units and keyboards', () => {
  assert.deepEqual(
    NUTRITION_GOAL_FIELDS.map(({ key, label, unit, keyboardType }) => ({
      key,
      label,
      unit,
      keyboardType,
    })),
    [
      { key: 'calories', label: 'Calories', unit: 'kcal', keyboardType: 'numeric' },
      { key: 'protein', label: 'Protein', unit: 'g', keyboardType: 'decimal-pad' },
      { key: 'carbs', label: 'Carbohydrates', unit: 'g', keyboardType: 'decimal-pad' },
      { key: 'fat', label: 'Fat', unit: 'g', keyboardType: 'decimal-pad' },
    ]
  );
});

test('starts with empty string values for each optional goal', () => {
  assert.deepEqual(EMPTY_NUTRITION_GOALS, {
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });
});

test('updates one goal as a string without mutating the previous state', () => {
  const updated = updateNutritionGoal(EMPTY_NUTRITION_GOALS, 'protein', '85.5');

  assert.deepEqual(updated, {
    calories: '',
    protein: '85.5',
    carbs: '',
    fat: '',
  });
  assert.notStrictEqual(updated, EMPTY_NUTRITION_GOALS);
  assert.equal(EMPTY_NUTRITION_GOALS.protein, '');
});

test('copies the current input values into an independent Save payload', () => {
  const goals = {
    calories: '2000',
    protein: '120',
    carbs: '210.5',
    fat: '',
  };
  const payload = copyNutritionGoals(goals);

  assert.deepEqual(payload, goals);
  assert.notStrictEqual(payload, goals);
  payload.calories = '1800';
  assert.equal(goals.calories, '2000');
});
