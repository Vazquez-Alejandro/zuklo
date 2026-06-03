"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { user, signOut } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    weeklyDigest: false,
    marketingEmails: false,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordErr("");
    setPasswordMsg("");

    if (newPassword.length < 6) {
      setPasswordErr("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErr("Las contraseñas no coinciden");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-password",
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setPasswordErr(data.error || "Error al cambiar contraseña");
        return;
      }

      setPasswordMsg("Contraseña actualizada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordErr("Error de conexión");
    } finally {
      setPasswordLoading(false);
    }
  }

  function handleNotificationToggle(key: keyof typeof notifications) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración</h1>
          <p className="text-slate-400 mt-1">Administrá tu cuenta y preferencias</p>
        </div>

        {/* Account Info */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-5">Información de la cuenta</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold shrink-0">
                {user?.email?.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-white font-medium">{user?.name || "Sin nombre"}</p>
                <p className="text-sm text-slate-400">{user?.email}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-700">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-slate-700/30 border border-slate-600/50 rounded-xl px-4 py-2.5 text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={user?.name || ""}
                  disabled
                  className="w-full bg-slate-700/30 border border-slate-600/50 rounded-xl px-4 py-2.5 text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-5">Cambiar contraseña</h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordErr && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm">
                {passwordErr}
              </div>
            )}

            {passwordMsg && (
              <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-3 text-emerald-300 text-sm">
                {passwordMsg}
              </div>
            )}

            <div>
              <label htmlFor="current-password" className="block text-sm text-slate-400 mb-1.5">
                Contraseña actual
              </label>
              <input
                id="current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm text-slate-400 mb-1.5">
                Nueva contraseña
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="block text-sm text-slate-400 mb-1.5">
                Confirmar nueva contraseña
              </label>
              <input
                id="confirm-new-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí tu nueva contraseña"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              {passwordLoading ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </form>
        </div>

        {/* Notification Preferences */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-5">Preferencias de notificación</h2>

          <div className="space-y-4">
            {[
              { key: "emailAlerts" as const, label: "Alertas por email", desc: "Recibí notificaciones cuando haya nuevas propiedades" },
              { key: "pushNotifications" as const, label: "Notificaciones push", desc: "Alertas en tiempo real en tu navegador" },
              { key: "weeklyDigest" as const, label: "Resumen semanal", desc: "Un resumen de actividad cada semana" },
              { key: "marketingEmails" as const, label: "Emails de marketing", desc: "Novedades, tips y ofertas de Zuklo" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleNotificationToggle(item.key)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notifications[item.key] ? "bg-emerald-500" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      notifications[item.key] ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-2">Sesión</h2>
          <p className="text-sm text-slate-400 mb-4">Cerrar sesión en todos los dispositivos</p>
          <button
            onClick={signOut}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-red-500/20">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Zona de peligro</h2>
          <p className="text-sm text-slate-400 mb-4">
            Eliminar tu cuenta es permanente. Se borrarán todos tus datos, alertas y configuraciones.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors"
            >
              Eliminar cuenta
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-red-300">¿Estás completamente seguro?</p>
              <button
                disabled
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
              >
                Sí, eliminar mi cuenta
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
