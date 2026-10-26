import { create } from "zustand";
import type { Edge, NodeChange, EdgeChange } from "@xyflow/react";
import { applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import type { CanvasNode, Project, JournalEvent } from "../types";
import { db, now, uid } from "./db";
import { demoProject } from "./demo";
type Frame = { nodes: CanvasNode[]; edges: Edge[] };
type State = {
  projects: Project[];
  currentId: string | null;
  loaded: boolean;
  saveState: "saved" | "saving" | "error";
  error: string;
  past: Frame[];
  future: Frame[];
  init: () => Promise<void>;
  open: (id: string | null) => void;
  addProject: (p: Project) => void;
  deleteProject: (id: string) => void;
  rename: (id: string, name: string) => void;
  mutate: (fn: (p: Project) => void, title?: string, record?: boolean) => void;
  checkpoint: () => void;
  undo: () => void;
  redo: () => void;
  nodesChanged: (changes: NodeChange<CanvasNode>[]) => void;
  edgesChanged: (changes: EdgeChange[]) => void;
  event: (title: string, text?: string, type?: JournalEvent["type"]) => void;
};
const frame = (p: Project): Frame =>
  structuredClone({ nodes: p.nodes, edges: p.edges });
export const useStore = create<State>((set, get) => ({
  projects: [],
  currentId: null,
  loaded: false,
  saveState: "saved",
  error: "",
  past: [],
  future: [],
  init: async () => {
    try {
      let projects = await db.projects.toArray();
      if (!projects.length && !(await db.settings.get("initialized"))) {
        const p = demoProject();
        await db.projects.put(p);
        await db.settings.put({ id: "initialized", value: true });
        projects = [p];
      }
      const last = await db.settings.get("lastProject");
      const currentId =
        last?.value === null
          ? null
          : typeof last?.value === "string" &&
              projects.some((p) => p.id === last.value)
            ? last.value
            : projects[0]?.id || null;
      set({ projects, currentId, loaded: true });
    } catch {
      set({
        loaded: true,
        error:
          "No se pudo abrir el almacenamiento local. Comprueba los permisos del navegador.",
        saveState: "error",
      });
    }
  },
  open: (id) => {
    set({ currentId: id, past: [], future: [] });
    void db.settings.put({ id: "lastProject", value: id }).catch(() => {});
  },
  addProject: (p) => {
    set((s) => ({
      projects: [p, ...s.projects],
      currentId: p.id,
      past: [],
      future: [],
    }));
    void db.settings.put({ id: "lastProject", value: p.id }).catch(() => {});
  },
  deleteProject: (id) => {
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      currentId: s.currentId === id ? null : s.currentId,
    }));
    void db.projects.delete(id);
  },
  rename: (id, name) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, name, modifiedAt: now() } : p,
      ),
    })),
  checkpoint: () => {
    const p = get().projects.find((p) => p.id === get().currentId);
    if (p) set((s) => ({ past: [...s.past.slice(-39), frame(p)], future: [] }));
  },
  mutate: (fn, title, record = true) => {
    const s = get();
    const p = s.projects.find((p) => p.id === s.currentId);
    if (!p) return;
    const copy = structuredClone(p);
    fn(copy);
    copy.modifiedAt = now();
    if (title)
      copy.events.push({
        id: uid(),
        at: now(),
        title,
        type: "automatic",
        milestone: false,
        nodeId:
          copy.nodes.find((n) => !p.nodes.some((old) => old.id === n.id))?.id ||
          copy.nodes.find((n) => n.selected)?.id,
      });
    set({
      projects: s.projects.map((x) => (x.id === copy.id ? copy : x)),
      ...(record ? { past: [...s.past.slice(-39), frame(p)], future: [] } : {}),
    });
  },
  undo: () => {
    const s = get(),
      p = s.projects.find((p) => p.id === s.currentId),
      last = s.past.at(-1);
    if (!p || !last) return;
    get().mutate(
      (p) => {
        p.nodes = last.nodes;
        p.edges = last.edges;
      },
      "Se recuperó un paso anterior",
      false,
    );
    set({ past: s.past.slice(0, -1), future: [...s.future, frame(p)] });
  },
  redo: () => {
    const s = get(),
      p = s.projects.find((p) => p.id === s.currentId),
      next = s.future.at(-1);
    if (!p || !next) return;
    get().mutate(
      (p) => {
        p.nodes = next.nodes;
        p.edges = next.edges;
      },
      "Se rehízo un paso",
      false,
    );
    set({ past: [...s.past, frame(p)], future: s.future.slice(0, -1) });
  },
  nodesChanged: (changes) =>
    get().mutate(
      (p) => {
        p.nodes = applyNodeChanges(changes, p.nodes);
        for (const c of changes) {
          if (c.type === "position" && c.position) {
            const n = p.nodes.find((n) => n.id === c.id);
            if (n) n.data.modifiedAt = now();
          }
        }
        for (const c of changes) {
          if (c.type === "dimensions" && c.dimensions && c.setAttributes) {
            const n = p.nodes.find((n) => n.id === c.id);
            if (n) {
              n.data.modifiedAt = now();
              n.style = {
                ...n.style,
                width: c.dimensions.width,
                height: c.dimensions.height,
              };
            }
          }
        }
      },
      undefined,
      false,
    ),
  edgesChanged: (changes) =>
    get().mutate(
      (p) => {
        p.edges = applyEdgeChanges(changes, p.edges);
      },
      undefined,
      false,
    ),
  event: (title, text, type = "automatic") =>
    get().mutate(
      (p) => {
        p.events.push({
          id: uid(),
          at: now(),
          title,
          text,
          type,
          milestone: false,
        });
      },
      undefined,
      false,
    ),
}));
let timer: ReturnType<typeof setTimeout>;
let writing: Promise<unknown> = Promise.resolve();
useStore.subscribe((s, prev) => {
  if (!s.loaded || s.projects === prev.projects) return;
  useStore.setState({ saveState: "saving" });
  clearTimeout(timer);
  timer = setTimeout(() => {
    const projects = structuredClone(useStore.getState().projects);
    writing = writing
      .catch(() => {})
      .then(async () => {
        await db.transaction("rw", db.projects, async () => {
          const ids = projects.map((p) => p.id);
          await db.projects.where("id").noneOf(ids).delete();
          await db.projects.bulkPut(projects);
        });
        useStore.setState({ saveState: "saved", error: "" });
      })
      .catch(() =>
        useStore.setState({
          saveState: "error",
          error:
            "No se pudo guardar. Exporta una copia JSON antes de cerrar. Puede que el almacenamiento esté lleno.",
        }),
      );
  }, 250);
});
export const activeProject = () => {
  const s = useStore.getState();
  return s.projects.find((p) => p.id === s.currentId);
};
