---
type: ftd
title: Te aviso cuando el asistente termina o te necesita
date: 2026-10-16
status: hecho
---

# Te aviso cuando el asistente termina o te necesita

## Intent

Un alumno pide algo largo y se va a otra ventana. Claude se queda esperando a que le diga sí a algo, o
termina, y no se entera nadie. Era lo siguiente de la tabla de lo investigado en la 157. Decisión 162.

## Decisión

- **Claude**: en las carpetas de la barra, un enganche `Notification` (`permission_prompt|idle_prompt`) en
  `.claude/settings.local.json`, con el cuidado y la constancia de la 157 (`ajustes-locales.js`). Llama a
  `avisar.mjs`, de los raíles, con `node` a secas, como el freno.
- **El guion** enseña un aviso del sistema corto y en español: `osascript` en Mac, la burbuja de PowerShell en
  Windows y `notify-send` en Linux. El nombre de la carpeta nunca va dentro de un guion. Sale siempre con 0, y
  todo lleva tope de tiempo.
- **«Quitarlo»** quita lo que cuenta su aviso, nada más. Lo quitado no vuelve.
- **Codex**: se propone y no se hace. `notify` va en su configuración de usuario, vale para todo, y solo
  avisa al acabar cada respuesta. La decisión dice por qué.

## Scope

**Dentro**
- `skills/executive-lab/avisar.mjs` y su copia en `extension/media/railes/executive-lab/`, idénticas.
- `ajustes-locales.js`: el enganche, su constancia, cuándo no se pone, y quitar por partes (`que`, `--solo=`).
- `extension.js` y `arrancar.js`: el botón del aviso lleva qué quitar.
- Pruebas en `humo.js` y `windows.js`; la decisión 162 y el diccionario.

**Fuera**
- El `notify` de Codex en su `config.toml` de usuario: propuesto, sin hacer.
- En una carpeta de alguien, los avisos con su botón, como el resto de la 157 (C-4).
- Saber si la persona está mirando la ventana.

## Checklist

- [x] 1. La forma de hoy, comprobada en la documentación de Claude (hooks y hooks-guide) y de Codex
  (notifications y config-advanced), el 16-10-2026.
- [x] 2. El guion: los dos textos, los tres sistemas, el nombre limpio, sin inyección, siempre 0 y con tope.
- [x] 3. El enganche en `settings.local.json`: sin pisar, sin enlaces, nada en git, solo con el guion en la
  carpeta y nunca encima de un aviso suyo.
- [x] 4. «Quitarlo» por partes, y lo quitado no vuelve. La constancia de la 157 sigue casando.
- [x] 5. Pruebas con carpetas temporales y los programas fingidos. Ningún aviso de verdad.
- [x] 6. Mutaciones a mano, cada una tumbada por una comprobación.
- [x] 7. Decisión 162, diccionario y este documento.
- [ ] 8. En un Mac nuevo: si el Editor de Scripts avisa a la primera.
- [ ] 9. En un VS Code de verdad: que llegan los dos tipos (el `idle_prompt` en el editor no está documentado).
- [ ] 10. En un Windows 10 y 11 de verdad: la burbuja.

## Evidence

- `humo.js`: 432 comprobaciones con main traído (la 161), tres nuevas: «los avisos del sistema: el enganche en los ajustes de
  Claude…», «el guion de los avisos…» y «los avisos del sistema al abrir una carpeta de la 157…». Dos de la
  157, al día con la frase y el botón.
- `windows.js`: dos nuevas, para la máquina Windows de GitHub. El enganche corre en Git Bash con el relevo, y
  PowerShell 5.1 lee el guion sin correrlo.
- Mutaciones a mano: 40, las 40 tumbadas (una, la huella de la 157, tras reforzar su prueba; y tres topes, que
  caían solo por el reloj, ahora sin depender de él).
- `contrato.js`, `mapeos-codex.js`, `empresas-distintas.js`, el diccionario y `revisar-powershell.js`, en
  verde.

## Next

- Lo de los puntos 8, 9 y 10, con una persona.
- Si en Mac hace falta encender el Editor de Scripts a mano, que la barra lo diga con su botón.
- Si el `idle_prompt` no llega en el editor, el «ha terminado» por `Stop`.
- Codex, si Jose decide que un aviso en cada respuesta compensa: con su botón y su sí.
