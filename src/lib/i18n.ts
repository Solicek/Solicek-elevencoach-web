/**
 * Překladová vrstva mezi ULOŽENÝMI hodnotami a tím, co vidí uživatel.
 *
 * Ve Firestore se kategorické hodnoty ukládají jako české řetězce ("Soutěžní", "Vedení míče",
 * pozice "O"/"Z"…) a musí tak zůstat – sdílí je Android i web a přepsat je by znamenalo
 * migraci všech dokumentů na obou platformách. Beru je proto jako neprůhledné KÓDY a překládám
 * je až tady, při vykreslení. Přidání dalšího jazyka je pak jen rozšíření slovníků níže,
 * nulový zásah do dat.
 */

export type Lang = "cs" | "en";

/** Slovenština míří na češtinu – slovenskému trenérovi poslouží líp než angličtina. */
function detectLang(): Lang {
  const nav = (typeof navigator !== "undefined" ? navigator.language : "") ?? "";
  const code = nav.toLowerCase();
  return code.startsWith("cs") || code.startsWith("sk") ? "cs" : "en";
}

let lang: Lang = detectLang();

export function currentLang(): Lang {
  return lang;
}

/** Změna jazyka se projeví až po překreslení – zatím se volá jen při startu. */
export function setLang(next: Lang): void {
  lang = next;
}

