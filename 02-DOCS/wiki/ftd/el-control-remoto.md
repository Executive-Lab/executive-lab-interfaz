---
type: ftd
title: El control remoto de Claude, para todas las sesiones
date: 2026-10-14
status: hecho
---

# El control remoto de Claude, para todas las sesiones

## Intent

Jose, 14-10-2026: *«que automáticamente se ponga el control remoto para todas las sesiones, igual que
hemos hecho con el focus view»*, en la extensión y en los instaladores. Decisión 143.

## Scope

**Dentro**
- `remoteControlAtStartup: true` en los ajustes de usuario de Claude, desde los dos instaladores y desde
  la barra al arrancar.
- Quitarlo al desinstalar, solo si lo pusimos y sigue igual.

**Fuera**
- Codex: no tiene control remoto.
- Forzarlo a quien lo apagó: es su decisión.

## Checklist

- [x] 1. `control-remoto.js`: poner, respetar, no tocar lo ilegible, marca, quitar solo lo nuestro.
- [x] 2. Instaladores (Mac y Windows) y desinstaladores (Inno, `desinstalar.ps1`, `desinstalar.command`).
- [x] 3. La barra, al arrancar con Claude instalado; las pruebas, en una carpeta de mentira.
- [x] 4. Mutaciones a mano — 5, las 5 tumbadas.
- [x] 5. Todas las baterías y las máquinas de GitHub — humo 359, contrato, empresas, diccionario, PowerShell,
  VS Code de verdad; el-dmg, windows, vscode-de-verdad y el-exe en verde (PR #23, fusionada).

## Evidence

- `humo.js`: «el control remoto de Claude se pone para todas las sesiones, sin pisar nada».

## Next

- Comprobar en un ordenador de verdad que, tras instalar, una conversación nueva sale en claude.ai.
