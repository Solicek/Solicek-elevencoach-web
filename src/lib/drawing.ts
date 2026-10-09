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

/** Vykreslí čáry poloviny hřiště (jedna branka, šestnáctka, půlkruh na spodním okraji). */
export function drawHalfPitchLines(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const strokeWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = strokeWidth;

  // Vápno u branky (nahoře)
  const boxWidth = width * 0.6;
  const boxHeight = height * 0.32;
  ctx.strokeRect((width - boxWidth) / 2, 0, boxWidth, boxHeight);

  // Malé (brankové) území
  const gBoxWidth = width * 0.3;
  const gBoxHeight = height * 0.12;
  ctx.strokeRect((width - gBoxWidth) / 2, 0, gBoxWidth, gBoxHeight);

  // Středová čára na spodním okraji + kus středového kruhu
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(width, height);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(width / 2, height, width * 0.18, Math.PI, Math.PI * 2);
  ctx.stroke();
}

interface Point {
  x: number;
  y: number;
}

interface ArrowStyleConfig {
  wavy: boolean; // vlnovka = vedení míče
  curved: boolean; // oblouk = přihrávka vzduchem
  loop: boolean; // uzavřená smyčka kolem překážky na začátku úseku = obcházení soupeře/překážky
  accel: boolean; // vlnovka postupně přechází v rovnou čáru = zrychlení
  dashed: boolean; // čárkovaná = přihrávka
  doubleLine: boolean; // dvojitá čára + otevřená "V" hlavička = střelba
  width: number;
}

const ARROW_STYLE_CONFIG: Record<string, ArrowStyleConfig> = {
  "Vedení míče": { wavy: true, curved: false, loop: false, accel: false, dashed: false, doubleLine: false, width: 1.5 },
  "Vedení míče se zrychlením": { wavy: true, curved: false, loop: false, accel: true, dashed: false, doubleLine: false, width: 1.5 },
  "Obcházení soupeře/překážky": { wavy: false, curved: false, loop: true, accel: false, dashed: false, doubleLine: false, width: 1.5 },
  Přihrávka: { wavy: false, curved: false, loop: false, accel: false, dashed: true, doubleLine: false, width: 1.5 },
  "Přihrávka vzduchem": { wavy: false, curved: true, loop: false, accel: false, dashed: true, doubleLine: false, width: 1.5 },
  Střelba: { wavy: false, curved: false, loop: false, accel: false, dashed: false, doubleLine: true, width: 1.4 },
  "Pohyb hráče bez míče": { wavy: false, curved: false, loop: false, accel: false, dashed: false, doubleLine: false, width: 1.1 },
};

const CURVE_BOW_RATIO = 0.22;
const SAMPLE_COUNT = 32;

function quadBezierPoint(p0: Point, control: Point, p1: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * control.x + t * t * p1.x,
    y: mt * mt * p0.y + 2 * mt * t * control.y + t * t * p1.y,
  };
}

const LOOP_SWEEP_DEGREES = 300;
const LOOP_SAMPLE_COUNT = 24;

/**
 * Uzavřená smyčka (téměř celý kruh) kolem překážky hned na začátku úseku – dráha vyjde
 * přesně z bodu "from" (obtočí kužel/soupeře), pak rovnou pokračuje do bodu "to".
 * Poloměr smyčky je omezený, ať na dlouhém úseku nevznikne obří kruh.
 */
