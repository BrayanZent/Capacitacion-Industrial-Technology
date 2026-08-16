# Simulador VACON NX — Módulos de teoría + práctica

**Fecha:** 2026-08-16
**Estado:** Aprobado, pendiente de plan de implementación
**Extiende a:** [2026-08-15-vacon-nx-simulador-design.md](2026-08-15-vacon-nx-simulador-design.md) (spec original del simulador)

## Contexto

El simulador VACON NX (`capacitaciones/vacon/display/index.html`) ya está en
producción con 4 tareas guiadas planas y un panel funcional (navegación,
edición de parámetros, simulación de arranque/rampas, sistema de fallas).
El usuario probó el simulador, confirmó que el flujo de suscripción/gate
funciona, y pidió expandirlo con más contenido: teoría intercalada y más
ejercicios prácticos, organizados por módulo temático — replicando el
patrón de sus otras capacitaciones (navegación libre entre módulos, sin
bloqueos), pero sin quizzes de opción múltiple: acá el "quiz" es la
práctica interactiva en el panel.

Una auditoría de fidelidad (comparando el código real contra el manual)
encontró que de los 20 parámetros de G2.1 solo 10 tienen efecto real en
la simulación (P2.1,2,3,4,5,6,7,8,9,12); el resto son editables pero
decorativos. Esa auditoría, más una consulta técnica al especialista en
VFD del proyecto, definieron el contenido de los 6 módulos de abajo,
todos anclados en datos reales del manual VACON (citados con su fuente).

## Objetivo

Reestructurar `NXTasks` (lista plana de 4 tareas) en `NXModules`: 6
módulos, cada uno con teoría breve + sus propias tareas evaluadas. El
alumno navega libremente entre los 6 módulos (pestañas, sin bloqueo ni
orden forzado) — dentro de cada módulo, las tareas siguen siendo
secuenciales como hoy. El progreso total sigue reportándose al portal
con la misma clave `vfd_progress_vacon-nx-simulador` y formato
`{done, total}` que ya usa (ahora sumando las tareas de los 6 módulos).

## Los 6 módulos (orden final)

### 1. Puesta en marcha — datos de placa

Sin cambios de motor de simulación — usa parámetros ya modelados
(P2.6 tensión nominal, P2.7 frecuencia nominal, P2.8 velocidad nominal,
P2.9 intensidad nominal, P2.10 cos phi, todos de G2.1 Aplicación Básica).

**Teoría:** por qué la placa del motor debe cargarse antes de operar —
el manual exige estos 5 datos cargados antes de correr cualquier
identificación (ID110/111/112/113/120, equivalentes a P2.6-P2.10).

**Placa de motor del ejercicio** (motor trifásico IEC de 4 polos,
valores realistas y consistentes entre sí, no inventados):
- Tensión nominal: 400 V
- Frecuencia nominal: 50 Hz
- Velocidad nominal: 1440 rpm (no 1500 — esa es la síncrona sin
  deslizamiento; VACON usa la diferencia para calcular el deslizamiento
  nominal del modelo de motor)
- Intensidad nominal: 15.0 A
- Cos phi: 0.83

**Tarea:** configurar P2.6-P2.10 exactamente con estos 5 valores.
Verificación: los 5 `engine.valores` coinciden con la placa dada.

### 2. Identificación de motor

**Requiere motor de simulación nuevo** (ver sección Cambios al motor).

**Teoría:** el parámetro real "Identificación" (ID631, P2.6.16 en NXP —
fuera de G2.1 Básica, pertenece a Multipropósito/Estándar; se lo
menciona así en el módulo) tiene 5 selecciones documentadas; las dos
relevantes para el ejercicio son "Identificación sin el motor en
marcha" (funciona con cualquier condición de carga) e "Identificación
con el motor en marcha" (exige el motor desacoplado — con carga en el
eje, típicamente falla y el convertidor reporta F57, según las causas
probables que ya lista el catálogo real de F57 en este simulador — no
se presenta como un interlock automático de firmware, sino como
resultado esperado documentado).

**Tareas:**
1. Con el motor marcado como "acoplado" (bandera nueva), intentar
   identificación con marcha → debe terminar en F57.
2. Resetear, marcar el motor como "desacoplado", repetir → debe
   completar con éxito (sin disparar ninguna falla).

### 3. Rampas y protecciones

Sin cambios de motor — 5 tareas nuevas, 100% con física ya simulada.

**Teoría:** los tiempos de rampa (P2.3/P2.4) se miden de 0 Hz a la
frecuencia MÁXIMA (P2.2), no hasta la referencia pedida — fuente común
de confusión en terreno. El límite de intensidad (P2.5) no es
informativo: si la corriente real lo supera durante la marcha, dispara
F1 y corta la salida. Al frenar, la energía cinética de la carga sube
la tensión del bus DC — un P2.4 muy corto para la inercia real dispara
F2. Frenado libre (P2.12=0) deja al motor detenerse por su propia
inercia; rampa (P2.12=1) fuerza un descenso controlado en el tiempo de
P2.4, pero es la opción que puede generar F2 si P2.4 es muy corto.

