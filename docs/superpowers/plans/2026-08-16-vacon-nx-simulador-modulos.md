# Simulador VACON NX — Módulos de teoría + práctica — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extender `capacitaciones/vacon/display/index.html` con 2 capacidades nuevas de simulación (identificación de motor, lazo abierto/cerrado con encoder) y reestructurar las tareas guiadas planas en 6 módulos navegables libremente (teoría + práctica), sin romper nada de lo ya construido y revisado.

**Architecture:** Dos tareas extienden `NXEngine` con el mismo patrón de reasignación de constructor/prototipo usado en las Tareas 3-6 originales (aditivo, sin tocar código ya revisado). Seis tareas reemplazan `NXTasks`/`renderTareas` por `NXModules` (array de módulos con teoría + tareas propias) y un selector de pestañas sin bloqueo, manteniendo la clave y el contrato externo de `localStorage` (`vfd_progress_vacon-nx-simulador`, `{done,total}`) que ya lee el portal.

**Tech Stack:** HTML/CSS/JS vanilla, sin build, mismo archivo único. Verificación con el arnés `?test=1` existente (headless Chrome, bloqueando el dominio de Clerk para evitar la redirección de `gate.js` — ver Global Constraints).

**Spec:** [docs/superpowers/specs/2026-08-16-vacon-nx-simulador-modulos-design.md](../specs/2026-08-16-vacon-nx-simulador-modulos-design.md) (y el spec original [2026-08-15-vacon-nx-simulador-design.md](../specs/2026-08-15-vacon-nx-simulador-design.md) para contexto del motor existente).

## Global Constraints

- Archivo único: `capacitaciones/vacon/display/index.html` (ya existe, 887 líneas). Todas las tareas lo modifican; ninguna crea archivos nuevos.
- **Verificación headless con Clerk bloqueado.** El chequeo simple `--dump-dom "...?test=1"` es engañoso: `gate.js` redirige a una ruta inexistente antes de que el arnés corra. Todo comando de verificación en este plan DEBE incluir `--host-resolver-rules="MAP accepted-impala-14.clerk.accounts.dev 0.0.0.0"`.
- Las Tareas 1-2 (motor) se insertan ANTES de la línea `var engine = new NXEngine();` (la instanciación real del motor, dentro del bloque de wiring del panel) — nunca después, o los campos nuevos no existen en el `engine` real. Buscar el marcador único `var engine = new NXEngine();` para ubicar el punto de inserción exacto.
- Las Tareas 3-8 (módulos) reemplazan/extienden el bloque `const NXTasks = [...]` hasta `cargarProgresoTareas();` al final del archivo (búsqueda: `const NXTasks = [`).
- `NXEngine` sigue sin referencias a `document`/`window` fuera de los bloques de prueba — ninguna tarea de este plan debe romper esa propiedad.
- Ningún parámetro nuevo (`P2.6.16`, `P2.6.12`) se agrega a `NXData.paramsG21` — viven en una colección nueva `NXData.paramsG26`, para no romper la aserción `paramsG21.length === 20` (fidelidad de que esos 20 son los reales de la Aplicación Básica).
- El progreso en `localStorage` sigue exponiendo `{done, total}` bajo la clave `vfd_progress_vacon-nx-simulador` — el portal no cambia cómo lo lee.

---

## Task 1: NXEngine — grupo G2.6 e identificación de motor

**Files:**
- Modify: `capacitaciones/vacon/display/index.html` (insertar antes de `var engine = new NXEngine();`)

**Interfaces:**
- Consumes: `NXEngine` tal como queda tras la Tarea 6 original (navegación, edición, simulación, fallas — ya mergeado en `master`).
- Produces: `NXData.paramsG26` (array, con `P2.6.16` agregado por esta tarea), navegación real a `M2 → G2.6 → P2.6.16` vía `_hijosDe`/`_todosLosParams` extendidos, `engine.motorAcoplado` (boolean), `engine.identificacionCompleta` (boolean), `engine.correrIdentificacion()`, y una extensión de `press('start')` que dispara la identificación cuando `P2.6.16 !== 0`. Usado por la Tarea 2 (que agrega `P2.6.12` a la misma `paramsG26`) y la Tarea 4 (módulo "Identificación de motor").

- [ ] **Step 1: Escribir el grupo G2.6 y la navegación extendida**

Buscar la línea `var engine = new NXEngine();` en el archivo. Insertar el siguiente bloque completo INMEDIATAMENTE ANTES de esa línea (antes de cualquier código de wiring del panel):

