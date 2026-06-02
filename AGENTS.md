<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Zuklo - Roadmap

## Estado Actual (Prompt 4 - Auth + Monetización)

### ✅ Completado
- Sistema de scraping con BullMQ (8 portales)
- Filtros de búsqueda con matching ponderado
- Notificaciones push con Firebase Cloud Messaging
- Perfil de inquilino con verificación y scoring
- Generación de PDFs con Puppeteer
- Gestión de contratos con cálculo ICL/IPC
- Sistema de mantenimiento de gastos
- Autenticación con Supabase (signup, login, logout, forgot-password)
- Middleware de rutas protegidas
- Integración con Stripe (planes Free/Premium/Pro)
- Sistema de monetización con límites por plan
- API de billing (checkout, portal, cancel)
- Webhook handler para eventos de Stripe
- DB migration `004_auth_monetization.sql`

### 🔧 Pendiente (lo que falta para que compile)
1. **Fix build errors** - Hay errores de TypeScript que impiden el build:
   - `src/lib/stripe.ts` - API version mismatch (Stripe v22.x requiere `2026-05-27.dahlia`)
   - `src/lib/queue.ts` - ioredis version conflict (usar connection object en vez de ioredis instance)
   - `src/lib/pdf-generator.ts` - Puppeteer `networkidle0` no soportado en setContent
   - `src/lib/monetization.ts` - Type narrowing issues con PlanFeatures

2. **Corregir lint warnings** - ~20 warnings de variables no usadas en API routes

3. **Commit y push** - Una vez que compile, hacer commit de todo el Prompt 4

### 📋 Pendiente (funcionalidad nueva)
1. **UI del Dashboard** - Crear páginas:
   - `/login` y `/signup` - Formularios de autenticación
   - `/dashboard` - Vista principal con propiedades
   - `/alerts` - Gestión de alertas de búsqueda
   - `/profile` - Perfil de inquilino
   - `/contracts` - Gestión de contratos
   - `/maintenance` - Registro de gastos
   - `/billing` - Gestión de suscripción y facturación
   - `/settings` - Configuración de cuenta

2. **Configurar Supabase** - Crear proyecto y ejecutar migraciones:
   - `001_initial_schema.sql`
   - `002_filters_notifications.sql`
   - `003_profiles_contracts_maintenance.sql`
   - `004_auth_monetization.sql`

3. **Configurar Stripe** - Crear productos y precios:
   - Premium: $4999/mes (ARS)
   - Pro: $9999/mes (ARS)
   - Configurar webhook endpoint

4. **Testing** - Agregar tests unitarios y de integración

## Comandos Útiles
```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm run lint         # Linting
```

## Archivos Importantes
- `src/lib/stripe.ts` - Configuración de Stripe y planes
- `src/lib/monetization.ts` - Sistema de créditos y límites
- `src/lib/supabase.ts` - Cliente Supabase y auth helpers
- `src/lib/middleware.ts` - Middleware de autenticación
- `src/app/api/billing/route.ts` - API de facturación
- `src/app/api/webhook/route.ts` - Webhook de Stripe
- `supabase/migrations/004_auth_monetization.sql` - Migración de auth
