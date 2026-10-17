---
type: ftd
title: Lo nuevo de Claude que le sirve al alumno
date: 2026-10-17
author: Jose Sanchis
branch: lo-nuevo-de-claude
status: hecho
---

# Lo nuevo de Claude que le sirve al alumno

## Intent

Decisión 185. De una investigación de la documentación oficial de Claude Code (17-10-2026): tres cosas que le
sirven a quien no es técnico, y dos que se dejan para más adelante.

## Scope

- Control remoto: Ayuda dice cuándo no puede funcionar (plan de pago, Owner en Team o Enterprise,
  `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` o `DISABLE_GROWTHBOOK`) y avisa del ordenador solo si el editor
  tiene alguna de las dos variables.
- Español: `claudeCode.spinnerVerbs` (`replace`, doce verbos) desde el instalador y la barra;
  `spinnerTipsEnabled: false` en `.claude/settings.local.json` con la maquinaria de la 157.
- `claudeCode.attachOpenFile: false` con un clic en la pantalla de datos de clientes, para todas sus carpetas.
- Fuera: plugins (`install-plugin`) y `open?session=`.

## Checklist

- [x] Cada punto comprobado en remote-control, vs-code y settings-reference (URL en la decisión 185).
- [x] Control remoto en Ayuda, solo con Claude; línea del ordenador solo con la variable.
- [x] Verbos en `ajustes-del-editor.js`, `probar.sh` y `probar.ps1`.
- [x] Consejos con constancia, huella, «Quitarlo» y puesta al día de las carpetas ya montadas.
- [x] Interruptor del fichero abierto, con su deshacer.
- [x] Textos en `docs/diccionario.md`; `comprobar-diccionario.js` limpio.
- [x] Pruebas y ocho mutaciones (en la decisión).

## Evidence

Ver «Las pruebas» de la decisión 185 en `docs/decisiones.md`.

## Next

Plugins y `open?session=`, cuando se sepa de dónde sale el id. Mirar también el bloque `env` de los ajustes de
Claude para el control remoto.
