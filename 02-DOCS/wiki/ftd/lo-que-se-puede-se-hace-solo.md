---
type: ftd
title: Lo que se puede hacer solo, se hace solo
date: 2026-10-14
author: Jose Sanchis
branch: se-hace-solo
status: in-progress
---

# Lo que se puede hacer solo, se hace solo

## Intent

Jose, 14-10-2026, tras repasar la clase del día anterior: *«Quiero que revisemos todo lo que puede
ayudar a los alumnos con esto. Mete en las reglas y la constitución de este proyecto que lo que se pueda
hacer automático (a través de RSC, con la extensión o como sea) se haga solo. La barra debe ser
inteligente y proactiva.»*

La clase («Conecta tu negocio a la IA y crea tu dashboard», 13-10-2026) se hizo **sin la barra**: RSC se
instaló pegando un enlace en el chat. Por eso enseña dónde se atasca un alumno cuando no hay nadie que
haga las cosas por él:

- la instalación desde el chat falló dos veces en directo, y el asistente la arregló por su cuenta;
- las claves se pegaron a mano en el `.env` («tenéis que guardar este fichero»);
- en el montaje se preguntó «¿los cambios de código van a main o en ramas?», y la respuesta fue «marcad
  main, ya os explicaré qué es esto»;
- el asistente se puso a hablar en catalán;
- la prueba de Odoo falló porque la clave podía escribir, aunque la conexión funcionaba;
- un alumno quería meter cien gigas de fotos y vídeos;
- y Eric mandó instalar Obsidian para hacerle una foto al cerebro.

## Decisión

Decisión 142. **Si la barra, el arnés o el asistente pueden hacer algo sin la persona, lo hacen al
verlo y lo cuentan en una frase.** Un botón solo se pone cuando hace falta su sí, y eso pasa en cuatro
casos:

- lo que **sale de su ordenador en su nombre**;
- lo que **no se puede deshacer**;
- lo que **cuesta dinero**;
- lo que **decide su negocio**.

Incluso entonces se deja todo preparado y queda a un clic. Proactiva quiere decir que se adelanta: lo
que va a fallar pronto se arregla, o se avisa, antes de que falle.

Va en dos sitios:

- **en la constitución, como P9**, que es lo que obliga a la barra;
- **en las reglas del asistente, como regla 9** de `siempre.md`, que es lo que obliga al asistente de
  cada alumno.

## Scope

**Dentro**

- El principio, en la constitución y en las reglas.
- El repaso de abajo: qué ya se hace solo, qué pasa a hacerse solo, qué hay que construir y qué sigue
  pidiendo un sí.
- Hacer, en orden, lo que el repaso marca. Cada punto se cierra con su prueba.

**Fuera, y por qué**

- **Lo que pide un sí por los cuatro casos.** P9 no lo quita: lo deja preparado.
- **Publicar una versión.** Se hace con `/publicar-una-version`, cuando Jose lo diga.
- **Cambiar la clase.** Las instrucciones de Circle y la guía paso a paso que Eric va a sacar del vídeo
  son de Executive Lab, no de este repositorio.

## El repaso

### Ya se hace solo

- La barra se pone al día sola (`executiveLab.actualizarSola`, decisión 132).
- Al abrir la carpeta:
  - pone el modo sencillo si está encendido;
  - devuelve a su sitio lo que la barra dejó en los ajustes del asistente;
  - repone los raíles si son de antes;
  - si está puesto, guarda solo de vez en cuando.
- Lo que revienta por dentro de un botón se apunta solo como aviso (decisión 131). Mandarlo pide un sí.
- Las claves se guardan en su sitio y con su formato desde el formulario de la conexión.

### Pasa a hacerse solo

En el repaso salieron siete arreglos de `terreno.js` que esperaban a que se pulsara. Al hacerlo, cinco
pasaron a hacerse al abrir la carpeta, y la barra lo dice en una frase. Dos se quedan con su botón.

| Pieza | Botón | Ahora |
|---|---|---|
| Lo que el arnés hace solo | Arreglarlo | Solo. Ya lo hacía la activación (C2) |
| La versión del arnés, atrasada | Ponerlo al día | Solo |
| Lo que este proyecto traía puesto (un clon) | Traerlo ahora | Solo, si no hay nada que preguntar |
| Lo que debería estar puesto | Traerlas ahora | Solo |
| Cosas del arnés fuera de sitio | Arreglarlo ahora | Solo, si no hay nada que decidir |
| Freno ante órdenes peligrosas | Ponerlo ahora | **Botón**: solo sale en carpetas cuyo historial no creó la barra, y toca sus ajustes (P4, C-4) |
| Copias de seguridad aquí | Ponerlas ahora | **Botón**: guarda la carpeta entera. Hasta que lo pesado quede fuera de git (punto 8), podría meter gigas en el historial, y eso no se deshace. Si eligió no tenerlas, es suyo |

