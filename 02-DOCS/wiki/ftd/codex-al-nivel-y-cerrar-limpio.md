---
type: ftd
title: Codex al mismo nivel, y cerrar limpio
date: 2026-10-17
author: Jose Sanchis
branch: codex-al-nivel-y-cerrar-limpio
status: hecho
---

# Codex al mismo nivel, y cerrar limpio

## Intent

Que quien trabaja con Codex reciba lo mismo que quien trabaja con Claude (el aviso de reabrir la conversación, y
no un «falta el asistente» si lo usa por terminal), que «Seguir donde lo dejé» no frene la barra en carpetas
grandes, y que la extensión se cierre sin dejar procesos ni relojes sueltos. Decisión 190.

## Decisión

- Una auditoría leyó un árbol viejo: cada punto se comprobó contra main antes de tocarlo. Ninguno estaba hecho.
- Reabrir la conversación: `asistentes.paraQueLoCoja` / `solo.REABRIR`, con el nombre de Claude o de Codex.
- Codex por terminal: `asistentes.estaPuesto` (extensión, `codex` en el `PATH` o sesión en `~/.codex`); lo que
  necesita la extensión lo dice como tal, con «Poner Codex».
- `rsc.retomar` recuerda un fallo cinco minutos y comparte el proceso en curso; la brújula espera dos segundos.
- `procesos.terminarLosMios`, `luego()` para los relojes del arranque y `onDidChangeWorkspaceFolders`.
- `guardarSolo` con un `guardando`.

## Scope

**Dentro**
- `src/asistentes.js`, `solo.js`, `brujula.js`, `terreno.js`, `rsc.js`, `procesos.js`, `extension.js`, `media/panel.js`.
- `docs/diccionario.md` (dos filas nuevas), decisión 190.
- Siete comprobaciones en `prueba/humo.js` y `onDidChangeWorkspaceFolders` en `prueba/vscode-falso.js`.

**Fuera**
- `arrancar.js` y los «los dos»: preparar el otro asistente sí necesita la extensión.

## Checklist

- [x] 1. Codex dice lo mismo que Claude al reabrir
- [x] 2. Codex por terminal no sale con «falta»
- [x] 3. El fallo de «Seguir donde lo dejé» se recuerda
- [x] 4. Cerrar limpio: procesos, relojes y cambio de carpeta
- [x] 5. `guardarSolo` no se solapa

## Evidence

Siete comprobaciones nuevas y ocho mutaciones, todas caen. Números de la batería en la decisión 190 de
`docs/decisiones.md`.

## Next

Esperar las cuatro máquinas y la revisión.
