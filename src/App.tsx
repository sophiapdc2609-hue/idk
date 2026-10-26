import { useCallback, useEffect, useRef, useState } from "react";
import {
  Asterisk,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Compass,
  Download,
  Image,
  Layers,
  Plus,
  X,
} from "lucide-react";
import { useStore } from "./lib/store";
import { Workspace } from "./components/Workspace";
import { Projects } from "./components/Projects";
import { Journal } from "./components/Journal";
import { exportProject, importProject } from "./lib/files";
import { Modal } from "./components/Modal";
import { newProject } from "./lib/demo";
import { uid } from "./lib/db";
export default function App() {
  const {
    projects,
    currentId,
    loaded,
    init,
    open,
    saveState,
    error,
    addProject,
  } = useStore();
  const project = projects.find((p) => p.id === currentId);
  const [view, setView] = useState<"canvas" | "journal">("canvas");
  const [message, setMessage] = useState("");
  const [exports, setExports] = useState(false);
  const [projectMenu, setProjectMenu] = useState(false);
  const [pngRequest, setPngRequest] = useState(0);
  const [focusId, setFocusId] = useState<string>();
  const [help, setHelp] = useState(false);
  const [newModal, setNewModal] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const notify = useCallback((m: string) => setMessage(m), []);
  useEffect(() => {
    void init();
  }, [init]);
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(""), 6500);
      return () => clearTimeout(t);
    }
  }, [message]);
  useEffect(() => {
    setView("canvas");
    setProjectMenu(false);
  }, [currentId]);
  if (!loaded)
    return (
      <div className="app-loading">
        <span className="brand">
          LATENTE<span>®</span>
        </span>
        <p>Abriendo tu laboratorio…</p>
      </div>
    );
  return (
    <div className="app-shell">
      <header className="app-header no-print">
        <button
          className="brand"
          aria-label="LATENTE · Mi laboratorio"
          onClick={() => open(null)}
        >
          LATENTE<span>®</span>
        </button>
        <div className="brand-description">
          LABORATORIO DE
          <br />
          IMAGINACIÓN ARQUITECTÓNICA
        </div>
        <span className="header-divider" />
        {project ? (
          <div className="project-switch">
            <button onClick={() => setProjectMenu(!projectMenu)}>
              {project.name}
              <ChevronDown size={13} />
            </button>
            {projectMenu && (
              <div className="dropdown project-dropdown">
                <span className="eyebrow">TU LABORATORIO</span>
                {projects.map((p) => (
                  <button key={p.id} onClick={() => open(p.id)}>
                    <span>{p.name}</span>
                    {p.id === currentId && <Check size={14} />}
                  </button>
                ))}
                <hr />
                <button onClick={() => open(null)}>
                  <Layers size={15} /> Todos mis proyectos
                </button>
                <button
                  onClick={() => {
                    setName("");
                    setNewModal(true);
                    setProjectMenu(false);
                  }}
                >
                  <Plus size={15} /> Nuevo proyecto vacío
                </button>
              </div>
            )}
          </div>
        ) : (
          <span className="header-library">Mi laboratorio</span>
        )}
        {project && (
          <nav className="view-nav" aria-label="Vistas del proyecto">
            <button
              className={view === "canvas" ? "active" : ""}
              onClick={() => setView("canvas")}
            >
              <Asterisk size={22} /> Imaginación
            </button>
            <button
              className={view === "journal" ? "active" : ""}
              onClick={() => setView("journal")}
            >
              <BookOpen size={15} /> Diario visual
            </button>
          </nav>
        )}
        <div className="header-right">
          {project && (
            <span className={`save-status ${saveState}`}>
              <i />
              {saveState === "saved"
                ? "Todo guardado"
                : saveState === "saving"
                  ? "Guardando…"
                  : "Error al guardar"}
            </span>
          )}
          <button
            className="help-button"
            aria-label="Ayuda y atajos"
            title="Ayuda y atajos"
            onClick={() => setHelp(true)}
          >
            ?
          </button>
          {project && (
            <div className="export-wrapper">
              <button
                className="export-button"
                onClick={() => setExports(!exports)}
              >
                <ArrowUpRight size={15} />
                <span>Exportar</span>
                <ChevronDown size={12} />
              </button>
              {exports && (
                <div className="dropdown export-dropdown">
                  <button
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await exportProject(project);
                        notify("Copia JSON exportada con todos sus archivos.");
                      } catch (e) {
                        notify(
                          e instanceof Error
                            ? e.message
                            : "No se pudo exportar.",
                        );
                      } finally {
                        setBusy(false);
                        setExports(false);
                      }
                    }}
                  >
                    <Download size={15} /> Proyecto completo · JSON
                  </button>
                  <button
                    onClick={() => {
                      setView("canvas");
                      setTimeout(() => setPngRequest((n) => n + 1), 100);
                      setExports(false);
                    }}
                  >
                    <Image size={15} /> Lienzo visible · PNG
                  </button>
                  <button
                    onClick={() => {
                      setView("journal");
                      setExports(false);
                      setTimeout(() => window.print(), 350);
                    }}
                  >
                    <BookOpen size={15} /> Diario · Imprimir / PDF
                  </button>
                  <hr />
                  <button
                    onClick={() => {
                      input.current?.click();
                      setExports(false);
                    }}
                  >
                    <ArrowDownToLine size={15} /> Importar proyecto JSON
                  </button>
                </div>
              )}
            </div>
          )}
          <div
            className="avatar"
            title="Laboratorio personal · almacenamiento local"
          >
            L<span />
          </div>
        </div>
      </header>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {!project ? (
        <Projects onImport={() => input.current?.click()} onError={notify} />
      ) : view === "canvas" ? (
        <Workspace
          key={project.id}
          project={project}
          onMessage={notify}
          pngRequest={pngRequest}
          focusId={focusId}
          onFocused={() => setFocusId(undefined)}
        />
      ) : (
        <Journal
          project={project}
          onFocus={(id) => {
            setView("canvas");
            setFocusId(id);
          }}
        />
      )}
      <input
        className="sr-only"
        type="file"
        accept=".json"
        ref={input}
        aria-label="Importar proyecto JSON"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            addProject(await importProject(file));
            notify("Proyecto importado con sus archivos y conexiones.");
          } catch (err) {
            notify(
              err instanceof Error
                ? err.message
                : "No se pudo importar el proyecto.",
            );
          }
          e.target.value = "";
        }}
      />
      {message && (
        <div className="toast no-print" role="status">
          <Check size={16} />
          <span>{message}</span>
          <button aria-label="Cerrar aviso" onClick={() => setMessage("")}>
            <X size={15} />
          </button>
        </div>
      )}
      {help && (
        <Modal
          title="Tu laboratorio, a tu manera"
          onClose={() => setHelp(false)}
        >
          <div className="help-content">
            <p>
              Empieza por una nota, una imagen o un dibujo. Nada se añade
              automáticamente: tú decides qué merece quedarse.
            </p>
            <dl>
              <dt>Mover un fragmento</dt>
              <dd>Arrástralo. Doble clic para editar.</dd>
              <dt>Navegar</dt>
              <dd>
                Herramienta mano, botón central o gesto táctil. Rueda o pellizco
                para zoom.
              </dd>
              <dt>Seleccionar varios</dt>
              <dd>Shift + clic, o arrastra un marco en el fondo.</dd>
              <dt>Relacionar</dt>
              <dd>
                Arrastra entre los puntos laterales de dos fragmentos. Escribe
                qué los conecta.
              </dd>
              <dt>Atajos</dt>
              <dd>
                Ctrl / Cmd + Z: deshacer. Shift + Z: rehacer. C / V: copiar y
                pegar. D: duplicar. Suprimir: eliminar.
              </dd>
              <dt>Guardar</dt>
              <dd>
                Guardado local automático en este navegador. Exporta JSON para
                una copia con imágenes y documentos. No hay sincronización en la
                nube ni cuentas.
              </dd>
              <dt>Exploración</dt>
              <dd>
                El modo local relaciona textos con un catálogo de demostración.
                No analiza el contenido visual de las imágenes.
              </dd>
            </dl>
            <button className="primary" onClick={() => setHelp(false)}>
              Volver a imaginar <ArrowUpRight size={15} />
            </button>
          </div>
        </Modal>
      )}
      {newModal && (
        <Modal title="¿Qué tienes en mente?" onClose={() => setNewModal(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addProject(newProject(name.trim()));
              setNewModal(false);
            }}
          >
            <label>
              Nombre del proyecto
              <input
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Una nueva posibilidad"
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setNewModal(false)}
              >
                Cancelar
              </button>
              <button className="primary">Abrir lienzo vacío ↗</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
