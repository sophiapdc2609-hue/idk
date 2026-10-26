import { z } from "zod";
import { db, uid } from "./db";
import type { Project } from "../types";
export function download(blob: Blob, name: string) {
  const u = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
export function blobData(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
export async function exportProject(project: Project) {
  const ids = new Set(
    [...project.nodes, ...project.versions.flatMap((v) => v.nodes)].flatMap(
      (n) => (n.data.fileId ? [n.data.fileId] : []),
    ),
  );
  const files = [];
  for (const id of ids) {
    const f = await db.files.get(id);
    if (!f)
      throw new Error(
        "Falta un archivo importado. No se exportó una copia incompleta.",
      );
    files.push({
      id,
      name: f.name,
      mime: f.mime,
      data: await blobData(f.blob),
    });
  }
  download(
    new Blob(
      [
        JSON.stringify(
          { format: "latente", version: 1, project, files },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
    `${project.name}.latente.json`,
  );
}
const str = z.string().max(1000000);
const card = z.object({
  kind: z.enum([
    "note",
    "keyword",
    "image",
    "sketch",
    "drawing",
    "reference",
    "document",
    "material",
    "link",
    "zone",
  ]),
  title: str,
  text: str,
  universes: z.array(str),
  createdAt: str,
  modifiedAt: str,
  origin: z.enum(["personal", "local", "ai", "external"]),
  notes: str,
  source: str.optional(),
  author: str.optional(),
  location: str.optional(),
  fileId: str.optional(),
  image: str.optional(),
  mime: str.optional(),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
  archived: z.boolean().optional(),
  originId: str.optional(),
  groupId: str.optional(),
});
const nodeSchema = z.object({
  id: str,
  type: z.literal("card"),
  position: z.object({ x: z.number().finite(), y: z.number().finite() }),
  style: z
    .object({
      width: z.number().positive().max(10000),
      height: z.number().positive().max(10000),
    })
    .optional(),
  data: card,
});
const edgeSchema = z.object({
  id: str,
  source: str,
  target: str,
  sourceHandle: str.nullable().optional(),
  targetHandle: str.nullable().optional(),
  label: str.optional(),
  type: str.optional(),
  style: z.record(z.union([z.string(), z.number()])).optional(),
});
const version = z.object({
  id: str,
  at: str,
  name: str,
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});
const projectSchema = z.object({
  id: str,
  name: str,
  description: str,
  createdAt: str,
  modifiedAt: str,
  demo: z.boolean(),
  nodes: z.array(nodeSchema).max(5000),
  edges: z.array(edgeSchema).max(10000),
  universes: z.array(
    z.object({
      id: str,
      name: str,
      color: z.string().regex(/^#[0-9a-f]{6}$/i),
    }),
  ),
  events: z.array(
    z.object({
      id: str,
      at: str,
      title: str,
      text: str.optional(),
      type: z.enum(["automatic", "reflection", "version", "discard"]),
      milestone: z.boolean(),
      selected: z.boolean().optional(),
      nodeId: str.optional(),
      image: str.optional(),
    }),
  ),
  versions: z.array(version),
  viewport: z
    .object({ x: z.number(), y: z.number(), zoom: z.number() })
    .optional(),
});
const schema = z.object({
  format: z.literal("latente"),
  version: z.literal(1),
  project: projectSchema,
  files: z.array(
    z.object({
      id: str,
      name: str,
      mime: z.enum([
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        "application/pdf",
        "text/plain",
        "text/markdown",
      ]),
      data: z
        .string()
        .regex(
          /^data:(image\/(png|jpeg|webp|gif)|application\/pdf|text\/(plain|markdown));base64,/,
        ),
    }),
  ),
});
export async function importProject(file: File): Promise<Project> {
  if (file.size > 100 * 1024 * 1024)
    throw new Error("La copia supera 100 MB. Importa un proyecto más pequeño.");
  const result = schema.safeParse(JSON.parse(await file.text()));
  if (!result.success)
    throw new Error(
      "Este archivo no es una copia válida de LATENTE (versión 1).",
    );
  const { project, files } = result.data;
  const remap = new Map<string, string>();
  const decoded = [];
  for (const f of files) {
    const id = uid();
    remap.set(f.id, id);
    const res = await fetch(f.data);
    const blob = await res.blob();
    if (blob.size > 20 * 1024 * 1024 || blob.type !== f.mime)
      throw new Error(
        "La copia contiene un archivo no compatible o de más de 20 MB.",
      );
    decoded.push({ id, name: f.name, mime: f.mime, blob });
  }
  for (const n of [
    ...project.nodes,
    ...project.versions.flatMap((v) => v.nodes),
  ]) {
    if (n.data.fileId) {
      const id = remap.get(n.data.fileId);
      if (!id) throw new Error("La copia contiene un archivo ausente.");
      n.data.fileId = id;
    }
  }
  const nodeIds = new Set(project.nodes.map((n) => n.id));
  if (
    nodeIds.size !== project.nodes.length ||
    project.edges.some((e) => !nodeIds.has(e.source) || !nodeIds.has(e.target))
  )
    throw new Error("La copia tiene conexiones o identificadores inválidos.");
  await db.files.bulkPut(decoded);
  return {
    ...project,
    id: uid(),
    name: project.name + " · importado",
  } as Project;
}
export function safeUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value, location.origin);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
