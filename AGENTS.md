<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Zuklo - Cómo Levantar el Proyecto

## Prerequisitos
- Node.js 18+
- Redis (para BullMQ)
- Cuenta de Neon (gratis — PostgreSQL serverless)
- Cuenta de Stripe (para monetización)

## Pasos para correr

```bash
# 1. Instalar dependencias (si no están instaladas)
npm install

# 2. Correr en modo desarrollo
npm run dev
```

La app arranca en http://localhost:3000

**Nota:** Redis, Neon y Stripe no son necesarios para que arranque en dev. Las APIs van a fallar si no están configuradas, pero la app carga.

## Variables de entorno (opcional para dev)

Copia `.env.example` a `.env.local` y completá:

```bash
cp .env.example .env.local
```

Las que necesitás para funcionalidad completa:
- `DATABASE_URL` → Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` → JWT secret (32+ chars)
- `STRIPE_SECRET_KEY` → billing
- `STRIPE_PREMIUM_PRICE_ID` → Stripe price ID for Premium plan
- `STRIPE_PRO_PRICE_ID` → Stripe price ID for Pro plan
- `STRIPE_WEBHOOK_SECRET` → Stripe webhook signing secret
- `REDIS_URL` → background jobs (scraping automático)
- `APIFY_TOKEN` → scraping de propiedades
- `NEXT_PUBLIC_SENTRY_DSN` → Sentry error monitoring (optional)

## Build de producción

```bash
npm run build
npm start
```

## Arquitectura

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS v4
- **Auth**: Custom JWT (jose library) + Drizzle ORM
- **DB**: Neon PostgreSQL + Drizzle ORM (15 tablas)
- **Payments**: Stripe (3 planes: Free/Premium/Pro)
- **Scraping**: Apify (Zonaprop, Argenprop) + seed data
- **Cola de jobs**: BullMQ + Redis
- **Monitoreo**: Sentry
- **PDF**: Puppeteer (fallback HTML)
- **Hosting**: Vercel
- **CI/CD**: GitHub Actions

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
- [x] 5 in-memory Maps migrados a Drizzle ORM (contracts, filters, tenant-profile, maintenance, notification-service)
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
- [x] Landing page pública (/) con hero, features, pricing
- [x] Rate limiting integrado en 13 API routes (por IP y usuario)
- [x] Structured logger (logRequest) integrado en 13 API routes
- [x] Loading states (loading.tsx) para 7 pages
- [x] Toast notifications (ToastProvider + useToast hook)
- [x] Form validation completa en 8 formularios
- [x] Empty states, skeleton loaders, confirm dialog components
- [x] CSRF protection (src/lib/csrf.ts)
- [x] CSP headers + security headers (next.config.ts)
- [x] Input sanitization (src/lib/sanitize.ts)
- [x] Audit log (src/lib/audit-log.ts + tabla audit_logs)
- [x] IPC/ICL conectado a fuentes reales con fallback (src/lib/index-fetcher.ts)
- [x] Health check endpoint (/api/health)
- [x] API docs endpoint (/api/docs)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Database backup script (scripts/backup.sh)
- [x] Cookie consent banner
- [x] Página ARCO (/arco)
- [x] Términos de scraping agregados en /terms
- [x] Política de cookies agregada en /privacy
- [x] Supabase self-hosted Docker setup (docker/supabase/)
- [x] Migrated from Supabase to Drizzle ORM + Neon PostgreSQL
- [x] Custom JWT auth with jose library (src/lib/auth.ts)
- [x] Complete Drizzle schema: 15 tables (src/lib/schema.ts)
- [x] Neon HTTP driver client (src/lib/db.ts)
- [x] Auth API route: signup, login, logout, get-user (src/app/api/auth/route.ts)
- [x] All 7 lib files migrated from Supabase to Drizzle ORM
- [x] All snake_case → camelCase fixed in Drizzle queries
- [x] Build passing: 35 routes (18 static + 17 dynamic)
- [x] 87 tests still passing after migration
- [x] Properties listing page with pagination, search, filters (/properties)
- [x] Properties API with text search, pagination, sorting (/api/properties)
- [x] Plan-based limits enforced on filters/alerts creation (Free: 2, Premium: ilimitado)
- [x] Dashboard improved: stat cards, auto-refresh, quick actions, error states
- [x] Stripe webhook handler: checkout.session.completed, payment_succeeded/failed
- [x] Skeleton loaders detailed for all 8 loading pages + properties
- [x] Responsive design improved across all pages (mobile, tablet, desktop)
- [x] Sentry installed and configured (@sentry/nextjs)
- [x] Empty states enhanced with SVG icons and contextual messages
- [x] Sidebar updated with Properties nav entry
- [x] Seeded 13 propiedades argentinas reales en DB (scripts/seed.ts)
- [x] Apify actors actualizados: Zonaprop (`ocrad/zonaprop-property-scraper`) + Argenprop (`ecomscrape/argenprop-property-search-scraper`)
- [x] Scrape API graceful degradation — fallback a DB cuando Apify falla
- [x] Deploy Vercel: https://zuklo.vercel.app
- [x] Todas las env vars configuradas en Vercel (Neon, Stripe, Apify, JWT)
- [x] README.md completo con documentación real del proyecto
- [x] Resend email service — verificación, reset password, contacto propietario
- [x] Favoritos — tabla, API, UI (botón guardar en detalle de propiedad)
- [x] Contactar propietario — formulario + envío de email
- [x] Centro de notificaciones — página con historial de alertas
- [x] Cheerio scraper fallback — scraping sin Apify para Zonaprop/Argenprop
- [x] Brute-force protection — rate limiting estricto en login (5 intentos/15min)
- [x] 16 tablas en DB (favoritos agregada)

### 🔲 Pendiente - Crítico (bloquea lanzamiento)
- [x] **Fix auth**: login no verifica password, signup no hashea — cualquier password funciona
- [x] **Página detalle de propiedad** `/properties/[id]` — no existe, solo cards con link externo
- [x] **Reset de password** — stub que dice "no disponible aún", falta flujo completo con email
- [x] **Verificación de email** — campo existe en DB pero nunca se usa
- [x] **Páginas éxito/cancel de Stripe** — redirigen a 404 después de pagar
- [x] **Cambio de password** en settings — endpoint no existe
- [x] **Eliminación de cuenta** — botón deshabilitado, sin API

### 🔲 Pendiente - Alto (debería tener para lanzar)
- [x] **Favoritos/Guardados** — sin tabla, sin API, sin UI
- [x] **Contactar propietario** — sin formulario ni messaging
- [x] **Centro de notificaciones** — API existe, falta la página
- [x] **SEO por página** — sin metadata, sitemap, robots, OG
- [x] **Componentes reutilizables** — Pagination, FormField inline
- [x] **Preferencias notificaciones** — en settings es solo estado local, no persiste

### 🔲 Pendiente - Configuración Externa (requiere servicios)
- [ ] Crear productos Stripe (Premium $4999/mes, Pro $9999/mes), copiar price IDs en .env.local
- [ ] Configurar Stripe Webhooks en producción (endpoint: /api/webhook, events: checkout.session.completed, customer.subscription.*, invoice.*)
- [ ] Configurar Firebase Cloud Messaging (proyecto + vapid key para push notifications)
- [ ] Deploy a Vercel (dominio, SSL, env vars en producción)
- [ ] Configurar Sentry DSN en .env.local (NEXT_PUBLIC_SENTRY_DSN)
- [ ] Conectar audit_logs a tabla real (requiere migración 005 en DB)

### 🔲 Pendiente - Seguridad
- [ ] RLS policies a nivel de usuario (unificar TEXT/UUID user_id)

### 🔲 Pendiente - Medio (post-lanzamiento)
- [x] Panel admin
- [x] Onboarding wizard para nuevos usuarios
- [x] Test de componentes y API routes
- [x] Configurar imágenes externas en next.config.ts (dominios de portales)
- [x] Limpiar dependencia `@supabase/supabase-js` (ya no se usa)
- [x] Renombrar `src/lib/supabase.ts` (es wrapper de auth.ts)
- [x] SEO completo (sitemap, robots, metadata por página, OG)
- [x] 96 tests pasando (4 lib + 3 scraper + 4 email + 3 auth + 87 originales)

### 🔲 Pendiente - Bajo (futuro)
- [ ] Analytics dashboard (Vercel Analytics o Plausible)
- [ ] API keys para plan Pro
- [ ] Multi-idioma
- [ ] PWA / manifest.json
- [ ] E2E tests (Playwright)
