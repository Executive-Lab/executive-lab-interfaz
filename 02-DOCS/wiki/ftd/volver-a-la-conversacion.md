---
type: ftd
title: Volver a la última conversación
date: 2026-10-17
author: Jose Sanchis
branch: volver-a-la-conversacion
status: hecho
---

# Volver a la última conversación

## Intent

«Seguir donde lo dejé» abre una conversación nueva con el contexto. Que quien usa Claude pueda, con un clic,
volver a la conversación de verdad, con la documentación oficial y sin leer nada interno. Decisión 191.

## Decisión

- **Documentado**: `vscode://anthropic.claude-code/open?session=<id>` abre esa conversación si es del espacio de
  trabajo abierto; si no existe, abre una nueva (https://code.claude.com/docs/en/vs-code). El id sale del
  `session_id` que reciben los enganches (https://code.claude.com/docs/en/hooks).
- **No documentado, no se usa**: los ficheros de `~/.claude/projects/…` (formato interno).
- **Apuntar**: `avisar.mjs` (enganche `Notification`, decisión 162) guarda `{ id, cuando }` en
  `.rsc/executive-lab-ultima-conversacion.json`. Nada de la conversación.
- **Ofrecer**: «Volver a la última conversación», solo con Claude y con id apuntado, en Ayuda y en la tarjeta
  de la última vez. Es un clic de la persona (decisión 187). Si la conversación ya no existe, se abre una nueva y
  el aviso lo dice.
- **Codex**: su documentación no dice cómo abrir un hilo con su `thread-id`; nada.

## Scope

**Dentro**: `avisar.mjs` (dos copias), `ultima-conversacion.js`, la brújula, la extensión, el panel, el
diccionario, las pruebas.

**Fuera**: leer `~/.claude`; `claude --resume` por terminal; un enganche nuevo; Codex.

## Checklist

- [x] Fuente documentada del id (enganches) y del enlace (VS Code)
- [x] `avisar.mjs` apunta solo el id y la hora
- [x] Botón en Ayuda y en la tarjeta, solo con Claude y con id
- [x] Aviso claro si la conversación ya no existe
- [x] Codex: nada, escrito en la decisión
- [x] Pruebas y mutaciones
- [x] Diccionario y decisión 191

## Evidence

Ver la decisión 191 en `docs/decisiones.md`: las pruebas de `humo.js` y las mutaciones.

## Next

Nada pendiente. Si Codex documenta un enlace para abrir un hilo, ofrecerlo igual.
