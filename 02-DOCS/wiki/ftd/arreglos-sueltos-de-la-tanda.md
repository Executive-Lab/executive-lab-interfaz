---
type: ftd
title: Arreglos sueltos de la tanda
date: 2026-10-16
author: Jose Sanchis
branch: arreglos-sueltos-de-la-tanda
status: hecho
---

# Arreglos sueltos de la tanda

## Intent

Tres cosas pequeñas que quedaron de la tanda de la 150 a la 159. Ninguna es una decisión nueva: son arreglos
de decisiones ya hechas, y cada una lo dice en la suya («Después: …»).

1. **La guía de un paso cada vez enseñaba una clave** (lo que quedaba de la 159). Si el asistente pegó una
   clave en «Cómo conectarla», la barra la enseñaba tal cual, y «No lo encuentro» se la pasaba al asistente.
   El PDF y el mensaje para el informático ya la tapaban.
2. **El panel completo en Documentos** (de la investigación de RSC, sobre la 151). RSC deja
   `02-DOCS/wiki/dashboard.html` cuando el asistente repasa la wiki. Solo salía en Conocimiento, que en la
   sencilla está apagado.
3. **Las rutas de Windows en lo que se pega al asistente.** Mirar los encargos que componen rutas con «/» a
   partir de `path.join`, o al revés, y arreglarlo solo si de verdad sale mal en Windows.

## Decisión

- **1. El mismo tapado en la pantalla.** `informatico.conexionALaVista` pasa por `sinClaves`, con los mismos
  valores que el PDF y el mensaje del informático, todo lo que la pantalla de una conexión enseña de lo que
  escribió el asistente:
  - los pasos;
  - de dónde se saca cada clave;
  - el nombre, que va en el título y en cada encargo de esa pantalla.

  `verConexion` manda al panel la conexión ya tapada. El panel arma «No lo encuentro» con el paso, así que
  lo que se le pasa al asistente también va tapado. No hace falta tocar el panel.
- **2. «El panel completo», junto a La foto del cerebro**, en Documentos. Es el nombre del diccionario.
  - Solo si está: sin él, no se pinta la fila.
  - Sin seguir enlaces, como la foto (`foto.quedaDentro`): un fichero de verdad dentro de la carpeta de
    trabajo. Antes bastaba con que existiera, también en Conocimiento.
  - Al pulsar se mira otra vez. Si ya no está, no se abre nada y se repinta la pantalla de donde se venía.
- **3. No sale mal: no se toca.** Ver Evidence.

## Scope

**Dentro**
- `informatico.js` (`conexionALaVista`) y `verConexion` en `extension.js`.
- `cerebro.hayPanel` y `cerebro.abrirPanel`, `verDocumentos` y `abrirPanelCompleto` en `extension.js`, y la
  fila en la pantalla Documentos de `panel.js`.
- Las pruebas: dos comprobaciones nuevas en `humo.js`, y el panel en la gestoría de `empresas-distintas.js`.
- Las decisiones 151 y 159 («Después: …») y la fila de `dashboard.html` en el diccionario.

**Fuera**
- La lista de conexiones: enseña el nombre de cada una, no sus pasos.
- Las letras de ancho completo: solo las tapa el PDF, que las cambia al escribir. En la pantalla y en el
  mensaje del informático se ven como son, igual que antes.
- «Ver el panel completo» en Conocimiento sigue llamándose así.
- El vigía de la cara de la empresa (ver Next).

## Checklist

- [x] 1. La guía de un paso cada vez, tapada en cada paso, en la lista entera y en «No lo encuentro». 7
  mutaciones, las 7 tumbadas.
- [x] 2. El panel completo en Documentos: solo si está, junto a la foto, sin seguir enlaces y mirado otra vez
  al pulsar. 14 mutaciones, las 14 tumbadas.
- [x] 3. Las rutas de los encargos en Windows: revisadas, ninguna sale mal.
- [x] 4. Decisiones 151 y 159, diccionario y este documento.
- [x] 5. Todas las comprobaciones en verde, con origin/main traído.

## Evidence

