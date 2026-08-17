# Simulador VACON NX — UX + segunda pantalla Multimonitor — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reordenar los módulos, agregar un glosario M/G/P, quitar 2 bullets
de teoría, reestructurar el panel de tarea (pista antes de pasos, pasos en
viñetas), simplificar la navegación a paginación libre + arreglar el bug
del reset de módulo que resetea el motor completo, y agregar una segunda
pantalla LCD dedicada al Multimonitor.

**Architecture:** Todo vive en un único archivo HTML de una sola página
(`capacitaciones/vacon/display/index.html`, sin build step) — patrón ya
establecido en todo el proyecto, no se reestructura en múltiples archivos.
Los cambios son: (1) reordenar/editar datos dentro de `NXModules`, (2)
cambiar el esquema de cada tarea de `enunciado:string` a `pasos:string[]`,
(3) reescribir `window.renderTareas()` para el nuevo layout y navegación,
(4) agregar un nuevo bloque de DOM + función de render + wiring de botones
para la segunda pantalla, reutilizando el ciclado de valores enum ya
existente en `NXEngine.prototype.press` (extraído a un método propio).

**Tech Stack:** HTML/CSS/JS vanilla, sin dependencias ni build. Verificación
manual vía Preview MCP (técnica ya usada esta sesión: copia temporal sin
`gate.js`, servidor `python -m http.server` local) + harness `?test=1`
existente para lo que sea lógica de motor.

**Spec:** [docs/superpowers/specs/2026-08-16-vacon-nx-simulador-ux-multimonitor-design.md](../specs/2026-08-16-vacon-nx-simulador-ux-multimonitor-design.md)

## Global Constraints

- No se toca el motor de simulación existente (`NXEngine`) salvo la
  extracción puntual de `ciclarEnum` descrita en Tarea 4 — ningún otro
  comportamiento de física/fallas cambia.
- No se resetean parámetros del equipo (P2.x, P3.x) al reiniciar un
  módulo — solo el progreso de tareas de ESE módulo.
- La pantalla nueva de Multimonitor y el nodo "Multimonitor" del panel
  original comparten la misma fuente de verdad (`engine.valores['MULTI.1/2/3']`)
  — ninguna lógica nueva de sincronización, ambas leen/escriben directo.
- El rediseño de "Diagnóstico de fallas" queda fuera de este plan.
- Verificar cada tarea con el archivo temporal `_test_no_gate.html` (copia
  de `index.html` con la línea `<script src="../../../assets/gate.js">`
  quitada vía `sed`), servido con `python -m http.server` vía
  `.claude/launch.json` (`vacon-static`, puerto 8743), y borrado al
  terminar cada ronda de verificación.

---

### Task 1: Reordenar módulos + glosario M/G/P + quitar texto de seguridad

**Files:**
- Modify: `capacitaciones/vacon/display/index.html` (dentro de `const NXModules = [...]`, líneas ~1188-1420 en el estado actual)

**Interfaces:**
- Consumes: nada nuevo — mismo array `NXModules`, mismos objetos de módulo (`id`, `nombre`, `teoria`, `tareas`).
- Produces: mismo array `NXModules`, mismo orden de propiedades por objeto — solo cambia el ORDEN de los objetos dentro del array y el CONTENIDO del array `teoria` del módulo `puestaEnMarcha`. Ninguna tarea, ID de tarea, ni módulo se agrega o quita acá.

- [ ] **Step 1: Reordenar los 7 objetos de módulo dentro de `NXModules`**

Orden actual (por `id`): `puestaEnMarcha, identificacion, rampas, panel, multimonitor, fallas, encoder`.

Orden nuevo: `puestaEnMarcha, identificacion, multimonitor, panel, rampas, fallas, encoder`.

Mover los objetos completos (sin modificar su contenido interno) para que
el array quede en ese orden. No cambia ningún `id`, `nombre`, `teoria` ni
`tareas` de ningún módulo en este paso — solo la posición del objeto
dentro del array.

- [ ] **Step 2: Agregar el glosario M/G/P al principio de la teoría de `puestaEnMarcha`**

Ubicar el array `teoria` del módulo `puestaEnMarcha` (primer módulo del
array tras el Step 1). Su primer elemento hoy es el string que empieza
con `'Antes de energizar: verificar el aislamiento...'`. Insertar ANTES
de ese elemento (como nuevo primer elemento del array) este string:

```js
'Antes de navegar: M (menú, ej. M1-M7) es el nivel más alto — el equipo tiene 7. Dentro de M2 (Parámetros) hay G (grupos, ej. G2.1-G2.8) que agrupan parámetros relacionados. Dentro de cada grupo hay P (parámetros individuales, ej. P2.6) — el valor concreto que configurás. Un parámetro se nombra completo como "P2.6" (parámetro 6 del grupo G2.1) o "P2.6.13" (parámetro 13 del subgrupo G2.6).',
```

