import { useEffect, useRef, useState } from "react";
import { formationNames } from "../formations";
import * as repo from "../repository/teamRepository";
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
import { defaultFineRates } from "../types";

export interface TeamData {
  teamName: string;
  formationName: string;
  names: Record<string, string>;
  substitutes: Substitute[];
  players: Player[];
  archive: ArchivedLineup[];
  attendance: AttendanceRecord[];
  trainings: TrainingSession[];
  customDrills: Drill[];
  trainingTemplates: TrainingTemplate[];
  fineRates: FineRates;
  finePayments: FinePayment[];
  trainingDiagrams: TrainingDiagram[];
  lineupLoaded: boolean;
  setFormationName: (name: string) => void;
  setNames: (names: Record<string, string>) => void;
  setSubstitutes: (subs: Substitute[]) => void;
}

/**
 * Hlavní hook se všemi real-time listenery pro daný kód týmu – obdoba DisposableEffect
 * bloku v Android LineupScreen. `names`/`substitutes`/`formationName` se dají měnit lokálně
 * (optimisticky) přes setNames/setSubstitutes/setFormationName; efekt níže je pak sám
 * zapíše do Firestore (stejný vzor jako Android LaunchedEffect + saveLineup).
 */
export function useTeamData(teamCode: string): TeamData {
  const [teamName, setTeamName] = useState("");
  const [formationName, setFormationName] = useState(formationNames[0]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [substitutes, setSubstitutes] = useState<Substitute[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [archive, setArchive] = useState<ArchivedLineup[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [trainings, setTrainings] = useState<TrainingSession[]>([]);
  const [customDrills, setCustomDrills] = useState<Drill[]>([]);
  const [trainingTemplates, setTrainingTemplates] = useState<TrainingTemplate[]>([]);
  const [fineRates, setFineRates] = useState<FineRates>(defaultFineRates);
  const [finePayments, setFinePayments] = useState<FinePayment[]>([]);
  const [trainingDiagrams, setTrainingDiagrams] = useState<TrainingDiagram[]>([]);
  const [lineupLoaded, setLineupLoaded] = useState(false);

  // lineupLoaded se čte i zapisuje uvnitř saveLineup efektu bez re-registrace listeneru
  const lineupLoadedRef = useRef(false);

  useEffect(() => {
    setLineupLoaded(false);
    lineupLoadedRef.current = false;

    const unsubLineup = repo.listenLineup(teamCode, (newTeamName, newFormation, newNames, newSubs, newFineRates) => {
      setTeamName(newTeamName);
      setFormationName(newFormation);
      setFineRates(newFineRates);

      // Ochrana proti starým datům poškozeným dřívější chybou v ukládání sestavy (Firestore
      // merge duplicitně slučoval staré a nové pozice, takže stejný hráč mohl zůstat zapsaný
      // na víc pozicích zároveň) – pokud stejné jméno sedí na víc pozicích, necháme mu jen jednu.
      // Nejdřív zpracujeme pozice z AKTUÁLNÍHO rozestavení a teprve pak ty ostatní – jinak by
      // starý "duch" hráče v dávno nepoužívaném rozestavení mohl navždy vyhrát nad jeho novým,
      // právě provedeným přiřazením v aktuální sestavě.
      const orderedEntries = Object.entries(newNames).sort(
        (a, b) => Number(b[0].startsWith(`${newFormation}|`)) - Number(a[0].startsWith(`${newFormation}|`))
      );
      const seenNames = new Set<string>();
      const dedupedNames: Record<string, string> = {};
      for (const [key, name] of orderedEntries) {
        if (!seenNames.has(name)) {
          dedupedNames[key] = name;
          seenNames.add(name);
        }
      }
      setNames(dedupedNames);

      // Ochrana proti starým datům, kde stejný hráč skončil zapsaný jako startující i jako
      // náhradník – počítáme jen ze jmen v AKTUÁLNÍM rozestavení (ne ze všech historicky
      // použitých), jinak by hráč přiřazený kdykoliv v minulosti v jiné formaci byl navždy
      // blokován z náhradníků.
      const startingNames = new Set(
        Object.entries(dedupedNames)
          .filter(([key]) => key.startsWith(`${newFormation}|`))
          .map(([, name]) => name)
      );
      setSubstitutes(newSubs.filter((s) => !startingNames.has(s.name)));

      lineupLoadedRef.current = true;
      setLineupLoaded(true);
    });
    const unsubPlayers = repo.listenPlayers(teamCode, setPlayers);
    const unsubArchive = repo.listenArchive(teamCode, setArchive);
    const unsubAttendance = repo.listenAttendance(teamCode, setAttendance);
    const unsubTrainings = repo.listenTrainings(teamCode, setTrainings);
    const unsubCustomDrills = repo.listenCustomDrills(teamCode, setCustomDrills);
    const unsubTemplates = repo.listenTrainingTemplates(teamCode, setTrainingTemplates);
    const unsubFinePayments = repo.listenFinePayments(teamCode, setFinePayments);
    const unsubTrainingDiagrams = repo.listenTrainingDiagrams(teamCode, setTrainingDiagrams);

    return () => {
      unsubLineup();
      unsubPlayers();
      unsubArchive();
      unsubAttendance();
      unsubTrainings();
      unsubCustomDrills();
      unsubTemplates();
      unsubFinePayments();
      unsubTrainingDiagrams();
    };
  }, [teamCode]);

  // Zapisuje aktuální sestavu do Firestore – ale až po prvním přijatém snímku, ať
  // nepřepíšeme sdílená data prázdným výchozím stavem hned po startu appky.
  useEffect(() => {
    if (!lineupLoaded) return;
    repo.saveLineup(teamCode, formationName, names, substitutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamCode, lineupLoaded, formationName, names, substitutes]);

  return {
    teamName,
    formationName,
    names,
    substitutes,
    players,
    archive,
    attendance,
    trainings,
    customDrills,
    trainingTemplates,
    fineRates,
    finePayments,
    trainingDiagrams,
    lineupLoaded,
    setFormationName,
    setNames,
    setSubstitutes,
  };
}
