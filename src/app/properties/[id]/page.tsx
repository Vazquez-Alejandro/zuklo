"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";

interface Property {
  id: string;
  portal: string;
  portalId: string;
  url: string;
  title: string;
  description: string | null;
  price: string;
  currency: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  lat: number | null;
  lng: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: string | null;
  areaUnit: string | null;
  parkingSpaces: number | null;
  furnished: boolean | null;
  petFriendly: boolean | null;
  images: string[];
  mainImage: string | null;
  expenses: string | null;
  publishedAt: string | null;
  scrapedAt: string;
  createdAt: string;
  landlordName: string | null;
  landlordPhone: string | null;
  landlordEmail: string | null;
}

function ContactForm({ propertyId, propertyTitle }: { propertyId: string; propertyTitle: string }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (message.length < 10) {
      setError("El mensaje debe tener al menos 10 caracteres");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ propertyId, message }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Error al enviar");
        return;
      }
      setSent(true);
    } catch {
      setError("Error de conexión");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
      <h2 className="text-lg font-semibold text-white mb-1">Contactar sobre esta propiedad</h2>
      <p className="text-sm text-slate-400 mb-4">Enviá tu consulta al propietario o inmobiliaria</p>

      {sent ? (
        <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4 text-center">
          <svg className="w-8 h-8 text-emerald-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <p className="text-emerald-300 font-medium">Consulta enviada correctamente</p>
          <p className="text-sm text-slate-400 mt-1">Te responderán pronto por email</p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-3">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm">
              {error}
            </div>
          )}
          <textarea
            value={message}
            onChange={(e) => { setMessage(e.target.value); setError(""); }}
            placeholder="Hola, me interesa esta propiedad. ¿Se puede coordinar una visita?"
            rows={4}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
          <button
            type="submit"
            disabled={sending || message.length < 10}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors"
          >
            {sending ? "Enviando..." : "Enviar consulta"}
          </button>
        </form>
      )}
    </div>
  );
}

function formatPrice(price: string, currency: string) {
  const num = parseFloat(price);
  if (isNaN(num)) return "Consultar";
  if (currency === "USD") {
    return `USD ${num.toLocaleString("es-AR")}`;
  }
  return `$ ${num.toLocaleString("es-AR")}`;
}

function getPortalName(portal: string) {
  const names: Record<string, string> = {
    zonaprop: "Zonaprop",
    argenprop: "Argenprop",
  };
  return names[portal] || portal;
}

