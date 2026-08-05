import { useRef, useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { uploadArchivePhoto, deleteArchivePhoto } from "../../repository/photoStorage";
import type { ArchivedLineup } from "../../types";

interface Props {
  teamCode: string;
  entry: ArchivedLineup;
  onUpdateEntry: (entry: ArchivedLineup) => void;
}

export function PhotoGallery({ teamCode, entry, onUpdateEntry }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChosen(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadArchivePhoto(teamCode, entry.id, file);
      onUpdateEntry({ ...entry, photoPaths: [...entry.photoPaths, url] });
    } catch {
      setError("Nahrání fotky se nezdařilo. Zkus to prosím znovu.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(url: string) {
    setViewerUrl(null);
    onUpdateEntry({ ...entry, photoPaths: entry.photoPaths.filter((p) => p !== url) });
    try {
      await deleteArchivePhoto(url);
    } catch {
      // Firestore odkaz je už odebraný i kdyby se smazání souboru ve Storage nezdařilo.
    }
  }

  return (
    <div>
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        Fotky
      </p>
      <div className="spacer-8" />
      {error && (
        <p className="text-error" style={{ fontSize: "0.8rem" }}>
          {error}
        </p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {entry.photoPaths.map((url) => (
          <div
            key={url}
            onClick={() => setViewerUrl(url)}
            style={{
              aspectRatio: "1",
              borderRadius: 8,
              overflow: "hidden",
              cursor: "pointer",
              background: "var(--surface-variant)",
            }}
          >
            <img src={url} alt="Fotka poznámek" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
        <label
          style={{
            aspectRatio: "1",
            borderRadius: 8,
            border: "1px dashed var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: uploading ? "default" : "pointer",
            color: "var(--text-secondary)",
            fontSize: "0.8rem",
            textAlign: "center",
          }}
        >
          {uploading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : "+ Foto"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            disabled={uploading}
            style={{ display: "none" }}
            onChange={(e) => handleFileChosen(e.target.files?.[0])}
          />
        </label>
      </div>

      {viewerUrl && (
        <Dialog
          title="Fotka"
          onDismiss={() => setViewerUrl(null)}
          actions={
            <>
              <button className="btn-text" onClick={() => setViewerUrl(null)}>
                Zavřít
              </button>
              <button className="btn-text danger" onClick={() => handleDelete(viewerUrl)}>
                Smazat
              </button>
            </>
          }
        >
          <img src={viewerUrl} alt="Fotka poznámek" style={{ width: "100%", borderRadius: 8 }} />
        </Dialog>
      )}
    </div>
  );
}
