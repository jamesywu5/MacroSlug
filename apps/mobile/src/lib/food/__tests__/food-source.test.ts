/// <reference types="jest" />

import { createApiFoodSource } from '../food-source';
import { MOCK_FOOD_ROWS } from '../mock-foods';

const realFetch = globalThis.fetch;
let requestedUrls: string[] = [];

/** Replaces fetch with a fake that answers every request with `body`. */
function fakeFetch(body: unknown, status = 200) {
  requestedUrls = [];
  globalThis.fetch = (async (url: string) => {
    requestedUrls.push(String(url));
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  }) as unknown as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('createApiFoodSource', () => {
  it('unwraps the { foods } object the API returns', async () => {
    fakeFetch({ foods: MOCK_FOOD_ROWS });
    const rows = await createApiFoodSource('http://api.test').getFoods();
    expect(rows).toEqual(MOCK_FOOD_ROWS);
  });

  it('requests /api/foods without a trailing-slash problem or query string', async () => {
    fakeFetch({ foods: [] });
    await createApiFoodSource('http://api.test/').getFoods({ diningHall: 'Crown/Merrill' });
    expect(requestedUrls).toEqual(['http://api.test/api/foods']);
  });

  it('filters by dining hall and meal on the device', async () => {
    fakeFetch({ foods: MOCK_FOOD_ROWS });
    const rows = await createApiFoodSource('http://api.test').getFoods({
      diningHall: 'Crown/Merrill',
      meal: 'Dinner',
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.dining_hall === 'Crown/Merrill' && r.meal_type === 'Dinner')).toBe(
      true,
    );
  });

  it('returns an empty list when the API has no foods', async () => {
    fakeFetch({ foods: [] });
    expect(await createApiFoodSource('http://api.test').getFoods()).toEqual([]);
  });

  it('throws a clear error when the API responds with an error status', async () => {
    fakeFetch({ error: 'Unable to retrieve dining data' }, 500);
    await expect(createApiFoodSource('http://api.test').getFoods()).rejects.toThrow('HTTP 500');
  });

  it.each([[[]], [{}], [{ foods: null }], [{ foods: 'nope' }]])(
    'throws when the response is not { foods: [...] } (%j)',
    async (body) => {
      fakeFetch(body);
      await expect(createApiFoodSource('http://api.test').getFoods()).rejects.toThrow(
        'unexpected response',
      );
    },
  );
});