import { formations } from "../formations";
import type { Substitute } from "../types";
import { formationLabel, positionCodeLabel, t, tf } from "./i18n";

/** Textový export sestavy (pro tlačítko "Sdílet") – přepis buildExportText() z Androidu 1:1. */
export function buildExportText(formationName: string, names: Record<string, string>, substitutes: Substitute[]): string {
  const positions = [...(formations[formationName] ?? [])].sort((a, b) => a.yPercent - b.yPercent);
  const lines = [tf("export.header", { formation: formationLabel(formationName) }), ""];
  for (const pos of positions) {
    const key = `${formationName}|${pos.id}`;
    const name = names[key]?.trim() || "-";
    lines.push(`${positionCodeLabel(pos.label)}: ${name}`);
  }
  if (substitutes.length > 0) {
    lines.push("");
    lines.push(t("export.substitutes"));
    for (const s of substitutes) lines.push(`- ${s.name}`);
  }
  return lines.join("\n");
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Vykreslí PNG export sestavy (pro tlačítko "Obrázek") – přepis renderLineupBitmap() z Androidu. */
export function renderLineupImage(formationName: string, names: Record<string, string>, substitutes: Substitute[]): Promise<Blob> {
  const width = 1080;
  const height = 1500;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  const margin = 24;
  ctx.fillStyle = "black";
  ctx.font = "bold 44px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(tf("export.header", { formation: formationLabel(formationName) }), margin, 64);

  const pitchTop = 100;
  const pitchBottom = height - 260;
  const pitchLeft = margin;
  const pitchRight = width - margin;
  const pitchWidth = pitchRight - pitchLeft;
  const pitchHeight = pitchBottom - pitchTop;

  ctx.fillStyle = "#2E7D32";
  ctx.fillRect(pitchLeft, pitchTop, pitchWidth, pitchHeight);

  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 4;
  const centerX = pitchLeft + pitchWidth / 2;
  const centerY = pitchTop + pitchHeight / 2;
  ctx.beginPath();
  ctx.moveTo(pitchLeft, centerY);
  ctx.lineTo(pitchRight, centerY);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX, centerY, Math.min(pitchWidth, pitchHeight) * 0.12, 0, Math.PI * 2);
  ctx.stroke();

  const boxWidth = pitchWidth * 0.6;
  const boxHeight = pitchHeight * 0.16;
  ctx.strokeRect(centerX - boxWidth / 2, pitchTop, boxWidth, boxHeight);
  ctx.strokeRect(centerX - boxWidth / 2, pitchBottom - boxHeight, boxWidth, boxHeight);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 6;
  ctx.strokeRect(pitchLeft, pitchTop, pitchWidth, pitchHeight);

  const positions = formations[formationName] ?? [];
  const circleRadius = 46;
  for (const pos of positions) {
    const cx = pitchLeft + pitchWidth * pos.xPercent;
    const cy = pitchTop + pitchHeight * pos.yPercent;

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2E7D32";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(positionCodeLabel(pos.label), cx, cy + 11);

    const key = `${formationName}|${pos.id}`;
    const name = names[key]?.trim();
    if (name) {
      ctx.font = "26px sans-serif";
      const textWidth = ctx.measureText(name).width;
      const bgLeft = cx - textWidth / 2 - 10;
      const bgTop = cy + circleRadius + 6;
      const bgBottom = bgTop + 38;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(bgLeft, bgTop, textWidth + 20, bgBottom - bgTop);
      ctx.fillStyle = "white";
      ctx.fillText(name, cx, bgBottom - 11);
    }
  }

  ctx.fillStyle = "black";
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "left";
  const subsTitleY = pitchBottom + 56;
  ctx.fillText(t("export.substitutes"), margin, subsTitleY);

  ctx.fillStyle = "#444";
  ctx.font = "28px sans-serif";
  const subsText = substitutes.length > 0 ? substitutes.map((s) => s.name).join(", ") : t("export.noSubstitutes");
  const wrapped = wrapText(ctx, subsText, pitchWidth);
  wrapped.forEach((line, i) => ctx.fillText(line, margin, subsTitleY + 44 + i * 36));

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png");
  });
}
