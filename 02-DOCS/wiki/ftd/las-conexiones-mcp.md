---
type: ftd
title: Las conexiones MCP se ven
date: 2026-10-17
author: Jose Sanchis
branch: las-conexiones-mcp
status: hecho
---

# Las conexiones MCP se ven

## Intent

Muchos alumnos conectan herramientas por MCP pidiéndoselo al asistente, y la barra no sabía nada: «Conexiones
(tools)» decía «todavía no hay ninguna». Un apartado, «Conectadas por MCP», que las enseñe: solo lectura, solo
nombre, asistente, de dónde sale y qué es; nunca un valor. Decisión 175.

## Decisión

- Claude: `.mcp.json` de la carpeta; `.claude.json` (`projects[<ruta>].mcpServers` = solo tuyo en esta carpeta;
  `mcpServers` de arriba = de tu usuario). Codex: `[mcp_servers.<nombre>]` en `.codex/config.toml` y en
  `$CODEX_HOME/config.toml`. Fuentes en la decisión 175.
- `extension/src/mcp.js`: sin seguir enlaces, con topes, y lo que no se entiende no se enseña.
- Si se llama como una conexión que la barra ya conoce, se dice junto a ella.

## Scope

**Dentro**: `mcp.js`, el apartado en `panel.js`, el envío en `extension.js`, pruebas en `humo.js`, decisión 175 y
diccionario.

**Fuera**: añadir, quitar o apagar servidores; saber si funcionan o si `.mcp.json` está aprobado; los gestionados
por la empresa, los de plugins y los conectores de la cuenta.

## Checklist

- [x] 1. Fuentes oficiales de Claude y Codex.
- [x] 2. `mcp.js` con TOML propio, topes, sin enlaces.
- [x] 3. Apartado en Conexiones y la coincidencia con una conexión conocida.
- [x] 4. Pruebas sin valores en el HTML ni en el estado.
- [x] 5. Mutaciones, batería y PR.

## Evidence

Los números, en la PR. Sin confirmar: que `CLAUDE_CONFIG_DIR` mueva `.claude.json` (ver decisión 175).

## Next step

Si Jose lo quiere: añadir o quitar un servidor desde la barra, que sería otra decisión.