/** Exportováno kvůli generátoru androidího Labels.kt (scripts/genAndroidLabels.mjs). */
export const STRINGS = {
  // Spodní navigace
  "nav.lineup": { cs: "Sestava", en: "Lineup" },
  "nav.calendar": { cs: "Kalendář", en: "Calendar" },
  "nav.roster": { cs: "Soupiska", en: "Roster" },
  "nav.tactics": { cs: "Taktika", en: "Tactics" },
  "nav.history": { cs: "Historie", en: "History" },
  "nav.attendance": { cs: "Docházka", en: "Attendance" },
  "nav.trainings": { cs: "Tréninky", en: "Trainings" },
  "nav.trainingBeta": { cs: "Trénink (beta)", en: "Training (beta)" },
  "nav.fines": { cs: "Pokuty", en: "Fines" },
  "nav.more": { cs: "Více", en: "More" },
  "common.close": { cs: "Zavřít", en: "Close" },

  // Sestava
  "lineup.formation": { cs: "Rozestavení", en: "Formation" },
  "lineup.clear": { cs: "Smazat sestavu", en: "Clear lineup" },
  "lineup.clearConfirmTitle": { cs: "Smazat sestavu?", en: "Clear lineup?" },
  "lineup.clearConfirmBody": {
    cs: "Opravdu chceš vyčistit sestavu? Všichni hráči se uvolní z pozic na hřišti a vyprázdní se i náhradníci.",
    en: "Really clear the lineup? All players will be removed from their positions and the bench will be emptied too.",
  },

  // Výběr hráče na pozici
  "picker.title": { cs: "Vybrat hráče", en: "Pick a player" },
  "picker.current": { cs: "Aktuálně", en: "Currently" },
  "picker.fromRoster": { cs: "Vybrat z rosteru", en: "Pick from roster" },
  "picker.noneForPosition": {
    cs: "Žádný hráč s touto pozicí zatím není v rosteru.",
    en: "No player with this position in the roster yet.",
  },
  "picker.orAddNew": { cs: "Nebo přidat nového hráče:", en: "Or add a new player:" },
  "picker.playerName": { cs: "Jméno hráče", en: "Player name" },
  "picker.duplicateName": { cs: "Hráč s tímto jménem už v rosteru je.", en: "A player with this name is already in the roster." },
  "picker.clearSlot": { cs: "Uvolnit pozici", en: "Clear position" },
  "picker.unassigned": { cs: "volný", en: "unassigned" },

  // Náhradníci
  "subs.title": { cs: "Náhradníci", en: "Substitutes" },
  "subs.add": { cs: "+ Přidat náhradníka", en: "+ Add substitute" },
  "subs.addTitle": { cs: "Přidat náhradníka", en: "Add substitute" },
  "subs.noneAvailable": {
    cs: "Žádní další hráči v rosteru. Přidej hráče v záložce Soupiska.",
    en: "No other players in the roster. Add players on the Roster tab.",
  },
  "subs.noPosition": { cs: "bez pozice", en: "no position" },

  // Přihlášení k týmu
  "gate.appName": { cs: "Sestava", en: "Lineup" },
  "gate.joinNamed": {
    cs: 'Chystáš se připojit k týmu "{name}".',
    en: 'You are about to join the team "{name}".',
  },
  "gate.intro": {
    cs: "Založ nový tým, nebo se připoj ke kódu, který ti poslal druhý trenér.",
    en: "Create a new team, or join with a code another coach sent you.",
  },
  "gate.teamName": { cs: "Název týmu", en: "Team name" },
  "gate.createTeam": { cs: "Založit nový tým", en: "Create new team" },
  "gate.or": { cs: "nebo", en: "or" },
  "gate.teamCode": { cs: "Kód týmu", en: "Team code" },
  "gate.joinWithCode": { cs: "Připojit se kódem", en: "Join with code" },
  "gate.createFailed": { cs: "Založení týmu se nepovedlo", en: "Could not create the team" },
  "gate.joinFailed": { cs: "Připojení se nepovedlo", en: "Could not join" },
  "gate.codeNotFound": {
    cs: "Kód nenalezen – zkontroluj, že jsi ho opsal správně.",
    en: "Code not found – check that you typed it correctly.",
  },
  "gate.joinTitle": { cs: "Připojit se k týmu?", en: "Join the team?" },
  "gate.joinNoName": {
    cs: "Tým s tímto kódem nemá vyplněný název. Opravdu se chceš připojit?",
    en: "The team with this code has no name set. Do you still want to join?",
  },
  "gate.readOnlyNote": {
    cs: "👁 Tohle je kapitánský kód – appka se otevře jen pro prohlížení, bez možnosti cokoliv upravovat.",
    en: "👁 This is a captain code – the app opens in view-only mode, nothing can be edited.",
  },
  "gate.join": { cs: "Připojit se", en: "Join" },

  // Soupiska
  "roster.empty": {
    cs: "Zatím žádní hráči.\nPřidej prvního hráče!",
    en: "No players yet.\nAdd your first player!",
  },
  "roster.noPosition": { cs: "Bez pozice", en: "No position" },
  "roster.notPlaying": { cs: "nehraje", en: "not in lineup" },
  "roster.addPlayer": { cs: "+ Přidat hráče", en: "+ Add player" },
  "roster.addTitle": { cs: "Přidat hráče", en: "Add player" },
  "roster.editTitle": { cs: "Upravit hráče", en: "Edit player" },
  "roster.positionsHint": { cs: "Pozice (lze vybrat víc):", en: "Positions (you can pick several):" },

  // Uložení sestavy do archivu
  "saveLineup.title": { cs: "Uložit sestavu do archivu", en: "Save lineup to archive" },
  "saveLineup.date": { cs: "Datum (DD-MM-RRRR)", en: "Date (DD-MM-YYYY)" },
  "saveLineup.opponent": { cs: "S kým se hrálo", en: "Opponent" },
  "saveLineup.matchType": { cs: "Typ zápasu:", en: "Match type:" },
  "saveLineup.homeAway": { cs: "Doma / venku:", en: "Home / away:" },

  // Kalendář
  "cal.empty": {
    cs: "Zatím žádné zápasy ani tréninky.\nPřidej první tlačítkem dole.",
    en: "No matches or trainings yet.\nAdd the first one with the button below.",
  },
  "cal.upcoming": { cs: "Nadcházející", en: "Upcoming" },
  "cal.nothingPlanned": { cs: "Nic naplánovaného.", en: "Nothing planned." },
  "cal.past": { cs: "Proběhlé", en: "Past" },
  "cal.nothingPlayed": { cs: "Zatím nic odehraného.", en: "Nothing played yet." },
  "cal.add": { cs: "+ Přidat do kalendáře", en: "+ Add to calendar" },
  "cal.chooserTitle": { cs: "Co chceš přidat?", en: "What do you want to add?" },
  "cal.match": { cs: "Zápas", en: "Match" },
  "cal.friendlyBadge": { cs: "Přátelský zápas", en: "Friendly match" },
  "cal.trainingWithMinutes": { cs: "Trénink · {min} min", en: "Training · {min} min" },
  "cal.importExcel": {
    cs: "Import rozpisu z Excelu (ISSF/FAČR)",
    en: "Import fixtures from Excel (ISSF/FAČR)",
  },
  "cal.importFailedTitle": { cs: "Import se nepovedl", en: "Import failed" },
  "cal.importReadError": {
    cs: "Soubor se nepodařilo přečíst – zkontroluj, že jde o platný .xls/.xlsx export.",
    en: "The file could not be read – check that it is a valid .xls/.xlsx export.",
  },
  "cal.importTitle": { cs: "Import zápasů", en: "Import matches" },
  "cal.importConfirm": { cs: "Naimportovat", en: "Import" },
  "cal.recognizedTeam": { cs: "Rozpoznaný tým", en: "Detected team" },
  "cal.alreadyExists": { cs: "už existuje", en: "already there" },
  "cal.addTrainingTitle": { cs: "Přidat trénink", en: "Add training" },

  // Historie
  "archive.empty": {
    cs: "Zatím žádné odehrané zápasy.\nNadcházející zápasy najdeš v Kalendáři.",
    en: "No played matches yet.\nUpcoming matches are in the Calendar.",
  },

  // Detail zápasu
  "detail.back": { cs: "← Zpět", en: "← Back" },
  "detail.deleteMatch": { cs: "Smazat zápas", en: "Delete match" },
  "detail.captainReadOnly": {
    cs: "👁 Jsi přihlášený jako kapitán – tenhle zápis je jen pro čtení.",
    en: "👁 You are signed in as a captain – this record is read-only.",
  },
  "detail.olderReadOnly": {
    cs: "Tento zápis je starší než 2 týdny, je jen pro čtení.",
    en: "This record is older than 2 weeks and is read-only.",
  },
  "detail.unlockAnyway": { cs: "Přesto odemknout a upravit", en: "Unlock and edit anyway" },
  "detail.manuallyUnlocked": {
    cs: "🔓 Ručně odemknuto k úpravě (starší než 2 týdny).",
    en: "🔓 Manually unlocked for editing (older than 2 weeks).",
  },
  "detail.lockBack": { cs: "Uzamknout zpět", en: "Lock again" },
  "detail.friendlyNote": {
    cs: "Přátelský zápas se nezapočítává do bilance sezóny ani žebříčku.",
    en: "A friendly match does not count towards the season record or the rankings.",
  },
  "detail.result": { cs: "Výsledek", en: "Result" },
  "detail.resultWith": { cs: "Výsledek ({home}:{away})", en: "Result ({home}:{away})" },
  "detail.halfTime": { cs: "Poločas", en: "Half-time" },
  "detail.addHalfTime": { cs: "+ Přidat poločas", en: "+ Add half-time" },
  "detail.lineupClosed": {
    cs: "Sestava je uzavřená a needitovatelná.",
    en: "The lineup is closed and cannot be edited.",
  },
  "detail.reopenLineup": { cs: "Otevřít sestavu znovu", en: "Reopen the lineup" },
  "detail.saveLineup": { cs: "Uložit sestavu", en: "Save lineup" },
  "detail.closeMatch": { cs: "Uzavřít zápas", en: "Close the match" },
  "detail.clearLineupBody": {
    cs: "Opravdu chceš smazat sestavu tohoto zápasu? Hráči na hřišti i náhradníci se odeberou (zápas samotný zůstane).",
    en: "Really clear this match's lineup? Players on the pitch and the bench will be removed (the match itself stays).",
  },
  "detail.attendanceAuto": {
    cs: "Zapíše se automaticky po uzavření zápasu.",
    en: "It is recorded automatically once the match is closed.",
  },
  "detail.notes": { cs: "Poznámky", en: "Notes" },
  "detail.notesPlaceholder": { cs: "Poznámky k tomuto zápasu…", en: "Notes about this match…" },
  "detail.deleteMatchTitle": { cs: "Smazat zápas?", en: "Delete the match?" },
  "detail.deleteMatchBody": {
    cs: 'Opravdu chceš smazat celý zápas "{opponent}" ({date}) včetně sestavy, poznámek a fotek?',
    en: 'Really delete the whole match "{opponent}" ({date}) including the lineup, notes and photos?',
  },

  // Statistiky hráčů v zápase
  "stats.title": { cs: "Statistiky hráčů", en: "Player stats" },
  "stats.goalsMismatch": {
    cs: "Součet gólů hráčů ({sum}) neodpovídá výsledku ({score}).",
    en: "The players' goals ({sum}) do not add up to the result ({score}).",
  },
  "stats.ownGoalsMismatch": {
    cs: "Zadané vlastní góly ({sum}) neodpovídají skóre soupeře ({score}).",
    en: "The own goals entered ({sum}) do not fit the opponent's score ({score}).",
  },
  "stats.goalsMatch": {
    cs: "Góly odpovídají výsledku {score}.",
    en: "The goals match the result {score}.",
  },
  "stats.noPlayers": {
    cs: "V sestavě zatím nejsou žádní hráči.",
    en: "There are no players in the lineup yet.",
  },
  // Zkratky do řádku s přehledem (1 gól = "1G")
  "stats.abbrGoals": { cs: "G", en: "G" },
  "stats.abbrAssists": { cs: "A", en: "A" },
  "stats.abbrOwnGoals": { cs: "VG", en: "OG" },
  "stats.abbrYellow": { cs: "Ž", en: "Y" },
  "stats.abbrRed": { cs: "Č", en: "R" },
  "stats.goals": { cs: "Góly", en: "Goals" },
  "stats.ownGoal": { cs: "Vlastní gól", en: "Own goal" },
  "stats.assists": { cs: "Asistence", en: "Assists" },
  "stats.yellowFoul": { cs: "Žlutá – faul", en: "Yellow – foul" },
  "stats.yellowDissent": { cs: "Žlutá – řeči", en: "Yellow – dissent" },
  "stats.redStraight": { cs: "Červená – přímá", en: "Red – straight" },
  "stats.secondYellow": { cs: "2. žlutá → červená", en: "2nd yellow → red" },
  "stats.rating": { cs: "Hodnocení", en: "Rating" },

  // Bilance a žebříček sezóny
  "season.all": { cs: "Vše", en: "All" },
  "season.titleNamed": {
    cs: "Bilance sezóny {season} (bez přátelských)",
    en: "Season record {season} (friendlies excluded)",
  },
  "season.rankTitleNamed": {
    cs: "Žebříček sezóny {season} (bez přátelských)",
    en: "Season rankings {season} (friendlies excluded)",
  },
  "season.title": { cs: "Bilance sezóny (bez přátelských)", en: "Season record (friendlies excluded)" },
  "season.rankTitle": { cs: "Žebříček sezóny (bez přátelských)", en: "Season rankings (friendlies excluded)" },
  "season.win": { cs: "V", en: "W" },
  "season.draw": { cs: "R", en: "D" },
  "season.loss": { cs: "P", en: "L" },
  "season.score": { cs: "Skóre", en: "Goals" },
  "season.missingResults": {
    cs: "{count} {word} bez zadaného výsledku – doplň ho v detailu zápasu, ať se počítá do bilance.",
    en: "{count} {word} without a result – add it in the match detail so it counts towards the record.",
  },
  // Skloňování "zápas": 1 / 2–4 / 5+ (angličtina rozlišuje jen jednotné a množné)
  "season.matchOne": { cs: "zápas", en: "match" },
  "season.matchFew": { cs: "zápasy", en: "matches" },
  "season.matchMany": { cs: "zápasů", en: "matches" },

  // Fotky k zápasu
  "photos.title": { cs: "Fotky", en: "Photos" },
  "photos.uploadFailed": {
    cs: "Nahrání fotky se nezdařilo. Zkus to prosím znovu.",
    en: "The photo could not be uploaded. Please try again.",
  },
  "photos.add": { cs: "+ Foto", en: "+ Photo" },
  "photos.one": { cs: "Fotka", en: "Photo" },
  "photos.alt": { cs: "Fotka poznámek", en: "Photo of notes" },

  // Docházka
  "att.empty": {
    cs: "Zatím žádné termíny docházky.\nPřidej první trénink nebo zápas.",
    en: "No attendance records yet.\nAdd your first training or match.",
  },
  "att.presentOf": { cs: "{present}/{total} přítomných", en: "{present}/{total} present" },
  "att.avgTitle": { cs: "Celková průměrná účast", en: "Overall average attendance" },
  "att.total": { cs: "Celkem", en: "Total" },
  "att.matches": { cs: "Zápasy", en: "Matches" },
  "att.competitiveMatches": { cs: "Soutěžní zápasy", en: "Competitive matches" },
  "att.friendlyMatches": { cs: "Přátelské zápasy", en: "Friendly matches" },
  // Zkratky do rozpadu u hráče ("T 12/15 · S 6/6 · P 1/2")
  "att.abbrTraining": { cs: "T", en: "T" },
  "att.abbrCompetitive": { cs: "S", en: "C" },
  "att.abbrFriendly": { cs: "P", en: "F" },
  "att.sessionsCount": { cs: "{count} {word}", en: "{count} {word}" },
  // Skloňování "termín": 1 / 2–4 / 5+ (angličtina rozlišuje jen jednotné a množné)
  "att.sessionOne": { cs: "termín", en: "session" },
  "att.sessionFew": { cs: "termíny", en: "sessions" },
  "att.sessionMany": { cs: "termínů", en: "sessions" },
  "att.perPlayerTitle": { cs: "Statistika docházky podle hráče", en: "Attendance per player" },
  "att.noPlayersInRoster": { cs: "Zatím nejsou žádní hráči v rosteru.", en: "There are no players in the roster yet." },
  "att.noPlayersWere": { cs: "V rosteru nebyli žádní hráči.", en: "There were no players in the roster." },
  "att.addPlayer": { cs: "+ Přidat hráče do docházky", en: "+ Add player to attendance" },
  "att.addPlayerTitle": { cs: "Přidat hráče do docházky", en: "Add player to attendance" },
  "att.notRecorded": { cs: "Docházka nebyla zapsána.", en: "Attendance was not recorded." },
  "att.record": { cs: "Zapsat docházku", en: "Record attendance" },
  "att.deleteTitle": { cs: "Smazat termín?", en: "Delete the record?" },
  "att.deleteBody": {
    cs: "Opravdu chceš smazat docházku z {date}?",
    en: "Really delete the attendance from {date}?",
  },

  // Taktická tabule
  "tactics.preparingFor": { cs: "Příprava na: {match}", en: "Preparing for: {match}" },
  "tactics.liveLineup": { cs: "Živá sestava", en: "Live lineup" },
  "tactics.undo": { cs: "Zpět", en: "Undo" },
  "tactics.clear": { cs: "Vymazat", en: "Clear" },
  "tactics.freeDrawHint": {
    cs: "Volné kreslení – tažením nakreslíš libovolný tvar. Klepnutím na styl šipky se vrátíš k šipkám.",
    en: "Free drawing – drag to draw any shape. Tap an arrow style to go back to arrows.",
  },

  // Pokuty
  "fines.rates": { cs: "⚙ Sazby", en: "⚙ Rates" },
  "fines.empty": {
    cs: "Zatím žádné pokutované karty.\nKarty se zadávají u statistik hráčů v detailu zápasu.",
    en: "No fineable cards yet.\nCards are entered in the player stats in the match detail.",
  },
  "fines.summaryTitle": { cs: "Souhrn dle hráče", en: "Summary per player" },
  "fines.remaining": { cs: "zbývá {amount}", en: "{amount} outstanding" },
  "fines.paid": { cs: "zaplaceno", en: "paid up" },
  "fines.individualCards": { cs: "Jednotlivé karty", en: "Individual cards" },
  // Měna: česky "Kč", v angličtině se zobrazí jen číslo (vlastní měnu si trenér dosadí sám,
  // dokud není volba měny v nastavení) – viz amountLabel().
  "fines.currency": { cs: "Kč", en: "" },
  "fines.title": { cs: "Pokuty", en: "Fines" },
  "fines.ratesTitle": { cs: "Sazby pokut", en: "Fine rates" },
  "fines.ratesHint": {
    cs: "Nastav částku za jednotlivé typy karet.",
    en: "Set the amount for each type of card.",
  },

  // Dialog týmu (kódy ke sdílení)
  "team.leave": { cs: "Opustit tým", en: "Leave the team" },
  "team.captainNote": {
    cs: "👁 Jsi přihlášený jako kapitán – appka je jen pro prohlížení, nic v ní nejde upravovat.",
    en: "👁 You are signed in as a captain – the app is view-only, nothing can be edited.",
  },
  "team.coachCodeHint": {
    cs: "Tenhle kód pošli druhému trenérovi, ať se připojí ke stejným datům s plným přístupem:",
    en: "Send this code to another coach so they can join the same data with full access:",
  },
  "team.shareCode": { cs: "Sdílet kód", en: "Share the code" },
  "team.shareCodeTitle": { cs: "Sdílet kód týmu", en: "Share team code" },
  "team.shareCodeText": { cs: "Kód pro připojení{team} v appce: {code}", en: "Code to join{team} in the app: {code}" },
  "team.toTeam": { cs: ' k týmu "{name}"', en: ' the team "{name}"' },
  "team.viewerCodeHint": {
    cs: "Tenhle kód pošli kapitánovi nebo komukoliv, kdo má vidět sestavu a docházku, ale nic upravovat:",
    en: "Send this code to a captain or anyone who should see the lineup and attendance but not edit anything:",
  },
  "team.shareViewerCode": { cs: "Sdílet kód pro kapitána", en: "Share the captain code" },
  "team.shareViewerCodeTitle": { cs: "Sdílet kapitánský kód", en: "Share captain code" },
  "team.shareViewerCodeText": {
    cs: "Kód pro kapitána (jen prohlížení){team} v appce: {code}",
    en: "Captain code (view-only) for{team} in the app: {code}",
  },

  // Nápověda k přidání na plochu (iOS Safari) – rozdělená, ať jdou názvy tlačítek zvýraznit
  "install.hintBefore": {
    cs: "Přidej si appku na plochu: klepni na ",
    en: "Add the app to your home screen: tap ",
  },
  "install.shareLabel": { cs: "Sdílet", en: "Share" },
  "install.hintBetween": {
    cs: " (ikona čtverce se šipkou) a pak na ",
    en: " (the square-with-arrow icon) and then ",
  },
  "install.addLabel": { cs: "Přidat na plochu", en: "Add to Home Screen" },

  // Horní lišta
  "shell.captainBadge": { cs: "👁 KAPITÁN · JEN PROHLÍŽENÍ", en: "👁 CAPTAIN · VIEW ONLY" },
  "shell.team": { cs: "Tým", en: "Team" },
  "shell.image": { cs: "Obrázek", en: "Image" },
  "shell.share": { cs: "Sdílet", en: "Share" },

  // Export sestavy (text i obrázek)
  "export.header": { cs: "Sestava – {formation}", en: "Lineup – {formation}" },
  "export.shareTitle": { cs: "Sdílet sestavu", en: "Share the lineup" },
  "export.shareImageTitle": { cs: "Sdílet sestavu jako obrázek", en: "Share the lineup as an image" },
  "export.substitutes": { cs: "Náhradníci:", en: "Substitutes:" },
  "export.noSubstitutes": { cs: "žádní", en: "none" },

  // Tréninky
  "tr.empty": {
    cs: "Zatím žádné naplánované tréninky.\nPřidej první trénink a vyber cvičení z knihovny.",
    en: "No trainings planned yet.\nAdd your first training and pick drills from the library.",
  },
  "tr.noPlan": { cs: "Bez plánu", en: "No plan" },
  "tr.blocksSummary": { cs: "{blocks} bloků · {min} min", en: "{blocks} blocks · {min} min" },
  "tr.addTraining": { cs: "+ Přidat trénink", en: "+ Add training" },
  "tr.start": { cs: "▶ Spustit trénink", en: "▶ Start training" },
  "tr.blocksTitle": { cs: "Bloky tréninku", en: "Training blocks" },
  "tr.blocksTitleWithMinutes": { cs: "Bloky tréninku · {min} min", en: "Training blocks · {min} min" },
  "tr.noBlocks": {
    cs: "Zatím žádné bloky. Přidej cvičení z knihovny níže, vlastní blok, nebo vlož uloženou šablonu.",
    en: "No blocks yet. Add a drill from the library below, a custom block, or insert a saved template.",
  },
  "tr.customBlock": { cs: "+ Vlastní blok", en: "+ Custom block" },
  "tr.insertTemplate": { cs: "+ Vložit šablonu", en: "+ Insert template" },
  "tr.saveAsTemplate": { cs: "Uložit jako šablonu", en: "Save as template" },
  "tr.notesPlaceholder": { cs: "Volné poznámky k tréninku…", en: "Free notes about the training…" },
  "tr.library": { cs: "Knihovna cvičení", en: "Drill library" },
  "tr.sourcesOnline": { cs: "🔗 Zdroje online", en: "🔗 Online sources" },
  "tr.aiAssistant": { cs: "✨ AI asistent", en: "✨ AI assistant" },
  "tr.customDrill": { cs: "+ Vlastní cvičení", en: "+ Custom drill" },
  "tr.tapToAdd": { cs: "Klepnutím přidáš cvičení jako blok.", en: "Tap a drill to add it as a block." },
  "tr.deleteTitle": { cs: "Smazat trénink?", en: "Delete the training?" },
  "tr.deleteBody": {
    cs: "Opravdu chceš smazat naplánovaný trénink z {date}?",
    en: "Really delete the training planned for {date}?",
  },
  "tr.blockMinutes": { cs: "min", en: "min" },
  "tr.customBlockTitle": { cs: "Vlastní blok", en: "Custom block" },
  "tr.blockName": { cs: "Název bloku", en: "Block name" },
  "tr.minutes": { cs: "Minuty", en: "Minutes" },
  "tr.saveTemplateTitle": { cs: "Uložit jako šablonu", en: "Save as template" },
  "tr.templateName": { cs: "Název šablony", en: "Template name" },
  "tr.insertTemplateTitle": { cs: "Vložit šablonu", en: "Insert template" },
  "tr.noTemplates": { cs: "Zatím nemáš žádné uložené šablony.", en: "You have no saved templates yet." },
  "tr.addCustomDrillTitle": { cs: "Přidat vlastní cvičení", en: "Add a custom drill" },
  "tr.drillName": { cs: "Název cvičení", en: "Drill name" },
  "tr.drillCategory": { cs: "Kategorie (např. Technika)", en: "Category (e.g. Technique)" },
  "tr.description": { cs: "Popis", en: "Description" },
  "tr.drawDiagram": { cs: "+ Nakreslit náčrtek (nepovinné)", en: "+ Draw a diagram (optional)" },
  "tr.editDiagram": { cs: "Upravit náčrtek", en: "Edit the diagram" },
  "tr.diagramTitle": { cs: "Náčrtek cvičení", en: "Drill diagram" },
  "tr.saveDiagram": { cs: "Uložit náčrtek", en: "Save the diagram" },
  "tr.aiTitle": { cs: "✨ AI asistent cvičení", en: "✨ AI drill assistant" },
  "tr.aiPlaceholder": { cs: "např. nácvik přihrávek pro 4 hráče", en: "e.g. passing practice for 4 players" },
  "tr.aiFailed": {
    cs: "Nepodařilo se vygenerovat cvičení, zkus to prosím znovu.",
    en: "The drill could not be generated, please try again.",
  },
  "tr.aiGenerate": { cs: "Vygenerovat", en: "Generate" },
  "tr.aiHint": {
    cs: "Popiš, jaké cvičení chceš vygenerovat – Gemini navrhne rozestavení hráčů a pořadí přihrávek.",
    en: "Describe the drill you want – Gemini will suggest where the players stand and the order of passes.",
  },
  "tr.aiGenerating": { cs: "Generuji…", en: "Generating…" },
  // Chyby Gemini – jen Android, ten volá API přímo (web jde přes Cloud Function, která
  // vrací vlastní chybu). Zůstávají ve společném slovníku, ať jsou překlady na jednom místě.
  "ai.noKey": {
    cs: "Gemini API klíč není nastavený (local.properties: GEMINI_API_KEY).",
    en: "The Gemini API key is not set (local.properties: GEMINI_API_KEY).",
  },
  "ai.httpError": { cs: "Gemini API vrátilo chybu", en: "The Gemini API returned an error" },
  "ai.network": {
    cs: "Nepodařilo se spojit s Gemini API – zkontroluj připojení k internetu.",
    en: "Could not reach the Gemini API – check your internet connection.",
  },
  "ai.badResponse": {
    cs: "Gemini vrátilo neočekávanou odpověď, zkus to prosím znovu.",
    en: "Gemini returned an unexpected response, please try again.",
  },
  "tr.sourcesTitle": { cs: "Zdroje cvičení online", en: "Drill sources online" },
  "tr.sourcesHint": {
    cs: "Vyzkoušené weby s hotovými tréninkovými cvičeními. Co se ti bude líbit, si pak přidej jako vlastní cvičení tady v appce.",
    en: "Tried-and-tested sites with ready-made drills. Add the ones you like here in the app as a custom drill.",
  },
  "tr.sourceCoachTruly": {
    cs: "320 cvičení zdarma bez registrace – řazeno podle témat (přihrávky, střelba, obrana, herní situace).",
    en: "320 free drills, no sign-up – sorted by topic (passing, shooting, defending, game situations).",
  },
  "tr.sourceICoach": {
    cs: "Cvičení zdarma bez registrace, rozdělená podle věkových kategorií od nejmenších po dospělé.",
    en: "Free drills with no sign-up, grouped by age group from the youngest to adults.",
  },
  "tr.sourceSportplan": {
    cs: "Přes 550 cvičení s videi a animacemi – plná knihovna vyžaduje bezplatnou registraci.",
    en: "Over 550 drills with videos and animations – the full library needs a free account.",
  },
  "tr.pause": { cs: "Pauza", en: "Pause" },
  "tr.resume": { cs: "Pokračovat", en: "Resume" },
  "tr.finish": { cs: "Dokončit", en: "Finish" },
  "tr.nextBlock": { cs: "Další blok →", en: "Next block →" },
  "tr.liveTitle": { cs: "Živý trénink", en: "Live training" },
  "tr.exit": { cs: "Ukončit", en: "Exit" },
  "tr.finished": { cs: "Trénink dokončen! 🎉", en: "Training complete! 🎉" },
  "tr.blockOf": { cs: "Blok {index} z {total}", en: "Block {index} of {total}" },
  "tr.timeUp": { cs: "Čas vypršel", en: "Time's up" },
  "tr.previous": { cs: "← Předchozí", en: "← Previous" },

  // Trénink (beta) – nákresy
  "beta.empty": {
    cs: "Zatím žádné nákresy tréninků.\nVytvoř první tlačítkem dole.",
    en: "No training diagrams yet.\nCreate the first one with the button below.",
  },
  "beta.show": { cs: "Zobrazit", en: "Open" },
  "beta.newDiagram": { cs: "+ Nový nákres", en: "+ New diagram" },
  "beta.newDiagramTitle": { cs: "Nový nákres", en: "New diagram" },
  "beta.create": { cs: "Vytvořit", en: "Create" },
  "beta.diagramName": { cs: "Název nákresu", en: "Diagram name" },
  "beta.background": { cs: "Pozadí", en: "Background" },
  "beta.arrowStyleHint": {
    cs: "Styl šipky (vyber a pak kresli tažením po ploše)",
    en: "Arrow style (pick one, then draw by dragging on the pitch)",
  },
  "beta.pinchHint": { cs: "Přiblížíš gestem dvou prstů (pinch)", en: "Zoom with a two-finger pinch" },
  "beta.resetZoom": { cs: "Zrušit přiblížení", en: "Reset zoom" },
  "beta.clearAll": { cs: "Vymazat vše", en: "Clear everything" },
  "beta.handleHint": { cs: "Tažením uprav délku/směr šipky", en: "Drag to change the arrow's length/direction" },
  "beta.numberDown": { cs: "Snížit číslo pořadí", en: "Lower the order number" },
  "beta.numberUp": { cs: "Zvýšit číslo pořadí / přidat číslo", en: "Raise the order number / add one" },
  "beta.rotate": { cs: "Otočit o 45°", en: "Rotate by 45°" },
  "beta.scaleDown": { cs: "Zmenšit", en: "Make smaller" },
  "beta.scaleUp": { cs: "Zvětšit", en: "Make bigger" },
  "beta.back": { cs: "Zpět", en: "Back" },
  "beta.deleteTitle": { cs: "Smazat nákres?", en: "Delete the diagram?" },
  "beta.deleteBody": {
    cs: 'Opravdu chceš smazat nákres "{name}"?',
    en: 'Really delete the diagram "{name}"?',
  },

  // Chyby mimo obrazovky
  "error.signIn": { cs: "Chyba přihlášení", en: "Sign-in error" },
  "import.emptyFile": { cs: "Soubor je prázdný.", en: "The file is empty." },
  "import.wrongColumns": {
    cs: "Soubor nemá očekávané sloupce (Domácí, Hosté, Datum a čas) – zkontroluj, že jde o export rozpisu zápasů z ISSF/FAČR.",
    en: "The file does not have the expected columns (Domácí, Hosté, Datum a čas) – check that it is a fixture-list export from ISSF/FAČR.",
  },
  "import.noRows": {
    cs: "V souboru se nenašel žádný platný řádek se zápasem.",
    en: "No valid match row was found in the file.",
  },

  // Obecné
  "common.cancel": { cs: "Zrušit", en: "Cancel" },
  "common.delete": { cs: "Smazat", en: "Delete" },
  "common.add": { cs: "Přidat", en: "Add" },
  "common.save": { cs: "Uložit", en: "Save" },
  "common.edit": { cs: "Upravit", en: "Edit" },
  "common.remove": { cs: "Odebrat", en: "Remove" },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey): string {
  return STRINGS[key][lang];
}