Además, se hacen solos otros dos:
- «El asistente, montado aquí» → «Terminar de prepararlo», cuando el montaje se quedó a medias y no
  queda nada por preguntar;
- «Lo que pone la barra» → «Ponerlo al día», que ya lo hacía la decisión 108.

«Ajustarlo ahora», el bloque de `CLAUDE.md`, se queda con su botón, porque toca un fichero suyo (C-4).

`repair` sin `--yes` solo devuelve lo que estaba. Lo que hay que decidir se queda pendiente, y antes
guarda copia (`scripts/lib/repair.js`), así que hacerlo solo no decide nada por nadie.

Los demás botones con `como: 'solo'` son para ir a una pantalla (ver las conexiones, darle documentos,
abrir la revisión o el plan) y se quedan como están. El de bajar la versión del arnés no pasa a
hacerse solo, porque no se puede deshacer.

### Hay que construirlo (sale de la clase)

1. **Pasar a RSC 3.** La clase va en la 3.0.22, que se pone al día sola dentro de su serie. La barra
   sigue fijada en la 2.0.15 y, ante una carpeta más nueva, ofrece bajarla. En el ensayo del 14-10 con
   la 3.0.22 fallaron 14 comprobaciones de la batería y 3 del contrato. Lo que hay que hacer:
   - el montaje manda `--workflow main` y deja de preguntar por el dial, que está retirado;
   - P7 pasa de «la versión exacta» a «la serie de la clase»;
   - se quita el rodeo del freno, porque RSC ya pone el suyo.
2. **La prueba que dice que la clave puede escribir.** `connect-tool` empieza en solo lectura, y su
   prueba escribe `FAIL — this user can write`. Hoy la barra contesta «No conecta, y no sé decirte por
   qué». Tiene que decir que conecta pero que la clave puede cambiar y borrar. Lo que se haga después
   lo decide su negocio, así que se pregunta una vez y con dos opciones: dejarla así o quedarse con una
   de solo lectura.
3. **Lo pesado, fuera de git, solo.** `no-entra-en-git.js` solo aparta secretos, y «guardar solo»
   guardaría cien gigas de vídeos. Las fotos, los vídeos y los archivos grandes se quedan fuera de
   «Guardar en git» y de la copia, y la barra lo dice en una frase.
4. **Cuándo caduca una clave.** Al pegarla, se pregunta cuándo caduca, con opciones. La barra avisa
   antes de esa fecha, y si la prueba dice que no vale, menciona que puede haber caducado.
5. **Añadir una habilidad sin mandar a nadie a la barra.** Hoy la regla 7 dice «dile que la pulse».
   Que el asistente la pida y la barra la añada sola, con la versión de la clase.
6. **La foto del cerebro.** Una vista del cerebro dentro de la barra, para hacer el reto de la clase sin
   instalar Obsidian.
7. **Los datos de clientes.** En Ayuda, lo que dijo Eric: con datos de clientes, licencia de empresa, y
   dónde se apaga que se usen tus datos. Es para leer, no se hace solo; ser proactiva aquí es decirlo a
   tiempo.
8. **Una carpeta que ya tenía cosas.** Eric aconseja hacer antes una copia. RSC ya guarda lo que
   sobrescribe en `.rsc/backups/`; falta que se vea y que se diga.
9. **Por comprobar**: si después de montar la barra evita el «reinicia VS Code o abre otra
   conversación» que salió en la clase.

### Sigue pidiendo un sí

| Qué | Por qué no se hace solo |
|---|---|
| Mandar un aviso a Executive Lab | Sale de su ordenador en su nombre (decisión 131) |
| Subir a GitHub | Sale de su ordenador en su nombre |
| Bajar la versión del arnés | No se puede deshacer |
| Sobrescribir o renombrar lo suyo | No se puede deshacer (P4) |
| Qué permisos tiene una clave | Lo decide su negocio |
| Contratar una licencia o un plan | Cuesta dinero |

## Checklist

- [x] 1. P9 en la constitución, con lo que la comprobará.
- [x] 2. La regla 9 del asistente, en las dos copias de `siempre.md`, y la prueba de las reglas, que pasa
  de ocho a nueve.
- [x] 3. Decisión 142 y este repaso.
- [x] 4. La prueba de P9: cada arreglo que cambia algo en la carpeta, o se hace al abrirla, o dice cuál de
  los cuatro casos lo retiene.
