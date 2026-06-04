import Link from "next/link";

const FEATURES = [
  { icon: "🔍", title: "Búsqueda inteligente", desc: "Definí lo que buscás y nosotros nos encargamos del resto" },
  { icon: "🌐", title: "8 portales inmobiliarios", desc: "Scraping automático de Zillow, Realtor, ZAP, VivaReal, Zonaprop, Argenprop, MercadoLibre y OLX" },
  { icon: "🔔", title: "Notificaciones push", desc: "Recibí alertas al instante cuando aparezca una propiedad que matchee" },
  { icon: "👤", title: "Ficha verificada", desc: "Generá tu perfil de inquilino verificado con scoring de confianza" },
  { icon: "📈", title: "Calculadora ICL/IPC", desc: "Calculá automáticamente los ajustes de tu alquiler con índices oficiales" },
  { icon: "📋", title: "Gestión completa", desc: "Contratos, gastos de mantenimiento y todo en un solo lugar" },
];

const PLANS = [
  {
    name: "Gratis",
    price: "$0",
    period: "para siempre",
    features: ["2 alertas de búsqueda", "2 filtros activos", "Calculadora de aumentos"],
    cta: "Empezar gratis",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$4.999",
    period: "/mes",
    features: ["Alertas ilimitadas", "Filtros ilimitados", "Alertas en tiempo real", "Ficha de inquilino verificada", "Soporte prioritario"],
    cta: "Suscribirse",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$9.999",
    period: "/mes",
    features: ["Todo de Premium", "Gestión multi-propiedad", "Analytics avanzados", "API acceso"],
    cta: "Suscribirse",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between max-w-6xl mx-auto px-4 py-6">
        <div className="text-2xl font-bold">
          <span className="text-emerald-400">Zuklo</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
            Iniciar sesión
          </Link>
          <Link href="/signup" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-2 rounded-xl transition-colors">
            Registrate
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-28 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Encontrá tu próximo{" "}
          <span className="text-emerald-400">alquiler</span>
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          Buscamos automáticamente en 8 portales inmobiliarios y te avisamos cuando aparece la propiedad perfecta para vos.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors">
            Comenzá gratis
          </Link>
          <Link href="/login" className="border border-slate-600 hover:border-slate-500 text-slate-300 font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors">
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-14">¿Cómo funciona?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Creá tus alertas", desc: "Definí precio, ubicación, cantidad de ambientes y lo que necesites." },
            { step: "2", title: "Scraping automático", desc: "Nuestro sistema busca en 8 portales cada 15 minutos." },
            { step: "3", title: "Recibí notificaciones", desc: "Te avisamos al instante cuando aparezca una propiedad que coincida." },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center text-2xl font-bold text-emerald-400 mx-auto mb-5">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-14">Todo lo que necesitás</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Planes y precios</h2>
        <p className="text-slate-400 text-center mb-14">Empezá gratis, upgrade cuando quieras</p>
        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 border ${
                plan.highlighted
                  ? "bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30"
                  : "bg-slate-800/50 border-slate-700"
              }`}
            >
              {plan.highlighted && (
                <div className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">Más popular</div>
              )}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-slate-400 text-sm ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block text-center font-semibold py-3 rounded-xl transition-colors ${
                  plan.highlighted
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "border border-slate-600 hover:border-slate-500 text-slate-300"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-2xl font-bold">
            <span className="text-emerald-400">Zuklo</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">Iniciar sesión</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Registrate</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
          </div>
          <div className="text-sm text-slate-500">© 2026 Zuklo. Todos los derechos reservados.</div>
        </div>
      </footer>
    </div>
  );
}