/** Částka s měnou ("150 Kč"); v angličtině zatím bez jednotky, dokud není volba měny. */
export function amountLabel(amount: number): string {
  const currency = t("fines.currency");
  return currency ? `${amount} ${currency}` : String(amount);
}

/** Skloňování "zápas" podle počtu: 1 zápas, 2–4 zápasy, 5+ zápasů. */
export function matchCountWord(count: number): string {
  if (count === 1) return t("season.matchOne");
  if (count >= 2 && count <= 4) return t("season.matchFew");
  return t("season.matchMany");
}

/** Skloňování "termín" podle počtu: 1 termín, 2–4 termíny, 5+ termínů. */
export function sessionCountWord(count: number): string {
  if (count === 1) return t("att.sessionOne");
  if (count >= 2 && count <= 4) return t("att.sessionFew");
  return t("att.sessionMany");
}

/** Varianta s doplněním `{placeholder}` – `tf("gate.joinNamed", { name: "Slavia" })`. */
export function tf(key: StringKey, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((text, [name, value]) => text.split(`{${name}}`).join(value), t(key));
}

/** Celé názvy pozic. Klíč = kód, jak je uložený v datech (Player.preferredPositions, PlayerPosition.label). */
const POSITION_NAMES: Record<string, Record<Lang, string>> = {
  B: { cs: "Brankář", en: "Goalkeeper" },
  O: { cs: "Obránce", en: "Defender" },
  Z: { cs: "Záložník", en: "Midfielder" },
  U: { cs: "Útočník", en: "Forward" },
  DZ: { cs: "Defenzivní záložník", en: "Defensive midfielder" },
  OZ: { cs: "Ofenzivní záložník", en: "Attacking midfielder" },
};

