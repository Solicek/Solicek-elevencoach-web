/**
 * Překlady VESTAVĚNÉ knihovny cvičení (src/drills.ts).
 *
 * Názvy a popisy cvičení se chovají stejně jako ostatní uložené hodnoty: jakmile trenér
 * cvičení přidá do tréninku, zkopíruje se jeho název i popis do bloku a uloží do Firestore.
 * Proto zůstávají česky i v datech a překládají se až při vykreslení – klíč je přesně ten
 * český text z drills.ts. Co ve slovníku není (vlastní cvičení trenéra, AI návrhy),
 * se zobrazí tak, jak je uložené.
 *
 * Oddělené od i18n.ts jen kvůli velikosti – jinak to je stejná vrstva.
 */
import { currentLang, type Lang } from "./i18n";

export const DRILL_TEXTS: Record<string, Record<Lang, string>> = {
  // Rozcvička
  "Dynamický strečink": { cs: "Dynamický strečink", en: "Dynamic stretching" },
  "Kruhy pažemi, výpady s rotací, vysoký skip, zaskoky – 5-8 minut.": {
    cs: "Kruhy pažemi, výpady s rotací, vysoký skip, zaskoky – 5-8 minut.",
    en: "Arm circles, lunges with rotation, high knees, skips – 5-8 minutes.",
  },
  "Aktivace s míčem": { cs: "Aktivace s míčem", en: "Activation with the ball" },
  "Lehké vedení míče, postupně přidávat sprinty a změny směru.": {
    cs: "Lehké vedení míče, postupně přidávat sprinty a změny směru.",
    en: "Easy dribbling, gradually adding sprints and changes of direction.",
  },
  "Běžecká abeceda": { cs: "Běžecká abeceda", en: "Running drills (ABC)" },
  "Skipping, zakopávání, odpichy, křižování nohou – 4x15 m, zpět chůzí.": {
    cs: "Skipping, zakopávání, odpichy, křižování nohou – 4x15 m, zpět chůzí.",
    en: "High knees, heel flicks, bounding, carioca – 4x15 m, walk back.",
  },
  "Aktivační rondo": { cs: "Aktivační rondo", en: "Warm-up rondo" },
  "Malé rondo 4+1 v klidném tempu – cíl je rozproudit krev, ne rychlost přihrávek.": {
    cs: "Malé rondo 4+1 v klidném tempu – cíl je rozproudit krev, ne rychlost přihrávek.",
    en: "Small 4+1 rondo at an easy pace – the goal is to get the blood going, not passing speed.",
  },
  "Odrazová cvičení pro klouby": { cs: "Odrazová cvičení pro klouby", en: "Jumping drills for the joints" },
  "Poskoky snožmo, jednonož a boční odrazy přes čáru – 3 série po 10 opakování.": {
    cs: "Poskoky snožmo, jednonož a boční odrazy přes čáru – 3 série po 10 opakování.",
    en: "Two-footed, single-leg and lateral hops over a line – 3 sets of 10 reps.",
  },
  "Rozehřátí ve dvojicích s míčem": { cs: "Rozehřátí ve dvojicích s míčem", en: "Warm-up in pairs with a ball" },
  "Přihrávky na místě, postupně přidávat pohyb a zvětšovat vzdálenost mezi hráči.": {
    cs: "Přihrávky na místě, postupně přidávat pohyb a zvětšovat vzdálenost mezi hráči.",
    en: "Passing on the spot, gradually adding movement and increasing the distance between players.",
  },

  // Technika
  "Vedení míče slalomem": { cs: "Vedení míče slalomem", en: "Slalom dribbling" },
  "Vedení míče mezi kužely oběma nohama, důraz na krátké dotyky.": {
    cs: "Vedení míče mezi kužely oběma nohama, důraz na krátké dotyky.",
    en: "Dribble between cones with both feet, focus on short touches.",
  },
  "Přihrávky ve dvojicích": { cs: "Přihrávky ve dvojicích", en: "Passing in pairs" },
  "Přihrávky na jeden až dva doteky na 10-15 m, střídat vnitřní a vnější nárt.": {
    cs: "Přihrávky na jeden až dva doteky na 10-15 m, střídat vnitřní a vnější nárt.",
    en: "One- and two-touch passes over 10-15 m, alternating inside and outside of the foot.",
  },
  "Žonglování": { cs: "Žonglování", en: "Juggling" },
  "Individuální žonglování, cíl zvýšit počet doteků bez ztráty míče.": {
    cs: "Individuální žonglování, cíl zvýšit počet doteků bez ztráty míče.",
    en: "Individual juggling, aiming to increase the number of touches without losing the ball.",
  },
  "Zpracování míče a otočka": { cs: "Zpracování míče a otočka", en: "First touch and turn" },
  "Nahrávka do nohy, zpracování a otočka o 180°, poté přihrávka zpět.": {
    cs: "Nahrávka do nohy, zpracování a otočka o 180°, poté přihrávka zpět.",
    en: "Pass into the feet, control and a 180° turn, then pass back.",
  },
  "Driblink 1v1 na malém prostoru": { cs: "Driblink 1v1 na malém prostoru", en: "1v1 dribbling in a small area" },
  "Souboj 1 na 1 na vymezeném území, útočník se snaží projít na druhou stranu.": {
    cs: "Souboj 1 na 1 na vymezeném území, útočník se snaží projít na druhou stranu.",
    en: "1v1 duel in a marked area, the attacker tries to get through to the other side.",
  },
  "Řízená změna směru": { cs: "Řízená změna směru", en: "Controlled change of direction" },
  "Sprint s míčem 10 m, prudké zastavení a změna směru přes kužel, opakovat na obě strany.": {
    cs: "Sprint s míčem 10 m, prudké zastavení a změna směru přes kužel, opakovat na obě strany.",
    en: "Sprint 10 m with the ball, sharp stop and change of direction around a cone, repeat to both sides.",
  },
  "Kontrola padajícího míče": { cs: "Kontrola padajícího míče", en: "Controlling a dropping ball" },
  "Nahazování míče do vzduchu, tlumení hrudníkem, stehnem nebo nártem, poté přihrávka.": {
    cs: "Nahazování míče do vzduchu, tlumení hrudníkem, stehnem nebo nártem, poté přihrávka.",
    en: "Throw the ball up, cushion it with the chest, thigh or instep, then pass.",
  },
  "Přihrávky na jeden dotek v trojúhelníku": {
    cs: "Přihrávky na jeden dotek v trojúhelníku",
    en: "One-touch passing in a triangle",
  },
  "Tři hráči přihrávají po jednom dotyku v kolotoči, po 2 minutách zrychlit tempo.": {
    cs: "Tři hráči přihrávají po jednom dotyku v kolotoči, po 2 minutách zrychlit tempo.",
    en: "Three players pass one-touch in a rotation, speed the tempo up after 2 minutes.",
  },
  "Klamavé pohyby na kuželu": { cs: "Klamavé pohyby na kuželu", en: "Feints at a cone" },
  "Nácvik 2-3 fint (přešlápnutí, La Croqueta) nejprve na místě, poté v plné rychlosti.": {
    cs: "Nácvik 2-3 fint (přešlápnutí, La Croqueta) nejprve na místě, poté v plné rychlosti.",
    en: "Practise 2-3 feints (step-over, La Croqueta) first on the spot, then at full speed.",
  },
  "Zpracování zády k brance s otočkou": {
    cs: "Zpracování zády k brance s otočkou",
    en: "Receiving with back to goal and turning",
  },
  "Nahrávka zezadu, hráč čelem od branky zpracuje míč a otočí se směrem k ní.": {
    cs: "Nahrávka zezadu, hráč čelem od branky zpracuje míč a otočí se směrem k ní.",
    en: "Pass from behind, the player facing away from goal controls the ball and turns towards it.",
  },

  // Kondice
  "Intervalový běh": { cs: "Intervalový běh", en: "Interval running" },
  "Střídání sprintu (15 s) a klusu (30 s), 8-10 opakování.": {
    cs: "Střídání sprintu (15 s) a klusu (30 s), 8-10 opakování.",
    en: "Alternate sprinting (15 s) and jogging (30 s), 8-10 reps.",
  },
  "Škola běhu s míčem": { cs: "Škola běhu s míčem", en: "Running technique with the ball" },
  "Nízké překážky nebo žebřík, poté navazuje vedení míče.": {
    cs: "Nízké překážky nebo žebřík, poté navazuje vedení míče.",
    en: "Low hurdles or a ladder, followed by dribbling.",
  },
  "Výbušné starty": { cs: "Výbušné starty", en: "Explosive starts" },
  "Starty z různých poloh (leh, sed, čelem/zády) na signál, sprint 10 m.": {
    cs: "Starty z různých poloh (leh, sed, čelem/zády) na signál, sprint 10 m.",
    en: "Starts from various positions (lying, sitting, facing forwards/backwards) on a signal, 10 m sprint.",
  },
  "Kruhový trénink": { cs: "Kruhový trénink", en: "Circuit training" },
  "Stanoviště dřepy, plank, výpady, skoky – 30 s práce, 15 s odpočinek.": {
    cs: "Stanoviště dřepy, plank, výpady, skoky – 30 s práce, 15 s odpočinek.",
    en: "Stations: squats, plank, lunges, jumps – 30 s work, 15 s rest.",
  },
  "Fartlek s míčem": { cs: "Fartlek s míčem", en: "Fartlek with the ball" },
  "Střídání klusu a rychlého běhu na okruhu s vedením míče, 10-12 minut.": {
    cs: "Střídání klusu a rychlého běhu na okruhu s vedením míče, 10-12 minut.",
    en: "Alternate jogging and fast running around a circuit while dribbling, 10-12 minutes.",
  },
  "Koordinační žebřík": { cs: "Koordinační žebřík", en: "Agility ladder" },
  "Rychlé nohy přes žebřík v různých vzorech kroků, 6 průchodů s odpočinkem mezi nimi.": {
    cs: "Rychlé nohy přes žebřík v různých vzorech kroků, 6 průchodů s odpočinkem mezi nimi.",
    en: "Quick feet through the ladder in different step patterns, 6 runs with rest in between.",
  },
  "Přerušovaný vytrvalostní běh": { cs: "Přerušovaný vytrvalostní běh", en: "Interval endurance running" },
  "Postupně kratší intervaly tam a zpět mezi metami na signál píšťalky.": {
    cs: "Postupně kratší intervaly tam a zpět mezi metami na signál píšťalky.",
    en: "Progressively shorter shuttle runs between markers on the whistle.",
  },
  "Silový kruh s vlastní vahou": { cs: "Silový kruh s vlastní vahou", en: "Bodyweight strength circuit" },
  "Dřepy, kliky, sedy-lehy, výpady – 40 s práce, 20 s pauza, 4 kola.": {
    cs: "Dřepy, kliky, sedy-lehy, výpady – 40 s práce, 20 s pauza, 4 kola.",
    en: "Squats, push-ups, sit-ups, lunges – 40 s work, 20 s rest, 4 rounds.",
  },

  // Herní situace
  "Rondo (držení míče)": { cs: "Rondo (držení míče)", en: "Rondo (keep-ball)" },
  "Skupina v kruhu drží míč proti 1-2 hráčům uprostřed, důraz na rychlost přihrávek.": {
    cs: "Skupina v kruhu drží míč proti 1-2 hráčům uprostřed, důraz na rychlost přihrávek.",
    en: "A circle of players keeps the ball away from 1-2 players in the middle, focus on passing speed.",
  },
  "Přečíslení 3v2": { cs: "Přečíslení 3v2", en: "3v2 overload" },
  "Útočná trojice proti dvěma obráncům, zakončení na branku.": {
    cs: "Útočná trojice proti dvěma obráncům, zakončení na branku.",
    en: "Three attackers against two defenders, finishing on goal.",
  },
  "Nácvik rohových kopů": { cs: "Nácvik rohových kopů", en: "Corner kick practice" },
  "Nacvičení rozestavení a signálů při rohu, střídání útočné a obranné role.": {
    cs: "Nacvičení rozestavení a signálů při rohu, střídání útočné a obranné role.",
    en: "Practise the set-up and signals at a corner, swapping attacking and defending roles.",
  },
  "Přechod obrana-útok": { cs: "Přechod obrana-útok", en: "Defence-to-attack transition" },
  "Po zisku míče rychlý přechod do útoku, důraz na první přihrávku dopředu.": {
    cs: "Po zisku míče rychlý přechod do útoku, důraz na první přihrávku dopředu.",
    en: "Quick transition to attack after winning the ball, focus on the first forward pass.",
  },
  "Presink po ztrátě míče": { cs: "Presink po ztrátě míče", en: "Counter-pressing after losing the ball" },
  "Nácvik okamžitého dotahování soupeře do 5 vteřin po ztrátě míče.": {
    cs: "Nácvik okamžitého dotahování soupeře do 5 vteřin po ztrátě míče.",
    en: "Practise pressing the opponent immediately, within 5 seconds of losing the ball.",
  },
  "Possession 5v5 se žolíky": { cs: "Possession 5v5 se žolíky", en: "5v5 possession with jokers" },
  "Malé hřiště, tým s míčem má přesilu díky dvěma žolíkům, cíl 6 přihrávek za sebou.": {
    cs: "Malé hřiště, tým s míčem má přesilu díky dvěma žolíkům, cíl 6 přihrávek za sebou.",
    en: "Small pitch, the team in possession has an overload thanks to two jokers, aim for 6 passes in a row.",
  },
  "Přečíslení 4v3 se zakončením": { cs: "Přečíslení 4v3 se zakončením", en: "4v3 overload with a finish" },
  "Rychlý protiútok čtyř proti třem, důraz na správné rozhodnutí posledního přihrávajícího.": {
    cs: "Rychlý protiútok čtyř proti třem, důraz na správné rozhodnutí posledního přihrávajícího.",
    en: "Fast four-against-three counter-attack, focus on the right decision by the last passer.",
  },
  "Rychlé autové vhazování do útoku": { cs: "Rychlé autové vhazování do útoku", en: "Quick attacking throw-ins" },
  "Nacvičení signálů a rozestavení pro rychlé vhazování s okamžitým přechodem dopředu.": {
    cs: "Nacvičení signálů a rozestavení pro rychlé vhazování s okamžitým přechodem dopředu.",
    en: "Practise the signals and positioning for a quick throw-in with an immediate move forward.",
  },
  "Souhra obranné linie": { cs: "Souhra obranné linie", en: "Defensive line coordination" },
  "Nácvik postupu a couvání čtyř obránců podle postavení míče, udržet kompaktnost.": {
    cs: "Nácvik postupu a couvání čtyř obránců podle postavení míče, udržet kompaktnost.",
    en: "Practise a back four pushing up and dropping off according to the ball, keeping compact.",
  },
  "Rychlý přechod po zisku ve vápně": {
    cs: "Rychlý přechod po zisku ve vápně",
    en: "Quick transition after winning the ball in the box",
  },
  "Po zisku míče ve vlastním vápně rychlý první dotek dopředu a přečíslení.": {
    cs: "Po zisku míče ve vlastním vápně rychlý první dotek dopředu a přečíslení.",
    en: "After winning the ball in your own box, a quick first touch forward and an overload.",
  },

  // Zakončení
  "Střelba z první": { cs: "Střelba z první", en: "First-time shooting" },
  "Křížné přihrávky do vápna, zakončení z první.": {
    cs: "Křížné přihrávky do vápna, zakončení z první.",
    en: "Diagonal passes into the box, first-time finish.",
  },
  "Souboje na malém brankovišti": { cs: "Souboje na malém brankovišti", en: "Duels on small goals" },
  "Hra 2v2 na dvě malé branky, důraz na soubojovost.": {
    cs: "Hra 2v2 na dvě malé branky, důraz na soubojovost.",
    en: "2v2 game on two small goals, focus on winning duels.",
  },
  "Trénink pokutových kopů": { cs: "Trénink pokutových kopů", en: "Penalty practice" },
  "Střídavé exekuce penalt, brankář střídá strany.": {
    cs: "Střídavé exekuce penalt, brankář střídá strany.",
    en: "Players take penalties in turn, the keeper alternates sides.",
  },
  "Zakončení po centru z křídla": { cs: "Zakončení po centru z křídla", en: "Finishing from a wing cross" },
  "Center z postranní čáry, útočníci najíždějí na přední a zadní tyč.": {
    cs: "Center z postranní čáry, útočníci najíždějí na přední a zadní tyč.",
    en: "Cross from the touchline, attackers running to the near and far post.",
  },
  "Střelba z dálky po signálu": { cs: "Střelba z dálky po signálu", en: "Long-range shooting on a signal" },
  "Přihrávka na okraj vápna, první dotek na zpracování, druhý na zakončení.": {
    cs: "Přihrávka na okraj vápna, první dotek na zpracování, druhý na zakončení.",
    en: "Pass to the edge of the box, first touch to control, second to shoot.",
  },
  "Kombinace na dva doteky před zakončením": {
    cs: "Kombinace na dva doteky před zakončením",
    en: "Two-touch combination before finishing",
  },
  "Trojice kombinuje na dva doteky, poslední hráč zakončuje do branky s brankářem.": {
    cs: "Trojice kombinuje na dva doteky, poslední hráč zakončuje do branky s brankářem.",
    en: "Three players combine with two touches, the last one finishes on a goal with a keeper.",
  },
  "Zakončení pod tlakem obránce": { cs: "Zakončení pod tlakem obránce", en: "Finishing under pressure from a defender" },
  "Hráč dostává míč zády k brance s obráncem v zádech, musí se otočit a zakončit.": {
    cs: "Hráč dostává míč zády k brance s obráncem v zádech, musí se otočit a zakončit.",
    en: "The player receives with back to goal and a defender behind, has to turn and finish.",
  },
};

/** Text cvičení (název nebo popis) v jazyce uživatele; neznámý text vrací beze změny. */
export function drillText(text: string): string {
  return DRILL_TEXTS[text]?.[currentLang()] ?? text;
}
