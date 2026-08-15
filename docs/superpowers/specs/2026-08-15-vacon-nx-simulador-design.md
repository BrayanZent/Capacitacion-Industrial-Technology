# Simulador web del teclado VACON NX

**Fecha:** 2026-08-15
**Estado:** Aprobado, pendiente de plan de implementación

## Contexto

El usuario tenía la aplicación oficial `VirtualPanel.exe` (VACON NX VirtualPanel
1.2.0.1) y quería usarla en modo local, sin puerto ni interfaz externa.

Investigación (systematic-debugging) determinó que `VirtualPanel.exe` es
únicamente el teclado: no contiene lógica de variador ni cadenas de menú
VACON. Depende de `hmiintrf.dll` (memoria compartida `HMISHV`) para recibir
el contenido del LCD desde un proceso servidor — el propio drive o un
simulador — que no está presente. Sin ese servidor, el LCD queda vacío por
diseño; no es un bug reparable ajustando el `.ini`.

Decisión: en vez de perseguir el componente faltante, construir un
simulador propio del teclado + drive como página web, reutilizando el
patrón de las capacitaciones existentes en `capacitaciones/vacon/`.

## Objetivo

Una capacitación más, `capacitaciones/vacon/display/index.html`, donde el alumno:

1. Navega el árbol de menús real del teclado NX (M1 Monitor, M2 Par.
   básicos, M3 Copiar parámetros, M4 Fallas activas, M5 Historial de
   fallas, M6 Menú sistema) usando flechas/enter/reset/select tal como en
   el equipo físico.
2. Edita parámetros de la Aplicación Básica (grupo G2.1 parámetros
   básicos, G2.2 control de motor y rampas) dentro de sus rangos reales.
3. Arranca/detiene el motor simulado y observa frecuencia, velocidad,
   corriente y torque evolucionar en tiempo real en M1 Monitor, según las
   rampas configuradas (P2.1.3 aceleración, P2.1.4 deceleración).
4. Resuelve fallas: se disparan condiciones (sobrecorriente F1,
   sobretensión F2, etc.) que el alumno debe diagnosticar en M4/M5 y
   resetear correctamente.
5. Completa tareas guiadas y evaluadas ("pon la referencia en 25 Hz y
   arranca", "encuentra la causa de la falla activa y resetéala") con
   validación automática de que llegó al estado correcto.

Todo esto en un único archivo HTML, funcionando por `file://` sin
servidor, sin red, sin dependencias externas — igual que
`vacon-nxp.html`.

## No objetivos (YAGNI)

- Las otras 6 aplicaciones del manual All-in-One (Multipropósito, PID,
  etc.) — solo Aplicación Básica.
- Tarjetas de expansión / M7.
- Carga y descarga real de parámetros a un archivo EEPROM `.bin`.
- Comunicación real por puerto serie o cualquier hardware.
- Replicar `VirtualPanel.exe` byte a byte; el objetivo es la experiencia
  de aprendizaje, no la compatibilidad binaria.

## Arquitectura

Cuatro capas dentro de un único archivo, separadas por convención de
nombres de objeto (no por build step — sigue siendo un solo `<script>`):

```
NXData    (datos puros: árbol de menús, parámetros, catálogo de fallas)
   ↓
NXEngine  (máquina de estados: sin DOM, testeable con ?test=1)
   ↓
NXPanel   (vista: LCD, LEDs, teclado — lee NXEngine, no lo muta directo)
   ↓
NXTasks   (ejercicios: define objetivo + verificar(engine) + pista)
```

### NXData

Estructura estática, extraída del manual
`fuentes/vacon/VACON NXP/Vacon-NX-All-in-One-Application-Manual-DPD01211E-ES (1).pdf`
(Aplicación Básica) para fidelidad real, no inventada:

- Árbol de menús M1–M6 con sus submenús.
- Parámetros de G2.1/G2.2: código (ej. `P2.1.3`), nombre, unidad, mínimo,
  máximo, valor por defecto, paso de edición.
- Catálogo de fallas F1–F50: código, nombre, causa probable, acción de
  reset permitida.

### NXEngine

Estado: `{ ruta_actual, modo (navegar|editar), valores_parametro,
estado_drive (stop|run|falla), frecuencia_actual, falla_activa,
historial_fallas }`.

Métodos: `press(tecla)`, `tick(dt)` (integra rampa cuando `estado_drive
== run`), `dispararFalla(codigo)`, `resetearFalla()`.

Sin referencias a `document` — se puede probar en aislamiento.

### NXPanel

Renderiza el LCD (texto de la ruta/parámetro/valor actual según
`NXEngine`) y los LEDs ready/run/fault. Traduce clicks del mouse en el
teclado dibujado y `keydown` del teclado físico a `NXEngine.press()`.
Reutiliza la apariencia visual capturada del panel azul real (LCD verde
oliva, teclado circular, rombo verde start, octágono rojo stop).

### NXTasks

Lista ordenada de ejercicios. Cada uno: enunciado, función
`verificar(engineState) -> boolean`, pista opcional. Se muestra el
enunciado activo sobre el panel; al cumplirse avanza al siguiente y
registra progreso (mismo patrón de `localStorage` que las demás
capacitaciones, si existe — se confirma en el plan).

## Simulación del drive

Lazo `requestAnimationFrame` → `NXEngine.tick(dt)`:

- Si `estado_drive == run`: la frecuencia converge hacia la referencia
  usando `P2.1.3` (rampa aceleración) o `P2.1.4` (rampa deceleración)
  como pendiente en Hz/s.
- Corriente y torque: modelo simple derivado de la frecuencia (curva
  aproximada, no física de motor real — suficiente para fines
  didácticos).
- Si la frecuencia o corriente simulada excede un umbral configurable,
  se dispara la falla correspondiente (F1 sobrecorriente, F2
  sobretensión) y `estado_drive` pasa a `falla`.

## Pruebas

`NXEngine` es JS puro sin DOM, así que lleva un bloque de aserciones
ejecutables activado con `?test=1` en la URL (mismo mecanismo ligero que
el resto del proyecto: sin framework, sin build). Casos mínimos:

- Navegar M2→G2.1→P2.1.3 llega a la ruta esperada.
- Editar un parámetro respeta mínimo/máximo (clamp, no error silencioso
  fuera de rango).
- Arrancar con referencia 25 Hz y rampa 5 s converge a 25 Hz en ~5 s
  (dentro de tolerancia).
- Resetear una falla sin haber despejado la causa no cambia
  `estado_drive`.
- Resetear una falla con la causa despejada vuelve a `stop`.

## Archivo y ubicación

`capacitaciones/vacon/display/index.html` — excepción deliberada al
patrón plano existente (un `.html` por capacitación, sin subcarpetas).
El usuario pidió una carpeta `display/` dedicada dentro de `vacon/`
para agrupar contenido interactivo (este simulador y futuros displays
similares), con el simulador como `index.html` de esa carpeta. Las
rutas relativas a `assets/gate.js` y a las fuentes/Clerk se ajustan un
nivel extra respecto a los archivos hermanos en `capacitaciones/vacon/`.

## Decisiones ya tomadas con el usuario

1. Alcance funcional: tareas guiadas con validación (no solo navegación
   libre, no demo mínima).
2. Alcance de datos: Aplicación Básica + catálogo de fallas completo
   (no Multipropósito, no solo monitoreo).
3. Dinámica: simulación viva con rampas reales y valores de monitoreo
   moviéndose en tiempo real (no valores estáticos).
