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
- [x] 5. Sin `.rsc/`, los raíles no la crean. Reproducido con el `sync` del paquete: antes se perdía lo declarado.
- [x] 6. Pruebas en `humo.js` (cuatro nuevas y dos del montaje de verdad) y mutaciones a mano.
- [x] 7. Decisión 161 y este documento.

## Evidence

- `humo.js --con-arnes`, con main traído (la 0.53.0): 433 comprobaciones, 425 sin `--con-arnes`. Las cuatro nuevas: «los raíles apagan
  lo del equipo solo en lo nuestro, y lo de esta máquina en todas», «en una carpeta de alguien, lo que su
  .rsc.json declara y lo que puso una barra de antes se queda», «los raíles no crean .rsc/…» y «al montar
  encima de lo de alguien, con su sí, los raíles no deciden por su equipo». Las tres primeras corren el `sync`
  del paquete, con una casa de mentira. Y dos montajes de verdad lo miran: el de una carpeta vacía (las cuatro
  marcas) y el de un proyecto de alguien (solo `.no-scope-check`, y nada en su `.rsc.json`).
- Mutaciones a mano: 13, las 13 tumbadas.
  - En `aplicar.js`: ignorar `--ajena`; ignorar `--historial-ajeno`; poner lo del equipo también en lo suyo;
    no poner ni lo de esta máquina; `scope-check` del equipo; `gitmoji` de esta máquina; crear `.rsc/` antes
    que RSC; sin `.rsc/`, no poner nada; quitar lo de antes en lo suyo.
  - En `arrancar.js`: no pasar `--historial-ajeno`; pasarlo solo con `--ajena`; al revés; siempre.
  - «No pasarlo» y «al revés», corridas además con `--con-arnes`: caen también en los montajes de verdad.
- Antes de arreglarlo, reproducido con el paquete: raíles y luego `sync` en una carpeta sin `.rsc/` dejaban
  `.rsc.json` sin `knowledge-sync`, `trunk-guard` ni `auto-update`.
- `contrato.js` (15), `empresas-distintas.js`, `mapeos-codex.js` (29), `comprobar-diccionario.js` y
  `revisar-powershell.js`, en verde.

## Next

- Ver en una carpeta de verdad de un equipo que, al abrirla con la barra, su `.rsc.json` no cambia.
- El botón para encender lo que apagó una barra de antes, en «Lo que tiene apagado».
- «Revisar y arreglar» con los raíles detrás.