```html
<script>
// Grupo G2.6 "Control de motor" — pertenece a las aplicaciones Estándar/Multipropósito
// de VACON NX, no a la Aplicación Básica (G2.1). Se simula aquí para los módulos de
// identificación y lazo cerrado, documentando explícitamente su origen real.
NXData.paramsG26 = [
  { id:'P2.6.16', nombre:'Identificación', tipo:'enum', porDefecto:0, opciones:[
    {valor:0, etiqueta:'Sin acción'},
    {valor:1, etiqueta:'Identif. sin marcha'},
    {valor:2, etiqueta:'Identif. con marcha'}
  ]}
  // Nota: el manual real (ID631) también lista "Identificación de marcha de encoder" (valor 3,
  // solo motor PMS con encoder absoluto) y "Fallo de identificación" (valor 5, estado interno,
  // no seleccionable por el usuario). Se excluyen de este simulador: no hay física de motor PMS
  // modelada, y el valor 5 no es una opción real que el alumno elija.
];

var _hijosDeG26 = NXEngine.prototype._hijosDe;
NXEngine.prototype._hijosDe = function(ruta){
  if (ruta[0] === 'M2' && ruta.length === 1) return ['G2.1', 'G2.6'];
  if (ruta[0] === 'M2' && ruta[1] === 'G2.6' && ruta.length === 2) return NXData.paramsG26.map(function(p){ return p.id; });
  return _hijosDeG26.call(this, ruta);
};

var _todosLosParamsG26 = NXEngine.prototype._todosLosParams;
NXEngine.prototype._todosLosParams = function(){
  return _todosLosParamsG26.call(this).concat(NXData.paramsG26);
};

var _todosLosParamsEstaticoG26 = NXEngine.prototype._todosLosParamsEstatico;
NXEngine.prototype._todosLosParamsEstatico = function(){
  return _todosLosParamsEstaticoG26.call(this).concat(NXData.paramsG26);
};

var _NXEngineCtorIdent = NXEngine;
NXEngine = function(){
  _NXEngineCtorIdent.call(this);
  this.motorAcoplado = false;
  this.identificacionCompleta = false;
};
NXEngine.prototype = _NXEngineCtorIdent.prototype;

NXEngine.prototype.correrIdentificacion = function(){
  var modo = this.valores['P2.6.16'];
  if (modo === 2 && this.motorAcoplado){
    this._dispararFalla(57);
    return;
  }
  if (modo === 2 && !this.motorAcoplado){
    this.identificacionCompleta = true;
    return;
  }
  if (modo === 1){
    this.identificacionCompleta = true;
    return;
  }
  // modo === 0 (Sin acción): no hace nada.
};

var _pressIdent = NXEngine.prototype.press;
NXEngine.prototype.press = function(tecla){
  if (tecla === 'start' && this.estadoDrive === 'stop' && this.valores['P2.6.16'] !== 0){
    this.correrIdentificacion();
    this.valores['P2.6.16'] = 0; // vuelve a "Sin acción" tras ejecutar, como el equipo real
    return;
  }
  return _pressIdent.call(this, tecla);
};
</script>
```

- [ ] **Step 2: Agregar las pruebas**

Inmediatamente después del bloque anterior (todavía antes de `var engine = new NXEngine();`):

```html
<script>
(function(){
  var e = new NXEngine();
  assert(e.valores['P2.6.16'] === 0, 'Identificación (P2.6.16) inicia en "Sin acción" por defecto');
  assert(e.motorAcoplado === false, 'motorAcoplado inicia en false');
  assert(e.identificacionCompleta === false, 'identificacionCompleta inicia en false');

  var hijosM2 = e._hijosDe(['M2']);
  assert(hijosM2.indexOf('G2.6') !== -1, 'M2 ahora incluye el grupo G2.6 junto a G2.1');
  var hijosG26 = e._hijosDe(['M2', 'G2.6']);
  assert(hijosG26.indexOf('P2.6.16') !== -1, 'G2.6 incluye el parámetro P2.6.16 (Identificación)');

  var e2 = new NXEngine();
  e2.motorAcoplado = true;
  e2.valores['P2.6.16'] = 2; // identificación con marcha
  e2.press('start');
  assert(e2.fallaActiva === 57, 'START con identificación "con marcha" y motor acoplado dispara F57');
  assert(e2.valores['P2.6.16'] === 0, 'P2.6.16 vuelve a "Sin acción" tras ejecutar, igual que el equipo real');

  var e3 = new NXEngine();
  e3.motorAcoplado = false;
  e3.valores['P2.6.16'] = 2;
  e3.press('start');
  assert(e3.identificacionCompleta === true && e3.fallaActiva === null, 'Identificación "con marcha" y motor desacoplado completa sin falla');

  var e4 = new NXEngine();
  e4.motorAcoplado = true; // no debería importar en modo 1
  e4.valores['P2.6.16'] = 1;
  e4.press('start');
  assert(e4.identificacionCompleta === true, 'Identificación "sin marcha" completa independientemente de motorAcoplado');

  var e5 = new NXEngine();
  e5.valores['P2.6.16'] = 0;
  e5.press('start'); // sin P3.1=Panel, y sin pedir identificación: debe comportarse como el START original
  assert(e5.mensaje === 'Control de panel NO ACTIVO', 'START normal (sin identificación pedida) sigue delegando al comportamiento original');

  window.runTestsIfRequested();
})();
</script>
```

- [ ] **Step 3: Verificar**

```
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-sandbox --host-resolver-rules="MAP accepted-impala-14.clerk.accounts.dev 0.0.0.0" --virtual-time-budget=4000 --dump-dom "file:///<ruta-al-worktree>/capacitaciones/vacon/display/index.html?test=1"
```

Confirmar `TODO OK: 51/51` (41 existentes + 10 nuevas de este Step 2), cero `FAIL`, cero errores de JS en stderr.

- [ ] **Step 4: Commit**

```bash
git add capacitaciones/vacon/display/index.html
git commit -m "Agregar grupo G2.6 e identificacion de motor a NXEngine"
```

---

## Task 2: NXEngine — modo de control y lazo cerrado/encoder

