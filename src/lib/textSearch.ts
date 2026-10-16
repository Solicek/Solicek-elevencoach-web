/**
 * Porovnávání textu pro vyhledávání – bez ohledu na velikost písmen a diakritiku, ať "spart"
 * najde "Sparta" i "Hradec Králové" přes "kralove". Trenéři píšou jména soupeřů různě.
 */
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function matchesSearch(haystack: string, needle: string): boolean {
  return normalizeForSearch(haystack).includes(normalizeForSearch(needle));
}
