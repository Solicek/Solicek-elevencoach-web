import { useEffect, useState } from "react";
import { t } from "../../lib/i18n";

const DISMISSED_KEY = "install_hint_dismissed";

function isIosSafariNotStandalone(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const isIos = /iphone|ipad|ipod/i.test(nav.userAgent);
  const isStandalone = nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  return isIos && !isStandalone;
}

/**
 * iOS Safari nemá vlastní "Add to Home Screen" prompt (žádný beforeinstallprompt) – appka si
 * proto sama zobrazí nenápadnou nápovědu, dokud appka neběží v standalone režimu.
 */
export function InstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY) === "true") return;
    setVisible(isIosSafariNotStandalone());
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "max(12px, env(safe-area-inset-bottom))",
        background: "var(--surface-variant)",
        border: "1px solid var(--divider)",
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        zIndex: 200,
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <p style={{ flex: 1, fontSize: "0.85rem" }}>
        {t("install.hintBefore")}
        <strong>{t("install.shareLabel")}</strong>
        {t("install.hintBetween")}
        <strong>{t("install.addLabel")}</strong>.
      </p>
      <button
        className="btn-text"
        style={{ padding: 4 }}
        onClick={() => {
          localStorage.setItem(DISMISSED_KEY, "true");
          setVisible(false);
        }}
      >
        ×
      </button>
    </div>
  );
}
