const KEY_TEAM_CODE = "team_code";
const KEY_READ_ONLY = "team_read_only";

export function loadTeamCode(): string | null {
  return localStorage.getItem(KEY_TEAM_CODE);
}

export function loadReadOnly(): boolean {
  return localStorage.getItem(KEY_READ_ONLY) === "1";
}

export function saveTeamCode(code: string, isReadOnly: boolean): void {
  localStorage.setItem(KEY_TEAM_CODE, code);
  localStorage.setItem(KEY_READ_ONLY, isReadOnly ? "1" : "0");
}

export function clearTeamCode(): void {
  localStorage.removeItem(KEY_TEAM_CODE);
  localStorage.removeItem(KEY_READ_ONLY);
}
