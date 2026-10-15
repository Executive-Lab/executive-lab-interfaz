---
type: ftd
title: Se adapta y da ideas
date: 2026-10-15
branch: se-adapta-y-da-ideas
status: hecho
---

# Se adapta y da ideas

## Intent

F6 de [simplificar-la-barra](../sdd/proposals/simplificar-la-barra.md). Jose, 05-10-2026: *«que sea
inteligente e interactiva y que solo ponga lo necesario según el caso, y en brownfield se adapte y dé
ideas»*.

Y el punto 8 de «Hay que construirlo» en [lo que se puede, se hace solo](lo-que-se-puede-se-hace-solo.md):
en una carpeta que ya tenía cosas, Eric aconseja hacer antes una copia. RSC ya la hace en `.rsc/backups/`, y
faltaba que se viera y que se dijera.

## Decisión

Decisión 152. En una carpeta que ya tenía cosas, la primera vez, la tarjeta de siempre dice lo que la barra
ya sabe leer de ella:

> Esto parece una aplicación hecha con React, con claves de Stripe y 12 documentos sin colocar.

Si el arnés guardó una copia de lo suyo al montarse, lo dice con **Ver la copia**. Después vienen dos o tres
ideas sacadas de lo que hay, de una en una y con su «Ahora no»: conectar el programa del que ya hay claves,
colocar los documentos tirados y la habilidad del catálogo que encaja. En una carpeta nueva, las ideas salen
de lo que dijo al prepararla. La lista entera está en Ayuda › Sugerencias.

Todo sale del disco y de reglas (P5), en un módulo puro, `extension/src/ideas.js`, y nada se nombra a fuego.

## Scope

**Dentro**
- La tarjeta «Esto parece …», la primera vez que la barra mira la carpeta ya montada, con «Entendido».
- La copia del primer montaje (`onboarding-transaction`), dicha cosa por cosa, con «Ver la copia»; y lo
  mismo en Ver las copias guardadas, bajo «Copias que guarda el arnés».
- Las ideas, al final de la fila de la tarjeta (la 12 de la propuesta), como mucho tres.
- Las ideas en Ayuda › Sugerencias, detrás de los consejos y sin repetir.
- El diccionario, la decisión y las pruebas.

**Fuera, y por qué**
- **Hacer las ideas solas.** Conectar un programa lo decide su negocio, y mover sus documentos o añadir una
  habilidad toca lo suyo (P9). Se dejan a un clic.
- **La barra completa.** Con `executiveLab.barraCompleta` la principal es la de antes, entera, y no lleva
  estas tarjetas.
- **Mejorar el emparejamiento de `consejos.js`.** Ver «Next».

## Checklist

- [x] 1. `ideas.js`: «Esto parece», la copia del montaje y las ideas, puras, y lo que lee del disco aparte.
- [x] 2. La extensión: la primera vez, «Entendido», «Ver la copia», Sugerencias y Ver las copias guardadas.
- [x] 3. El panel: las dos tarjetas en la fila de la principal sencilla, y la copia en Volver atrás.
- [x] 4. Las pruebas de `humo.js`: cuatro nuevas, y una más con el RSC de verdad (`--con-arnes`).
- [x] 5. `empresas-distintas.js`: una tarjeta y cinco cosas a la vista en las tres empresas.
- [x] 6. Mutaciones a mano.
- [x] 7. Diccionario, decisión 152, la propuesta y la evidencia del punto 8.

## Evidence

- `humo.js`: cuatro comprobaciones nuevas, «se adapta: …».
  - «Esto parece» dice lo que la barra sabe leer, y nada más. Incluye el ejemplo de la propuesta tal cual.
  - Dos o tres ideas de lo que hay, de una en una, y en una carpeta nueva, de lo que dijo.
  - La copia que guardó el arnés al montarse se encuentra, y solo la de lo suyo. Un enlace no se abre.
  - La barra lo dice la primera vez y lo apunta. Las ideas van de una en una hasta Sugerencias.
- `empresas-distintas.js`: en las tres empresas sale una tarjeta, con «Esto parece», un consejo y una
  versión nueva queriendo salir, y después de «Entendido». Hay cinco cosas a la vista como mucho.
