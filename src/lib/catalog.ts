import type { Suggestion, Universe } from "../types";
export const universes: Universe[] = [
  { id: "identity", name: "Identidad y lenguaje", color: "#a6a29a" },
  { id: "atmosphere", name: "Atmósferas y sensaciones", color: "#c39b68" },
  { id: "reference", name: "Referentes arquitectónicos", color: "#8e9d9c" },
  { id: "place", name: "Lugar y contexto", color: "#8e9b76" },
  { id: "space", name: "Forma y espacialidad", color: "#a899b0" },
  { id: "material", name: "Materialidad y expresión", color: "#bc8a75" },
  { id: "human", name: "Habitar y experiencia", color: "#9ba8bf" },
];
const limit =
  "Catálogo local de demostración. Se relaciona con tu texto y etiquetas; no analiza imágenes ni verifica geometría.";
const item = (
  id: string,
  category: Suggestion["category"],
  title: string,
  text: string,
  tags: string[],
  source?: string,
  author?: string,
): Suggestion => ({
  id,
  category,
  title,
  text,
  tags,
  source,
  author,
  mode: "local",
  limitation: limit,
});
export const catalog: Suggestion[] = [
  item(
    "filtered",
    "strategy",
    "Luz que se filtra",
    "Investiga cómo celosías, vegetación y capas translúcidas tamizan la luz natural. Observa el cambio de las sombras a lo largo del día.",
    ["luz", "intimidad", "atmósfera", "acogedor", "biblioteca", "silencio"],
  ),
  item(
    "tactile",
    "strategy",
    "La memoria de los materiales",
    "Explora superficies cálidas y texturas táctiles. Compara lo que un material comunica a la vista con la experiencia de tocarlo.",
    ["madera", "material", "acogedor", "textura", "intimidad"],
  ),
  item(
    "threshold",
    "strategy",
    "Umbrales y pequeñas pausas",
    "Estudia transiciones de escala, profundidad y privacidad. ¿Cómo cambia la sensación de permanencia entre un lugar abierto y un rincón?",
    ["espacio", "intimidad", "habitar", "biblioteca", "acogedor"],
  ),
  item(
    "atmospheres",
    "theory",
    "Atmósferas",
    "Peter Zumthor · Atmospheres (Birkhäuser, 2006). Un punto de partida para investigar la experiencia sensible de los espacios. Referencia bibliográfica; consulta la edición original.",
    ["atmósfera", "acogedor", "luz", "intimidad"],
    "https://search.worldcat.org/search?q=Peter+Zumthor+Atmospheres",
    "Peter Zumthor",
  ),
  item(
    "eyes",
    "theory",
    "Los ojos de la piel",
    "Juhani Pallasmaa · The Eyes of the Skin: Architecture and the Senses. Lectura para investigar percepción y experiencia multisensorial.",
    ["material", "textura", "habitar", "silencio"],
    "https://search.worldcat.org/search?q=Juhani+Pallasmaa+The+Eyes+of+the+Skin",
    "Juhani Pallasmaa",
  ),
  item(
    "ching",
    "theory",
    "Forma, espacio y orden",
    "Francis D. K. Ching · Architecture: Form, Space, and Order. Un recurso para estudiar relaciones, proporciones y organización espacial.",
    ["forma", "espacio", "orden", "recorrido"],
    "https://search.worldcat.org/search?q=Francis+Ching+Form+Space+Order",
    "Francis D. K. Ching",
  ),
  item(
    "genius",
    "theory",
    "El carácter del lugar",
    "Christian Norberg-Schulz · Genius Loci: Towards a Phenomenology of Architecture. Investiga el vínculo entre lugar, identidad y significado.",
    ["lugar", "paisaje", "contexto"],
    "https://search.worldcat.org/search?q=Norberg+Schulz+Genius+Loci",
    "Christian Norberg-Schulz",
  ),
  item(
    "holl",
    "theory",
    "Cuestiones de percepción",
    "Questions of Perception: Phenomenology of Architecture, de Steven Holl, Juhani Pallasmaa y Alberto Pérez-Gómez. Investiga luz, cuerpo y percepción.",
    ["luz", "percepción", "atmósfera"],
    "https://search.worldcat.org/search?q=Questions+of+Perception+Holl+Pallasmaa",
    "Holl · Pallasmaa · Pérez-Gómez",
  ),
  item(
    "aalto",
    "reference",
    "Biblioteca de Viipuri",
    "Alvar Aalto · Vyborg, Rusia. Investiga su iluminación cenital y la relación entre lectura y luz. Enlace al archivo de la fundación; no se incluyen fotografías de la obra.",
    ["biblioteca", "luz", "lectura"],
    "https://www.alvaraalto.fi/en/architecture/viipuri-library/",
    "Alvar Aalto",
  ),
  item(
    "question",
    "question",
    "¿Qué significa acogimiento para ti?",
    "Describe un recuerdo concreto: la luz, el sonido, la distancia a otras personas. ¿Qué parte de esa experiencia quieres investigar?",
    ["acogedor", "intimidad", "biblioteca", "habitar"],
  ),
  item(
    "landscape",
    "question",
    "¿Qué trae el lugar al proyecto?",
    "Registra orientación, variación climática, sonidos y memorias del contexto. ¿Qué merece ser conservado o puesto en relación?",
    ["lugar", "paisaje", "contexto"],
  ),
];
export function exploreLocal(text: string): Suggestion[] {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const matches = catalog
    .map((s) => ({
      s,
      score: s.tags.filter((t) =>
        normalized.includes(t.normalize("NFD").replace(/[\u0300-\u036f]/g, "")),
      ).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.s);
  return matches.length
    ? matches
    : catalog.filter((s) => ["filtered", "ching", "landscape"].includes(s.id));
}
export const categoryNames: Record<Suggestion["category"], string> = {
  concept: "Concepto",
  strategy: "Estrategia",
  reference: "Referente",
  theory: "Lectura",
  question: "Pregunta",
  connection: "Conexión",
};
