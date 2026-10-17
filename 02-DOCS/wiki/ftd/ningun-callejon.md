---
type: ftd
title: Ningún mensaje sin salida
date: 2026-10-17
author: Jose Sanchis
branch: ningun-callejon
status: hecho
---

# Ningún mensaje sin salida

## Intent

Que cada mensaje que diga que algo falla, o que hay que hacer algo, lleve su botón para hacerlo, o «Algo va
mal», que reúne el informe para el tutor. Decisión 183.

## Decisión

- Los avisos del editor que mandaban a «Algo va mal» pasan por `avisarConSalida` y llevan el botón.
- `pintarElFallo` dice una frase en español con «Algo va mal» y «Volver»; el motivo técnico va al informe.
- `soporte.arreglar` manda a «Algo va mal».
- Todo aviso malo que mande «al asistente» lleva «Que lo mire el asistente» (encargo limpio, por `pedir`).
- Subir sin internet se separa del fallo de cuenta, con «Volver a intentarlo».
- «¿No tienes cuenta?» lleva «Crear mi cuenta de GitHub».
- «(inbox)», «(out)», «(tools)» y «(skills)» se quedan: son del diccionario.

## Scope

**Dentro**
- `src/salida-del-aviso.js` (nuevo), `src/arrancar.js`, `src/extension.js`, `src/soporte.js`, `src/guardar.js`.
- `media/panel.js`: `bloqueAviso`, `sinNombreQueValga`, `pintarElFallo`, la cara y la copia fuera de casa.
- Ocho comprobaciones en `prueba/humo.js`, el diccionario y la decisión 183.

**Fuera**
- Reescribir cada texto de `conexiones.js`: el botón sale del aviso, no del texto.
- Quitar el inglés de los rótulos del diccionario.

## Checklist

- [x] Comprobar cada callejón contra main
- [x] Avisos del editor con «Algo va mal»
- [x] `pintarElFallo`, `soporte.arreglar`
- [x] «Que lo mire el asistente»
- [x] Subir sin red, y crear la cuenta
- [x] Pruebas y siete mutaciones
- [x] Diccionario y decisión 183

## Evidence

`humo.js` 497 a 505 (514 con `--con-arnes`); siete mutaciones, todas caídas. Detalle en la decisión 183.

## Next

Nada pendiente.
