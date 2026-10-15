---
type: ftd
title: El ajuste del asistente — Claude, Codex o los dos, en los ajustes del editor
date: 2026-10-15
status: hecho
---

# El ajuste del asistente

## Intent

Jose, 15-10-2026: *«¿meterías en ajustes si se usa Claude Code, Codex o ambas en la extensión?»*. Hoy
el asistente se pregunta al preparar cada carpeta si están los dos, y se elige carpeta a carpeta en «Tu
asistente». Falta decirlo una vez para todas.

## Decisión

Decisión 158 en [`docs/decisiones.md`](../../../docs/decisiones.md). Un solo ajuste,
`executiveLab.asistente`, para todo el editor:

- `automatico` (de fábrica): como hasta ahora;
- `claude` o `codex`: se prepara para ese sin preguntar, se ofrece ponerlo si falta, y manda en una
  carpeta montada para los dos;
- `losDos`: se prepara para los dos, y una carpeta montada para uno se prepara sola para el otro (P9).

Lo elegido en «Tu asistente» para una carpeta manda en ella.

## Scope

**Dentro**
- El ajuste en `extension/package.json`, con rótulo y frase por valor.
- `asistentes.js`: `elAjuste`, `conQuien` con el ajuste detrás de lo elegido en la carpeta, `seguirCon`.
- `arrancar.js`: `preguntarAsistente` con el ajuste, ofrecer el que falta, `--target claude,codex`,
  `prepararTambienPara` sin nadie delante.
- `extension.js`: preparar para los dos al abrir y al cambiar el ajuste, con las guardas de P9; lo suyo a
  un clic; el cambio en caliente; abrir el ajuste.
- `panel.js`: la línea del ajuste en «Tu asistente» y «Cambiar el ajuste».
- El diccionario, el comprobador (`enumItemLabels`) y las pruebas.

**Fuera**
- Pantalla nueva en la barra sencilla: basta el ajuste del editor.
- Preparar sola una carpeta con `claude` o `codex` en el ajuste: solo «Los dos» pide tener los dos.
- Publicar la versión.

## Checklist

- [x] 1. El ajuste, con sus cuatro valores, automático de fábrica y para todo el editor — prueba del manifiesto
  y de `elAjuste`, que no se traga un valor que no es de la lista.
- [x] 2. Al montar, cada valor — automático pregunta con los dos; Claude, Codex y los dos, sin preguntar; la
  entrevista entera tampoco lo pregunta.
- [x] 3. Sin el que pide el ajuste — ponerlo, seguir con el que hay, cerrar, los dos con uno, ninguno, y sin
  poder ponerlo.
- [x] 4. En una carpeta montada — el del ajuste habla si está montada y puesto; lo elegido en la carpeta manda.
- [x] 5. Con los dos, en una carpeta montada para uno — guardas de P9, ofrecer ponerlo una vez, prepararla y
  decirlo, los botones siguen con el de antes, lo suyo a un clic y, si falla, dicho.
- [x] 6. En caliente — la principal y «Tu asistente» se repintan, el vigía cambia, otro ajuste no hace nada, y
  con los dos se prepara.
- [x] 7. «Tu asistente» dice el ajuste y lo abre.
- [x] 8. Codex en una carpeta de los dos: mira e invoca lo de Codex (`mapeos-codex.js`).
- [x] 9. RSC monta para los dos con el ajuste (`contrato.js`, el paquete de verdad).
- [x] 10. Mutaciones a mano — 45, cada una en una copia del árbol; las 45 tumbadas, y la copia sin mutar, en verde.
- [x] 11. Las cinco comprobaciones en verde, después de traer `origin/main`.

## Evidence

Observado el 15-10-2026 en la rama `el-ajuste-del-asistente`.

- `humo.js`: {HUMO} comprobaciones pasadas. Las siete nuevas:
  «el ajuste del asistente: cuatro valores, automático de fábrica y para todo el editor» ·
  «al montar, el ajuste dice para cuál, sin preguntar» ·
  «al montar, sin el que pide el ajuste se ofrece ponerlo, o seguir con el que hay» ·
  «con el ajuste, en una carpeta montada para los dos se habla con ese; lo elegido en la carpeta manda» ·
  ««Tu asistente» dice el ajuste en una línea, con un botón que lo abre» ·
  «cambiar el ajuste con la barra abierta se nota sin recargar» ·
  «con «Los dos», una carpeta montada para uno se prepara sola para el otro, con las guardas, y lo dice».
  Y la del diccionario siembra un `enumItemLabels` con una palabra prohibida.
- `mapeos-codex.js`: {MAPEOS} pasadas, con «con el ajuste en Codex, una carpeta montada para los dos mira e
  invoca lo de Codex».
- `contrato.js`: {CONTRATO} pasadas. «con el ajuste de los dos asistentes, el arranque no pregunta y RSC monta
  para los dos — montado para claude y codex», con la 3.0.22 de dentro.
- `empresas-distintas.js`: {EMPRESAS}. `comprobar-diccionario.js`: «Todo el texto de pantalla respeta el
  diccionario».
- Mutaciones: 45, en copias del árbol, cuatro a la vez. Cada una tumbada por la comprobación que le toca:
  el ajuste sin validar, el orden de `conQuien`, el ajuste sin mirar si está montada, `comoEstamos` sin
  ajuste, `seguirCon` sin guardar; `preguntarAsistente` sin ajuste, los dos como uno, sin «Seguir con»,
  sin poner, el fallo al poner tragado, `sinNadieDelante` ignorado, el mensaje de los dos; cada guarda de
  P9 quitada, la oferta repetida o sin poner, lo suyo preguntado sin nadie delante o sin su botón, los
  botones que cambian de asistente, la frase sin decir, el botón sin su sitio entre los del arnés, sin
  oyente, sin filtro, sin repintar «Tu asistente», sin rearmar el vigía, sin volver a ofrecer, sin
  preparar al cambiar, la activación sin llamarlo, el ajuste abierto sin su nombre, sin mirar si está
  puesto, la línea de la pantalla, el valor de fábrica, el ámbito, el comprobador sin `enumItemLabels` y
  el fallo callado.

## Next

- Probarlo en el editor de verdad con los dos asistentes puestos: el ajuste, la lista con sus rótulos y el
  aviso de «Los dos» al abrir una carpeta de Codex.
- Publicar la versión sigue siendo decisión de Jose (`/publicar-una-version`).
