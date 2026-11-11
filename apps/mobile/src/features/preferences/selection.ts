export function togglePreference<T extends string>(selected: readonly T[], id: T): T[] {
  return selected.includes(id) ? selected.filter((selectedId) => selectedId !== id) : [...selected, id];
}