- **Con el RSC de verdad** (`--con-arnes`, la 3.0.22): una web suya con claves de Stripe, un presupuesto suelto y
  su habilidad `review`, que deja ocupar a la del arnés. La barra dice «Esto parece una aplicación hecha con
  React, con claves de Stripe y 1 documento sin colocar.», y su `review` está entera en la copia. Al medirlo
  salieron dos cosas que la prueba inventada no veía:
  - su `.gitignore` no lo gestiona RSC en ese plan;
  - lo que la barra apaga antes de montar (`.rsc/.no-trunk-guard`) también va en la copia, y no se cuenta como
    suyo.
- `humo.js` con 378 comprobaciones; con `--con-arnes`, 386. `contrato.js` con 14, `empresas-distintas.js` con las
  tres empresas enteras y el diccionario, en verde.
- **Mutaciones a mano: 28, las 28 tumbadas.** En la primera tanda vivieron tres, y cada una enseñó una prueba
  floja:
  - «Ahora no» aplicado antes de cortar a tres no se veía, porque solo había tres ideas;
  - Ver las copias guardadas sin la del arnés no se veía, porque la prueba no tenía copias de git;
  - el «Ahora no» de la idea fuera de su tarjeta no se veía, porque solo se buscaba el botón.

  Las tres pruebas se reforzaron, y las tres mutaciones caen, más una cuarta en las tres empresas.
- **La revisión adversaria de seguridad** (PR #42) encontró tres cosas, y las tres están arregladas con su prueba
  (decisión 152):
  - la copia del montaje se leía entera en cada repintado: 1,4 s con 3.000 copias. Ahora tiene topes (200 copias,
    manifiestos de 256 KB como mucho, de uno en uno hasta el primer montaje) y se guarda en memoria: 144 ms la
    primera vez y 0,02 ms después;
  - el encargo de «Conectar» citaba rutas libres, donde cabía una orden, y no esperaba el OK. Ahora solo cita
    rutas sencillas, y si no dice «los ficheros de claves de la carpeta». Pide el plan antes de crear o mover nada
    y no prueba la conexión sin que se lo confirme;
  - el nombre de lo guardado entraba entero, y un `createdAt` falso elegía la copia. Ahora se recorta a 60
    caracteres, y cuenta la fecha real de la carpeta.

  Con una comprobación nueva en `humo.js` y las de antes reforzadas. **13 mutaciones, las 13 tumbadas.**
- **La revisión adversaria de corrección** (PR #42) encontró ocho cosas, y las ocho están arregladas con su prueba
  (decisión 152):
  - lo del proyecto (`requirements.txt`, el logo de la web, `~$…`) contaba como documento sin colocar;
  - «Conectar Debug» por `DEBUG_MODE`, que además tapaba los programas de verdad;
  - la rama de los ficheros de acceso no se daba nunca. Se quita, y se cuentan aparte en «Esto parece»;
  - los enlaces de RSC salían como suyos en la copia, y los nombres de Cursor y de los botones salían mal;
  - «algo» se comía «Go»;
  - «Holded e Instagram», la mayúscula y la coma;
  - Sugerencias no tenía la lista entera;
  - la primera vez daba por nueva una carpeta con algo suyo.

  Una comprobación nueva en `humo.js` («lo que lee del disco»), con la salida de verdad de `terreno`, `sueltas` y
  `papeles`, el HTML escapado en las cuatro frases y la carpeta sin arnés. Las de antes, reforzadas. **29
  mutaciones, las 29 tumbadas**, entre ellas las que la revisión encontró vivas.
- En total, **70 mutaciones a mano, las 70 tumbadas**: 28 de la primera entrega, 13 de los arreglos de seguridad y
  29 de los de corrección.

## Next

- **El emparejamiento de `consejos.js`.** Cuenta «cliente» y «clientes» como dos palabras distintas, y a
  «llevar la contabilidad de mis clientes» le propone Ventas y oportunidades en vez de Contabilidad. Pasa
  igual con el consejo de siempre, y cambiarlo mueve los consejos de todas las carpetas.
- **Con personas.** Ver con un alumno, en una carpeta suya, si «Esto parece» le dice algo que reconoce.
