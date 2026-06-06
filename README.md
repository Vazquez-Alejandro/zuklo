# Zuklo

Plataforma de búsqueda y gestión de alquileres de propiedades para Argentina. Encuentra, compara y gestiona propiedades desde un solo lugar.

**En producción:** [https://zuklo.vercel.app](https://zuklo.vercel.app)

## Stack Tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework | [Next.js 16](https://nextjs.org) | App Router, Turbopack |
| Lenguaje | TypeScript | |
| UI | [Tailwind CSS v4](https://tailwindcss.com) | |
| Base de datos | [Neon PostgreSQL](https://neon.tech) | Serverless, tier gratuito |
| ORM | [Drizzle ORM](https://orm.drizzle.team) | 16 tablas |
| Autenticación | JWT custom con [jose](https://github.com/panva/jose) | Sesiones de 7 días |
| Pagos | [Stripe](https://stripe.com) | Checkout, Webhooks, Customer Portal |
| Email | [Resend](https://resend.com) | Transaccional (verificación, reset, contacto) |
| Scraping | [Apify](https://apify.com) + [Cheerio](https://cheerio.js.org) | Fallback automático |
| Cola de jobs | [BullMQ](https://bullmq.io) + Redis | |
| Monitoreo | [Sentry](https://sentry.io) | Error tracking |
| CI/CD | [GitHub Actions](https://github.com/features/actions) | Lint, test, build |
| Hosting | [Vercel](https://vercel.com) | Deploy automático |
| PDF | [Puppeteer](https://pptr.dev) | Fallback HTML |

## Funcionalidades

### Implementadas

- **Autenticación** — Login, signup, sesiones JWT (7 días), middleware de protección de rutas, verificación de email, reset de password con email
- **Dashboard** — Stat cards, scraping rápido, grilla de portales, auto-refresh
- **Búsqueda de propiedades** — Búsqueda por texto, filtros avanzados (barrio, precio, moneda, dormitorios, mascotas), paginación
- **Detalle de propiedad** — Página completa con features, descripción, link al portal, botón guardar, contacto al propietario
- **Favoritos** — Guardar propiedades, ver listado de guardadas
- **Contactar propietario** — Formulario de contacto con envío de email vía Resend
- **Filtros/Alertas** — CRUD de filtros de búsqueda con límites por plan (Free: 2, Premium: ilimitado)
- **Notificaciones** — Centro de notificaciones con historial de alertas
- **Contratos** — Lifecycle completo: creación, activación, visualización, eliminación
- **Gastos de mantenimiento** — CRUD por contrato, categorías (plomería, electricidad, etc.), estados (pendiente/aprobado/reembolsado)
- **Perfil de inquilino** — Datos personales, empleo, ingresos, garantes, historial
- **Billing** — 3 planes (Free/Premium/Pro), checkout Stripe, portal de gestión, webhooks
- **Scraping** — Scraping de URLs vía Apify con fallback a Cheerio, deduplicación, guardado en DB
- **PDF** — Generación de PDF del perfil de inquilino (Puppeteer con fallback HTML)
- **Índices IPC/ICL** — Fetch de datos oficiales de indexación con fallback

### Seguridad

- Rate limiting en todas las API routes (por IP y usuario)
- Rate limiting estricto en auth: 5 intentos de login por email cada 15 minutos
- CSP headers + security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Password hashing con SHA-256 + salt + timingSafeEqual
- Input sanitization
- CSRF protection
- Structured logging en todas las API routes
- Cookie consent (LGPD)

### UI/UX

- Landing page pública (hero, features, pricing, footer)
- Sidebar responsive (desktop + mobile hamburger)
- Loading states (skeleton loaders) en 8 páginas
- Empty states con iconos y CTAs
- Toast notifications
- Confirm dialogs
- Páginas legales: Términos, Política de Privacidad (Ley 25.326), ARCO, Cookies

### Infraestructura

- 15 tablas en PostgreSQL con índices optimizados
- 87 unit tests (Vitest)
- CI/CD pipeline (lint, test, build)
- Database backup script
- Health check endpoint (`/api/health`)
- API docs endpoint (`/api/docs`)
- Sentry error monitoring

## Instalación

### Prerequisitos

- Node.js 18+
- Redis (para BullMQ, opcional en dev)
- Cuenta en [Neon](https://neon.tech) (gratis)
- Cuenta en [Stripe](https://stripe.com) (test mode)

### Setup

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/zuklo.git
cd zuklo

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Correr en desarrollo
npm run dev
```

La app arranca en [http://localhost:3000](http://localhost:3000).

### Variables de Entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | Sí | Connection string de Neon PostgreSQL |
| `BETTER_AUTH_SECRET` | Sí | Secret para JWT (32+ caracteres) |
| `STRIPE_SECRET_KEY` | Sí | Stripe secret key (test mode) |
| `STRIPE_WEBHOOK_SECRET` | Sí | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Sí | Stripe publishable key |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | Sí | Price ID del plan Premium |
| `STRIPE_PRICE_PRO_MONTHLY` | Sí | Price ID del plan Pro |
| `RESEND_API_KEY` | Sí | API key de Resend (emails transaccionales) |
| `REDIS_URL` | No | Redis URL (solo para BullMQ) |
| `APIFY_TOKEN` | No | Apify API token (scraping premium) |
| `NEXT_PUBLIC_APP_URL` | No | URL de la app (default: http://localhost:3000) |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN |

### Seed de Datos de Prueba

```bash
npx tsx scripts/seed.ts
```

Inserta 13 propiedades de ejemplo (Palermo, Recoleta, San Telmo, Belgrano, etc.) en la base de datos.

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/                    # 17 API routes
│   │   ├── auth/               # Login, signup, logout
│   │   ├── billing/            # Stripe checkout, portal, cancel
│   │   ├── contracts/          # CRUD contratos
│   │   ├── filters/            # CRUD filtros/alertas
│   │   ├── jobs/               # Scraping jobs + propiedades
│   │   ├── maintenance/        # Gastos de mantenimiento
│   │   ├── notifications/      # Logs de notificaciones
│   │   ├── pdf/                # Generación de PDF
│   │   ├── profile/            # Perfil de inquilino
│   │   ├── properties/         # Búsqueda/filtrado de propiedades
│   │   ├── scrape/             # Scraping vía Apify
│   │   ├── webhook/            # Stripe webhooks
│   │   ├── health/             # Health check
│   │   ├── docs/               # Documentación API
│   │   ├── index/              # Datos IPC/ICL
│   │   ├── arco/               # Derechos ARCO
│   │   └── tokens/             # Device tokens (FCM)
│   ├── (auth)/                 # Páginas de autenticación
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── (dashboard)/            # Páginas autenticadas
│   │   ├── dashboard/
│   │   ├── properties/
│   │   ├── alerts/
│   │   ├── contracts/
│   │   ├── maintenance/
│   │   ├── billing/
│   │   ├── profile/
│   │   └── settings/
│   └── (public)/               # Páginas públicas
│       ├── page.tsx            # Landing page
│       ├── terms/
│       ├── privacy/
│       └── arco/
├── components/                 # Componentes UI
│   ├── sidebar.tsx
│   ├── dashboard-layout.tsx
│   ├── toast.tsx
│   ├── skeleton.tsx
│   ├── empty-state.tsx
│   ├── confirm-dialog.tsx
│   ├── cookie-consent.tsx
│   └── loading.tsx
├── lib/                        # Lógica de negocio
│   ├── auth.ts                 # JWT auth (jose)
│   ├── db.ts                   # Drizzle client (Neon)
│   ├── schema.ts               # 15 tablas
│   ├── apify.ts                # Scraping Apify
│   ├── dedup.ts                # Deduplicación
│   ├── stripe.ts               # Config Stripe
│   ├── monetization.ts         # Límites por plan
│   ├── contracts.ts            # CRUD contratos
│   ├── maintenance.ts          # CRUD mantenimiento
│   ├── filters.ts              # CRUD filtros
│   ├── tenant-profile.ts       # Perfil inquilino
│   ├── rate-limit.ts           # Rate limiting
│   ├── logger.ts               # Structured logging
│   ├── sanitize.ts             # Input sanitization
│   ├── csrf.ts                 # CSRF protection
│   ├── audit-log.ts            # Audit logging
│   └── index-fetcher.ts        # IPC/ICL data
├── sentry.*.config.ts          # Sentry configs
└── middleware.ts                # Auth middleware
```

## Planes

| Plan | Precio | Filtros | Scraping | Perfil |
|------|--------|---------|----------|--------|
| **Free** | Gratis | 2 | Manual | Básico |
| **Premium** | $4,999/mes | Ilimitado | Automático | Completo |
| **Pro** | $9,999/mes | Ilimitado | Automático + API | Multi-propiedad |

## API Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET/POST | `/api/auth` | Public/Protected | Login, signup, logout, get-user, forgot-password, reset-password, update-password, delete-account, verify-email |
| GET | `/api/properties` | Protected | Buscar/filtrar propiedades |
| GET | `/api/properties/[id]` | Protected | Detalle de propiedad |
| GET/POST/DELETE | `/api/favorites` | Protected | CRUD favoritos |
| POST | `/api/contact` | Protected | Contactar propietario |
| GET/POST/DELETE | `/api/filters` | Protected | CRUD filtros de búsqueda |
| GET/POST/PUT/DELETE | `/api/contracts` | Protected | CRUD contratos |
| GET/POST/PUT/DELETE | `/api/maintenance` | Protected | CRUD gastos mantenimiento |
| GET/POST | `/api/billing` | Protected | Info plan, checkout, cancel |
| POST | `/api/webhook` | Public | Stripe webhooks |
| GET/POST/PUT/DELETE | `/api/profile` | Protected | Perfil de inquilino |
| GET | `/api/pdf` | Protected | Generar PDF |
| GET | `/api/notifications` | Protected | Logs de notificaciones |
| POST/GET | `/api/scrape` | Protected | Scraping de URLs |
| GET/POST | `/api/jobs` | Protected | Jobs + scraping |
| GET | `/api/health` | Public | Health check |
| GET | `/api/docs` | Public | Documentación API |
| GET | `/api/index` | Protected | Datos IPC/ICL |

## Testing

```bash
npm test            # Ejecutar todos los tests
npm run test:watch  # Modo watch
```

87 tests unitarios cubriendo: deduplicación, cálculo de índices, parsing, matching.

## Deploy

### Vercel (Recomendado)

```bash
npx vercel --prod
```

### Build de Producción

```bash
npm run build
npm start
```

## Roadmap

Ver [AGENTS.md](./AGENTS.md) para el roadmap completo del proyecto.

## Licencia

Propietario. Todos los derechos reservados.
