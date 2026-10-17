---
type: ftd
title: El primer día, con menos preguntas
date: 2026-10-17
author: Jose Sanchis
branch: menos-preguntas
status: hecho
---

# El primer día, con menos preguntas

## Intent

Que quien elige una carpeta y pulsa «Preparar esta carpeta» conteste solo lo que RSC necesita para su plan, y que
elegir una carpeta nueva ya sea empezar. Preparar hacía de 7 a 11 preguntas seguidas. Decisión 184.

## Decisión

- Se quitan `alcance`, `personas` y `nivel` del cuadro: ninguna va a RSC, y las tres tienen otro sitio (el primer
  mensaje, «Cómo te habla»). Quedan de 5 a 8.
- El nombre viene rellenado con el de la carpeta, limpio.
- Elegir una carpeta nueva o vacía desde la barra empieza a prepararla sola (apunte en el almacén del editor, que
  sobrevive a recargar la ventana; vale cinco minutos).
- Sin carpeta, «Crear una carpeta nueva».
- «Carpeta» y no «proyecto» ni «espacio»; la primera fila del diccionario se corrige.

## Scope

**Dentro**
- `rumbo.js`, `arrancar.js`, `extension.js`, `brujula.js`, `terreno.js` y `panel.js` (textos y el botón nuevo).
- `diccionario.md` y las pruebas de `humo.js`, `empresas-distintas.js`.
- La decisión 184.

**Fuera**
- Lo que pasa después de montar (el guardado solo, el asistente que falta, la vista sencilla y el primer mensaje):
  es de la 181.
- Quitar empresa y web: no hay otro sitio donde ponerlas luego.
- Los textos para el asistente y «proyecto» como categoría que alguien lleva.

## Checklist

- [x] Comprobar cada punto en el código y en las decisiones 116 y 117
- [x] Quitar las tres preguntas y respetar lo que un perfil ya traía
- [x] Nombre rellenado con el de la carpeta
- [x] Empezar sola al elegir una carpeta nueva, solo en ese caso
- [x] «Crear una carpeta nueva» sin carpeta
- [x] Una palabra para la carpeta, en pantalla y en el diccionario
- [x] Pruebas y ocho mutaciones
- [x] Batería entera

## Evidence

Ver la decisión 184: la cuenta sale de 7–11 a 5–8 y coincide con la entrevista de verdad; las ocho mutaciones caen y
el original se restauró desde copia.

## Next

Si una clase real pide fijar nivel, alcance o personas al empezar, se vuelven a poner como una pregunta del
asistente, no del cuadro.
