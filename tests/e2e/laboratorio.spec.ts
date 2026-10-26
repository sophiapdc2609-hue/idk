import { test, expect, type Page } from "@playwright/test";
const pixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ZkAAAAASUVORK5CYII=",
  "base64",
);
async function blank(page: Page, name = "Biblioteca de prueba") {
  await page.goto("/");
  await expect(page.locator(".canvas-heading")).toBeVisible();
  if (
    await page
      .getByRole("button", { name: "Cerrar Explorar", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Cerrar Explorar", exact: true })
      .click();
  await page.getByRole("button", { name: "LATENTE · Mi laboratorio" }).click();
  await page
    .getByRole("button", { name: "Nuevo proyecto", exact: true })
    .click();
  await page.getByLabel("Nombre del proyecto").fill(name);
  await page
    .getByRole("button", { name: "Crear proyecto", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "¿Qué tienes en mente?" }),
  ).toBeVisible();
  if (
    await page
      .getByRole("button", { name: "Cerrar Explorar", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Cerrar Explorar", exact: true })
      .click();
}
async function note(
  page: Page,
  title = "Una biblioteca acogedora",
  text = "Quiero un espacio íntimo con luz natural filtrada y madera.",
) {
  await page.getByRole("button", { name: "Nota", exact: true }).click();
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("Contenido", { exact: true }).fill(text);
  await page
    .getByRole("button", { name: "Guardar fragmento", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
}
async function saved(page: Page) {
  await expect(page.getByText("Todo guardado", { exact: true })).toBeVisible();
  await page.waitForTimeout(400);
}
async function read(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("latente-laboratorio");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    return new Promise<any[]>((resolve, reject) => {
      const r = db.transaction("projects").objectStore("projects").getAll();
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  });
}

test("01–02 · crear, editar, mover y conservar una nota al recargar", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await blank(page);
  await note(page);
  const card = page.locator(".react-flow__node").first();
  let b = await card.boundingBox();
  await page.mouse.move(b!.x + 45, b!.y + 35);
  await page.mouse.down();
  await page.mouse.move(b!.x + 150, b!.y + 105, { steps: 10 });
  await page.mouse.up();
  await saved(page);
  const before = (await read(page)).find(
    (p) => p.name === "Biblioteca de prueba",
  ).nodes[0];
  expect(before.position.x).not.toBe(0);
  await card.dblclick();
  await page
    .getByLabel("Contenido", { exact: true })
    .fill("Mi intención revisada: intimidad y luz.");
  await page
    .getByRole("button", { name: "Guardar fragmento", exact: false })
    .click();
  await saved(page);
  await page.reload();
  await expect(
    page.getByText("Mi intención revisada: intimidad y luz.", { exact: true }),
  ).toBeVisible();
  const after = (await read(page)).find(
    (p) => p.name === "Biblioteca de prueba",
  ).nodes[0];
  expect(after.position).toEqual(before.position);
  expect(errors).toEqual([]);
});

test("03–04 · imagen persistente, dibujo y anotación", async ({ page }) => {
  await blank(page);
  await page.getByLabel("Importar archivo al lienzo").setInputFiles({
    name: "muestra.png",
    mimeType: "image/png",
    buffer: pixel,
  });
  await expect(
    page.getByRole("heading", { name: "muestra.png", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Editar muestra.png" }).click();
  await page
    .getByRole("button", { name: "Dibujar encima", exact: true })
    .click();
  await expect(page.getByLabel("Lienzo de dibujo")).toBeVisible();
  await page
    .getByLabel("Lienzo de dibujo")
    .click({ position: { x: 50, y: 50 } });
  await page
    .getByRole("button", { name: "Añadir al lienzo", exact: false })
    .click();
  await page.getByRole("button", { name: "Dibujo libre", exact: true }).click();
  const canvas = page.getByLabel("Lienzo de dibujo");
  const b = (await canvas.boundingBox())!;
  await page.mouse.move(b.x + 50, b.y + 60);
  await page.mouse.down();
  await page.mouse.move(b.x + 220, b.y + 130, { steps: 10 });
  await page.mouse.up();
  await page
    .getByRole("button", { name: "Añadir al lienzo", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Un pensamiento a mano" }),
  ).toBeVisible();
  await saved(page);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "muestra.png", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Un pensamiento a mano" }),
  ).toBeVisible();
  const data = (await read(page)).find(
    (p) => p.name === "Biblioteca de prueba",
  );
  expect(data.nodes.filter((n: any) => n.data.fileId)).toHaveLength(2);
});

test("05–06 · conectar con significado y filtrar varios universos sin mover nodos", async ({
  page,
}) => {
  await blank(page);
  await note(page, "Primera idea");
  await page.getByRole("button", { name: "Editar Primera idea" }).click();
  await page.getByLabel("Atmósferas y sensaciones", { exact: true }).check();
  await page.getByLabel("Materialidad y expresión", { exact: true }).check();
  await page
    .getByRole("button", { name: "Guardar fragmento", exact: false })
    .click();
  await note(page, "Segunda idea");
  await page.locator(".canvas-area").click({ position: { x: 350, y: 150 } });
  await page.keyboard.press("Control+a");
  await page
    .getByRole("button", { name: "Conectar elementos", exact: true })
    .click();
  await page
    .getByLabel("Significado de la conexión")
    .fill("La luz expresa la intimidad que busco");
  await page
    .getByRole("button", { name: "Guardar conexión", exact: false })
    .click();
  await saved(page);
  const before = (await read(page)).find(
    (p) => p.name === "Biblioteca de prueba",
  );
  expect(before.edges[0].label).toBe("La luz expresa la intimidad que busco");
  await page
    .getByRole("navigation", { name: "Universos de exploración" })
    .getByRole("button", { name: "Atmósferas y sensaciones", exact: false })
    .click();
  await expect(page.locator(".react-flow__node:visible")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Vista general", exact: false })
    .click();
  await expect(page.locator(".react-flow__node:visible")).toHaveCount(2);
  await saved(page);
  const after = (await read(page)).find(
    (p) => p.name === "Biblioteca de prueba",
  );
  expect(after.nodes.map((n: any) => n.position)).toEqual(
    before.nodes.map((n: any) => n.position),
  );
});

test("07–08 · exploración contextual y procedencia de un hallazgo", async ({
  page,
}) => {
  await blank(page);
  await note(page);
  await page
    .getByRole("heading", { name: "Una biblioteca acogedora", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Explorar esta idea", exact: true })
    .click();
  await expect(
    page.getByText("Exploración local", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Luz que se filtra", exact: true }),
  ).toBeVisible();
  await page
    .locator(".suggestion")
    .filter({
      has: page.getByRole("heading", {
        name: "Luz que se filtra",
        exact: true,
      }),
    })
    .getByRole("button", { name: "Guardar", exact: true })
    .click();
  await saved(page);
  const data = (await read(page)).find(
    (p) => p.name === "Biblioteca de prueba",
  );
  const found = data.nodes.find(
    (n: any) => n.data.title === "Luz que se filtra",
  );
  expect(found.data.origin).toBe("local");
  expect(found.data.originId).toBe(data.nodes[0].id);
});

test("09–10 · diario, reflexión personal, hitos y narración", async ({
  page,
}) => {
  await blank(page);
  await note(page, "Primera intuición");
  await page
    .getByRole("button", { name: "Diario visual", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Se añadió «Primera intuición»" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reflexión", exact: true }).click();
  await page
    .getByLabel("¿Qué cambió en tu forma de mirar el proyecto?")
    .fill("La intimidad también puede ser compartida.");
  await page
    .getByRole("button", { name: "Guardar reflexión", exact: false })
    .click();
  const entry = page
    .locator(".journal-event")
    .filter({ hasText: "La intimidad también puede ser compartida." });
  await entry.getByRole("button", { name: "Marcar hito", exact: true }).click();
  await entry
    .getByRole("button", { name: "Para mi narración", exact: true })
    .click();
  await page.getByRole("button", { name: /^Mi narración/ }).click();
  await expect(page.locator(".journal-event")).toHaveCount(1);
  await expect(
    page.getByText("La intimidad también puede ser compartida.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.emulateMedia({ media: "print" });
  const pdf = await page.pdf({ format: "A4" });
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
});

test("11 · exportar e importar JSON con archivos; exportar PNG real", async ({
  page,
}) => {
  await blank(page);
  await note(page);
  await page.getByLabel("Importar archivo al lienzo").setInputFiles({
    name: "imagen.png",
    mimeType: "image/png",
    buffer: pixel,
  });
  await expect(page.getByRole("heading", { name: "imagen.png" })).toBeVisible();
  await page.locator(".canvas-area").click({ position: { x: 400, y: 150 } });
  await page.keyboard.press("Control+a");
  await page
    .getByRole("button", { name: "Conectar elementos", exact: true })
    .click();
  await page
    .getByLabel("Significado de la conexión")
    .fill("Una imagen para mi intención");
  await page
    .getByRole("button", { name: "Guardar conexión", exact: false })
    .click();
  await saved(page);
  await page.getByRole("button", { name: "Exportar", exact: true }).click();
  let downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Proyecto completo · JSON" }).click();
  const json = await downloaded;
  const path = await json.path();
  await page.getByLabel("Importar proyecto JSON").setInputFiles(path!);
  await expect(
    page.getByRole("heading", {
      name: "Biblioteca de prueba · importado",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "imagen.png" })).toBeVisible();
  await saved(page);
  const data = (await read(page)).find(
    (p) => p.name === "Biblioteca de prueba · importado",
  );
  expect(data.nodes).toHaveLength(2);
  expect(data.edges[0].label).toBe("Una imagen para mi intención");
  expect(data.nodes[1].data.fileId).toBeTruthy();
  await page.getByRole("button", { name: "Exportar", exact: true }).click();
  downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Lienzo visible · PNG" }).click();
  const png = await downloaded;
  expect(png.suggestedFilename()).toMatch(/\.png$/);
  await png.saveAs("/tmp/latente-export.png");
});

test("12 · móvil: lienzo, universos y edición accesibles sin desbordamiento", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await blank(page, "Mi laboratorio móvil");
  await note(page, "Una idea móvil");
  await page.getByRole("button", { name: "Universos", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Universos de exploración" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Crear universo", exact: true })
    .click();
  await page.getByLabel("Nombre del universo").fill("Memoria");
  await page
    .getByRole("button", { name: "Crear universo", exact: false })
    .last()
    .click();
  await expect(
    page
      .getByRole("navigation", { name: "Universos de exploración" })
      .getByRole("button", { name: "Memoria", exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cerrar universos" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/latente-mobile.png" });
});

test("deshacer, rehacer, duplicar y guardar versiones recuperables", async ({
  page,
}) => {
  await blank(page);
  await note(page, "Idea original");
  await page.getByRole("button", { name: "Deshacer", exact: true }).click();
  await expect(page.locator(".react-flow__node:visible")).toHaveCount(0);
  await page.getByRole("button", { name: "Rehacer", exact: true }).click();
  await expect(page.locator(".react-flow__node:visible")).toHaveCount(1);
  await page
    .getByRole("heading", { name: "Idea original", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Duplicar selección", exact: true })
    .click();
  await expect(page.locator(".react-flow__node:visible")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Diario visual", exact: true })
    .click();
  await page.getByRole("button", { name: "Versiones", exact: true }).click();
  await page
    .getByRole("button", { name: "Guardar versión actual", exact: true })
    .click();
  await expect(page.getByText("Versión 1 ·", { exact: false })).toBeVisible();
});

test("hilos de investigación, archivo y recuperación", async ({ page }) => {
  await blank(page);
  await note(page, "Luz");
  await note(page, "Materia");
  await page.locator(".canvas-area").click({ position: { x: 400, y: 150 } });
  await page.keyboard.press("Control+a");
  await page
    .getByRole("button", { name: "Agrupar en un hilo", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Hilo de investigación", exact: true }),
  ).toBeVisible();
  await saved(page);
  let data = (await read(page)).find((p) => p.name === "Biblioteca de prueba");
  const zone = data.nodes.find((n: any) => n.data.kind === "zone");
  expect(
    data.nodes.filter((n: any) => n.data.groupId === zone.id),
  ).toHaveLength(2);
  await page
    .getByRole("heading", { name: "Hilo de investigación", exact: true })
    .click();
  await page.getByRole("button", { name: "Desagrupar", exact: true }).click();
  await expect(page.locator(".react-flow__node:visible")).toHaveCount(2);
  await page.getByRole("heading", { name: "Materia", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Conservar como camino en pausa",
      exact: true,
    })
    .click();
  await expect(page.locator(".react-flow__node:visible")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Caminos en pausa", exact: false })
    .click();
  await page.getByRole("button", { name: "Retomar", exact: false }).click();
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await expect(page.locator(".react-flow__node:visible")).toHaveCount(2);
});
