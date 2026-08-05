/** Vykreslí čáry hřiště (středová čára, kruh, dvě vápna) – přepis drawPitchLines() z Compose. */
export function drawPitchLines(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const strokeWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = strokeWidth;

  // Středová čára
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // Středový kruh
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.12, 0, Math.PI * 2);
  ctx.stroke();

  // Vápna nahoře a dole (zjednodušená)
  const boxWidth = width * 0.6;
  const boxHeight = height * 0.16;
  ctx.strokeRect((width - boxWidth) / 2, 0, boxWidth, boxHeight);
  ctx.strokeRect((width - boxWidth) / 2, height - boxHeight, boxWidth, boxHeight);
}

/** Vykreslí jeden tah (červená čára, kulaté zakončení/spojení) – přepis drawTacticStroke(). */
export function drawStroke(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]): void {
  if (points.length < 2) return;
  ctx.strokeStyle = "red";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.stroke();
}

/** Nastaví canvas na skutečnou pixelovou velikost jeho kontejneru (s ohledem na devicePixelRatio). */
export function sizeCanvasToContainer(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
