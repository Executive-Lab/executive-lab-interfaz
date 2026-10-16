---
type: ftd
title: En una carpeta de alguien, lo que no se hace solo se ofrece con su botón
date: 2026-10-17
status: hecho
---

# En una carpeta de alguien, lo que no se hace solo se ofrece con su botón

## Intent

La 157 pone sola, en las carpetas que montó la barra, el español y el `ask` de Claude y arregla el modelo
retirado de Codex; la 161 dejó apuntado un botón para encender lo que una barra de antes apagó en carpetas
de alguien. En una carpeta de alguien (no montada por la barra en este ordenador) no se hace nada solo (P4),
y la persona no tenía manera de pedirlo. Decisión 177.

## Decisión

- Tres piezas en «Qué falta por montar», solo en una carpeta de alguien, cada una con su botón y su
  «Ahora no». Un clic es el sí (P9).
  - **Volver a encenderlo**: borra solo las marcas `.rsc/.no-audit`, `.no-worktree-cleanup` y `.no-gitmoji`
    cuyo texto es, entero, el que escribe `aplicar.js`. RSC no tiene orden para esto: dice «borra el fichero».
    Las vacías, las de RSC, las de otro texto y los enlaces son de la persona o su equipo.
  - **Que Claude me hable en español y pregunte antes de subir**: `ponerLosDeLaBarra(conSuSi)`, las mismas
    guardas, constancia y «Quitarlo» de la 157; sin los avisos de la 162; fuera de git en `.git/info/exclude`.
  - **Arreglar el modelo de Codex**: `retirados.arreglar(soloLaCarpeta)`, con copia y las mismas guardas.
- Lo rechazado no vuelve a ofrecerse en esa carpeta (estado del editor, por carpeta).
- Sin clic, nada: abrir, repintar y reponer los raíles no escriben en una carpeta de alguien.

## Scope

**Dentro**
- `extension/src/de-alguien.js` (nuevo): qué se ofrece, qué marcas son de la barra, lo rechazado, y los dos
  botones que llaman a lo de la 157.
- `ajustes-locales.js` (`conSuSi`, `soloMirar`) y `retirados.js` (`soloLaCarpeta`, `soloMirar`).
- `terreno.js` (las piezas), `panel.js` («Ahora no» en la pieza), `extension.js` (cuatro acciones) y
  `arrancar.js` (exporta el git de la barra).
- `docs/diccionario.md`: la fila de los textos.

**Fuera**
- Tocar el `.rsc.json` de la persona.
- El aviso del sistema (162) y el del Codex (171) en una carpeta de alguien.
- `.no-scope-check`, que es de esta máquina.

## Checklist

- [x] 1. Mirado en el paquete cómo se vuelve a armar un guardián: borrando la marca; sin subcomando.
- [x] 2. Cómo se sabe cuáles puso la barra: por su texto, que solo escribe `aplicar.js` (`CALLAR`).
- [x] 3. `ponerLosDeLaBarra` y `retirados.arreglar` con su parámetro de «con su sí», sin duplicar la lógica.
- [x] 4. Las tres piezas, su «Ahora no» y las cuatro acciones.
- [x] 5. Textos en `docs/diccionario.md`.
- [x] 6. Pruebas en `humo.js` y mutaciones a mano.
- [x] 7. Decisión 177 y este documento.

## Evidence

- Tres pruebas nuevas en `humo.js`: las marcas, lo de Claude y lo de Codex, cada una con carpetas de mentira de
  la barra y de alguien, sin clic y con él, las guardas de la 157 y «Ahora no».
- Diez mutaciones a mano, las diez tumbadas (lista en la decisión).
- El `sync` del paquete, sobre una carpeta de mentira con `optOuts` declarados y una marca borrada: «nothing
  to sync», y el `.rsc.json` no cambia. Por eso la decisión no promete que «Lo que tiene apagado» se ponga al
  día solo.

## Next

- Que «Lo que tiene apagado» no nombre lo que se acaba de encender mientras el `.rsc.json` no se reescriba.
- Probar con una persona, en una carpeta de verdad de alguien, los tres botones.
- Ofrecer también el aviso del sistema (162) con su botón.