**Files:**
- Modify: `capacitaciones/vacon/display/index.html` (insertar antes de `var engine = new NXEngine();`, después del bloque de la Tarea 1)

**Interfaces:**
- Consumes: `NXData.paramsG26` y la navegación `M2→G2.6` de la Tarea 1.
- Produces: `P2.6.12` agregado a `paramsG26`, `engine.encoderConectado` (boolean), extensión de `press('start')` que dispara F43 si `P2.6.12===1` (lazo cerrado) sin encoder, y bloqueo de edición de `P2.6.12` mientras `estadoDrive==='run'` (con la bandera estable `engine._cambioModoControlBloqueado`, NO el `mensaje` transitorio — `mensaje` se limpia en cada `render()` antes de que el panel de tareas pueda leerlo, ver nota abajo). Usado por la Tarea 8 (módulo "Lazo abierto/cerrado").

**Nota de diseño (por qué no usar `engine.mensaje` para esto):** `render()` (ya en el archivo, Tarea 7 original) hace `engine.mensaje = null;` justo antes de llamar a `window.renderTareas()` en cada frame. Cualquier `verificar()` de una tarea guiada que lea `engine.mensaje` siempre lo vería `null`, sin importar qué pasó. Por eso este bloqueo usa una bandera propia que no se limpia sola.

- [ ] **Step 1: Agregar el parámetro y la lógica de lazo cerrado**

```html
<script>
NXData.paramsG26.push(
  { id:'P2.6.12', nombre:'Modo de control', tipo:'enum', porDefecto:0, opciones:[
    {valor:0, etiqueta:'Lazo abierto'},
    {valor:1, etiqueta:'Lazo cerrado'}
  ]}
);

var _NXEngineCtorEncoder = NXEngine;
NXEngine = function(){
  _NXEngineCtorEncoder.call(this);
  this.encoderConectado = false;
  this._cambioModoControlBloqueado = false;
};
NXEngine.prototype = _NXEngineCtorEncoder.prototype;

var _pressEncoder = NXEngine.prototype.press;
NXEngine.prototype.press = function(tecla){
  if (tecla === 'start' && this.estadoDrive === 'stop' && this.valores['P3.1'] === 2 &&
      this.valores['P2.6.12'] === 1 && !this.encoderConectado){
    // Sub-causa real de F43: "Falta la tarjeta de encoder" (una de las 5 sub-causas
    // documentadas; las otras 4 requieren modelar cableado parcial, fuera de alcance).
    this._dispararFalla(43);
    return;
  }
  if (tecla === 'right' && this.modo === 'navegar'){
    var idActual = this.ubicacionActual();
    if (idActual === 'P2.6.12' && this.estadoDrive === 'run'){
      this.mensaje = 'No se puede cambiar en MARCHA';
      this._cambioModoControlBloqueado = true;
      return;
    }
  }
  return _pressEncoder.call(this, tecla);
};
</script>
```

- [ ] **Step 2: Agregar las pruebas**

```html
<script>
(function(){
  var e = new NXEngine();
  assert(e.valores['P2.6.12'] === 0, 'Modo de control (P2.6.12) inicia en Lazo abierto por defecto');
  assert(e.encoderConectado === false, 'encoderConectado inicia en false');

  var hijosG26 = e._hijosDe(['M2', 'G2.6']);
  assert(hijosG26.indexOf('P2.6.12') !== -1, 'G2.6 incluye P2.6.12 junto a P2.6.16');

  var e2 = new NXEngine();
  e2.valores['P3.1'] = 2;
  e2.valores['P2.6.12'] = 1; // lazo cerrado
  e2.press('start');
  assert(e2.fallaActiva === 43, 'Lazo cerrado sin encoder conectado dispara F43 al intentar arrancar');

  var e3 = new NXEngine();
  e3.valores['P3.1'] = 2;
  e3.valores['P2.6.12'] = 1;
  e3.encoderConectado = true;
  e3.press('start');
  assert(e3.estadoDrive === 'run', 'Lazo cerrado con encoder conectado arranca normalmente');

  var e4 = new NXEngine();
  e4.valores['P3.1'] = 2;
  e4.valores['P3.2'] = 25;
  e4.press('start'); // lazo abierto (default) arranca normal
  assert(e4.estadoDrive === 'run', 'precondición: drive en marcha con lazo abierto');
  e4.ruta = ['M2', 'G2.6', 'P2.6.12'];
  e4.press('right'); // intenta editar el modo de control mientras está en marcha
  assert(e4.modo === 'navegar', 'No entra a modo edición de P2.6.12 mientras el drive está en marcha');
  assert(e4._cambioModoControlBloqueado === true, 'La bandera estable registra el bloqueo (no depende de mensaje, que se limpia en cada render)');

  var e5 = new NXEngine();
  e5.ruta = ['M2', 'G2.6', 'P2.6.12'];
  e5.press('right'); // drive detenido: sí debe poder editar
  assert(e5.modo === 'editar', 'Con el drive detenido, sí se puede entrar a editar P2.6.12');

  window.runTestsIfRequested();
})();
</script>
```

- [ ] **Step 3: Verificar**

Mismo comando del Task 1. Confirmar `TODO OK: 60/60` (51 + 9 nuevas), cero `FAIL`.

- [ ] **Step 4: Commit**

