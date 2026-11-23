import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import {
  NUTRITION_GOAL_ERRORS,
  validateNutritionGoal,
  validateNutritionGoals,
} from './validation.ts';
import { EMPTY_NUTRITION_GOALS } from './types.ts';

const MACRO_FIELDS = ['protein', 'carbs', 'fat'];
const ALL_FIELDS = ['calories', ...MACRO_FIELDS];

const valid = (value) => ({ value, error: null });

describe('validateNutritionGoal: blank input means no goal', () => {
  for (const field of ALL_FIELDS) {
    for (const raw of ['', ' ', '   ', '\t', ' \n ']) {
      test(`${field} ${JSON.stringify(raw)} is valid and null`, () => {
        assert.deepEqual(validateNutritionGoal(field, raw), valid(null));
      });
    }
  }
});

describe('validateNutritionGoal: calories', () => {
  const accepted = [
    ['2000', 2000],
    ['0', 0],
    ['1', 1],
    ['007', 7],
    [' 2000 ', 2000],
    ['\t1800\n', 1800],
  ];
  for (const [raw, expected] of accepted) {
    test(`accepts ${JSON.stringify(raw)} as ${expected}`, () => {
      assert.deepEqual(validateNutritionGoal('calories', raw), valid(expected));
    });
  }

  for (const raw of ['2000.5', '.5', '2000.', '0.0']) {
    test(`rejects decimal ${JSON.stringify(raw)} with the whole-number message`, () => {
      assert.deepEqual(validateNutritionGoal('calories', raw), {
        value: null,
        error: NUTRITION_GOAL_ERRORS.wholeNumber,
      });
    });
  }

  for (const raw of ['-5', '-0', '- 5', '-2000.5', '-.5']) {
    test(`rejects negative ${JSON.stringify(raw)}`, () => {
      assert.deepEqual(validateNutritionGoal('calories', raw), {
        value: null,
        error: NUTRITION_GOAL_ERRORS.negative,
      });
    });
  }

  for (const raw of ['.', 'abc', '12kcal', '1,000', '1e3', '1.2.3', '+5', 'NaN', 'Infinity', '0x10', '20 00']) {
    test(`rejects non-numeric ${JSON.stringify(raw)}`, () => {
      assert.deepEqual(validateNutritionGoal('calories', raw), {
        value: null,
        error: NUTRITION_GOAL_ERRORS.notAWholeNumber,
      });
    });
  }
});

describe('validateNutritionGoal: protein, carbohydrates, and fat', () => {
  const accepted = [
    ['85', 85],
    ['85.5', 85.5],
    ['210.5', 210.5],
    ['.5', 0.5],
    ['85.', 85],
    ['0', 0],
    ['0.0', 0],
    ['007.50', 7.5],
    [' 120 ', 120],
  ];
  for (const field of MACRO_FIELDS) {
    for (const [raw, expected] of accepted) {
      test(`${field} accepts ${JSON.stringify(raw)} as ${expected}`, () => {
        assert.deepEqual(validateNutritionGoal(field, raw), valid(expected));
      });
    }

    for (const raw of ['-5', '-0.5', '-.5', '- 5']) {
      test(`${field} rejects negative ${JSON.stringify(raw)}`, () => {
        assert.deepEqual(validateNutritionGoal(field, raw), {
          value: null,
          error: NUTRITION_GOAL_ERRORS.negative,
        });
      });
    }

    for (const raw of ['.', '..', 'abc', '12g', '1,000', '1e3', '1.2.3', '+5', 'NaN', 'Infinity', '-', '5-', '1 2']) {
      test(`${field} rejects non-numeric ${JSON.stringify(raw)}`, () => {
        assert.deepEqual(validateNutritionGoal(field, raw), {
          value: null,
          error: NUTRITION_GOAL_ERRORS.notANumber,
        });
      });
    }
  }
});

test('invalid input is never partly parsed', () => {
  assert.equal(validateNutritionGoal('protein', '.').value, null);
  assert.equal(validateNutritionGoal('protein', '12g').value, null);
  assert.equal(validateNutritionGoal('calories', '2000.5').value, null);
  assert.equal(validateNutritionGoal('fat', '1,000').value, null);
});

describe('validateNutritionGoals', () => {
  test('all blank or whitespace-only fields save with every goal null', () => {
    assert.deepEqual(validateNutritionGoals({ calories: '', protein: ' ', carbs: '\t', fat: '   ' }), {
      ok: true,
      goals: { calories: null, protein: null, carbs: null, fat: null },
    });
    assert.deepEqual(validateNutritionGoals(EMPTY_NUTRITION_GOALS), {
      ok: true,
      goals: { calories: null, protein: null, carbs: null, fat: null },
    });
  });

  test('valid values are parsed into numbers', () => {
    assert.deepEqual(validateNutritionGoals({ calories: '2000', protein: '120', carbs: '210.5', fat: '.5' }), {
      ok: true,
      goals: { calories: 2000, protein: 120, carbs: 210.5, fat: 0.5 },
    });
  });

  test('a mix of filled and blank fields saves numbers and nulls', () => {
    assert.deepEqual(validateNutritionGoals({ calories: ' 2000 ', protein: '', carbs: '  ', fat: '55.5' }), {
      ok: true,
      goals: { calories: 2000, protein: null, carbs: null, fat: 55.5 },
    });
  });

  test('any invalid field fails the whole form and reports only the invalid fields', () => {
    const result = validateNutritionGoals({ calories: '2000.5', protein: '.', carbs: '10', fat: '' });

    assert.equal(result.ok, false);
    assert.equal('goals' in result, false);
    assert.deepEqual(result.errors, {
      calories: NUTRITION_GOAL_ERRORS.wholeNumber,
      protein: NUTRITION_GOAL_ERRORS.notANumber,
    });
  });

  test('one invalid field among valid ones still fails', () => {
    const result = validateNutritionGoals({ calories: '2000', protein: '120', carbs: '210', fat: '-5' });

    assert.equal(result.ok, false);
    assert.deepEqual(result.errors, { fat: NUTRITION_GOAL_ERRORS.negative });
  });

  test('every field can be reported invalid at once', () => {
    const result = validateNutritionGoals({ calories: 'abc', protein: '-1', carbs: '1e3', fat: '1.2.3' });

    assert.equal(result.ok, false);
    assert.deepEqual(Object.keys(result.errors).sort(), ['calories', 'carbs', 'fat', 'protein']);
  });

  test('does not change its input', () => {
    const input = { calories: ' 2000 ', protein: '.', carbs: '', fat: '55.5' };
    const snapshot = { ...input };

    validateNutritionGoals(input);
    validateNutritionGoals({ ...input, protein: '120' });

    assert.deepEqual(input, snapshot);
  });

  test('returns a new goals object on each call', () => {
    const first = validateNutritionGoals(EMPTY_NUTRITION_GOALS);
    const second = validateNutritionGoals(EMPTY_NUTRITION_GOALS);

    assert.equal(first.ok && second.ok, true);
    assert.notStrictEqual(first.goals, second.goals);
  });
});
