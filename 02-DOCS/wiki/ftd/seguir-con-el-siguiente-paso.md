---
type: ftd
title: Seguir donde lo dejé dice por dónde ibas
date: 2026-10-16
author: Jose Sanchis
branch: seguir-con-el-siguiente-paso
status: hecho
---

# Seguir donde lo dejé dice por dónde ibas

## Intent

RSC ya guarda el siguiente paso: `memory resume` devuelve `next:`, con el «Next» del documento de trabajo y
cuántas casillas le quedan. La barra solo leía `files:`. Que «Seguir donde lo dejé» diga por dónde ibas, sin
el asistente y sin red. Y, de la revisión de producto, que quien vuelve al día siguiente lo vea sin buscarlo
(`docs/friccion.md` §4). Decisión 160.

## Decisión

- **Por dónde ibas**, en `extension/src/por-donde-ibas.js`: los documentos que nombra `next:` y, si ninguno
  sigue en marcha, el documento de trabajo en marcha más reciente de `02-DOCS/wiki/ftd/`. Su «Next» o, sin
  él, la primera casilla sin marcar, y cuántas quedan.
- **Terminado no se ofrece**: `status: done` o `hecho`, o ninguna casilla sin marcar. En las carpetas de la
  barra nadie fusiona y los documentos se quedan `in-progress` para siempre.
- **Del disco, con cuidado**: sin seguir enlaces (ni el documento ni sus carpetas), 256 KB por documento,
  5 leídos en total, 500 ms y 500 mirados como mucho. De cada uno, 50 líneas del Next y 50 casillas de
  400 letras, sin expresiones que vuelvan atrás. Limpio con `limpio.etiqueta` y sin claves
  (`informatico.sinClaves`), antes de cortar; si no se pueden tapar, no se enseña.
- **Dónde sale**: debajo de «Seguir donde lo dejé» en Ayuda, en el recordatorio de «Seguir donde lo dejé» y
  en el encargo del botón, que arma la extensión (P6). Sin nada en marcha, todo como antes (P1).
- **La tarjeta de la última vez**: la primera vez de cada día, en una carpeta con algo hecho. Se decide esa
  primera vez y se apunta en la carpeta. Sus dos botones la quitan hasta mañana. Va detrás de lo urgente, de
  los datos de clientes y de lo que sale una vez, y delante del consejo y de las ideas.

## Scope

**Dentro**
- `por-donde-ibas.js`, nuevo.
- La brújula: `ibasPor` y `laUltimaZona`; el andamio de la wiki (`ftd`, `sdd`…) ya no sale como tema.
- `cerebro.esAndamio`, exportada.
- La extensión: la tarjeta del día y sus dos botones.
- El panel: Ayuda, el recordatorio, la tarjeta y su sitio en el orden; una línea de CSS.
- Las pruebas: dos comprobaciones nuevas por cada parte en `humo.js`, y las tres empresas.
- La decisión 160, el diccionario y `docs/friccion.md`.

**Fuera**
- La barra completa: no lleva la tarjeta del día.
- El comando de la paleta «Executive Lab: Seguir donde lo dejé»: sigue con su texto.
- El raíl `seguir.md`: el asistente sigue leyendo `next:` de RSC, que da por buena una tarea con todo marcado.

## Checklist

- [x] 1. Leer `next:` y el documento de trabajo más reciente, sin los terminados — comprobación 1 de
  `humo.js`.
- [x] 2. Sin enlaces, con topes y limpio, y sin claves — comprobaciones 1 y 2.
- [x] 3. En Ayuda, en el recordatorio y en el encargo, con Claude y con Codex — comprobación 2 y las tres
  empresas.
- [x] 4. La tarjeta de la última vez: el día, «Ahora no», «Seguir donde lo dejé» y el orden — comprobaciones 3
  y 4, y las tres empresas.
- [x] 5. Mutaciones a mano — 86, 83 tumbadas; las 3 que pasan son capas repetidas a propósito (ver la 160).
- [x] 6. Todas las baterías en verde, también con main traído.
- [x] 7. Lo de la revisión adversaria: tiempo, encargo delimitado, BOM, el Next, terminado, medianoche,
  falla cerrado y el recordatorio. Comprobaciones 1 a 4.

## Evidence

- `humo.js`: de 419 a 423 antes de traer main, y 425 con main traído (la 0.53.0 y los arreglos sueltos).
- `empresas-distintas.js`: las tres, con una tarjeta y 5 cosas a la vista como mucho; la gestoría y el
  despacho (Codex) dicen por dónde iban.
- `mapeos-codex.js` 29, `contrato.js` 15, `comprobar-diccionario.js` y `revisar-powershell.js` en verde.
- Las 86 mutaciones, otra vez con main traído: lo mismo, 83 tumbadas.
- Revisión adversaria de la PR #55: lo grave (25 documentos preparados, 15 s → 7 ms) y los menores, cada uno
  con su prueba. Las 10 mutaciones más importantes, las 10 tumbadas.

## Next

- Verlo en un VS Code de verdad: la tarjeta a la mañana siguiente y la frase en Ayuda, con Claude y con Codex.
- Contarle a Eric que `nextSteps` ofrece una tarea con todas las casillas marcadas cuando nadie fusiona.
