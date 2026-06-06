"use client";

import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";

export default function BillingSuccessPage() {
  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">¡Pago exitoso!</h1>
        <p className="text-slate-400 mb-8">
          Tu plan fue actualizado correctamente. Ya podés acceder a todas las funcionalidades de tu plan.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Ir al dashboard
          </Link>
          <Link
            href="/billing"
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Ver mi plan
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
