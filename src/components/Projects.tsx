import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Copy,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useStore } from "../lib/store";
import { demoProject, newProject } from "../lib/demo";
import { uid } from "../lib/db";
import { Modal } from "./Modal";
export function Projects({
  onImport,
  onError,
}: {
  onImport: () => void;
  onError: (message: string) => void;
}) {
  const { projects, open, addProject, deleteProject, rename } = useStore();
  const [search, setSearch] = useState("");
  const [create, setCreate] = useState(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string>();
  return (
    <main className="projects-page">
      <div className="projects-kicker">
        <span className="eyebrow">TU ARCHIVO VIVO / LATENTE</span>
        <span>La creatividad te pertenece.</span>
      </div>
      <div className="projects-title">
        <div>
          <h1>
            Mi laboratorio<span> de posibilidades.</span>
          </h1>
          <p>Cada proyecto empieza con algo que todavía no tiene forma.</p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setName("");
            setCreate(true);
          }}
        >
          <Plus size={17} /> Nuevo proyecto
        </button>
      </div>
      <div className="projects-controls">
        <label>
          <Search size={16} />
          <input
            placeholder="Buscar en tu laboratorio…"
            aria-label="Buscar proyectos"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button className="text-link" onClick={onImport}>
          <ArrowDownToLine size={16} /> Importar proyecto
        </button>
      </div>
      <div className="project-grid">
        {projects
          .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
          .map((p, i) => (
            <article className="project-tile" key={p.id}>
              <button
                className="project-cover"
                onClick={() => open(p.id)}
                style={{ background: i % 2 ? "#e8e3d6" : "#e6e7df" }}
              >
                {p.demo ? (
                  <>
                    <img
                      src="/images/sketch.svg"
                      alt="Boceto de demostración"
                    />
                    <span className="demo-pill">PROYECTO DE EJEMPLO</span>
                  </>
                ) : (
                  <div className="project-cover-type">
                    {p.name.slice(0, 1)}
                    <small>{p.nodes.length} fragmentos de una idea</small>
                  </div>
                )}
                <span className="cover-arrow">
                  <ArrowUpRight size={24} />
                </span>
              </button>
              <div className="project-tile-info">
                <div>
                  <button className="project-name" onClick={() => open(p.id)}>
                    {p.name}
                  </button>
                  <p>
                    {new Date(p.modifiedAt).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    · {p.nodes.length} fragmentos
                  </p>
                </div>
                <button
                  className="icon-button"
                  title={`Opciones de ${p.name}`}
                  onClick={() => setEditing(p.id)}
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </article>
          ))}
        <button
          className="new-project-tile"
          onClick={() => {
            setName("");
            setCreate(true);
          }}
        >
          <Plus size={28} />
          <span>¿Qué tienes en mente?</span>
          <small>Abre un espacio para explorarlo.</small>
        </button>
      </div>
      <div className="projects-manifesto">
        <span>NO HAY UNA ÚNICA FORMA DE EMPEZAR.</span>
        <p>
          Una imagen. Una palabra.
          <br />
          <em>Una intuición.</em>
        </p>
        <button
          className="text-link"
          onClick={() => {
            addProject(demoProject());
          }}
        >
          Abrir una nueva demostración <ArrowUpRight size={16} />
        </button>
      </div>
      {create && (
        <Modal
          title="Un nuevo espacio para imaginar"
          onClose={() => setCreate(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                addProject(newProject(name.trim()));
                setCreate(false);
              } else onError("Escribe un nombre para tu proyecto.");
            }}
          >
            <label>
              Nombre del proyecto
              <input
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mi próxima idea…"
              />
            </label>
            <p className="muted">
              Comenzarás con un lienzo vacío. El proceso lo decides tú.
            </p>
            <div className="modal-actions">
              <button
                className="secondary"
                type="button"
                onClick={() => setCreate(false)}
              >
                Cancelar
              </button>
              <button className="primary">Crear proyecto ↗</button>
            </div>
          </form>
        </Modal>
      )}
      {editing &&
        (() => {
          const p = projects.find((p) => p.id === editing)!;
          return (
            <Modal title={p.name} onClose={() => setEditing(undefined)}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = new FormData(e.currentTarget).get(
                    "name",
                  ) as string;
                  if (value.trim()) rename(p.id, value.trim());
                  setEditing(undefined);
                }}
              >
                <label>
                  Renombrar proyecto
                  <input name="name" defaultValue={p.name} required />
                </label>
                <div className="project-options">
                  <button
                    className="secondary"
                    type="button"
                    onClick={() => {
                      const copy = structuredClone(p);
                      copy.id = uid();
                      copy.name += " · copia";
                      addProject(copy);
                      setEditing(undefined);
                    }}
                  >
                    <Copy size={16} /> Duplicar
                  </button>
                  <button
                    className="danger secondary"
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `¿Eliminar «${p.name}»? Exporta una copia si deseas conservarlo. Esta acción no se puede deshacer.`,
                        )
                      ) {
                        deleteProject(p.id);
                        setEditing(undefined);
                      }
                    }}
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
                <div className="modal-actions">
                  <button className="primary">Guardar nombre</button>
                </div>
              </form>
            </Modal>
          );
        })()}
    </main>
  );
}
