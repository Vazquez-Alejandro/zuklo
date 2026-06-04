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

### 🔲 Pendiente - Configuración Externa (requiere servicios)
- [ ] Levantar Supabase Docker: `bash docker/supabase/setup.sh`
- [ ] Crear productos Stripe (Premium $4999/mes, Pro $9999/mes), copiar price IDs
- [ ] Configurar Stripe Webhooks en producción (endpoint: /api/webhook)
- [ ] Configurar Redis para producción (Upstash o similar)
- [ ] Configurar Firebase Cloud Messaging (proyecto + vapid key)
- [ ] Crear cuenta Apify y configurar actors
- [ ] Deploy a Vercel (dominio, SSL, env vars en producción)
- [ ] Instalar Sentry: `npm install @sentry/nextjs` y recrear configs

### 🔲 Pendiente - Funcionalidad
- [ ] Webhook handler funcional para Stripe (suscripciones reales)
- [ ] Push notifications end-to-end (FCM -> BullMQ -> envío)
- [ ] Scraping real con Apify (configurar actors, verificar output)
- [ ] Paginación en listados de propiedades
- [ ] Búsqueda de propiedades por texto libre
- [ ] Filtros guardados con límite según plan (Free: 2, Premium: ilimitado)
- [ ] Alertas con límite según plan (Free: 2, Premium: ilimitado)
- [ ] Dashboard del inquilino: estadísticas, propiedades vistas, alerts activas
- [ ] Conectar audit_logs a tabla real (requiere migración 005 en DB)

### 🔲 Pendiente - UX/UI
- [ ] Responsive testing completo (mobile, tablet, desktop)
- [ ] Skeleton loaders más detallados para cada page

### 🔲 Pendiente - Seguridad
- [ ] RLS policies a nivel de usuario (unificar TEXT/UUID user_id)

### 🔲 Pendiente - DevOps / Infra
- [ ] Analytics (Vercel Analytics o Plausible)
- [ ] Backups automáticos de Supabase (cron con scripts/backup.sh)
