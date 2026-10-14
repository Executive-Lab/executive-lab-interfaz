---
type: worklog
title: Lo que se puede hacer solo, la barra en la 3 y lo pesado fuera de las copias
description: De la clase del 13-10 sin la barra salen P9 (142), el paso a la serie 3 de RSC (145) y que las fotos y los vídeos no entren en git (146).
timestamp: 2026-10-14T16:00:00Z
topic: interfaz
status: unprocessed
sources: []
---

## Lo que se hizo

- **La clase del 13-10, leída como banco de pruebas.** En «Conecta tu negocio a la IA y crea tu
  dashboard» los alumnos montaron RSC desde el chat, sin la barra. Por eso se ve dónde se paran: doce
  fricciones, apuntadas en `ftd/lo-que-se-puede-se-hace-solo.md`.
- **P9 en la constitución y la regla 9 en `siempre.md`** (decisión 142, PR #22 y #24): lo que se puede
  hacer solo se hace solo. Quedan cuatro excepciones: lo que sale en nombre de la persona, lo que no se
  deshace, lo que cuesta dinero y lo que es suyo decidir. Al abrir la carpeta, la barra arregla sola lo
  que puede y lo dice en una línea.
- **La barra pasa a la 3** (decisión 145, PR #28). P7 pasa a ser «la serie de la clase, y la lleva la
  barra». La 3.0.22 viene dentro. Lo que va por detrás se pone al día solo, y lo que va por delante se
  mira sin escribir y sin npx. Al pasar de la 2, la barra decide en un solo sitio (`decidir.js`, desde
  `rsc.correr`): apaga lo que sale del ordenador, abre `main` en lo suyo y respeta lo que el equipo ya
  había apagado.
- **Lo pesado no entra en las copias** (decisión 146, PR #30): vídeos al `.gitignore`, más de 20 MB
  fuera de la copia, y si lo nuevo pasa de 200 MB en total no se guarda. Con eso, poner copias se hace
  solo.

## Lo que salió por el camino

- **El `sync` de la 3 perdía las decisiones del equipo** cuando `.rsc/` ya existía: rehace los
  `optOuts` con las marcas que encuentra. Pasó al subir este repositorio. Ahora se ponen antes las que
  declara `.rsc.json`.
- **npx leía el `.npmrc` de la carpeta** que va por delante, solo con abrir la barra (revisión de
  seguridad, H1). Ya no se usa npx.
- **La copia de después de «Volver a como estaba» metía las claves**, porque se guardaba sin la lista
  de lo que no entra. Era un fallo de antes, y salió al escribir la 146.
- **La revisión de la 146 encontró un fallo de seguridad**: un repositorio dentro de la carpeta (una
  plantilla clonada) entraba en la copia, y luego cada vistazo de la barra a git corría su `fsmonitor`
  y sus filtros `clean`. Con las copias puestas solas, bastaba con abrir la carpeta. Y seis de
  corrección, entre ellos que un fichero que ya estaba en git podía crecer sin tope y que con miles de
  pesados la orden no cabía. Todo arreglado, con 12 de 12 mutaciones tumbadas.
- **Avisar a Eric no tenía sentido**: lo que se le iba a contar solo pasaba en la 2, y vamos por la 3.

## Lo que queda

- Los puntos 7 y del 9 al 12 de `ftd/lo-que-se-puede-se-hace-solo.md`. Son estos: el mensaje de
  prueba de solo lectura, la clave que caduca, añadir habilidades sin mandar al alumno a la barra, la
  vista del cerebro y la confidencialidad de los datos de clientes en Ayuda.
- Los nombres del arnés y de la empresa en un fichero del equipo, porque el perfil ya no viaja.
- Quitar el rodeo del freno.
- Publicar la versión siguiente: lo decide Jose.
