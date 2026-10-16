---
type: ftd
title: El primer día, sin listas técnicas
date: 2026-10-16
author: Jose Sanchis
branch: el-primer-dia
status: hecho
---

# El primer día, sin listas técnicas

## Intent

Una revisión de producto pintó cada momento del primer día con el VS Code de mentira y montó la carpeta con
RSC 3.0.22 de verdad. Lo que ve alguien que acaba de preparar su carpeta no era lo que pide la propuesta de
[simplificar la barra](../sdd/proposals/simplificar-la-barra.md): una tarjeta con lo que toca, cinco cosas a
la vista y nada que dé miedo.

1. Al terminar de preparar salía «Qué falta por montar», una lista técnica de catorce filas, porque sin
   conexiones, sin conocimiento y sin copia fuera, como queda toda carpeta recién montada, contaba como
   «falta».
2. La tarjeta «Abre Claude y entra con tu cuenta · Hace falta una cuenta de pago» no salía nunca: pedía cero
   copias, y la barra acaba de guardar el punto de partida.
3. De los dieciséis objetivos del montaje, quince no daban ninguna habilidad del catálogo, y el otro daba una
   que ya viene puesta. «Poner orden en mis facturas» no daba nada, y Sugerencias decía «no veo nada».
4. «Más tarde» a GitHub y «Seguir sin copias» mandaban a «Histórico», que en la barra sencilla no existe.
5. Las copias solas venían apagadas, y la propuesta las pedía encendidas («Nada se pierde»).
6. En Habilidades, lo que ponen los raíles salía como «Tuya: escrita para esta carpeta», y por ellos salía la
   fila de Recordatorios desde el primer día.
7. Tres textos: «Lo último» encima de una carpeta vacía, una descripción en inglés que pasaba por español por
   una «Y» suelta, y `unslop` con un nombre que no es el del diccionario.

## Decisión

Decisión 164 en [`docs/decisiones.md`](../../../docs/decisiones.md).

## Scope

**Dentro**
- `terreno.js`: las piezas que llegan con el trabajo llevan `porHacer`, y la radiografía dice `algoRoto`.
  `siFaltaAlgoDecirlo` enseña la lista solo con algo roto; si no, a la principal.
- `brujula.js`: el punto de partida no cuenta como haber empezado (`guardar.esElPuntoDePartida`).
- `media/objetivos.json`: objetivo → habilidad del catálogo, y `consejos.porElObjetivo` la pone delante en las
  ideas.
- `ideas.loAplazado`: las copias y GitHub, en Ayuda › Sugerencias, con su botón. Los textos lo dicen.
- «Seguir sin copias» sigue montando. Sin git, si lo eligió, se prepara igual y git no tapa la tarjeta.
- `executiveLab.guardarSolo` de fábrica, cada hora, con las guardias en `guardar.guardarSiToca`.
- `acciones.esDeLaBarra`: lo de los raíles, plegado con Las del arnés; `executive-lab`, sin botón; y la fila de
  Recordatorios sale solo con una habilidad de la persona o un recordatorio puesto.
- «Lo último», `enEspanol` y el nombre de `unslop`.
- Pruebas, diccionario, decisión, `docs/friccion.md` y esto.

**Fuera, y por qué**
- **La barra completa.** Con `executiveLab.barraCompleta` sigue como estaba: Histórico existe allí.
- **`bro`, con un nombre en `nombres.json` que no es el del diccionario.** En la 3 ya no se instala, y no sale
  en ningún sitio.
- **Un «Ahora no» en la tarjeta de la cuenta.** No se pidió: se va sola con la primera conversación, el
  primer concepto, la primera conexión o la primera copia que no sea el punto de partida.

## Checklist

- [x] 1. La principal al terminar, con la lista solo si algo está roto.
- [x] 2. La tarjeta de la cuenta, el primer día.
- [x] 3. La tabla de los objetivos, en la idea de siempre.
- [x] 4. Lo aplazado, en Sugerencias; y «Seguir sin copias» que sigue.
- [x] 5. Las copias solas, cada hora, sin tocar el historial de nadie ni carpetas sin copias.
- [x] 6. Habilidades y Recordatorios.
- [x] 7. Los textos.
- [x] 8. Pruebas en `humo.js` y `empresas-distintas.js`, con mutaciones a mano.
- [x] 9. Diccionario, decisión 164, `docs/friccion.md`.

## Evidence

Una pasada entera después del último cambio de código, sobre `origin/main` en `35eaa72` más esta rama:

- `node extension/prueba/humo.js` → 427 comprobaciones pasadas (eran 421). Las seis nuevas, una por punto
  del encargo, y ocho puestas al día.
- `node extension/prueba/empresas-distintas.js` → las tres empresas y la recién montada de verdad, que acaba
  en la principal con cinco cosas a la vista.
- `node extension/prueba/humo.js --con-arnes` → 435, con los montajes de verdad.
- `node extension/prueba/contrato.js` → 15 · `node extension/prueba/mapeos-codex.js` → 29 ·
  `node docs/comprobar-diccionario.js` → limpio · `node herramientas/revisar-powershell.js` → sin pegas.
- Mutaciones a mano: 81, las 81 tumbadas (cuatro sobrevivieron a la primera y se cerraron con su prueba).

Cada punto del checklist tiene su comprobación en `humo.js`, con su nombre:

1. «al terminar de preparar la carpeta, la principal: la lista, solo si hay algo roto»;
2. «el primer día sale la tarjeta de la cuenta: el punto de partida no cuenta como empezar»;
3. «una sugerencia desde el primer día: cada objetivo del montaje, su habilidad del catálogo»;
4. «lo que se dejó para más tarde está en Ayuda › Sugerencias, con su botón», y «sin git se pregunta qué
   hacer» y «con seguir sin copias, preparar monta sin copias», puestas al día;
5. «guardar solo no toca el historial de otra persona», ahora con git de verdad;
6. «en Habilidades, lo que pone la barra va con lo del arnés, y Recordatorios no sale por ello»;
7. «una carpeta vacía no lleva «Lo último» encima», «una habilidad escrita aquí no se cuenta como fontanería»
   (`enEspanol`) y «cada habilidad instalada cae en un montón» (`unslop`).

**Capas no ejecutadas**

- **SUSTITUIDA** — un VS Code de verdad: todo se ha visto con el editor de mentira y el arnés de verdad. No
  puede ver cómo se pinta de verdad ni el diálogo de GitHub del editor.


Ver la decisión 164: lo que se hizo, por qué, y lo que queda.

## Next

- Verlo en un VS Code de verdad: montar una carpeta vacía y mirar que acaba en la principal con la tarjeta de
  la cuenta, y que Sugerencias no está vacía.
- Con los alumnos que ya tienen la barra: el guardado solo se enciende al poner la versión nueva, en todas
  las carpetas que no lo apagaron. Contarlo en el «Qué trae».
