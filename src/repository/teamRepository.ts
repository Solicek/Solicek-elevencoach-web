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
  FinePayment,
  FineRates,
  Player,
  Substitute,
  TrainingDiagram,
  TrainingSession,
  TrainingTemplate,
} from "../types";
import {
  archivedLineupToMap,
  attendanceRecordToMap,
  drillToMap,
  finePaymentToMap,
  fineRatesToMap,
  mapToArchivedLineup,
  mapToAttendanceRecord,
  mapToDrill,
  mapToFinePayment,
  mapToFineRates,
  mapToPlayer,
  mapToSubstitute,
  mapToTrainingDiagram,
  mapToTrainingSession,
  mapToTrainingTemplate,
  playerToMap,
  substituteToMap,
  trainingDiagramToMap,
  trainingSessionToMap,
  trainingTemplateToMap,
} from "./mappers";

/** Znaky pro kód týmu – bez matoucích 0/O/1/I. */
const TEAM_CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function teamDoc(teamCode: string) {
  return doc(db, "teams", teamCode);
}
function viewerCodeDoc(code: string) {
  return doc(db, "viewerCodes", code);
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
function finePaymentsRef(teamCode: string) {
  return collection(teamDoc(teamCode), "finePayments");
}
function trainingDiagramsRef(teamCode: string) {
  return collection(teamDoc(teamCode), "trainingDiagrams");
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

export interface TeamAccess {
  teamCode: string;
  teamName: string;
  isReadOnly: boolean;
}

/**
 * Zjistí, co zadaný kód znamená: buď je to přímo kód týmu (plný přístup), nebo kapitánský
 * kód (jen prohlížení, viz getOrCreateViewerCode) – v obou případech vrátí skutečný kód týmu,
 * jeho název a jestli jde o přístup jen pro čtení. Vrátí null, pokud kód neodpovídá ničemu.
 */
export async function resolveTeamAccess(rawCode: string): Promise<TeamAccess | null> {
  await ensureSignedIn();
  const code = rawCode.toUpperCase();

  const teamSnap = await getDoc(teamDoc(code));
  if (teamSnap.exists()) {
    return { teamCode: code, teamName: (teamSnap.data().teamName as string) ?? "", isReadOnly: false };
  }

  const viewerSnap = await getDoc(viewerCodeDoc(code));
  if (viewerSnap.exists()) {
    const teamCode = viewerSnap.data().teamCode as string;
    const realTeamSnap = await getDoc(teamDoc(teamCode));
    if (!realTeamSnap.exists()) return null;
    return { teamCode, teamName: (realTeamSnap.data().teamName as string) ?? "", isReadOnly: true };
  }

  return null;
}

/**
 * Vrátí kapitánský kód týmu (jen pro prohlížení) – pokud ještě neexistuje, vygeneruje nový
 * a uloží ho jak do samostatné kolekce viewerCodes/{kód} -> teamCode (pro rychlé vyhledání
 * při připojování), tak jako pole na dokumentu týmu (aby se příště nemusel generovat znovu).
 */
export async function getOrCreateViewerCode(teamCode: string): Promise<string> {
  await ensureSignedIn();
  const teamSnap = await getDoc(teamDoc(teamCode));
  const existing = teamSnap.data()?.viewerCode as string | undefined;
  if (existing) return existing;

  let code: string;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    code = randomTeamCode();
    const snap = await getDoc(viewerCodeDoc(code));
    if (!snap.exists()) break;
  }
  await setDoc(viewerCodeDoc(code), { teamCode });
  await updateDoc(teamDoc(teamCode), { viewerCode: code });
  return code;
}

// --- Aktuální sestava (rozestavení + jména + náhradníci) ---

export function listenLineup(
  teamCode: string,
  onChange: (
    teamName: string,
    formationName: string,
    names: Record<string, string>,
    substitutes: Substitute[],
    fineRates: FineRates
  ) => void
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
    const fineRates = mapToFineRates(data.fineRates as Record<string, unknown> | undefined);
    onChange(teamName, formationName, names, substitutes, fineRates);
  });
}

/** Sazby pokut si každý tým nastavuje sám (viz záložka Pokuty) – uložené na dokumentu týmu. */
export async function saveFineRates(teamCode: string, rates: FineRates): Promise<void> {
  await updateDoc(teamDoc(teamCode), { fineRates: fineRatesToMap(rates) });
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
  // Pozor: musí to být updateDoc(), ne setDoc(..., {merge:true}) – u setDoc+merge Firestore
  // vnořená mapová pole (names, playerStats) sloučí rekurzivně klíč po klíči, takže smazaná/
  // přesunutá pozice by se v nich nikdy doopravdy neodstranila a při dalším načtení (např. po
  // přepnutí mezi zápasy) by se vrátila zpět jako "duchovitá" duplicita hráče na hřišti.
  // Stejná chyba (a stejné řešení) jako dřív u saveLineup() pro živou sestavu – viz tam.
  await updateDoc(doc(archiveRef(teamCode), entry.id), archivedLineupToMap(entry));
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

// --- Pokuty (evidence zaplacení pokut za karty) ---

export function listenFinePayments(teamCode: string, onChange: (payments: FinePayment[]) => void): Unsubscribe {
  return onSnapshot(finePaymentsRef(teamCode), (snap) => {
    onChange(snap.docs.map((d) => mapToFinePayment(d.id, d.data())));
  });
}

export async function setFinePaymentStatus(teamCode: string, id: string, matchId: string, playerName: string, paid: boolean): Promise<void> {
  await setDoc(doc(finePaymentsRef(teamCode), id), finePaymentToMap({ id, matchId, playerName, paid }));
}

// --- Nákresy tréninků (Trénink beta) ---

export function listenTrainingDiagrams(teamCode: string, onChange: (diagrams: TrainingDiagram[]) => void): Unsubscribe {
  const q = query(trainingDiagramsRef(teamCode), orderBy("createdAtMillis", "desc"));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => mapToTrainingDiagram(d.id, d.data())));
  });
}

export async function addTrainingDiagram(teamCode: string, diagram: TrainingDiagram): Promise<void> {
  const data = { ...trainingDiagramToMap(diagram), createdAtMillis: Date.now() };
  await setDoc(doc(trainingDiagramsRef(teamCode), diagram.id), data);
}

export async function updateTrainingDiagram(teamCode: string, diagram: TrainingDiagram): Promise<void> {
  await setDoc(doc(trainingDiagramsRef(teamCode), diagram.id), trainingDiagramToMap(diagram), { merge: true });
}

export async function deleteTrainingDiagram(teamCode: string, diagram: TrainingDiagram): Promise<void> {
  await deleteDoc(doc(trainingDiagramsRef(teamCode), diagram.id));
}

// Timestamp type re-exported in case callers need it (not currently used directly).
export type { Timestamp };
