---
type: ftd
title: El instalador lo deja todo puesto — la confianza, la vista enfocada y lo de cada asistente
date: 2026-10-16
status: hecho
---

# El instalador lo deja todo puesto

## Intent

Jose, 16-10-2026: *«que el instalador instale y configure todo para que el usuario no tenga que hacer
mierdas. Quiero que el instalador active cosas como el remote control siempre de claude code, el focus
view, etc. y que configure todo lo que se necesite a nivel de visual studio code como lo de trust folder y
que claude code se meta en todos los workspaces. La fricción del usuario debe ser MÍNIMA»*.

## Decisión

Decisión 163 en [`docs/decisiones.md`](../../../docs/decisiones.md), con la tabla de lo investigado, sus
fuentes y lo que no se pone.

Un módulo común, `instalador/comun/ajustes-del-editor.js`, para los dos instaladores y la barra:

- **lo del editor** (la confianza, las actualizaciones, la bienvenida, la guía al poner una extensión y,
  con Claude, su enlace sin preguntar) lo pone solo el instalador;
- **lo del asistente** (la vista enfocada y sin la lista de primeros pasos de Claude; Codex abierto al
  arrancar si es el único) lo pone el instalador y, si falta, la barra al arrancar.

Lo decidido no se pisa, cada clave se mira una vez por ordenador y queda constancia para que desinstalar
quite solo lo nuestro. De paso: la vista enfocada no se ponía nunca, porque la vista sencilla la escribía
en la carpeta y es de programa.

## Scope

**Dentro**
- `ajustes-del-editor.js`: la tabla, con qué asistentes, leer con comentarios, poner lo que falta, la
  constancia, quitar y la orden suelta `--quitar`.
- `ajustes.js`: `escribirAjustes` dice lo que ha escrito, y un fichero vacío cuenta como nuevo.
- `preparar.js` (Windows) y `mac/instalar.js`: lo ponen; `preparar.js` admite `losDos` y se puede cargar
  sin instalar nada.
- Las cargas (`construir.sh`, `preparar-carga.sh`), el `.iss` (`[Files]` y `[UninstallRun]`) y los dos
  desinstaladores a mano.
- La barra: `lo-del-editor.js`, `ponerLoDelEditor` al arrancar y la frase; `preparar-paquete.js` lleva el
  módulo.
- La vista sencilla: fuera de `disfraz.json` lo que no cabe en una carpeta o ya va en los de usuario.
- `probar.sh` y `probar.ps1` miran lo puesto y la constancia; `probar-en-vscode`, los ámbitos de verdad.
- El diccionario, `instalador/README.md` y la decisión.

**Fuera**
- `chat.disableAIFeatures`, el idioma de Codex y el editor en español: propuestos en la decisión.
- Cambiar la pregunta del instalador de Windows.
- Publicar la versión.

## Checklist

- [x] 1. El módulo común — `humo.js`: «el instalador lo deja todo puesto…».
- [x] 2. Los instaladores y desinstaladores — la misma prueba, con `preparar.js` cargado y las cargas, el
  `.iss` y los desinstaladores leídos.
- [x] 3. La barra al arrancar — `humo.js`: «la barra pone lo del asistente al arrancar si falta…».
- [x] 4. La vista sencilla — `humo.js`: «la vista sencilla solo lleva lo que cabe en una carpeta…».
- [x] 5. Las pruebas de los instaladores — `probar.sh` contra una casa de mentira en este Mac; `probar.ps1`
  y `probar-en-vscode` en las máquinas de GitHub.
- [x] 6. Mutaciones a mano — ver Evidence.
- [x] 7. Todas las baterías — ver Evidence.

## Evidence

- `humo.js`, tres comprobaciones nuevas (419 → 422 antes de traer main): «el instalador lo deja todo
  puesto…», «la barra pone lo del asistente al arrancar si falta…» y «la vista sencilla solo lleva lo que
  cabe en una carpeta…».
- `probar.sh` contra una casa de mentira en este Mac, y los pasos de los ajustes de `desinstalar.command`
  tal cual: con constancia quita lo nuestro y deja lo suyo; sin ella, limpia como antes.
- Mutaciones a mano: 48, 47 tumbadas. La viva es a propósito: la guarda de la barra la tapa, y sin la guarda
  cae.
- `mapeos-codex.js`, `contrato.js`, `empresas-distintas.js`, el diccionario y `revisar-powershell.js`, en
  verde.

### La comprobación antes del commit (16-10-2026, sobre `37f53b0` con los cambios sin guardar)

Una pasada entera después del último cambio: `humo.js` 422 y 0 caídas, `contrato.js` 15, `empresas-distintas.js`
las tres, `mapeos-codex.js` 29 de 29, el diccionario y `revisar-powershell.js`, en verde. Los siete puntos de
la lista tienen su prueba; las comprobaciones nuevas se vieron caer (45 mutaciones) y pasar (sin mutar).

Lo que no corre en este Mac:
- **SUSTITUIDA** — `probar-en-vscode` (el VS Code de verdad) baja un editor fuera de la carpeta: corre en la
  máquina Windows de GitHub. Aquí lo sustituye el editor de mentira de `humo.js`, que rechaza en la carpeta
  la lista de ámbitos leída del código de VS Code. No ve un ámbito que cambie en una versión nueva.
- **SUSTITUIDA** — `probar.ps1` y `probar.sh` tras instalar de verdad: corren en GitHub (`el-exe`, `el-dmg`).
  Aquí, `probar.sh` contra una casa de mentira y los pasos de `desinstalar.command` sueltos.
- **SUSTITUIDA** — `desinstalar.ps1` no se ha ejecutado: lo miran `revisar-powershell.js` y una expresión de
  `humo.js` sobre su texto. No ven un fallo al correrlo.

## Next

- Medir en un VS Code de verdad el aviso del enlace de Claude la primera vez, y que con el ajuste no sale.
- Decidir `chat.disableAIFeatures` y el idioma de Codex.