```bash
git add capacitaciones/vacon/display/index.html
git commit -m "Agregar modo de control y falla F43 por falta de encoder a NXEngine"
```

---

## Task 3: NXModules — infraestructura + migración + Módulo "Puesta en marcha"

**Files:**
- Modify: `capacitaciones/vacon/display/index.html` (reemplaza el bloque `const NXTasks = [...]` hasta `cargarProgresoTareas();` al final del archivo)

**Interfaces:**
- Consumes: `engine` (instancia global ya creada por el wiring del panel, Tarea 7 original + Tareas 1-2 de este plan), `NXData`, el contenedor `#panel-tasks` (ya existe en el DOM desde la Tarea 7 original).
- Produces: `NXModules` (array de módulos `{id, nombre, teoria, tareas}`), `window.renderTareas` (redefinida — mismo nombre que ya llama `render()` en cada frame, ahora renderiza por módulo), estado global `moduloActual` (string, id del módulo seleccionado), progreso persistido en `localStorage['vfd_progress_vacon-nx-simulador']` con forma `{porModulo:{...}, done, total}`. Usado por las Tareas 4-8, que solo AGREGAN tareas a los módulos ya definidos aquí (`NXModules.find(...).tareas.push(...)`), sin tocar esta infraestructura.

- [ ] **Step 1: Localizar y reemplazar el bloque completo de tareas**

Buscar `const NXTasks = [` en el archivo — el bloque completo a reemplazar llega hasta la línea con `cargarProgresoTareas();` (la última línea antes del cierre del `<script>`, ya identificada: línea 871 en el archivo actual, pero buscar por contenido no por número ya que pudo moverse tras las Tareas 1-2). Reemplazar TODO ese bloque (desde `const NXTasks = [` hasta `cargarProgresoTareas();` inclusive) por:

