"use client";

export default function SentryExamplePage() {
  function triggerError() {
    throw new Error("Sentry test error from Zuklo!");
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-white mb-4">Sentry Test</h1>
        <p className="text-slate-400 mb-6">
          Hacé clic en el botón para disparar un error de prueba y verificar que Sentry lo captura.
        </p>
        <button
          onClick={triggerError}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Trigger test error
        </button>
      </div>
    </div>
  );
}
