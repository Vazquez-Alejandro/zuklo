"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/toast";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});

  function validate(): boolean {
    const errs: { email?: string } = {};
    if (!email) {
      errs.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Ingresá un email válido";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!validate()) return;
    setLoading(true);

    const result = await forgotPassword(email);

    if (result.error) {
      setError(result.error);
      showToast(result.error, "error");
      setLoading(false);
      return;
    }

    if (result.message) {
      setMessage(result.message);
      showToast(result.message, "success");
    } else {
      showToast("Email de recuperación enviado", "success");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="text-emerald-400">Zuklo</span>
          </h1>
          <p className="text-slate-400 mt-2">Recuperá tu contraseña</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-3 text-emerald-300 text-sm">
                {message}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors({ email: undefined }); }}
                placeholder="tu@email.com"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {fieldErrors.email && <p className="text-red-400 text-sm mt-1">{fieldErrors.email}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? "Enviando..." : "Enviar email de recuperación"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}
