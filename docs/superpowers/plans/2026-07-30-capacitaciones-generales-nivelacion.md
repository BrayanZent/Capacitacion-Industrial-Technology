# Tres capacitaciones generales de nivelación — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar 3 capacitaciones interactivas nuevas ("Electricidad industrial básica", "Puesta en marcha y parametrización genérica", "Diagnóstico y fallas comunes") a la categoría "Fundamentos · Sin marca" del portal, completando la currícula de 4 piezas antes de las capacitaciones de marca.

**Architecture:** Cada capacitación es un HTML de una sola página, autocontenido, siguiendo el formato `MODULES` ya establecido (ver skill `capacitacion-vacon-style`). No hay backend ni build step. El progreso se persiste en `localStorage` por capacitación y se sincroniza al portal vía `syncPortalProgress()`.

**Tech Stack:** HTML/CSS/JS vanilla (sin frameworks), Google Fonts (IBM Plex Mono/Sans), Chrome headless para verificación.

## Global Constraints

- Formato exacto de `capacitacion-vacon-style`: tokens CSS, helpers `H3`/`NOTE`/`INFO`/`IMG`/`PLACEHOLDER`, estructura `MODULES`, motor de quiz de una pregunta a la vez, overview con progreso.
- Proceso de `nueva-capacitacion-eficiente`: nunca releer archivos completos sin offset/limit, verificar con `--dump-dom`+grep antes de screenshot, rutas absolutas para `file:///` y `--screenshot` en Windows.
- Sin manual/PDF fuente para estas 3 capacitaciones — contenido validado como conocimiento general de industria por el agente `ing-vdf`, no citado contra un documento puntual.
- 5 preguntas de quiz por módulo, ancladas a hechos verificados del contenido del mismo módulo.
- `THEME_KEY = 'capacitacion-theme'` (compartido con el resto del sitio) en las 3 capacitaciones.
- Logo referenciado como `src="../../assets/logo-industrial-technology.png"`.
- `sidebar-foot` con enlace `<a href="../../index.html">← Todas las capacitaciones</a>` en las 3.

---

## Tasks 1, 2 y 3 corren en paralelo (son independientes)

Task 4 corre después de que las tres terminen, porque edita el mismo archivo (`index.html` raíz).

---

### Task 1: Capacitación "Electricidad industrial básica para no electricistas"

**Files:**
- Create: `capacitaciones/general/electricidad-basica.html`

**Interfaces:**
- Consumes: patrón de `capacitaciones/general/introduccion-vfd.html` como referencia de formato (helpers, CSS, motor de quiz, `IMG`/`PLACEHOLDER`).
- Produces: `STORAGE_KEY = 'electricidad_basica_training_progress_v1'`; escribe `localStorage['vfd_progress_electricidad-basica'] = {done, total}` vía `syncPortalProgress()` — Task 4 depende de este `id` (`electricidad-basica`) para el `courseDefs()` del portal.

- [ ] **Step 1: Redactar el archivo completo**

Usar el agente `web-creator` (carga `capacitacion-vacon-style` y `nueva-capacitacion-eficiente`) para escribir `capacitaciones/general/electricidad-basica.html` de punta a punta en un solo `Write`, con:

