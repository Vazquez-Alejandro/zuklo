"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/toast";
import { EmptyState } from "@/components/empty-state";

interface Property {
  id: string;
  portal: string;
  portalId: string;
  url: string;
  title: string;
  description?: string;
  price: string;
  currency: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  expenses?: string;
  images?: string[];
  mainImage?: string;
  publishedAt?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  search: string;
  portal: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  sortBy: string;
  sortOrder: string;
}

const emptyFilters: Filters = {
  search: "",
  portal: "",
  city: "",
  minPrice: "",
  maxPrice: "",
  bedrooms: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

const PORTALS = [
  { value: "", label: "Todos los portales" },
  { value: "zona", label: "Zona" },
  { value: "argenprop", label: "Argenprop" },
  { value: "mercadolibre", label: "MercadoLibre" },
  { value: "properati", label: "Properati" },
  { value: "inmuebles", label: "Inmuebles" },
  { value: "caba", label: "CABA" },
  { value: "casasydepartamentos", label: "Casas y Departamentos" },
  { value: "olx", label: "OLX" },
];

const PORTAL_COLORS: Record<string, string> = {
  zona: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  argenprop: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  mercadolibre: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  properati: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  inmuebles: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  caba: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  casas_y_departamentos: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  olx: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
};

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Mas reciente" },
  { value: "price:asc", label: "Menor precio" },
  { value: "price:desc", label: "Mayor precio" },
  { value: "bedrooms:desc", label: "Mas habitaciones" },
  { value: "area:desc", label: "Mayor superficie" },
];

const BEDROOM_OPTIONS = [
  { value: "", label: "Cualquier cantidad" },
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5+" },
];

const formatPrice = (price: string | number) => {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num) || num === 0) return null;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(num);
};

function createDebounced(fn: (value: string) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (value: string) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(value), ms);
  };
}

