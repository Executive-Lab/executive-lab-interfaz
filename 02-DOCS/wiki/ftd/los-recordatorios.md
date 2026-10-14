---
type: ftd
title: Los recordatorios, y lo que cada asistente sabe hacer solo
date: 2026-10-14
status: hecho
---

# Los recordatorios, y lo que cada asistente sabe hacer solo

## Intent

Jose, 14-10-2026: meter `/schedule`, `/goal` y `/loop` quitando fricción, con una barra que detecte cuándo
vale la pena proponerlo. Eric: las rutinas son de cada asistente y no son iguales. Decisión 144.

## Scope

**Dentro**
- `cuando` en la `metadata` de una habilidad con botón; la barra como reloj, con aviso y tarjeta.
- La costumbre de los botones, convertida en recordatorio sola, y con vuelta atrás.
- La regla del asistente: `/goal` (los dos), `/loop` y `/schedule` (solo Claude), cuándo y cómo.
- Ver y quitar los recordatorios en *Habilidades (skills)*. «Conversación nueva» con Codex, con su comando.

**Fuera**
- Que se haga del todo solo, sin el clic: pediría ejecutar el asistente sin nadie delante.
- Crear tareas en las apps de escritorio o en la nube desde la barra: ninguno de los dos lo permite.

## Checklist

- [x] 1. `cuando.js` (cron, en palabras, costumbre) y `recordatorios.js` (cuál toca, escribirlo y quitarlo).
- [x] 2. La barra: reloj cada minuto, aviso una vez, tarjetas, la costumbre sola, uso de los botones.
- [x] 3. Los raíles conservan el recordatorio al ponerse al día, y «al día» no lo toma por viejo.
- [x] 4. La regla del asistente, por asistente; y su prueba.
- [x] 5. Mutaciones a mano — 12, las 12 tumbadas (4 tras reforzar la prueba).
- [x] 6. Revisión adversaria — cinco fallos y un detalle, arreglados: «Quitar» se deshacía solo por
  costumbre; en un comando de los raíles se perdía al ponerse al día (ahora solo en habilidades); escribir
  el `cuando` podía estropear el fichero (un `$`, `metadata: {}`, otra sangría, saltos de Windows); un
  cambio de hora tocaba por lo pasado; con dos a la vez solo se avisaba de uno; y «los sábado», «a las
  1:00». 6 mutantes más, tumbados. VS Code de verdad: «todo bien».
- [x] 7. Las máquinas de GitHub — el-dmg, windows, vscode-de-verdad y el-exe en verde (PR #25).

## Evidence

- `humo.js` 359: «los recordatorios: a su hora con su botón, y la costumbre se convierte en recordatorio
  sola».

## Next

- Publicar con el control remoto (decisión 143).
- Propuesta: hacerlo del todo solo.
