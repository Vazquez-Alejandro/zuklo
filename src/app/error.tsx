"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-white">
      <div className="text-center px-4 max-w-md">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-2xl font-bold mb-2">Algo salió mal</h1>
        <p className="text-slate-400 mb-2">
          Ocurrió un error inesperado. Nuestro equipo fue notificado.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-500 mb-6 font-mono">Error: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
