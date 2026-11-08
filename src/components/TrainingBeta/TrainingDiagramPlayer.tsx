import { useEffect, useRef, useState } from "react";
import { drawArrow, drawHalfPitchLines, drawPitchLines, sizeCanvasToContainer } from "../../lib/drawing";
import { buildAnimation, sampleAnimation, type Animation } from "../../lib/diagramAnimation";
import { DiagramBackground, DiagramElementType } from "../../types";
import type { TrainingDiagram } from "../../types";
import { DiagramElementIcon } from "./DiagramElementIcon";
import { t } from "../../lib/i18n";

interface Props {
  diagram: TrainingDiagram;
  style?: React.CSSProperties;
}

const SPEEDS = [0.5, 1, 1.5];
/** Poměr šířka/výška hřiště – celé je na výšku, půlka na šířku. */
const FULL_PITCH_ASPECT = 0.62;
const HALF_PITCH_ASPECT = 1.3;
/** Co pod hřištěm zůstane na tlačítka (Smazat / Upravit / Zpět) a okraje. */
const SPACE_BELOW_PITCH = 76;
/** Pod tuhle výšku už hřiště nezmenšujeme, radši se bude scrollovat. */
const MIN_PITCH_HEIGHT = 260;
/** Otočit hřiště napříč displejem se vyplatí, až když tím znatelně povyroste. */
const TURN_GAIN = 1.1;
/** Hráči i míč jsou v animaci větší než ve statickém nákresu – jsou to hlavní aktéři. */
const PLAYER_SIZE = 36;
const BALL_SIZE = 24;

/** Největší obdélník daného poměru stran, který se vejde do nabídnutého místa. */
function fitBox(ratio: number, maxWidth: number, maxHeight: number) {
  const width = Math.min(maxWidth, maxHeight * ratio);
  return { width, height: width / ratio };
}

/**
 * Přehrání nákresu jako animace – hráči a míč se pohybují po nakreslených šipkách v pořadí,
 * které mají nastavené. Scénář počítá lib/diagramAnimation.ts, tady je jen vykreslení a ovládání.
 *
 * Záměrně se NEkreslí celé šipky: na plný nákres se trenér může podívat na vedlejší záložce,
 * tady má být vidět hlavně POHYB. Místo šipek se za hráčem/míčem kreslí stopa toho, co už
 * projel, takže je pořád jasné, kudy se šlo, ale plocha zůstane čistá.
 */
