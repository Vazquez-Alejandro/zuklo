"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/toast";
import { EmptyState } from "@/components/empty-state";

interface Profile {
  id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dni: string;
    cuil: string;
    dateOfBirth: string;
    nationality: string;
    maritalStatus: string;
    phone: string;
    email: string;
    currentAddress: string;
  };
  employment: {
    situation: string;
    companyName: string;
    position: string;
    seniority: string;
    monthlyIncome: number;
    contractType: string;
  };
  income: {
    primaryIncome: number;
    secondaryIncome: number;
  };
  guarantor: {
    hasGuarantor: boolean;
    name: string;
    dni: string;
    phone: string;
    relationship: string;
    monthlyIncome: number;
    isCorporate: boolean;
  };
  metadata: {
    verificationScore: number;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

interface ProfileSummary {
  displayName: string;
  verificationLevel: string;
  monthlyIncomeFormatted: string;
  guarantorStatus: string;
  completeness: number;
}

const emptyProfile = {
  personalInfo: {
    firstName: "",
    lastName: "",
    dni: "",
    cuil: "",
    dateOfBirth: "",
    nationality: "",
    maritalStatus: "",
    phone: "",
    email: "",
    currentAddress: "",
  },
  employment: {
    situation: "employed",
    companyName: "",
    position: "",
    seniority: "",
    monthlyIncome: 0,
    contractType: "",
  },
  income: {
    primaryIncome: 0,
    secondaryIncome: 0,
  },
  guarantor: {
    hasGuarantor: false,
    name: "",
    dni: "",
    phone: "",
    relationship: "",
    monthlyIncome: 0,
    isCorporate: false,
  },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [form, setForm] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ firstName?: string; email?: string; dni?: string }>({});

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          setSummary(data.summary);
          setForm({
            personalInfo: data.profile.personalInfo,
            employment: data.profile.employment,
            income: data.profile.income,
            guarantor: data.profile.guarantor,
          });
        } else if (res.status === 404) {
          setProfile(null);
        }
      } catch {
        setError("Error al cargar el perfil");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  function validate(): boolean {
    const errs: { firstName?: string; email?: string; dni?: string } = {};
    if (!form.personalInfo.firstName.trim()) errs.firstName = "El nombre es requerido";
    if (form.personalInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.personalInfo.email)) {
      errs.email = "Ingresá un email válido";
    }
    if (form.personalInfo.dni && !/^\d{7,8}$/.test(form.personalInfo.dni)) {
      errs.dni = "El DNI debe tener 7 u 8 dígitos";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const method = profile ? "PUT" : "POST";
      const res = await fetch("/api/profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al guardar el perfil");
        return;
      }

      setProfile(data.profile);
      setSummary(data.summary);
      setEditing(false);
      setSuccess("Perfil guardado correctamente");
      showToast("Perfil guardado correctamente", "success");
    } catch {
      setError("Error de conexion");
      showToast("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("¿Estás seguro de que querés eliminar tu perfil?")) return;

    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (res.ok) {
        setProfile(null);
        setSummary(null);
        setForm(emptyProfile);
        setEditing(false);
        setSuccess("Perfil eliminado");
        showToast("Perfil eliminado", "success");
      } else {
        showToast("Error al eliminar el perfil", "error");
      }
    } catch {
      setError("Error al eliminar el perfil");
      showToast("Error al eliminar el perfil", "error");
    }
  }

  function updateField(
    section: "personalInfo" | "employment" | "income" | "guarantor",
    field: string,
    value: string | number | boolean
  ) {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400">Cargando perfil...</div>
        </div>
      </DashboardLayout>
    );
  }

  const isViewing = profile && !editing;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Mi Perfil</h1>
            <p className="text-slate-400 text-sm mt-1">
              {profile
                ? "Gestioná tu información de inquilino"
                : "Completá tu perfil para mejorar tus chances de alquilar"}
            </p>
          </div>
          {profile && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Editar
            </button>
          )}
        </div>

        {/* Alerts */}
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

        {/* Summary Card */}
        {profile && summary && isViewing && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">{summary.displayName}</h2>
                <p className="text-slate-400 text-sm">{user?.email}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  summary.verificationLevel === "verified"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : summary.verificationLevel === "premium"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : summary.verificationLevel === "standard"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                }`}
              >
                {summary.verificationLevel === "verified"
                  ? "Verificado"
                  : summary.verificationLevel === "premium"
                  ? "Premium"
                  : summary.verificationLevel === "standard"
                  ? "Estándar"
                  : "Básico"}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-700/30 rounded-xl p-3">
                <p className="text-xs text-slate-400">Verificación</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${summary.completeness}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{summary.completeness}%</span>
                </div>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-3">
                <p className="text-xs text-slate-400">Ingreso mensual</p>
                <p className="text-sm font-semibold mt-1">{summary.monthlyIncomeFormatted}</p>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-3">
                <p className="text-xs text-slate-400">Garantía</p>
                <p className="text-sm font-semibold mt-1">{summary.guarantorStatus}</p>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-3">
                <p className="text-xs text-slate-400">Última actualización</p>
                <p className="text-sm font-semibold mt-1">
                  {new Date(profile.metadata.updatedAt).toLocaleDateString("es-AR")}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleDelete}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Eliminar perfil
              </button>
            </div>
          </div>
        )}

        {/* Empty State - No Profile */}
        {!profile && !editing && (
          <EmptyState
            iconSvg={
              <svg className="w-16 h-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            }
            title="Sin perfil de inquilino"
            description="Completá tu perfil para presentarte a los propietarios"
            actionLabel="Crear perfil"
            onAction={() => setEditing(true)}
          />
        )}

        {/* Profile Form */}
        {editing && (
          <div className="space-y-6">
            {/* Personal Info */}
            <Section title="Datos personales">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={form.personalInfo.firstName}
                    onChange={(e) => { updateField("personalInfo", "firstName", e.target.value); setFieldErrors((p) => ({ ...p, firstName: undefined })); }}
                    placeholder="Tu nombre"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {fieldErrors.firstName && <p className="text-red-400 text-sm mt-1">{fieldErrors.firstName}</p>}
                </div>
                <Field
                  label="Apellido"
                  value={form.personalInfo.lastName}
                  onChange={(v) => updateField("personalInfo", "lastName", v)}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">DNI</label>
                  <input
                    type="text"
                    value={form.personalInfo.dni}
                    onChange={(e) => { updateField("personalInfo", "dni", e.target.value); setFieldErrors((p) => ({ ...p, dni: undefined })); }}
                    placeholder="12345678"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {fieldErrors.dni && <p className="text-red-400 text-sm mt-1">{fieldErrors.dni}</p>}
                </div>
                <Field
                  label="CUIL"
                  value={form.personalInfo.cuil}
                  onChange={(v) => updateField("personalInfo", "cuil", v)}
                />
                <Field
                  label="Fecha de nacimiento"
                  type="date"
                  value={form.personalInfo.dateOfBirth}
                  onChange={(v) => updateField("personalInfo", "dateOfBirth", v)}
                />
                <Field
                  label="Nacionalidad"
                  value={form.personalInfo.nationality}
                  onChange={(v) => updateField("personalInfo", "nationality", v)}
                />
                <SelectField
                  label="Estado civil"
                  value={form.personalInfo.maritalStatus}
                  onChange={(v) => updateField("personalInfo", "maritalStatus", v)}
                  options={[
                    { value: "", label: "Seleccionar..." },
                    { value: "single", label: "Soltero/a" },
                    { value: "married", label: "Casado/a" },
                    { value: "divorced", label: "Divorciado/a" },
                    { value: "widowed", label: "Viudo/a" },
                    { value: "concubinage", label: "Unión libre" },
                  ]}
                />
                <Field
                  label="Teléfono"
                  value={form.personalInfo.phone}
                  onChange={(v) => updateField("personalInfo", "phone", v)}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.personalInfo.email}
                    onChange={(e) => { updateField("personalInfo", "email", e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
                    placeholder="tu@email.com"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {fieldErrors.email && <p className="text-red-400 text-sm mt-1">{fieldErrors.email}</p>}
                </div>
                <Field
                  label="Dirección actual"
                  value={form.personalInfo.currentAddress}
                  onChange={(v) => updateField("personalInfo", "currentAddress", v)}
                  className="md:col-span-2"
                />
              </div>
            </Section>

            {/* Employment */}
            <Section title="Situación laboral">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  label="Situación laboral"
                  value={form.employment.situation}
                  onChange={(v) => updateField("employment", "situation", v)}
                  options={[
                    { value: "employed", label: "Empleado" },
                    { value: "self-employed", label: "Autónomo" },
                    { value: "retired", label: "Jubilado" },
                    { value: "student", label: "Estudiante" },
                    { value: "unemployed", label: "Desempleado" },
                  ]}
                />
                <Field
                  label="Empresa / Nombre"
                  value={form.employment.companyName}
                  onChange={(v) => updateField("employment", "companyName", v)}
                />
                <Field
                  label="Cargo"
                  value={form.employment.position}
                  onChange={(v) => updateField("employment", "position", v)}
                />
                <Field
                  label="Antigüedad"
                  value={form.employment.seniority}
                  onChange={(v) => updateField("employment", "seniority", v)}
                  placeholder="Ej: 3 años"
                />
                <Field
                  label="Ingreso mensual"
                  type="number"
                  value={form.employment.monthlyIncome}
                  onChange={(v) =>
                    updateField("employment", "monthlyIncome", Number(v))
                  }
                />
                <SelectField
                  label="Tipo de contrato"
                  value={form.employment.contractType}
                  onChange={(v) => updateField("employment", "contractType", v)}
                  options={[
                    { value: "", label: "Seleccionar..." },
                    { value: "permanent", label: "Indefinido" },
                    { value: "temporary", label: "Temporal" },
                    { value: "freelance", label: "Freelance" },
                    { value: "seasonal", label: "Temporal estacional" },
                  ]}
                />
              </div>
            </Section>

            {/* Income */}
            <Section title="Ingresos">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Ingreso principal"
                  type="number"
                  value={form.income.primaryIncome}
                  onChange={(v) =>
                    updateField("income", "primaryIncome", Number(v))
                  }
                />
                <Field
                  label="Ingresos secundarios"
                  type="number"
                  value={form.income.secondaryIncome}
                  onChange={(v) =>
                    updateField("income", "secondaryIncome", Number(v))
                  }
                />
              </div>
            </Section>

            {/* Guarantor */}
            <Section title="Garantía">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.guarantor.hasGuarantor}
                      onChange={(e) =>
                        updateField("guarantor", "hasGuarantor", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className="text-sm text-slate-300">Tiene garantía</span>
                </div>

                {form.guarantor.hasGuarantor && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.guarantor.isCorporate}
                          onChange={(e) =>
                            updateField("guarantor", "isCorporate", e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                      <span className="text-sm text-slate-300">Garantía corporativa</span>
                    </div>
                    <Field
                      label="Nombre"
                      value={form.guarantor.name}
                      onChange={(v) => updateField("guarantor", "name", v)}
                    />
                    <Field
                      label="DNI"
                      value={form.guarantor.dni}
                      onChange={(v) => updateField("guarantor", "dni", v)}
                    />
                    <Field
                      label="Teléfono"
                      value={form.guarantor.phone}
                      onChange={(v) => updateField("guarantor", "phone", v)}
                    />
                    <Field
                      label="Relación"
                      value={form.guarantor.relationship}
                      onChange={(v) => updateField("guarantor", "relationship", v)}
                      placeholder="Ej: Padre, Amigo, Empresa"
                    />
                    <Field
                      label="Ingreso mensual"
                      type="number"
                      value={form.guarantor.monthlyIncome}
                      onChange={(v) =>
                        updateField("guarantor", "monthlyIncome", Number(v))
                      }
                    />
                  </div>
                )}
              </div>
            </Section>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
              {editing && (
                <button
                  onClick={() => {
                    setEditing(false);
                    if (profile) {
                      setForm({
                        personalInfo: profile.personalInfo,
                        employment: profile.employment,
                        income: profile.income,
                        guarantor: profile.guarantor,
                      });
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                {saving
                  ? "Guardando..."
                  : profile
                  ? "Actualizar perfil"
                  : "Crear perfil"}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
      <h3 className="text-base font-semibold mb-4">{title}</h3>
      {children}
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