**Tareas:**
1. Configurar P2.3 a un valor dado (ej. entre 1.5 y 2.5 s) y medir/
   confirmar cuánto tarda en llegar a la referencia.
2. Provocar F1 real bajando P2.5 por debajo de la intensidad nominal
   (P2.9), arrancar, confirmar que se dispara por física simulada (no
   forzada) y resetear.
3. Provocar F2 real: P2.4 por debajo de 1.0 s (umbral simulado),
   P2.12 en rampa, arrancar, llegar a régimen, STOP → debe disparar F2.
4. Corregir la causa: subir P2.4 a un valor seguro (≥ 3.0 s) y repetir
   arranque/paro sin que la falla se repita.
5. Bajar P2.2 (frecuencia máxima) y confirmar que P3.2 queda clampeado
   (no puede superar el nuevo máximo).

### 4. Control desde el panel

Sin cambios de motor — las 3 tareas actuales más 2 nuevas.

**Teoría:** el drive recibe sus órdenes desde Terminal I/O, Panel o
Fieldbus (P3.1) — solo un lugar a la vez; si el panel no es el activo,
START/STOP no tienen efecto y el LCD avisa "Control de panel NO
ACTIVO". La referencia (P3.2/V1.2) es lo que se pide; la frecuencia de
salida real (V1.1) es lo que el motor tiene en cada instante —
diagnosticar "no llega a velocidad" empieza comparando ambos.

**Tareas (las 3 actuales, sin cambios, más):**
4. Con el motor ya en marcha a 25 Hz, subir la referencia (P3.2) a
   40 Hz sin detenerlo — verificar que nunca pasa por `'stop'` y que
   `freqActual` termina cerca de 40 Hz.
5. Presionar STOP y confirmar que `freqActual` llega a 0 y
   `estadoDrive` vuelve a `'stop'` (exige haber pasado por `'run'`
   antes, para no aceptar el estado inicial trivial).

### 5. Diagnóstico de fallas

Sin cambios de motor — la tarea F51 actual más 3 nuevas.

**Teoría:** M4 muestra solo la falla que bloquea el drive ahora (o
"sin fallas activas"); M5 conserva un historial de las últimas fallas
aunque ya se hayan reseteado — revisar el historial ayuda a detectar
patrones que la falla activa por sí sola no muestra. Resetear una
falla no resuelve su causa: si la condición sigue, vuelve a aparecer;
el procedimiento correcto es identificar el código en M4, revisar
causa/remedio, corregir la causa real, y recién entonces resetear.

