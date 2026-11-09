import json
from collections import defaultdict

def load(p):
    out = defaultdict(list)
    for dh, meals in json.load(open(p)).items():
        for meal, items in meals.items():
            for i in items:
                name = i['name'].replace('&amp;', '&').strip()
                out[(dh, meal, name)].append((i['calories'], tuple(sorted(i['macros'].items())), tuple(i['allergens'])))
    return out

old, new = load('food_old.json'), load('food.json')
print('old', sum(map(len, old.values())), 'new', sum(map(len, new.values())))
changed = [k for k in old.keys() & new.keys() if sorted(old[k]) != sorted(new[k])]
print('SAME ITEM, DIFFERENT VALUES:', len(changed))
for k in changed[:10]:
    print('  ', k, old[k], '->', new[k])
only_old = sorted(old.keys() - new.keys())
only_new = sorted(new.keys() - old.keys())
print('ONLY IN OLD:', len(only_old))
for k in only_old:
    print('  ', k[0], k[1], k[2])
print('ONLY IN NEW:', len(only_new))
for k in only_new:
    print('  ', k[0], k[1], k[2])