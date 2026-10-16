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
- [x] 12. La revisión adversaria (16-10-2026), arreglada con su prueba:
  - lo que apunta la barra va en su clave (`executiveLab.conQuienPorDefecto`), detrás del ajuste: cambiar
    el ajuste manda sobre él, y lo elegido en «Tu asistente», también;
  - después de esperar al arnés se mira todo otra vez, y dos a la vez son una sola preparación;
  - con los dos y uno que no se puede poner, se sigue con el que está, y se dice;
  - los cuatro mutantes que sobrevivían caen: el arnés libre a la segunda vuelta, la barra ocupada
    mientras corre el arnés, una carpeta sin nada declarado y la oferta en otra carpeta;
  - el contrato mira las habilidades con botón de los raíles en `.claude/skills` y en `.agents/skills`.
- [x] 13. Mutaciones otra vez, después de traer la 156 y la 157 — 57, las 57 tumbadas, y la copia sin mutar, en verde.

## Evidence

Primera vuelta, 15-10-2026, después de traer la 152: `humo.js` 404, `mapeos-codex.js` 15 de 15,
`contrato.js` 15, y 45 mutaciones tumbadas.

Después de la revisión, 16-10-2026, en la rama `el-ajuste-del-asistente`, con la 156 y la 157 traídas de
`origin/main`:

- `humo.js`: 415 comprobaciones pasadas. Las siete nuevas:
  «el ajuste del asistente: cuatro valores, automático de fábrica y para todo el editor» ·
  «al montar, el ajuste dice para cuál, sin preguntar» ·
  «al montar, sin el que pide el ajuste se ofrece ponerlo, o seguir con el que hay» ·
  «con el ajuste, en una carpeta montada para los dos se habla con ese; lo elegido en la carpeta manda» ·
  ««Tu asistente» dice el ajuste en una línea, con un botón que lo abre» ·
  «cambiar el ajuste con la barra abierta se nota sin recargar» ·
  «con «Los dos», una carpeta montada para uno se prepara sola para el otro, con las guardas, y lo dice».
  Y la del diccionario siembra un `enumItemLabels` con una palabra prohibida.
- `mapeos-codex.js`: 15 de 15 pasadas, con «con el ajuste en Codex, una carpeta montada para los dos mira e
  invoca lo de Codex».
- `contrato.js`: 15 comprobaciones pasadas. «con el ajuste de los dos asistentes, el arranque no pregunta
  y RSC monta para los dos — montado para claude y codex, con 3 habilidades con botón para cada uno», con
  la 3.0.22 de dentro.
- `empresas-distintas.js`: «las tres empresas, enteras». `comprobar-diccionario.js`: «Todo el texto de
  pantalla respeta el diccionario».
- Mutaciones: 57 (45 de la primera vuelta y 12 de la revisión), en copias del árbol, cuatro a la vez. Cada una tumbada por la comprobación que le toca:
  el ajuste sin validar, el orden de `conQuien`, el ajuste sin mirar si está montada, `comoEstamos` sin
  ajuste, `seguirCon` sin guardar; `preguntarAsistente` sin ajuste, los dos como uno, sin «Seguir con»,
  sin poner, el fallo al poner tragado, `sinNadieDelante` ignorado, el mensaje de los dos; cada guarda de
  P9 quitada, la oferta repetida o sin poner, lo suyo preguntado sin nadie delante o sin su botón, los
  botones que cambian de asistente, la frase sin decir, el botón sin su sitio entre los del arnés, sin
  oyente, sin filtro, sin repintar «Tu asistente», sin rearmar el vigía, sin volver a ofrecer, sin
  preparar al cambiar, la activación sin llamarlo, el ajuste abierto sin su nombre, sin mirar si está
  puesto, la línea de la pantalla, el valor de fábrica, el ámbito, el comprobador sin `enumItemLabels` y
  el fallo callado. Y de la revisión: sin el bucle de espera, sin la barra ocupada, sin mirar si hay algo
  declarado, la oferta sin su carpeta, dos preparaciones a la vez, sin mirar otra vez tras esperar, el
  apunte como elección, delante del ajuste o sin mirar, uno que falla tumba los dos, sin decirlo, y los
  botones de Codex en otra carpeta.

## Next

- Probarlo en el editor de verdad con los dos asistentes puestos: el ajuste, la lista con sus rótulos y el
  aviso de «Los dos» al abrir una carpeta de Codex.
- Publicar la versión sigue siendo decisión de Jose (`/publicar-una-version`).
