import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db, ensureSignedIn } from "../firebase";
import { formationNames } from "../formations";
import type {
  ArchivedLineup,
  AttendanceRecord,
  Drill,
  Player,
  Substitute,
  TrainingSession,
  TrainingTemplate,
} from "../types";
import {
  archivedLineupToMap,
  attendanceRecordToMap,
  drillToMap,
  mapToArchivedLineup,
  mapToAttendanceRecord,
  mapToDrill,
  mapToPlayer,
  mapToSubstitute,
  mapToTrainingSession,
  mapToTrainingTemplate,
  playerToMap,
  substituteToMap,
  trainingSessionToMap,
  trainingTemplateToMap,
} from "./mappers";

/** Znaky pro kód týmu – bez matoucích 0/O/1/I. */
const TEAM_CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function teamDoc(teamCode: string) {
  return doc(db, "teams", teamCode);
}
function playersRef(teamCode: string) {
  return collection(teamDoc(teamCode), "players");
}
function archiveRef(teamCode: string) {
  return collection(teamDoc(teamCode), "archive");
}
function attendanceRef(teamCode: string) {
  return collection(teamDoc(teamCode), "attendance");
}
function trainingsRef(teamCode: string) {
  return collection(teamDoc(teamCode), "trainings");
}
function customDrillsRef(teamCode: string) {
  return collection(teamDoc(teamCode), "customDrills");
}
function trainingTemplatesRef(teamCode: string) {
  return collection(teamDoc(teamCode), "trainingTemplates");
}

function randomTeamCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += TEAM_CODE_CHARS[Math.floor(Math.random() * TEAM_CODE_CHARS.length)];
  return code;
}

/** Založí nový tým s náhodným kódem a daným názvem, vrátí kód. */
export async function createTeam(teamName: string): Promise<string> {
  await ensureSignedIn();
  let code: string;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    code = randomTeamCode();
    const snap = await getDoc(teamDoc(code));
    if (!snap.exists()) break;
  }
  await setDoc(teamDoc(code), { createdAt: serverTimestamp(), teamName });
  return code;
}

/** Vrátí název týmu pro daný kód, nebo null pokud tým s tímto kódem neexistuje. */
export async function getTeamName(code: string): Promise<string | null> {
  await ensureSignedIn();
  const snap = await getDoc(teamDoc(code.toUpperCase()));
  if (!snap.exists()) return null;
  return (snap.data().teamName as string) ?? "";
}

// --- Aktuální sestava (rozestavení + jména + náhradníci) ---

export function listenLineup(
  teamCode: string,
  onChange: (teamName: string, formationName: string, names: Record<string, string>, substitutes: Substitute[]) => void
): Unsubscribe {
  return onSnapshot(teamDoc(teamCode), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    const teamName = (data.teamName as string) ?? "";
    const lineup = (data.lineup as Record<string, unknown>) ?? {};
    const formationName = (lineup.formationName as string) ?? formationNames[0];
    const names = (lineup.names as Record<string, string>) ?? {};
    const substitutesRaw = Array.isArray(lineup.substitutes) ? (lineup.substitutes as Record<string, unknown>[]) : [];
    const substitutes = substitutesRaw.map(mapToSubstitute);
    onChange(teamName, formationName, names, substitutes);
  });
}

export async function saveLineup(
  teamCode: string,
  formationName: string,
  names: Record<string, string>,
  substitutes: Substitute[]
): Promise<void> {
  // Pozor: musí to být updateDoc() s "tečkovanými" cestami pole, ne setDoc(..., {merge:true})
  // s vnořeným objektem ("lineup": {...}) – Firestore vnořené mapy slučuje rekurzivně klíč po
  // klíči, takže smazaná/přesunutá pozice by se v "lineup.names" nikdy doopravdy neodstranila
  // a při dalším uložení by se vrátila zpět (duplicity hráče na hřišti).
  await updateDoc(teamDoc(teamCode), {
    "lineup.formationName": formationName,
    "lineup.names": names,
    "lineup.substitutes": substitutes.map(substituteToMap),
  });
}

// --- Hráči (soupiska) ---

export function listenPlayers(teamCode: string, onChange: (players: Player[]) => void): Unsubscribe {
  return onSnapshot(playersRef(teamCode), (snap) => {
    onChange(snap.docs.map((d) => mapToPlayer(d.id, d.data())));
  });
}

export async function savePlayer(teamCode: string, player: Player): Promise<void> {
  await setDoc(doc(playersRef(teamCode), player.id), playerToMap(player));
}

