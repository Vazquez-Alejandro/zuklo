"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/toast";
import { EmptyState } from "@/components/empty-state";

interface ContractSummary {
  daysUntilEnd: number;
  daysUntilNextPayment: number;
  totalMonthlyCost: number;
  currentRentFormatted: string;
  nextAdjustmentDate: string | null;
  statusLabel: string;
}

interface ContractItem {
  id: string;
  property: {
    address: string;
    city: string;
    province: string;
  };
  financials: {
    monthlyRent: number;
    currency: string;
    expenses: number;
  };
  terms: {
    startDate: string;
    endDate: string;
    durationMonths: number;
    renewalType: string;
  };
  status: string;
}

interface ContractWithSummary {
  contract: ContractItem;
  summary: ContractSummary;
}

const emptyForm = {
  propertyAddress: "",
  propertyCity: "",
  propertyProvince: "",
  propertyCountry: "Argentina",
  propertySurface: 0,
  propertyRooms: 0,
  landlordName: "",
  landlordDni: "",
  landlordPhone: "",
  landlordEmail: "",
  monthlyRent: 0,
  currency: "ARS",
  deposit: 0,
  expenses: 0,
  expensesDueDay: 10,
  rentDueDay: 1,
  startDate: "",
  endDate: "",
  durationMonths: 12,
  renewalType: "automatic",
  indexationType: "icl",
};

