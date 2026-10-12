"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es-AR">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24, textAlign: "center" }}>
        <h1>Algo salió mal</h1>
        <p>Probá recargar la página en un momento.</p>
        <button type="button" onClick={reset} style={{ padding: "12px 20px", borderRadius: 16 }}>
          Reintentar
        </button>
      </body>
    </html>
  );
}
