---
type: ftd
title: La barra dice lo que de verdad ha pasado
date: 2026-10-16
author: Jose Sanchis
branch: decir-la-verdad
status: hecho
---

# La barra dice lo que de verdad ha pasado

## Intent

De la revisión de producto: cinco sitios donde la barra decía una cosa y pasaba otra, o se paraba sin
salida (P1, P3, P9). La decisión es la 166.

1. **Darle documentos** decía «Se lo paso», y el encargo se quedaba escrito sin enviar, o en el
   portapapeles con Codex. Con uno pedía «Léelos».
2. **Falta el asistente**: «Díselo a tu tutor» en cinco sitios, sin botón, y la barra ya sabía ponerlo.
3. **«Algo va mal»** en una carpeta sana decía «He mirado y está todo bien.» junto a «Arreglarlo ahora».
4. **«Barra 0.53.0»** abría Más ayuda, y no lo de la versión.
5. **Un encargo largo en Windows** iba al portapapeles: «Que las ordene» ocupa 2.212 caracteres y el enlace
   se corta sobre los 2.000.

## Decisión

- **1.** La barra dice lo que ha hecho («Documento añadido.») y, detrás, lo mismo que cualquier botón según
  cómo ha llegado el encargo. Se sigue mandando: el raíl solo actúa cuando le escriben. Lo mismo con el
  material de la marca, y un botón cualquiera sin asistente ya no copia nada.
- **2.** «Falta Claude en este ordenador…» con **Poner Claude** (o Codex) en las cinco salidas. Lo puesto se
  mira: si el editor no lo ve, a recargar.
- **3.** Lo que tocaría el arreglo se lee por sus líneas `[fix]` y `[ask]`, no por una palabra. Con todo
  sano, la salida principal es «Contárselo al asistente», con el informe; Executive Lab, pequeño, para lo de
  la barra.
- **4.** Abre «Esta barra»: la versión, Actualizar ahora, Probar las versiones nuevas antes y Más ayuda.
- **5.** Lo que no cabe se deja en `02-DOCS/raw/pedidos/encargo-….md`, tapado y fuera de git, y se manda una
  línea. En Mac y en Windows, con Claude y con Codex. Si no se puede, como antes.

El detalle y el porqué de cada uno, en `docs/decisiones.md`, 166.

## Scope

**Dentro**
- `extension.js`: `pedir`, `pasarleYDecir`, `sinAsistente`, `ponerElAsistente`, darle documentos y la
  marca, `resolverIncidencia` y el informe, Esta barra y la vuelta de sus ajustes, y el vigía.
- `asistentes.falta`, `brujula` (el botón de poner), `cerebro.queLePedimos`, `soporte.revisar`.
- `puente.cabeEntero` y `pedidos.dejarUnEncargo` (con `quedaFueraDeGit`, `carpetaParaEscribir`, la recogida
  y `laLinea`).
- `panel.js`: las dos tarjetas, Tu asistente, «Algo va mal», Esta barra y el botón de abajo.
- Los raíles: §6 en las dos copias de `SKILL.md`, y el comentario de `pedidos/` en las dos de
  `no-entra-en-git.js` (el bloque no cambia).
- Las pruebas, la decisión 166 y el diccionario.

**Fuera**
- El primer mensaje del montaje, que tampoco dice «Dale a enviar».
- «Tres cosas, entonces» en `SKILL.md`, que ya eran cinco antes de esto.
- Cambiar el bloque de lo que no entra en git: `pedidos/` ya estaba.

## Checklist

- [x] 1. Darle documentos: escrito, copiado o sin asistente, en singular con uno; la marca; `pedir` sin
  asistente.
- [x] 2. Poner el asistente en las cinco salidas, y mirarlo otra vez.
- [x] 3. «Algo va mal» por `[fix]`/`[ask]`, y «Contárselo al asistente» con el informe.
- [x] 4. «Barra x» abre Esta barra.
- [x] 5. El encargo largo, a un fichero, en los dos sistemas y con los dos asistentes; el raíl.
- [x] 6. Pruebas con mutaciones, decisión 166, diccionario y este documento.
- [x] 7. Todas las comprobaciones en verde, con origin/main traído.
- [x] 8. La revisión: el encargo que no llega se dice (`pasarleYDecir`), el doble clic de «Poner» y `quedaFueraDeGit`
  que pregunta a git. Tres pruebas y tres mutaciones tumbadas.

## Evidence

- `node extension/prueba/humo.js`: 426 comprobaciones (eran 421). Cinco nuevas, una por punto, con «(decisión
  166)» en el título. Tres de antes cambian lo que daban por bueno: «Se lo paso», «Díselo a tu tutor» y «Barra»
  a Ayuda.
- `node extension/prueba/mapeos-codex.js`: 30 (eran 29). La nueva: con Codex, el fichero y la línea en el
  portapapeles, en Mac y en Windows, y su «Poner Codex».
- `node extension/prueba/empresas-distintas.js`: las tres con una tarjeta y cinco cosas a la vista como
  mucho. Ahora pinta Esta barra (20 pantallas) y la principal sin el asistente: una tarjeta, con su botón
  dentro.
- `contrato.js` y `node docs/comprobar-diccionario.js`, en verde.
- Mutaciones a mano: 52, las 52 tumbadas. La lista, en la decisión 166. La única que sobrevivió a la primera
  pasada era equivalente: se quitó lo que sobraba en `soporte.js` y la mutación pasó a `rsc.queHayQueArreglar`.
- Para las mutaciones, `HUMO_SOLO='trozo|otro'` corre solo esas comprobaciones de `humo.js`. Así no vale como
  pasada: lo dice y sale con 1. Cada una corrió con la activación, las cinco nuevas y las tres que cambiaron,
  y la batería entera se pasó al final, sin mutar.
- Leído en el paquete del arnés (3.0.22, `scripts/rsc.js`): `repair --dry-run` dice «Nothing to repair — this
  harness is healthy.» o una línea `[fix]` o `[ask]` por cosa, y sale con 0 en los dos casos.

## Next

- Verlo en un VS Code de verdad: «Poner Claude» (cuánto tarda el editor en verlo), la línea del encargo en
  Windows, y que Claude y Codex lean por su nombre un fichero que el `.gitignore` deja fuera.
- El primer mensaje del montaje, con su «Dale a enviar».
- Si un asistente no se fía de un encargo en un fichero, la línea del raíl pasa a `siempre.md`.
