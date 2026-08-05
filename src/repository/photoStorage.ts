import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";

/** Nahraje fotku k záznamu archivu a vrátí veřejnou URL ke stažení. */
export async function uploadArchivePhoto(teamCode: string, entryId: string, file: File): Promise<string> {
  const extMatch = /\.[a-zA-Z0-9]+$/.exec(file.name);
  const ext = extMatch ? extMatch[0] : ".jpg";
  const path = `teams/${teamCode}/archive/${entryId}/${crypto.randomUUID()}${ext}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type || "image/jpeg" });
  return getDownloadURL(fileRef);
}

/** Smaže fotku ze Storage podle její download URL. */
export async function deleteArchivePhoto(url: string): Promise<void> {
  await deleteObject(ref(storage, url));
}