export function TrainingDiagramPlayer({ diagram, style }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Na hřiště se odkazujeme přes callback ref, ne přes useRef: kdyby React jeho uzel někdy
  // vyměnil, měření se přepne na nový. Jinak by canvas zůstal nakreslený na starou velikost.
  const [pitchEl, setPitchEl] = useState<HTMLDivElement | null>(null);
  const [space, setSpace] = useState<{ width: number; height: number; landscape: boolean } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [animation, setAnimation] = useState<Animation>(() => buildAnimation(diagram));
  const [timeMs, setTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setAnimation(buildAnimation(diagram));
    setTimeMs(0);
    setIsPlaying(false);
  }, [diagram]);

  useEffect(() => {
    if (!pitchEl) return;
    // Čte se clientWidth/clientHeight, tedy skutečná velikost bez ohledu na to, že je hřiště
    // na ležícím displeji otočené – rozměry z contentRect u otočeného prvku nejsou spolehlivé.
    const measureCanvas = () => setSize({ width: pitchEl.clientWidth, height: pitchEl.clientHeight });
    measureCanvas();
    const observer = new ResizeObserver(measureCanvas);
    observer.observe(pitchEl);
    return () => observer.disconnect();
  }, [pitchEl]);

  // Kolik místa hřiště dostane. Na stránce se měří od jeho horního okraje dolů, takže to sedí
  // i když se nad ním něco změní (jiný název nákresu, přepínač, otočení displeje); na celé
  // obrazovce je k dispozici celé okno.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    function measure() {
      if (!wrapper) return;
      const landscape = window.innerWidth > window.innerHeight;
      const rect = wrapper.getBoundingClientRect();
      const width = fullscreen ? window.innerWidth : rect.width;
      const height = fullscreen
        ? window.innerHeight
        : Math.max(MIN_PITCH_HEIGHT, window.innerHeight - rect.top - SPACE_BELOW_PITCH);
      setSpace((prev) =>
        prev && prev.width === width && prev.height === height && prev.landscape === landscape
          ? prev
          : { width, height, landscape }
      );
    }
    measure();
    const observer = new ResizeObserver(() => measure());
    observer.observe(wrapper);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [fullscreen]);

  // Na celé obrazovce nemá smysl, aby se pod animací dala rolovat stránka; Esc je zavře.
  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);

  // Posun času podle skutečně uplynulých milisekund (ne podle počtu snímků), ať animace trvá
  // stejně dlouho na pomalém i rychlém zařízení. Na konci se sama zastaví.
  useEffect(() => {
    if (!isPlaying) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = (now - last) * speed;
      last = now;
      setTimeMs((prev) => {
        const next = prev + delta;
        if (next >= animation.totalMs) {
          setIsPlaying(false);
          return animation.totalMs;
        }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, speed, animation.totalMs]);

  const frame = sampleAnimation(animation, diagram, timeMs);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return;
    const ctx = sizeCanvasToContainer(canvas, size.width, size.height);
    ctx.clearRect(0, 0, size.width, size.height);
    if (diagram.background === DiagramBackground.HALF) drawHalfPitchLines(ctx, size.width, size.height);
    else drawPitchLines(ctx, size.width, size.height);

    // Šipky jsou vidět pořád – nesou informaci, kterou samotná stopa neukáže (co je přihrávka
    // a co běh, kudy se půjde dál). Kreslí se ztlumeně, aby hlavní zůstal pohyb hráčů a míče.
    ctx.save();
    ctx.globalAlpha = 0.45;
    for (const arrow of diagram.arrows) {
      drawArrow(
        ctx,
        arrow.points.map((p) => ({ x: p.x * size.width, y: p.y * size.height })),
        arrow.style
      );
    }
    ctx.restore();

    // Stopa za pohybem: co se právě jede, je výrazné; dojeté dráhy zůstanou slabě vidět,
    // aby bylo na konci poznat, kudy celé cvičení vedlo.
    for (const trace of frame.traces) {
      if (trace.points.length < 2) continue;
      ctx.save();
      ctx.strokeStyle = trace.movesBall ? "#ffd54f" : "#ffffff";
      ctx.globalAlpha = trace.active ? 0.9 : 0.3;
      ctx.lineWidth = trace.active ? 4 : 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash(trace.movesBall ? [] : [6, 6]);
      ctx.beginPath();
      ctx.moveTo(trace.points[0].x * size.width, trace.points[0].y * size.height);
      for (const p of trace.points.slice(1)) ctx.lineTo(p.x * size.width, p.y * size.height);
      ctx.stroke();
      ctx.restore();
    }
  }, [diagram, size, frame.traces]);

  const aspect = diagram.background === DiagramBackground.HALF ? HALF_PITCH_ASPECT : FULL_PITCH_ASPECT;
  const hasAnimation = animation.totalMs > 0;
  const atEnd = timeMs >= animation.totalMs;

  // Hřiště se vejde do místa, které má – jinak by při poměru 0,62 na výšku telefonu přetékalo
  // dolů a trenér by na konec cvičení musel scrollovat zrovna ve chvíli, kdy běží.
  const upright = space ? fitBox(aspect, space.width, space.height) : null;
  // Na ležícím telefonu je výšky málo a šířky přebytek, takže hřiště na výšku vyjde jako úzký
  // proužek. Otočíme ho proto napříč displejem (hráči zůstanou stát na nohou) – je pak
  // několikanásobně větší. Na stojícím telefonu se neotáčí nikdy, tam by to jen mátlo.
  const turned = space ? fitBox(1 / aspect, space.width, space.height) : null;
  // Na celé obrazovce se hřiště roztáhne přes celý displej – žádné černé pruhy po stranách.
  // Poměr stran se tím trochu změní, ale pro animaci je důležitější velikost než přesný tvar
  // hřiště (středový kruh se kreslí z kratší strany, takže kruhem zůstane).
  const fullscreenRotated = Boolean(space && space.landscape !== aspect > 1);
  const rotated = fullscreen
    ? fullscreenRotated
    : Boolean(
        space?.landscape && upright && turned && turned.width * turned.height > upright.width * upright.height * TURN_GAIN
      );
  const box = fullscreen && space ? { width: space.width, height: space.height } : rotated ? turned : upright;
  const pitchWidth = box ? Math.round(rotated ? box.height : box.width) : null;
  const pitchHeight = box ? Math.round(rotated ? box.width : box.height) : null;
  // Lišta sedí na spodku toho, co je na displeji vidět – u otočeného hřiště je to jeho delší strana.
  const barWidth = box ? box.width : size.width;
  // Na úzkém hřišti se lišta uskromní: nejdřív odejdou rychlosti, pak i posuvník.
  // Tlačítko Přehrát a zvětšení zůstávají vždy.
  const showSpeeds = barWidth >= 320;
  const showSlider = barWidth >= 230;

  // Na celou obrazovku se hřiště nepřesouvá jinam do stromu – jen se přepnou styly. Kdyby se
  // překreslilo pod jiného rodiče, React by jeho uzly zahodil a animace by se restartovala.
  const player = (
    <div
      style={{
        position: fullscreen ? "fixed" : "relative",
        left: fullscreen ? "50%" : undefined,
        top: fullscreen ? "50%" : undefined,
        transform: fullscreen ? "translate(-50%, -50%)" : undefined,
        zIndex: fullscreen ? 2001 : undefined,
        width: box ? Math.round(box.width) : "100%",
        height: box ? Math.round(box.height) : undefined,
        aspectRatio: box ? undefined : String(aspect),
        margin: fullscreen ? undefined : "0 auto",
      }}
    >
      <div
        ref={setPitchEl}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: pitchWidth ?? "100%",
          height: pitchHeight ?? "100%",
          transform: `translate(-50%, -50%) rotate(${rotated ? 90 : 0}deg)`,
          background: "var(--pitch-green)",
          border: "1px solid white",
          overflow: "hidden",
        }}
      >
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />

        {diagram.elements.map((el) => {
          // Míč se vykresluje zvlášť (putuje po přihrávkách), ostatní prvky na svém místě
          // nebo tam, kam je dotáhla animace.
          if (el.type === DiagramElementType.BALL) return null;
          const moved = frame.elementPositions.get(el.id);
          const position = moved ?? { x: el.x, y: el.y };
          const isMoving = frame.movingElementIds.has(el.id);
          const isPlayer =
            el.type === DiagramElementType.PLAYER_RED ||
            el.type === DiagramElementType.PLAYER_BLACK ||
            el.type === DiagramElementType.GOALKEEPER;
          return (
            <div
              key={el.id}
              style={{
                position: "absolute",
                left: `${position.x * 100}%`,
                top: `${position.y * 100}%`,
                // Otočené hřiště se dorovná zpátky u každé figurky, ať hráči nestojí na hlavě.
                transform: `translate(-50%, -50%) rotate(${(el.rotation ?? 0) - (rotated ? 90 : 0)}deg) scale(${el.scale ?? 1})`,
                // Kdo se právě hýbe, dostane světlý kroužek – v pohybu se oko chytne kontrastu.
                borderRadius: "50%",
                boxShadow: isMoving ? "0 0 0 3px rgba(255,255,255,0.9), 0 0 12px rgba(0,0,0,0.5)" : undefined,
                filter: isPlayer ? "drop-shadow(0 2px 3px rgba(0,0,0,0.55))" : undefined,
              }}
            >
              <DiagramElementIcon type={el.type} color={el.color} size={isPlayer ? PLAYER_SIZE : 28} />
            </div>
          );
        })}

        {/* Míčů může být v nákresu víc – každý se kreslí tam, kam ho animace dovedla. */}
        {Array.from(frame.balls.entries()).map(([ballId, position]) => (
          <div
            key={ballId}
            style={{
              position: "absolute",
              left: `${position.x * 100}%`,
              top: `${position.y * 100}%`,
              transform: `translate(-50%, -50%) rotate(${rotated ? -90 : 0}deg)`,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.65))",
            }}
          >
            <DiagramElementIcon type={DiagramElementType.BALL} size={BALL_SIZE} />
          </div>
        ))}
      </div>

      {/* Ovládání leží přímo ve spodní části hřiště – na výšku telefonu je hřiště vysoké
          a lišta pod ním by byla až pod okrajem obrazovky, takže by se na přehrání muselo
          scrollovat. Poloprůhledný podklad, ať jsou čísla čitelná i nad zelenou. */}
      {hasAnimation && (
        <div
          style={{
            position: "absolute",
            // Na celé obrazovce sahá hřiště až do rohů displeje, takže lišta musí uhnout
            // výřezu a spodní čárce pro domů – jinak by se na iPhonu překrývaly.
            left: fullscreen ? "calc(8px + env(safe-area-inset-left, 0px))" : 8,
            right: fullscreen ? "calc(8px + env(safe-area-inset-right, 0px))" : 8,
            bottom: fullscreen ? "calc(8px + env(safe-area-inset-bottom, 0px))" : 8,
            display: "flex",
            alignItems: "center",
            gap: showSpeeds ? 10 : 6,
            padding: showSlider ? "8px 10px" : "8px 6px",
            borderRadius: 12,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(2px)",
          }}
        >
          <button
            className="btn"
            style={{
              width: "auto",
              padding: showSlider ? "8px 16px" : "8px 10px",
              flex: showSlider ? "0 0 auto" : "1 1 auto",
              minWidth: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            onClick={() => {
              if (atEnd) setTimeMs(0);
              setIsPlaying(!isPlaying);
            }}
          >
            {isPlaying ? t("beta.pause") : atEnd ? t("beta.replay") : t("beta.play")}
          </button>
          {showSlider && (
            <input
              type="range"
              min={0}
              max={Math.round(animation.totalMs)}
              value={Math.round(timeMs)}
              onChange={(e) => {
                setIsPlaying(false);
                setTimeMs(Number(e.target.value));
              }}
              style={{ flex: 1, minWidth: 40 }}
            />
          )}
          <div style={{ display: showSpeeds ? "flex" : "none", gap: 4, flexShrink: 0 }}>
            {SPEEDS.map((value) => (
              <button
                key={value}
                className={`chip ${value === speed ? "selected" : ""}`}
                style={{ padding: "4px 7px", fontSize: "0.7rem" }}
                onClick={() => setSpeed(value)}
              >
                {value}×
              </button>
            ))}
          </div>
          <button
            className="chip"
            style={{ padding: "4px 9px", fontSize: "0.85rem", flexShrink: 0 }}
            title={t(fullscreen ? "beta.minimize" : "beta.maximize")}
            aria-label={t(fullscreen ? "beta.minimize" : "beta.maximize")}
            onClick={() => setFullscreen(!fullscreen)}
          >
            {fullscreen ? "✕" : "⛶"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={style} ref={wrapperRef}>
      {fullscreen ? <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "#0b0b0b" }} /> : null}
      {player}

      {!hasAnimation && (
        <>
          <div className="spacer-8" />
          <p className="text-gray" style={{ fontSize: "0.8rem" }}>
            {t("beta.nothingToPlay")}
          </p>
        </>
      )}
    </div>
  );
}
