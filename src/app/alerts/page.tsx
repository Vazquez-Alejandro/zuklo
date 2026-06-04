"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/toast";

interface Filter {
  id: string;
  name: string;
  priceRange?: { min?: number; max?: number };
  location?: { cities?: string[]; country?: string };
  features?: { minBedrooms?: number; maxBedrooms?: number; minBathrooms?: number };
  portals?: string[];
  keywords?: string[];
  notification?: { enabled?: boolean };
  status?: string;
  createdAt?: string;
}

interface FilterForm {
  name: string;
  priceMin: string;
  priceMax: string;
  cities: string;
  country: string;
  minBedrooms: string;
  maxBedrooms: string;
  minBathrooms: string;
  portals: string;
  keywords: string;
  notificationsEnabled: boolean;
}

const emptyForm: FilterForm = {
  name: "",
  priceMin: "",
  priceMax: "",
  cities: "",
  country: "",
  minBedrooms: "",
  maxBedrooms: "",
  minBathrooms: "",
  portals: "",
  keywords: "",
  notificationsEnabled: true,
};

export default function AlertsPage() {
  useAuth();
  const { showToast } = useToast();
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FilterForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; price?: string }>({});

  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await fetch("/api/filters");
        if (res.ok) {
          const data = await res.json();
          setFilters(data.filters ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchFilters();
  }, []);

  function updateField<K extends keyof FilterForm>(key: K, value: FilterForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateForm(): boolean {
    const errs: { name?: string; price?: string } = {};
    if (!form.name.trim()) errs.name = "El nombre es requerido";
    const min = form.priceMin ? Number(form.priceMin) : 0;
    const max = form.priceMax ? Number(form.priceMax) : 0;
    if (min > 0 && max > 0 && min > max) {
      errs.price = "El precio mínimo no puede superar el máximo";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    setError("");
    setSuccess("");

    const payload: Record<string, unknown> = {
      name: form.name,
      priceRange: {
        ...(form.priceMin && { min: Number(form.priceMin) }),
        ...(form.priceMax && { max: Number(form.priceMax) }),
      },
      location: {
        cities: form.cities.split(",").map((c) => c.trim()).filter(Boolean),
        country: form.country.trim(),
      },
      features: {
        ...(form.minBedrooms && { minBedrooms: Number(form.minBedrooms) }),
        ...(form.maxBedrooms && { maxBedrooms: Number(form.maxBedrooms) }),
        ...(form.minBathrooms && { minBathrooms: Number(form.minBathrooms) }),
      },
      portals: form.portals.split(",").map((p) => p.trim()).filter(Boolean),
      keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      notification: { enabled: form.notificationsEnabled },
    };

    try {
      const res = await fetch("/api/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear filtro");
        return;
      }

      if (data.filter) {
        setFilters((prev) => [data.filter, ...prev]);
      }
      setForm(emptyForm);
      setShowForm(false);
      setSuccess("Filtro creado correctamente");
      showToast("Filtro creado correctamente", "success");
    } catch {
      setError("Error de conexion");
      showToast("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(filterId: string) {
    if (!confirm("¿Eliminar este filtro?")) return;

    try {
      const res = await fetch(`/api/filters?filterId=${filterId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setFilters((prev) => prev.filter((f) => f.id !== filterId));
        showToast("Filtro eliminado", "success");
      } else {
        showToast("Error al eliminar filtro", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Alertas y Filtros</h1>
            <p className="text-slate-400 mt-1">Configurá alertas para encontrar propiedades ideales</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            {showForm ? "Cancelar" : "Crear Filtro"}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-3 text-emerald-300 text-sm">
            {success}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 space-y-5"
          >
            <h2 className="text-lg font-semibold text-white">Nuevo Filtro</h2>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Nombre</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => { updateField("name", e.target.value); setFieldErrors((p) => ({ ...p, name: undefined })); }}
                placeholder="Ej: Depto Palermo"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {fieldErrors.name && <p className="text-red-400 text-sm mt-1">{fieldErrors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Precio mínimo</label>
                <input
                  type="number"
                  min="0"
                  value={form.priceMin}
                  onChange={(e) => { updateField("priceMin", e.target.value); setFieldErrors((p) => ({ ...p, price: undefined })); }}
                  placeholder="0"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Precio máximo</label>
                <input
                  type="number"
                  min="0"
                  value={form.priceMax}
                  onChange={(e) => { updateField("priceMax", e.target.value); setFieldErrors((p) => ({ ...p, price: undefined })); }}
                  placeholder="Sin límite"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {fieldErrors.price && <p className="text-red-400 text-sm mt-1">{fieldErrors.price}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Ciudades (separadas por coma)</label>
                <input
                  type="text"
                  value={form.cities}
                  onChange={(e) => updateField("cities", e.target.value)}
                  placeholder="Palermo, Belgrano"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">País</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  placeholder="Argentina"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Min. dormitorios</label>
                <input
                  type="number"
                  min="0"
                  value={form.minBedrooms}
                  onChange={(e) => updateField("minBedrooms", e.target.value)}
                  placeholder="1"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Max. dormitorios</label>
                <input
                  type="number"
                  min="0"
                  value={form.maxBedrooms}
                  onChange={(e) => updateField("maxBedrooms", e.target.value)}
                  placeholder="Sin límite"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Min. baños</label>
                <input
                  type="number"
                  min="0"
                  value={form.minBathrooms}
                  onChange={(e) => updateField("minBathrooms", e.target.value)}
                  placeholder="1"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Portales (separados por coma)</label>
              <input
                type="text"
                value={form.portals}
                onChange={(e) => updateField("portals", e.target.value)}
                placeholder="zona, argenprop, mercadolibre"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Palabras clave (separadas por coma)</label>
              <input
                type="text"
                value={form.keywords}
                onChange={(e) => updateField("keywords", e.target.value)}
                placeholder="amoblado, pet friendly"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateField("notificationsEnabled", !form.notificationsEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  form.notificationsEnabled ? "bg-emerald-500" : "bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    form.notificationsEnabled ? "translate-x-5" : ""
                  }`}
                />
              </button>
              <span className="text-sm text-slate-300">Notificaciones habilitadas</span>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(emptyForm); }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                {saving ? "Creando..." : "Crear filtro"}
              </button>
            </div>
          </form>
        )}

        {/* Filters List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400">Cargando filtros...</div>
          </div>
        ) : filters.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-10 border border-slate-700 text-center">
            <p className="text-slate-400">No tenés filtros creados</p>
            <p className="text-slate-500 text-sm mt-1">
              Creá un filtro para recibir alertas de propiedades nuevas
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filters.map((f) => (
              <div
                key={f.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold">{f.name}</h3>
                    {f.createdAt && (
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(f.createdAt).toLocaleDateString("es-AR")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        f.notification?.enabled !== false
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-600/30 text-slate-400 border border-slate-600"
                      }`}
                    >
                      {f.notification?.enabled !== false ? "Activo" : "Inactivo"}
                    </span>
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      title="Eliminar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {f.priceRange && (f.priceRange.min || f.priceRange.max) && (
                    <p className="text-slate-300">
                      <span className="text-slate-500">Precio: </span>
                      {f.priceRange.min ? `$${f.priceRange.min.toLocaleString()}` : "$0"} -{" "}
                      {f.priceRange.max ? `$${f.priceRange.max.toLocaleString()}` : "Sin límite"}
                    </p>
                  )}

                  {f.location?.cities && f.location.cities.length > 0 && (
                    <p className="text-slate-300">
                      <span className="text-slate-500">Ciudades: </span>
                      {f.location.cities.join(", ")}
                      {f.location.country && ` (${f.location.country})`}
                    </p>
                  )}

                  {f.features && (f.features.minBedrooms || f.features.maxBedrooms || f.features.minBathrooms) && (
                    <p className="text-slate-300">
                      <span className="text-slate-500">Habitaciones: </span>
                      {f.features.minBedrooms && f.features.maxBedrooms
                        ? `${f.features.minBedrooms}-${f.features.maxBedrooms}`
                        : f.features.minBedrooms
                        ? `${f.features.minBedrooms}+`
                        : f.features.maxBedrooms
                        ? `hasta ${f.features.maxBedrooms}`
                        : ""}
                      {f.features.minBathrooms && ` · ${f.features.minBathrooms}+ baños`}
                    </p>
                  )}

                  {f.portals && f.portals.length > 0 && (
                    <p className="text-slate-300">
                      <span className="text-slate-500">Portales: </span>
                      {f.portals.join(", ")}
                    </p>
                  )}

                  {f.keywords && f.keywords.length > 0 && (
                    <p className="text-slate-300">
                      <span className="text-slate-500">Keywords: </span>
                      {f.keywords.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
