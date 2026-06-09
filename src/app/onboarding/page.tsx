"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/toast";

const STEPS = [
  {
    title: "Bienvenido a Zuklo",
    desc: "Configurá tu cuenta en 3 pasos simples.",
    icon: "🏠",
  },
  {
    title: "¿Qué buscás?",
    desc: "Elegí el tipo de propiedad que te interesa.",
    icon: "🔍",
  },
  {
    title: "¿Dónde?",
    desc: "Elegí la zona preferida.",
    icon: "📍",
  },
];

const PROPERTY_TYPES = [
  { id: "departamento", label: "Departamento", icon: "🏢" },
  { id: "casa", label: "Casa", icon: "🏡" },
  { id: "ph", label: "PH", icon: "🏘️" },
  { id: "local", label: "Local comercial", icon: "🏪" },
  { id: "oficina", label: "Oficina", icon: "🏬" },
  { id: "terreno", label: "Terreno", icon: "🌳" },
];

const ZONES = [
  "Palermo", "Recoleta", "Belgrano", "Nuñez", "Villa Crespo",
  "Caballito", "San Telmo", "Flores", "Microcentro", "Balvanera",
  "Almagro", "Boedo", "Villa Urquiza", "Coghlan", "Saavedra",
  "Martinez", "Vicente Lopez", "San Isidro", "San Miguel", "Tigre",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggleType(id: string) {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function toggleZone(zone: string) {
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  }

  async function handleFinish() {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          personalInfo: {
            onboardingCompleted: true,
            propertyTypes: selectedTypes,
            preferredZones: selectedZones,
          },
        }),
      });

      if (acceptedTerms) {
        await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "accept-terms" }),
        });
      }

      showToast("¡Configuración completada!", "success");
      router.push("/dashboard");
    } catch {
      showToast("Error al guardar", "error");
      router.push("/dashboard");
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-emerald-500" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-700">
          <div className="text-center mb-6">
            <span className="text-4xl mb-3 block">{STEPS[step].icon}</span>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{STEPS[step].title}</h1>
            <p className="text-slate-400 mt-2">{STEPS[step].desc}</p>
          </div>

          {step === 0 && (
            <div className="mb-6">
              <div className="flex items-start gap-3">
                <input
                  id="onb-terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-700/50 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="onb-terms" className="text-sm text-slate-400">
                  Acepto los{" "}
                  <Link href="/terms" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline">
                    Términos y Condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link href="/privacy" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline">
                    Política de Privacidad
                  </Link>
                </label>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => toggleType(type.id)}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    selectedTypes.includes(type.id)
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-slate-700/30 border-slate-600/50 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <span className="text-2xl block mb-1">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {ZONES.map((zone) => (
                <button
                  key={zone}
                  onClick={() => toggleZone(zone)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedZones.includes(zone)
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-slate-700/30 border-slate-600/50 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Atrás
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => {
                  if (step === 0 && !acceptedTerms) {
                    showToast("Debés aceptar los Términos y Condiciones", "error");
                    return;
                  }
                  setStep(step + 1);
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {saving ? "Guardando..." : "¡Listo!"}
              </button>
            )}
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full text-center text-sm text-slate-400 hover:text-slate-300 mt-4 transition-colors"
          >
            Saltar por ahora
          </button>
        </div>
      </div>
    </div>
  );
}
