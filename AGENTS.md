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
