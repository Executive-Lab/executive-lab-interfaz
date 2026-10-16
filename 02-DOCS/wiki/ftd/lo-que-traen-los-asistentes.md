---
type: ftd
title: Lo que traen los asistentes, y lo que se pone solo
date: 2026-10-15
status: hecho
---

# Lo que traen los asistentes, y lo que se pone solo

## Intent

Jose, 15-10-2026: *«lo que pueda funcionar automático, mejor que funcione automático […] la interfaz es
mejor que sugiera que lo haga sola en algunas cosas»*. Se investigó lo que traen hoy Claude Code, Codex y
RSC 3.0.22, y se mete lo que es local, se deshace y no decide nada por nadie (P9). Decisión 157.

## Decisión

- El diagnóstico del arnés que sale con 1 se lee: trae el informe entero y `healthy`.
- En las carpetas cuyo historial creó la barra, `decidir.js` pone también `.no-worktree-isolation` y
  `.team-safe-3`. `.no-audit` ya lo ponen los raíles en todas.
- `.claude/settings.local.json`, solo para Claude y solo en lo nuestro: `language: "español"` si nadie dijo
  otro idioma, y `permissions.ask` para subir a GitHub y proponer allí un cambio. Al montar y al abrir, con
  constancia para quitarlo, y fuera de git.
- Codex con un modelo retirado: la barra quita la línea, deja copia y lo dice. La tabla, en
  `media/modelos-retirados.json`.

## Scope

**Dentro**
- `rsc.js` (`comoEstaDeSalud`, `estaEntero`), `decidir.js`, `reglas.js` (el porqué de lo apagado).
- `ajustes-locales.js` nuevo, llamado desde el paso de los raíles del montaje y al abrir (`extension.js`).
- `retirados.js` nuevo y su tabla, al abrir si la persona usa Codex.
- `no-entra-en-git.js`, en las dos copias.

**Fuera**
- Rutinas y tareas programadas: son de la decisión 155, y `SKILL.md` no se toca aquí.
- Notificaciones del sistema al terminar, `vscode://openai.chatgpt/?prompt=`, `codex exec` o `claude -p` a
  una hora, modo auto, caja de arena, memorias de Codex, «Approve for me»: la tabla de la decisión 157 dice
  por qué.
- En una carpeta de alguien, los ajustes de Claude y el Codex de la carpeta: esperan a un botón con su sí.

## Checklist

- [x] 1. El diagnóstico con código 1: se lee, `healthy` manda, y «Algo va mal» y «Qué falta por montar» lo ven.
- [x] 2. Las dos marcas en lo nuestro, quitadas si la orden no sale; comprobadas contra el paquete
  (`rsc isolation status`, `teamSafeAnnouncement`, `projectOptOuts`).
- [x] 3. Los ajustes de Claude: sin pisar, entero o nada, sin enlaces, nada si está en git, constancia y
  `--quitar`; al montar y al abrir; fuera de git.
- [x] 4. Codex: solo la línea, con copia; lo raro, la clave de la API, lo vigente y los enlaces, quietos.
- [x] 5. Pruebas en `humo.js` y mutaciones a mano — 33, las 33 tumbadas (una, tras reforzar la prueba: un
  texto de varias líneas que contenía la línea retirada).
- [x] 6. Main traído (decisiones 150, 151, 153, 154 y 155), `preparar-paquete.js` y toda la batería en verde.
- [x] 7. Decisión 157, diccionario y este documento.
- [x] 8. La revisión de seguridad (PR #46): la línea que atasca el TOML, la constancia plantada, lo que no se
  entiende del TOML, la marca de este ordenador y el `allow` plantado. Cada uno con su prueba.
- [x] 9. La revisión de corrección: otro proveedor y `auth.json`, lo quitado no vuelve, la frase al montar,
  «Quitarlo», una sola frase al abrir, el 1 sin `healthy: false`, el fichero vacío, la copia de Codex y las
  listas del TOML. Y los doce mutantes que dejó vivos, con prueba.
- [x] 10. Mutaciones a mano de las dos revisiones: 53, las 53 tumbadas (dos, tras reforzar su prueba).
  Con el Mac cargado, sobre una copia de `humo.js` filtrada a las pruebas de la decisión y a la activación.

## Evidence

- `humo.js`: 397 comprobaciones con main traído, seis nuevas: «el diagnóstico del arnés que sale con 1 se
  lee…», «en una carpeta de la barra no se trabaja aparte…», «los ajustes de Claude de esta persona…», «los
  ajustes de Claude se ponen al montar y al abrir…», «Codex con una versión que ya no existe…» y «la barra
  arregla Codex al abrir…». Con `--con-arnes`, el montaje de verdad deja las marcas y los ajustes.
- Mutaciones a mano: 33, las 33 tumbadas; y 53 más con las dos revisiones, las 53 tumbadas.
- Con las revisiones arregladas y main traído (152 y 156): `humo.js` 408, siete de esta decisión; `contrato.js` 14,
  `empresas-distintas.js`, `mapeos-codex.js` 14 y el diccionario, en verde.
- `contrato.js` (14), `empresas-distintas.js`, `mapeos-codex.js` (14) y `comprobar-diccionario.js`, en verde.

## Next

- Probar con una persona que Claude, con el `ask`, pregunta antes de subir también en modo auto, y que
  `language` se nota sin abrir otra conversación.
- En una carpeta de alguien: ofrecer los ajustes de Claude y el arreglo de Codex con su botón (C-4). Hecho en la 177.
- Las carpetas sin git que se montaron antes de esta versión no tienen la marca de este ordenador: lo de
  la 157 no les llega hasta que se pongan copias o se vuelvan a montar.
- `.team-safe-3` cuando una carpeta de la barra ya en la 3 se trae a otro ordenador.
- Revisar aparte que los raíles apaguen avisos (`.no-audit` y compañía) en carpetas de alguien: RSC los apunta
  en su `.rsc.json`.