```html
<script>
const NXModules = [
  {
    id: 'puestaEnMarcha',
    nombre: 'Puesta en marcha',
    teoria: [
      'Antes de operar un variador hay que cargar los datos de placa del motor. VACON exige estos 5 valores cargados antes de correr cualquier identificación: tensión nominal (P2.6), frecuencia nominal (P2.7), velocidad nominal (P2.8), intensidad nominal (P2.9) y cos phi (P2.10).',
      'La velocidad nominal de placa NO es la velocidad síncrona. Un motor de 4 polos a 50 Hz tiene una síncrona de 1500 rpm, pero la placa real muestra menos (ej. 1440 rpm) por el deslizamiento — VACON usa esa diferencia para calcular el modelo del motor.'
    ],
    tareas: [
      { id:'placa-tension', enunciado:'Placa del motor: Tensión nominal = 400 V. Configurá P2.6 (M2 → G2.1).', pista:'M2 → derecha → G2.1 → buscá P2.6 → derecha para editar → arriba/abajo → Enter.', verificar:function(e){ return Math.abs(e.valores['P2.6'] - 400) < 0.5; } },
      { id:'placa-frecuencia', enunciado:'Placa del motor: Frecuencia nominal = 50 Hz. Configurá P2.7.', pista:'Mismo grupo G2.1, el parámetro siguiente a P2.6.', verificar:function(e){ return Math.abs(e.valores['P2.7'] - 50) < 0.05; } },
      { id:'placa-velocidad', enunciado:'Placa del motor: Velocidad nominal = 1440 rpm (no 1500 — esa es la síncrona). Configurá P2.8.', pista:'La velocidad de placa siempre es menor a la síncrona por el deslizamiento.', verificar:function(e){ return e.valores['P2.8'] === 1440; } },
      { id:'placa-intensidad', enunciado:'Placa del motor: Intensidad nominal = 15.0 A. Configurá P2.9.', pista:'Mismo grupo, siguiente parámetro.', verificar:function(e){ return Math.abs(e.valores['P2.9'] - 15.0) < 0.05; } },
      { id:'placa-cosphi', enunciado:'Placa del motor: Cos phi = 0.83. Configurá P2.10.', pista:'Último dato de la placa para este ejercicio.', verificar:function(e){ return Math.abs(e.valores['P2.10'] - 0.83) < 0.01; } }
    ]
  },
  {
    id: 'identificacion',
    nombre: 'Identificación de motor',
    teoria: [],
    tareas: []
  },
  {
    id: 'rampas',
    nombre: 'Rampas y protecciones',
    teoria: [],
    tareas: []
  },
  {
    id: 'panel',
    nombre: 'Control desde el panel',
    teoria: [
      'El drive recibe sus órdenes desde Terminal I/O, Panel o Fieldbus (P3.1) — solo un lugar a la vez; si el panel no es el activo, START/STOP no tienen efecto y el LCD avisa "Control de panel NO ACTIVO".',
      'La referencia (P3.2/V1.2) es lo que se pide; la frecuencia de salida real (V1.1) es lo que el motor tiene en cada instante — diagnosticar "no llega a velocidad" empieza comparando ambos.'
    ],
    tareas: [
      { id:'seleccionar-panel', enunciado:'Ve a M3 y pon el Lugar de control (P3.1) en "Panel".', pista:'M3 → flecha derecha para entrar → flecha derecha para editar P3.1 → arriba/abajo para cambiar → Enter para confirmar.', verificar:function(e){ return e.valores['P3.1'] === 2; } },
      { id:'referencia-25hz', enunciado:'En M3 → P3.2 (Referencia panel), pon la referencia en 25.00 Hz.', pista:'Entra en modo edición con la flecha derecha y usa arriba/abajo. Confirma con Enter.', verificar:function(e){ return Math.abs(e.valores['P3.2'] - 25.00) < 0.01; } },
      { id:'arrancar-y-llegar', enunciado:'Presiona START y espera a que la frecuencia de salida (M1 → V1.1) llegue a la referencia.', pista:'La rampa depende de P2.3 (tiempo de aceleración). Observa M1 → V1.1 mientras corre.', verificar:function(e){ return e.estadoDrive === 'run' && Math.abs(e.freqActual - e.valores['P3.2']) < 0.05; } },
      { id:'cambiar-referencia-en-marcha', enunciado:'Con el motor ya en marcha, subí la referencia (P3.2) a 40.00 Hz sin detenerlo.', pista:'Andá a M3 → P3.2, editá el valor. El motor sigue corriendo mientras lo hacés.', verificar:function(e){ return e.estadoDrive === 'run' && Math.abs(e.freqActual - 40.00) < 0.05; } },
      { id:'parar-y-confirmar-cero', enunciado:'Presioná STOP y confirmá que la frecuencia baja a 0 y el drive vuelve a detenido.', pista:'Esperá a que termine la rampa de deceleración.', verificar:function(e){ return e.estadoDrive === 'stop' && e.freqActual === 0; } }
    ]
  },
  {
    id: 'fallas',
    nombre: 'Diagnóstico de fallas',
    teoria: [
      'M4 muestra solo la falla que bloquea el drive ahora (o "sin fallas activas"); M5 conserva un historial de las últimas fallas aunque ya se hayan reseteado — revisar el historial ayuda a detectar patrones que la falla activa por sí sola no muestra.',
      'Resetear una falla no resuelve su causa: si la condición sigue, vuelve a aparecer. El procedimiento correcto es identificar el código en M4, revisar causa/remedio, corregir la causa real, y recién entonces resetear.'
    ],
    tareas: [
      { id:'diagnosticar-falla', enunciado:'Se acaba de disparar una falla externa (F51). Ve a M4, identifica la falla, y resetéala con el botón "reset".', pista:'M4 muestra el código y el remedio. El botón reset limpia la falla activa.', accion:function(e){ if (e.estadoDrive !== 'falla') e.forzarFalla(51); }, verificar:function(e){ return e.historialFallas[0] === 51 && e.estadoDrive !== 'falla'; } }
    ]
  },
  {
    id: 'encoder',
    nombre: 'Lazo abierto/cerrado',
    teoria: [],
    tareas: []
  }
];

const TASKS_STORAGE_KEY = 'vfd_progress_vacon-nx-simulador';
var moduloActual = NXModules[0].id;
var indicePorModulo = {};
NXModules.forEach(function(m){ indicePorModulo[m.id] = 0; });
var tareaAccionEjecutada = {};

function cargarProgresoTareas(){
  try{
    var raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return;
    var datos = JSON.parse(raw);
    if (datos.porModulo){
      NXModules.forEach(function(m){
        if (typeof datos.porModulo[m.id] === 'number'){
          indicePorModulo[m.id] = Math.min(datos.porModulo[m.id], m.tareas.length);
        }
      });
    }
  }catch(e){ console.warn('No se pudo cargar el progreso de tareas:', e); }
}
function totalGlobal(){ return NXModules.reduce(function(s,m){ return s + m.tareas.length; }, 0); }
function doneGlobal(){ return NXModules.reduce(function(s,m){ return s + indicePorModulo[m.id]; }, 0); }
function guardarProgresoTareas(){
  try{
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify({ porModulo: indicePorModulo, done: doneGlobal(), total: totalGlobal() }));
  }catch(e){ console.warn('No se pudo guardar el progreso:', e); }
}

window.renderTareas = function(){
  var cont = document.getElementById('panel-tasks');
  if (!cont) return;
  var modulo = NXModules.filter(function(m){ return m.id === moduloActual; })[0];
  if (!modulo) return;

  var idx = indicePorModulo[modulo.id];
  if (idx < modulo.tareas.length){
    var tarea = modulo.tareas[idx];
    var claveAccion = modulo.id + ':' + tarea.id;
    if (tarea.accion && !tareaAccionEjecutada[claveAccion]){ tarea.accion(engine); tareaAccionEjecutada[claveAccion] = true; }
    if (tarea.verificar(engine)){
      indicePorModulo[modulo.id] = idx + 1;
      guardarProgresoTareas();
    }
  }

  var selector = NXModules.map(function(m){
    var activo = m.id === moduloActual;
    return '<button data-modulo="' + m.id + '" style="margin:2px; padding:6px 10px; font-size:11px; border-radius:6px; border:1px solid var(--line); cursor:pointer; background:' + (activo ? 'var(--sky-dim)' : 'var(--panel-raised)') + '; color:var(--text);">' + m.nombre + '</button>';
  }).join('');

  var teoriaHtml = modulo.teoria.map(function(t){ return '<p style="font-size:12px; color:var(--text-dim); margin:6px 0;">' + t + '</p>'; }).join('');

  var idxActual = indicePorModulo[modulo.id];
  var tareaHtml;
  if (idxActual >= modulo.tareas.length){
    tareaHtml = modulo.tareas.length === 0
      ? '<p style="font-size:12px;color:var(--text-dim);">Este módulo todavía no tiene tareas.</p>'
      : '<p style="color:var(--emerald);font-family:var(--sans);">Completaste las ' + modulo.tareas.length + ' tareas de este módulo.</p>';
  } else {
    var t = modulo.tareas[idxActual];
    tareaHtml =
      '<div style="font-size:12px;color:var(--text-dim);">Tarea ' + (idxActual+1) + ' de ' + modulo.tareas.length + '</div>' +
      '<p style="font-size:15px;">' + t.enunciado + '</p>' +
      '<p style="font-size:12px;color:var(--text-dim);">Pista: ' + t.pista + '</p>';
  }

  cont.innerHTML =
    '<div style="font-family:var(--sans);color:var(--text);">' +
    '<div>' + selector + '</div>' +
    '<h3 style="margin:10px 0 4px 0;">' + modulo.nombre + '</h3>' +
    teoriaHtml +
    '<div style="margin-top:10px; padding-top:10px; border-top:1px solid var(--line);">' + tareaHtml + '</div>' +
    '</div>';

  cont.querySelectorAll('button[data-modulo]').forEach(function(btn){
    btn.onclick = function(){ moduloActual = btn.getAttribute('data-modulo'); window.renderTareas(); };
  });
};

cargarProgresoTareas();
</script>
```