- `eyebrow` de categoría: `"Fundamentos eléctricos"`.
- Landing/overview con título "Electricidad industrial básica" y subtítulo: "Los fundamentos eléctricos que necesitás antes de tocar un variador de frecuencia — sin conocimientos previos de electricidad."
- 7 módulos, en este orden y con este contenido mínimo (el redactor amplía con `H3`, tablas, `NOTE`/`INFO` donde corresponda; usar `PLACEHOLDER()` para las imágenes, todavía no hay material fuente):

  1. **`corriente-ac-dc`** — Corriente continua (DC) vs. alterna (AC): qué es cada una, por qué la red eléctrica es AC y las baterías/bus DC de un VFD son DC, forma de onda senoidal vs. constante.
  2. **`sistemas-trifasicos`** — Qué es un sistema trifásico, por qué la industria lo usa (potencia constante entregada, menor tamaño de conductores por potencia transmitida vs. monofásico), diferencia entre conexión estrella y triángulo a nivel conceptual.
  3. **`motor-induccion`** — Partes básicas de un motor de inducción (estator, rotor, entrehierro), qué es la velocidad síncrona (fórmula `n = 120·f / p`), qué es el deslizamiento (slip) y por qué el rotor gira un poco más lento que el campo del estator. Cerrar conectando explícitamente con Introducción a VFD: "por eso cambiar la frecuencia (f) cambia directamente la velocidad del motor".
  4. **`puesta-a-tierra`** — Qué es la puesta a tierra, por qué existe (camino de baja impedancia para corrientes de falla, protección de personas), diferencia entre tierra de protección y tierra de referencia de señal a nivel conceptual.
  5. **`multimetro`** — Uso correcto de un multímetro: medición de voltaje (AC/DC, en paralelo), corriente (en serie, cuidado con el fusible interno), continuidad y resistencia (siempre sin tensión). Incluir una `NOTE()` de seguridad: nunca medir resistencia/continuidad en un circuito energizado.
  6. **`placa-motor`** — Cómo leer una placa de datos de motor: tensión nominal, corriente nominal, frecuencia, RPM nominal, factor de potencia (cos φ), clase de aislamiento, grado de protección IP. Explicar por qué estos datos son exactamente lo que después se necesita para parametrizar un VFD (puente hacia Cap. 3).
  7. **`glosario-electrico`** — Tabla `table.tech` con términos: AC, DC, trifásico, tierra, multímetro, placa de motor, velocidad síncrona, deslizamiento, cos φ, IP (grado de protección) — sin repetir términos ya definidos en el glosario de Introducción a VFD (IGBT, PWM, bus DC, etc. no van acá).

- 5 preguntas de quiz por módulo (35 en total), ancladas a hechos del contenido de ese módulo.
- En el `sidebar-foot`, agregar además del link al portal: `<a href="puesta-en-marcha.html">Seguir: Puesta en marcha →</a>` (el archivo del Task 2; el link no rompe nada si Task 2 todavía no existe en el momento de escribir el HTML, se resuelve cuando ambos estén mergeados).

- [ ] **Step 2: Validación técnica**

Usar el agente `ing-vdf` para revisar `capacitaciones/general/electricidad-basica.html`: confirmar que las afirmaciones de los 7 módulos son correctas como conocimiento general de electricidad industrial (no específico de marca). Reportar cualquier imprecisión con módulo y corrección sugerida.

- [ ] **Step 3: Aplicar correcciones**

Si `ing-vdf` señaló imprecisiones, aplicarlas con `Edit` sobre las secciones puntuales (usar `Grep` para ubicar la línea exacta, no releer el archivo completo).

