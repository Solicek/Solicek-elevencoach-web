export function todayDateString(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

/** Parsuje datum ve formátu DD-MM-RRRR na půlnoc daného dne (lokální čas). Vrací null pro neplatný/chybějící vstup. */
export function parseDateString(value: string): Date | null {
  const match = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  // new Date() si neplatné datum (např. 31-02-2026) tiše přepočítá na jiný den – takové vstupy odmítneme.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

/** Řazení podle data vzestupně; neplatné/chybějící datum padá na konec. */
export function compareDateStrings(a: string, b: string): number {
  const da = parseDateString(a);
  const db = parseDateString(b);
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return da.getTime() - db.getTime();
}

const LOCK_AFTER_WEEKS = 2;

/** Zápis staršího data se po LOCK_AFTER_WEEKS týdnech stává zcela needitovatelným (i poznámky/fotky). */
export function isOlderThanLockWindow(dateString: string): boolean {
  const date = parseDateString(dateString);
  if (!date) return false;
  const lockAt = new Date(date);
  lockAt.setDate(lockAt.getDate() + LOCK_AFTER_WEEKS * 7);
  return new Date() >= lockAt;
}