/** Zkratka pozice do kolečka na hřišti – v angličtině se používají jiné (GK/DF/MF/FW). */
const POSITION_CODES: Record<string, Record<Lang, string>> = {
  B: { cs: "B", en: "GK" },
  O: { cs: "O", en: "DF" },
  Z: { cs: "Z", en: "MF" },
  U: { cs: "U", en: "FW" },
  DZ: { cs: "DZ", en: "DM" },
  OZ: { cs: "OZ", en: "AM" },
};

export function positionName(code: string): string {
  return POSITION_NAMES[code]?.[lang] ?? code;
}

export function positionCodeLabel(code: string): string {
  return POSITION_CODES[code]?.[lang] ?? code;
}

/** Rozestavení jsou čísla (jazykově neutrální), přeložit je potřeba jen ta se slovem. */
const FORMATION_LABELS: Record<string, Record<Lang, string>> = {
  "4-4-2 diamant": { cs: "4-4-2 diamant", en: "4-4-2 diamond" },
  "2-3-5 (historické)": { cs: "2-3-5 (historické)", en: "2-3-5 (historic)" },
};

export function formationLabel(id: string): string {
  return FORMATION_LABELS[id]?.[lang] ?? id;
}

/**
 * Hodnoty číselníků, jak LEŽÍ v datech (types.ts: MatchType, HomeAway, AttendanceKind,
 * DiagramBackground, DiagramElementType, ArrowStyle). Do Firestore se dál zapisuje česká
 * varianta – tahle mapa jen řekne, jak se má vykreslit. Klíče musí být přesně ty řetězce
 * z types.ts, jinak se hodnota zobrazí nepřeložená (bezpečný fallback).
 */
