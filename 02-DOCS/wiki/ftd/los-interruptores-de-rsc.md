---
type: ftd
title: Los interruptores de RSC, a un clic
date: 2026-10-16
author: Jose Sanchis
branch: los-interruptores-de-rsc
status: in-progress
---

# Los interruptores de RSC, a un clic

## Intent

La barra deja puestas al montar tres marcas de RSC (`.no-trunk-guard`, `.no-worktree-isolation`,
`.no-knowledge-sync`) y «Las reglas» las enseña sin interruptor: cambiarlas solo se podía por chat. RSC 3.0.22
trae la orden oficial de cada una. Un botón por interruptor, que la llame, repinte y diga lo que ha pasado de
verdad. El clic de la persona es su sí (P9). Decisión 172.

## Decisión

- Existen las tres parejas en `scripts/rsc.js` de la 3.0.22: `main lock|unlock`, `isolation on|off` y
  `knowledge-sync on|off`. Las tres rehacen lo montado y apuntan la marca en `.rsc.json` (git): son del
  equipo, y la línea de cada botón lo dice.
- Botones: Abrir / Cerrar la rama principal · Apagar / Encender el trabajo aparte · Dejar de compartir /
  Compartir el conocimiento. En un apartado propio de «Las reglas», «Cómo trabaja el asistente»: el estado sale
  de las marcas, no de las filas de «Lo que se comprueba solo», que no existen en una carpeta sin código.
- `rsc.correr` con sus guardas, más confianza, carpeta montada y que no esté arreglando sola. El panel solo
  manda el nombre; la orden sale de una tabla.
- «Hecho.» solo si el disco ha cambiado; si RSC falla, con su salida; si dice que sí y no cambia, se dice.
- Solo con la 3 y con Claude (`trunk-policy.mjs`): con la 2 esas órdenes no existen, y con Codex no hay frenos.

## Scope

**Dentro**
- `reglas.js` (`INTERRUPTORES`, `BOTONES`, `losInterruptores`), `panel.js` (el apartado), `extension.js`
  (`cambiarInterruptor`).
- Una comprobación en `humo.js` y el paso con el RSC de verdad en `--con-arnes`.
- La decisión 172 y el diccionario.

**Fuera**
- Un confirmar aparte, y guardar el cambio en git.
- Los demás guardianes y automatismos: RSC no trae orden para ellos.

## Checklist

- [x] 1. Mirar qué trae RSC 3.0.22 y qué escribe cada orden.
- [x] 2. Botón por interruptor, con su línea y el aviso del equipo.
- [x] 3. Por `rsc.correr`, con confianza, carpeta montada y relevo; sin escribir marcas a mano.
- [x] 4. Decir lo que ha pasado: hecho, fallo con su salida, «sí» que no cambia.
- [x] 5. Pruebas en `humo.js` y con el RSC de verdad.
- [ ] 6. Mutaciones, batería entera y PR.

## Evidence

(Se rellena al cerrar.)

## Next

- Verlo con una persona delante en un VS Code de verdad: las tres líneas, y el desplegable abierto tras pulsar.
