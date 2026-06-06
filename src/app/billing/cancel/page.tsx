"use client";

import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";

export default function BillingCancelPage() {
  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-600/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Pago cancelado</h1>
        <p className="text-slate-400 mb-8">
          No se realizó ningún cargo. Podés intentar novamente cuando quieras.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/billing"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Ver planes
          </Link>
          <Link
            href="/dashboard"
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Volver al dashboard
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
