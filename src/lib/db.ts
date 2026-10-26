import Dexie, { type Table } from "dexie";
import type { Project, StoredFile } from "../types";
class Database extends Dexie {
  projects!: Table<Project, string>;
  files!: Table<StoredFile, string>;
  settings!: Table<{ id: string; value: boolean | string | null }, string>;
  constructor() {
    super("latente-laboratorio");
    this.version(1).stores({
      projects: "id,modifiedAt",
      files: "id",
      settings: "id",
    });
  }
}
export const db = new Database();
export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export async function storeFile(file: File | Blob, name = "dibujo.png") {
  const id = uid();
  await db.files.add({ id, name, mime: file.type, blob: file });
  return id;
}
export async function storageStatus() {
  if (!navigator.storage?.estimate) return;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  if (quota && usage / quota > 0.8)
    throw new Error(
      "Tu almacenamiento está casi lleno. Exporta tus proyectos como copia de seguridad.",
    );
}
