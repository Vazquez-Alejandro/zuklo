"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/toast";
import { EmptyState } from "@/components/empty-state";

interface Expense {
  id: string;
  contractId: string;
  category: string;
  subcategory: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  provider: {
    name: string;
    phone: string;
    company: string;
    invoiceNumber: string;
  };
  photos: string[];
  status: string;
  metadata: {
    createdAt: string;
    isRecurring: boolean;
  };
}

interface ContractOption {
  id: string;
  property: {
    address: string;
    city: string;
  };
}

interface ExpenseSummary {
  totalExpenses: number;
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  reimbursedAmount: number;
  byCategory: Record<string, { count: number; amount: number }>;
  monthlyAverage: number;
}

interface Categories {
  [key: string]: {
    label: string;
    icon: string;
    subcategories: string[];
  };
}

const emptyForm = {
  category: "plumbing",
  subcategory: "",
  description: "",
  amount: 0,
  date: "",
  providerName: "",
  providerPhone: "",
  providerCompany: "",
  providerInvoice: "",
  photos: [] as string[],
};

export default function MaintenancePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [selectedContractId, setSelectedContractId] = useState("");
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [categories, setCategories] = useState<Categories>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ description?: string; amount?: string; date?: string }>({});

  useEffect(() => {
    if (!user) return;
    fetchContracts();
    fetchCategories();
  }, [user]);

  useEffect(() => {
    if (selectedContractId) {
      fetchExpenses(selectedContractId);
    }
  }, [selectedContractId]);

  async function fetchContracts() {
    try {
      const res = await fetch("/api/contracts");
      if (res.ok) {
        const data = await res.json();
        const list = (data.contracts || []).map(
          (c: { contract: ContractOption }) => c.contract
        );
        setContracts(list);
        if (list.length > 0) {
          setSelectedContractId(list[0].id);
        } else {
          setLoading(false);
        }
      }
    } catch {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/maintenance?action=categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch {
      // categories not critical
    }
  }

  async function fetchExpenses(contractId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/maintenance?contractId=${contractId}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setSummary(data.summary || null);
      }
    } catch {
      setError("Error al cargar gastos");
    } finally {
      setLoading(false);
    }
  }

  function validateForm(): boolean {
    const errs: { description?: string; amount?: string; date?: string } = {};
    if (!form.description.trim()) errs.description = "La descripción es requerida";
    if (!form.amount || form.amount <= 0) errs.amount = "El monto es requerido";
    if (!form.date) errs.date = "La fecha es requerida";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCreate() {
    if (!selectedContractId) {
      setError("Seleccioná un contrato primero");
      return;
    }

    if (!validateForm()) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: selectedContractId,
          category: form.category,
          subcategory: form.subcategory,
          description: form.description,
          amount: form.amount,
          currency: "ARS",
          date: form.date,
          provider: {
            name: form.providerName,
            phone: form.providerPhone,
            email: "",
            company: form.providerCompany,
            invoiceNumber: form.providerInvoice,
          },
          photos: form.photos,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al crear gasto");
        return;
      }

      setShowForm(false);
      setForm(emptyForm);
      fetchExpenses(selectedContractId);
      showToast("Gasto creado correctamente", "success");
    } catch {
      setError("Error de conexion");
      showToast("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStatus(expenseId: string, status: string) {
    try {
      await fetch("/api/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseId, status }),
      });
      if (selectedContractId) fetchExpenses(selectedContractId);
      showToast("Estado actualizado", "success");
    } catch {
      setError("Error al actualizar gasto");
      showToast("Error al actualizar gasto", "error");
    }
  }

  async function handleDelete(expenseId: string) {
    try {
      const res = await fetch(`/api/maintenance?expenseId=${expenseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
        setDeleteConfirm(null);
        if (selectedContractId) fetchExpenses(selectedContractId);
        showToast("Gasto eliminado", "success");
      } else {
        showToast("Error al eliminar gasto", "error");
      }
    } catch {
      setError("Error al eliminar gasto");
      showToast("Error al eliminar gasto", "error");
    }
  }

  async function handleRemovePhoto(expenseId: string, photoUrl: string) {
    try {
      await fetch("/api/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseId,
          action: "remove-photo",
          photoUrl,
        }),
      });
      if (selectedContractId) fetchExpenses(selectedContractId);
    } catch {
      setError("Error al eliminar foto");
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case "approved":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "pending":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "reimbursed":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "denied":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  }

  function statusLabel(status: string) {
    const labels: Record<string, string> = {
      pending: "Pendiente",
      approved: "Aprobado",
      reimbursed: "Reembolsado",
      denied: "Rechazado",
    };
    return labels[status] || status;
  }

  const selectedCat = categories[form.category];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Mantenimiento</h1>
            <p className="text-slate-400 text-sm mt-1">
              Gestioná los gastos de mantenimiento de tus propiedades
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setForm(emptyForm);
            }}
            disabled={!selectedContractId}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {showForm ? "Cancelar" : "+ Crear gasto"}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Contract Filter */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Contrato
          </label>
          <select
            value={selectedContractId}
            onChange={(e) => setSelectedContractId(e.target.value)}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          >
            {contracts.length === 0 && (
              <option value="">Sin contratos disponibles</option>
            )}
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.property.address} — {c.property.city}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Card */}
        {summary && !showForm && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <h3 className="text-base font-semibold mb-4">Resumen</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard
                label="Total"
                value={`$${summary.totalAmount.toLocaleString()}`}
                sub={`${summary.totalExpenses} gastos`}
              />
              <StatCard
                label="Pendiente"
                value={`$${summary.pendingAmount.toLocaleString()}`}
                color="amber"
              />
              <StatCard
                label="Aprobado"
                value={`$${summary.approvedAmount.toLocaleString()}`}
                color="emerald"
              />
              <StatCard
                label="Reembolsado"
                value={`$${summary.reimbursedAmount.toLocaleString()}`}
                color="blue"
              />
              <StatCard
                label="Promedio mensual"
                value={`$${Math.round(summary.monthlyAverage).toLocaleString()}`}
              />
            </div>
            {Object.keys(summary.byCategory).length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Por categoría</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(summary.byCategory).map(([cat, data]) => (
                    <span
                      key={cat}
                      className="bg-slate-700/50 px-3 py-1 rounded-full text-xs text-slate-300"
                    >
                      {categories[cat]?.icon} {categories[cat]?.label || cat}:{" "}
                      ${data.amount.toLocaleString()} ({data.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 space-y-6">
            <h3 className="text-base font-semibold">Nuevo gasto</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Categoría
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value, subcategory: "" })
                  }
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  {Object.entries(categories).map(([key, cat]) => (
                    <option key={key} value={key}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Subcategoría
                </label>
                <select
                  value={form.subcategory}
                  onChange={(e) =>
                    setForm({ ...form, subcategory: e.target.value })
                  }
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">Seleccionar...</option>
                  {selectedCat?.subcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => { setForm({ ...form, description: e.target.value }); setFieldErrors((p) => ({ ...p, description: undefined })); }}
                  rows={2}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  placeholder="Descripción del gasto..."
                />
                {fieldErrors.description && <p className="text-red-400 text-sm mt-1">{fieldErrors.description}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Monto</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => { setForm({ ...form, amount: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, amount: undefined })); }}
                  placeholder="0"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {fieldErrors.amount && <p className="text-red-400 text-sm mt-1">{fieldErrors.amount}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Fecha</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => { setForm({ ...form, date: e.target.value }); setFieldErrors((p) => ({ ...p, date: undefined })); }}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {fieldErrors.date && <p className="text-red-400 text-sm mt-1">{fieldErrors.date}</p>}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3">
                Proveedor
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Nombre"
                  value={form.providerName}
                  onChange={(v) => setForm({ ...form, providerName: v })}
                />
                <Field
                  label="Empresa"
                  value={form.providerCompany}
                  onChange={(v) => setForm({ ...form, providerCompany: v })}
                />
                <Field
                  label="Teléfono"
                  value={form.providerPhone}
                  onChange={(v) => setForm({ ...form, providerPhone: v })}
                />
                <Field
                  label="Nº Factura"
                  value={form.providerInvoice}
                  onChange={(v) => setForm({ ...form, providerInvoice: v })}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                {saving ? "Creando..." : "Crear gasto"}
              </button>
            </div>
          </div>
        )}

        {/* Expense List */}
        {!showForm && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-400">Cargando gastos...</div>
              </div>
            ) : expenses.length === 0 ? (
              <EmptyState
                iconSvg={
                  <svg className="w-16 h-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 3.18A1.125 1.125 0 014.5 17.29V5.71a1.125 1.125 0 011.536-1.06l5.384 3.18m0 0l5.384-3.18A1.125 1.125 0 0118.375 5.71v11.58a1.125 1.125 0 01-1.536 1.06l-5.384-3.18m0-7.38v7.38" />
                  </svg>
                }
                title="Sin gastos registrados"
                description="Registrá gastos de mantenimiento para llevar el control"
                actionLabel="Registrar gasto"
                onAction={() => { setShowForm(true); setForm(emptyForm); }}
              />
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {categories[expense.category]?.icon || "📋"}
                        </span>
                        <div>
                          <h4 className="font-semibold text-sm">
                            {expense.subcategory || expense.category}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {categories[expense.category]?.label} •{" "}
                            {new Date(expense.date).toLocaleDateString("es-AR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor(
                            expense.status
                          )}`}
                        >
                          {statusLabel(expense.status)}
                        </span>
                        {deleteConfirm === expense.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="text-xs text-red-400 hover:text-red-300 font-medium"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs text-slate-400 hover:text-white"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(expense.id)}
                            className="text-slate-400 hover:text-red-400 p-1 transition-colors"
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

                    {expense.description && (
                      <p className="text-sm text-slate-300 mb-3">
                        {expense.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-emerald-400 font-semibold">
                          ${expense.amount.toLocaleString()}
                        </span>
                        {expense.provider.name && (
                          <span className="text-slate-400">
                            {expense.provider.name}
                            {expense.provider.company &&
                              ` — ${expense.provider.company}`}
                          </span>
                        )}
                      </div>

                      {expense.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleUpdateStatus(expense.id, "approved")
                            }
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-colors"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateStatus(expense.id, "denied")
                            }
                            className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded-lg border border-red-500/30 hover:border-red-500/50 transition-colors"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                      {expense.status === "approved" && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(expense.id, "reimbursed")
                          }
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-colors"
                        >
                          Reembolsar
                        </button>
                      )}
                    </div>

                    {/* Photos */}
                    {expense.photos.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <div className="flex flex-wrap gap-2">
                          {expense.photos.map((photo, i) => (
                            <div key={i} className="relative group">
                              <img
                                src={photo}
                                alt={`Foto ${i + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border border-slate-600"
                              />
                              <button
                                onClick={() =>
                                  handleRemovePhoto(expense.id, photo)
                                }
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs hidden group-hover:flex items-center justify-center"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: "amber" | "emerald" | "blue";
}) {
  const colorClasses = {
    amber: "text-amber-400",
    emerald: "text-emerald-400",
    blue: "text-blue-400",
  };

  return (
    <div className="bg-slate-700/30 rounded-xl p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p
        className={`text-sm font-semibold mt-1 ${
          color ? colorClasses[color] : "text-white"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
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
