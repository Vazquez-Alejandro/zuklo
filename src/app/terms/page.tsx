export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Términos y Condiciones</h1>
        <p className="text-slate-400 text-sm mb-10">Última actualización: 3 de junio de 2026</p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Aceptación</h2>
            <p>Al acceder y utilizar Zuklo (en adelante, &quot;el Servicio&quot;), usted acepta estos Términos y Condiciones. Si no está de acuerdo, no utilice el Servicio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Descripción del Servicio</h2>
            <p>Zuklo es una plataforma que ofrece búsqueda automatizada de propiedades en alquiler mediante scraping de portales inmobiliarios, alertas de coincidencia, gestión de perfiles de inquilinos, cálculo de ajustes de alquiler según índices oficiales (ICL/IPC) y gestión de contratos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Elegibilidad</h2>
            <p>El Servicio está dirigido a personas mayores de 18 años residentes en la República Argentina. Al registrarse, usted declara cumplir con estos requisitos y proporcionar información veraz.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Cuenta de usuario</h2>
            <p>Usted es responsable de mantener la confidencialidad de su cuenta y de todas las actividades que ocurran bajo ella. Notifique inmediatamente cualquier uso no autorizado.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Obligaciones del usuario</h2>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Proporcionar información precisa y actualizada</li>
              <li>No utilizar el Servicio para fines ilegales o no autorizados</li>
              <li>No intentar acceder a cuentas de otros usuarios</li>
              <li>No interferir con el funcionamiento del Servicio</li>
              <li>Cumplir con todas las leyes aplicables</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Propiedad intelectual</h2>
            <p>Todo el contenido, diseño, código fuente y marcas de Zuklo son propiedad exclusiva del titular del servicio y están protegidos por las leyes de propiedad intelectual argentinas e internacionales. Queda prohibida su reproducción sin autorización.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Limitación de responsabilidad</h2>
            <p>Zuklo actúa como intermediario tecnológico. No somos responsables por:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>La veracidad de las publicaciones de terceros</li>
              <li>Decisiones de compra o alquiler tomadas en base a la información del Servicio</li>
              <li>Interrupciones del servicio o errores en los datos</li>
              <li>Daños indirectos, consecuentes o punitivos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Suscripciones y pagos</h2>
            <p>Las suscripciones premium se facturan a través de Stripe. Los precios están en pesos argentinos (ARS) e incluyen IVA. La cancelación puede realizarse en cualquier momento desde la sección de facturación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Terminación</h2>
            <p>Zuklo se reserva el derecho de suspender o cancelar cuentas que violen estos términos, previa notificación cuando sea posible.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Ley aplicable</h2>
            <p>Estos términos se rigen por las leyes de la República Argentina. Cualquier controversia será sometida a la jurisdicción de los tribunales competentes de la Ciudad Autónoma de Buenos Aires.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
