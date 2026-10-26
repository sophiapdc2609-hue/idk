import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  Clock3,
  Flag,
  History,
  Plus,
  Printer,
  RotateCcw,
} from "lucide-react";
import type { Project } from "../types";
import { useStore } from "../lib/store";
import { now, uid } from "../lib/db";
import { Modal } from "./Modal";
export function Journal({
  project,
  onFocus,
}: {
  project: Project;
  onFocus: (id: string) => void;
}) {
  const [reflection, setReflection] = useState(false);
  const [text, setText] = useState("");
  const [milestones, setMilestones] = useState(false);
  const [narrative, setNarrative] = useState(false);
  const [versions, setVersions] = useState(false);
  const mutate = useStore((s) => s.mutate);
  const events = project.events.filter((e) =>
    narrative ? e.selected : milestones ? e.milestone : true,
  );
  return (
    <main className={`journal-page ${narrative ? "narrative-mode" : ""}`}>
      <div className="journal-top">
        <div>
          <span className="eyebrow">EL PROCESO TAMBIÉN ES EL PROYECTO</span>
          <h1>
            {narrative
              ? "Una historia de ideas."
              : "Diario de una exploración."}
          </h1>
          <p>
            {project.name} <span> / </span> {events.length} momentos
          </p>
        </div>
        <div className="journal-controls no-print">
          <button className="secondary" onClick={() => setVersions(!versions)}>
            <History size={16} /> Versiones
          </button>
          <button
            className="secondary"
            onClick={() => {
              setText("");
              setReflection(true);
            }}
          >
            <Plus size={16} /> Reflexión
          </button>
          <button className="primary" onClick={() => window.print()}>
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
      </div>
      <div className="journal-filters no-print">
        <button
          className={!milestones && !narrative ? "active" : ""}
          onClick={() => {
            setMilestones(false);
            setNarrative(false);
          }}
        >
          Todos los momentos
        </button>
        <button
          className={milestones ? "active" : ""}
          onClick={() => {
            setMilestones(true);
            setNarrative(false);
          }}
        >
          <Flag size={14} /> Hitos
        </button>
        <button
          className={narrative ? "active" : ""}
          onClick={() => {
            setNarrative(!narrative);
            setMilestones(false);
          }}
        >
          Mi narración ({project.events.filter((e) => e.selected).length})
        </button>
      </div>
      {versions && (
        <section className="versions-panel no-print">
          <h3>Volver a una posibilidad</h3>
          <p>
            Una versión conserva los elementos, sus posiciones y conexiones. El
            diario mantiene el recorrido completo.
          </p>
          <button
            className="secondary"
            onClick={() => {
              mutate((p) => {
                p.versions.push({
                  id: uid(),
                  at: now(),
                  name: `Versión ${p.versions.length + 1}`,
                  nodes: structuredClone(p.nodes),
                  edges: structuredClone(p.edges),
                });
              }, "Se guardó una versión del lienzo");
            }}
          >
            <Plus size={15} /> Guardar versión actual
          </button>
          {project.versions.map((v) => (
            <div key={v.id}>
              <span>
                {v.name} · {new Date(v.at).toLocaleString("es-PE")}
              </span>
              <button
                className="text-link"
                onClick={() => {
                  if (
                    confirm(
                      "¿Recuperar esta versión? Se conservará una copia del estado actual.",
                    )
                  )
                    mutate((p) => {
                      p.versions.push({
                        id: uid(),
                        at: now(),
                        name: "Antes de recuperar " + v.name,
                        nodes: structuredClone(p.nodes),
                        edges: structuredClone(p.edges),
                      });
                      p.nodes = structuredClone(v.nodes);
                      p.edges = structuredClone(v.edges);
                    }, "Se recuperó " + v.name);
                }}
              >
                <RotateCcw size={14} /> Recuperar
              </button>
            </div>
          ))}
        </section>
      )}
      <div className="journal-timeline">
        {events.length === 0 ? (
          <div className="journal-empty">
            <Clock3 size={28} />
            <h2>
              {narrative
                ? "Elige los momentos que cuentan tu historia."
                : "Aquí irá tomando forma tu proceso."}
            </h2>
            <p>
              {narrative
                ? "Marca «Para mi narración» en los momentos de tu diario."
                : "Añade un fragmento al lienzo o escribe tu primera reflexión."}
            </p>
          </div>
        ) : (
          events.map((e, i) => (
            <article
              className={`journal-event ${e.type === "reflection" ? "is-reflection" : ""}`}
              key={e.id}
            >
              <div className="event-date">
                <span>{String(i + 1).padStart(2, "0")}</span>
                <time>
                  {new Date(e.at).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                  })}
                </time>
                <small>
                  {new Date(e.at).toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </div>
              <div className="event-content">
                <div className="event-type">
                  <span>
                    {e.type === "reflection"
                      ? "REFLEXIÓN PERSONAL"
                      : e.type === "discard"
                        ? "CAMINO DESCARTADO"
                        : "REGISTRO DEL PROCESO"}
                  </span>
                  {e.milestone && <Flag size={14} />}
                </div>
                <h2>{e.title}</h2>
                {e.text && <p>{e.text}</p>}
                {e.image && <img src={e.image} alt="Estudio del proceso" />}
                <div className="event-actions no-print">
                  <button
                    className={e.milestone ? "active" : ""}
                    onClick={() =>
                      mutate(
                        (p) => {
                          const ev = p.events.find((x) => x.id === e.id)!;
                          ev.milestone = !ev.milestone;
                        },
                        undefined,
                        false,
                      )
                    }
                  >
                    <Flag size={13} />
                    {e.milestone ? "Hito marcado" : "Marcar hito"}
                  </button>
                  <button
                    className={e.selected ? "active" : ""}
                    onClick={() =>
                      mutate(
                        (p) => {
                          const ev = p.events.find((x) => x.id === e.id)!;
                          ev.selected = !ev.selected;
                        },
                        undefined,
                        false,
                      )
                    }
                  >
                    <Check size={13} />
                    {e.selected ? "En mi narración" : "Para mi narración"}
                  </button>
                  {e.nodeId && (
                    <button onClick={() => onFocus(e.nodeId!)}>
                      Ir al fragmento <ArrowUpRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
      {reflection && (
        <Modal
          title="Una pausa para pensar"
          onClose={() => setReflection(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutate(
                (p) =>
                  p.events.push({
                    id: uid(),
                    at: now(),
                    title: "Una reflexión personal",
                    text,
                    type: "reflection",
                    milestone: false,
                  }),
                undefined,
                false,
              );
              setReflection(false);
            }}
          >
            <label>
              ¿Qué cambió en tu forma de mirar el proyecto?
              <textarea
                autoFocus
                rows={7}
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setReflection(false)}
              >
                Cancelar
              </button>
              <button className="primary">Guardar reflexión ↗</button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
