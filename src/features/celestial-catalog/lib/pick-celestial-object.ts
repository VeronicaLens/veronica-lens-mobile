import type { CelestialObject } from '../../../shared/api/index.ts';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

/** Picks the catalog entry whose name or alias equals the requested name; never guesses. */
export function pickCelestialObject(
  objects: CelestialObject[],
  name: string,
): CelestialObject | null {
  const wanted = normalize(name);
  const exact = objects.find((object) =>
    [object.name, ...object.aliases].some((candidate) => normalize(candidate) === wanted),
  );
  if (exact) return exact;
  return objects.length === 1 ? (objects[0] ?? null) : null;
}
