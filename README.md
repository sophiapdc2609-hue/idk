# LATENTE

**Laboratorio de Imaginación Arquitectónica.** Un instrumento visual para reunir, relacionar e investigar ideas. La creatividad y las decisiones pertenecen al usuario.

## Ejecutar

Requisitos: Node.js 22 o superior (validado con Node 24), npm y un navegador moderno con IndexedDB.

```sh
npm ci
npm run dev
```

Abre la dirección que Vite imprime en tu terminal. El servidor de desarrollo usa el puerto 5173 y escucha en todas las interfaces para entornos de desarrollo. No es un servidor de producción.

```sh
npm run build       # TypeScript + compilación de producción en dist/
npm run preview     # Revisión local del build
npm test            # Pruebas unitarias, IndexedDB y contrato del servidor
npm run test:e2e    # Flujos reales en Chromium
```

Las pruebas de navegador usan `/usr/bin/chromium`. Puedes proporcionar otra instalación con `CHROMIUM_PATH=/ruta/a/chromium npm run test:e2e`. También puedes instalar Chromium con Playwright y apuntar esa variable al ejecutable descargado. No se deshabilita la verificación TLS ni la de paquetes.

Si tu entorno necesita un caché npm escribible: `npm ci --cache /tmp/latente-npm-cache`.

## Primeros pasos

1. La primera visita abre **Biblioteca de barrio**, una demostración identificada como ejemplo. Las imágenes son ilustraciones originales, no fotografías de edificios existentes.
2. Pulsa el logotipo para ir a **Mi laboratorio** y crea un proyecto: verás un lienzo vacío con «¿Qué tienes en mente?».
3. Usa la barra de inserción para notas, palabras, imágenes, sketches, materiales, referencias, enlaces, documentos o dibujos.
4. Arrastra los fragmentos. Doble clic o el lápiz de una tarjeta abre su editor. Asigna varios universos desde ese editor.
5. Selecciona con clic, Shift + clic o un marco en el fondo. Usa la mano para desplazarte y la rueda o un pellizco para zoom. Conecta puntos laterales de las tarjetas, o selecciona dos y pulsa la herramienta conexión; escribe el significado de la relación.
6. Pulsa **Explorar** en una selección para consultar el catálogo local. Cada hallazgo requiere que elijas guardarlo. Su procedencia y su elemento de origen quedan registrados.
7. El **Diario visual** conserva acciones, reflexiones, hitos, caminos en pausa y versiones. Selecciona momentos para construir una narración y usa Imprimir / PDF para exportarla.

### Atajos

- Ctrl / Cmd + Z: deshacer; Shift + Z o Ctrl / Cmd + Y: rehacer.
- Ctrl / Cmd + A: seleccionar fragmentos; C / V: copiar y pegar dentro de LATENTE; D: duplicar.
- Suprimir o Retroceso: eliminar con confirmación.
- Shift + clic: selección múltiple. Escape: cerrar Explorar.

Los atajos de edición no interfieren mientras escribes en un campo.

## Funciones implementadas

- Biblioteca de proyectos: crear, buscar, abrir, renombrar, duplicar, eliminar con confirmación e importar.
- Lienzo libre con zoom, desplazamiento, selección múltiple, arrastre, redimensionado, conexiones anotadas, duplicado, copia interna, deshacer y rehacer.
- Notas con negrita y cursiva básicas, palabras clave, imágenes, sketches importados, dibujos con lápiz/borrador/color/grosor, anotación sobre imágenes, materiales, referencias con autor/ubicación/fuente, documentos y enlaces.
- Hilos de investigación: una zona agrupa fragmentos. Al mover la zona se desplazan sus miembros; permite desagrupar. Las tarjetas conservan coordenadas libres.
- Siete universos superpuestos y universos personalizados. Los filtros no reorganizan las posiciones.
- Exploración contextual local por palabras clave: estrategias, lecturas, referentes, preguntas y coincidencias entre universos. Guardar, relacionar, profundizar en una ficha o descartar; nunca añade ideas sin acción del usuario.
- Diario con registros automáticos y reflexiones diferenciados, hitos, selección narrativa, versiones recuperables y caminos archivados que se pueden retomar.
- Guardado automático en IndexedDB de proyectos y archivos Blob. Recuperación de proyecto activo, contenido, posiciones, conexiones y vista al recargar.
- Copia JSON completa con archivos y versiones; importación validada con nuevos identificadores de proyecto y archivos. Exportación PNG de los elementos visibles del lienzo. Diario imprimible con estilos A4 para guardar como PDF desde el navegador.
- Interfaz adaptable: en móvil los universos y Explorar se abren como paneles; todas las herramientas fundamentales siguen disponibles. Tipografías empaquetadas, sin llamadas a Google Fonts.

