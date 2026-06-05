"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { PLANS, type PlanId } from "@/lib/stripe";
import { useToast } from "@/components/toast";
import { EmptyState } from "@/components/empty-state";

interface BillingData {
  plan: {
    plan: string;
    price: string;
    alerts: string;
    filters: string;
    features: string[];
  };
  usage: {
    searchAlerts: number;
    filters: number;
    tenantProfiles: number;
    pdfExports: number;
  };
  subscription: {
    planId: PlanId;
    isPremium: boolean;
  };
}

const PLAN_ORDER: PlanId[] = ["free", "premium", "pro"];

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function BillingPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch("/api/billing");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setBilling(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar datos de facturación");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function handleCheckout(planId: PlanId) {
    setActionLoading(planId);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout", planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al iniciar checkout";
      showToast(msg, "error");
      setActionLoading(null);
    }
  }

  async function handlePortal() {
    setActionLoading("portal");
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "portal" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al abrir portal de facturación";
      showToast(msg, "error");
      setActionLoading(null);
    }
  }

  async function handleCancel() {
    setActionLoading("cancel");
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowCancelConfirm(false);
      showToast("Suscripción cancelada", "success");
      const updated = await fetch("/api/billing");
      const updatedData = await updated.json();
      if (updated.ok) setBilling(updatedData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cancelar suscripción";
      showToast(msg, "error");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Facturación</h1>
          <p className="text-slate-400 mt-1">Gestioná tu plan y suscripción</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <EmptyState
            iconSvg={
              <svg className="w-16 h-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            }
            title="Error al cargar facturación"
            description="No pudimos cargar tu información de facturación"
            actionLabel="Reintentar"
            onAction={() => { setError(""); setLoading(true); window.location.reload(); }}
          />
        )}

        {!loading && billing && (
          <>
            {/* Current Plan Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Plan actual</p>
                  <h2 className="text-xl font-bold text-white">{billing.plan.plan}</h2>
                  <p className="text-emerald-400 font-semibold mt-1">{billing.plan.price}</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {billing.subscription.planId !== "free" && (
                    <button
                      onClick={handlePortal}
                      disabled={actionLoading === "portal"}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors disabled:opacity-50"
                    >
                      {actionLoading === "portal" ? "Abriendo..." : "Gestionar facturación"}
                    </button>
                  )}
                  {billing.subscription.planId === "free" && (
                    <button
                      onClick={() => handleCheckout("premium")}
                      disabled={!!actionLoading}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
                    >
                      {actionLoading === "premium" ? "Procesando..." : "Mejorar a Premium"}
                    </button>
                  )}
                </div>
              </div>

              {/* Features included */}
              {billing.plan.features.length > 0 && (
                <div className="mt-5 pt-5 border-t border-slate-700">
                  <p className="text-sm text-slate-400 mb-3">Incluido en tu plan:</p>
                  <div className="flex flex-wrap gap-2">
                    {billing.plan.features.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      >
                        <CheckIcon />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Usage Stats */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Uso este mes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Alertas de búsqueda", value: billing.usage.searchAlerts, limit: billing.plan.alerts },
                  { label: "Filtros creados", value: billing.usage.filters, limit: billing.plan.filters },
                  { label: "Perfiles de inquilino", value: billing.usage.tenantProfiles, limit: billing.subscription.isPremium ? "Ilimitado" : "0" },
                  { label: "Exportaciones PDF", value: billing.usage.pdfExports, limit: billing.subscription.isPremium ? "Ilimitado" : "—" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700"
                  >
                    <p className="text-sm text-slate-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {typeof stat.limit === "number" ? `de ${stat.limit}` : stat.limit}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan Comparison */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Planes disponibles</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {PLAN_ORDER.map((planId) => {
                  const plan = PLANS[planId];
                  const isCurrent = billing.subscription.planId === planId;
                  const isUpgrade = PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(billing.subscription.planId);

                  return (
                    <div
                      key={planId}
                      className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border transition-colors ${
                        isCurrent
                          ? "border-emerald-500/50 ring-1 ring-emerald-500/20"
                          : "border-slate-700"
                      }`}
                    >
                      {isCurrent && (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-4">
                          Plan actual
                        </span>
                      )}

                      <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                      <p className="text-2xl font-bold text-white mt-2">
                        {plan.price === 0 ? "Gratis" : `$${plan.price.toLocaleString("es-AR")}`}
                        {plan.price > 0 && <span className="text-sm font-normal text-slate-400">/mes</span>}
                      </p>
                      <p className="text-sm text-slate-400 mt-2">{plan.description}</p>

                      <ul className="mt-5 space-y-2.5">
                        {[
                          {
                            label: `${plan.features.maxSearchAlerts === -1 ? "Ilimitadas" : plan.features.maxSearchAlerts} alertas de búsqueda`,
                            included: true,
                          },
                          {
                            label: `${plan.features.maxFilters === -1 ? "Ilimitados" : plan.features.maxFilters} filtros`,
                            included: true,
                          },
                          { label: "Alertas en tiempo real", included: plan.features.realTimeAlerts },
                          { label: "Ficha de inquilino", included: plan.features.tenantProfile },
                          { label: "Calculadora de aumentos", included: plan.features.rentCalculator },
                          { label: "Soporte prioritario", included: plan.features.prioritySupport },
                          { label: "Multi-propiedad", included: !!(plan.features as Record<string, unknown>).multiProperty },
                          { label: "Analytics avanzados", included: !!(plan.features as Record<string, unknown>).analytics },
                        ].map((feature) => (
                          <li key={feature.label} className="flex items-center gap-2 text-sm">
                            {feature.included ? <CheckIcon /> : <XIcon />}
                            <span className={feature.included ? "text-slate-300" : "text-slate-500"}>
                              {feature.label}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-6">
                        {isCurrent ? (
                          <button
                            disabled
                            className="w-full py-2.5 rounded-xl text-sm font-medium bg-slate-700/50 text-slate-400 cursor-not-allowed"
                          >
                            Plan actual
                          </button>
                        ) : planId === "free" ? (
                          <button
                            disabled
                            className="w-full py-2.5 rounded-xl text-sm font-medium bg-slate-700/50 text-slate-400 cursor-not-allowed"
                          >
                            Plan base
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCheckout(planId)}
                            disabled={!!actionLoading}
                            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                              isUpgrade
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                : "bg-slate-700 hover:bg-slate-600 text-white"
                            }`}
                          >
                            {actionLoading === planId ? "Procesando..." : isUpgrade ? "Mejorar plan" : "Cambiar plan"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cancel Subscription */}
            {billing.subscription.planId !== "free" && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-red-500/20">
                <h3 className="text-lg font-semibold text-white">Cancelar suscripción</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Si cancelás, vas a seguir teniendo acceso hasta el final del período de facturación actual.
                </p>

                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors"
                  >
                    Cancelar suscripción
                  </button>
                ) : (
                  <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <p className="text-sm text-red-300">¿Estás seguro?</p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleCancel}
                        disabled={actionLoading === "cancel"}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                      >
                        {actionLoading === "cancel" ? "Cancelando..." : "Sí, cancelar"}
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                      >
                        No, volver
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