- [ ] **Step 2: Verificar**

Mismo comando del Task 1. Confirmar `TODO OK: 60/60` — este paso NO agrega asserts nuevos (es infraestructura + migración de datos ya probados indirectamente por sus propios `verificar()`, que no son asserts del arnés). Confirmar además, leyendo el DOM dumpeado, que `#panel-tasks` contiene el texto "Puesta en marcha" y los 6 botones de módulo.

- [ ] **Step 3: Commit**

```bash
git add capacitaciones/vacon/display/index.html
git commit -m "Reestructurar NXTasks en NXModules: selector sin bloqueo + modulo Puesta en marcha"
```

---

## Task 4: Módulo "Identificación de motor"

**Files:**
- Modify: `capacitaciones/vacon/display/index.html`

**Interfaces:**
- Consumes: `NXModules` (Tarea 3), `engine.correrIdentificacion`/`motorAcoplado`/`identificacionCompleta` (Tarea 1).
- Produces: nada nuevo — solo llena `teoria`/`tareas` del módulo `identificacion` ya definido (vacío) en la Tarea 3.

- [ ] **Step 1: Completar el módulo**

Buscar `id: 'identificacion',` dentro de `NXModules` y reemplazar ese objeto completo (con `teoria: []` y `tareas: []` vacíos) por:

```js
  {
    id: 'identificacion',
    nombre: 'Identificación de motor',
    teoria: [
      'El parámetro "Identificación" (P2.6.16, del grupo G2.6 — pertenece a las aplicaciones Estándar/Multipropósito, no a la Básica) tiene una opción "con motor en marcha" que exige el motor desacoplado de su carga mecánica. Si hay carga en el eje, la identificación típicamente falla y el convertidor reporta F57.',
      'La opción "sin marcha" funciona con cualquier condición de carga — es la que se usa cuando no se puede desacoplar el motor. En el equipo real, la identificación se dispara dando la orden de marcha (START) después de fijar el parámetro.'
    ],
    tareas: [
      { id:'identif-acoplado', enunciado:'El motor está acoplado a su carga (por defecto en este ejercicio). Poné P2.6.16 en "Identif. con marcha" (M2 → G2.6) y presioná START — la identificación debería fallar con F57.', pista:'M2 → derecha → G2.6 → P2.6.16 → derecha para editar → arriba hasta "Identif. con marcha" → Enter. Después START.', accion:function(e){ e.motorAcoplado = true; }, verificar:function(e){ return e.fallaActiva === 57; } },
      { id:'identif-desacoplado', enunciado:'Reseteá la falla, y repetí: P2.6.16 en "Identif. con marcha" y START. El motor ya queda desacoplado para este ejercicio, así que ahora debería completar sin falla.', pista:'Botón reset primero para limpiar F57.', accion:function(e){ e.motorAcoplado = false; }, verificar:function(e){ return e.identificacionCompleta === true; } }
    ]
  },
```

- [ ] **Step 2: Verificar**

Mismo comando del Task 1. Confirmar `TODO OK: 60/60` (sin cambios en el arnés — este módulo se verifica navegando la UI, no con asserts nuevos). Confirmar en el DOM dumpeado que el módulo "Identificación de motor" ya no muestra "todavía no tiene tareas".

- [ ] **Step 3: Commit**

```bash
git add capacitaciones/vacon/display/index.html
git commit -m "Completar el modulo Identificacion de motor con sus 2 tareas"
```

---

## Task 5: Módulo "Rampas y protecciones"

**Files:**
- Modify: `capacitaciones/vacon/display/index.html`

**Interfaces:**
- Consumes: `NXModules` (Tarea 3), motor de rampas/fallas ya existente (F1/F2, `tick()`, sin cambios de este plan).
- Produces: nada nuevo — llena `teoria`/`tareas` del módulo `rampas`.

- [ ] **Step 1: Completar el módulo**

Buscar `id: 'rampas',` y reemplazar el objeto completo por:

```js
  {
    id: 'rampas',
    nombre: 'Rampas y protecciones',
    teoria: [
      'Los tiempos de rampa (P2.3/P2.4) se miden de 0 Hz a la frecuencia MÁXIMA (P2.2), no hasta la referencia pedida — fuente común de confusión en terreno.',
      'El límite de intensidad (P2.5) no es informativo: si la corriente real lo supera durante la marcha, dispara F1 y corta la salida.',
      'Al frenar, la energía cinética de la carga sube la tensión del bus DC. Un P2.4 muy corto para la inercia real dispara F2 (Sobretensión) si el tipo de paro es en rampa (P2.12=1).'
    ],
    tareas: [
      { id:'config-rampa', enunciado:'Configurá P2.3 (tiempo de aceleración) a un valor entre 1.5 y 2.5 segundos.', pista:'M2 → G2.1 → P2.3.', verificar:function(e){ return e.valores['P2.3'] >= 1.5 && e.valores['P2.3'] <= 2.5; } },
      { id:'provocar-f1', enunciado:'Bajá P2.5 (límite de intensidad) por debajo de P2.9 (intensidad nominal), arrancá el motor, y esperá a que se dispare F1 por sí solo. Reseteala.', pista:'La corriente simulada sube con la frecuencia — si el límite queda muy bajo, F1 se dispara sin que la fuerces vos.', verificar:function(e){ return e.historialFallas[0] === 1 && e.estadoDrive !== 'falla'; } },
      { id:'provocar-f2', enunciado:'Poné P2.4 por debajo de 1.0 s, P2.12 en "Rampa", arrancá, esperá a que llegue a régimen, y presioná STOP. Debería dispararse F2. Reseteala.', pista:'La deceleración muy corta con carga en movimiento es justo el caso que dispara F2.', verificar:function(e){ return e.historialFallas[0] === 2 && e.estadoDrive !== 'falla'; } },
      { id:'corregir-f2', enunciado:'Subí P2.4 a 3.0 s o más, y repetí un ciclo completo de arranque/paro sin que F2 se repita.', pista:'Con un tiempo de deceleración razonable, el mismo ciclo ya no dispara la falla.', verificar:function(e){ return e.valores['P2.4'] >= 3.0 && e.estadoDrive === 'stop'; } },
      { id:'clamp-frecuencia-max', enunciado:'Bajá P2.2 (frecuencia máxima) a menos de 50 Hz, y después intentá subir P3.2 más allá de ese nuevo máximo (mantené presionado ▲) — confirmá que no lo puede superar.', pista:'P2.2 acota el rango editable de P3.2 — el clamp se aplica cuando editás P3.2, no automáticamente al bajar P2.2.', verificar:function(e){ return e.valores['P2.2'] < 50 && e.valores['P3.2'] === e.valores['P2.2']; } }
    ]
  },
```

- [ ] **Step 2: Verificar**

Mismo comando del Task 1. Confirmar `TODO OK: 60/60`.

- [ ] **Step 3: Commit**

```bash
git add capacitaciones/vacon/display/index.html
git commit -m "Completar el modulo Rampas y protecciones con sus 5 tareas"
```

---

## Task 6: Módulo "Control desde el panel" — 2 tareas nuevas

**Files:**
- Modify: `capacitaciones/vacon/display/index.html`

**Interfaces:**
- Consumes: `NXModules` (Tarea 3, que ya migró las 3 tareas existentes a este módulo).
- Produces: nada nuevo — agrega 2 tareas al array `tareas` del módulo `panel` que la Tarea 3 ya dejó con 3.

- [ ] **Step 1: Confirmar que las 2 tareas ya están incluidas**

Este módulo ya quedó completo en la Tarea 3 (las 5 tareas —3 migradas + 2 nuevas— se escribieron todas juntas ahí para minimizar el número de ediciones al mismo array). Este Task 6 es un checkpoint de verificación dedicado, no agrega código nuevo.

- [ ] **Step 2: Verificar**

Mismo comando del Task 1. Confirmar `TODO OK: 60/60`, y que el módulo "Control desde el panel" muestra "Tarea 1 de 5" al entrar por primera vez (no "de 3").

- [ ] **Step 3: Commit (si hubo algún ajuste; si no, omitir)**

Si el Step 2 no encontró discrepancias, no hay nada que commitear en esta tarea — continuar directamente a la Tarea 7.

---

## Task 7: Módulo "Diagnóstico de fallas" — 3 tareas nuevas

**Files:**
- Modify: `capacitaciones/vacon/display/index.html`

**Interfaces:**
- Consumes: `NXModules` (Tarea 3, con la tarea F51 ya migrada), `engine.forzarFalla`/`historialFallas` (motor original).
- Produces: nada nuevo — agrega 3 tareas al array `tareas` del módulo `fallas`.

- [ ] **Step 1: Agregar las 3 tareas nuevas**

Buscar `id: 'fallas',` y dentro de su array `tareas` (que hoy tiene solo `diagnosticar-falla`), agregar estos 3 objetos después del existente:

