const KEY_TEAM_CODE = "team_code";

export function loadTeamCode(): string | null {
  return localStorage.getItem(KEY_TEAM_CODE);
}

export function saveTeamCode(code: string): void {
  localStorage.setItem(KEY_TEAM_CODE, code);
}

export function clearTeamCode(): void {
  localStorage.removeItem(KEY_TEAM_CODE);
}
