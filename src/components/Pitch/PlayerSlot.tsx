interface Props {
  label: string;
  name: string;
  onTap: () => void;
  readOnly?: boolean;
  style?: React.CSSProperties;
}

/** Jedna pozice na hřišti – kolečko s kódem pozice + jméno pod ním. Klik otevře výběr hráče. */
export function PlayerSlot({ label, name, onTap, readOnly = false, style }: Props) {
  return (
    <div
      className="player-slot"
      onClick={readOnly ? undefined : onTap}
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 64,
        cursor: readOnly ? "default" : "pointer",
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
      {name && (
        <div
          style={{
            marginTop: 2,
            width: "100%",
            color: "white",
            fontSize: 11,
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
      )}
    </div>
  );
}