function buildLoopPath(from: Point, to: Point): Point[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const totalLen = Math.hypot(dx, dy) || 1;
  const dirAngle = Math.atan2(dy, dx);
  const radius = Math.min(totalLen * 0.3, 40);
  const center: Point = { x: from.x + radius * Math.cos(dirAngle), y: from.y + radius * Math.sin(dirAngle) };
  const entryAngle = dirAngle + Math.PI;
  const sweep = -(LOOP_SWEEP_DEGREES * Math.PI) / 180;

  const points: Point[] = [];
  for (let i = 0; i <= LOOP_SAMPLE_COUNT; i++) {
    const t = i / LOOP_SAMPLE_COUNT;
    const angle = entryAngle + sweep * t;
    points.push({ x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) });
  }
  const exitPoint = points[points.length - 1];
  const exitSamples = Math.max(2, SAMPLE_COUNT - LOOP_SAMPLE_COUNT);
  for (let i = 1; i <= exitSamples; i++) {
    const t = i / exitSamples;
    points.push({ x: exitPoint.x + (to.x - exitPoint.x) * t, y: exitPoint.y + (to.y - exitPoint.y) * t });
  }
  return points;
}

const WEAVE_MAX_RADIUS = 30;
const WEAVE_MAX_AMPLITUDE = 28;
const RIPPLE_WAVELENGTH = 40; // px na jeden cyklus jemné vlnovky po celé délce (klasický zápis vedení míče)
const RIPPLE_AMPLITUDE = 5;

/**
 * "Vedení míče": dráha je po CELÉ délce jemně zvlněná (klasický zápis vedení míče v
 * tréninkových nákresech), a navíc u KAŽDÉHO mezilehlého bodu (kužel/překážka), pokud
 * jde o vícebodovou šipku, udělá čára jedno výrazně větší vybočení PŘESNĚ v jeho pozici
 * (kužel leží uvnitř zákrutu), strany se střídají doleva/doprava jako slalom.
 */
function buildDribblePath(points: Point[], accel: boolean): Point[] {
  const n = points.length;
  const segLens: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    segLens.push(Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y) || 1);
  }
  const cumLen: number[] = [0];
  for (const l of segLens) cumLen.push(cumLen[cumLen.length - 1] + l);
  const totalLen = cumLen[cumLen.length - 1] || 1;

  interface Bump {
    center: number;
    radius: number;
    perpX: number;
    perpY: number;
    sign: number;
    amplitude: number;
  }
  const bumps: Bump[] = [];
  for (let i = 1; i < n - 1; i++) {
    const inLen = segLens[i - 1];
    const outLen = segLens[i];
    const inUx = (points[i].x - points[i - 1].x) / inLen;
    const inUy = (points[i].y - points[i - 1].y) / inLen;
    const outUx = (points[i + 1].x - points[i].x) / outLen;
    const outUy = (points[i + 1].y - points[i].y) / outLen;
    let dirX = inUx + outUx;
    let dirY = inUy + outUy;
    const dirLen = Math.hypot(dirX, dirY);
    if (dirLen < 0.01) {
      dirX = inUx;
      dirY = inUy;
    } else {
      dirX /= dirLen;
      dirY /= dirLen;
    }
    const radius = Math.min(WEAVE_MAX_RADIUS, inLen * 0.4, outLen * 0.4);
    const amplitude = Math.min(radius * 0.95, accel ? 18 : WEAVE_MAX_AMPLITUDE);
    const sign = i % 2 === 1 ? 1 : -1;
    bumps.push({ center: cumLen[i], radius, perpX: -dirY, perpY: dirX, sign, amplitude });
  }

  // Hustota vzorkování musí dát dost bodů i NA JEDEN CYKLUS vlnovky (RIPPLE_WAVELENGTH),
  // jinak se sinusovka kreslí jako pár rovných úseček a vypadá jako zubatý cik-cak
  // místo hladké vlny – proto 1 vzorek na px, ne jen na 3px délky.
  const sampleCount = Math.max(40, Math.min(1200, Math.round(totalLen)));
  const result: Point[] = [];
  for (let k = 0; k <= sampleCount; k++) {
    const s = (k / sampleCount) * totalLen;
    let segIdx = segLens.length - 1;
    for (let i = 0; i < segLens.length; i++) {
      if (s <= cumLen[i + 1]) {
        segIdx = i;
        break;
      }
    }
    const p0 = points[segIdx];
    const p1 = points[segIdx + 1];
    const segLen = segLens[segIdx];
    const t = segLen > 0 ? (s - cumLen[segIdx]) / segLen : 0;
    let x = p0.x + (p1.x - p0.x) * t;
    let y = p0.y + (p1.y - p0.y) * t;

    // Kontinuální jemná vlnovka po celé délce. Se zrychlením postupně odeznívá –
    // hráč nabírá rychlost a míč vede naostro (rovně).
    const perpX = -(p1.y - p0.y) / segLen;
    const perpY = (p1.x - p0.x) / segLen;
    const rippleFade = accel ? Math.max(0, 1 - s / (totalLen * 0.6)) : 1;
    const rippleOffset = RIPPLE_AMPLITUDE * rippleFade * Math.sin((s / RIPPLE_WAVELENGTH) * Math.PI * 2);
    x += perpX * rippleOffset;
    y += perpY * rippleOffset;

    for (const b of bumps) {
      if (s >= b.center - b.radius && s <= b.center + b.radius) {
        const localT = (s - (b.center - b.radius)) / (2 * b.radius);
        const offset = b.amplitude * Math.sin(localT * Math.PI) * b.sign;
        x += b.perpX * offset;
        y += b.perpY * offset;
        break;
      }
    }
    result.push({ x, y });
  }
  return result;
}

