# ZÉRO — Paletas artesanales & granizados (Popayán)

Carta digital, pedidos por WhatsApp y panel admin de ZÉRO. Es una copia independiente del proyecto base en React + Vite que se clona para cada negocio cliente. Ver el contexto completo en:

- [`brief-desarrollo-proyecto-base.md`](./brief-desarrollo-proyecto-base.md) — idea de negocio, requisitos de diseño, seguridad y buenas prácticas.
- [`contexto-proyecto-base.md`](./contexto-proyecto-base.md) — arquitectura, modelo de datos de Supabase y estructura de carpetas.
- [`CHANGELOG.md`](./CHANGELOG.md) — historial de decisiones técnicas a medida que avanza el proyecto.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completa con tu URL y anon key de Supabase
npm run dev
```

## Al clonar este proyecto para un negocio nuevo

1. Copia `.env.example` a `.env.local` con las credenciales de Supabase (compartidas entre todos los negocios).
2. Actualiza `src/config/negocio.config.js` con el `negocioId`, nombre y WhatsApp, y la paleta en `:root` de `src/index.css` del nuevo negocio.
3. Personaliza el diseño (colores, tipografía, imágenes) según la identidad del cliente.

## Scripts

- `npm run dev` — servidor de desarrollo.
- `npm run build` — build de producción.
- `npm run lint` — lint con Oxlint.
- `npm run preview` — sirve el build de producción localmente.