**Tareas (la actual F51, sin cambios, más):**
2. Diagnosticar un código distinto (F16 "Exceso de temperatura del
   motor" o F11 "Fase de salida") forzado vía `forzarFalla`, mismo
   patrón de verificación que F51.
3. Forzar dos fallas en secuencia (ej. F1 real + F51 forzada) y
   verificar que `historialFallas` las registra en el orden correcto.
4. Ejercicio compuesto: provocar F1 (sobrecarga), resetear, provocar F2
   (deceleración corta), resetear — verificar la secuencia completa en
   `historialFallas` (contraste F1 vs. F2, protecciones distintas:
   motor/cableado vs. electrónica de potencia).

### 6. Lazo abierto/cerrado + encoder

**Requiere motor de simulación nuevo** (ver sección Cambios al motor).

**Teoría:** el parámetro real "Modo de control del motor" (ID600/ID521,
P2.6.12 en NXS/NXP — igual que Identificación, fuera de G2.1 Básica, se
lo aclara en el módulo) incluye selecciones de lazo cerrado que
requieren realimentación de velocidad real (encoder). El manual
documenta que el cambio entre lazo abierto y cerrado **no se puede
hacer con el convertidor en MARCHA** — el ejercicio debe reforzar esto.
La falla F43 real tiene 5 sub-causas documentadas; la que se simula es
la sub-causa 5, "falta la tarjeta de encoder" — el mensaje del ejercicio
debe usar ese texto exacto para que coincida con lo que el alumno vería
en M4/M5 real. Se aclara en el texto que en el equipo real esto implica
una tarjeta física instalada y parametrizada, no solo un toggle de
software.

**Tareas:**
1. Con el drive detenido, poner "Modo de control" en Lazo cerrado sin
   marcar "encoder conectado" (bandera nueva), arrancar → debe disparar
   F43.
2. Resetear, marcar "encoder conectado" = true, repetir arranque → debe
   completar sin falla.
3. (Opcional, refuerza la nota del manual) Intentar cambiar el modo de
   control mientras el drive está en `'run'` → debe rechazarse/no
   tener efecto, con un mensaje transitorio explicando por qué (reutiliza
   el mecanismo `engine.mensaje` que ya existe para "Control de panel NO
   ACTIVO").

## Cambios al motor de simulación (`NXEngine`)

Dos banderas booleanas nuevas y dos parámetros nuevos, con lógica de
arranque/identificación extendida. Estos NO pertenecen a G2.1
Aplicación Básica — se documentan en el código con su fuente real
(Multipropósito/Estándar, grupo G2.6) igual que ya se documentan las
simplificaciones existentes (ej. el comentario sobre P2.12 en `NXData`).

- `engine.motorAcoplado` (boolean, default `false`)
- `engine.encoderConectado` (boolean, default `false`)
- Nuevo parámetro `identificacion` (enum: 0 Sin acción, 1 Identificación
  sin marcha, 2 Identificación con marcha) — reutiliza el mismo patrón
  `tipo:'enum'` de `NXData.paramsG21`, pero vive en una colección nueva
  (no se agrega a `paramsG21` para no romper la aserción
  `paramsG21.length === 20` de la Tarea 2 original ni la fidelidad de
  "estos 20 son los reales de Básica").
- Nuevo parámetro `modoControl` (enum: 0 Lazo abierto, 1 Lazo cerrado),
  misma colección nueva.
- `NXEngine.prototype.correrIdentificacion()`: si `identificacion===2`
  y `motorAcoplado===true` → `_dispararFalla(57)`; si
  `identificacion===2` y `motorAcoplado===false` → éxito (nuevo flag
  `identificacionCompleta=true`, sin fallas); si `identificacion===1` →
  siempre éxito, sin importar `motorAcoplado`.
- Extensión de `press('start')`: si `modoControl===1` (lazo cerrado) y
  `encoderConectado===false` → `_dispararFalla(43)` en vez de arrancar
  normalmente.
- Bloqueo de cambio de `modoControl` mientras `estadoDrive==='run'`
  (mismo mecanismo `engine.mensaje` transitorio ya existente).

## Estructura de `NXModules`

Reemplaza `const NXTasks = [...]` (línea 803 actual) por:

```js
const NXModules = [
  { id:'puestaEnMarcha', nombre:'Puesta en marcha', teoria:[...], tareas:[...] },
  { id:'identificacion', nombre:'Identificación de motor', teoria:[...], tareas:[...] },
  { id:'rampas', nombre:'Rampas y protecciones', teoria:[...], tareas:[...] },
  { id:'panel', nombre:'Control desde el panel', teoria:[...], tareas:[...] },
  { id:'fallas', nombre:'Diagnóstico de fallas', teoria:[...], tareas:[...] },
  { id:'encoder', nombre:'Lazo abierto/cerrado', teoria:[...], tareas:[...] }
];
```

**Sin gating:** todos los módulos accesibles siempre, vía un selector de
pestañas sobre `#panel-tasks` (ya existe ese contenedor desde la Tarea
7/8). Progreso por módulo (índice de tarea actual dentro de CADA
módulo, no uno global) — se guarda en `localStorage` bajo la misma
clave `vfd_progress_vacon-nx-simulador`, con este formato exacto:

```js
{
  porModulo: { puestaEnMarcha: 2, identificacion: 0, rampas: 5, panel: 3, fallas: 1, encoder: 0 },
  done: 11,   // suma de porModulo — mismo campo que el portal ya lee hoy
  total: 20   // suma de tareas de los 6 módulos — mismo campo que el portal ya lee hoy
}
```

El portal solo lee `done`/`total` (no le importa `porModulo`), así que
el contrato externo con el resto del sitio no cambia — `porModulo` es
información nueva que solo usa esta página para recordar en qué tarea
de cada módulo se quedó el alumno al volver a entrar.

Un módulo completado NO se bloquea ni se oculta — se puede revisitar,
igual que los quizzes de las otras capacitaciones se pueden repasar.

## Pruebas

Mismo patrón `?test=1`. Se agregan asserts para: `correrIdentificacion()`
con motor acoplado/desacoplado, el chequeo de `press('start')` con
`modoControl`/`encoderConectado`, el bloqueo de cambio de `modoControl`
en marcha, y una verificación por cada nueva tarea evaluada. Total
estimado: +12 a +15 asserts sobre los 41 actuales.

## No objetivos (YAGNI)

- No se modela el resto de Multipropósito (grupos G2.2 señales de
  entrada, G2.3 salidas, G2.7 protecciones configurables, G2.8
  rearranque automático) — solo los 2 parámetros puntuales que estos
  módulos necesitan (`identificacion`, `modoControl`), tomados de G2.6.
- No se modela el timer real de 20 segundos para dar la orden de
  marcha tras fijar "Identificación" (detalle real pero opcional,
  mencionado por `ing-vdf` — se documenta en la teoría del módulo como
  dato informativo, sin exigirlo en la verificación de la tarea).
- No se agregan más sub-causas de F43 (canal A/B faltante) — solo la
  sub-causa 5 (tarjeta ausente), la más simple de simular con una
  bandera.