- [ ] **Step 4: Verificar sin errores de sintaxis**

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-sandbox --dump-dom "file:///C:/Users/BryanZent/Desktop/CLOUDE/capacitaciones/general/electricidad-basica.html" > dump.html 2>err.log
cat err.log
grep -o 't-title">[0-9]* · [^<]*' dump.html
```

Expected: `err.log` vacío, 7 títulos de módulo listados (00 a 06, o el overview + 7 según cómo indexe el sidebar).

- [ ] **Step 5: Captura visual de un módulo representativo**

Generar copia temporal con `sed` forzando `currentId: 'motor-induccion'` (el módulo con la fórmula de velocidad síncrona), capturar con `--screenshot` a ruta absoluta, revisar con Read, borrar la copia y las capturas de verificación.

- [ ] **Step 6: Limpieza y commit**

```bash
rm -f dump.html err.log
git add "capacitaciones/general/electricidad-basica.html"
git commit -m "Agregar capacitación: Electricidad industrial básica para no electricistas"
```

---

### Task 2: Capacitación "Puesta en marcha y parametrización genérica"

**Files:**
- Create: `capacitaciones/general/puesta-en-marcha.html`

**Interfaces:**
- Consumes: mismo patrón de formato que Task 1 (`introduccion-vfd.html` como referencia).
- Produces: `STORAGE_KEY = 'puesta_en_marcha_training_progress_v1'`; `localStorage['vfd_progress_puesta-en-marcha']` — Task 4 depende del `id` `puesta-en-marcha`.

- [ ] **Step 1: Redactar el archivo completo**

Usar el agente `web-creator` para escribir `capacitaciones/general/puesta-en-marcha.html` completo en un solo `Write`, con:

- `eyebrow` de categoría: `"Puesta en marcha"`.
- Overview con título "Puesta en marcha y parametrización genérica" y subtítulo: "De la inspección de instalación a los primeros arranques — el procedimiento genérico común a cualquier marca de VFD."
- 6 módulos:

  1. **`inspeccion-instalacion`** — Inspección previa a energizar: separación física de cableado de potencia y de control (por qué, riesgo de ruido/interferencia), verificación de continuidad de tierra, verificación de ventilación/espacio libre alrededor del gabinete según el grado IP. `NOTE()` de seguridad: nunca energizar sin esta inspección, cita el riesgo de energía residual del bus DC ya cubierto en Introducción a VFD (referenciar, no repetir en detalle).
  2. **`de-placa-a-parametros`** — Cómo los datos de la placa del motor (Cap. 2: tensión, corriente, frecuencia, RPM nominal, cos φ) se traducen a los parámetros básicos que pide cualquier VFD al arrancar el asistente de puesta en marcha (tensión nominal motor, corriente nominal motor, frecuencia nominal, velocidad nominal). Aclarar con `INFO()` que el nombre exacto de cada parámetro varía por marca — remitir a las capacitaciones de marca para el detalle.
  3. **`parametros-comunes`** — Parámetros genéricos presentes en prácticamente cualquier VFD: rampa de aceleración/desaceleración, límite de corriente, tipo de control (referenciar escalar/vectorial de Cap. 1), fuente de referencia de velocidad (referenciar macros de Cap. 1). Tabla `table.tech` resumen.
  4. **`pruebas-en-vacio`** — Qué es una prueba en vacío (motor desacoplado de la carga mecánica), qué se verifica (sentido de giro, ausencia de vibración/ruido anormal, que el motor llegue a la velocidad de referencia sin fallas). `NOTE()`: nunca acoplar la carga hasta confirmar esto.
  5. **`pruebas-con-carga`** — Acoplar la carga, verificar comportamiento a distintas velocidades/puntos de operación reales del proceso, ajuste fino de rampas y límites según lo observado.
  6. **`documentar-puesta-en-marcha`** — Qué documentar al cerrar una puesta en marcha: parámetros finales configurados, datos de placa usados, observaciones de las pruebas, checklist de traspaso a producción/mantenimiento. Cierre del módulo con un link de continuidad hacia Diagnóstico y fallas comunes (Task 3).

- 5 preguntas de quiz por módulo (30 en total).
- En el `sidebar-foot`: `<a href="electricidad-basica.html">← Electricidad básica</a>` y `<a href="diagnostico-fallas.html">Seguir: Diagnóstico de fallas →</a>`.

- [ ] **Step 2: Validación técnica**

Usar el agente `ing-vdf` para revisar los 6 módulos contra buenas prácticas reales de puesta en marcha de VFD (conocimiento general, no específico de marca). Reportar imprecisiones con módulo y corrección sugerida — prestar especial atención al Módulo 2 (mapeo placa→parámetros) y Módulo 4 (qué se verifica realmente en vacío).

- [ ] **Step 3: Aplicar correcciones**

Igual que Task 1 Step 3, con `Edit` puntual sobre las secciones señaladas.

- [ ] **Step 4: Verificar sin errores de sintaxis**

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-sandbox --dump-dom "file:///C:/Users/BryanZent/Desktop/CLOUDE/capacitaciones/general/puesta-en-marcha.html" > dump.html 2>err.log
cat err.log
grep -o 't-title">[0-9]* · [^<]*' dump.html
```

Expected: `err.log` vacío, 6 módulos listados.

- [ ] **Step 5: Captura visual de un módulo representativo**

Forzar `currentId: 'de-placa-a-parametros'` (el de la tabla de mapeo), capturar, revisar, borrar copias.

- [ ] **Step 6: Limpieza y commit**

```bash
rm -f dump.html err.log
git add "capacitaciones/general/puesta-en-marcha.html"
git commit -m "Agregar capacitación: Puesta en marcha y parametrización genérica"
```

---

### Task 3: Capacitación "Diagnóstico y fallas comunes"

**Files:**
- Create: `capacitaciones/general/diagnostico-fallas.html`

