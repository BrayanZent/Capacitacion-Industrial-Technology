# Simulador VACON NX — reestructuración de UX + segunda pantalla Multimonitor

**Fecha:** 2026-08-16
**Estado:** Aprobado, pendiente de plan de implementación
**Extiende a:** [2026-08-16-vacon-nx-simulador-modulos-design.md](2026-08-16-vacon-nx-simulador-modulos-design.md)

## Contexto

El simulador (`capacitaciones/vacon/display/index.html`) ya está en producción
con 7 módulos y 36 tareas guiadas. El dueño del producto probó todo el flujo
manualmente esta sesión y encontró varios huecos de usabilidad reales (no
bugs de lógica): el orden de módulos no sigue el flujo natural de una puesta
en marcha, el panel de tarea mezcla teoría/pista/pasos sin jerarquía clara,
los pasos de una tarea son un párrafo largo en vez de una lista accionable,
y solo se puede "revisar" tareas ya completadas, no navegar libremente ni
reiniciar un módulo completo. Además pidió una función nueva: una segunda
pantalla LCD dedicada solo al Multimonitor, para no tener que elegir entre
"ver las 3 variables en marcha" y "navegar parámetros" en la única pantalla
que existe hoy.

## Objetivo

1. Reordenar los 7 módulos según el flujo real de puesta en marcha.
2. Agregar un glosario breve de M/G/P al principio del primer módulo.
3. Quitar 2 bullets específicos de teoría de "Puesta en marcha" (seguridad
   pre-energización — el usuario decidió que no van).
4. Reestructurar el panel de tarea: teoría del módulo arriba, después
   **pista** (antes iba después), después el enunciado convertido de
   párrafo a **lista de pasos**, y al final navegación + estado.
5. Reemplazar la navegación actual (Tarea anterior / Volver a la tarea
   actual) por **Tarea anterior / Tarea siguiente** (paginación libre en
   ambas direcciones por todas las tareas del módulo) + **Reiniciar
   módulo** (nuevo).
6. Agregar una **segunda pantalla LCD**, dedicada al Multimonitor, que
   aparece automáticamente al completar el módulo Multimonitor y queda
   visible en todos los módulos de ahí en adelante. Tiene su propio set
   reducido de botones (▲▼ Enter) para reasignar las 3 posiciones sin
   salir del módulo en el que se esté. **Ambas pantallas leen/escriben
   los mismos 3 valores (`engine.valores['MULTI.1/2/3']`)** — la forma
   original de llegar al Multimonitor navegando en el panel principal
   (M1 → … → "Multimonitor") sigue funcionando exactamente igual que hoy;
   la pantalla nueva es una vista y un editor adicional en paralelo, no
   un reemplazo.

**Explícitamente fuera de este plan:** el rediseño del módulo "Diagnóstico
de fallas" (hoy es forzar falla → leer M4 → resetear, se siente pobre).
Pendiente — se le va a pedir una propuesta a `ing-vdf` en una sesión
separada antes de decidir el diseño.

## 1. Orden de módulos

Nuevo orden en `NXModules`:

```
puestaEnMarcha → identificacion → multimonitor → panel → rampas → fallas → encoder
```

(Hoy es: puestaEnMarcha, identificacion, rampas, panel, multimonitor, fallas,
encoder.) Cambia solo el orden de los objetos en el array — ningún módulo
cambia de contenido por este ítem. `moduloActual` sigue arrancando en
`NXModules[0].id` (sigue siendo `'puestaEnMarcha'`).

## 2. Glosario M/G/P

Se agregan 1-2 bullets nuevos al **principio** del array `teoria` de
"Puesta en marcha" (que sigue siendo el primer módulo tras el reorden):
explican brevemente que M = Menú (M1-M7, el nivel más alto), G = Grupo de
parámetros dentro de M2 (ej. G2.1-G2.8), P = Parámetro individual dentro de
un grupo (ej. P2.6) — suficiente para que alguien nuevo entienda la
nomenclatura que va a ver en cada pista de acá en adelante.

## 3. Quitar texto de seguridad

Se eliminan del array `teoria` de "Puesta en marcha" estos 2 bullets
exactos (agregados en una sesión anterior, el usuario decidió que no
aportan aquí):

> "Antes de energizar: verificar el aislamiento del motor (megado), el
> torque de las conexiones de potencia, y que la tensión de red medida
> coincida con lo que vas a cargar en P2.6. En la primera prueba de
> marcha, el motor debe girar SIN la carga mecánica acoplada."

> "El bus de continua (V1.8 "Voltaje DC-link" en M1) no se descarga al
> instante al cortar la alimentación — los condensadores retienen tensión
> peligrosa durante varios minutos. Esperar el tiempo indicado en la placa
> del equipo antes de abrir el gabinete es la regla de seguridad más
> repetida del manual VACON."

## 4. Reestructurar el panel de tarea

### Cambio de datos: `enunciado` (string) → `pasos` (array de strings)

Cada una de las 36 tareas de `NXModules` cambia su campo `enunciado` por
`pasos`, una lista ordenada de 1 a ~4 strings cortos (cada uno una acción
concreta). Ejemplo, tarea `placa-tension` (hoy):

```js
enunciado: 'Placa del motor: Tensión nominal = 460 V. Configurá P2.6 (M2 → G2.1).'
```

pasa a:

```js
pasos: [
  'Placa del motor: Tensión nominal = 460 V.',
  'Configurá P2.6 en M2 → G2.1.'
]
```

Para tareas que ya son un solo paso simple, `pasos` tiene un solo elemento
— sigue rindiendo como una lista de un ítem, no hace falta forzar
artificialmente más de un paso. `pista`, `accion` y `verificar` no
cambian de forma, solo `enunciado`→`pasos`.