export default function ContractsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [contracts, setContracts] = useState<ContractWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ landlordName?: string; propertyAddress?: string; monthlyRent?: string }>({});

  useEffect(() => {
    if (!user) return;
    fetchContracts();
  }, [user]);

  async function fetchContracts() {
    setLoading(true);
    try {
      const res = await fetch("/api/contracts");
      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts || []);
      }
    } catch {
      setError("Error al cargar contratos");
    } finally {
      setLoading(false);
    }
  }

  function validateForm(): boolean {
    const errs: { landlordName?: string; propertyAddress?: string; monthlyRent?: string } = {};
    if (!form.landlordName.trim()) errs.landlordName = "El nombre del propietario es requerido";
    if (!form.propertyAddress.trim()) errs.propertyAddress = "La dirección es requerida";
    if (!form.monthlyRent || form.monthlyRent <= 0) errs.monthlyRent = "El alquiler mensual es requerido";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCreate() {
    if (!validateForm()) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: `prop-${Date.now()}`,
          landlord: {
            name: form.landlordName,
            dni: form.landlordDni,
            phone: form.landlordPhone,
            email: form.landlordEmail,
          },
          property: {
            address: form.propertyAddress,
            city: form.propertyCity,
            province: form.propertyProvince,
            country: form.propertyCountry,
            surface: form.propertySurface,
            rooms: form.propertyRooms,
          },
          financials: {
            monthlyRent: form.monthlyRent,
            currency: form.currency,
            deposit: form.deposit,
            expenses: form.expenses,
            expensesDueDay: form.expensesDueDay,
            rentDueDay: form.rentDueDay,
            paymentMethod: "",
            bankAccount: "",
          },
          terms: {
            startDate: form.startDate,
            endDate: form.endDate,
            durationMonths: form.durationMonths,
            renewalType: form.renewalType,
            noticePeriodDays: 30,
            earlyTerminationPenalty: 0,
          },
          indexation: {
            type: form.indexationType,
            customPercentage: null,
            baseIndexValue: null,
            baseIndexDate: null,
            lastAdjustmentDate: null,
            nextAdjustmentDate: null,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al crear contrato");
        return;
      }

      setShowForm(false);
      setForm(emptyForm);
      fetchContracts();
      showToast("Contrato creado correctamente", "success");
    } catch {
      setError("Error de conexion");
      showToast("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate(contractId: string) {
    try {
      await fetch("/api/contracts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, action: "activate" }),
      });
      fetchContracts();
      showToast("Contrato activado", "success");
    } catch {
      setError("Error al activar contrato");
      showToast("Error al activar contrato", "error");
    }
  }

  async function handleDelete(contractId: string) {
    try {
      const res = await fetch(`/api/contracts?contractId=${contractId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setContracts((prev) =>
          prev.filter((c) => c.contract.id !== contractId)
        );
        setDeleteConfirm(null);
        if (selectedId === contractId) setSelectedId(null);
        showToast("Contrato eliminado", "success");
      } else {
        showToast("Error al eliminar contrato", "error");
      }
    } catch {
      setError("Error al eliminar contrato");
      showToast("Error al eliminar contrato", "error");
    }
  }

  const selected = contracts.find((c) => c.contract.id === selectedId);

  function statusColor(status: string) {
    switch (status) {
      case "active":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "pending":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "expired":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Contratos</h1>
            <p className="text-slate-400 text-sm mt-1">
              Gestioná tus contratos de alquiler
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setSelectedId(null);
            }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {showForm ? "Cancelar" : "+ Crear contrato"}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 space-y-6">
            <h3 className="text-base font-semibold">Nuevo contrato</h3>

            <SectionTitle title="Propiedad">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Dirección</label>
                  <input
                    type="text"
                    value={form.propertyAddress}
                    onChange={(e) => { setForm({ ...form, propertyAddress: e.target.value }); setFieldErrors((p) => ({ ...p, propertyAddress: undefined })); }}
                    placeholder="Dirección de la propiedad"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {fieldErrors.propertyAddress && <p className="text-red-400 text-sm mt-1">{fieldErrors.propertyAddress}</p>}
                </div>
                <Field
                  label="Ciudad"
                  value={form.propertyCity}
                  onChange={(v) => setForm({ ...form, propertyCity: v })}
                />
                <Field
                  label="Provincia"
                  value={form.propertyProvince}
                  onChange={(v) => setForm({ ...form, propertyProvince: v })}
                />
                <Field
                  label="Superficie (m²)"
                  type="number"
                  value={form.propertySurface}
                  onChange={(v) =>
                    setForm({ ...form, propertySurface: Number(v) })
                  }
                />
                <Field
                  label="Ambientes"
                  type="number"
                  value={form.propertyRooms}
                  onChange={(v) =>
                    setForm({ ...form, propertyRooms: Number(v) })
                  }
                />
              </div>
            </SectionTitle>

            <SectionTitle title="Propietario">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={form.landlordName}
                    onChange={(e) => { setForm({ ...form, landlordName: e.target.value }); setFieldErrors((p) => ({ ...p, landlordName: undefined })); }}
                    placeholder="Nombre del propietario"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {fieldErrors.landlordName && <p className="text-red-400 text-sm mt-1">{fieldErrors.landlordName}</p>}
                </div>
                <Field
                  label="DNI"
                  value={form.landlordDni}
                  onChange={(v) => setForm({ ...form, landlordDni: v })}
                />
                <Field
                  label="Teléfono"
                  value={form.landlordPhone}
                  onChange={(v) => setForm({ ...form, landlordPhone: v })}
                />
                <Field
                  label="Email"
                  value={form.landlordEmail}
                  onChange={(v) => setForm({ ...form, landlordEmail: v })}
                />
              </div>
            </SectionTitle>

            <SectionTitle title="Datos financieros">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Alquiler mensual</label>
                  <input
                    type="number"
                    value={form.monthlyRent}
                    onChange={(e) => { setForm({ ...form, monthlyRent: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, monthlyRent: undefined })); }}
                    placeholder="0"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {fieldErrors.monthlyRent && <p className="text-red-400 text-sm mt-1">{fieldErrors.monthlyRent}</p>}
                </div>
                <Field
                  label="Expensas"
                  type="number"
                  value={form.expenses}
                  onChange={(v) => setForm({ ...form, expenses: Number(v) })}
                />
                <Field
                  label="Depósito"
                  type="number"
                  value={form.deposit}
                  onChange={(v) => setForm({ ...form, deposit: Number(v) })}
                />
                <Field
                  label="Día vto. alquiler"
                  type="number"
                  value={form.rentDueDay}
                  onChange={(v) =>
                    setForm({ ...form, rentDueDay: Number(v) })
                  }
                />
                <Field
                  label="Día vto. expensas"
                  type="number"
                  value={form.expensesDueDay}
                  onChange={(v) =>
                    setForm({ ...form, expensesDueDay: Number(v) })
                  }
                />
              </div>
            </SectionTitle>

            <SectionTitle title="Plazos">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Fecha inicio"
                  type="date"
                  value={form.startDate}
                  onChange={(v) => setForm({ ...form, startDate: v })}
                />
                <Field
                  label="Fecha fin"
                  type="date"
                  value={form.endDate}
                  onChange={(v) => setForm({ ...form, endDate: v })}
                />
                <Field
                  label="Duración (meses)"
                  type="number"
                  value={form.durationMonths}
                  onChange={(v) =>
                    setForm({ ...form, durationMonths: Number(v) })
                  }
                />
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Renovación
                  </label>
                  <select
                    value={form.renewalType}
                    onChange={(e) =>
                      setForm({ ...form, renewalType: e.target.value })
                    }
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="automatic">Automática</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              </div>
            </SectionTitle>

            <div className="flex justify-end">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                {saving ? "Creando..." : "Crear contrato"}
              </button>
            </div>
          </div>
        )}

        {/* Contract Detail */}
        {selected && !showForm && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {selected.contract.property.address}
                </h3>
                <p className="text-slate-400 text-sm">
                  {selected.contract.property.city},{" "}
                  {selected.contract.property.province}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor(
                  selected.contract.status
                )}`}
              >
                {selected.summary.statusLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat
                label="Alquiler actual"
                value={selected.summary.currentRentFormatted}
              />
              <Stat
                label="Costo mensual"
                value={`$${selected.summary.totalMonthlyCost.toLocaleString()}`}
              />
              <Stat
                label="Días hasta vencimiento"
                value={`${selected.summary.daysUntilEnd} días`}
              />
              <Stat
                label="Próximo pago"
                value={`${selected.summary.daysUntilNextPayment} días`}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Inicio:</span>{" "}
                {new Date(selected.contract.terms.startDate).toLocaleDateString(
                  "es-AR"
                )}
              </div>
              <div>
                <span className="text-slate-400">Fin:</span>{" "}
                {new Date(selected.contract.terms.endDate).toLocaleDateString(
                  "es-AR"
                )}
              </div>
              <div>
                <span className="text-slate-400">Duración:</span>{" "}
                {selected.contract.terms.durationMonths} meses
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {selected.contract.status === "pending" && (
                <button
                  onClick={() => handleActivate(selected.contract.id)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  Activar contrato
                </button>
              )}
              {selected.contract.status === "active" && (
                <button
                  onClick={() =>
                    handleDelete(selected.contract.id)
                  }
                  className="px-4 py-2 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 transition-colors"
                >
                  Rescindir contrato
                </button>
              )}
              <button
                onClick={() => setSelectedId(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Contract List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-400">Cargando contratos...</div>
          </div>
        ) : contracts.length === 0 && !showForm ? (
          <EmptyState
            iconSvg={
              <svg className="w-16 h-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
            title="Sin contratos"
            description="Creá tu primer contrato para gestionar tus alquileres"
            actionLabel="Crear contrato"
            onAction={() => { setShowForm(true); setSelectedId(null); }}
          />
        ) : (
          <div className="space-y-3">
            {contracts.map(({ contract, summary }) => (
              <div
                key={contract.id}
                onClick={() => {
                  setSelectedId(
                    selectedId === contract.id ? null : contract.id
                  );
                  setShowForm(false);
                }}
                className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border cursor-pointer transition-all ${
                  selectedId === contract.id
                    ? "border-emerald-500/50"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold truncate">
                        {contract.property.address}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${statusColor(
                          contract.status
                        )}`}
                      >
                        {summary.statusLabel}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
                      {contract.property.city},{" "}
                      {contract.property.province}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-emerald-400 font-medium">
                        {summary.currentRentFormatted}/mes
                      </span>
                      <span className="text-slate-400">
                        {new Date(
                          contract.terms.startDate
                        ).toLocaleDateString("es-AR")}{" "}
                        —{" "}
                        {new Date(
                          contract.terms.endDate
                        ).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                  </div>

                  {deleteConfirm === contract.id ? (
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <span className="text-xs text-red-300">¿Eliminar?</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(contract.id);
                        }}
                        className="text-xs text-red-400 hover:text-red-300 font-medium"
                      >
                        Sí
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(null);
                        }}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(contract.id);
                      }}
                      className="text-slate-400 hover:text-red-400 p-1 flex-shrink-0 ml-4 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
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

function SectionTitle({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-300 mb-3">{title}</h4>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-700/30 rounded-xl p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold mt-1">{value}</p>
    </div>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
      />
    </div>
  );
}
