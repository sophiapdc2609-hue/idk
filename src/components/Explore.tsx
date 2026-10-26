import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookmarkPlus,
  Compass,
  Search,
  Sparkles,
  X,
  Link2,
  ChevronRight,
} from "lucide-react";
import type { CanvasNode, Suggestion } from "../types";
import { categoryNames, exploreLocal } from "../lib/catalog";
import { safeUrl } from "../lib/files";
export function Explore({
  selection,
  onClose,
  onSave,
  onDiscard,
  onRelate,
  allNodes,
}: {
  selection: CanvasNode[];
  allNodes: CanvasNode[];
  onClose: () => void;
  onSave: (s: Suggestion) => void;
  onDiscard: (s: Suggestion) => void;
  onRelate: (s: Suggestion) => void;
}) {
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [tab, setTab] = useState("Todo");
  const [detail, setDetail] = useState<Suggestion>();
  const [remote, setRemote] = useState<Suggestion[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const context = selection
    .map((n) => [n.data.title, n.data.text, n.data.notes].join(" "))
    .join(" ");
  const results = useMemo(
    () =>
      remote ?? exploreLocal(query || context || "luz atmósfera biblioteca"),
    [query, context, remote],
  );
  const concepts = ["intim", "acog", "luz", "silencio", "madera", "biblioteca"]
    .filter((w) => (query + " " + context).toLowerCase().includes(w))
    .map(
      (w) =>
        ({
          intim: "Intimidad",
          acog: "Acogimiento",
          luz: "Luz",
          silencio: "Silencio",
          madera: "Materialidad",
          biblioteca: "Lectura",
        })[w],
    );
  const connection =
    selection.length &&
    allNodes.find(
      (n) =>
        !selection.some((s) => s.id === n.id) &&
        n.data.universes.some((u) =>
          selection.some((s) => s.data.universes.includes(u)),
        ),
    );
  return (
    <aside className="explore-panel">
      <div className="explore-head">
        <span className="eyebrow">
          <Compass size={14} /> INVESTIGACIÓN CONTEXTUAL
        </span>
        <button
          className="icon-button"
          aria-label="Cerrar Explorar"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </div>
      <h2>
        Seguir la
        <br />
        <em>curiosidad.</em>
      </h2>
      <p className="explore-intro">
        Las ideas se enriquecen cuando las miramos desde otro lugar.
      </p>
      <div className="explore-mode">
        <i />{" "}
        <span className="mode-label">
          {remote ? "IA conectada" : "Exploración local"}
        </span>
        <span
          className="mode-info"
          title="La exploración local utiliza palabras de tus textos y etiquetas. No interpreta fotografías ni bocetos."
        >
          ⓘ
        </span>
      </div>
      {selection.length > 0 ? (
        <div className="selection-context">
          <span>TU PUNTO DE PARTIDA</span>
          <p>“{selection[0].data.text || selection[0].data.title}”</p>
          {selection.length > 1 && (
            <small>+ {selection.length - 1} fragmentos seleccionados</small>
          )}
        </div>
      ) : (
        <div className="selection-context">
          <span>UNA INVITACIÓN</span>
          <p>Selecciona un fragmento del lienzo o escribe una inquietud.</p>
        </div>
      )}
      <form
        className="explore-search"
        onSubmit={(e) => {
          e.preventDefault();
          setRemote(null);
          setHidden([]);
        }}
      >
        <Search size={15} />
        <input
          aria-label="Buscar referentes o conceptos"
          placeholder="Una idea, una sensación…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setRemote(null);
          }}
        />
      </form>
      {concepts.length > 0 && (
        <div className="concepts">
          {concepts.map((c) => (
            <button key={c} onClick={() => setQuery(c!)}>
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="explore-tabs">
        {["Todo", "Estrategias", "Lecturas", "Referentes"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="suggestion-list">
        {results
          .filter(
            (s) =>
              !hidden.includes(s.id) &&
              (tab === "Todo" ||
                (tab === "Estrategias" && s.category === "strategy") ||
                (tab === "Lecturas" && s.category === "theory") ||
                (tab === "Referentes" && s.category === "reference")),
          )
          .map((s, i) => (
            <article className="suggestion" key={s.id}>
              <div className="suggestion-meta">
                <span>
                  {String(i + 1).padStart(2, "0")} / {categoryNames[s.category]}
                </span>
                <button
                  title="Descartar sugerencia"
                  onClick={() => {
                    setHidden((h) => [...h, s.id]);
                    onDiscard(s);
                  }}
                >
                  <X size={13} />
                </button>
              </div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <div className="suggestion-actions">
                <button
                  disabled={saved.includes(s.id)}
                  onClick={() => {
                    onSave(s);
                    setSaved((v) => [...v, s.id]);
                  }}
                >
                  <BookmarkPlus size={13} />
                  {saved.includes(s.id) ? "Guardado" : "Guardar"}
                </button>
                <button title="Investigar más" onClick={() => setDetail(s)}>
                  <ArrowUpRight size={16} />
                </button>
                <button
                  title="Relacionar con la selección"
                  disabled={!selection.length}
                  onClick={() => onRelate(s)}
                >
                  <Link2 size={14} />
                </button>
              </div>
            </article>
          ))}
        {connection && (
          <article className="suggestion">
            <span className="eyebrow">UNA CONEXIÓN POSIBLE</span>
            <h3>{connection.data.title}</h3>
            <p>Comparte universos con tu selección. ¿Qué relación observas?</p>
            <button
              className="text-link"
              onClick={() =>
                onSave({
                  id: "connection-" + connection.id,
                  category: "connection",
                  title: "Relación por investigar",
                  text: `Comparar con «${connection.data.title}»: ¿qué relación encuentras?`,
                  tags: [],
                  mode: "local",
                  limitation: "Relación por etiquetas compartidas.",
                })
              }
            >
              Guardar pregunta <ChevronRight size={14} />
            </button>
          </article>
        )}
      </div>
      {detail && (
        <div className="research-detail">
          <button
            className="icon-button"
            title="Cerrar investigación"
            onClick={() => setDetail(undefined)}
          >
            <X size={18} />
          </button>
          <span className="eyebrow">
            PROFUNDIZAR / {categoryNames[detail.category]}
          </span>
          <h3>{detail.title}</h3>
          <p>{detail.text}</p>
          {safeUrl(detail.source) && (
            <a
              href={safeUrl(detail.source)}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Consultar fuente ↗
            </a>
          )}
          <h4>Una pregunta para tu cuaderno</h4>
          <p>
            ¿Qué parte de este recurso se relaciona con tu intención? Registra
            una observación propia antes de incorporarlo.
          </p>
          <p className="muted">{detail.limitation}</p>
          <button
            className="primary"
            onClick={() => {
              onSave(detail);
              setDetail(undefined);
            }}
          >
            Guardar hallazgo ↗
          </button>
        </div>
      )}
      <div className="explore-footer">
        <Sparkles size={15} />
        <p>
          Tú imaginas. La tecnología
          <br />
          amplía tus posibilidades.
        </p>
      </div>
      <details className="ai-options">
        <summary>Conexión opcional a IA</summary>
        <p>
          Requiere el servidor y una clave configurada de forma segura. Solo se
          enviarán el texto y las etiquetas de tu selección.
        </p>
        <button
          className="secondary"
          disabled={busy || !context}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const res = await fetch("/api/explore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: context }),
              });
              if (!res.ok)
                throw new Error(
                  res.status === 503
                    ? "IA sin configurar. Puedes seguir con la exploración local."
                    : "El servidor de IA no está disponible.",
                );
              const data = await res.json();
              if (!Array.isArray(data.suggestions))
                throw new Error("Respuesta no válida.");
              setRemote(data.suggestions);
              setHidden([]);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Error de conexión");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Consultando…" : "Consultar IA con mi selección"}
        </button>
        {error && <p role="status">{error}</p>}
      </details>
    </aside>
  );
}