```js
      { id:'diagnosticar-f16', enunciado:'Se disparó F16 (Exceso de temperatura del motor). Ve a M4, leé la causa/remedio, y reseteala.', pista:'Mismo patrón que la falla anterior, código distinto.', accion:function(e){ if (e.estadoDrive !== 'falla') e.forzarFalla(16); }, verificar:function(e){ return e.historialFallas[0] === 16 && e.estadoDrive !== 'falla'; } },
      { id:'secuencia-dos-fallas', enunciado:'Se van a disparar 2 fallas en secuencia (F1 y F51). Andá a M5 y confirmá que el historial las registra en orden: la más reciente primero.', pista:'F51 se disparó después de F1, así que debería quedar primera en el historial.', accion:function(e){ if (e.historialFallas.length === 0){ e.valores['P3.1'] = 2; e.valores['P3.2'] = e.valores['P2.7']; e.valores['P2.5'] = 1.0; e.press('start'); e.tick(100); e.resetearFalla(); e.forzarFalla(51); } }, verificar:function(e){ return e.historialFallas[0] === 51 && e.historialFallas[1] === 1; } },
      { id:'contraste-f1-f2', enunciado:'Provocá F1 (sobrecorriente, bajando P2.5) y reseteala. Después provocá F2 (deceleración corta) y reseteala. Son dos protecciones distintas: una cuida el motor/cableado, la otra la electrónica de potencia.', pista:'Repetís lo que ya hiciste en el módulo de Rampas, pero esta vez en secuencia dentro del mismo ejercicio.', verificar:function(e){ return e.historialFallas[0] === 2 && e.historialFallas[1] === 1 && e.estadoDrive !== 'falla'; } }
```

- [ ] **Step 2: Verificar**

Mismo comando del Task 1. Confirmar `TODO OK: 60/60`, y que el módulo "Diagnóstico de fallas" muestra "Tarea 1 de 4".

- [ ] **Step 3: Commit**

```bash
git add capacitaciones/vacon/display/index.html
git commit -m "Completar el modulo Diagnostico de fallas con 3 tareas nuevas"
```

---

## Task 8: Módulo "Lazo abierto/cerrado"

**Files:**
- Modify: `capacitaciones/vacon/display/index.html`

**Interfaces:**
- Consumes: `NXModules` (Tarea 3), `engine.encoderConectado`/`P2.6.12`/F43/`_cambioModoControlBloqueado` (Tarea 2).
- Produces: nada nuevo — llena `teoria`/`tareas` del módulo `encoder`.

- [ ] **Step 1: Completar el módulo**

Buscar `id: 'encoder',` (el módulo, no confundir con el campo `engine.encoderConectado`) y reemplazar el objeto completo por:

```js
  {
    id: 'encoder',
    nombre: 'Lazo abierto/cerrado',
    teoria: [
      'El "Modo de control" (P2.6.12, también del grupo G2.6) puede ponerse en Lazo cerrado, que requiere una señal real de realimentación de velocidad (encoder). En el equipo real esto implica una tarjeta de opción de encoder física instalada y parametrizada, no solo un ajuste de software.',
      'El manual indica que el modo de control NO se puede cambiar entre lazo abierto y cerrado mientras el convertidor está en MARCHA — hay que detenerlo primero.'
    ],
    tareas: [
      { id:'encoder-falta-tarjeta', enunciado:'Sin marcar el encoder como conectado, poné P2.6.12 en "Lazo cerrado" (M2 → G2.6) y arrancá con START. Debería dispararse F43 (falta la tarjeta de encoder).', pista:'El drive detecta que pediste lazo cerrado pero no hay tarjeta de encoder conectada.', verificar:function(e){ return e.fallaActiva === 43; } },
      { id:'encoder-conectado', enunciado:'Reseteá la falla, y arrancá de nuevo en Lazo cerrado — el encoder ya queda conectado para este ejercicio.', pista:'Botón reset primero.', accion:function(e){ e.encoderConectado = true; }, verificar:function(e){ return e.estadoDrive === 'run'; } },
      { id:'encoder-bloqueo-en-marcha', enunciado:'Con el drive en marcha, intentá cambiar P2.6.12 a "Lazo abierto". No debería dejarte — el modo de control solo se cambia con el drive detenido.', pista:'Navegá a P2.6.12 e intentá entrar en modo edición (flecha derecha) mientras el motor sigue corriendo.', verificar:function(e){ return e._cambioModoControlBloqueado === true; } }
    ]
  }
```

Nota: este es el ÚLTIMO elemento del array `NXModules` (no lleva coma final).

- [ ] **Step 2: Verificar**

Mismo comando del Task 1. Confirmar `TODO OK: 60/60`, y que el módulo "Lazo abierto/cerrado" muestra "Tarea 1 de 3". Confirmar además que los 6 módulos son todos clickeables y ninguno aparece bloqueado/deshabilitado.

- [ ] **Step 3: Verificación final de los 6 módulos completos**

Con `mcp__claude-in-chrome` si está disponible (`ToolSearch` con `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__javascript_tool`): navegar a la página, hacer click en cada uno de los 6 botones de módulo, confirmar que cada uno muestra su teoría y su primera tarea (o "todavía no tiene tareas" para ninguno — todos deberían tener contenido real a esta altura). Si no está disponible, confirmar por lectura del DOM dumpeado que los 6 nombres de módulo y sus primeras tareas aparecen en el HTML renderizado.

- [ ] **Step 4: Commit**

```bash
git add capacitaciones/vacon/display/index.html
git commit -m "Completar el modulo Lazo abierto-cerrado con sus 3 tareas"
```
