---
type: ftd
title: La guía para sacar la clave, en PDF
date: 2026-10-16
author: Jose Sanchis
branch: la-guia-de-cada-clave
status: hecho
---

# La guía para sacar la clave, en PDF

## Intent

Jose: *«tiene que quedar claro la guía de cómo sacar la API key para cada conexión. Lo ideal es que te dé un
PDF o alguna guía muy bien establecida de cómo sacarla y dónde meterla»*. Es lo que más cuesta en clase.
Decisión 159, sobre las pantallas de la 156 (clases de acceso y «Pídeselo a tu informático»).

## Decisión

- **«La guía, en PDF»**, en la pantalla de cada conexión. La barra escribe `Guía para sacar la clave de
  <Herramienta>.pdf` en `01-TOOLS/<herramienta>/out/`, la abre y lo dice en una frase. Sin instalar nada ni
  salir a internet. La segunda lleva «(2)».
- **Sin pasos, «Que el asistente prepare la guía»** en lugar del botón (P1): le pide los pasos de la
  documentación oficial, con su página y su fecha.
- **Lo que lleva**: el título; Antes de empezar; Los pasos (con la página como enlace); Qué dato es cada
  cosa; Dónde ponerla (según la clase de acceso); Si no puedes sacarla tú; Por seguridad; De dónde sale. Las
  tres primeras salen del disco, y el PDF dice que las preparó el asistente.
- **Ningún valor**: todo lo del disco pasa por el tapado del mensaje del informático.
- **Sin seguir enlaces**, ni al escribir ni al leer el README y CREDENTIALS.md.
- **`out/` y no otra carpeta**: es donde va lo que produce cada conexión, sale en Resultados (out) y la
  plantilla de RSC lo deja fuera de las copias. Se repite con un clic y no lleva claves (hay prueba).
- **El PDF, a mano**, en `extension/src/pdf.js`: PDF 1.4, Helvetica y Helvetica-Bold con WinAnsi, anchos de
  Adobe, varias páginas, enlaces `/URI` solo de https.
- **El raíl** (§2 a, las dos copias): pasos de la documentación oficial, con los nombres exactos, una línea
  `Antes de empezar: …` y una línea `Fuente: <dirección> · comprobado el <día>`. Y ningún paso sin comprobar.

## Scope

**Dentro**
- `pdf.js` y `guia.js`, nuevos.
- Los lectores en `conexiones.js`: lo de antes de empezar, la fuente y su fecha, preferir «Cómo conectarla»
  y no seguir enlaces.
- La parte de seguridad para quien saca la clave, en `informatico.js`.
- El botón y el aviso en el panel y en la extensión, y que el vigía no se coma el aviso.
- Las dos copias del raíl y «Conectar algo nuevo».
- Las pruebas, las mutaciones, la decisión 159 y el diccionario.

**Fuera**
- La guía de un paso cada vez (F4) se queda igual: solo deja de contar como pasos las dos líneas nuevas.
- Tapar las claves en los pasos que enseña la barra (ya era así; ver Next).
- Preguntar antes de abrir un enlace del PDF: lo abre el lector de PDF, no la barra.

## Checklist

- [x] 1. `pdf.js`: estructura, tabla `xref`, WinAnsi, anchos, partir, páginas, pie, enlaces — 20 mutaciones,
  las 20 tumbadas.
- [x] 2. `guia.js` y los lectores: secciones, tapado, fuente y fecha, clases de acceso, sin pisar ni seguir
  enlaces, sin pasos — 20 mutaciones, las 20 tumbadas.
- [x] 3. Extensión y panel: el botón, el aviso que se queda y lo de sin pasos — 7 mutaciones, las 7 tumbadas.
- [x] 4. La seguridad para quien la saca y el raíl en las dos copias — 4 mutaciones, las 4 tumbadas.
- [x] 5. Diccionario, decisión 159 y todas las comprobaciones en verde.

## Evidence

- `node extension/prueba/humo.js`: 403 comprobaciones (eran 401). Las dos nuevas:
  - «el PDF a mano: tabla de saltos exacta, acentos en WinAnsi, líneas por su ancho, varias páginas, títulos
    no huérfanos y enlaces solo https»;
  - «la guía para sacar la clave, en PDF: cada sección del disco o de la barra, ningún valor de clave, no pisa
    ni sigue enlaces, y sin pasos se le pide al asistente».
- `mapeos-codex.js`, `contrato.js` (14), `empresas-distintas.js` y `comprobar-diccionario.js`, en verde.
- Mutaciones: 51, las 51 tumbadas. Una sobrevivió a la primera pasada (la fuente como punto de la lista) y se
  cerró con su prueba.
- El PDF de las pruebas, leído en una carpeta temporal con lo que ya había en el Mac y sin red:
  - poppler (`pdftotext`, `pdfinfo`, `pdffonts`), `mutool clean` y Ghostscript, sin un aviso;
  - `pypdf` estricto: título, páginas y los dos enlaces;
  - el PDFKit del sistema lee el texto con sus acentos, y Vista Rápida lo pinta con sus negritas;
  - las 256 posiciones de las dos tablas de anchos son las de los AFM de Adobe que trae `reportlab`.

## Next

- Verlo en un VS Code de verdad, en Mac y en Windows: el botón, el PDF abierto con el programa de siempre y
  el nombre con tilde.
- Tapar también las claves en los pasos que enseña la barra, si el asistente pegó una en el README.
- Decidir si sobran «Explícame cómo conectarla» o «Que el asistente prepare la guía» cuando no hay pasos.
