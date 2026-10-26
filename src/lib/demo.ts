import type { CardData, CanvasNode, Kind, Project } from "../types";
import { universes } from "./catalog";
import { uid, now } from "./db";
export function node(
  kind: Kind,
  title: string,
  text = "",
  x = 100,
  y = 100,
  extra: Partial<CardData> = {},
): CanvasNode {
  const at = now();
  return {
    id: uid(),
    type: "card",
    position: { x, y },
    style: {
      width: kind === "keyword" ? 205 : 280,
      height: kind === "keyword" ? 90 : 220,
    },
    data: {
      kind,
      title,
      text,
      universes: [],
      createdAt: at,
      modifiedAt: at,
      origin: "personal",
      notes: "",
      ...extra,
    },
  };
}
export function newProject(name: string, demo = false): Project {
  const at = now();
  return {
    id: uid(),
    name,
    description: "Un espacio para lo que todavía está tomando forma.",
    createdAt: at,
    modifiedAt: at,
    demo,
    nodes: [],
    edges: [],
    universes: structuredClone(universes),
    events: [],
    versions: [],
  };
}
export function demoProject(): Project {
  const p = newProject("Biblioteca de barrio", true);
  p.description = "Exploración de atmósferas";
  const a = node(
    "note",
    "Una intención, todavía abierta.",
    "Quiero que el espacio se sienta íntimo y acogedor. Un lugar donde leer sea también una forma de quedarse.",
    95,
    65,
    { universes: ["atmosphere", "human"], color: "#efe8d3" },
  );
  a.style = { width: 300, height: 250 };
  const b = node(
    "image",
    "La luz como refugio",
    "Estudio ilustrativo de luz filtrada. ¿Cómo cambia un rincón cuando la luz atraviesa varias capas?",
    485,
    15,
    {
      image: "/images/light.svg",
      universes: ["atmosphere", "space"],
      source: "Ilustración original de demostración · LATENTE",
    },
  );
  b.style = { width: 280, height: 375 };
  const c = node(
    "sketch",
    "Un lugar para leer",
    "Primeras relaciones entre luz, escala y permanencia.",
    60,
    410,
    {
      image: "/images/sketch.svg",
      universes: ["space", "human"],
      source: "Boceto ilustrativo de demostración · LATENTE",
    },
  );
  c.style = { width: 380, height: 310 };
  const d = node(
    "material",
    "Materia que invita a quedarse",
    "La calidez no es solo un color. También está en la textura y en el tiempo.",
    515,
    475,
    {
      image: "/images/wood.svg",
      universes: ["material", "atmosphere"],
      source: "Textura digital ilustrativa · LATENTE",
    },
  );
  d.style = { width: 250, height: 315 };
  const e = node("keyword", "silencio", "", 115, 335, {
    universes: ["atmosphere", "human"],
  });
  const f = node(
    "reference",
    "Atmósferas",
    "Peter Zumthor · 2006\nUn punto de partida para observar lo que sentimos al entrar en un espacio.",
    850,
    150,
    {
      universes: ["reference", "atmosphere"],
      source: "https://search.worldcat.org/search?q=Peter+Zumthor+Atmospheres",
      author: "Peter Zumthor",
    },
  );
  f.style = { width: 270, height: 245 };
  p.nodes = [a, b, c, d, e, f];
  p.edges = [
    {
      id: uid(),
      source: a.id,
      target: b.id,
      label: "una intimidad hecha de luz",
      type: "smoothstep",
      style: { stroke: "#ab826b", strokeWidth: 1.3 },
    },
    {
      id: uid(),
      source: b.id,
      target: c.id,
      sourceHandle: "bottom",
      targetHandle: "top",
      label: "llevar esta luz al boceto",
      type: "smoothstep",
      style: { stroke: "#ab826b", strokeWidth: 1.3 },
    },
  ];
  p.events = [
    {
      id: uid(),
      at: now(),
      title: "El comienzo de una pregunta",
      text: "¿Puede una biblioteca sentirse como un refugio compartido? Reflexión de ejemplo.",
      type: "reflection",
      milestone: true,
    },
    {
      id: uid(),
      at: now(),
      title: "Primer estudio de luz y permanencia",
      text: "Se incorporaron un boceto y una ilustración de luz. Contenido de demostración.",
      type: "automatic",
      milestone: false,
      image: "/images/sketch.svg",
    },
  ];
  return p;
}