## Datos y copias de seguridad

El almacenamiento es **local al navegador y al origen**. No hay cuentas, sincronización ni copia en la nube. Borrar los datos del sitio o cambiar de dominio/puerto puede hacer que dejes de ver tus proyectos. Espera al estado «Todo guardado» antes de cerrar y exporta JSON regularmente. Los archivos se guardan como Blob en IndexedDB; solo se convierten a base64 dentro de la copia JSON.

Límites: 20 MB por archivo, 100 MB por copia importada, 5.000 nodos y 10.000 conexiones por importación. Se advierte si el navegador informa un uso de almacenamiento superior al 80 %. Un fallo al guardar se muestra explícitamente. Los datos y archivos no se envían a un servidor en modo local.

El historial de deshacer/rehacer (40 pasos) es de sesión; las versiones explícitas sí se conservan. Una recuperación guarda una versión de respaldo del estado previo. Los archivos que dejan de usarse no se eliminan automáticamente de IndexedDB: se prioriza conservar referencias de versiones e historial. No se comparte el portapapeles con otras aplicaciones.

## IA opcional, solo desde el servidor

La aplicación funciona sin claves. Para habilitar consultas textuales a un proveedor compatible con Chat Completions y JSON Schema:

1. Copia `.env.example` a `.env` y configura `AI_API_KEY`, `AI_BASE_URL` y `AI_MODEL` **en el servidor**. No subas `.env` a Git ni uses variables `VITE_` para secretos.
2. Ejecuta `npm run server` en otra terminal. Escucha solo en loopback, puerto 3001.
3. Mantén `npm run dev` activo: Vite redirige `/api` al servidor. En Explorar, abre «Conexión opcional a IA» y pulsa consultar. Esa acción envía únicamente el texto de la selección, con consentimiento explícito.

El servidor verifica tamaño, origen permitido, HTTPS al proveedor y el esquema de respuesta. No transmite claves al cliente ni registra peticiones o credenciales. Sin configuración responde 503; la interfaz conserva el modo local. `/api/health` expone solo si está configurado y si se habilitó multimodalidad, nunca valores.

Contrato de `POST /api/explore`:

```json
{ "text": "Quiero investigar la luz y la intimidad", "images": [] }
```

`images` admite hasta tres data URLs PNG/JPEG/WebP, solo con `AI_MULTIMODAL=true` y un modelo compatible. Esta capacidad está preparada en la API; **la interfaz actual solo envía texto**. Cada sugerencia incluye categoría, concepto/título, explicación, etiquetas, fuente opcional y limitaciones. Las referencias no se verifican por navegación en tiempo real; se indica en las limitaciones de la respuesta. No se garantiza exactitud espacial ni geométrica.

La integración real no se considera validada contra un proveedor hasta configurarla y probarla con credenciales. Las pruebas actuales cubren el contrato y la ausencia de claves. Para publicar esta API en Internet faltan autenticación, límites de consumo por usuario y protección frente a abuso; el servidor incluido está orientado al desarrollo local. En producción configura un proxy HTTPS del mismo origen para `/api` y `APP_ORIGINS` de manera explícita. La aplicación local estática puede publicarse desde `dist/` sin esa API.

