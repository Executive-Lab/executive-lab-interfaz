---
type: ftd
title: Recordar entre conversaciones, a un clic
date: 2026-10-17
author: Jose Sanchis
branch: la-memoria-a-un-clic
status: hecho
---

# Recordar entre conversaciones, a un clic

## Intent

La 172 puso tres interruptores de RSC en «Las reglas › Cómo trabaja el asistente». Falta la memoria entre
conversaciones. Un cuarto botón, con el mismo patrón, que llame a la orden oficial de RSC y diga lo que ha
pasado de verdad. Decisión 176.

## Decisión

- `memory on|off` existe en RSC 3.0.22: escribe `memory` en `.rsc.json` (git, decisión del equipo) y rehace los
  enganches de Claude (`.claude/settings.local.json`) y de Codex (`.codex/hooks.json`).
- Entrada «Recordar entre conversaciones»: Dejar de recordar / Recordar, con su línea (se acuerda de lo que
  hicisteis la última vez / empieza cada vez de cero) y la del equipo.
- Mismo manejador, mismas guardas y mismo «Hecho.» solo si `.rsc.json` ha quedado como toca. `memory` entra en
  `QUE_ESCRIBEN`.
- Sale con Claude o con Codex y donde RSC trae su pieza; sin pedir frenos. Con otro asistente, no.

## Scope

**Dentro**: `reglas.js`, `rsc.js`, pruebas en `humo.js` (con el RSC de verdad en `--con-arnes`), la decisión 176
y el diccionario.

**Fuera**: comprobar la confianza del enganche de Codex, borrar lo ya guardado, un confirmar aparte.

## Checklist

- [x] 1. Comprobar que `memory on|off` existe y qué escribe.
- [x] 2. Entrada, botones y texto.
- [x] 3. Por el mismo manejador, con `memory` entre las órdenes que escriben.
- [x] 4. Pruebas en `humo.js` y con el RSC de verdad.
- [x] 5. Mutaciones, batería entera y PR.

## Evidence

- `humo.js` 483 y con `--con-arnes` 491, sin fallos (la comprobación de los interruptores de la 172 se amplió, no
  se añadió otra; con el RSC de verdad, encender y apagar la memoria y mirar `.rsc.json` y el enganche de
  `.claude/settings.local.json`).
- `mapeos-codex.js`, `contrato.js` 15, `empresas-distintas.js`, `comprobar-diccionario.js` y
  `revisar-powershell.js` en verde.
- 11 mutaciones, 11 tumbadas.
