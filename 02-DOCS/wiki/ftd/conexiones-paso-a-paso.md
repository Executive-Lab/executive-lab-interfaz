---
type: ftd
title: Conexiones, paso a paso
date: 2026-10-14
status: hecho
---

# Conexiones, paso a paso

## Intent

F4 de [simplificar-la-barra](../sdd/proposals/simplificar-la-barra.md): el estado en la lista, la guía de
un paso cada vez y probar al guardar. Jose: *«lo que más fricción da es conectar las conexiones»*. P9.
Decisión 146.

## Scope

**Dentro**
- Probar sola al guardar la última clave, y decirlo en una frase.
- La lista con la última prueba, mientras las claves sigan igual.
- La guía de uno en uno, con «No lo encuentro» y la lista entera a un clic.
- «Conectar algo nuevo», con `connect-tool`.

**Fuera (F5)**
- Las clases de acceso y su forma en pantalla.
- «Pídeselo a tu informático».

## Checklist

- [x] 1. `huella` y `tienePrueba`; probar al guardar; recordar la última prueba.
- [x] 2. La lista y la guía en pantalla.
- [x] 3. La prueba de humo, con una conexión de verdad (clave mala y buena) y la guía.
- [x] 4. Mutaciones a mano — 7, las 7 tumbadas.
- [x] 5. Revisión adversaria — nada que bloquee; tres menores, arreglados: la huella se toma antes de
  probar (si las claves cambian mientras, lo que diga no es de las nuevas); si se fue a otra pantalla
  mientras se probaba sola, no se le devuelve; y lo pasajero (sin internet, no contesta) no se recuerda
  como «falla». 3 mutantes más, tumbados. VS Code de verdad: «todo bien».
- [x] 6. Las máquinas de GitHub — el-dmg, windows, vscode-de-verdad y el-exe en verde (PR #31).

## Evidence

- `humo.js`: «conexiones paso a paso: se prueba sola al guardar, la lista dice cómo fue, y la guía va de
  uno en uno».

## Next

- F5: las clases de acceso y «Pídeselo a tu informático». Hecho en
  [conexiones-acceso](conexiones-acceso.md), decisión 154.
