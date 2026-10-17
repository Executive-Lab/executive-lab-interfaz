---
type: ftd
title: Claude, al día con su documentación
date: 2026-10-17
status: hecho
---

# Claude, al día con su documentación

## Intent

Una relectura de la documentación oficial de Claude Code (17-10-2026) encontró un ajuste que no hacía nada en el
editor y dos huecos en los avisos y los enganches. Decisión 182.

## Decisión

- **Qué puede hacer sin preguntarte**: se escribe `claudeCode.initialPermissionMode` en los ajustes de usuario del
  editor (vale para todas las carpetas), y no `permissions.defaultMode` de la carpeta, que la extensión ignora.
  Sin valor es Auto, con su opción. Nunca saltarse los permisos. Lo ya escrito en carpetas se deja: el terminal
  lo lee.
- **Avisos**: el matcher suma `elicitation_dialog` y `elicitation_url_dialog`, con su texto. Las carpetas con el
  enganche de antes puesto por la barra se ponen al día solas; lo que la persona cambió, no se toca.
- **Enganches que fallan**: medido, no cambiado. Sin `node` o sin el guion no bloquean (127 y 1, nunca 2) y
  `Notification` no bloquea nunca, así que no hace falta `onFailure`.

## Scope

**Dentro**
- `ajustes.js` y la pantalla de «Cómo quieres que trabaje» (`panel.js`).
- `ajustes-locales.js`, `avisar.mjs` y su copia de los raíles.
- Pruebas en `humo.js`; la decisión 182 y el diccionario.

**Fuera**
- Cambiar o quitar lo que ya había en `.claude/settings.json` de las carpetas.
- El freno de RSC y su comportamiento en Windows sin Git Bash.
- Ofrecer `dontAsk` o saltarse los permisos.

## Checklist

- [x] 1. Documentación confirmada: permission-modes, vs-code, hooks-guide, hooks y changelog.
- [x] 2. El ajuste a los ajustes de usuario del editor, con el estado real y su texto.
- [x] 3. El matcher, los textos y la migración de lo puesto por la barra.
- [x] 4. Prueba de que sin `node` o sin el guion no se bloquea nada.
- [x] 5. Pruebas y mutaciones (ver la decisión).
- [x] 6. Decisión 182, diccionario y este documento.
