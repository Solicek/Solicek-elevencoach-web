/**
 * Sdílení textu přes Web Share API, s fallbackem na schránku pro prohlížeče/desktopy,
 * které ho nepodporují. Zrušení sdílecího panelu uživatelem (AbortError) se nehlásí jako chyba.
 */
export async function shareText(text: string, title?: string): Promise<"shared" | "copied" | "failed"> {
  if (navigator.share) {
    try {
      await navigator.share({ text, title });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "shared";
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

/**
 * Sdílení souboru (PNG export sestavy) přes Web Share API (iOS Safari 15+), s fallbackem na
 * stažení souboru přes <a download> na desktopu / v prohlížečích bez podpory sdílení souborů.
 */
export async function shareFile(file: File, title?: string): Promise<"shared" | "downloaded"> {
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "shared";
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}
