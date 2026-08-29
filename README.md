# Imperfectos — MVP

PWA que conecta vendedores de frutas y verduras estéticamente imperfectas pero aptas para consumo, con compradores que valoran el ahorro (pensiones, comedores, familias). Tarija, Bolivia.

## Stack

- **Frontend:** React + Vite, PWA instalable (`vite-plugin-pwa`)
- **Backend / DB / Auth:** Supabase (Postgres, free tier)
- **Ruteo:** react-router-dom
- **Tests:** Vitest

## Cómo levantarlo localmente

```bash
npm install
cp .env.example .env   # completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY con las credenciales del proyecto de Supabase
npm run dev
```

Corre en `http://localhost:5173`.

## Comandos útiles

```bash
npm run dev       # servidor de desarrollo
npm run build     # build de producción
npm run test      # corre los tests (incluye la lógica de tarifas)
npm run lint      # linter
```

## Estructura del proyecto

```
src/
  features/
    auth/         → registro/login por teléfono
    publicar/      → publicar producto + lógica de tarifa
    explorar/       → listado de publicaciones + contacto por WhatsApp
    admin/         → panel de administración del equipo
  lib/
    supabaseClient.js  → cliente único de Supabase
    tarifas.js          → lógica pura de cálculo de tarifa por tramos (con tests)
supabase/
  migrations/       → esquema SQL, aplicar en el SQL editor de Supabase
```

## Flujo de trabajo del equipo

Este repo sigue el flujo `main` / `develop` / `feature/*` descrito en `docs/git_workflow.md` y los prompts de desarrollo módulo por módulo están en `docs/prompts_desarrollo_mvp.md`. Antes de tocar código, revisa esos dos documentos.

Reglas rápidas:
- Nunca push directo a `main` ni `develop`. Todo entra por Pull Request.
- Cada rama `feature/*` corresponde a un módulo específico — ver la tabla en `docs/git_workflow.md`.
- `main` siempre debe estar demo-ready.

## Modelo de negocio implementado en el código

- 2 publicaciones gratis por vendedor por mes calendario.
- Desde la 3ra, tarifa fija según tramo de valor declarado del lote (no comisión sobre venta, para evitar el incentivo a subreportar). Ver `src/lib/tarifas.js`.
- Sin pasarela de pago integrada: el pago de la tarifa se confirma manualmente por un admin en el panel (`src/features/admin`).
- Sin delivery propio: solo coordinación de recojo entre vendedor y comprador.