- `node extension/prueba/humo.js`: 421 comprobaciones (eran 419). Las dos nuevas:
  - «la guía de un paso cada vez tapa las claves como el PDF: en cada paso, al verlos todos y en lo que «No lo
    encuentro» le pasa al asistente». Siembra claves de mentira armadas al correr, de ocho formas: tal cual,
    en una dirección, en base64 dentro de otro, partida por espacios, con un espacio de ancho cero en medio,
    un PIN corto, con usuario y clave en una dirección y con forma de clave de Stripe. También en el nombre y
    en CREDENTIALS.md. Mira lo que se manda al panel, la pantalla y «No lo encuentro» en los ocho pasos, y la
    lista entera.
  - «El panel completo, en Documentos junto a la foto: solo si está, sin seguir enlaces, y si se va, se
    repinta sin él». Sin él y con él, el nombre y el sitio, que se abre ese y nada más, que se va entre
    pintarlo y pulsarlo, una carpeta con su nombre, un enlace a otro sitio, un enlace a otro fichero de la
    carpeta y la wiki enlazada fuera.
- Mutaciones, cada una con las comprobaciones que tocan esto: 21, las 21 tumbadas.
  - La guía: sin tapar la pantalla; los pasos, el nombre o de dónde se saca sin tapar; sin las claves cortas;
    con el tapado flojo de los guiones (`taparClaves`); y sin los valores de la carpeta.
  - El panel: la fila sin el panel, nunca, con otro nombre, lejos de la foto o sin decir de dónde viene;
    Documentos sin decir si está; seguir el enlace; no mirar que quede dentro; una carpeta que vale; abrir
    sin mirar otra vez; decir que no se abrió; y sin él, a otra pantalla o sin repintar.
  - Una sobrevivió a la primera pasada: con `stat` en vez de `lstat`, un enlace a otro fichero de la carpeta
    pasaba por el panel (el de fuera ya lo paraba `quedaDentro`). Cerrada con su prueba.
- `mapeos-codex.js` (29), `contrato.js` (15), `empresas-distintas.js` (las tres con una tarjeta y como mucho
  cinco cosas a la vista), `comprobar-diccionario.js` y `revisar-powershell.js`, en verde.
- Cada comprobación nueva, vista caer (las mutaciones) y vista pasar sin mutar, con la batería entera.
- **Las rutas en Windows**, leídas una a una en `extension/src`: leído, no medido en un Windows. Todas las que
  se componen con «/» llevan dentro un nombre suelto o una ruta que ya va con «/»:
  - `01-TOOLS/${proveedor}/…`: el proveedor es el nombre de una carpeta (`carpetaDe` rechaza «/» y «\»), y el
    fichero sale de `readdirSync` de esa carpeta. Así en `sinPython`, en los ficheros de acceso, en las
    consultas, en «Cambiarla por una de solo lectura», en la guía en PDF, en «Terminar de conectar» y en
    «Conectar …» de las ideas.
  - Las claves y los ficheros sueltos (`sueltas.js`) van con `path.posix.join`, desde el 28-09.
  - Los documentos, la wiki y la búsqueda pasan `path.relative` por `split(path.sep).join('/')`.
  - Lo que falta del suelo lo dice RSC, con «/» en sus constantes.
  - Lo que manda el panel solo pega el `id` de la conexión.

## Next

- **El vigía de la cara de la empresa, en Windows** (visto de paso, no es un encargo):
  `uri.fsPath.includes('02-DOCS/wiki/brand/')` no casa nunca con una ruta de Windows, que va con «\». Ahí solo
  repinta al cambiar `marca.md`, y no al cambiar el logo. Se arregla con `path.sep`, o comparando la ruta
  relativa.
- Las letras de ancho completo, en la pantalla y en el mensaje del informático, si se quiere lo mismo que el
  PDF.
- El nombre de la conexión sale sin tapar en dos sitios que no son la guía: el aviso de la clave que puede
  escribir («Cambiarla por una de solo lectura») y el de cuándo caduca. Solo importa si el asistente pegó una
  clave en la primera línea del README.
- Un mismo panel con dos rótulos: «El panel completo» en Documentos y «Ver el panel completo» en
  Conocimiento.
- Verlo en un VS Code de verdad.