## Investigación y fuentes

La exploración local no es un modelo generativo ni multimodal: usa el texto aportado y un catálogo temático. No interpreta imágenes ni inventa fotografías o citas. Las fichas de Zumthor, Pallasmaa, Ching, Norberg-Schulz y Holl son orientaciones bibliográficas, con enlaces de consulta a WorldCat; no constituyen verificación de una edición ni transcripciones. El referente de Viipuri enlaza al archivo de la Fundación Alvar Aalto. No se realiza búsqueda web ni se descargan imágenes de terceros automáticamente. Puedes añadir referencias y sus fuentes manualmente.

Las ilustraciones de `public/images/` se crearon para esta demostración: estudio de luz, textura digital y boceto esquemático. No representan una obra construida atribuida a un arquitecto. Las fuentes tipográficas se distribuyen mediante paquetes Fontsource con sus licencias incluidas en esos paquetes.

## Estructura

```text
src/
  App.tsx                    navegación y exportaciones
  types.ts                   contratos de datos
  components/
    Workspace.tsx            lienzo e interacciones espaciales
    Card.tsx                 tarjetas y puntos de conexión
    Editor.tsx               contenido, fuentes y universos
    Drawing.tsx              lápiz y anotaciones
    Explore.tsx              investigación contextual
    Journal.tsx              momentos, narración y versiones
    Projects.tsx             biblioteca personal
    Modal.tsx                diálogo nativo accesible
    FormattedText.tsx         formato seguro sin HTML arbitrario
  lib/
    db.ts                    IndexedDB y archivos
    store.ts                 Zustand, historial y autoguardado
    files.ts                 importación y exportación validada
    catalog.ts               conocimiento de demostración
    demo.ts                  proyecto opcional de ejemplo
    hooks.ts                 gestión de URLs de archivos
server/index.mjs             API opcional con secreto en servidor
tests/unit/                  lógica, persistencia y servidor
tests/e2e/                   flujos funcionales en Chromium
```

React Flow proporciona navegación, gestos y nodos redimensionables; Zustand comparte el proyecto y Dexie conserva los datos. Se usa CSS propio con variables en lugar de Tailwind para controlar la composición editorial y los estados de impresión sin otra capa de herramientas. No se añade una biblioteca de animación: las transiciones discretas se resuelven con CSS y respetan movimiento reducido.

## Alcance pendiente

- IA multimodal desde la interfaz y prueba contra un proveedor real con credenciales.
- Búsqueda externa de imágenes/referentes, previsualización remota de enlaces y verificación de fuentes en tiempo real.
- Cuentas, colaboración, sincronización, almacenamiento remoto, autenticación y despliegue de la API de producción.
- Edición vectorial de trazos y capas: el dibujo/anotación actual se guarda como imagen; sobre una ilustración se aplana con el fondo.
- Accesibilidad del dibujo a mano sin dispositivo apuntador y navegación espacial avanzada con teclado. Los formularios, diálogos y controles sí funcionan con teclado.
- Historial de deshacer entre sesiones, recolección segura de archivos huérfanos y agrupaciones anidadas avanzadas.

Estas capacidades no se presentan como disponibles en la interfaz. La exportación a PDF usa el diálogo de impresión del navegador, con una hoja imprimible real; no depende de un servicio externo.

## Validación realizada

Se ejecutaron correctamente `npm ci`, `npm test` (8 pruebas), `npm run test:e2e` (9 flujos en Chromium que cubren los 12 escenarios solicitados y comprobaciones adicionales) y `npm run build`. Se revisó visualmente la interfaz a 1440 × 1000 y 390 × 844. Las pruebas generaron un PNG descargable y un documento PDF real a partir del diario. El build de producción también se abrió en Chromium y se comprobó la creación de una nota y su recuperación tras recargar, sin errores de JavaScript.

La IA con credenciales y la búsqueda externa no se validaron: son integraciones opcionales pendientes, como se detalla arriba.
