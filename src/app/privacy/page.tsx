export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
        <p className="text-slate-400 text-sm mb-10">Última actualización: 3 de junio de 2026</p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Responsable</h2>
            <p>Zuklo (en adelante, &quot;el Responsable&quot;) es el responsable del tratamiento de los datos personales recopilados a través de esta plataforma.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Datos recopilados</h2>
            <p>Recopilamos los siguientes tipos de datos personales:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Datos de cuenta:</strong> nombre, correo electrónico, contraseña (cifrada)</li>
              <li><strong>Datos personales:</strong> DNI, CUIL/CUIT, fecha de nacimiento</li>
              <li><strong>Datos laborales y financieros:</strong> empleador, ingresos mensuales, situaciones patrimoniales</li>
              <li><strong>Datos de garantías:</strong> información del garante (DNI, CUIL, ingresos)</li>
              <li><strong>Datos de uso:</strong> filtros de búsqueda, historial de propiedades consultadas, preferencias</li>
              <li><strong>Datos de dispositivos:</strong> tokens de notificación push para enviar alertas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Finalidad del tratamiento</h2>
            <p>Los datos son utilizados para:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provisionar y mejorar el Servicio</li>
              <li>Enviar alertas de propiedades que coincidan con sus filtros</li>
              <li>Generar fichas de inquilino verificadas</li>
              <li>Calcular ajustes de alquiler según índices oficiales</li>
              <li>Gestionar contratos y obligaciones de pago</li>
              <li>Procesar pagos de suscripciones premium a través de Stripe</li>
              <li>Cumplir obligaciones legales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Base legal</h2>
            <p>El tratamiento se basa en: (a) la ejecución de un contrato (Servicio solicitado), (b) el consentimiento del titular, y (c) el cumplimiento de obligaciones legales.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Compartición con terceros</h2>
            <p>Sus datos pueden ser compartidos con:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Supabase:</strong> hosting de base de datos y autenticación</li>
              <li><strong>Stripe:</strong> procesamiento de pagos</li>
              <li><strong>Apify:</strong> scraping de portales inmobiliarios (solo datos de búsqueda)</li>
              <li><strong>Firebase:</strong> envío de notificaciones push</li>
            </ul>
            <p className="mt-2">Estos terceros operan bajo sus propias políticas de privacidad y están sujetos a acuerdos de confidencialidad.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Retención de datos</h2>
            <p>Los datos se mantienen mientras la cuenta esté activa. Al eliminar la cuenta, los datos personales se eliminan en un plazo máximo de 30 días, salvo obligación legal de conservación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Derechos del titular (Ley 25.326)</h2>
            <p>Conforme a la Ley de Protección de Datos Personales (Ley 25.326), usted tiene derecho a:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Acceder a sus datos personales de forma gratuita</li>
              <li>Solicitar la actualización o rectificación de datos inexactos</li>
              <li>Solicitar la eliminación de datos cuando ya no sean necesarios</li>
              <li>Oponerse al tratamiento de sus datos para fines específicos</li>
              <li>Solicitar la portabilidad de sus datos</li>
            </ul>
            <p className="mt-2">Para ejercer estos derechos, contacte a: <span className="text-emerald-400">privacidad@zuklo.com</span></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Seguridad</h2>
            <p>Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos, incluyendo cifrado en tránsito (TLS), control de acceso y políticas de_Row Level Security_ en la base de datos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Menores de edad</h2>
            <p>El Servicio no está dirigido a menores de 18 años. No recopilamos intencionalmente datos de menores.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Cambios en esta política</h2>
            <p>Nos reservamos el derecho de modificar esta política. Los cambios serán notificados a través del Servicio o por correo electrónico.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contacto</h2>
            <p>Para consultas sobre privacidad: <span className="text-emerald-400">privacidad@zuklo.com</span></p>
            <p>Para ejercer sus derechos bajo la Ley 25.326: <span className="text-emerald-400">derechos@zuklo.com</span></p>
          </section>
        </div>
      </div>
    </div>
  );
}