- [ ] **Step 3: Quitar los 2 bullets de seguridad pre-energización**

En el mismo array `teoria` de `puestaEnMarcha`, eliminar por completo
estos dos elementos (buscarlos por su texto exacto):

```js
'Antes de energizar: verificar el aislamiento del motor (megado), el torque de las conexiones de potencia, y que la tensión de red medida coincida con lo que vas a cargar en P2.6. En la primera prueba de marcha, el motor debe girar SIN la carga mecánica acoplada.',
```

```js
'El bus de continua (V1.8 "Voltaje DC-link" en M1) no se descarga al instante al cortar la alimentación — los condensadores retienen tensión peligrosa durante varios minutos. Esperar el tiempo indicado en la placa del equipo antes de abrir el gabinete es la regla de seguridad más repetida del manual VACON.',
```

El array `teoria` de `puestaEnMarcha` queda así, en este orden exacto:
1. (nuevo) glosario M/G/P del Step 2
2. `'Antes de operar un variador hay que cargar los datos de placa del motor. VACON exige estos 5 valores...'`
3. `'La velocidad nominal de placa NO es la velocidad síncrona...'`
4. `'Los grupos G2.2-G2.8 de M2 pertenecen a las aplicaciones Estándar/Multipropósito...'`

- [ ] **Step 4: Verificar**

Levantar el servidor local (`.claude/launch.json` con la config
`vacon-static`, `python -m http.server 8743` en la raíz del repo — crear
el archivo si no existe, con este contenido:
```json
{ "version": "0.0.1", "configurations": [ { "name": "vacon-static", "runtimeExecutable": "python", "runtimeArgs": ["-m", "http.server", "8743"], "port": 8743 } ] }
```
), copiar `capacitaciones/vacon/display/index.html` a
`capacitaciones/vacon/display/_test_no_gate.html` quitando la línea del
`<script src="../../../assets/gate.js">`, y con el Preview MCP:

1. Navegar a `http://localhost:8743/capacitaciones/vacon/display/_test_no_gate.html?test=1` — confirmar que el harness sigue en `TODO OK: 71/71` (este cambio no toca el motor, así que el conteo no debería variar).
2. Navegar sin `?test=1`, confirmar en pantalla que el primer módulo mostrado (pestaña resaltada por defecto) sigue siendo "Puesta en marcha", que su teoría ahora empieza con el bullet del glosario M/G/P, y que los 2 bullets de seguridad ya no aparecen.
3. Confirmar el orden de las pestañas: Puesta en marcha, Identificación de motor, Multimonitor, Control desde el panel, Rampas y protecciones, Diagnóstico de fallas, Lazo abierto/cerrado.
4. Borrar `_test_no_gate.html`.

- [ ] **Step 5: Commit**

```bash
git add capacitaciones/vacon/display/index.html
git commit -m "Reordenar modulos y agregar glosario M/G/P, quitar texto de seguridad"
```

---

### Task 2: Convertir `enunciado` a `pasos` (lista) en las 36 tareas + reestructurar el render

**Files:**
- Modify: `capacitaciones/vacon/display/index.html` (los 36 objetos de tarea dentro de `NXModules`, y la función `window.renderTareas` cerca de la línea 1347 en el estado actual)

**Interfaces:**
- Consumes: nada nuevo.
- Produces: cada objeto de tarea pasa de tener `enunciado: string` a tener
  `pasos: string[]` (mismo lugar en el objeto, mismo `id`/`pista`/`accion`/
  `verificar` sin cambios). `renderTareas()` deja de leer `t.enunciado` y
  pasa a leer `t.pasos` (array), renderizándolo como lista `<ul>`. Las
  tareas 3 y 4 de este plan dependen de que este cambio ya esté hecho
  (leen/escriben la misma función `renderTareas`).

#### Regla de conversión (aplicar a las 36 tareas)

Cada tarea tiene hoy `enunciado: 'texto...'` — un string que mezcla contexto
("Placa del motor: Tensión nominal = 460 V.") con la acción concreta
("Configurá P2.6 (M2 → G2.1)."), a veces con varios pasos de navegación
encadenados con "→".

