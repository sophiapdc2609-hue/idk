import { CardActions } from "../lib/cardActions";
import { useContext } from "react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";
import { ArrowUpRight, FileText, PenLine, Quote } from "lucide-react";
import type { CanvasNode } from "../types";
import { useFile } from "../lib/hooks";
import { useStore } from "../lib/store";
import { FormattedText } from "./FormattedText";
import { safeUrl } from "../lib/files";
const labels = {
  note: "INTENCIÓN",
  keyword: "PALABRA SEMILLA",
  image: "ESTUDIO VISUAL",
  sketch: "BOCETO",
  drawing: "DIBUJO PROPIO",
  reference: "REFERENTE / LECTURA",
  document: "ARCHIVO",
  material: "MATERIALIDAD",
  link: "ENLACE",
  zone: "HILO DE INVESTIGACIÓN",
};
export function Card({ id, data, selected }: NodeProps<CanvasNode>) {
  const { edit, draw } = useContext(CardActions);
  const url = useFile(data.fileId, data.image);
  const project = useStore((s) => s.projects.find((p) => p.id === s.currentId));
  const visual = ["image", "material", "sketch", "drawing"].includes(data.kind);
  const href = safeUrl(data.source);
  return (
    <article
      className={`canvas-card kind-${data.kind} ${selected ? "is-selected" : ""}`}
      style={{
        background: data.kind === "note" ? data.color || "#f0ead8" : undefined,
      }}
      onDoubleClick={() => edit(id)}
      aria-label={`${data.title}, ${labels[data.kind]}`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={150}
        minHeight={80}
        onResizeStart={() => useStore.getState().checkpoint()}
        onResizeEnd={() =>
          useStore.getState().event("Se redimensionó un elemento")
        }
      />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <Handle id="top" type="target" position={Position.Top} />
      <Handle id="bottom" type="source" position={Position.Bottom} />
      {visual && url ? (
        <div className="card-image">
          <img src={url} alt={data.title} draggable={false} />
          <button
            className="image-annotate nodrag"
            title="Dibujar una anotación"
            onClick={() => draw(id)}
          >
            <PenLine size={14} /> Anotar
          </button>
        </div>
      ) : null}
      {data.kind === "keyword" ? (
        <div className="keyword-text">
          {data.title}
          <span>
            <ArrowUpRight size={17} />
          </span>
        </div>
      ) : (
        <div className="card-body">
          <div className="card-overline">
            <span>{labels[data.kind]}</span>
            {data.kind === "reference" ? (
              <Quote size={16} />
            ) : (
              <ArrowUpRight size={14} />
            )}
          </div>
          <h3>{data.title}</h3>
          {!visual && (
            <p>
              <FormattedText text={data.text} />
            </p>
          )}
          {visual && data.notes && (
            <p className="personal-note">{data.notes}</p>
          )}
          {data.kind === "document" && url && (
            <a
              className="text-link nodrag"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              <FileText size={14} /> Abrir documento
            </a>
          )}
          {href && ["reference", "link"].includes(data.kind) && (
            <a
              className="text-link nodrag"
              href={href}
              target="_blank"
              rel="noreferrer"
            >
              Consultar fuente <ArrowUpRight size={13} />
            </a>
          )}
          <div className="card-tags">
            {data.universes.slice(0, 3).map((id) => {
              const u = project?.universes.find((u) => u.id === id);
              return u ? (
                <span key={id}>
                  <i style={{ background: u.color }} />
                  {u.name.split(" y ")[0]}
                </span>
              ) : null;
            })}
          </div>
          {data.origin !== "personal" && (
            <span className="provenance">
              {data.origin === "local"
                ? "↳ Exploración local"
                : data.origin === "ai"
                  ? "↳ Sugerencia de IA aceptada"
                  : "↳ Fuente externa"}
            </span>
          )}
        </div>
      )}
      {data.kind === "keyword" && (
        <span className="keyword-sub">una idea por explorar</span>
      )}
      <button
        className="card-edit nodrag"
        aria-label={`Editar ${data.title}`}
        title="Editar elemento"
        onClick={() => edit(id)}
      >
        <PenLine size={13} />
      </button>
    </article>
  );
}
