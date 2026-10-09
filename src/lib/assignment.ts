import type { Player, PlayerPosition, Substitute } from "../types";

export const positionNames: Record<string, string> = {
  B: "Brankář",
  O: "Obránce",
  Z: "Záložník",
  U: "Útočník",
  DZ: "Defenzivní záložník",
  OZ: "Ofenzivní záložník",
};

/**
 * Skupiny příbuzných pozic pro výběr hráče na pozici hřiště – obecný "Záložník" (Z) je
 * kompatibilní i se specializovanými "DZ"/"OZ" a naopak, aby hráč označený jen jako DZ/OZ
 * nezmizel z nabídky pro běžný záložnický slot (a naopak).
 */
export const positionGroups: Record<string, string[]> = {
  Z: ["Z", "DZ", "OZ"],
  DZ: ["DZ", "Z"],
  OZ: ["OZ", "Z"],
};

export function playerMatchesPositionCode(preferredPositions: string[], positionCode: string): boolean {
  const compatible = positionGroups[positionCode] ?? [positionCode];
  return preferredPositions.some((p) => compatible.includes(p));
}

/** Řadicí pořadí pro seznam hráčů: Brankář, Obránce, Záložník (OZ i DZ dohromady), Útočník, bez pozice naposled. */
export function positionSortOrder(player: Player): number {
  const positions = player.preferredPositions;
  if (positions.includes("B")) return 0;
  if (positions.includes("O")) return 1;
  if (positions.includes("Z") || positions.includes("DZ") || positions.includes("OZ")) return 2;
  if (positions.includes("U")) return 3;
  return 4;
}

export function positionDisplayName(pos: PlayerPosition): string {
  const typeName = positionNames[pos.label] ?? pos.label;
  const idx = Number(pos.id.split("_").pop()) || 0;
  return `${typeName} ${idx + 1}`;
}

export interface AssignmentResult {
  changedPlayers: Player[];
  newNames: Record<string, string>;
  newSubstitutes: Substitute[];
}

/**
 * Sestaví novou sestavu/roster po přiřazení hráče na pozici.
 *
 * Kdo je aktuálně kde přiřazený se zjišťuje výhradně z `names` (aktuální sestava), NE z
 * Player.positionKey – to pole se do rosteru zapisuje asynchronně přes Firestore a při
 * rychlém po sobě jdoucím přiřazování může být o krok pozadu.
 */
export function computeAssignment(
  players: Player[],
  names: Record<string, string>,
  substitutes: Substitute[],
  player: Player,
  pos: PlayerPosition,
  formationName: string
): AssignmentResult {
  const newKey = `${formationName}|${pos.id}`;
  const changed: Player[] = [];
  let newSubstitutes = substitutes;

  const previousOccupantName = names[newKey];
  if (previousOccupantName && previousOccupantName !== player.name) {
    const previousOccupant = players.find((p) => p.name === previousOccupantName);
    if (previousOccupant) {
      changed.push({ ...previousOccupant, positionKey: null, positionDisplayName: null });
    }
    if (!newSubstitutes.some((s) => s.name === previousOccupantName)) {
      newSubstitutes = [
        ...newSubstitutes,
        {
          id: crypto.randomUUID(),
          name: previousOccupantName,
          positions: previousOccupant?.preferredPositions ?? [],
        },
      ];
    }
  }

  const newNames: Record<string, string> = {};
  for (const [key, name] of Object.entries(names)) {
    if (name !== player.name) newNames[key] = name;
  }
  newNames[newKey] = player.name;

  changed.push({
    ...player,
    positionKey: newKey,
    positionDisplayName: `${positionDisplayName(pos)} (${formationName})`,
  });
  newSubstitutes = newSubstitutes.filter((s) => s.name !== player.name);

  return { changedPlayers: changed, newNames, newSubstitutes };
}

/**
 * Přidá hráče mezi náhradníky – ignoruje duplicitní přidání (hráč už je náhradník, nebo už
 * hraje v aktuální sestavě). Guard přímo tady u zápisu stavu, ne jen ve výběrovém dialogu,
 * ať nejde stejného hráče přidat dvakrát ani rychlým dvojím klepnutím.
 */
