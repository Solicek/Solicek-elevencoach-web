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
}

/** Uvolní všechny pozice AKTUÁLNÍHO rozestavení najednou – náhradníci zůstávají beze změny. */
export function computeClearLineup(players: Player[], names: Record<string, string>, formationName: string): ClearLineupResult {
  const prefix = `${formationName}|`;
  const newNames: Record<string, string> = {};
  for (const [key, name] of Object.entries(names)) {
    if (!key.startsWith(prefix)) newNames[key] = name;
  }
  const changedPlayers = players
    .filter((p) => p.positionKey?.startsWith(prefix))
    .map((p) => ({ ...p, positionKey: null, positionDisplayName: null }));
  return { changedPlayers, newNames };
}
