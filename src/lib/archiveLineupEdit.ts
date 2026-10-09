import type { Player, PlayerPosition, Substitute } from "../types";

export interface ArchiveLineupState {
  names: Record<string, string>;
  substitutes: Substitute[];
}

/**
 * Přiřazení hráče na pozici PŘÍMO v uloženém zápase (ne v aktuální/živé sestavě) – proto na
 * rozdíl od computeAssignment() v assignment.ts vůbec nesahá na Player.positionKey, ten sleduje
 * jen umístění v AKTUÁLNÍ sestavě a přiřazením v archivovaném zápase by se neměl přepsat.
 */
export function computeArchiveAssignment(
  state: ArchiveLineupState,
  player: Player,
  pos: PlayerPosition,
  formationName: string
): ArchiveLineupState {
  const key = `${formationName}|${pos.id}`;
  const newNames: Record<string, string> = {};
  for (const [k, v] of Object.entries(state.names)) {
    if (v === player.name && k !== key) continue; // hráč nesmí být na dvou pozicích v jednom zápase
    newNames[k] = v;
  }
  newNames[key] = player.name;
  const newSubstitutes = state.substitutes.filter((s) => s.name !== player.name);
  return { names: newNames, substitutes: newSubstitutes };
}

/**
 * Přidá hráče mezi náhradníky v uloženém zápase – ignoruje duplicitní přidání (hráč už je
 * náhradník, nebo už hraje v aktuální sestavě zápasu). Guard přímo tady u zápisu stavu, ne
 * jen ve výběrovém dialogu, ať nejde stejného hráče přidat dvakrát ani rychlým dvojím klepnutím.
 */
export function computeArchiveAddSubstitute(
  state: ArchiveLineupState,
  formationName: string,
  substitute: Substitute
): Substitute[] {
  const prefix = `${formationName}|`;
  const isCurrentStarter = Object.entries(state.names).some(([key, name]) => key.startsWith(prefix) && name === substitute.name);
  const isAlreadySubstitute = state.substitutes.some((s) => s.name === substitute.name);
  if (isCurrentStarter || isAlreadySubstitute) return state.substitutes;
  return [...state.substitutes, substitute];
}

export function computeArchiveUnassign(state: ArchiveLineupState, key: string): ArchiveLineupState {
  const newNames = { ...state.names };
  delete newNames[key];
  return { names: newNames, substitutes: state.substitutes };
}

/**
 * Při změně rozestavení v uloženém zápase přesune hráče, pro které v novém rozestavení není
 * slot, mezi náhradníky – a naopak: hráč, který v NOVÉM rozestavení pozici MÁ (typicky při
 * přepnutí ZPĚT na rozestavení, kde už dřív pozici měl – staré přiřazení v `names` se při
 * přepínání nemaže, aby šlo přepínat tam a zpět beze ztráty), se z náhradníků odebere, ať
 * nezůstane zdvojený na hřišti i v seznamu náhradníků zároveň.
 */
export function computeArchiveFormationChange(
  state: ArchiveLineupState,
  oldFormationName: string,
  newFormationName: string
): ArchiveLineupState {
  const oldPrefix = `${oldFormationName}|`;
  const newPrefix = `${newFormationName}|`;
  const oldStarterNames = new Set(
    Object.entries(state.names).filter(([k]) => k.startsWith(oldPrefix)).map(([, v]) => v)
  );
  const newStarterNames = new Set(
    Object.entries(state.names).filter(([k]) => k.startsWith(newPrefix)).map(([, v]) => v)
  );
  const existingSubNames = new Set(state.substitutes.map((s) => s.name));
  const keptSubstitutes = state.substitutes.filter((s) => !newStarterNames.has(s.name));
  const additions: Substitute[] = [];
  for (const name of oldStarterNames) {
    if (newStarterNames.has(name) || existingSubNames.has(name)) continue;
    additions.push({ id: crypto.randomUUID(), name, positions: [] });
  }
  return { names: state.names, substitutes: additions.length > 0 ? [...keptSubstitutes, ...additions] : keptSubstitutes };
}