function getPortalColor(portal: string) {
  const colors: Record<string, string> = {
    zonaprop: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    argenprop: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };
  return colors[portal] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    async function fetchProperty() {
      try {
        const res = await fetch(`/api/properties/${params.id}`, {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          setError("Propiedad no encontrada");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setProperty(data.property);
      } catch {
        setError("Error al cargar la propiedad");
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [params.id, router]);

  useEffect(() => {
    if (!property) return;
    fetch(`/api/favorites`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.favorites) {
          setIsFavorite(data.favorites.some((f: any) => f.propertyId === property.id));
        }
      })
      .catch(() => {});
  }, [property?.id]);

  async function toggleFavorite() {
    if (!property) return;
    setFavLoading(true);
    try {
      if (isFavorite) {
        await fetch(`/api/favorites?propertyId=${property.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        setIsFavorite(false);
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ propertyId: property.id }),
        });
        setIsFavorite(true);
      }
    } catch {}
    setFavLoading(false);
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-700/50 rounded w-1/3" />
            <div className="h-64 bg-slate-700/50 rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-slate-700/50 rounded-xl" />
              <div className="h-20 bg-slate-700/50 rounded-xl" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !property) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-16 text-center px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">{error || "Propiedad no encontrada"}</h1>
          <Link href="/properties" className="text-emerald-400 hover:text-emerald-300 text-sm">
            ← Volver a propiedades
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/properties" className="hover:text-emerald-400 transition-colors">
            Propiedades
          </Link>
          <span>/</span>
          <span className="text-slate-300 truncate">{property.title}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPortalColor(property.portal)}`}>
                {getPortalName(property.portal)}
              </span>
              {property.expenses && property.expenses !== "0" && (
                <span className="text-xs text-slate-400">
                  Expensas: ${parseInt(property.expenses).toLocaleString("es-AR")}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">{property.title}</h1>
            {property.address && (
              <p className="text-slate-400 mt-1 flex items-center gap-1.5">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {property.address}
                {property.city ? `, ${property.city}` : ""}
                {property.state ? `, ${property.state}` : ""}
              </p>
            )}
          </div>

          <div className="sm:text-right shrink-0">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-400">
              {formatPrice(property.price, property.currency)}
            </p>
            {property.currency === "ARS" && (
              <p className="text-xs text-slate-400 mt-1">
                ~USD {Math.round(parseFloat(property.price) / 1200).toLocaleString("es-AR")}
              </p>
            )}
          </div>
        </div>

        {/* Image placeholder */}
        <div className="bg-slate-800/50 rounded-2xl h-64 sm:h-80 flex items-center justify-center border border-slate-700 overflow-hidden">
          {property.mainImage || property.images?.[0] ? (
            <img
              src={property.mainImage || property.images?.[0]}
              alt={property.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="text-center">
              <svg className="w-12 h-12 text-slate-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
              </svg>
              <p className="text-slate-500 text-sm">Sin imágenes</p>
            </div>
          )}
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Dormitorios",
              value: property.bedrooms,
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              ),
            },
            {
              label: "Baños",
              value: property.bathrooms,
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              label: "Superficie",
              value: property.area && property.area !== "0" ? `${property.area} ${property.areaUnit || "m2"}` : null,
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              ),
            },
            {
              label: "Estacionamiento",
              value: property.parkingSpaces && property.parkingSpaces > 0 ? property.parkingSpaces : null,
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              ),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center"
            >
              <div className="text-emerald-400 flex justify-center mb-1">{item.icon}</div>
              <p className="text-lg font-semibold text-white">
                {item.value ?? "—"}
              </p>
              <p className="text-xs text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {property.furnished && (
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
              Amueblado
            </span>
          )}
          {property.petFriendly && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30">
              Acepta mascotas
            </span>
          )}
          {property.expenses && property.expenses !== "0" && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/30">
              Expensas: ${parseInt(property.expenses).toLocaleString("es-AR")}
            </span>
          )}
        </div>

        {/* Description */}
        {property.description && (
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-3">Descripción</h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{property.description}</p>
          </div>
        )}

        {/* Details */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Detalles</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {property.city && (
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Ciudad</span>
                <span className="text-white">{property.city}</span>
              </div>
            )}
            {property.state && (
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Provincia</span>
                <span className="text-white">{property.state}</span>
              </div>
            )}
            {property.country && (
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">País</span>
                <span className="text-white">{property.country}</span>
              </div>
            )}
            {property.zip && (
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Código postal</span>
                <span className="text-white">{property.zip}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-slate-700/50">
              <span className="text-slate-400">Portal</span>
              <span className="text-white">{getPortalName(property.portal)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-700/50">
              <span className="text-slate-400">Publicado</span>
              <span className="text-white">
                {property.publishedAt
                  ? new Date(property.publishedAt).toLocaleDateString("es-AR")
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={toggleFavorite}
            disabled={favLoading}
            className={`flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-xl transition-colors border ${
              isFavorite
                ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                : "bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
            }`}
          >
            <svg className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            {isFavorite ? "Guardada" : "Guardar"}
          </button>
          <a
            href={property.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl text-center transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Ver en {getPortalName(property.portal)}
          </a>
          <Link
            href="/properties"
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-xl text-center transition-colors"
          >
            ← Volver
          </Link>
        </div>

        {/* Contact Form */}
        <ContactForm propertyId={property.id} propertyTitle={property.title} />
      </div>
    </DashboardLayout>
  );
}