**Interfaces:**
- Consumes: mismo patrón de formato que Tasks 1-2.
- Produces: `STORAGE_KEY = 'diagnostico_fallas_training_progress_v1'`; `localStorage['vfd_progress_diagnostico-fallas']` — Task 4 depende del `id` `diagnostico-fallas`.

- [ ] **Step 1: Redactar el archivo completo**

Usar el agente `web-creator` para escribir `capacitaciones/general/diagnostico-fallas.html` completo en un solo `Write`, con:

- `eyebrow` de categoría: `"Diagnóstico"`.
- Overview con título "Diagnóstico y fallas comunes" y subtítulo: "Cómo razonar un diagnóstico de VFD paso a paso, antes de aprender los códigos específicos de cada marca."
- 7 módulos:

  1. **`pensar-el-diagnostico`** — Metodología general: distinguir síntoma (lo que el VFD reporta) de causa raíz (lo que realmente falló), por qué reiniciar/resetear una falla sin investigar la causa lleva a que se repita, orden lógico de diagnóstico (verificar lo simple/externo antes de lo interno/complejo).
  2. **`sobrecorriente`** — Qué es una falla de sobrecorriente/sobrecarga, causas típicas genéricas (motor sobredimensionado para el VFD, carga mecánica trabada o excesiva, rampa de aceleración demasiado agresiva, cortocircuito de salida), qué verificar primero.
  3. **`bus-dc`** — Fallas de sobretensión y subtensión del bus DC: sobretensión típica por frenado/desaceleración rápida sin resistencia de frenado, subtensión típica por caída de tensión de red o fase faltante. Referenciar el riesgo de energía residual del bus DC ya cubierto en Introducción a VFD.
  4. **`sobretemperatura`** — Causas típicas de sobretemperatura del VFD (ventilación obstruida, temperatura ambiente excesiva, filtros de aire sucios, ventilador interno fallado) vs. sobretemperatura del motor (sobrecarga sostenida, mala ventilación del motor).
  5. **`fallas-de-tierra`** — Qué detecta una falla de tierra/fuga, causas típicas (aislamiento de cable dañado, humedad, motor con aislamiento degradado), por qué es una falla que nunca debe ignorarse/resetearse sin investigar (riesgo eléctrico real).
  6. **`historial-de-fallas`** — Qué información valiosa da el historial de fallas de un VFD (marca de tiempo, valores de proceso al momento de la falla), checklist de primera respuesta genérico: anotar el código exacto, revisar historial, verificar lo obvio (alimentación, conexiones, temperatura ambiente) antes de escalar.
  7. **`mantenimiento-preventivo`** — Buenas prácticas genéricas para prevenir fallas recurrentes: limpieza de filtros/ventilación, ajuste de terminales (torque), medición periódica de aislamiento, revisión de condensadores del bus DC en equipos de muchos años de uso. Cierre de la capacitación: mensaje de que el detalle específico de cada práctica se profundiza en las capacitaciones de marca correspondientes.

- 5 preguntas de quiz por módulo (35 en total).
- En el `sidebar-foot`: `<a href="puesta-en-marcha.html">← Puesta en marcha</a>` (última de la secuencia, sin "seguir" — el siguiente paso son las capacitaciones de marca, ya accesibles desde el portal).

- [ ] **Step 2: Validación técnica**

Usar el agente `ing-vdf` para revisar los 7 módulos, con foco en que las causas típicas listadas en cada tipo de falla (sobrecorriente, bus DC, sobretemperatura, tierra) sean genéricas y correctas para cualquier fabricante, no específicas de una marca que se coló por error.

- [ ] **Step 3: Aplicar correcciones**

Igual que en Tasks 1-2.