export async function deletePlayer(teamCode: string, player: Player): Promise<void> {
  await deleteDoc(doc(playersRef(teamCode), player.id));
}

// --- Archiv zápasů ---

export function listenArchive(teamCode: string, onChange: (entries: ArchivedLineup[]) => void): Unsubscribe {
  const q = query(archiveRef(teamCode), orderBy("createdAtMillis", "desc"));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => mapToArchivedLineup(d.id, d.data())));
  });
}

export async function addArchiveEntry(teamCode: string, entry: ArchivedLineup): Promise<void> {
  const data = { ...archivedLineupToMap(entry), createdAtMillis: Date.now() };
  await setDoc(doc(archiveRef(teamCode), entry.id), data);
}

export async function updateArchiveEntry(teamCode: string, entry: ArchivedLineup): Promise<void> {
  await setDoc(doc(archiveRef(teamCode), entry.id), archivedLineupToMap(entry), { merge: true });
}

export async function deleteArchiveEntry(teamCode: string, entry: ArchivedLineup): Promise<void> {
  await deleteDoc(doc(archiveRef(teamCode), entry.id));
}

// --- Docházka ---

export function listenAttendance(teamCode: string, onChange: (records: AttendanceRecord[]) => void): Unsubscribe {
  const q = query(attendanceRef(teamCode), orderBy("createdAtMillis", "desc"));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => mapToAttendanceRecord(d.id, d.data())));
  });
}

export async function addAttendanceRecord(teamCode: string, record: AttendanceRecord): Promise<void> {
  const data = { ...attendanceRecordToMap(record), createdAtMillis: Date.now() };
  await setDoc(doc(attendanceRef(teamCode), record.id), data);
}

export async function updateAttendanceRecord(teamCode: string, record: AttendanceRecord): Promise<void> {
  await setDoc(doc(attendanceRef(teamCode), record.id), attendanceRecordToMap(record), { merge: true });
}

export async function deleteAttendanceRecord(teamCode: string, record: AttendanceRecord): Promise<void> {
  await deleteDoc(doc(attendanceRef(teamCode), record.id));
}

// --- Tréninky ---

export function listenTrainings(teamCode: string, onChange: (sessions: TrainingSession[]) => void): Unsubscribe {
  const q = query(trainingsRef(teamCode), orderBy("createdAtMillis", "desc"));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => mapToTrainingSession(d.id, d.data())));
  });
}

export async function addTrainingSession(teamCode: string, session: TrainingSession): Promise<void> {
  const data = { ...trainingSessionToMap(session), createdAtMillis: Date.now() };
  await setDoc(doc(trainingsRef(teamCode), session.id), data);
}

export async function updateTrainingSession(teamCode: string, session: TrainingSession): Promise<void> {
  await setDoc(doc(trainingsRef(teamCode), session.id), trainingSessionToMap(session), { merge: true });
}

export async function deleteTrainingSession(teamCode: string, session: TrainingSession): Promise<void> {
  await deleteDoc(doc(trainingsRef(teamCode), session.id));
}

// --- Vlastní cvičení týmu (navíc ke vestavěné knihovně) ---

export function listenCustomDrills(teamCode: string, onChange: (drills: Drill[]) => void): Unsubscribe {
  return onSnapshot(customDrillsRef(teamCode), (snap) => {
    onChange(snap.docs.map((d) => mapToDrill(d.id, d.data())));
  });
}

export async function addCustomDrill(teamCode: string, drill: Drill): Promise<void> {
  await setDoc(doc(customDrillsRef(teamCode), drill.id), drillToMap(drill));
}

export async function deleteCustomDrill(teamCode: string, drill: Drill): Promise<void> {
  await deleteDoc(doc(customDrillsRef(teamCode), drill.id));
}

// --- Šablony tréninků ---

export function listenTrainingTemplates(teamCode: string, onChange: (templates: TrainingTemplate[]) => void): Unsubscribe {
  return onSnapshot(trainingTemplatesRef(teamCode), (snap) => {
    onChange(snap.docs.map((d) => mapToTrainingTemplate(d.id, d.data())));
  });
}

export async function addTrainingTemplate(teamCode: string, template: TrainingTemplate): Promise<void> {
  await setDoc(doc(trainingTemplatesRef(teamCode), template.id), trainingTemplateToMap(template));
}

export async function deleteTrainingTemplate(teamCode: string, template: TrainingTemplate): Promise<void> {
  await deleteDoc(doc(trainingTemplatesRef(teamCode), template.id));
}

// Timestamp type re-exported in case callers need it (not currently used directly).
export type { Timestamp };
