<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Zuklo - Cómo Levantar el Proyecto

## Prerequisitos
- Node.js 18+
- Redis (para BullMQ)
- Cuenta de Supabase (gratis)
- Cuenta de Stripe (para monetización)

## Pasos para correr

```bash
# 1. Instalar dependencias (si no están instaladas)
npm install

# 2. Correr en modo desarrollo
npm run dev
```

La app arranca en http://localhost:3000

**Nota:** Redis y Supabase/Stripe no son necesarios para que arranque en dev. Las APIs van a fallar si no están configuradas, pero la app carga.

## Variables de entorno (opcional para dev)

Copia `.env.example` a `.env.local` y completá:

```bash
cp .env.example .env.local
```

Las que necesitás para funcionalidad completa:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` → auth
- `SUPABASE_SERVICE_ROLE_KEY` → admin operations
- `STRIPE_SECRET_KEY` → billing
- `REDIS_URL` → background jobs (scraping automático)
- `APIFY_TOKEN` → scraping de propiedades

## Build de producción

```bash
npm run build
npm start
```

## Arquitectura

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Auth**: Supabase Auth (multi-tenant)
- **DB**: Supabase (PostgreSQL + RLS)
- **Payments**: Stripe (3 planes: Free/Premium/Pro)
- **Scraping**: Apify + BullMQ (8 portales inmobiliarios)
- **Notifications**: Firebase Cloud Messaging
- **PDF**: Puppeteer

## Tests

```bash
npm test            # run all tests
npm run test:watch  # watch mode
```

---

## Roadmap

### ✅ Completado
- [x] Build errors resueltos (4 issues TypeScript)
- [x] Lint errors resueltos (4 `any`-types + 20 unused vars)
- [x] Auth agregada a 7 API routes (contracts, maintenance, jobs, scrape, notifications, tokens, index)
- [x] IDOR vulnerabilities corregidos (userId desde sesión, nunca del body)
- [x] XSS fix en PDF template (`escapeHtml()`)
- [x] 5 in-memory Maps migrados a Supabase (contracts, filters, tenant-profile, maintenance, notification-service)
- [x] SQL migrations reescritos (002: ALTER TABLE, 003: JSONB columns, 004: sin duplicados)
- [x] RLS habilitado en todas las tablas
- [x] Config env vars (Redis, Puppeteer path)
- [x] 10 UI pages completas (login, signup, forgot-password, dashboard, alerts, profile, contracts, maintenance, billing, settings)
- [x] Auth context provider + useAuth() hook
- [x] Sidebar + DashboardLayout components
- [x] Landing page pública (/) con hero, features, pricing
- [x] Error pages (not-found.tsx, error.tsx)
- [x] Rate limiting in-memory (src/lib/rate-limit.ts)
- [x] Structured logger (src/lib/logger.ts)
- [x] Email templates HTML para Supabase Auth (confirm, reset, magic-link)
- [x] Páginas legales (Términos y Condiciones, Política de Privacidad - Ley 25.326)
- [x] 87 unit tests pasando (dedup, index-calculator, parser, matcher)
- [x] Vitest configurado con alias @

### 🔲 Pendiente - Configuración Externa (requiere servicios)
- [ ] Configurar proyecto Supabase (crear tablas, copiar credenciales a .env.local)
- [ ] Ejecutar migraciones SQL en Supabase Dashboard
- [ ] Crear productos Stripe (Premium $4999/mes, Pro $9999/mes), copiar price IDs
- [ ] Configurar Stripe Webhooks en producción (endpoint: /api/webhook)
- [ ] Configurar Redis para producción (Upstash o similar)
- [ ] Configurar Firebase Cloud Messaging (proyecto + vapid key)
- [ ] Crear cuenta Apify y configurar actors
- [ ] Deploy a Vercel (dominio, SSL, env vars en producción)

### 🔲 Pendiente - Funcionalidad
- [ ] Conectar IPC/ICL a fuente real de datos (actualmente hardcoded May 2026)
- [ ] Integrar rate-limit.ts en API routes (importar y aplicar)
- [ ] Integrar logger.ts en API routes (logRequest en cada endpoint)
- [ ] Webhook handler funcional para Stripe (suscripciones reales)
- [ ] Push notifications end-to-end (FCM -> BullMQ -> envío)
- [ ] Scraping real con Apify (configurar actors, verificar output)
- [ ] Paginación en listados de propiedades
- [ ] Búsqueda de propiedades por texto libre
- [ ] Filtros guardados con límite según plan (Free: 2, Premium: ilimitado)
- [ ] Alertas con límite según plan (Free: 2, Premium: ilimitado)
- [ ] Dashboard del inquilino: estadísticas, propiedades vistas, alerts activas

### 🔲 Pendiente - UX/UI
- [ ] Página de carga (loading.tsx) para cada sección
- [ ] Form validation completa (todos los formularios)
- [ ] Toast notifications para feedback de usuario
- [ ] Confirmación antes de acciones destructivas (delete, cancel subscription)
- [ ] Empty states para listados vacíos
- [ ] Skeleton loaders
- [ ] Responsive testing completo (mobile, tablet, desktop)

### 🔲 Pendiente - Seguridad
- [ ] Rate limiting en API routes (ya creado, falta integrar)
- [ ] CSRF protection
- [ ] Content Security Policy headers
- [ ] Input sanitization en todos los formularios
- [ ] Audit log para acciones sensibles (delete account, change plan)
- [ ] RLS policies a nivel de usuario (actualmente solo service_role)

### 🔲 Pendiente - DevOps / Infra
- [ ] CI/CD pipeline (GitHub Actions: lint + test + build)
- [ ] Error monitoring (Sentry o similar)
- [ ] Analytics (Vercel Analytics o Plausible)
- [ ] Backups automáticos de Supabase
- [ ] Health check endpoint (/api/health)
- [ ] Documentation API (OpenAPI/Swagger)

### 🔲 Pendiente - Legal / Compliance
- [ ] Páginas legales ya creadas (/terms, /privacy) - verificar que cumplan Ley 25.326
- [ ] Banner de cookies / consentimiento tracking
- [ ] Formulario de ejercer derechos ARCO (acceso, rectificación, cancelación, oposición)
- [ ] Términos específicos para scraping de portales inmobiliarios
