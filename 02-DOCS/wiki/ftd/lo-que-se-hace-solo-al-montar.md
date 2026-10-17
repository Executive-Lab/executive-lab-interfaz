---
type: ftd
title: Lo que se puede hacer solo al montar, se hace solo
date: 2026-10-17
author: Jose Sanchis
branch: lo-que-se-hace-solo-al-montar
status: hecho
---

# Lo que se puede hacer solo al montar, se hace solo

## Intent

Aplicar la regla P9 al montaje: lo local, gratis y que se deshace lo hace la barra sola y lo dice en una frase
con su «Quitarlo»; solo se pregunta lo que sale del ordenador, no se deshace, cuesta dinero o decide su negocio.
Una auditoría señaló cuatro fugas. Decisión 181.

## Decisión

Se comprobó cada una antes de tocar nada:

- **Copias solas: ya estaban encendidas** (decisión 164: `default: 1` en `package.json`, `DE_FABRICA = 1` en
  `ajustes.js`, y una prueba que exige que digan lo mismo). Lo que faltaba era decirlo y poder quitarlo.
- **El asistente que falta, con su botón: ya estaba** (decisión 166, `asistentes.falta`). Lo que quedaba eran
  las preguntas «¿Lo pongo?» cuando los ajustes ya lo pedían.
- **Vista sencilla: preguntaba.** Ahora se pone sola.
- **«Dale a enviar»: faltaba** en el primer mensaje del montaje y en el de «He puesto al día».

## Scope

**Dentro**
- `extension/src/extension.js`: el montaje, `dejarElAviso` (varios botones), `quitarElGuardadoSolo`.
- `extension/src/arrancar.js`: `conElAjuste` sin pregunta, `losQueSePusieron`.
- `extension/prueba/humo.js`, `docs/diccionario.md`, `docs/decisiones.md` (la 181).

**Fuera**
- «¿Cuál pongo?» sin ningún asistente y en automático: es elegir uno, decide la persona.
- Los botones que piden algo al asistente con su asistente sin instalar: siguen con su «Poner X» (la 166).

## Checklist

- [x] Comprobar cada fuga contra el código y las decisiones
- [x] Vista sencilla puesta sola, dicha y con «Quitarlo»
- [x] Copias solas dichas, con «Quitarlo» (`quitarElGuardadoSolo`)
- [x] Asistente de los ajustes puesto solo, dicho; si falla, «Ponerlo ahora»
- [x] «Dale a enviar» en el montaje y en la puesta al día
- [x] Textos en `docs/diccionario.md`
- [x] Pruebas y mutaciones

## Evidence

La batería entera, una vez al final (números en la decisión 181 y en la PR).

## Next

- Quitar un asistente puesto solo no tiene «Quitarlo» propio: es una extensión del editor, y quitarla se hace
  desde el editor. Si alguien lo pide, se añade.
