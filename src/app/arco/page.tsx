"use client";

import { useState } from "react";

const SOLICITUDES = ["Acceso", "Rectificación", "Cancelación", "Oposición"] as const;

type SolicitudTipo = (typeof SOLICITUDES)[number];

interface FormData {
  nombre: string;
  email: string;
  dni: string;
  tipoSolicitud: SolicitudTipo | "";
  detalle: string;
}

interface FormErrors {
  nombre?: string;
  email?: string;
  dni?: string;
  tipoSolicitud?: string;
  detalle?: string;
}

export default function ARCOPage() {
  const [form, setForm] = useState<FormData>({
    nombre: "",
    email: "",
    dni: "",
    tipoSolicitud: "",
    detalle: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!form.nombre.trim()) errs.nombre = "El nombre es requerido";
    if (!form.email.trim()) {
      errs.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Email inválido";
    }
    if (!form.dni.trim()) {
      errs.dni = "El DNI es requerido";
    } else if (!/^\d{7,8}$/.test(form.dni.trim())) {
      errs.dni = "DNI inválido (7 u 8 dígitos)";
    }
    if (!form.tipoSolicitud) errs.tipoSolicitud = "Seleccione un tipo de solicitud";
    if (!form.detalle.trim()) errs.detalle = "Describa su solicitud";
    return errs;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/arco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error || "Error al enviar la solicitud");
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError("Error de conexión. Intente nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center px-4">
        <div className="max-w-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Solicitud enviada</h1>
          <p className="text-slate-400">
            Hemos recibido su solicitud de derechos ARCO. Será procesada en un plazo de 10 días hábiles
            conforme a la Ley 25.326. Recibirá una respuesta en <span className="text-emerald-400">{form.email}</span>.
          </p>
          <a
            href="/"
            className="inline-block rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-6 py-3 transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Ejercer Derechos ARCO</h1>
        <p className="text-slate-400 text-sm mb-10">Ley 25.326 de Protección de Datos Personales</p>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-10 text-slate-300 text-sm leading-relaxed space-y-3">
          <p>
            La <strong className="text-white">Ley 25.326</strong> de Protección de Datos Personales le otorga
            los siguientes derechos sobre sus datos personales:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-emerald-400">Acceso:</strong> Conocer qué datos personales tenemos sobre usted y cómo los utilizamos.</li>
            <li><strong className="text-emerald-400">Rectificación:</strong> Solicitar la corrección de datos inexactos o incompletos.</li>
            <li><strong className="text-emerald-400">Cancelación:</strong> Solicitar la eliminación de sus datos cuando ya no sean necesarios para la finalidad que motivó su recolección.</li>
            <li><strong className="text-emerald-400">Oposición:</strong> Oponerse al tratamiento de sus datos para fines específicos.</li>
          </ul>
          <p>
            La APDN (Autoridad de Acceso a la Información Pública) es el organismo de control.
            Plazo de respuesta: <strong className="text-white">10 días hábiles</strong> desde la recepción de la solicitud.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-slate-300 mb-1.5">
              Nombre completo *
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
              placeholder="Juan Pérez"
            />
            {errors.nombre && <p className="mt-1 text-xs text-red-400">{errors.nombre}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Correo electrónico *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
              placeholder="juan@ejemplo.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="dni" className="block text-sm font-medium text-slate-300 mb-1.5">
              DNI *
            </label>
            <input
              id="dni"
              name="dni"
              type="text"
              value={form.dni}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
              placeholder="12345678"
              maxLength={8}
            />
            {errors.dni && <p className="mt-1 text-xs text-red-400">{errors.dni}</p>}
          </div>

          <div>
            <label htmlFor="tipoSolicitud" className="block text-sm font-medium text-slate-300 mb-1.5">
              Tipo de solicitud *
            </label>
            <select
              id="tipoSolicitud"
              name="tipoSolicitud"
              value={form.tipoSolicitud}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
            >
              <option value="" disabled>
                Seleccione una opción
              </option>
              {SOLICITUDES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.tipoSolicitud && <p className="mt-1 text-xs text-red-400">{errors.tipoSolicitud}</p>}
          </div>

          <div>
            <label htmlFor="detalle" className="block text-sm font-medium text-slate-300 mb-1.5">
              Detalle de la solicitud *
            </label>
            <textarea
              id="detalle"
              name="detalle"
              value={form.detalle}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors resize-y"
              placeholder="Describa con detalle su solicitud..."
            />
            {errors.detalle && <p className="mt-1 text-xs text-red-400">{errors.detalle}</p>}
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-3 transition-colors cursor-pointer"
          >
            {submitting ? "Enviando..." : "Enviar solicitud"}
          </button>

          <p className="text-slate-500 text-xs text-center">
            Los campos marcados con * son obligatorios. Sus datos serán tratados conforme a nuestra{" "}
            <a href="/privacy" className="text-emerald-400 hover:text-emerald-300 underline">
              Política de Privacidad
            </a>.
          </p>
        </form>
      </div>
    </div>
  );
}
