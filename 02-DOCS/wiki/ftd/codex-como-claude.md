---
type: ftd
title: Codex, como Claude: el aviso al terminar y el español
date: 2026-10-16
status: hecho
---

# Codex, como Claude: el aviso al terminar y el español

## Intent

Con Claude, la barra avisa cuando termina o te necesita (162) y fija el español (157). Con Codex no hacía
ninguna de las dos cosas: el aviso estaba «propuesto», y su `AGENTS.md` solo mandaba leer un fichero. Decisión
171.

## Decisión

- **El aviso al terminar** se ofrece una vez, con un botón, porque `notify` vive en el `config.toml` de usuario
  de Codex y vale para todas sus conversaciones (P9). Con el sí: el guion a `~/.codex/executive-lab/`, la
  constancia, y `notify = ["<node>", "<guion>"]` arriba del `config.toml`, validado con el lector de la barra.
- **Solo con un `node` de verdad** y sin un `notify` suyo. Lo que no se entiende, no se escribe.
- **«Quitarlo» y «No, gracias»** no vuelven. Solo se quita lo que sigue como lo dejó la barra.
- **`avisar.mjs`** entiende el JSON de Codex (último argumento, `agent-turn-complete`) y solo avisa en
  carpetas de la barra. No lee lo que se dijo.
- **El español**: el trozo de `AGENTS.md` ya no solo manda leer `siempre.md`, dice «Contesta siempre en
  español.»

## Scope

**Dentro**
- `extension/src/aviso-de-codex.js`, su botón en `extension.js`, y las claves de arriba en
  `retirados.leerElToml`.
- `avisar.mjs` (las dos copias) y `aplicar.js` (las dos copias).
- Pruebas en `humo.js`, el diccionario y la decisión 171.

**Fuera**
- Poner al día el guion copiado si cambia en una versión nueva.
- El `AGENTS.md` global de Codex.
- Un «te necesita» de Codex: no existe ese evento.

## Checklist

- [x] 1. `notify` y `AGENTS.md` comprobados en la documentación de Codex (16-10-2026).
- [x] 2. El módulo: `node` de verdad, clave arriba, copia, constancia, quitar, no volver.
- [x] 3. El botón, una vez, y el aviso con «Quitarlo».
- [x] 4. El guion con Codex, solo en la barra y sin lo que se dijo.
- [x] 5. El español en el trozo de `AGENTS.md`.
- [x] 6. Pruebas, mutaciones y diccionario.
- [ ] 7. Con una persona: que Codex llama al guion y sale el aviso, en Mac y en Windows.
- [ ] 8. Con una persona: que contesta en español sin leer `siempre.md`.

## Evidence

`humo.js` 478 y con `--con-arnes` 486 (cuatro comprobaciones nuevas); `mapeos-codex.js` 30; `contrato.js` 15;
`empresas-distintas.js`, diccionario y `revisar-powershell.js` en verde. Mutaciones a mano: 24, las 24 tumbadas
(una sobrevivió al principio y se reforzó su prueba).

## Next

- Lo de los puntos 7 y 8.
- Si cambia `avisar.mjs`, poner al día la copia de `~/.codex/executive-lab/`.

## La revisión

- Una carpeta `executive-lab` con un guion o cosas que no constan como nuestras no se pisa (`carpetaAjena`), y
  un fallo a mitad deshace solo lo escrito por esa pasada. Temporales con aleatorio. El `node` pide la 18.
- Tras traer `main` (168 a 170): `humo.js` 482, con `--con-arnes` 490, `mapeos-codex.js` 30, `contrato.js` 15, y
  `empresas-distintas.js`, diccionario y `revisar-powershell.js` en verde. Mutaciones de la revisión: 6, 5
  tumbadas y una equivalente (borrar el guion en el `catch`, que ya no se alcanza con uno ajeno).

