# VFD Academy — Centro de Capacitación

Portal de capacitaciones técnicas interactivas, publicado como sitio estático. Sin build step, sin backend: cada página es HTML/CSS/JS autocontenido.

🔗 **Sitio publicado:** https://capacitaciones-vdf.vercel.app/ (también espejado en GitHub Pages: https://brayanzent.github.io/Capacitacion-Industrial-Technology/)

## Estructura del proyecto

```
/index.html                              ← portal (landing) con el catálogo de capacitaciones
/support.js                              ← runtime del portal (carga React desde CDN al vuelo)
/assets/
  └── logo-industrial-technology.png     ← logo de un cliente B2B de ejemplo (no se usa en el sitio propio, reservado para un tenant de marca blanca)
/capacitaciones/
  └── vacon-nxp/
      ├── index.html                     ← capacitación VACON NXP (12 módulos, quiz, flashcards)
      └── imagenes/                      ← figuras extraídas de los manuales, citadas por módulo
/fuentes/                                ← manuales y PDF originales (NO se publica, uso interno)
  ├── vacon/
  └── abb/
/notas-internas/                         ← notas y personas de trabajo (NO se publica)
/.claude/skills/capacitacion-vacon-style/  ← skill de Claude Code con el formato de diseño y contenido
```

## Cómo funciona

- **Portal (`/index.html`):** construido con una herramienta de diseño externa ("CLOUDE DESIGN", formato `.dc.html`), corre sobre un runtime React que `support.js` carga dinámicamente desde CDN. Muestra una tarjeta por capacitación con un anillo de progreso leído desde `localStorage`.
- **Cada capacitación (`/capacitaciones/<slug>/index.html`):** página independiente en HTML/CSS/JS vainilla (sin frameworks), con navegación libre entre módulos, pestañas Aprender/Quiz, flashcards, progreso persistente en `localStorage`, tema oscuro/claro y vista de impresión. El formato exacto está documentado en la skill `capacitacion-vacon-style`.
- **Progreso compartido:** cada capacitación guarda su detalle bajo su propia clave (`<slug>_training_progress_v1`) y además escribe un resumen `{done, total}` en `localStorage['vfd_progress_' + slug]` para que el portal pinte el anillo de progreso correcto.
- **Tema:** una sola clave compartida (`capacitacion-theme`) para que el modo oscuro/claro sea consistente entre el portal y todas las capacitaciones.

## Fidelidad de contenido

Todo el contenido técnico de cada capacitación proviene de manuales reales o capacitaciones internas ubicadas en `/fuentes/`. Los datos sin respaldo documental se marcan explícitamente como advertencia en la página en vez de inventarse. Ver la skill `capacitacion-vacon-style` para el detalle de esta disciplina.

## Agregar una nueva capacitación

Ver la sección "Estructura multi-capacitación (portal)" en `.claude/skills/capacitacion-vacon-style/SKILL.md` — resume los 7 pasos (carpeta, logo, tema, progreso, fuentes, entrada en el portal).

## Publicar cambios

El sitio se sirve directo desde la rama `master` vía GitHub Pages. Cualquier cambio en los archivos publicados (`index.html`, `support.js`, `assets/`, `capacitaciones/`) se refleja en el sitio en 1-2 minutos después de `git push`.