/** Výchozí (počáteční) ovládací bod oblouku pro danou dvojici bodů – použito při vzniku
 * nové "Přihrávky vzduchem" (než si uživatel oblouk přetáhne po svém), a jako fallback pro
 * starší uložené šipky, které ještě ovládací bod jako 3. bod pole nemají. */
export function defaultCurveControlPoint(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const angle = Math.atan2(dy, dx);
  const perpX = -Math.sin(angle);
  const perpY = Math.cos(angle);
  return {
    x: (from.x + to.x) / 2 + perpX * length * CURVE_BOW_RATIO,
    y: (from.y + to.y) / 2 + perpY * length * CURVE_BOW_RATIO,
  };
}

/** Má daný styl šipky oblouk (Přihrávka vzduchem) – tj. prostřední bod pole je přímo
 * TAŽITELNÝ ovládací bod oblouku, ne mezilehlý bod trasy jako u ostatních stylů. */
export function isCurvedArrowStyle(style: string): boolean {
  return (ARROW_STYLE_CONFIG[style] ?? ARROW_STYLE_CONFIG["Přihrávka"]).curved;
}

/** Vytvoří body dráhy šipky podle stylu (rovná/oblouk/vybočení/vícebodová) – sdílené pro kreslení i hlavičku. */
function buildArrowPath(points: Point[], config: ArrowStyleConfig): Point[] {
  if (config.wavy) return buildDribblePath(points, config.accel);

  // Oblouk se 3 body: prostřední bod NENÍ mezilehlý waypoint na trase (jako u slalomu),
  // ale přímo tažitelný ovládací bod kvadratické křivky – tažením ho lze posunout na
  // libovolnou stranu čáry, čímž se mění směr i hloubka oblouku.
  if (config.curved && points.length === 3) {
    const [from, control, to] = points;
    const result: Point[] = [];
    for (let i = 0; i <= SAMPLE_COUNT; i++) {
      result.push(quadBezierPoint(from, control, to, i / SAMPLE_COUNT));
    }
    return result;
  }
  if (points.length > 2) return points;

  const from = points[0];
  const to = points[1];
  if (config.loop) return buildLoopPath(from, to);

  const dx = to.x - from.x;
  const dy = to.y - from.y;

  const result: Point[] = [];
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const t = i / SAMPLE_COUNT;
    const base = config.curved
      ? quadBezierPoint(from, defaultCurveControlPoint(from, to), to, t)
      : { x: from.x + dx * t, y: from.y + dy * t };
    result.push(base);
  }
  return result;
}

