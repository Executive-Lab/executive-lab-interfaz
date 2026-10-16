---
type: ftd
title: Los instaladores, con los dos asistentes y comprobados
date: 2026-10-16
status: hecho
---

# Los instaladores, con los dos asistentes y comprobados

## Intent

Que quien instala en Mac o en Windows pueda elegir Claude, Codex o los dos, y que las pruebas de los
instaladores comprueben todo lo que se deja puesto (decisión 163), no una muestra.

## Decisión

Decisión 168 en [`docs/decisiones.md`](../../../docs/decisiones.md).

## Checklist

- [x] El `.dmg` pregunta con qué asistente (tres botones, Claude por defecto) y lo pasa a `instalar.js`
  con `--asistente`; de ahí salen las extensiones y los ajustes.
- [x] El `.exe` ofrece «Los dos»; en silencio, `/ASISTENTE=codex|losDos`.
- [x] `probar.sh` y `probar.ps1` miran cada clave con su valor y su constancia, el control remoto con su
  marca y la extensión de cada asistente elegido.
- [x] Idioma de Codex: `chatgpt.localeOverride` no tiene valores documentados; no se pone (fuentes en la 168).
- [x] Sin `~/.codex/config.toml` de usuario.
- [x] Pruebas en `humo.js` (incluido `probar.sh` de verdad sobre una casa de mentira) y mutaciones.
- [ ] Las máquinas `el-dmg` y `el-exe` en verde.

## Evidencia

Ver la PR de la decisión 168.

## Siguiente paso

Verlo con una persona delante: el diálogo del `.dmg` y la página del `.exe`.
