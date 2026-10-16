---
type: ftd
title: Deshacer con RSC, quitar una habilidad y volver a la copia
date: 2026-10-17
author: Jose Sanchis
branch: deshacer-con-rsc
status: hecho
---

# Deshacer con RSC, quitar una habilidad y volver a la copia

## Intent

Que quien usa la barra pueda quitar una habilidad o un agente que añadió, y volver a lo que había antes de
montar el arnés, con los subcomandos oficiales de RSC (`uninstall` y `restore`) y con un clic y una pregunta
que diga qué se quita o se recupera. Decisión 173.

## Decisión

- «Quitarla» (habilidad del catálogo) y «Quitarlo» (agente pedido a RSC) en la (i) de su fila: `uninstall <id>`.
- «Recuperar lo que había» junto a «Ver la copia»: `restore <copia del montaje>`, con lo de ahora guardado antes en
  `.rsc/antes-de-recuperar/` porque RSC no lo guarda.
- Nunca solas, y nunca para lo suyo, lo de la barra, el suelo de RSC ni la fontanería.
- Después se repinta y se dice lo que ha pasado, con la salida de RSC si falla.

## Scope

**Dentro**
- `extension/src/deshacer.js` (nuevo), `saberes.js`, `agentes.js`, `rsc.js` (`losAsistentes`), `extension.js`, `media/panel.js`.
- Cuatro comprobaciones en `humo.js` (una con el arnés de verdad).
- La decisión 173 y el diccionario.

**Fuera**
- Un «recuperar solo lo suyo»: RSC no lo tiene.
- Quitar lo suyo, lo de la barra o lo de suelo.

## Checklist

- [x] Leer qué hacen `uninstall`, `backups` y `restore`
- [x] «Quitarla» y «Quitarlo» con pregunta, y la regla de qué se ofrece
- [x] «Recuperar lo que había» con `--dry-run`, copia de lo de ahora y `restore`
- [x] Repintar y decir lo que ha pasado, con la salida de RSC si falla
- [x] Pruebas con un RSC de mentira y con el de verdad
- [x] 12 mutaciones
- [x] Batería entera

## Evidence

Las 12 mutaciones tumban su prueba; el original se restauró desde una copia en el scratchpad. Con el arnés de
verdad, `uninstall` saca la habilidad de disco y de `.rsc.json` sin tocar el suelo, y `restore` de la copia del
montaje devuelve lo suyo (92 sitios) y deja lo de ahora guardado.

## Next

Nada pendiente. Si Jose quiere un «recuperar solo lo suyo», habría que pedírselo a RSC.
