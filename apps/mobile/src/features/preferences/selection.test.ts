import assert from 'node:assert/strict';
import test from 'node:test';

import { togglePreference } from './selection';

test('adds an unselected preference without mutating the original selection', () => {
  const selected = ['vegan'] as const;

  assert.deepEqual(togglePreference(selected, 'halal'), ['vegan', 'halal']);
  assert.deepEqual(selected, ['vegan']);
});

test('removes a selected preference', () => {
  assert.deepEqual(togglePreference(['vegan', 'halal'], 'vegan'), ['halal']);
});

test('does not add duplicate preference IDs', () => {
  assert.deepEqual(togglePreference(['vegan'], 'vegan'), []);
});
