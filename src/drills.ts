import type { Drill } from "./types";

function builtin(name: string, category: string, description: string): Drill {
  return { id: crypto.randomUUID(), name, category, description, isCustom: false, diagram: [] };
}

/** Vestavěná knihovna ukázkových cvičení – přepis DrillLibrary.all z Androidu 1:1. */
export const drillLibrary: Drill[] = [
  // Rozcvička
  builtin("Dynamický strečink", "Rozcvička", "Kruhy pažemi, výpady s rotací, vysoký skip, zaskoky – 5-8 minut."),
  builtin("Aktivace s míčem", "Rozcvička", "Lehké vedení míče, postupně přidávat sprinty a změny směru."),
  builtin("Běžecká abeceda", "Rozcvička", "Skipping, zakopávání, odpichy, křižování nohou – 4x15 m, zpět chůzí."),
  builtin("Aktivační rondo", "Rozcvička", "Malé rondo 4+1 v klidném tempu – cíl je rozproudit krev, ne rychlost přihrávek."),
  builtin("Odrazová cvičení pro klouby", "Rozcvička", "Poskoky snožmo, jednonož a boční odrazy přes čáru – 3 série po 10 opakování."),
  builtin("Rozehřátí ve dvojicích s míčem", "Rozcvička", "Přihrávky na místě, postupně přidávat pohyb a zvětšovat vzdálenost mezi hráči."),

  // Technika
  builtin("Vedení míče slalomem", "Technika", "Vedení míče mezi kužely oběma nohama, důraz na krátké dotyky."),
  builtin("Přihrávky ve dvojicích", "Technika", "Přihrávky na jeden až dva doteky na 10-15 m, střídat vnitřní a vnější nárt."),
  builtin("Žonglování", "Technika", "Individuální žonglování, cíl zvýšit počet doteků bez ztráty míče."),
  builtin("Zpracování míče a otočka", "Technika", "Nahrávka do nohy, zpracování a otočka o 180°, poté přihrávka zpět."),
  builtin("Driblink 1v1 na malém prostoru", "Technika", "Souboj 1 na 1 na vymezeném území, útočník se snaží projít na druhou stranu."),
  builtin("Řízená změna směru", "Technika", "Sprint s míčem 10 m, prudké zastavení a změna směru přes kužel, opakovat na obě strany."),
  builtin("Kontrola padajícího míče", "Technika", "Nahazování míče do vzduchu, tlumení hrudníkem, stehnem nebo nártem, poté přihrávka."),
  builtin("Přihrávky na jeden dotek v trojúhelníku", "Technika", "Tři hráči přihrávají po jednom dotyku v kolotoči, po 2 minutách zrychlit tempo."),
  builtin("Klamavé pohyby na kuželu", "Technika", "Nácvik 2-3 fint (přešlápnutí, La Croqueta) nejprve na místě, poté v plné rychlosti."),
  builtin("Zpracování zády k brance s otočkou", "Technika", "Nahrávka zezadu, hráč čelem od branky zpracuje míč a otočí se směrem k ní."),

  // Kondice
  builtin("Intervalový běh", "Kondice", "Střídání sprintu (15 s) a klusu (30 s), 8-10 opakování."),
  builtin("Škola běhu s míčem", "Kondice", "Nízké překážky nebo žebřík, poté navazuje vedení míče."),
  builtin("Výbušné starty", "Kondice", "Starty z různých poloh (leh, sed, čelem/zády) na signál, sprint 10 m."),
  builtin("Kruhový trénink", "Kondice", "Stanoviště dřepy, plank, výpady, skoky – 30 s práce, 15 s odpočinek."),
  builtin("Fartlek s míčem", "Kondice", "Střídání klusu a rychlého běhu na okruhu s vedením míče, 10-12 minut."),
  builtin("Koordinační žebřík", "Kondice", "Rychlé nohy přes žebřík v různých vzorech kroků, 6 průchodů s odpočinkem mezi nimi."),
  builtin("Přerušovaný vytrvalostní běh", "Kondice", "Postupně kratší intervaly tam a zpět mezi metami na signál píšťalky."),
  builtin("Silový kruh s vlastní vahou", "Kondice", "Dřepy, kliky, sedy-lehy, výpady – 40 s práce, 20 s pauza, 4 kola."),

  // Herní situace
  builtin("Rondo (držení míče)", "Herní situace", "Skupina v kruhu drží míč proti 1-2 hráčům uprostřed, důraz na rychlost přihrávek."),
  builtin("Přečíslení 3v2", "Herní situace", "Útočná trojice proti dvěma obráncům, zakončení na branku."),
  builtin("Nácvik rohových kopů", "Herní situace", "Nacvičení rozestavení a signálů při rohu, střídání útočné a obranné role."),
  builtin("Přechod obrana-útok", "Herní situace", "Po zisku míče rychlý přechod do útoku, důraz na první přihrávku dopředu."),
  builtin("Presink po ztrátě míče", "Herní situace", "Nácvik okamžitého dotahování soupeře do 5 vteřin po ztrátě míče."),
  builtin("Possession 5v5 se žolíky", "Herní situace", "Malé hřiště, tým s míčem má přesilu díky dvěma žolíkům, cíl 6 přihrávek za sebou."),
  builtin("Přečíslení 4v3 se zakončením", "Herní situace", "Rychlý protiútok čtyř proti třem, důraz na správné rozhodnutí posledního přihrávajícího."),
  builtin("Rychlé autové vhazování do útoku", "Herní situace", "Nacvičení signálů a rozestavení pro rychlé vhazování s okamžitým přechodem dopředu."),
  builtin("Souhra obranné linie", "Herní situace", "Nácvik postupu a couvání čtyř obránců podle postavení míče, udržet kompaktnost."),
  builtin("Rychlý přechod po zisku ve vápně", "Herní situace", "Po zisku míče ve vlastním vápně rychlý první dotek dopředu a přečíslení."),

  // Zakončení
  builtin("Střelba z první", "Zakončení", "Křížné přihrávky do vápna, zakončení z první."),
  builtin("Souboje na malém brankovišti", "Zakončení", "Hra 2v2 na dvě malé branky, důraz na soubojovost."),
  builtin("Trénink pokutových kopů", "Zakončení", "Střídavé exekuce penalt, brankář střídá strany."),
  builtin("Zakončení po centru z křídla", "Zakončení", "Center z postranní čáry, útočníci najíždějí na přední a zadní tyč."),
  builtin("Střelba z dálky po signálu", "Zakončení", "Přihrávka na okraj vápna, první dotek na zpracování, druhý na zakončení."),
  builtin("Kombinace na dva doteky před zakončením", "Zakončení", "Trojice kombinuje na dva doteky, poslední hráč zakončuje do branky s brankářem."),
  builtin("Zakončení pod tlakem obránce", "Zakončení", "Hráč dostává míč zády k brance s obráncem v zádech, musí se otočit a zakončit."),
];