/** Bod přesně v polovině DÉLKY lomené čáry (ne prostředního indexu pole). */
function midpointOfPolyline(points: Point[]): Point {
  if (points.length === 1) return points[0];
  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    segLens.push(d);
    total += d;
  }
  if (total === 0) return points[0];
  let target = total / 2;
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i]) {
      const t = segLens[i] === 0 ? 0 : target / segLens[i];
      return { x: points[i].x + (points[i + 1].x - points[i].x) * t, y: points[i].y + (points[i + 1].y - points[i].y) * t };
    }
    target -= segLens[i];
  }
  return points[points.length - 1];
}

/** Střed ŠIPKY tak, jak je opravdu vidět (na vykreslené dráze, ne na "syrových" bodech
 * pole – u oblouku/vlnovky/slalomu se to liší) – pro umístění bublinky s číslem a
 * mazacího tlačítka přesně na střed. */
export function arrowMidpoint(points: Point[], style: string): Point {
  const config = ARROW_STYLE_CONFIG[style] ?? ARROW_STYLE_CONFIG["Přihrávka"];
  return midpointOfPolyline(buildArrowPath(points, config));
}

/** Vykreslí šipku podle stylu (vedení míče/přihrávka/střelba/pohyb bez míče/…) – čára + trojúhelníková hlavička. `points` má aspoň 2 body (mezilehlé = kužely/překážky, kolem kterých šipka obíhá). */
export function drawArrow(ctx: CanvasRenderingContext2D, points: Point[], style: string): void {
  const config = ARROW_STYLE_CONFIG[style] ?? ARROW_STYLE_CONFIG["Přihrávka"];
  const color = "#ffca28";
  const path = buildArrowPath(points, config);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = config.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash(config.dashed ? [10, 8] : []);

  if (config.doubleLine) {
    const gap = config.width * 2.2;
    for (const offset of [gap / 2, -gap / 2]) {
      const offsetPath = buildOffsetPath(path, offset);
      ctx.beginPath();
      ctx.moveTo(offsetPath[0].x, offsetPath[0].y);
      for (const p of offsetPath.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (const p of path.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  // Dash state kreslicího kontextu přetrvává mezi voláními – reset, ať neovlivní
  // další kreslení (např. čáry hřiště nebo další plnou šipku).
  ctx.setLineDash([]);

  // Hlavička sleduje směr posledního úseku dráhy (u vlnovky/oblouku tedy skutečný
  // směr na konci, ne přímku od-do).
  const tail = path[path.length - 2];
  const tip = path[path.length - 1];
  const angle = Math.atan2(tip.y - tail.y, tip.x - tail.x);

  if (config.doubleLine) {
    // Otevřená "V" hlavička (dvě čáry, ne plný trojúhelník) – klasický zápis střelby.
    const headLen = 10;
    const headAngle = Math.PI / 6;
    ctx.lineWidth = config.width * 1.4;
    ctx.beginPath();
    ctx.moveTo(tip.x - headLen * Math.cos(angle - headAngle), tip.y - headLen * Math.sin(angle - headAngle));
    ctx.lineTo(tip.x, tip.y);
    ctx.lineTo(tip.x - headLen * Math.cos(angle + headAngle), tip.y - headLen * Math.sin(angle + headAngle));
    ctx.stroke();
  } else {
    const headLen = 9;
    const headAngle = Math.PI / 7;
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x - headLen * Math.cos(angle - headAngle), tip.y - headLen * Math.sin(angle - headAngle));
    ctx.lineTo(tip.x - headLen * Math.cos(angle + headAngle), tip.y - headLen * Math.sin(angle + headAngle));
    ctx.closePath();
    ctx.fill();
  }
}

/** Posune dráhu kolmo na místní směr o `offset` px – použito pro dvojitou čáru (Střelba). */
function buildOffsetPath(path: Point[], offset: number): Point[] {
  return path.map((p, i) => {
    const prev = path[Math.max(0, i - 1)];
    const next = path[Math.min(path.length - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: p.x + (-dy / len) * offset, y: p.y + (dx / len) * offset };
  });
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
