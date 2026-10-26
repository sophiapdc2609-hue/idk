import { useRef, useState } from "react";
import type { CanvasNode, CardData, Universe } from "../types";
import { Modal } from "./Modal";
import { now } from "../lib/db";
export function Editor({
  node,
  universes,
  onSave,
  onClose,
  onDraw,
  onOrigin,
}: {
  node: CanvasNode;
  universes: Universe[];
  onSave: (data: CardData) => void;
  onClose: () => void;
  onDraw: () => void;
  onOrigin?: () => void;
}) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [data, set] = useState({ ...node.data });
  const field = (key: keyof CardData, value: unknown) =>
    set((d) => ({ ...d, [key]: value }));
  const format = (mark: string) => {
    const el = textRef.current;
    if (!el) return;
    const start = el.selectionStart,
      end = el.selectionEnd;
    const chosen = data.text.slice(start, end) || "texto";
    field(
      "text",
      data.text.slice(0, start) + mark + chosen + mark + data.text.slice(end),
    );
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(
        start + mark.length,
        start + mark.length + chosen.length,
      );
    });
  };
  return (
    <Modal title="Un fragmento de tu investigación" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...data, modifiedAt: now() });
        }}
      >
        <label>
          Título
          <input
            required
            autoFocus
            value={data.title}
            onChange={(e) => field("title", e.target.value)}
          />
        </label>
        {data.kind !== "keyword" && (
          <label>
            Contenido
            <textarea
              aria-label="Contenido"
              ref={textRef}
              rows={5}
              value={data.text}
              onChange={(e) => field("text", e.target.value)}
              placeholder="¿Qué observas? ¿Qué te gustaría investigar?"
            />
            <span className="format-tools">
              <button
                type="button"
                title="Negrita"
                onClick={() => format("**")}
              >
                <b>B</b>
              </button>
              <button type="button" title="Cursiva" onClick={() => format("*")}>
                <i>I</i>
              </button>
              <small>Formato básico · selecciona el texto</small>
            </span>
          </label>
        )}
        <label>
          Tu observación personal
          <textarea
            rows={2}
            value={data.notes}
            onChange={(e) => field("notes", e.target.value)}
          />
        </label>
        {["reference", "link", "image", "material", "sketch"].includes(
          data.kind,
        ) && (
          <label>
            Fuente o enlace
            <input
              type={data.source?.startsWith("http") ? "url" : "text"}
              value={data.source || ""}
              onChange={(e) => field("source", e.target.value)}
              placeholder="https://… o procedencia del recurso"
            />
          </label>
        )}
        {data.kind === "reference" && (
          <div className="form-row">
            <label>
              Autor
              <input
                value={data.author || ""}
                onChange={(e) => field("author", e.target.value)}
              />
            </label>
            <label>
              Ubicación
              <input
                value={data.location || ""}
                onChange={(e) => field("location", e.target.value)}
              />
            </label>
          </div>
        )}
        <fieldset>
          <legend>Universos · puedes elegir varios</legend>
          <div className="universe-checks">
            {universes.map((u) => (
              <label
                key={u.id}
                style={{
                  borderColor: data.universes.includes(u.id)
                    ? u.color
                    : undefined,
                }}
              >
                <input
                  type="checkbox"
                  checked={data.universes.includes(u.id)}
                  onChange={(e) =>
                    field(
                      "universes",
                      e.target.checked
                        ? [...data.universes, u.id]
                        : data.universes.filter((id) => id !== u.id),
                    )
                  }
                />
                <i style={{ background: u.color }} />
                {u.name}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="editor-meta">
          Procedencia:{" "}
          {data.origin === "personal"
            ? "aporte personal"
            : data.origin === "local"
              ? "exploración local"
              : data.origin === "ai"
                ? "IA aceptada"
                : "contenido externo"}{" "}
          · {new Date(data.createdAt).toLocaleDateString("es-PE")}
          {data.originId && onOrigin && (
            <button type="button" className="text-link" onClick={onOrigin}>
              Volver al origen ↗
            </button>
          )}
        </div>
        <div className="modal-actions">
          {["image", "sketch", "material", "drawing"].includes(data.kind) && (
            <button type="button" className="secondary" onClick={onDraw}>
              Dibujar encima
            </button>
          )}
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary" type="submit">
            Guardar fragmento ↗
          </button>
        </div>
      </form>
    </Modal>
  );
}
