import { useEffect, useRef, useState } from "react";
import { Eraser, Pencil, Undo2 } from "lucide-react";
import { Modal } from "./Modal";
export function Drawing({
  background,
  onSave,
  onClose,
}: {
  background?: string;
  onSave: (blob: Blob) => Promise<void>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const base = useRef<HTMLImageElement | null>(null);
  const drawing = useRef(false);
  const history = useRef<ImageData[]>([]);
  const [color, setColor] = useState("#4b4d42");
  const [width, setWidth] = useState(3);
  const [erase, setErase] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (background) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        base.current = img;
      };
      img.onerror = () => setError("No se pudo cargar la imagen para anotar.");
      img.src = background;
    }
  }, [background]);
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * 900) / rect.width,
      y: ((e.clientY - rect.top) * 600) / rect.height,
    };
  };
  return (
    <Modal
      title={background ? "Dibujar una observación" : "Pensar con la mano"}
      wide
      onClose={onClose}
    >
      <div className="drawing-tools">
        <button
          className={!erase ? "active" : ""}
          onClick={() => setErase(false)}
          title="Lápiz"
        >
          <Pencil size={18} />
        </button>
        <button
          className={erase ? "active" : ""}
          onClick={() => setErase(true)}
          title="Borrador"
        >
          <Eraser size={18} />
        </button>
        <label className="inline-label">
          Tinta{" "}
          <input
            aria-label="Color del lápiz"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
        <label className="inline-label">
          Grosor{" "}
          <input
            aria-label="Grosor del lápiz"
            type="range"
            min="1"
            max="25"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
        </label>
        <button
          title="Deshacer trazo"
          onClick={() => {
            const ctx = ref.current?.getContext("2d"),
              last = history.current.pop();
            if (ctx && last) ctx.putImageData(last, 0, 0);
          }}
        >
          <Undo2 size={18} />
        </button>
      </div>
      <div
        className="drawing-surface"
        style={{
          backgroundImage: background ? `url("${background}")` : undefined,
        }}
      >
        <canvas
          ref={ref}
          width={900}
          height={600}
          aria-label="Lienzo de dibujo"
          onPointerDown={(e) => {
            const ctx = e.currentTarget.getContext("2d");
            if (!ctx) return;
            history.current.push(ctx.getImageData(0, 0, 900, 600));
            history.current = history.current.slice(-20);
            drawing.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            const p = point(e);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineWidth =
              width * (e.pointerType === "pen" ? Math.max(0.3, e.pressure) : 1);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = color;
            ctx.globalCompositeOperation = erase
              ? "destination-out"
              : "source-over";
            ctx.lineTo(p.x + 0.1, p.y + 0.1);
            ctx.stroke();
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = e.currentTarget.getContext("2d")!,
              p = point(e);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }}
          onPointerUp={() => {
            drawing.current = false;
          }}
          onPointerCancel={() => {
            drawing.current = false;
          }}
        />
      </div>
      <p className="muted">
        Mouse, lápiz o dedo. Tus trazos se guardan como una imagen propia.
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="modal-actions">
        <button className="secondary" onClick={onClose}>
          Cancelar
        </button>
        <button
          className="primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const out = document.createElement("canvas");
              out.width = 900;
              out.height = 600;
              const ctx = out.getContext("2d")!;
              ctx.fillStyle = "#f5f1e7";
              ctx.fillRect(0, 0, 900, 600);
              if (background && !base.current)
                throw new Error("Espera a que termine de cargar la imagen.");
              if (base.current) {
                const image = base.current;
                const scale = Math.min(
                  900 / image.naturalWidth,
                  600 / image.naturalHeight,
                );
                const w = image.naturalWidth * scale,
                  h = image.naturalHeight * scale;
                ctx.drawImage(image, (900 - w) / 2, (600 - h) / 2, w, h);
              }
              ctx.drawImage(ref.current!, 0, 0);
              const blob = await new Promise<Blob>((resolve, reject) =>
                out.toBlob(
                  (b) =>
                    b
                      ? resolve(b)
                      : reject(new Error("No se pudo guardar el dibujo.")),
                  "image/png",
                ),
              );
              await onSave(blob);
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "No se pudo guardar el dibujo.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Guardando…" : "Añadir al lienzo ↗"}
        </button>
      </div>
    </Modal>
  );
}