- [ ] **Step 4: Verificar sin errores de sintaxis**

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-sandbox --dump-dom "file:///C:/Users/BryanZent/Desktop/CLOUDE/capacitaciones/general/diagnostico-fallas.html" > dump.html 2>err.log
cat err.log
grep -o 't-title">[0-9]* · [^<]*' dump.html
```

Expected: `err.log` vacío, 7 módulos listados.

- [ ] **Step 5: Captura visual de un módulo representativo**

Forzar `currentId: 'pensar-el-diagnostico'` (el módulo metodológico de apertura), capturar, revisar, borrar copias.

- [ ] **Step 6: Limpieza y commit**

```bash
rm -f dump.html err.log
git add "capacitaciones/general/diagnostico-fallas.html"
git commit -m "Agregar capacitación: Diagnóstico y fallas comunes"
```

---

### Task 4: Registrar las 3 capacitaciones en el portal

**Depends on:** Tasks 1, 2 y 3 completos (los 3 archivos HTML deben existir).

**Files:**
- Modify: `index.html` (raíz) — dentro de `courseDefs()`, línea donde está la entrada `introduccion-vfd` (buscar con `Grep "courseDefs"`).

**Interfaces:**
- Consumes: `id`s `electricidad-basica`, `puesta-en-marcha`, `diagnostico-fallas` (deben coincidir exactamente con lo que cada capacitación escribe en `localStorage['vfd_progress_' + id]` en sus Tasks 1-3, Step 1).

- [ ] **Step 1: Ubicar el array `courseDefs()`**

```bash
grep -n "courseDefs" index.html
```

- [ ] **Step 2: Agregar las 3 entradas nuevas**

Insertar, inmediatamente después de la entrada `introduccion-vfd` dentro del array que retorna `courseDefs()`:

```js
{ id: 'electricidad-basica', title: 'Electricidad Industrial Básica para No Electricistas', brand: 'General', model: 'Fundamentos eléctricos previos al VFD', desc: 'Corriente AC/DC, sistemas trifásicos, fundamentos del motor de inducción, puesta a tierra, uso del multímetro y lectura de placa de motor — la base eléctrica antes de tocar un variador.', href: 'capacitaciones/general/electricidad-basica.html', locked: false },
{ id: 'puesta-en-marcha', title: 'Puesta en Marcha y Parametrización Genérica', brand: 'General', model: 'Procedimiento común a cualquier marca', desc: 'Inspección de instalación, de la placa del motor a los parámetros básicos, pruebas en vacío y con carga, y documentación de la puesta en marcha — el procedimiento genérico antes de ver el detalle de cada marca.', href: 'capacitaciones/general/puesta-en-marcha.html', locked: false },
{ id: 'diagnostico-fallas', title: 'Diagnóstico y Fallas Comunes', brand: 'General', model: 'Metodología y causas típicas genéricas', desc: 'Cómo razonar un diagnóstico de VFD, causas típicas de sobrecorriente, fallas de bus DC, sobretemperatura y tierra, y buenas prácticas de mantenimiento preventivo — antes de los códigos específicos de cada marca.', href: 'capacitaciones/general/diagnostico-fallas.html', locked: false },
```

- [ ] **Step 3: Verificar el portal sin errores**

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-sandbox --dump-dom "file:///C:/Users/BryanZent/Desktop/CLOUDE/index.html" > dump.html 2>err.log
cat err.log
grep -o "Electricidad Industrial\|Puesta en Marcha y Parametrización\|Diagnóstico y Fallas Comunes" dump.html
```

Expected: `err.log` vacío, las 3 nuevas apariciones encontradas.

- [ ] **Step 4: Captura visual del portal**

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-sandbox --window-size=1400,1000 --screenshot="C:\Users\BryanZent\Desktop\CLOUDE\portal_check.png" "file:///C:/Users/BryanZent/Desktop/CLOUDE/index.html"
```

Revisar con Read que las 4 tarjetas "General" aparecen agrupadas y con formato consistente.

- [ ] **Step 5: Limpieza, commit y push**

```bash
rm -f dump.html err.log portal_check.png
git add index.html
git commit -m "Registrar las 3 capacitaciones generales nuevas en el portal"
git push
```

Confirmar con el usuario antes de este `push` (acción visible/compartida — no pushear sin decírselo primero, aunque los Tasks 1-3 ya hayan hecho commits locales).

---

## Post-implementation

Verificar en vivo (GitHub Pages) igual que se hizo con Introducción a VFD: esperar 1-2 minutos de propagación, confirmar con `curl -s -o /dev/null -w "%{http_code}"` contra la URL del portal en `https://brayanzent.github.io/Capacitacion-Industrial-Technology/`, y avisar al usuario que si no ve los cambios haga hard-refresh.
