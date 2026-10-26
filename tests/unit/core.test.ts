import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { exploreLocal } from "../../src/lib/catalog";
import { demoProject, newProject, node } from "../../src/lib/demo";
import { useStore } from "../../src/lib/store";
import { db } from "../../src/lib/db";
import { createServer, responseSchema } from "../../server/index.mjs";
import type { AddressInfo } from "node:net";
beforeEach(async () => {
  await db.projects.clear();
  await db.settings.clear();
  useStore.setState({
    projects: [],
    currentId: null,
    loaded: false,
    past: [],
    future: [],
    error: "",
  });
});
describe("exploración local", () => {
  it("relaciona una intención de biblioteca con luz, tactilidad y privacidad", () => {
    const results = exploreLocal(
      "Una biblioteca acogedora con luz e intimidad",
    );
    expect(results.map((s) => s.id)).toEqual(
      expect.arrayContaining(["filtered", "tactile", "threshold", "aalto"]),
    );
    expect(
      results.every(
        (s) =>
          s.mode === "local" && s.limitation.includes("no analiza imágenes"),
      ),
    ).toBe(true);
  });
  it("normaliza acentos y ofrece preguntas cuando no hay coincidencias", () => {
    expect(exploreLocal("ATMÓSFERA").length).toBeGreaterThan(0);
    expect(exploreLocal("qwerty").some((s) => s.category === "question")).toBe(
      true,
    );
  });
});
describe("proyectos y persistencia", () => {
  it("crea proyectos vacíos con siete universos independientes", () => {
    const a = newProject("Uno"),
      b = newProject("Dos");
    expect(a.nodes).toEqual([]);
    expect(a.universes).toHaveLength(7);
    a.universes[0].name = "Editado";
    expect(b.universes[0].name).not.toBe("Editado");
  });
  it("la demo conserva conexiones válidas y no inventa fotografías de edificios", () => {
    const p = demoProject();
    expect(p.nodes).toHaveLength(6);
    expect(
      p.edges.every(
        (e) =>
          p.nodes.some((n) => n.id === e.source) &&
          p.nodes.some((n) => n.id === e.target),
      ),
    ).toBe(true);
    expect(
      p.nodes
        .filter((n) => n.data.image)
        .every(
          (n) =>
            n.data.source?.includes("demostración") ||
            n.data.source?.includes("ilustrativa"),
        ),
    ).toBe(true);
  });
  it("guarda, deshace y rehace contenido y posiciones sin perder el diario", async () => {
    const p = newProject("Prueba");
    useStore.setState({ projects: [p], currentId: p.id, loaded: true });
    const n = node("note", "Original", "Luz", 40, 60);
    useStore.getState().mutate((p) => p.nodes.push(n), "Se añadió una nota");
    useStore.getState().mutate((p) => {
      p.nodes[0].position = { x: 500, y: 250 };
      p.nodes[0].data.text = "Intimidad";
    }, "Se movió una nota");
    useStore.getState().undo();
    let state = useStore.getState().projects[0];
    expect(state.nodes[0].position).toEqual({ x: 40, y: 60 });
    expect(state.nodes[0].data.text).toBe("Luz");
    useStore.getState().redo();
    await vi.waitFor(async () => {
      const stored = await db.projects.get(p.id);
      expect(stored?.nodes[0].position).toEqual({ x: 500, y: 250 });
      expect(stored?.nodes[0].data.text).toBe("Intimidad");
    });
    expect(
      useStore.getState().projects[0].events.length,
    ).toBeGreaterThanOrEqual(4);
  });
  it("no vuelve a crear la demo tras vaciar el laboratorio", async () => {
    await db.settings.put({ id: "initialized", value: true });
    await useStore.getState().init();
    expect(useStore.getState().projects).toEqual([]);
    expect(useStore.getState().currentId).toBeNull();
  });
});
describe("servidor opcional seguro", () => {
  it("rechaza respuestas sin estructura o con fuentes no válidas", () => {
    expect(
      responseSchema.safeParse({ suggestions: [{ title: "inventada" }] })
        .success,
    ).toBe(false);
  });
  it("funciona sin claves y declara IA sin configurar sin exponer valores", async () => {
    const previous = process.env.AI_API_KEY;
    delete process.env.AI_API_KEY;
    const server = createServer();
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    try {
      const port = (server.address() as AddressInfo).port;
      const health = await fetch(`http://127.0.0.1:${port}/api/health`);
      expect(await health.json()).toEqual({
        status: "ok",
        configured: false,
        multimodal: false,
      });
      const res = await fetch(`http://127.0.0.1:${port}/api/explore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "luz" }),
      });
      expect(res.status).toBe(503);
      const denied = await fetch(`http://127.0.0.1:${port}/api/explore`, {
        method: "POST",
        headers: { Origin: "https://otro-sitio.example" },
        body: "{}",
      });
      expect(denied.status).toBe(403);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      if (previous === undefined) delete process.env.AI_API_KEY;
      else process.env.AI_API_KEY = previous;
    }
  });
});
