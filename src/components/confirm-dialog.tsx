"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  danger = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    cancelRef.current?.focus();
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl bg-slate-800 border border-slate-700/50 shadow-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-slate-300">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            ref={cancelRef}
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer ${
              danger
                ? "bg-red-500 hover:bg-red-400"
                : "bg-emerald-500 hover:bg-emerald-400"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