### Nuevo orden de render en `#panel-tasks`

```
[Nombre del módulo]                          <- ya existe, sin cambios
[Teoría del módulo]                          <- ya existe, sin cambios
──────────────────────────────────────────
Pista: [texto de pista]                      <- ANTES iba después de los pasos
• [paso 1]                                   <- lista, no párrafo
• [paso 2]
──────────────────────────────────────────
[← Tarea anterior] [Tarea siguiente →] [Reiniciar módulo]
Tarea X de Y [— revisando, si no es la tarea activa real]
```

## 5. Navegación de tareas

Se simplifica el mecanismo agregado hoy más temprano (Tarea
anterior/Volver a la tarea actual) a **paginación libre**:

- `indiceVisiblePorModulo[m.id]` (ya existe) pasa a poder moverse en
  **ambas direcciones** dentro de `[0, tareas.length-1]`, no solo hacia
  atrás desde la frontera de progreso real. "Tarea siguiente" avanza la
  vista aunque la tarea todavía no esté completada — mirarla no la
  completa ni dispara su `accion()`/`verificar()` (esa protección ya
  existe: solo corren cuando `idxVisible === idxReal`, se mantiene igual).
- Se quita el botón "Volver a la tarea actual" (ya no hace falta con
  paginación libre).
- **Nuevo: "Reiniciar módulo"** — pone `indicePorModulo[m.id] = 0` y
  `indiceVisiblePorModulo[m.id] = 0` para ESE módulo únicamente, limpia
  las banderas de `tareaAccionEjecutada` de sus tareas, guarda en
  localStorage. **No resetea parámetros del equipo** (P2.x, P3.x, etc.)
  — alcance acordado explícitamente con el usuario: reiniciar el progreso
  de las tareas, no el estado del motor. Se documenta esta limitación en
  un comentario junto al botón para que quede claro que no es un reset
  de fábrica.

## 6. Segunda pantalla Multimonitor

### Cuándo aparece

Se deriva de `indicePorModulo['multimonitor']` — no hace falta una
bandera nueva persistida. Aparece (se renderiza) cuando:

```js
indicePorModulo['multimonitor'] >= NXModules.filter(m => m.id === 'multimonitor')[0].tareas.length
```

Es decir, al completar las 5 tareas del módulo Multimonitor (que incluye
asignar las 3 posiciones y confirmar la vista). Como `indicePorModulo` ya
persiste en `localStorage`, la pantalla vuelve a aparecer sola en visitas
futuras sin lógica extra.

### Dónde y cómo se ve

Debajo del panel LCD original (mismo contenedor `#panel-root` o un bloque
hermano inmediatamente después), mismo estilo visual (fondo oscuro,
texto verde/ámbar tipo LCD), con un título encima tipo "Multimonitor —
vista secundaria". Muestra las mismas 3 líneas que ya arma el código
existente para la vista del nodo "Multimonitor" en el panel principal
(reutiliza el mismo cálculo vía `nombreDeUbicacion(engine.valores['MULTI.N'])`),
más un indicador simple (ej. paréntesis o resaltado) de cuál de las 3
posiciones está seleccionada para editar en este panel.

### Botones (▲ ▼ Enter — reducido, sin start/stop/reset)

Nueva variable de sesión (no persistida) `multimonitorPanelSlot` (0, 1 o
2), independiente del `ruta` del panel principal:

- **Enter**: avanza `multimonitorPanelSlot` al siguiente (0→1→2→0…),
  cambia cuál posición está "seleccionada" (resaltada) para editar.
- **▲ / ▼**: ciclan el valor de `engine.valores['MULTI.' + (slot+1)]`
  usando exactamente la misma lógica de ciclado que ya usan los
  parámetros enum del panel principal (reutilizar, no duplicar).

Como ambos paneles leen/escriben las mismas claves (`MULTI.1/2/3`),
cambiar una posición desde el panel nuevo se refleja también si en algún
momento se vuelve a navegar al nodo "Multimonitor" del panel principal, y
viceversa — son dos vistas de la misma fuente de verdad, sin
sincronización manual necesaria.

### Se sigue pudiendo usar desde el panel principal

Sin cambios: `_hijosDe`, la entrada "MULTI" al final de la lista de M1,
y el caso especial en `render()` que muestra las 3 líneas cuando
`idActual === 'MULTI'`, siguen exactamente igual que hoy. La pantalla
nueva es aditiva.

## Pruebas

Mismo patrón `?test=1` para lo que sea lógica de motor (ciclado de
`multimonitorPanelSlot`, que ambos paneles compartan estado). El
reordenamiento de módulos, el cambio `enunciado`→`pasos`, y el layout del
panel de tarea no son testeables por el harness (son de contenido/DOM) —
se verifican con el método ya usado esta sesión: copia temporal sin
`gate.js`, servidor local, Preview MCP con clicks reales y capturas, en
PC y mobile.

## No objetivos (YAGNI)

- No se rediseña "Diagnóstico de fallas" en este plan — queda pendiente,
  explícitamente, para una consulta a `ing-vdf` en otra sesión.
- No se resetean parámetros del equipo al reiniciar un módulo — solo
  progreso de tareas.
- No se persiste `multimonitorPanelSlot` en localStorage — es estado de
  sesión, se reinicia en 0 al recargar la página (comportamiento
  aceptable, no se pidió lo contrario).
- No se toca la lógica de `press('select')` / `multimonitorActivo` del
  panel principal — sigue controlando únicamente la vista del nodo
  "MULTI" ahí, sin relación con la pantalla nueva.
