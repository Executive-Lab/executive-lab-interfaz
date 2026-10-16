---
type: ftd
title: Los raíles solo apagan en lo nuestro
date: 2026-10-16
status: hecho
---

# Los raíles solo apagan en lo nuestro

## Intent

Lo encontró la revisión de la 157: los raíles ponían `.rsc/.no-audit`, `.no-worktree-cleanup` y `.no-gitmoji`
en todas las carpetas, y RSC los apunta en su `.rsc.json` como `optOuts`, que viaja en git. En una carpeta de
alguien era decidir por su equipo (P4). Decisión 161.

## Decisión

- Lo que RSC tiene por decisión del equipo (`audit`, `gitmoji`, `worktree-cleanup`), solo en las carpetas cuyo
  historial creó la barra, como la rama principal abierta de la 145. En la de alguien vale su `.rsc.json`.
- El sí a montar encima no cuenta: es a tocar sus ficheros. `ponerLosRailes` mira el historial aparte y pasa
  `--historial-ajeno`; `--ajena` lo dice también.
- Lo de esta máquina (`scope-check`), en todas: no viaja ni se apunta.
- Ninguna hace falta para que la barra funcione. Lo que ya está no se quita: no se pierde nada.
- Los raíles ya no crean `.rsc/`: si la crean antes que RSC, RSC pierde lo que el equipo declaró.

## Scope

**Dentro**
- `aplicar.js`, en sus dos copias (`skills/` y `extension/media/railes/`): `CALLAR` con de quién es cada marca,
  `--historial-ajeno`, y nada si no está `.rsc/`.
- `arrancar.js` (`ponerLosRailes`): el historial, mirado para todos los caminos.
- Comentarios de `decidir.js` y `reglas.js`.

**Fuera**
- `.no-knowledge-sync` y `.no-auto-update` (decisión 145): siguen en todas las carpetas, por P9.
- Un botón para encender lo que apagó una barra de antes en una carpeta de alguien.
- Que «Revisar y arreglar» ponga los raíles detrás, como el montaje.

## Checklist

- [x] 1. Mirado en el paquete qué hace cada marca, de quién es (`targets/opt-outs.js`) y si la barra la
  necesita: ninguna.
- [x] 2. `CALLAR` separa lo del equipo de lo de esta máquina; con `--historial-ajeno` o `--ajena`, solo lo segundo.
- [x] 3. `ponerLosRailes` pasa `--historial-ajeno` cuando el historial no es de la barra, también con su sí.
- [x] 4. Lo que ya está no se toca, y su `.rsc.json` tampoco.
- [x] 5. Sin `.rsc/`, los raíles no la crean; reproducido con el `sync` del paquete que antes se perdía lo declarado.
- [x] 6. Pruebas en `humo.js` (cuatro nuevas y dos del montaje de verdad) y mutaciones a mano.
- [x] 7. Decisión 161 y este documento.

## Evidence

- Pendiente de la última pasada.

## Next

- Ver en una carpeta de verdad de un equipo que, al abrirla con la barra, su `.rsc.json` no cambia.
- El botón para encender lo que apagó una barra de antes, en «Lo que tiene apagado».
- «Revisar y arreglar» con los raíles detrás.