export function computeAddSubstitute(
  substitutes: Substitute[],
  names: Record<string, string>,
  formationName: string,
  substitute: Substitute
): Substitute[] {
  const prefix = `${formationName}|`;
  const isCurrentStarter = Object.entries(names).some(([key, name]) => key.startsWith(prefix) && name === substitute.name);
  const isAlreadySubstitute = substitutes.some((s) => s.name === substitute.name);
  if (isCurrentStarter || isAlreadySubstitute) return substitutes;
  return [...substitutes, substitute];
}

/** Uvolní pozici na dané klíči – hráč zůstane v rosteru, ale bez přiřazené pozice. */
export function computeUnassign(
  players: Player[],
  names: Record<string, string>,
  substitutes: Substitute[],
  key: string
): AssignmentResult {
  const occupantName = names[key];
  const occupant = occupantName ? players.find((p) => p.name === occupantName) : undefined;
  const changed = occupant ? [{ ...occupant, positionKey: null, positionDisplayName: null }] : [];
  const newNames = { ...names };
  delete newNames[key];
  return { changedPlayers: changed, newNames, newSubstitutes: substitutes };
}

export interface ClearLineupResult {
  changedPlayers: Player[];
  newNames: Record<string, string>;
  newSubstitutes: Substitute[];
}

/**
 * Při přepnutí rozestavení hráč, který byl na hřišti ve STARÉM rozestavení, ale v NOVÉM
 * rozestavení pro něj není odpovídající pozice (jiný počet slotů daného typu), by jinak úplně
 * zmizel z pohledu – není na hřišti (jeho klíč patří staré formaci) ani mezi náhradníky. Přidáme
 * ho proto rovnou na lavičku, ať zůstane viditelný a dá se znovu přiřadit. A naopak: hráč, který
 * v NOVÉM rozestavení pozici MÁ (typicky při přepnutí ZPĚT na rozestavení, kde už dřív pozici
 * měl – staré přiřazení v `names` se při přepínání nemaže, aby šlo přepínat tam a zpět beze
 * ztráty), se z náhradníků odebere přímo tady, ať nezůstane zdvojený na hřišti i na lavičce.
 */
export function computeFormationChange(
  players: Player[],
  names: Record<string, string>,
  substitutes: Substitute[],
  oldFormationName: string,
  newFormationName: string
): Substitute[] {
  const oldPrefix = `${oldFormationName}|`;
  const newPrefix = `${newFormationName}|`;
  const oldStarterNames = new Set(
    Object.entries(names)
      .filter(([key]) => key.startsWith(oldPrefix))
      .map(([, name]) => name)
  );
  const newStarterNames = new Set(
    Object.entries(names)
      .filter(([key]) => key.startsWith(newPrefix))
      .map(([, name]) => name)
  );
  const existingSubNames = new Set(substitutes.map((s) => s.name));
  const keptSubstitutes = substitutes.filter((s) => !newStarterNames.has(s.name));

  const additions: Substitute[] = [];
  for (const name of oldStarterNames) {
    if (newStarterNames.has(name) || existingSubNames.has(name)) continue;
    const player = players.find((p) => p.name === name);
    additions.push({ id: crypto.randomUUID(), name, positions: player?.preferredPositions ?? [] });
  }

  return additions.length > 0 ? [...keptSubstitutes, ...additions] : keptSubstitutes;
}

/** Uvolní všechny pozice AKTUÁLNÍHO rozestavení a vyprázdní i náhradníky (tlačítko "Smazat sestavu"). */
export function computeClearLineup(players: Player[], names: Record<string, string>, formationName: string): ClearLineupResult {
  const prefix = `${formationName}|`;
  const newNames: Record<string, string> = {};
  for (const [key, name] of Object.entries(names)) {
    if (!key.startsWith(prefix)) newNames[key] = name;
  }
  const changedPlayers = players
    .filter((p) => p.positionKey?.startsWith(prefix))
    .map((p) => ({ ...p, positionKey: null, positionDisplayName: null }));
  return { changedPlayers, newNames, newSubstitutes: [] };
}
