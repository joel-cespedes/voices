# ADR 0002 — Arquitectura hexagonal (puertos y adaptadores)

- **Estado**: aceptada
- **Fecha**: 2026-06-17

## Contexto

La app debe poder evolucionar (cambiar la fuente de datos, el reproductor, el
almacenamiento) sin reescrituras, y ser extensible por agentes de IA sin romper
nada. Requiere lógica de negocio aislada y testeable.

## Decisión

Adoptar **arquitectura hexagonal** en cuatro capas con dependencias apuntando solo
al dominio:

- `domain/`: entidades y reglas puras, **cero** Angular/infraestructura.
- `application/`: casos de uso + **puertos** (interfaces).
- `infrastructure/`: adaptadores que implementan los puertos.
- `ui/`: componentes Angular que consumen casos de uso por **inyección de
  dependencias** mediante tokens (uno por puerto).

`app.config.ts` es la **única** composición: ata cada token a su adaptador.

## Consecuencias

- **+** Cambiar fuente de datos/reproductor = nuevo adaptador + 1 línea en
  `app.config.ts`. El dominio no se toca.
- **+** `domain` y `application` se testean sin Angular ni red (fakes en
  `application/testing`).
- **+** Invariantes verificables con un `grep` (ver AGENTS.md).
- **−** Más ficheros y un poco de ceremonia (puertos + tokens) frente a llamar a
  servicios directamente. Se asume a cambio de la mantenibilidad.
