---
type: ftd
title: Windows y los errores que no se dicen
date: 2026-10-17
author: Jose Sanchis
branch: windows-y-errores
status: hecho
---

# Windows y los errores que no se dicen

## Intent

Que lo que funciona en un Mac funcione igual en Windows (saltos de línea `\r\n`, rutas con `\`, mayúsculas
de la unidad) y que lo que falla en silencio se diga: un pedido sin contestar, un «sin cambios» sin haber
podido mirar, una escritura de la marca que no salió. Decisión 189.

## Decisión

- Una auditoría leyó un árbol viejo: cada punto se comprobó contra main antes de tocarlo.
- Listas con `\r\n`: `diario.js`, `ajustes.js` y `reglas.js` parten líneas con `/\r?\n/`. `arrancar.js` y
  `trato.js` reescriben la cabecera del perfil con el salto que ya tenía el fichero.
- `esMarca` ya normalizaba la ruta (decisión 167): se saca a `marca.esDeLaMarca` para poder probarlo.
- Comparar rutas: `src/rutas.js` (`estaDentro`, `mismoSitio`, `sitioReal`), con `path.relative`, sin distinguir
  mayúsculas en Windows; lo usan `cerebro.js`, `conexiones.js`, `marca.js` y `terreno.js`.
- `pedidos.contestar` ya no borra el pedido si no pudo escribir la respuesta; `dejarLaRespuesta` lo dice con
  «Algo va mal», una vez por pedido.
- `historial.cuantosCambios` devuelve `null` si no pudo mirar; la barra dice «No he podido mirar…».
- `tema.js` y `web.js` dicen cuál fichero y por qué (`por-que-no-se-escribio.js`).

## Scope

**Dentro**
- `src/rutas.js` y `src/por-que-no-se-escribio.js` (nuevos), y los ficheros de arriba.
- `instalador/comun/historial.js`, `media/panel.js`, `docs/diccionario.md`, decisión 189.
- Siete comprobaciones en `prueba/humo.js` y tres en `prueba/windows.js`.

**Fuera**
- El `terreno.cambiosSinGuardar` del reconocimiento (devuelve 0 si falla, pero solo omite una línea, no dice «todo guardado»).
- Las líneas que ya quitaban el `\r` (`mcp.js`, `retirados.js`, `enganches-de-codex.js`, `aviso-de-codex.js`).

## Checklist

- [x] Comprobar cada punto contra main
- [x] CRLF en las listas y en las cabeceras
- [x] `esMarca` con rutas de Windows
- [x] Ayudante común de rutas
- [x] Pedido sin contestar
- [x] «No he podido mirar» frente a «0»
- [x] Avisos de la marca con su porqué
- [x] Pruebas y mutaciones
- [x] Diccionario y decisión 189

## Evidence

Ver la decisión 189: números de la batería y mutaciones.

## Next

Ver cómo corre `windows.js` en la máquina de Windows de GitHub.
