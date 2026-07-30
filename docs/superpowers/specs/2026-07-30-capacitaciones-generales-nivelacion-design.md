# Diseño: tres capacitaciones generales de nivelación (electricidad básica, puesta en marcha, diagnóstico)

## Contexto

El sitio ofrece capacitaciones interactivas de una sola página HTML (formato `MODULES`, ver skill `capacitacion-vacon-style`). Hoy existe una única capacitación "sin marca" (`capacitaciones/general/introduccion-vfd.html`, categoría "Fundamentos · Sin marca" en el portal), pensada como puerta de entrada antes de las capacitaciones específicas de marca (VACON NXP/NXC, ABB ACS800/ACS1000/firmware/DriveWindow).

El público de esta línea "general" son dos perfiles:
- **Personal nuevo sin experiencia en VFDs**, que necesita nivelarse antes de entrar a cualquier capacitación de marca.
- **Personal mantenedor con experiencia**, que ya usa las capacitaciones de marca directamente.

Introducción a VFD cubre el "qué es y por qué" a alto nivel, pero dos cosas quedaron claras al revisarla junto con el agente especialista (`ing-vdf`):
1. Da por sabidos fundamentos eléctricos (AC/DC, trifásica, tierra, multímetro, lectura de placa de motor) que el personal nuevo típicamente no trae.
2. Sus menciones de "puesta en marcha" y "seguridad eléctrica" son deliberadamente conceptuales/de observador — no procedimentales.

## Objetivo

Agregar tres capacitaciones generales nuevas que, junto con Introducción a VFD, formen una currícula de 4 piezas con progresión clara:

```
1. Introducción a VFD (existente)
        ↓
2. Electricidad industrial básica para no electricistas (nueva)
        ↓
3. Puesta en marcha y parametrización genérica (nueva)
        ↓
4. Diagnóstico y fallas comunes (nueva)
        ↓
   Capacitaciones específicas de marca (VACON / ABB / …)
```

Al terminar las 4, el lector debe tener base sólida para empezar cualquier curso de marca sin fricción por fundamentos faltantes.

## Alcance de esta entrega

Las 3 capacitaciones nuevas (2, 3 y 4 de la lista de arriba). No se modifica el contenido de Introducción a VFD (capacitación 1) salvo, si hiciera falta, un enlace cruzado de navegación al final ("seguí con…").

## Desglose de módulos

### Capacitación 2 — Electricidad industrial básica para no electricistas
`capacitaciones/general/electricidad-basica.html`

1. Corriente continua (DC) vs. alterna (AC): conceptos base
2. Sistemas trifásicos: por qué la industria usa 3 fases
3. El motor de inducción: estator, rotor y velocidad síncrona — puente directo hacia "el VFD cambia la frecuencia para cambiar la velocidad" de Cap. 1
4. Puesta a tierra: qué es y por qué protege
5. Uso correcto de un multímetro (voltaje, corriente, continuidad, resistencia)
6. Lectura de la placa de datos de un motor (V, A, Hz, RPM, cos φ, clase de aislamiento)
7. Glosario eléctrico esencial

### Capacitación 3 — Puesta en marcha y parametrización genérica
`capacitaciones/general/puesta-en-marcha.html`

1. Antes de energizar: inspección de instalación (cableado potencia/control, tierra, ventilación) — versión práctica/procedimental, distinta del módulo conceptual de Cap. 1
2. De la placa del motor a los parámetros básicos del VFD
3. Parámetros comunes a cualquier marca (rampas, límites de corriente, tipo de control)
4. Pruebas en vacío
5. Pruebas con carga y ajuste fino
6. Documentar la puesta en marcha y checklist de traspaso

### Capacitación 4 — Diagnóstico y fallas comunes
`capacitaciones/general/diagnostico-fallas.html`

1. Cómo pensar el diagnóstico: causa raíz vs. síntoma
2. Fallas de sobrecorriente/sobrecarga
3. Fallas de sobre/subtensión del bus DC
4. Fallas de sobretemperatura
5. Fallas de tierra y fuga
6. Historial de fallas y checklist de primera respuesta
7. Mantenimiento preventivo: buenas prácticas para evitar fallas recurrentes — cierre que empalma con las capacitaciones de marca, donde se profundiza el detalle específico

Cada capacitación sigue el estándar ya definido en `capacitacion-vacon-style`: 5 preguntas de quiz por módulo, helpers `H3`/`NOTE`/`INFO`/`IMG`, overview con progreso, tema claro/oscuro compartido, `syncPortalProgress()`.

## Decisiones técnicas específicas de esta entrega

- **Sin manual/PDF fuente.** A diferencia de las capacitaciones de marca, no hay un PDF que citar. El contenido se redacta como conocimiento general de industria y se marca con `INFO()` en vez de citas a manual — `IMG()` se usa con `source` omitido salvo que una imagen puntual sí tenga una fuente citable.
- **Validación técnica vía `ing-vdf`.** Como no hay manual contra el cual verificar, el rol de `ing-vdf` en estas 3 capacitaciones es confirmar que las afirmaciones sean correctas como conocimiento general aplicable a cualquier fabricante (ver ajuste ya aplicado a `.claude/agents/ing-vdf.md`).
- **Imágenes/diagramas:** si se generan infográficos densos (como los de Introducción a VFD), usar la variante `.fig.wide` documentada en `capacitacion-vacon-style`. No hay imágenes fuente todavía para estas 3 — se arrancará con `PLACEHOLDER()` donde corresponda, a integrar después si el usuario provee material, siguiendo el flujo ya documentado de conversión `PLACEHOLDER` → `IMG`.
- **Registro en el portal:** cada capacitación nueva necesita una entrada en `courseDefs()` de `index.html` (raíz), con `brand: 'General'`, y `href` apuntando a su archivo bajo `capacitaciones/general/`.
- **Progresión visible:** agregar en el `sidebar-foot` o cierre de cada capacitación un enlace a la siguiente de la secuencia (2→3→4), y opcionalmente un enlace desde el cierre de Cap. 1 hacia Cap. 2, para reforzar la ruta de aprendizaje sugerida sin bloquear acceso libre a las demás.

## Ejecución: trabajo en paralelo

Las 3 capacitaciones son independientes entre sí (no comparten estado ni archivo). El plan de implementación debe estar estructurado para que `web-creator` (redacción/HTML) e `ing-vdf` (validación técnica) trabajen en paralelo dentro de cada capacitación, y para que las 3 capacitaciones en sí puedan avanzar en paralelo como workstreams independientes — ver skill `subagent-driven-development` / `dispatching-parallel-agents` al pasar esto a plan.

## Fuera de alcance

- No se rediseña el portal (`index.html` raíz) más allá de agregar las 3 entradas a `courseDefs()`.
- No se agregan capacitaciones de marca nuevas en esta entrega.
- No se define contenido de las capacitaciones de marca que vendrían después de estas 4 (fuera del alcance de este spec).
