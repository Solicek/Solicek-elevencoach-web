import type { ReactNode } from "react";

interface Props {
  title: string;
  onDismiss: () => void;
  children: ReactNode;
  actions: ReactNode;
}

/** Jednoduchý modální dialog – obdoba Compose AlertDialog. Klik na overlay dialog zavře. */
export function Dialog({ title, onDismiss, children, actions }: Props) {
  return (
    <div className="dialog-overlay" onClick={onDismiss}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
        <div className="dialog-actions">{actions}</div>
      </div>
    </div>
  );
}
