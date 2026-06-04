"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "cookie-consent-accepted";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-sm px-6 py-4 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-slate-300 text-sm leading-relaxed">
          Usamos cookies para mejorar tu experiencia. Al continuar navegando, aceptás nuestro uso de cookies.{" "}
          <a href="/privacy" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
            Más info
          </a>
        </p>
        <button
          onClick={accept}
          className="shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-5 py-2 transition-colors cursor-pointer"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