export default function PropertiesPage() {
  useAuth();
  const { showToast } = useToast();

  const [properties, setProperties] = useState<Property[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilters, setActiveFilters] = useState<Filters>(emptyFilters);

  const abortRef = useRef<AbortController | null>(null);

  const fetchProperties = useCallback(
    async (page: number, currentFilters: Filters) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (currentFilters.search) params.set("search", currentFilters.search);
      if (currentFilters.portal) params.set("portal", currentFilters.portal);
      if (currentFilters.city) params.set("city", currentFilters.city);
      if (currentFilters.minPrice) params.set("minPrice", currentFilters.minPrice);
      if (currentFilters.maxPrice) params.set("maxPrice", currentFilters.maxPrice);
      if (currentFilters.bedrooms) params.set("bedrooms", currentFilters.bedrooms);
      params.set("sortBy", currentFilters.sortBy);
      params.set("sortOrder", currentFilters.sortOrder);

      try {
        const res = await fetch(`/api/properties?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          if (res.status === 401) {
            showToast("Sesion expirada. Inicia sesion nuevamente.", "error");
            return;
          }
          throw new Error("Error al cargar propiedades");
        }

        const data = await res.json();
        setProperties(data.properties ?? []);
        setPagination(data.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Error al cargar propiedades. Intenta de nuevo.");
        showToast("Error al cargar propiedades", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchProperties(1, emptyFilters);
    return () => abortRef.current?.abort();
  }, [fetchProperties]);

  const applyFilters = useCallback(() => {
    setActiveFilters(filters);
    fetchProperties(1, filters);
  }, [filters, fetchProperties]);

  const clearFilters = useCallback(() => {
    setFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    fetchProperties(1, emptyFilters);
  }, [fetchProperties]);

  const debouncedSearchRef = useRef(
    createDebounced((value: string) => {
      setFilters((prev) => {
        const next = { ...prev, search: value };
        setActiveFilters(next);
        return next;
      });
    }, 300)
  );

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    debouncedSearchRef.current(value);
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchProperties(page, activeFilters);
  };

  const startIdx = (pagination.page - 1) * pagination.limit + 1;
  const endIdx = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Propiedades</h1>
            <p className="text-slate-400 mt-1">
              Explora las propiedades disponibles
            </p>
          </div>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-sm font-medium self-start sm:self-auto">
            {pagination.total} propiedades
          </span>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-slate-700 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 sticky top-0 z-10">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Buscar propiedades..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Portal */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Portal</label>
            <select
              value={filters.portal}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, portal: e.target.value }))
              }
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {PORTALS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Ciudad</label>
            <input
              type="text"
              placeholder="Ciudad"
              value={filters.city}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, city: e.target.value }))
              }
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Rango de precio
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, minPrice: e.target.value }))
                }
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))
                }
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Dormitorios
            </label>
            <select
              value={filters.bedrooms}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, bedrooms: e.target.value }))
              }
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {BEDROOM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Ordenar</label>
            <select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split(":");
                setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
              }}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
            <button
              onClick={applyFilters}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Aplicar filtros
            </button>
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden"
              >
                <div className="h-48 bg-slate-700/50 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-700/50 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-slate-700/50 rounded animate-pulse w-1/2" />
                  <div className="h-4 bg-slate-700/50 rounded animate-pulse w-2/3" />
                  <div className="flex gap-3 mt-2">
                    <div className="h-3 bg-slate-700/50 rounded animate-pulse w-12" />
                    <div className="h-3 bg-slate-700/50 rounded animate-pulse w-12" />
                    <div className="h-3 bg-slate-700/50 rounded animate-pulse w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <EmptyState
            iconSvg={
              <svg className="w-16 h-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            title="No se encontraron propiedades"
            description="Intentá ajustar los filtros de búsqueda"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((property) => {
              const priceFormatted = formatPrice(property.price);
              const expensesFormatted = formatPrice(property.expenses ?? "0");
              const hasExpenses =
                expensesFormatted && parseFloat(property.expenses ?? "0") > 0;

              return (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="block bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-slate-700/30">
                    {property.mainImage || (property.images && property.images.length > 0) ? (
                      <img
                        src={property.mainImage || property.images![0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg
                          className="w-12 h-12 text-slate-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V4.5A2.25 2.25 0 0019.5 2.25H4.5A2.25 2.25 0 002.25 4.5v13.5z"
                          />
                        </svg>
                      </div>
                    )}
                    <span
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        PORTAL_COLORS[property.portal] ??
                        "bg-slate-500/20 text-slate-300 border-slate-500/30"
                      }`}
                    >
                      {property.portal}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-2">
                      {property.title}
                    </h3>

                    {priceFormatted && (
                      <p className="text-emerald-400 font-bold text-lg mb-1">
                        {priceFormatted}
                      </p>
                    )}

                    {(property.address || property.city) && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-3">
                        <svg
                          className="w-3.5 h-3.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="truncate">
                          {[property.address, property.city]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}

                    {/* Features */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-auto mb-3">
                      {property.bedrooms != null && property.bedrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 12V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v5"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 12v5a2 2 0 002 2h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                          {property.bedrooms}
                        </span>
                      )}
                      {property.bathrooms != null && property.bathrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 12h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 14v4m16-4v4M6 14v4m12-4v4"
                            />
                          </svg>
                          {property.bathrooms}
                        </span>
                      )}
                      {property.area &&
                        parseFloat(property.area) > 0 && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                              />
                            </svg>
                            {property.area} m²
                          </span>
                        )}
                    </div>

                    {hasExpenses && (
                      <p className="text-xs text-slate-400 mb-3">
                        Expensas: {expensesFormatted}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-700/50">
                      {property.publishedAt ? (
                        <span className="text-xs text-slate-500">
                          {new Date(property.publishedAt).toLocaleDateString(
                            "es-AR"
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {new Date(property.createdAt).toLocaleDateString(
                            "es-AR"
                          )}
                        </span>
                      )}
                      <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                        Ver detalle
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-sm text-slate-400">
              Mostrando {startIdx}-{endIdx} de {pagination.total} propiedades
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-600 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-colors"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-400">
                Pagina {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-600 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
