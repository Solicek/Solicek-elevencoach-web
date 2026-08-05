import type { Drill } from "./types";

function builtin(name: string, category: string, description: string): Drill {
  return { id: crypto.randomUUID(), name, category, description, isCustom: false, diagram: [] };
}

/** Malá vestavěná knihovna ukázkových cvičení – přepis DrillLibrary.all z Androidu 1:1. */
export const drillLibrary: Drill[] = [
  builtin("Dynamický strečink", "Rozcvička", "Kruhy pažemi, výpady s rotací, vysoký skip, zaskoky – 5-8 minut."),
  builtin("Aktivace s míčem", "Rozcvička", "Lehké vedení míče, postupně přidávat sprinty a změny směru."),
  builtin("Vedení míče slalomem", "Technika", "Vedení míče mezi kužely oběma nohama, důraz na krátké dotyky."),
  builtin("Přihrávky ve dvojicích", "Technika", "Přihrávky na jeden až dva doteky na 10-15 m, střídat vnitřní a vnější nárt."),
  builtin("Žonglování", "Technika", "Individuální žonglování, cíl zvýšit počet doteků bez ztráty míče."),
  builtin("Zpracování míče a otočka", "Technika", "Nahrávka do nohy, zpracování a otočka o 180°, poté přihrávka zpět."),
  builtin("Driblink 1v1 na malém prostoru", "Technika", "Souboj 1 na 1 na vymezeném území, útočník se snaží projít na druhou stranu."),
  builtin("Intervalový běh", "Kondice", "Střídání sprintu (15 s) a klusu (30 s), 8-10 opakování."),
  builtin("Škola běhu s míčem", "Kondice", "Nízké překážky nebo žebřík, poté navazuje vedení míče."),
  builtin("Výbušné starty", "Kondice", "Starty z různých poloh (leh, sed, čelem/zády) na signál, sprint 10 m."),
  builtin("Kruhový trénink", "Kondice", "Stanoviště dřepy, plank, výpady, skoky – 30 s práce, 15 s odpočinek."),
  builtin("Rondo (držení míče)", "Herní situace", "Skupina v kruhu drží míč proti 1-2 hráčům uprostřed, důraz na rychlost přihrávek."),
  builtin("Přečíslení 3v2", "Herní situace", "Útočná trojice proti dvěma obráncům, zakončení na branku."),
  builtin("Nácvik rohových kopů", "Herní situace", "Nacvičení rozestavení a signálů při rohu, střídání útočné a obranné role."),
  builtin("Přechod obrana-útok", "Herní situace", "Po zisku míče rychlý přechod do útoku, důraz na první přihrávku dopředu."),
  builtin("Presink po ztrátě míče", "Herní situace", "Nácvik okamžitého dotahování soupeře do 5 vteřin po ztrátě míče."),
  builtin("Střelba z první", "Zakončení", "Křížné přihrávky do vápna, zakončení z první."),
  builtin("Souboje na malém brankovišti", "Zakončení", "Hra 2v2 na dvě malé branky, důraz na soubojovost."),
  builtin("Trénink pokutových kopů", "Zakončení", "Střídavé exekuce penalt, brankář střídá strany."),
];
