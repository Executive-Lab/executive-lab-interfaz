---
type: ftd
title: Todo lo de RSC tiene nombre, también los automatismos
date: 2026-10-16
author: Jose Sanchis
branch: todo-rsc-con-nombre
status: hecho
---

# Todo lo de RSC tiene nombre, también los automatismos

## Intent

Que un enganche, un interruptor o un comando nuevo de una versión futura de RSC no salga sin nombre sin que
nadie se entere. Hasta ahora la tabla (`extension/media/nombres.json`) no se comparaba con el paquete, y la
prueba de comandos miraba 20 de los 53 del manifiesto. Decisión 169.

## Decisión

- Se repasó cada `targets/*.mjs` y cada interruptor de `opt-outs.js` de RSC 3.0.22: lo que se enseña ya tenía
  nombre; el resto (10 ficheros) es fontanería y consta en `noSeEnsena`, con su porqué.
- Una prueba nueva en `humo.js` lee el paquete y cae si algo no está nombrado ni en `noSeEnsena`.
- La prueba de comandos exige que los 53 del manifiesto casen con la tabla o con un patrón.

## Scope

**Dentro**
- `noSeEnsena` y su explicación en `extension/media/nombres.json`.
- Dos cambios en `extension/prueba/humo.js`.
- La decisión 169.

**Fuera**
- Nombres nuevos en pantalla: no hicieron falta, así que el diccionario no cambia.
- `reglas.js` y `nombres.js`: sin tocar.

## Checklist

- [x] Repasar la cabecera de cada enganche y cada interruptor
- [x] `noSeEnsena` con su porqué
- [x] Prueba de enganches e interruptores
- [x] Prueba de los 53 comandos
- [x] Mutaciones: tabla sin `branch-guard`, `.mjs` falso, comando de más en el manifiesto
- [x] Batería entera

## Evidence

Las tres mutaciones sobre el paquete y la tabla tumban la prueba; el original se restauró desde una copia.

## Next

Nada pendiente.
