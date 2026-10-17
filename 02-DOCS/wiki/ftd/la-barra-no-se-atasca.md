---
type: ftd
title: La barra no se atasca
date: 2026-10-17
status: hecho
---

# La barra no se atasca

## Intent

Una auditoría de rendimiento (sobre un árbol 135 commits viejo) dijo que la barra se puede atascar con una
carpeta grande: repintados que se solapan, git sin tope, y el mismo fichero leído decenas de veces. Decisión 188.

## Scope

**Dentro**
- Un repintado a la vez, con uno en cola como mucho; con la barra escondida, no repinta y al verse sí.
- Topes de tiempo y `--no-optional-locks` en los git que solo leen (`historial.js`, `procesos.git`).
- `estanSubidas`: sin `.git` no lanza nada; git de la casa, `windowsHide`.
- Caché por fecha, tamaño e inodo (`lecturas.js`) para `.rsc.json`, `index.md`, `log.md` y los raíles de `terreno.js`;
  topes de 1 MB y de entradas.

**Fuera**
- Hacer asíncrono `resumen()`: lo llaman siete sitios síncronos y con la caché basta.
- El tiempo de `rsc memory resume` en carpetas enormes: es del arnés.
- Lo que ya estaba de la 167 y la 170.

## Checklist

- [x] 1. Comprobar cada punto en main y decir qué ya estaba.
- [x] 2. Medir antes y después: 9.289 ms → 609 ms por repintado.
- [x] 3. Bandera de repintado y «sucio» al esconderse.
- [x] 4. Topes y bandera de git.
- [x] 5. Cachés y topes de lectura.
- [x] 6. Seis pruebas nuevas y doce mutaciones, todas tumbadas.

## Evidence

- Guion de medida en el scratchpad de la sesión (`r188-medir.js`): carpeta de 9.000 ficheros, `.rsc.json` de
  4,1 MB, `log.md` de 7,4 MB, `index.md` de 2,7 MB. Mediana de cinco repintados: 9.289 ms en main, 609 ms ahora.
- `humo.js`: las seis «188:».

## Next

- Si algún día `resumen()` se hace asíncrono, `estanSubidas` puede pasar a `execFile`.
- Un fallo de `rsc memory resume` no se recuerda: con una carpeta enorme se reintenta en cada repintado (ahora
  como mucho uno a la vez).