- [x] 5. Lo que se puede, al abrir la carpeta y dicho en una frase. Son cinco de los siete, y los otros
  dos se quedan con su botón, cada uno por su motivo.
- [x] 6. Pasar a RSC 3: `ftd/la-barra-pasa-a-la-3.md`, decisión 145.
- [ ] 7. La prueba que dice que la clave puede escribir.
- [ ] 8. Lo pesado, fuera de git.
- [ ] 9. Cuándo caduca una clave.
- [ ] 10. Añadir una habilidad sin mandar a nadie a la barra.
- [ ] 11. La foto del cerebro.
- [ ] 12. Los datos de clientes, en Ayuda.

## Evidence

- Los huecos de la clase se comprobaron en el código el 14-10:
  - la prueba que escribe `FAIL — this user can write` no casa con ningún patrón de `PORQUE_FALLA`
    (comprobado con `node`);
  - `no-entra-en-git.js`, `guardar.js` y `git.js` no miran ni el tamaño ni si es un vídeo;
  - `cerebro.js` no tiene vista de grafo;
  - no hay nada sobre caducidad ni sobre privacidad.
- Ensayo de la 3.0.22 en una copia: con la 2.0.15, 364 comprobaciones en verde; con la 3.0.22, 14
  fallos en la batería y 3 en el contrato.
- Tras los puntos 1 a 3: `humo.js` con 358 comprobaciones y el diccionario, en verde. PR #22, con las
  cuatro de GitHub en verde.
- Tras los puntos 4 y 5: `humo.js` con 362 comprobaciones, el diccionario en verde y cuatro pruebas
  nuevas de P9:
  - el barrido de `terreno.js`: 7 arreglos se hacen solos, 6 piden un sí y 5 llevan a otra pantalla;
  - el orden, el fallo apuntado y la frase de `solo.js`;
  - sin nadie delante, ninguna ventana: cuatro caminos, una carpeta vacía y las dos confirmaciones;
  - el panel: nada sin confianza, nada si no sale, «ya estaba» no cuenta, y el aviso espera a que el
    panel diga «listo».
- **Dieciséis mutaciones, las dieciséis tumbadas**:
  - el freno sin decir qué lo retiene;
  - bajar la versión, hecho solo al abrir;
  - un caso que no es de P9;
  - no mirar la confianza;
  - «ya estaba» contado como arreglado;
  - el aviso sin panel, perdido;
  - el montaje sin saber que no hay nadie delante;
  - el montaje que sigue aunque haya que preguntar;
  - tocar lo suyo sin nadie;
  - firmar un plan que cambia sin nadie;
  - seguir sin nadie aunque haya preguntas;
  - lo que falla, contado como hecho;
  - los raíles, repetidos;
  - el orden al revés;
  - la activación que no lo llama;
  - «listo» que no suelta el aviso.
- `contrato.js` con 14 comprobaciones, y `empresas-distintas.js` con las tres empresas enteras.
- **Contra el arnés de verdad**: en `--con-arnes`, el clon de verdad se trae ahora sin nadie delante,
  sin preguntar nada y sin abrir ninguna ventana. Resultado: 370 comprobaciones pasadas.

- **La revisión adversaria** (corrección y seguridad) encontró cuatro fallos que bloqueaban, y los
  cuatro están arreglados con su prueba (decisión 142, «La revisión adversaria del segundo paso»):
  - un repositorio preparado borraba carpetas del ordenador al traerlo (reproducido);
  - la confianza del editor no protege con el instalador;
  - sin nadie delante se podía crear el historial;
  - un plan que no se podía comparar se daba por bueno.

  Hay además cinco arreglos menores. Hoy lo que se hace solo, se hace solo en una carpeta que este
  ordenador ya conoce: **la primera vez que un alumno abra con esta barra una carpeta montada antes,
  tendrá que pulsar un botón del arnés una vez**.

## Next

Por orden:
- el 6, que es lo que hace falta antes de dar la barra a la comunidad;
- después el 8, que desbloquea poner copias solas;
- y luego el 7 y del 9 al 12.

Además, de la revisión:
- ~~Contarle a Eric el fallo del borrado.~~ Comprobado versión a versión: solo pasa en la 2.0.x (la
  2.0.15 y la 2.0.20 borran; desde la 2.1.0 se para). Como la barra pasa a la 3, Jose decidió no
  contarlo (14-10).
- **Lo que la barra lanza con git, sin `core.fsmonitor` ni los ganchos de la carpeta.** Ya pasaba antes
  de este cambio, y es poco probable, pero una carpeta traída con su `.git` podría ejecutar algo suyo.
- **Mirar `--dry-run` antes de un `repair` solo**, por si algún día una pieza con arreglo automático
  sale sin `.rsc.json`.
