import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Connection,
  type Edge,
  type OnNodeDrag,
  MarkerType,
} from "@xyflow/react";
import {
  Archive,
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  Compass,
  Copy,
  FileText,
  Frame,
  Group,
  Hand,
  ImagePlus,
  Link2,
  Maximize,
  Minus,
  MousePointer2,
  Palette,
  Pencil,
  Plus,
  Redo2,
  ScanLine,
  SlidersHorizontal,
  StickyNote,
  Trash2,
  Type,
  Undo2,
  Ungroup,
  X,
} from "lucide-react";
import { toPng } from "html-to-image";
import type { CanvasNode, Kind, Project, Suggestion } from "../types";
import { Card } from "./Card";
import { CardActions } from "../lib/cardActions";
import { Editor } from "./Editor";
import { Drawing } from "./Drawing";
import { Explore } from "./Explore";
import { Modal } from "./Modal";
import { node } from "../lib/demo";
import { now, storageStatus, storeFile, uid } from "../lib/db";
import { useStore } from "../lib/store";
import { useFile } from "../lib/hooks";
import { download } from "../lib/files";
const nodeTypes = { card: Card };
const toolItems: { kind: Kind; label: string; icon: typeof Plus }[] = [
  { kind: "image", label: "Imagen", icon: ImagePlus },
  { kind: "sketch", label: "Sketch importado", icon: ScanLine },
  { kind: "drawing", label: "Dibujo libre", icon: Pencil },
  { kind: "note", label: "Nota", icon: StickyNote },
  { kind: "keyword", label: "Palabra clave", icon: Type },
  { kind: "reference", label: "Referente", icon: Frame },
  { kind: "document", label: "Documento", icon: FileText },
  { kind: "material", label: "Material", icon: Palette },
  { kind: "link", label: "Enlace", icon: ArrowUpRight },
];
function Annotate({
  node,
  onSave,
  onClose,
}: {
  node: CanvasNode;
  onSave: (blob: Blob) => Promise<void>;
  onClose: () => void;
}) {
  const url = useFile(node.data.fileId, node.data.image);
  return <Drawing background={url} onSave={onSave} onClose={onClose} />;
}
export function Workspace({
  project,
  onMessage,
  pngRequest,
  focusId,
  onFocused,
}: {
  project: Project;
  onMessage: (m: string) => void;
  pngRequest: number;
  focusId?: string;
  onFocused: () => void;
}) {
  const flow = useReactFlow<CanvasNode>();
  const mutate = useStore((s) => s.mutate);
  const [universe, setUniverse] = useState("all");
  const [explore, setExplore] = useState(() => window.innerWidth >= 900);
  const [tool, setTool] = useState("select");
  const [edit, setEdit] = useState<CanvasNode>();
  const [draw, setDraw] = useState<string | true>();
  const [pending, setPending] = useState<Connection | Edge>();
  const [relation, setRelation] = useState("");
  const [addUniverse, setAddUniverse] = useState(false);
  const [universeName, setUniverseName] = useState("");
  const [universeColor, setUniverseColor] = useState("#9caa87");
  const [archived, setArchived] = useState(false);
  const [mobileUniverses, setMobileUniverses] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [uploadKind, setUploadKind] = useState<Kind>("image");
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const clipboard = useRef<CanvasNode[]>([]);
  const dragOrigin = useRef<{ x: number; y: number } | undefined>(undefined);
  const selected = project.nodes.filter((n) => n.selected && !n.data.archived);
  const point = () => {
    const rect = container.current?.getBoundingClientRect();
    const stagger = project.nodes.length % 4;
    return flow.screenToFlowPosition({
      x: (rect?.left || 0) + (rect?.width || 800) * 0.42 - 45 + stagger * 24,
      y: (rect?.top || 0) + (rect?.height || 600) * 0.36 + stagger * 28,
    });
  };
  const insert = (kind: Kind) => {
    if (["image", "sketch", "material", "document"].includes(kind)) {
      setUploadKind(kind);
      setTimeout(() => uploadRef.current?.click(), 0);
      return;
    }
    if (kind === "drawing") {
      setDraw(true);
      return;
    }
    const p = point();
    setEdit(
      node(
        kind,
        kind === "note"
          ? "Una idea por explorar"
          : kind === "keyword"
            ? "una intuición"
            : kind === "reference"
              ? "Un nuevo referente"
              : "Un enlace por explorar",
        "",
        p.x,
        p.y,
      ),
    );
  };
  const duplicate = useCallback(
    (list: CanvasNode[]) => {
      if (!list.length) return;
      const copies = list.map((n) => ({
        ...structuredClone(n),
        id: uid(),
        position: { x: n.position.x + 35, y: n.position.y + 35 },
        selected: true,
        data: {
          ...n.data,
          createdAt: now(),
          modifiedAt: now(),
          groupId: undefined,
        },
      }));
      mutate((p) => {
        p.nodes.forEach((n) => (n.selected = false));
        p.nodes.push(...copies);
      }, "Se duplicaron fragmentos");
    },
    [mutate],
  );
  const remove = useCallback(() => {
    const state = useStore.getState(),
      p = state.projects.find((p) => p.id === state.currentId);
    if (!p) return;
    const ids = new Set(p.nodes.filter((n) => n.selected).map((n) => n.id));
    const edgeIds = new Set(p.edges.filter((e) => e.selected).map((e) => e.id));
    if (!ids.size && !edgeIds.size) return;
    if (
      !confirm(
        `¿Eliminar ${ids.size} fragmentos y las conexiones seleccionadas? Puedes deshacer esta acción.`,
      )
    )
      return;
    mutate((p) => {
      p.nodes = p.nodes.filter((n) => !ids.has(n.id));
      p.nodes.forEach((n) => {
        if (n.data.groupId && ids.has(n.data.groupId))
          n.data.groupId = undefined;
      });
      p.edges = p.edges.filter(
        (e) => !ids.has(e.source) && !ids.has(e.target) && !edgeIds.has(e.id),
      );
    }, "Se eliminaron fragmentos del lienzo");
  }, [mutate]);
  const importFiles = async (
    files: FileList | File[],
    kind: Kind,
    at = point(),
  ) => {
    const pendingFiles = Array.from(files);
    setUploading(true);
    try {
      await storageStatus();
      let i = 0;
      for (const file of pendingFiles) {
        if (file.size > 20 * 1024 * 1024)
          throw new Error(
            "Cada archivo puede ocupar hasta 20 MB. Reduce su tamaño e inténtalo de nuevo.",
          );
        const isImage = file.type.startsWith("image/");
        if (
          !isImage &&
          !["application/pdf", "text/plain", "text/markdown"].includes(
            file.type,
          )
        )
          throw new Error("Usa una imagen, PDF o archivo de texto.");
        if (file.type === "image/svg+xml")
          throw new Error(
            "Para importar imágenes usa PNG, JPG, WebP o GIF. Exporta tu SVG como PNG.",
          );
        const fileId = await storeFile(file, file.name);
        const n = node(
          isImage ? (kind === "document" ? "image" : kind) : "document",
          file.name,
          "",
          at.x + i * 35,
          at.y + i * 35,
          {
            fileId,
            mime: file.type,
            source: "Archivo aportado por el usuario",
            origin: "personal",
          },
        );
        if (isImage) n.style = { width: 300, height: 330 };
        mutate((p) => p.nodes.push(n), `Se añadió ${file.name}`);
        i++;
      }
      onMessage("Archivos incorporados. Se conservarán al recargar.");
    } catch (e) {
      onMessage(
        e instanceof Error ? e.message : "No se pudo importar el archivo.",
      );
    } finally {
      setUploading(false);
    }
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input,textarea,select,[contenteditable],dialog"))
        return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) useStore.getState().redo();
        else useStore.getState().undo();
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        useStore.getState().redo();
      }
      if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        mutate(
          (p) => p.nodes.forEach((n) => (n.selected = !n.data.archived)),
          undefined,
          false,
        );
      }
      if (mod && e.key.toLowerCase() === "c") {
        e.preventDefault();
        clipboard.current = structuredClone(
          useStore
            .getState()
            .projects.find((p) => p.id === project.id)
            ?.nodes.filter((n) => n.selected) || [],
        );
        onMessage("Fragmentos copiados.");
      }
      if (mod && e.key.toLowerCase() === "v") {
        e.preventDefault();
        duplicate(clipboard.current);
      }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicate(
          useStore
            .getState()
            .projects.find((p) => p.id === project.id)
            ?.nodes.filter((n) => n.selected) || [],
        );
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        remove();
      }
      if (e.key === "Escape") {
        setExplore(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [project.id, mutate, duplicate, remove, onMessage]);
  useEffect(() => {
    if (focusId) {
      const n = project.nodes.find((n) => n.id === focusId);
      if (n) {
        setUniverse("all");
        mutate(
          (p) => {
            const n = p.nodes.find((n) => n.id === focusId);
            if (n) n.data.archived = false;
          },
          undefined,
          false,
        );
        setTimeout(
          () =>
            flow.fitView({
              nodes: [{ id: focusId }],
              duration: 500,
              maxZoom: 1,
            }),
          80,
        );
      }
      onFocused();
    }
  }, [focusId]);
  useEffect(() => {
    if (!pngRequest) return;
    const exportPng = async () => {
      try {
        const visible = flow.getNodes().filter((n) => !n.hidden);
        if (!visible.length)
          throw new Error("Añade un fragmento antes de exportar el lienzo.");
        const viewport = document.querySelector(
          ".react-flow__viewport",
        ) as HTMLElement;
        if (!viewport) throw new Error("No se encontró el lienzo.");
        const b = flow.getNodesBounds(visible);
        const padding = 80;
        const width = Math.ceil(b.width + padding * 2),
          height = Math.ceil(b.height + padding * 2);
        if (width * height > 24_000_000)
          throw new Error(
            "El lienzo es demasiado grande. Exporta un universo por separado o usa JSON.",
          );
        const url = await toPng(viewport, {
          backgroundColor: "#f5f3ec",
          width,
          height,
          pixelRatio: 1.5,
          style: {
            width: `${width}px`,
            height: `${height}px`,
            transform: `translate(${-b.x + padding}px, ${-b.y + padding}px) scale(1)`,
          },
          filter: (el) =>
            !(
              el instanceof HTMLElement &&
              el.classList.contains("react-flow__handle")
            ),
        });
        const response = await fetch(url);
        download(await response.blob(), project.name + ".png");
        onMessage("Lienzo exportado como PNG.");
      } catch (e) {
        onMessage(
          e instanceof Error ? e.message : "No se pudo exportar la imagen.",
        );
      }
    };
    void exportPng();
  }, [pngRequest]);
  const saveSuggestion = (s: Suggestion, relate = false) => {
    const pos = point();
    const n = node(
      s.category === "reference" || s.category === "theory"
        ? "reference"
        : "note",
      s.title,
      s.text,
      pos.x,
      pos.y,
      {
        origin: s.mode,
        source: s.source,
        author: s.author,
        originId: selected[0]?.id,
        universes: selected[0]?.data.universes || [],
        notes: s.limitation,
      },
    );
    mutate(
      (p) => {
        p.nodes.push(n);
        if (relate && selected[0])
          p.edges.push({
            id: uid(),
            source: selected[0].id,
            target: n.id,
            label: "Hallazgo para investigar",
            type: "smoothstep",
          });
      },
      `Se guardó un hallazgo de ${s.mode === "local" ? "exploración local" : "IA"}: ${s.title}`,
    );
    onMessage("Hallazgo guardado con su procedencia.");
  };
  const group = () => {
    if (selected.length < 2) return;
    const x = Math.min(...selected.map((n) => n.position.x)) - 30,
      y = Math.min(...selected.map((n) => n.position.y)) - 65;
    const right =
        Math.max(
          ...selected.map((n) => n.position.x + Number(n.style?.width || 280)),
        ) + 30,
      bottom =
        Math.max(
          ...selected.map((n) => n.position.y + Number(n.style?.height || 220)),
        ) + 30;
    const zone = node("zone", "Hilo de investigación", "", x, y);
    zone.style = { width: right - x, height: bottom - y };
    zone.zIndex = -1;
    mutate((p) => {
      p.nodes
        .filter((n) => selected.some((s) => s.id === n.id))
        .forEach((n) => {
          n.data.groupId = zone.id;
          n.selected = false;
        });
      p.nodes.unshift(zone);
    }, "Se creó un hilo de investigación");
  };
  const onDragStart: OnNodeDrag<CanvasNode> = (_, n) => {
    useStore.getState().checkpoint();
    dragOrigin.current = { ...n.position };
  };
  const onDragStop: OnNodeDrag<CanvasNode> = (_, n) => {
    if (n.data.kind === "zone" && dragOrigin.current) {
      const dx = n.position.x - dragOrigin.current.x,
        dy = n.position.y - dragOrigin.current.y;
      mutate(
        (p) =>
          p.nodes.forEach((child) => {
            if (child.data.groupId === n.id && !child.selected) {
              child.position.x += dx;
              child.position.y += dy;
            }
          }),
        undefined,
        false,
      );
    }
    useStore.getState().event("Se reorganizó el lienzo");
  };
  const displayed = project.nodes.map((n) => ({
    ...n,
    hidden:
      !!n.data.archived ||
      (universe !== "all" && !n.data.universes.includes(universe)),
    ...(n.data.kind === "zone" ? { zIndex: -1 } : {}),
  }));
  const edges = project.edges.map((e) => ({
    ...e,
    hidden: displayed.some(
      (n) => n.hidden && (n.id === e.source || n.id === e.target),
    ),
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
    style: { stroke: "#a8947d", strokeWidth: 1.3, ...e.style },
  }));
  return (
    <div className={`workspace ${explore ? "with-explore" : ""}`}>
      <aside
        className={`universe-sidebar ${mobileUniverses ? "mobile-open" : ""}`}
      >
        <div className="sidebar-top">
          <span className="eyebrow">TU EXPLORACIÓN</span>
          <button
            className="icon-button mobile-close"
            onClick={() => setMobileUniverses(false)}
            aria-label="Cerrar universos"
          >
            <X size={18} />
          </button>
          <h2>
            Muchas formas
            <br />
            de mirar.
          </h2>
        </div>
        <button
          className={`universe-overview ${universe === "all" ? "active" : ""}`}
          onClick={() => {
            setUniverse("all");
            setMobileUniverses(false);
          }}
        >
          <span className="overview-icon">⊞</span> Vista general
          <span>
            {
              project.nodes.filter(
                (n) => !n.data.archived && n.data.kind !== "zone",
              ).length
            }
          </span>
        </button>
        <div className="universes-heading">
          <span>UNIVERSOS</span>
          <span>↙</span>
        </div>
        <nav aria-label="Universos de exploración">
          {project.universes.map((u, i) => (
            <button
              key={u.id}
              className={`universe-item ${universe === u.id ? "active" : ""}`}
              onClick={() => {
                setUniverse(universe === u.id ? "all" : u.id);
                setMobileUniverses(false);
              }}
            >
              <span className="universe-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <i style={{ background: u.color }} />
              <span>{u.name}</span>
            </button>
          ))}
        </nav>
        <button
          className="new-universe"
          onClick={() => {
            setAddUniverse(true);
            setUniverseName("");
          }}
        >
          <Plus size={13} /> Crear universo
        </button>
        <div className="sidebar-bottom">
          <button className="text-link" onClick={() => setArchived(!archived)}>
            <Archive size={14} /> Caminos en pausa{" "}
            <span>{project.nodes.filter((n) => n.data.archived).length}</span>
          </button>
          <div className="sidebar-quote">
            “La imaginación
            <br />
            empieza por
            <br />
            <em>prestar atención.</em>”<span>UN ESPACIO PARA LO POSIBLE</span>
          </div>
          <span className="local-storage">
            <i /> Guardado en este navegador
          </span>
        </div>
      </aside>
      <div
        className="canvas-area"
        ref={container}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          void importFiles(
            e.dataTransfer.files,
            "image",
            flow.screenToFlowPosition({ x: e.clientX, y: e.clientY }),
          );
        }}
      >
        <div className="canvas-heading">
          <div>
            <div className="canvas-eyebrow">
              <span className="short-rule" />
              {project.demo
                ? "ESTUDIO 01 / PROYECTO DE EJEMPLO"
                : "UN ESPACIO ABIERTO / INVESTIGACIÓN PERSONAL"}
            </div>
            <h1>
              {project.demo ? (
                <>
                  Exploración de <em>atmósferas.</em>
                </>
              ) : (
                project.name
              )}
            </h1>
            <p>
              {project.demo
                ? "Luz, materia y pequeñas formas de habitar."
                : "Reúne, relaciona y deja que las ideas tomen su lugar."}
            </p>
          </div>
          <button
            className="mobile-universe-toggle secondary"
            onClick={() => setMobileUniverses(!mobileUniverses)}
          >
            <SlidersHorizontal size={16} /> Universos
          </button>
        </div>
        <CardActions.Provider
          value={{
            edit: (id) => setEdit(project.nodes.find((n) => n.id === id)),
            draw: (id) => setDraw(id),
          }}
        >
          <ReactFlow
            nodes={displayed}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={useStore.getState().nodesChanged}
            onEdgesChange={useStore.getState().edgesChanged}
            onNodeDragStart={onDragStart}
            onNodeDragStop={onDragStop}
            onConnect={(c) => {
              setPending(c);
              setRelation("");
            }}
            onEdgeDoubleClick={(_, e) => {
              setPending(e);
              setRelation(typeof e.label === "string" ? e.label : "");
            }}
            onNodeDoubleClick={(_, n) => setEdit(n)}
            defaultViewport={project.viewport || { x: 35, y: 155, zoom: 0.7 }}
            onInit={(instance) => {
              setZoom(Math.round(instance.getZoom() * 100));
              if (project.nodes.length && !project.viewport)
                setTimeout(
                  () => instance.fitView({ padding: 0.18, maxZoom: 0.85 }),
                  100,
                );
            }}
            onMove={(_, v) => setZoom(Math.round(v.zoom * 100))}
            onMoveEnd={(_, v) =>
              mutate(
                (p) => {
                  p.viewport = v;
                },
                undefined,
                false,
              )
            }
            minZoom={0.15}
            maxZoom={2.5}
            deleteKeyCode={null}
            panOnDrag={tool === "pan" ? [0, 1, 2] : [1, 2]}
            selectionOnDrag={tool === "select"}
            selectionKeyCode="Shift"
            multiSelectionKeyCode="Shift"
            proOptions={{ hideAttribution: true }}
            fitView={false}
            onlyRenderVisibleElements={false}
          >
            <Background
              variant={BackgroundVariant.Dots}
              color="#c8c5ba"
              gap={22}
              size={0.8}
            />
          </ReactFlow>
        </CardActions.Provider>

        <div className="canvas-toolbar" aria-label="Herramientas del lienzo">
          <button
            className={tool === "select" ? "active" : ""}
            title="Seleccionar · Shift para selección múltiple"
            aria-label="Seleccionar"
            onClick={() => setTool("select")}
          >
            <MousePointer2 size={19} />
          </button>
          <button
            className={tool === "pan" ? "active" : ""}
            title="Desplazar lienzo"
            aria-label="Desplazar lienzo"
            onClick={() => setTool("pan")}
          >
            <Hand size={19} />
          </button>
          <span className="toolbar-separator" />
          {toolItems.map(({ kind, label, icon: Icon }) => (
            <button
              title={label}
              aria-label={label}
              key={kind}
              onClick={() => insert(kind)}
            >
              <Icon size={19} />
            </button>
          ))}
          <span className="toolbar-separator" />
          <button
            aria-label="Conectar elementos"
            title="Conectar dos elementos seleccionados o arrastrar entre sus puntos laterales"
            onClick={() => {
              if (selected.length === 2) {
                setPending({
                  source: selected[0].id,
                  target: selected[1].id,
                  sourceHandle: null,
                  targetHandle: null,
                });
                setRelation("");
              } else
                onMessage(
                  "Selecciona dos fragmentos con Shift, o arrastra desde el punto lateral de uno hasta otro.",
                );
            }}
          >
            <Link2 size={19} />
          </button>
        </div>
        {project.nodes.filter((n) => !n.data.archived).length === 0 && (
          <div className="canvas-empty">
            <span>EL COMIENZO DE ALGO</span>
            <h2>¿Qué tienes en mente?</h2>
            <p>
              Una palabra, una imagen, una pregunta.
              <br />
              Empieza por donde quieras.
            </p>
            <button className="text-link" onClick={() => insert("note")}>
              <Plus size={16} /> Mi primera nota
            </button>
          </div>
        )}
        {selected.length > 0 && (
          <div className="selection-toolbar">
            <span>
              {selected.length}{" "}
              {selected.length === 1 ? "fragmento" : "fragmentos"}
            </span>
            <button
              aria-label="Explorar esta idea"
              title="Explorar esta idea"
              onClick={() => setExplore(true)}
            >
              <Compass size={15} />
              <span>Explorar</span>
            </button>
            <button
              title="Editar selección"
              onClick={() => setEdit(selected[0])}
            >
              <Pencil size={15} />
            </button>
            <button
              title="Duplicar selección"
              onClick={() => duplicate(selected)}
            >
              <Copy size={15} />
            </button>
            {selected.length > 1 && (
              <button title="Agrupar en un hilo" onClick={group}>
                <Group size={16} />
              </button>
            )}
            {selected.some((n) => n.data.groupId || n.data.kind === "zone") && (
              <button
                title="Desagrupar"
                onClick={() =>
                  mutate((p) => {
                    const ids = new Set(
                      selected.flatMap((n) =>
                        n.data.kind === "zone"
                          ? [n.id]
                          : n.data.groupId
                            ? [n.data.groupId]
                            : [],
                      ),
                    );
                    p.nodes = p.nodes.filter((n) => !ids.has(n.id));
                    p.nodes.forEach((n) => {
                      if (n.data.groupId && ids.has(n.data.groupId))
                        n.data.groupId = undefined;
                    });
                  }, "Se desagrupó un hilo de investigación")
                }
              >
                <Ungroup size={16} />
              </button>
            )}
            <button
              title="Conservar como camino en pausa"
              onClick={() =>
                mutate(
                  (p) =>
                    p.nodes.forEach((n) => {
                      if (n.selected) {
                        n.data.archived = true;
                        n.selected = false;
                      }
                    }),
                  "Se guardó un camino en pausa",
                )
              }
            >
              <Archive size={15} />
            </button>
            <button title="Eliminar selección" onClick={remove}>
              <Trash2 size={15} />
            </button>
          </div>
        )}
        <div className="canvas-bottom">
          <div className="canvas-caption">
            <span className="cross-mark">+</span>
            <span>
              {universe === "all"
                ? "EL LIENZO ES TUYO. EL CAMINO TAMBIÉN."
                : project.universes
                    .find((u) => u.id === universe)
                    ?.name.toUpperCase()}
            </span>
          </div>
          <div className="canvas-navigation">
            <button
              title="Deshacer (Ctrl/Cmd Z)"
              aria-label="Deshacer"
              onClick={() => useStore.getState().undo()}
              disabled={!useStore((s) => s.past.length)}
            >
              <Undo2 size={16} />
            </button>
            <button
              title="Rehacer (Ctrl/Cmd Shift Z)"
              aria-label="Rehacer"
              onClick={() => useStore.getState().redo()}
              disabled={!useStore((s) => s.future.length)}
            >
              <Redo2 size={16} />
            </button>
            <span />
            <button
              title="Alejar"
              aria-label="Alejar"
              onClick={() => flow.zoomOut({ duration: 200 })}
            >
              <Minus size={16} />
            </button>
            <button
              className="zoom-value"
              title="Restablecer zoom"
              onClick={() => flow.zoomTo(1, { duration: 300 })}
            >
              {zoom}%
            </button>
            <button
              title="Acercar"
              aria-label="Acercar"
              onClick={() => flow.zoomIn({ duration: 200 })}
            >
              <Plus size={16} />
            </button>
            <span />
            <button
              title="Ver todo el lienzo"
              aria-label="Ver todo el lienzo"
              onClick={() => flow.fitView({ padding: 0.15, duration: 400 })}
            >
              <Maximize size={16} />
            </button>
          </div>
        </div>
        {!explore && (
          <button
            className="explore-reopen secondary"
            onClick={() => setExplore(true)}
          >
            <Compass size={16} /> Explorar <ArrowUpRight size={15} />
          </button>
        )}
        {uploading && (
          <div className="canvas-loading" role="status">
            Incorporando archivos…
          </div>
        )}
        <input
          type="file"
          className="sr-only"
          ref={uploadRef}
          aria-label="Importar archivo al lienzo"
          multiple
          accept={
            uploadKind === "document"
              ? ".pdf,.txt,.md,image/*"
              : "image/png,image/jpeg,image/webp,image/gif"
          }
          onChange={(e) => {
            if (e.target.files) void importFiles(e.target.files, uploadKind);
            e.target.value = "";
          }}
        />
      </div>
      {explore && (
        <Explore
          key={project.id + "-" + selected.map((n) => n.id).join("-")}
          selection={selected}
          allNodes={project.nodes.filter((n) => !n.data.archived)}
          onClose={() => setExplore(false)}
          onSave={(s) => saveSuggestion(s)}
          onRelate={(s) => saveSuggestion(s, true)}
          onDiscard={(s) =>
            useStore
              .getState()
              .event("Sugerencia descartada", s.title, "discard")
          }
        />
      )}
      {edit && (
        <Editor
          node={edit}
          universes={project.universes}
          onClose={() => setEdit(undefined)}
          onDraw={() => {
            setDraw(edit.id);
            setEdit(undefined);
          }}
          onOrigin={() => {
            const origin = project.nodes.find(
              (n) => n.id === edit.data.originId,
            );
            if (origin) {
              setUniverse("all");
              flow.fitView({ nodes: [origin], duration: 500, maxZoom: 1 });
              setEdit(undefined);
            } else onMessage("El fragmento de origen ya no está en el lienzo.");
          }}
          onSave={(data) => {
            mutate(
              (p) => {
                const current = p.nodes.find((n) => n.id === edit.id);
                if (current) current.data = data;
                else p.nodes.push({ ...edit, data });
              },
              `Se ${project.nodes.some((n) => n.id === edit.id) ? "editó" : "añadió"} «${data.title}»`,
            );
            setEdit(undefined);
          }}
        />
      )}
      {draw === true && (
        <Drawing
          onClose={() => setDraw(undefined)}
          onSave={async (blob) => {
            const fileId = await storeFile(blob),
              pos = point();
            const n = node(
              "drawing",
              "Un pensamiento a mano",
              "",
              pos.x,
              pos.y,
              { fileId, mime: "image/png" },
            );
            n.style = { width: 360, height: 310 };
            mutate((p) => p.nodes.push(n), "Se añadió un dibujo propio");
            setDraw(undefined);
          }}
        />
      )}
      {typeof draw === "string" && project.nodes.find((n) => n.id === draw) && (
        <Annotate
          node={project.nodes.find((n) => n.id === draw)!}
          onClose={() => setDraw(undefined)}
          onSave={async (blob) => {
            const fileId = await storeFile(blob);
            mutate((p) => {
              const n = p.nodes.find((n) => n.id === draw)!;
              n.data.fileId = fileId;
              n.data.modifiedAt = now();
              n.data.notes =
                n.data.notes || "Anotación personal sobre la imagen.";
            }, "Se anotó una imagen");
            setDraw(undefined);
          }}
        />
      )}
      {pending && (
        <Modal
          title="¿Qué une estas ideas?"
          onClose={() => setPending(undefined)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutate((p) => {
                if ("id" in pending) {
                  const edge = p.edges.find((e) => e.id === pending.id);
                  if (edge) edge.label = relation;
                } else
                  p.edges.push({
                    ...pending,
                    id: uid(),
                    type: "smoothstep",
                    label: relation,
                  });
              }, "Se guardó una conexión: " + relation);
              setPending(undefined);
            }}
          >
            <p className="muted">
              La relación la defines tú. Escribe qué observas entre estos
              fragmentos.
            </p>
            <label>
              Significado de la conexión
              <input
                autoFocus
                required
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                placeholder="Esta luz expresa la intimidad que busco…"
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setPending(undefined)}
              >
                Cancelar
              </button>
              <button className="primary">Guardar conexión ↗</button>
            </div>
          </form>
        </Modal>
      )}
      {addUniverse && (
        <Modal
          title="Otra forma de mirar"
          onClose={() => setAddUniverse(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const id = uid();
              mutate(
                (p) =>
                  p.universes.push({
                    id,
                    name: universeName.trim(),
                    color: universeColor,
                  }),
                "Se creó un universo personal",
              );
              setAddUniverse(false);
            }}
          >
            <label>
              Nombre del universo
              <input
                autoFocus
                required
                value={universeName}
                onChange={(e) => setUniverseName(e.target.value)}
              />
            </label>
            <label className="inline-label">
              Color
              <input
                type="color"
                value={universeColor}
                onChange={(e) => setUniverseColor(e.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button className="primary">Crear universo ↗</button>
            </div>
          </form>
        </Modal>
      )}
      {archived && (
        <Modal title="Caminos en pausa" onClose={() => setArchived(false)}>
          <p className="muted">
            Una idea puede esperar sin perder su lugar ni su procedencia.
          </p>
          {project.nodes.filter((n) => n.data.archived).length === 0 ? (
            <p>Todavía no hay caminos en pausa.</p>
          ) : (
            project.nodes
              .filter((n) => n.data.archived)
              .map((n) => (
                <div className="archived-item" key={n.id}>
                  <span>{n.data.title}</span>
                  <button
                    className="text-link"
                    onClick={() =>
                      mutate((p) => {
                        const current = p.nodes.find((x) => x.id === n.id)!;
                        current.data.archived = false;
                      }, "Se retomó un camino en pausa")
                    }
                  >
                    Retomar <ArrowUpRight size={14} />
                  </button>
                </div>
              ))
          )}
        </Modal>
      )}
    </div>
  );
}
