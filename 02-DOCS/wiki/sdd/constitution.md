---
type: constitution
title: Las no-negociables de la interfaz del arnés
description: Las reglas que este proyecto no rompe, numeradas y comprobables. Salen de lo que ya ha fallado, no de buenas intenciones.
timestamp: 2026-09-21T12:00:00Z
topic: harness
---

# Las no-negociables

Este proyecto pone una barra lateral sin fricción encima del arnés RSC, para gente
que lleva una pyme y no es técnica. Todo lo de abajo está escrito **después** de
romperlo al menos una vez; el registro está en `docs/decisiones.md`.

Cada regla es comprobable. Si no se puede comprobar, no es una regla: es un deseo.

## P1 · Ninguna pantalla sin salida

Toda pieza que la barra diga que falta tiene que traer un botón que haga algo. Una
lista de problemas sin nada que pulsar es peor que no tener la lista.

**Se comprueba**: `humo.js` recorre tres carpetas distintas y exige `arreglo` en
toda pieza que no esté en `si` o `noAplica`.

## P2 · Ni una palabra que no esté en el diccionario

Todo texto que sale en pantalla pasa por `docs/diccionario.md` **antes** de
escribirse. Lo que no esté, se propone y se espera; no se inventa sobre la marcha.
Lo que lee el asistente y no el alumno se marca `// diccionario: interno`.

**Se comprueba**: `node docs/comprobar-diccionario.js`, y está en `publicar.sh`.

## P3 · Nunca un fallo silencioso

Un fallo que no da error, no se ve y deja la pantalla llena es la forma de fallar
que este proyecto no se permite. Todo lo que se apunta por dentro acaba en el
informe de «Algo va mal»; ningún `false` de retorno se tira sin mirarlo.

**Se comprueba**: la prueba del informe de incidencia exige que el motivo viaje con
el código que se le dicta al tutor.

## P4 · Lo de esa persona no se toca

En una carpeta que ya era de alguien no se borra, no se mueve, no se renombra y
**no se escribe en su historial**. Si hay otro montaje puesto a mano, se pide
permiso antes de nada; si dice que no, no se instala nada.

**Se comprueba**: ninguna rama sobre historial ajeno lleva el paso
`puntoDePartida`, y hay una prueba que lo recorre estado por estado.

**Enmienda del 24-09-2026, decisión 3 de Jose en el programa `todo-cuadra`.** RSC borra la
habilidad, el comando o el agente de esa persona que se llame como uno suyo, y enlaza el suyo
encima. Por cada choque se le pregunta, y solo con su sí explícito se hace una de dos cosas:

- **sobrescribir** la suya con la del arnés, que la guarda en sus copias (`.rsc/backups/`), y se le
  dice dónde;
- **cambiarle el nombre** a la suya para que quepan las dos.

Sin respuesta no se monta nada. Su historial sigue sin escribirse. **Se comprueba**: la prueba de
choques exige que, sin respuesta, no cambie ni un fichero suyo.

## P5 · Determinista lo que se puede leer del disco

Clasificar, decidir la rama, calcular qué preguntar, los mapeos de conexiones,
credenciales, comandos, habilidades y ayudantes: todo eso se lee, no se adivina.
Lo que hace falta **entender** —a qué pertenece una clave suelta, de qué va una
carpeta desordenada— se delega al asistente con un encargo de cuatro partes y una
función que comprueba el resultado mirando el disco.

**Se comprueba**: `rumbo.js` es una función pura y se prueba con partes inventados;
cada encargo tiene `comprobar()`, y hay una prueba que lo pone a falso y a
verdadero.

## P6 · La acción de un botón se coge tal cual viene

Quien construye la acción es quien tiene los datos. La pantalla la pinta, no la
rehace. Rehacerla costó tres versiones y acabó escribiendo la palabra `undefined`
en la conversación de alguien.

**Se comprueba**: ningún botón de la pantalla puede pedir algo sin texto.

## P7 · Una versión del catálogo para toda la cohorte

El arnés se fija exacto, sin rangos, y subir de versión es una decisión que se
toma y se escribe — nunca un efecto secundario de un `npm install`.

**Se comprueba**: la versión tiene que decir lo mismo en los cinco sitios donde
está escrita.

## P8 · Lo que se descarga no entra en el proyecto

Editores, perfiles y cachés de prueba viven fuera de la carpeta. El arnés escanea
lo que hay dentro para decidir qué es este proyecto, y no lee el `.gitignore`: un
VS Code descargado le hizo creer que esto era un proyecto de React.

**Se comprueba**: `du -sh .` y la evidencia del plan en `.rsc.json`.

## P9 · Lo que se puede hacer solo, se hace solo

Jose, 14-10-2026: *«lo que se pueda hacer automático (a través de RSC, con la extensión o como sea) se
haga solo. La barra debe ser inteligente y proactiva»*. Sale de la clase del 13-10, la primera sin la
barra: cada atasco era algo que alguien tuvo que hacer a mano.

Si la barra, el arnés o el asistente pueden hacer algo sin la persona, lo hacen **en cuanto lo ven**,
sin esperar a que nadie pulse, y lo dicen en una frase. Solo se pone un botón cuando hace falta su sí,
y eso pasa en cuatro casos:

- **sale de su ordenador en su nombre**: un aviso, una publicación, subir algo (decisión 131);
- **no se puede deshacer**: borrar, sobrescribir lo suyo o bajar la versión del arnés (P4);
- **cuesta dinero**;
- **lo decide su negocio**: qué conectar, qué permisos tiene una clave o qué se queda fuera.

Incluso entonces se deja todo preparado, a un clic (P1). Proactiva quiere decir que se adelanta: lo que
va a fallar pronto se arregla o se avisa antes de que falle. Por ejemplo, una clave que caduca, un
vídeo enorme que iba a entrar en git o una conexión con más permisos de los que se pidieron.

**Se comprueba**: cada arreglo de la barra que cambia algo en la carpeta, o se hace al abrirla, o dice
cuál de los cuatro casos lo retiene. Esa prueba es la primera tarea de
`ftd/lo-que-se-puede-se-hace-solo.md`, y **hasta que exista, esta regla todavía no se comprueba**.

Choca con P7 en un punto: RSC 3 se pone al día sola dentro de su serie. P7 se enmienda en el trabajo de
pasar a la 3.
