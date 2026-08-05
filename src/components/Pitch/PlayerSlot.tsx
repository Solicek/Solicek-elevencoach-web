interface Props {
  label: string;
  name: string;
  onTap: () => void;
  style?: React.CSSProperties;
}

/** Jedna pozice na hřišti – kolečko s kódem pozice + jméno pod ním. Klik otevře výběr hráče. */
export function PlayerSlot({ label, name, onTap, style }: Props) {
  return (
    <div
      className="player-slot"
      onClick={onTap}
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 64,
        cursor: "pointer",
        ...style,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 700,
          color: "var(--pitch-green)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 2,
          width: "100%",
          background: "rgba(0,0,0,0.35)",
          color: name ? "white" : "rgba(255,255,255,0.6)",
          fontSize: 11,
          textAlign: "center",
          padding: "1px 2px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name || "jméno"}
      </div>
    </div>
  );
}
