---
type: ftd
title: Los recordatorios, ordenados
date: 2026-10-15
status: hecho
---

# Los recordatorios, ordenados

## Intent

La revisión adversaria de las decisiones 154 y 155 encontró fallos de diseño, de corrección y de seguridad.
Jose decidió: la pantalla de rutinas se queda, ordenada. Lo que pueda ir solo, solo; la barra ayuda solo
donde hace falta; lo que decide la persona, a un clic. Y las cosas se llaman por lo que son.

## Decisión

No hay decisión nueva: lo arreglado se apunta en la 154 y en la 155, en «La revisión adversaria encontró
esto, y está arreglado».

- La pantalla se llama **Recordatorios**, como ya se llamaban en Habilidades: es lo que lleva la barra, que
  avisa a su hora y se hace con un clic. **Rutina** (la nube de Claude) y **tarea programada** (ChatGPT, o la
  app de escritorio de Claude) nombran solo lo que se hace solo en el gestor de cada asistente.
- Lo que se hace solo se prepara una vez, abajo, con **Que se haga sola**, y con la verdad de cada asistente:
  lo que usa conexiones no va a la nube de Claude, y el encargo nunca propone copiar claves allí.

## Scope

**Dentro**
- Un nombre por cosa, una sola pantalla, la fila solo si hay algo, menos botones y las fechas dichas como son.
- La nube de Claude y las tareas de ChatGPT, con la verdad (fuentes del 15-10-2026).
- Corrección: `puedeCambiar` con el sitio de verdad, `realpath` sin lanzar, el aviso que no se queda pegado y
  la pantalla que no te devuelve.
- Seguridad de la 154: nombres que entran en un encargo o en un botón, escribir a través de enlaces (al
  renombrar y en los raíles), el TOML con trampa y los topes.
- Las pruebas que matan los mutantes que sobrevivían.

**Fuera**
- Que la barra cree la rutina o la tarea programada: no hay forma desde otro programa, y la persona decide.
- Los rótulos que otras decisiones meten en un encargo (ver «Next»).

## Checklist

- [x] 1. Un nombre por cosa: «Recordatorios», Habilidades enlaza a ella, «Crear un recordatorio nuevo»
  pide «un recordatorio con botón», «Que se haga sola» una vez. Diccionario al día.
- [x] 2. La fila solo si hay una habilidad con botón o un recordatorio; el botón principal, según lo que hay.
- [x] 3. La nube de Claude con la verdad, y la app de escritorio si usa conexiones (decidido con reglas del disco).
- [x] 4. Codex con la verdad, y la frase de la 155 corregida.
- [x] 5. Menos botones: la tarjeta, dos; cada fila, tres como mucho.
- [x] 6. «el día 31, en los meses que lo tienen», y la hora que no existe, en el primer momento que sí.
- [x] 7. `puedeCambiar`, `realpath`, el aviso local y no devolver a la pantalla.
- [x] 8. Pruebas para cada mutante de la lista.
- [x] 9-12. Seguridad de la 154: nombres, enlaces, TOML y topes.
- [x] Documentación: 154, 155, diccionario y este documento.
- [x] La revisión de la PR #48: la nube solo sin ninguna conexión (ante la duda, escritorio); sin un nombre
  que valga, sin botón; los raíles no dicen «puesto» ni apuntan a lo que no escribieron; la nube, en privado
  y sin datos de clientes.

## Evidence

- `humo.js`: «recordatorios: crear y cambiar horarios sin código…» y «Recordatorios en Acciones: solo si hay
  algo…», más lo ampliado en «los recordatorios: a su hora…» y «el próximo aviso respeta…».
- `mapeos-codex.js`: cinco pruebas nuevas, y tres más para cada copia de `aplicar.js`.
- `empresas-distintas.js`: las tres empresas con una tarjeta y como mucho cinco cosas a la vista; en la
  recién montada no sale la fila.
- Mutaciones: cada comprobación nueva se rompió a mano en una copia de la rama: 61 mutaciones, las 61
  tumbadas. Dos sobrevivieron la primera vez (`01-TOOLS` y leer el fichero entero) y sus pruebas se
  reforzaron. La lista, en la decisión 155. Y el control al revés: un enlace que se queda dentro, un nombre
  válido, un horario de 99 caracteres y un TOML sano siguen pasando.
- La batería de `config.yaml` más `mapeos-codex.js`, de una vez después del último cambio, sobre `4f1849d`
  con los cambios de esta rama (los del commit): `humo.js` 398 pasadas · `mapeos-codex.js` 25 · `contrato.js`
  14 · `empresas-distintas.js` las tres enteras · diccionario limpio · `revisar-powershell.js` sin pegas.
  Otra vez después de traer main con la 156 (`bf8f9e9`): `humo.js` 402 pasadas, lo demás igual. **Verificado.**
- No se ha corrido: la barra en un VS Code de verdad (`npm run probar-en-vscode`, manual) ni Windows, donde
  las pruebas de enlaces se saltan (las pasa `windows.yml`). Las mutaciones corrieron `humo.js` solo con sus
  comprobaciones de recordatorios: no ve un mutante que solo tumbaría otra.
- Descartado: `contrato.js` falló una vez en una copia de la rama con la máquina a carga 146 (otras sesiones a
  la vez); en la rama pasa, las dos veces que se ha corrido.

## Next

- Rótulos de otras decisiones que entran en un encargo sin limpiar: la consulta de una conexión
  (`extension.js`, «Quiero "…"»), el concepto de la wiki (`cerebro.js`) y el título al cambiar un artículo.
  Llevan el mismo `limpio.etiqueta` si Jose lo pide.
- Probar «Que se haga sola» con una persona: que los pasos que le da el asistente en ChatGPT y en la app de
  escritorio de Claude se entienden.
