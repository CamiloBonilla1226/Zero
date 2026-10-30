# Instrucciones para Claude en este proyecto

## Flujo de trabajo obligatorio para cada cambio

1. **Changelog**: toda funcionalidad nueva, corrección de error o decisión técnica relevante se agrega como entrada nueva en [`CHANGELOG.md`](./CHANGELOG.md) (fecha + qué se hizo + por qué, si la razón no es obvia). Es el historial de decisiones del proyecto — ver el formato ya usado ahí.
2. **Commit y push por cambio**: cada cambio se confirma con un commit de git (con la cuenta de GitHub del usuario), con un mensaje descriptivo que explique el qué y el por qué — no mensajes genéricos como "update" o "fix". **Después de cada commit se hace `git push` de inmediato**, sin preguntar (pedido explícito del usuario, 2026-10-07). `main` se despliega solo en Vercel, así que la única excepción es un cambio que dependa de una migración de base de datos que el dueño todavía no corrió: en ese caso se verifica primero (consulta de solo lectura a Supabase) y, si falta, se avisa y se espera antes del push, porque desplegarlo rompería producción.
3. **Base de datos**: cualquier cambio en el esquema de Supabase (tabla nueva, columna nueva, política RLS, trigger, función) se documenta también en [`explicacion-script-bd.txt`](./explicacion-script-bd.txt), siguiendo su mismo formato por sección (tabla afectada → qué cambió → por qué → consecuencia en el código). La mayoría de las migraciones las corre el dueño directamente en Supabase (no hay backend propio ni service_role en el código); cuando eso pase, documentar igual el script que el dueño ejecutó.

## Documentos de contexto (leer antes de cambios grandes)

- [`brief-desarrollo-proyecto-base.md`](./brief-desarrollo-proyecto-base.md) — idea de negocio, requisitos de diseño/seguridad/buenas prácticas.
- [`contexto-proyecto-base.md`](./contexto-proyecto-base.md) — arquitectura y modelo de datos de referencia (puede quedar desfasado frente a `explicacion-script-bd.txt`, que es más reciente y detallado).
- [`explicacion-script-bd.txt`](./explicacion-script-bd.txt) — fuente de verdad del estado actual del esquema de Supabase y su historial de migraciones.
- [`CHANGELOG.md`](./CHANGELOG.md) — historial cronológico de decisiones técnicas del proyecto.

## Convenciones ya establecidas (no repetir errores documentados)

- Seguridad de negocio_id/rol siempre vía `app_metadata` (nunca `user_metadata`, que el usuario puede reescribir desde el navegador) — error que ya se cometió dos veces, ver secciones 2 y 12 de `explicacion-script-bd.txt`.
- Toda tabla nueva con RLS debe crear sus políticas en el mismo momento en que se crea la tabla (nunca dejarla con RLS activo y sin políticas).
- Sin bordes redondeados en la UI (esquinas rectas en todo el proyecto).
- Mobile-first.
