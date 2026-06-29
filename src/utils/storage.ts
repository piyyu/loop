/**
 * IndexedDB storage utility for downloaded songs
 */
import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "loop-music";
const DB_VERSION = 1;
const STORE_NAME = "audio-files";

interface AudioFile {
  key: string;
  data: ArrayBuffer;
  mimeType: string;
  songId: string;
  createdAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
          store.createIndex("songId", "songId", { unique: true });
          store.createIndex("createdAt", "createdAt");
        }
      },
    });
  }
  return dbPromise;
}

export async function saveAudioFile(
  songId: string,
  data: ArrayBuffer,
  mimeType: string = "audio/mp4"
): Promise<string> {
  const db = await getDB();
  const key = `audio-${songId}`;
  const file: AudioFile = {
    key,
    data,
    mimeType,
    songId,
    createdAt: Date.now(),
  };
  await db.put(STORE_NAME, file);
  return key;
}

export async function getAudioFile(
  songId: string
): Promise<{ data: ArrayBuffer; mimeType: string } | null> {
  const db = await getDB();
  const file = await db.getFromIndex(STORE_NAME, "songId", songId);
  if (!file) return null;
  return { data: file.data, mimeType: file.mimeType };
}

export async function deleteAudioFile(songId: string): Promise<void> {
  const db = await getDB();
  const file = await db.getFromIndex(STORE_NAME, "songId", songId);
  if (file) {
    await db.delete(STORE_NAME, file.key);
  }
}

export async function getStorageUsage(): Promise<number> {
  const db = await getDB();
  const allFiles = await db.getAll(STORE_NAME);
  return allFiles.reduce(
    (total: number, file: AudioFile) => total + file.data.byteLength,
    0
  );
}

export async function clearAllAudio(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

export function createBlobUrl(
  data: ArrayBuffer,
  mimeType: string
): string {
  const blob = new Blob([data], { type: mimeType });
  return URL.createObjectURL(blob);
}
