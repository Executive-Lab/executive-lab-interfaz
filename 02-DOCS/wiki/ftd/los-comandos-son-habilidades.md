---
type: ftd
title: Los comandos son habilidades
date: 2026-10-13
status: hecho
---

# Los comandos son habilidades

## Intent

Jose, 13-10-2026: *«nos cargamos el concepto de comando y lo metemos todo en skills»*, y *«juntémoslo
en skills»* tras ver lo que dicen Claude y Codex. Decisión 141.

## Scope

**Dentro**
- Con Claude y Codex, un botón es una habilidad con `boton` en su `metadata`.
- Los cuatro de los raíles, como habilidades; «guardar», solo cuando se pide.
- La regla del asistente, una para los dos.
- La pantalla sencilla: sin fila de Comandos (apagada), y los comandos dentro de Habilidades.

**Fuera**
- Borrar comandos: los que hay se siguen leyendo, y la pantalla de Comandos sigue en la barra completa.
- Los demás asistentes (Copilot, Cursor…), que siguen con sus comandos.
- Los comandos que escribe RSC: no son nuestros.

## Checklist

- [x] 1. `sitios.js`, `como-habilidad.js` y `aplicar.js` — probado en carpetas de Claude y de Codex.
- [x] 2. La barra lee los botones de las habilidades (`/` y `$`), y manda la habilidad sobre el comando.
- [x] 3. «Al día» mira las habilidades; un comando nuestro de antes no deja los raíles viejos.
- [x] 4. Pantalla sencilla y pantalla de Habilidades.
- [x] 5. La regla del asistente, y su prueba.
- [x] 6. Mutaciones a mano — 12, las 12 tumbadas.
- [x] 7. Revisión adversaria — nada que bloquee; cinco detalles arreglados: «Seguir» dos veces en
  Habilidades (el comando del arnés y la habilidad), la habilidad con botón se llama como su botón y con
  Codex se pide con `$`, la barra vigila `.agents/skills`, un enlace con el nombre de un botón no se
  pisa ni corta los raíles, y el soporte dice dónde están los botones. 4 mutantes más, tumbados.
  VS Code de verdad: «todo bien».
- [x] 8. Las máquinas de GitHub — el-dmg, windows, vscode-de-verdad y el-exe en verde (PR #20).

## Evidence

- `humo.js` 358: «los botones son habilidades, con Claude y con Codex, y los comandos de antes siguen» y
  «la habilidad manda dejar lo que se repite como habilidad con botón, con los dos».

## Next

- Publicar (con un «Qué trae» que lo cuente).
- Una incidencia a RSC para que escriba sus comandos como habilidades.
