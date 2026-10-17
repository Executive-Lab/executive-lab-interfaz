---
type: ftd
title: Conectar sin perderse
date: 2026-10-16
author: Jose Sanchis
branch: conectar-sin-perderse
status: hecho
---

# Conectar sin perderse

## Intent

Una revisión de producto pintó la barra pantalla a pantalla. Salieron cinco sitios donde quien conecta algo se
pierde, o donde la barra le manda a hacer algo que rompe lo suyo. Decisión 167.

1. Holded con una clave que no vale: la guía desaparecía y salía «¿Cuándo caduca esta clave?».
2. «Conectar algo nuevo» mandaba «…Pregúntame cuál es»: pulsar, enviar, esperar y contestar. Y el mismo botón
   tenía dos nombres.
3. Una web hecha con React daba «Hay 3 claves fuera de sitio · Que las ordene», y ordenarlas la rompía. Y la
   tarjeta no tenía las filas de las claves de la propuesta.
4. «Pégala abajo» ya en el paso de entrar con la contraseña, y el nombre de la conexión sin tapar en dos avisos.
5. En Windows, la marca no se repintaba al cambiar el logotipo.

## Decisión

- **La clave que no vale**: con la última prueba fallida, la guía sigue en el paso donde se saca la clave. Cuándo
  caduca se pregunta solo después de una prueba buena; sin prueba, como antes.
- **El paso de la clave** (`conexiones.elPasoDeLaClave`): el último que la nombra. La contraseña solo cuenta con
  usuario y contraseña, y el fichero si lo pide y no está.
- **«Conectar algo nuevo»**: una lista en el editor con los programas de sus claves (también las de una
  aplicación) y de su perfil, y «Otro». El encargo sale con el nombre, limpio (`conectar.js`). Un solo nombre en
  los tres sitios.
- **La raíz que es una aplicación**: sus ficheros de claves están en su sitio, y siguen protegidos.
- **La tarjeta**: las claves de una aplicación dentro de las copias y las de fuera de sitio, después de lo
  urgente y antes que lo demás, con su «Ahora no» de una semana.
- **Los textos**: «pégala abajo» solo en el paso de la clave, y el nombre tapado en los avisos.
- **La marca**: el vigía compara con «/».

## Scope

**Dentro**
- `conexiones.js` (el paso de la clave, el nombre tapado en el aviso de la clave que puede escribir) y el nuevo
  `conectar.js`.
- `extension.js`: la pantalla de la conexión, la prueba, cuándo caduca, «Conectar algo nuevo», las claves en la
  tarjeta y el vigía.
- `sueltas.js`: la raíz que es una aplicación, y la carpeta principal en la tarjeta de las copias.
- `panel.js`: la guía, los tres botones, las dos tarjetas y su orden.
- Las pruebas, las mutaciones, la decisión 167 y el diccionario.

**Fuera**
- La fila 2 de la tarjeta (algo roto): necesita la radiografía en cada repintado.
- Los ficheros de acceso de la raíz de una aplicación: siguen como dice la 105.
- Reconocer en el perfil programas que la barra no nombra.

## Checklist

- [x] 1. La clave que no vale: la guía sigue y vuelve al paso de la clave; cuándo caduca, solo tras una buena.
- [x] 2. «Conectar algo nuevo» en el editor, con el nombre en el encargo; un solo nombre.
- [x] 3. La raíz que es una aplicación; las dos tarjetas de las claves, en su orden.
- [x] 4. «Pégala abajo» en su paso; el nombre tapado en los dos avisos.
- [x] 5. La marca con rutas de Windows.
- [x] 6. Las tres empresas de `empresas-distintas.js`, también con las tarjetas de las claves.
- [x] 7. Decisión 167, diccionario y todas las comprobaciones en verde, con origin/main traído.

## Evidence

- `node extension/prueba/humo.js`: 426 comprobaciones (eran 421). Las cinco nuevas:
  - «si la clave no vale, la guía sigue en el paso donde se saca y no se pregunta cuándo caduca; con una buena,
    sí»;
  - ««pégala abajo» sale solo en el paso donde se saca la clave, y el nombre va tapado en los avisos de la clave
    que puede escribir y de cuándo caduca»;
  - ««Conectar algo nuevo» pregunta qué en el editor, con lo de sus claves y su perfil, y el encargo sale con el
    nombre, limpio; un solo nombre»;
  - «las claves de una carpeta que es entera una aplicación están en su sitio, y en la tarjeta salen las de las
    copias y las de fuera de sitio, en su orden»;
  - «la marca se repinta al cambiar el logotipo también con rutas de Windows».
- Cuatro de antes, cambiadas a lo que dice la 167: la de cuándo caduca (149), la de «Esto parece» (152), la de
  la guía de uno en uno (146) y la de la principal sencilla.
- Mutaciones, cada una con las comprobaciones que tocan esto: 49, las 49 tumbadas. Eran 50; tres sobrevivieron
  por el camino (la limpieza del nombre, dos veces; y cancelar la caja con Escape) y se cerraron.
- `mapeos-codex.js` (29), `contrato.js` (15), `empresas-distintas.js` (las tres con una tarjeta y como mucho
  cinco cosas a la vista, también con las de las claves), `comprobar-diccionario.js` y `revisar-powershell.js`,
  en verde.

## La revisión

Revisión adversaria de la rama, cinco arreglos (detalle en la decisión 167, «La revisión»), cada uno con su
prueba en `humo.js` (426 a 431) y su mutación tumbada (9 de 9):

- [x] `estanSubidas`: `-c core.fsmonitor=false`, nada sin confianza en la carpeta, y guardado mientras el índice de git no cambie.
- [x] Los nombres de fichero entran en el encargo por `limpio.etiqueta` y solo si son una ruta de verdad.
- [x] «La clave no vale» sale del motivo (`noVale`), no de `ok === false`.
- [x] El `.env` de la raíz de una aplicación vuelve a decir dónde está en su conexión, sin ofrecer moverlo.
- [x] «Conectar algo nuevo» no ofrece Claude ni OpenAI cuando salen de las claves.

## Next

- La fila 2 de la tarjeta, si se encuentra una forma barata de saber que algo está roto.
- Verlo en un VS Code de verdad, en Mac y en Windows.

## Decisión 180

Los dos cabos que quedaban se cerraron en la decisión 180: la captura 4g no se reproduce (la escena entera, con el botón y el repintado, apunta bien; queda la prueba) y los ficheros de acceso de la raíz de una aplicación están en su sitio, como su `.env`.
