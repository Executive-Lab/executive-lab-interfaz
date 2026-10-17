---
type: ftd
title: Las cuentas, sin rodeos
date: 2026-10-17
author: Jose Sanchis
branch: las-cuentas-sin-rodeos
status: hecho
---

# Las cuentas, sin rodeos

## Intent

Que entre montar la carpeta y estar dentro de la cuenta del asistente y de GitHub no haya rodeos: el primer
mensaje no cae en una pantalla de acceso, y quien dice «Sí, ahora» a GitHub no se queda a medio camino.
Decisión 186.

## Decisión

- El punto 1 de la auditoría (la tarjeta que nunca salía) ya lo había arreglado la 164; no se tocó.
- Nuevo `src/sesion-del-asistente.js`: `si`, `no` o `null`. Codex por `auth.json` (sin leerlo) y Claude por
  `claude auth status`. Sin saberlo, todo como antes.
- Sin sesión, el primer mensaje del montaje espera y la tarjeta Empieza por aquí lleva «Ya he entrado».
- «Sí, ahora» sigue sola hasta subir la copia al volver del acceso del editor.

## Scope

**Dentro**
- `sesion-del-asistente.js`, `brujula.js`, `extension.js`, `panel.js`, el diccionario y la 186.

**Fuera**
- Mandar el encargo solo cuando la barra ve la sesión (hay botón); guardar el encargo entre recargas.

## Checklist

- [x] Comprobar el punto 1 contra main (ya hecho por la 164)
- [x] Doc oficial de Claude y de Codex
- [x] Módulo de sesión y pruebas
- [x] Primer mensaje aplazado y tarjeta
- [x] «Sí, ahora» hasta subir
- [x] Diccionario y decisión
- [x] Mutaciones y batería entera
- [x] La revisión de la PR #84: soltar lo aplazado al volver a montar, sí atado a la carpeta, sí gastado en el primer acceso, encargo repuesto si el puente falla

## Evidence

Tres pruebas nuevas en `humo.js`, mutaciones puestas y restauradas desde copia.

La revisión añadió cinco mutaciones más (viejo sin soltar, sin atar a la carpeta, sí sin gastar, otra pantalla sin soltarlo, encargo perdido), todas caen.

## Next

Si se ve útil, recordar el encargo aplazado entre recargas y mandarlo solo al ver la sesión.