Convertir a `pasos: [...]`, un array donde cada elemento es UNA acción o
UNA pieza de contexto, en el mismo orden en que aparecían en el texto
original. Reglas:
- Una oración que da contexto/dato (ej. "Placa del motor: Tensión nominal
  = 460 V.") es su propio elemento.
- Una oración que da la acción a realizar (ej. "Configurá P2.6 (M2 →
  G2.1).") es su propio elemento — no hace falta partir la ruta de
  navegación "M2 → G2.1" en pasos separados, esa granularidad ya está en
  `pista`.
- Si el enunciado original tiene 2 instrucciones secuenciales completas
  (ej. "Provocá F1 (...) y reseteala. Después subí P2.5... y provocá F2
  (...)"), cada instrucción completa es su propio elemento.
- No agregar información nueva ni cambiar el significado — es una
  reformulación de forma, no de contenido. El texto de cada paso puede
  editarse levemente para que se lea bien como ítem de lista suelto (ej.
  sacar conectores como "Después" al principio si ya no hacen falta con
  viñetas), pero el contenido técnico (valores, IDs, condiciones) no
  cambia.
- `pista`, `accion`, `verificar`, `id` no se tocan.

**Ejemplos completos (4, cubriendo los casos simples y complejos):**

Caso simple, un solo paso — tarea `placa-frecuencia` (módulo `puestaEnMarcha`):
```js
// Antes:
enunciado: 'Placa del motor: Frecuencia nominal = 60 Hz. Configurá P2.7.',
// Después:
pasos: [
  'Placa del motor: Frecuencia nominal = 60 Hz.',
  'Configurá P2.7.'
],
```

Caso con ruta de navegación — tarea `placa-tension` (módulo `puestaEnMarcha`):
```js
// Antes:
enunciado: 'Placa del motor: Tensión nominal = 460 V. Configurá P2.6 (M2 → G2.1).',
// Después:
pasos: [
  'Placa del motor: Tensión nominal = 460 V.',
  'Configurá P2.6 en M2 → G2.1.'
],
```

Caso con condición y resultado esperado — tarea `encoder-falta-tarjeta` (módulo `encoder`):
```js
// Antes:
enunciado: 'Sin marcar el encoder como conectado, poné P2.6.1 en "Lazo cerrado" (M2 → G2.6) y arrancá con START. Debería dispararse F43 (falta la tarjeta de encoder).',
// Después:
pasos: [
  'Sin marcar el encoder como conectado, poné P2.6.1 en "Lazo cerrado" (M2 → G2.6).',
  'Arrancá con START.',
  'Debería dispararse F43 (falta la tarjeta de encoder).'
],
```

Caso con 2 instrucciones secuenciales completas — tarea `contraste-f1-f2` (módulo `fallas`):
```js
// Antes:
enunciado: 'Provocá F1 (sobrecorriente, bajando P2.5) y reseteala. Después subí P2.5 de nuevo (a su valor máximo, 16.80 A, para que no te interfiera) y provocá F2 (deceleración corta). Son dos protecciones distintas: una cuida el motor/cableado, la otra la electrónica de potencia.',
// Después:
pasos: [
  'Provocá F1 (sobrecorriente, bajando P2.5) y reseteala.',
  'Subí P2.5 de nuevo (a su valor máximo, 16.80 A, para que no te interfiera) y provocá F2 (deceleración corta).',
  'Son dos protecciones distintas: una cuida el motor/cableado, la otra la electrónica de potencia.'
],
```

- [ ] **Step 1: Convertir las 36 tareas**

Aplicar la regla de arriba a cada una de estas 36 tareas (agrupadas por
módulo, con el `id` exacto a buscar en el archivo — el texto actual de
`enunciado` de cada una está en el archivo, leerlo de ahí, no adivinarlo):

- `puestaEnMarcha`: `placa-tension`, `placa-frecuencia`, `placa-velocidad`, `placa-intensidad`, `placa-cosphi`
- `identificacion`: `identif-acoplado`, `identif-desacoplado`, `identif-sin-marcha-acoplado`
- `multimonitor`: `activar-multimonitor`, `asignar-referencia`, `asignar-velocidad`, `asignar-corriente`, `confirmar-vista-simultanea`
- `panel`: `seleccionar-panel`, `referencia-25hz`, `arrancar-y-llegar`, `cambiar-referencia-en-marcha`, `parar-y-confirmar-cero`
- `rampas`: `config-rampa`, `provocar-f1`, `provocar-f2`, `corregir-f2`, `resistencia-frenado`, `clamp-frecuencia-max`
- `fallas`: `diagnosticar-falla`, `diagnosticar-f16`, `diagnosticar-f29`, `diagnosticar-f9`, `diagnosticar-f10`, `patron-en-historial`, `secuencia-f1`, `secuencia-f51-tras-f1`, `contraste-f1-f2`
- `encoder`: `encoder-falta-tarjeta`, `encoder-conectado`, `encoder-bloqueo-en-marcha`

Para cada una: reemplazar `enunciado: '...'` por `pasos: [...]` en su
lugar exacto dentro del objeto literal (mismo orden de propiedades:
`id`, `pasos`, `pista`, luego `accion` si existe, luego `verificar`).

- [ ] **Step 2: Reescribir el bloque de render de la tarea en `renderTareas()`**

Ubicar dentro de `window.renderTareas` el bloque que arma `tareaHtml`
(hoy usa `t.enunciado` como párrafo y pone `Pista:` después). Reemplazar:

```js
  } else {
    var t = modulo.tareas[idxVisible];
    tareaHtml =
      '<div style="font-size:12px;color:var(--text-dim);">Tarea ' + (idxVisible+1) + ' de ' + modulo.tareas.length + (esRevision ? ' — revisando (ya completada)' : '') + '</div>' +
      '<p style="font-size:15px;">' + t.enunciado + '</p>' +
      '<p style="font-size:12px;color:var(--text-dim);">Pista: ' + t.pista + '</p>';
  }
```

por:

```js
  } else {
    var t = modulo.tareas[idxVisible];
    var pasosHtml = t.pasos.map(function(p){ return '<li style="margin:4px 0;">' + p + '</li>'; }).join('');
    tareaHtml =
      '<p style="font-size:13px;color:var(--text-dim);">Pista: ' + t.pista + '</p>' +
      '<ul style="margin:8px 0 0 18px; padding:0; font-size:15px;">' + pasosHtml + '</ul>';
  }
```

(El bloque `Tarea X de Y` se mueve a la sección de navegación en la Tarea
3 de este plan — no lo dupliques acá.)

- [ ] **Step 3: Verificar**

Con el mismo método de archivo temporal + Preview MCP:
1. `?test=1` sigue en `TODO OK: 71/71` (este cambio no toca el motor).
2. Click en la pestaña de cada uno de los 7 módulos, confirmar que la
   pista aparece ANTES de la lista de pasos, y que los pasos se ven como
   viñetas (`<li>`), no como un párrafo largo.
3. Elegir al menos una tarea de cada módulo (7 en total) y confirmar
   visualmente que el texto de cada viñeta coincide con lo que decía el
   `enunciado` original (sin pérdida de información).

- [ ] **Step 4: Commit**

```bash
git add capacitaciones/vacon/display/index.html
git commit -m "Convertir enunciado de tareas a pasos en viñetas, pista antes de los pasos"
```

---

### Task 3: Navegación de tareas — paginación libre + arreglar "Reiniciar módulo"

**Files:**
- Modify: `capacitaciones/vacon/display/index.html` (dentro de `window.renderTareas`, sección de `navHtml` y los handlers `btnAnterior`/`btnSiguiente`/`btnReiniciar`, líneas ~1386-1452 en el estado actual)

**Interfaces:**
- Consumes: `indicePorModulo`, `indiceVisiblePorModulo`, `tareaAccionEjecutada` (ya existen, mismo formato).
- Produces: mismo comportamiento externo de `indicePorModulo`/`guardarProgresoTareas()` (el portal sigue leyendo `done`/`total` igual). `indiceVisiblePorModulo[m.id]` deja de estar acotado por arriba a `indicePorModulo[m.id]` — puede llegar hasta `modulo.tareas.length - 1`.

**Bug real encontrado durante el plan (no estaba en el spec original):**
el botón "Reiniciar módulo" ya existe (agregado en un commit anterior de
esta misma sesión) pero su handler hace `engine = new NXEngine()` — un
reset COMPLETO del motor que afecta parámetros de TODOS los módulos, no
solo el que se está reiniciando. Esto contradice su propio texto de
confirmación ("no afecta a los demás módulos"). Se corrige en el Step 2
de esta tarea.

- [ ] **Step 1: Reemplazar el cálculo de `navHtml` — quitar "Volver a la tarea actual", agregar "Tarea siguiente"**

Ubicar este bloque dentro de `renderTareas`:

```js
  var navHtml = '';
  if (idxVisible > 0){
    navHtml += '<button id="btn-tarea-anterior" style="margin-right:8px; padding:4px 10px; font-size:11px; border-radius:6px; border:1px solid var(--line); cursor:pointer; background:var(--panel-raised); color:var(--text);">← Tarea anterior</button>';
  }
  if (esRevision){
    navHtml += '<button id="btn-tarea-siguiente" style="margin-right:8px; padding:4px 10px; font-size:11px; border-radius:6px; border:1px solid var(--line); cursor:pointer; background:var(--panel-raised); color:var(--text);">Volver a la tarea actual →</button>';
  }
  navHtml += '<button id="btn-reiniciar-modulo" style="padding:4px 10px; font-size:11px; border-radius:6px; border:1px solid var(--line); cursor:pointer; background:var(--panel-raised); color:var(--text);">↻ Reiniciar módulo</button>';
```

Reemplazar por:

```js
  var navHtml = '';
  if (idxVisible > 0){
    navHtml += '<button id="btn-tarea-anterior" style="margin-right:8px; padding:4px 10px; font-size:11px; border-radius:6px; border:1px solid var(--line); cursor:pointer; background:var(--panel-raised); color:var(--text);">← Tarea anterior</button>';
  }
  if (idxVisible < modulo.tareas.length - 1){
    navHtml += '<button id="btn-tarea-siguiente" style="margin-right:8px; padding:4px 10px; font-size:11px; border-radius:6px; border:1px solid var(--line); cursor:pointer; background:var(--panel-raised); color:var(--text);">Tarea siguiente →</button>';
  }
  navHtml += '<button id="btn-reiniciar-modulo" style="padding:4px 10px; font-size:11px; border-radius:6px; border:1px solid var(--line); cursor:pointer; background:var(--panel-raised); color:var(--text);">↻ Reiniciar módulo</button>';
```

Y agregar, justo antes de la construcción de `tareaHtml` (donde hoy está
el `<div>Tarea X de Y...</div>` que se movió a Task 2 Step 2), el label
de estado, ahora dentro del bloque de navegación en vez de junto al
enunciado:

```js
  var estadoLabel = 'Tarea ' + (Math.min(idxVisible, modulo.tareas.length - 1) + 1) + ' de ' + modulo.tareas.length;
  if (idxVisible < idxReal) estadoLabel += ' — ya completada';
  else if (idxVisible > idxReal) estadoLabel += ' — todavía no llegaste acá';
```

y agregar `estadoLabel` al final del bloque `navHtml` (después del botón
reiniciar), envuelto en su propio `<div>`:

```js
  navHtml += '<div style="font-size:12px;color:var(--text-dim);margin-top:6px;">' + estadoLabel + '</div>';
```

- [ ] **Step 2: Arreglar el handler de "Reiniciar módulo" — sacar el reset completo del motor**

Ubicar:

```js
  var btnReiniciar = document.getElementById('btn-reiniciar-modulo');
  if (btnReiniciar) btnReiniciar.onclick = function(){
    if (!window.confirm('¿Reiniciar "' + modulo.nombre + '"? Volvés a la Tarea 1 de este módulo y el simulador vuelve a su estado inicial (no afecta a los demás módulos).')) return;
    indicePorModulo[modulo.id] = 0;
    indiceVisiblePorModulo[modulo.id] = 0;
    Object.keys(tareaAccionEjecutada).forEach(function(k){ if (k.indexOf(modulo.id + ':') === 0) delete tareaAccionEjecutada[k]; });
    engine = new NXEngine();
    guardarProgresoTareas();
    _ultimaFirmaTareas = null;
    render();
    window.renderTareas();
  };
```

Reemplazar por (saca `engine = new NXEngine()`, ajusta el texto del
diálogo para que sea preciso sobre qué hace):

```js
  var btnReiniciar = document.getElementById('btn-reiniciar-modulo');
  if (btnReiniciar) btnReiniciar.onclick = function(){
    if (!window.confirm('¿Reiniciar "' + modulo.nombre + '"? Volvés a la Tarea 1 de este módulo. No se tocan los parámetros del equipo ni el progreso de los demás módulos.')) return;
    indicePorModulo[modulo.id] = 0;
    indiceVisiblePorModulo[modulo.id] = 0;
    Object.keys(tareaAccionEjecutada).forEach(function(k){ if (k.indexOf(modulo.id + ':') === 0) delete tareaAccionEjecutada[k]; });
    guardarProgresoTareas();
    _ultimaFirmaTareas = null;
    window.renderTareas();
  };
```

- [ ] **Step 3: Actualizar el handler de "Tarea siguiente"**

Ubicar:

```js
  var btnSiguiente = document.getElementById('btn-tarea-siguiente');
  if (btnSiguiente) btnSiguiente.onclick = function(){
    indiceVisiblePorModulo[modulo.id] = indicePorModulo[modulo.id];
    window.renderTareas();
  };
```

Reemplazar por:

```js
  var btnSiguiente = document.getElementById('btn-tarea-siguiente');
  if (btnSiguiente) btnSiguiente.onclick = function(){
    indiceVisiblePorModulo[modulo.id] = Math.min(modulo.tareas.length - 1, indiceVisiblePorModulo[modulo.id] + 1);
    window.renderTareas();
  };
```

(El handler de `btnAnterior` no cambia — ya hace
`Math.max(0, indiceVisiblePorModulo[modulo.id] - 1)`, que es exactamente
paginación libre hacia atrás.)

- [ ] **Step 4: Verificar — caso crítico: mirar una tarea futura no la completa sola**

Con el archivo temporal + Preview MCP, usando `preview_eval`:

```js
(function(){
  var log = [];
  function assert(c, m){ log.push((c?'OK  ':'FAIL')+' '+m); }
  moduloActual = 'puestaEnMarcha';
  indicePorModulo['puestaEnMarcha'] = 0; indiceVisiblePorModulo['puestaEnMarcha'] = 0;
  window.renderTareas();
  document.getElementById('btn-tarea-siguiente').click(); // mirar la tarea 2 sin haberla completado
  assert(indiceVisiblePorModulo['puestaEnMarcha'] === 1, 'avanzo la vista a la tarea 2');
  assert(indicePorModulo['puestaEnMarcha'] === 0, 'CRITICO: el progreso real sigue en 0, no se completo sola');
  window.renderTareas(); window.renderTareas(); // simular varios frames del loop
  assert(indicePorModulo['puestaEnMarcha'] === 0, 'CRITICO: mirar varias veces mas tampoco la completa');
  return log.join('\n');
})();
```

Todos los `assert` deben dar `OK`. Además, verificar con clicks reales:
completar 2 tareas de un módulo, click "Reiniciar módulo", confirmar el
diálogo, y comprobar que `indicePorModulo[m.id]` vuelve a 0 pero un
parámetro que se haya tocado en OTRO módulo (ej. `P2.3` en Rampas si ya
se completó esa tarea) sigue con su valor, no vuelve al default.

- [ ] **Step 5: Commit**

```bash
git add capacitaciones/vacon/display/index.html
git commit -m "Navegacion de tareas: paginacion libre, corregir reset de modulo que afectaba a todo el motor"
```

---

### Task 4: Segunda pantalla Multimonitor

**Files:**
- Modify: `capacitaciones/vacon/display/index.html` (HTML del `#panel-root`, cerca de la línea 673; el bloque de `press()` con el ciclado enum, cerca de la línea 386-397; el loop de animación, cerca de la línea 1082-1090 en el estado actual, número de línea puede haber corrido tras las Tareas 1-3)

**Interfaces:**
- Consumes: `engine.valores['MULTI.1']`, `['MULTI.2']`, `['MULTI.3']` (ya existen), `engine.resolverParam(id)` (ya existe), `nombreDeUbicacion(id)` (ya existe), `indicePorModulo['multimonitor']` (ya existe).
- Produces: `NXEngine.prototype.ciclarEnum(id, delta)` — nuevo método, reutilizado tanto por `press()` como por el panel nuevo. `renderMultimonitorPanel()` — nueva función global, llamada desde el loop de animación igual que `render()`.

- [ ] **Step 1: Extraer `ciclarEnum` de la lógica de `press()` — sin cambiar comportamiento**

Ubicar en `NXEngine.prototype.press` el bloque:

```js
    } else if (param.tipo === 'enum'){
      var vals = param.opciones.map(function(o){ return o.valor; });
      var i = vals.indexOf(this.valores[param.id]);
      var nuevoI = (i + (tecla === 'up' ? 1 : -1) + vals.length) % vals.length;
      this.valores[param.id] = vals[nuevoI];
    }
```

Reemplazar por:

```js
    } else if (param.tipo === 'enum'){
      this.ciclarEnum(param.id, tecla === 'up' ? 1 : -1);
    }
```

Y agregar, en el mismo bloque `<script>` donde vive `NXEngine.prototype.press` (justo antes o después de esa función), el nuevo método:

```js
NXEngine.prototype.ciclarEnum = function(id, delta){
  var param = this.resolverParam(id);
  var vals = param.opciones.map(function(o){ return o.valor; });
  var i = vals.indexOf(this.valores[id]);
  var nuevoI = (i + delta + vals.length) % vals.length;
  this.valores[id] = vals[nuevoI];
};
```

- [ ] **Step 2: Test de motor para `ciclarEnum`**

Agregar, en el bloque de tests existente más cercano (el que ya prueba
`press('up')` sobre un enum, alrededor de la línea 245 donde dice `'up
sobre un parámetro enum avanza a la siguiente opción'`), un assert
nuevo justo después:

```js
  var eCiclo = new NXEngine();
  eCiclo.ciclarEnum('MULTI.1', 1);
  assert(eCiclo.valores['MULTI.1'] !== 'V1.9', 'ciclarEnum cambia el valor directamente, sin pasar por ruta/modo');
```

Correr `?test=1`, confirmar `TODO OK: 72/72` (71 actuales + este nuevo).

- [ ] **Step 3: Agregar el HTML de la segunda pantalla**

Ubicar en el HTML (no en un `<script>`) este bloque:

```html
<div id="panel-root" style="display:flex; gap:32px; align-items:flex-start; padding:24px; flex-wrap:wrap;">
  <div style="width:280px; background:#1c5fa8; border-radius:12px; padding:16px; box-shadow:0 8px 24px rgba(0,0,0,.4);">
    <div style="background:#2a2a1a; border-radius:4px; padding:10px; margin-bottom:14px; min-height:100px; box-sizing:border-box;">
      <div id="lcd-linea-k" style="font-family:var(--mono); color:#c8d84a; font-size:11px; opacity:.85;"></div>
      <div id="lcd-linea-l" style="font-family:var(--mono); color:#c8d84a; font-size:14px; font-weight:600; margin:2px 0;"></div>
      <div id="lcd-linea-m" style="font-family:var(--mono); color:#c8d84a; font-size:18px;"></div>
    </div>
```

... (resto del panel original, botones, hasta el `</div>` que cierra el
div de `width:280px`, seguido por `<div id="panel-tasks" ...></div>` y el
`</div>` que cierra `#panel-root`).

Envolver el div de `width:280px` existente en un nuevo contenedor de
columna, y agregar el panel nuevo como hermano dentro de esa columna:

```html
<div id="panel-root" style="display:flex; gap:32px; align-items:flex-start; padding:24px; flex-wrap:wrap;">
  <div style="display:flex; flex-direction:column; gap:16px;">
    <div style="width:280px; background:#1c5fa8; border-radius:12px; padding:16px; box-shadow:0 8px 24px rgba(0,0,0,.4);">
      <!-- contenido existente del panel original, sin cambios -->
    </div>
    <div id="multimonitor-panel-root" style="width:280px; background:#1c5fa8; border-radius:12px; padding:16px; box-shadow:0 8px 24px rgba(0,0,0,.4); display:none; box-sizing:border-box;">
      <div style="font-family:var(--sans); font-size:11px; color:#fff; text-transform:uppercase; letter-spacing:.04em; margin-bottom:8px;">Multimonitor — vista secundaria</div>
      <div style="background:#2a2a1a; border-radius:4px; padding:10px; margin-bottom:14px; min-height:100px; box-sizing:border-box;">
        <div id="mm2-linea-1" style="font-family:var(--mono); color:#c8d84a; font-size:13px; margin:2px 0;"></div>
        <div id="mm2-linea-2" style="font-family:var(--mono); color:#c8d84a; font-size:13px; margin:2px 0;"></div>
        <div id="mm2-linea-3" style="font-family:var(--mono); color:#c8d84a; font-size:13px; margin:2px 0;"></div>
      </div>
      <div style="display:flex; justify-content:center; gap:10px;">
        <button data-mm2-key="up" style="padding:6px 14px;">▲</button>
        <button data-mm2-key="enter" style="padding:6px 14px;">enter</button>
        <button data-mm2-key="down" style="padding:6px 14px;">▼</button>
      </div>
    </div>
  </div>
  <div id="panel-tasks" style="flex:1; min-width:280px;"></div>
</div>
```

(El div original del panel principal no cambia de contenido, solo queda
un nivel más adentro dentro del nuevo `<div style="display:flex;
flex-direction:column; gap:16px;">`.)

- [ ] **Step 4: Agregar `renderMultimonitorPanel()` y el wiring de sus botones**

Agregar, en el mismo `<script>` donde vive `renderTareas` (o inmediatamente
después de su definición), esta función y variable nuevas:

```js
var multimonitorPanelSlot = 0; // 0, 1 o 2 -- cual posicion esta seleccionada para editar en el panel secundario

function multimonitorDesbloqueado(){
  var modulo = NXModules.filter(function(m){ return m.id === 'multimonitor'; })[0];
  return modulo && indicePorModulo['multimonitor'] >= modulo.tareas.length;
}

function renderMultimonitorPanel(){
  var cont = document.getElementById('multimonitor-panel-root');
  if (!cont) return;
  var desbloqueado = multimonitorDesbloqueado();
  cont.style.display = desbloqueado ? 'block' : 'none';
  if (!desbloqueado) return;

  for (var i = 0; i < 3; i++){
    var slotId = 'MULTI.' + (i + 1);
    var loc = nombreDeUbicacion(engine.valores[slotId]);
    var linea = document.getElementById('mm2-linea-' + (i + 1));
    var marca = (i === multimonitorPanelSlot) ? '> ' : '  ';
    linea.textContent = marca + loc.l + ': ' + loc.m;
  }
}

document.querySelectorAll('#multimonitor-panel-root button[data-mm2-key]').forEach(function(btn){
  btn.addEventListener('click', function(){
    var key = btn.getAttribute('data-mm2-key');
    if (key === 'enter'){
      multimonitorPanelSlot = (multimonitorPanelSlot + 1) % 3;
    } else if (key === 'up' || key === 'down'){
      var slotId = 'MULTI.' + (multimonitorPanelSlot + 1);
      engine.ciclarEnum(slotId, key === 'up' ? 1 : -1);
    }
    renderMultimonitorPanel();
  });
});
```

- [ ] **Step 5: Llamar a `renderMultimonitorPanel()` desde el loop de animación**

Ubicar el loop de animación:

```js
var _ultimoTick = performance.now();
function loop(ahora){
  var dt = (ahora - _ultimoTick) / 1000;
  _ultimoTick = ahora;
  engine.tick(Math.min(dt, 0.25));
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
render();
```

Reemplazar por:

```js
var _ultimoTick = performance.now();
function loop(ahora){
  var dt = (ahora - _ultimoTick) / 1000;
  _ultimoTick = ahora;
  engine.tick(Math.min(dt, 0.25));
  render();
  renderMultimonitorPanel();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
render();
renderMultimonitorPanel();
```

- [ ] **Step 6: Verificar**

Con el archivo temporal + Preview MCP:

1. `?test=1` sigue en `TODO OK: 72/72`.
2. Recién cargada la página (sin completar Multimonitor), confirmar con
   `preview_eval` que `document.getElementById('multimonitor-panel-root').style.display === 'none'`.
3. Vía `preview_eval`, completar las 5 tareas del módulo `multimonitor`
   (mismo patrón usado en sesiones anteriores: `engine.press('select')`,
   navegar a `MULTI`, asignar las 3 posiciones, volver a M1), llamar
   `window.renderTareas()` y `renderMultimonitorPanel()`, y confirmar que
   ahora `display !== 'none'` y que las 3 líneas (`mm2-linea-1/2/3`)
   muestran las variables asignadas.
4. Click en el botón `[data-mm2-key="enter"]` tres veces con Preview MCP,
   confirmar que `multimonitorPanelSlot` cicla 0→1→2→0 (vía
   `preview_eval`).
5. Con `multimonitorPanelSlot=0`, click en `[data-mm2-key="up"]`,
   confirmar que `engine.valores['MULTI.1']` cambió, y que el valor de
   `MULTI.2`/`MULTI.3` no se tocó.
6. Navegar en el panel ORIGINAL hasta el nodo "Multimonitor" (M1 → ... →
   MULTI) y confirmar que muestra el mismo valor que se acaba de cambiar
   desde el panel nuevo (misma fuente de verdad, sin desincronización).
7. Cambiar a otro módulo (ej. "Rampas y protecciones"), confirmar que la
   pantalla secundaria sigue visible con los mismos valores.
8. Redimensionar a mobile (375×812) con `preview_resize`, confirmar que
   ambos paneles se ven bien apilados y los botones son tocables.

- [ ] **Step 7: Commit**

```bash
git add capacitaciones/vacon/display/index.html
git commit -m "Agregar segunda pantalla LCD dedicada al Multimonitor"
```

---

## Self-Review (ya aplicado)

- **Cobertura del spec:** los 6 puntos del spec (reorden, glosario,
  quitar texto, reestructurar panel, navegación+reiniciar, segunda
  pantalla) tienen cada uno su tarea. El punto 7 (Diagnóstico de fallas)
  queda explícitamente fuera, como acordó el spec.
- **Placeholders:** ninguno — cada paso tiene el código exacto (antes/después)
  o la lista completa de 36 IDs de tarea a convertir con la regla y 4
  ejemplos trabajados.
- **Consistencia de tipos:** `ciclarEnum(id, delta)` se define una vez en
  Task 4 Step 1 y se usa igual en Task 4 Step 4 (panel nuevo) y en el
  `press()` ya existente. `pasos: string[]` se produce en Task 2 y se
  consume en Task 2 Step 2 (mismo render) — Task 3 no vuelve a tocar
  `pasos`, solo la navegación alrededor.
- **Hallazgo real durante el plan:** el bug del reset completo del motor
  en "Reiniciar módulo" (Task 3) no estaba en el spec original — se
  agregó como parte de la Tarea 3 porque se descubrió al leer el código
  actual antes de escribir el diff.
