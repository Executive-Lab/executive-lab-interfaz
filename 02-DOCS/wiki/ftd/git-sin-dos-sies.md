---
type: ftd
title: Git, con un solo sí
date: 2026-10-16
author: Jose Sanchis
branch: git-sin-dos-sies
status: hecho
---

# Git, con un solo sí

## Intent

De la revisión de producto. Casi ningún alumno no técnico tiene git. Sin él, la carpeta enseñaba «Ponerla
ahora» en vez de «Preparar esta carpeta». Si pulsaba Preparar, «Ponerlo primero» le devolvía a la misma
pantalla, y al terminar salía «Ya está. Puedes preparar la carpeta.». Decía que sí dos veces a lo mismo y
esperaba parado: en un Mac, hasta 45 minutos. Decisión 165.

## Decisión

- **Pulsar «Preparar esta carpeta» es el sí de poner git (P9)**, dicho debajo del botón en una línea. Solo
  donde la barra lo pone sola (Mac y Windows). En el resto, como en la 87.
- **Mientras se pone, las preguntas.** En cuanto git está, se monta solo con ellas. Si acaba antes la
  persona, la barra cuenta la espera y deja «Seguir sin copias».
- **Si git falla o tarda**: una frase con su salida (Volver a intentarlo, o Terminar de prepararla, y
  Seguir sin copias). Lo contestado se guarda (`respuestas.js`) y no se vuelve a preguntar.
- **Si se recarga a mitad**: al abrir, con git y lo contestado, se termina solo, con las guardas de P9 (con
  confianza, en una carpeta conocida, sin nada que preguntar, la misma rama y nada de nadie). El historial,
  sin nadie, solo en una carpeta vacía. Si no, «Terminar de prepararla» con un clic.
- **Windows dice la verdad.** Su instalador pide elevarse con una cuenta de administrador, y
  `/CURRENTUSER` no hace nada (fuentes en la decisión). La promesa pasa a «si Windows te pide permiso, dile
  que sí». Sin administrador, `/DIR=%LOCALAPPDATA%\Programs\Git`. El código 2 (le dijo que no) se dice.
- **Git recién puesto se busca por su sitio**: el PATH del editor abierto no lo ve. Y su carpeta va delante
  para RSC.

## Scope

**Dentro**
- `arrancar.js`: preparar mientras se pone git, lo guardado, retomar sin nadie y dejar de esperar.
- `respuestas.js`, nuevo.
- `extension.js`: el montaje separado de lo de después, «Seguir sin copias», «Ponerla ahora» que termina
  lo que esperaba, y retomar al abrir.
- `git.js` de la barra (una sola instalación a la vez y la línea), `brujula.js` y `panel.js`.
- `instalador/comun/git.js` (Windows) y `entorno.js` (git por su sitio y en el PATH de RSC).
- Pruebas, mutaciones, la decisión 165, el diccionario y el README del instalador.

**Fuera**
- Detectar que en un Mac se dijo que no al diálogo de Apple: no se ha podido comprobar sin tocar el sistema.
- Cancelar la barra de progreso de git.
- Guardar lo contestado si se dejan las preguntas a medias.

## Checklist

- [x] 1. Preparar sin git: git mientras se pregunta, y montado en cuanto está, sin otro clic.
- [x] 2. Falla, tarda, Windows dice que no, o no aparece: una frase con su salida, y lo contestado
  guardado.
- [x] 3. «Seguir sin copias», después de fallar y mientras espera.
- [x] 4. Recarga a mitad: se termina solo cuando P9 lo deja, y si no, con un clic.
- [x] 5. Windows: la promesa, `/DIR` sin administrador, el código 2 y git por su sitio. Fuentes en la
  decisión.
- [x] 6. Pantalla: la línea, «Terminar de prepararla», mientras se pone, la espera y el aviso con sus dos
  salidas.
- [x] 7. Diccionario y decisión 165.
- [x] 8. Comprobaciones en verde y mutaciones (ver Evidence).

## Evidence

- `node extension/prueba/humo.js`: de 419 a 428. Las nueve nuevas están en la decisión 165. Cambian tres de
  antes: la de «sin git se pregunta» pasa a ser la de donde no se puede poner solo, y dos que leían el
  código buscaban formas que han cambiado.
- `extension/prueba/windows.js`: una nueva (git fuera del PATH), que solo corre en la máquina Windows de
  GitHub.
- `mapeos-codex.js` (29), `contrato.js` (15), `empresas-distintas.js` y `comprobar-diccionario.js`, en
  verde.
- Mutaciones a mano: 14 hechas, las 14 tumbadas. Las guardas de retomar tras recargar (confianza, carpeta conocida, nada que preguntar, misma rama, nada de nadie, historial solo en carpeta vacía), lo guardado (de otra carpeta no vale; se guarda; se olvida al montar), una sola instalación a la vez, el código 2 de Windows, `/DIR` sin administrador, git buscado por su sitio y su carpeta delante para RSC. Tres sobrevivieron a la primera y se les puso la prueba que las tumba, en las que ya había: la confianza y la carpeta conocida (la prueba de retomar tenía git sin poner, y el «no» venía de git, no de su guarda), lo guardado de otra carpeta, y `git()` buscando donde deja git su instalador en Windows.

## Next

- Verlo en un Windows de alumno: el aviso de Windows lanzado desde la barra, que puede salir parpadeando
  en la barra de tareas, y una cuenta sin administrador con `/DIR`.
- En un Mac, saber que se le dijo que no al diálogo de Apple sin esperar los 45 minutos.