export const STORED_LABELS: Record<string, Record<Lang, string>> = {
  // MatchType
  Soutěžní: { cs: "Soutěžní", en: "Competitive" },
  Přátelské: { cs: "Přátelské", en: "Friendly" },
  // HomeAway
  Doma: { cs: "Doma", en: "Home" },
  Venku: { cs: "Venku", en: "Away" },
  // AttendanceKind (Soutěžní/Přátelské sdílí s MatchType)
  Trénink: { cs: "Trénink", en: "Training" },
  // DiagramBackground
  "Celé hřiště": { cs: "Celé hřiště", en: "Full pitch" },
  "Půlka hřiště": { cs: "Půlka hřiště", en: "Half pitch" },
  // DiagramElementType
  "Hráč (červený)": { cs: "Hráč (červený)", en: "Player (red)" },
  "Hráč (černý)": { cs: "Hráč (černý)", en: "Player (black)" },
  "Brankářský panák": { cs: "Brankářský panák", en: "Goalkeeper dummy" },
  "Slalomová tyč": { cs: "Slalomová tyč", en: "Slalom pole" },
  Kužel: { cs: "Kužel", en: "Cone" },
  Minibrána: { cs: "Minibrána", en: "Mini goal" },
  Branka: { cs: "Branka", en: "Goal" },
  Míč: { cs: "Míč", en: "Ball" },
  // Kategorie cvičení (vestavěné i výchozí kategorie vlastního cvičení) – ukládají se
  // do Drill.category, takže se taky jen překládají při vykreslení.
  Rozcvička: { cs: "Rozcvička", en: "Warm-up" },
  Technika: { cs: "Technika", en: "Technique" },
  Kondice: { cs: "Kondice", en: "Fitness" },
  "Herní situace": { cs: "Herní situace", en: "Game situations" },
  Zakončení: { cs: "Zakončení", en: "Finishing" },
  Vlastní: { cs: "Vlastní", en: "Custom" },
  "AI cvičení": { cs: "AI cvičení", en: "AI drill" },
  // ArrowStyle
  "Vedení míče": { cs: "Vedení míče", en: "Dribble" },
  "Vedení míče se zrychlením": { cs: "Vedení míče se zrychlením", en: "Dribble with acceleration" },
  "Obcházení soupeře/překážky": { cs: "Obcházení soupeře/překážky", en: "Beating an opponent/obstacle" },
  Přihrávka: { cs: "Přihrávka", en: "Pass" },
  "Přihrávka vzduchem": { cs: "Přihrávka vzduchem", en: "Aerial pass" },
  Střelba: { cs: "Střelba", en: "Shot" },
  "Pohyb hráče bez míče": { cs: "Pohyb hráče bez míče", en: "Run without the ball" },
};

export function storedLabel(value: string): string {
  return STORED_LABELS[value]?.[lang] ?? value;
}

/**
 * Popis pozice hráče odvozený z `positionKey` ("4-4-2|O_1" → "Obránce 2 (4-4-2)").
 * Záměrně se NEčte uložené `Player.positionDisplayName` – to je česky zmražený text z doby,
 * kdy se hráč na pozici posadil. Pole se dál zapisuje kvůli Androidu, web ho jen ignoruje.
 */
export function positionDisplayFromKey(positionKey: string | null): string | null {
  if (!positionKey) return null;
  const [formation, posId] = positionKey.split("|");
  if (!formation || !posId) return null;
  const code = posId.split("_")[0];
  const index = Number(posId.split("_").pop()) || 0;
  return `${positionName(code)} ${index + 1} (${formationLabel(formation)})`;
}
