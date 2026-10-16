---
type: ftd
title: Conexiones II, cada acceso su forma
date: 2026-10-15
status: hecho
---

# Conexiones II: cada acceso, su forma

## Intent

F5 de [simplificar-la-barra](../sdd/proposals/simplificar-la-barra.md): las clases de acceso,
«Pídeselo a tu informático» y el raíl. Jose: *«que se pueda saber qué preguntar a informáticos y
técnicos»*. Sigue a [conexiones-paso-a-paso](conexiones-paso-a-paso.md) (F4).

## Decisión

Decisión 156.

- La clase de acceso va en una línea de `CREDENTIALS.md` (`- Tipo de acceso: Una clave`), junto a la
  URL. No va en una columna: la tabla de RSC no tiene una forma fija, y una herramienta sin variables
  no tendría fila.
- Cinco clases, cada una con su pantalla. Sin la línea, como antes.
- El mensaje para el informático: lo de cada herramienta lo escribe el asistente en el README
  (`## Para tu informático`). La parte de seguridad la pone la barra, escrita una vez.

## Scope

**Dentro**
- Leer la clase de acceso (línea, o columna si la hay) y elegir la pantalla: un campo; usuario y
  contraseña juntos; «Suéltalo aquí» a `keys/`; «Entrar»; una dirección.
- «Pídeselo a tu informático» en cada conexión, con «Copiarlo» y «Mandarlo por correo».
- El raíl, en las dos copias de `SKILL.md`, y «Conectar algo nuevo».

**Fuera**
- Una clave que no es de esta carpeta y solo tiene minúsculas: la regla de lo que parece una clave
  no la ve.
- Probar a soltar un fichero de verdad en el editor: lo hace quien pruebe la barra a mano.

## Checklist

- [x] 1. `conexiones.js`: la clase de acceso (`comoSeEntra`), la forma de cada clave, la sección
  para el informático y `ponerFicheroDeAcceso`.
- [x] 2. `informatico.js`: el mensaje, la parte de seguridad, sin valores, y el `mailto:`.
- [x] 3. `extension.js` y `panel.js`: las rutas, las cinco formas, la pantalla «Para tu informático»
  y soltar el fichero en su conexión.
- [x] 4. El raíl, en las dos copias, y el diccionario.
- [x] 5. Dos pruebas en `humo.js`.
- [x] 6. Mutaciones a mano: 24, las 24 tumbadas. La lectura que no sigue enlaces tiene su prueba,
  pero no su mutación: romperla haría leer /dev/zero hasta llenar la memoria.
- [x] 7. Revisión de seguridad (PR #40): tapar la clave por todas las vías, el `keys/.gitignore`
  comprobado con git, el `.anterior` con fecha, un `.json` que dice lo que es, expresiones con tope,
  el asunto en una línea, y primero la parte de seguridad. Dos pruebas nuevas en `humo.js`.
  Mutaciones: 28, las 28 tumbadas (dos, después de afinar la prueba: la base64 de una clave corta y la
  clave partida sin separadores).
- [x] 8. Revisión de corrección (PR #40): la clase de acceso por la primera frase, sin lo negado y con
  «o»; la prueba sin el fichero; el nombre que busca la prueba; ningún secreto como texto; solo se
  tapan las claves secretas; «Entrar con tu cuenta» con claves por poner; «dónde se saca» por su
  cabecera. Y lo que el revisor vio sin prueba: soltar encima de la barra, Windows y su frontera, los
  topes, `keys/` como enlace, el mismo fichero, el nombre oculto. Mutaciones: 35, 34 tumbadas y una
  equivalente (quitar a quién va lo soltado al cambiar de pantalla: ya lo devuelve a documentos el
  repintado).
- [x] 9. Main traído: la decisión pasa de 154 a 156.

## Evidence

- `humo.js`: «cada clase de acceso, su forma: clave, usuario y contraseña, fichero, entrar con tu
  cuenta y dirección; sin decirlo, como antes».
- `humo.js`: ««Pídeselo a tu informático»: sale del README, lleva la parte de seguridad, ningún
  valor, y el correo va bien codificado».
- `humo.js`: «el mensaje para el informático no deja pasar una clave por ninguna vía, ni correos, y
  enseña las páginas ajenas» y «un fichero de acceso no entra en git aunque keys/ diga lo contrario,
  no pisa los de antes y un .json dice lo que es».
- Que el editor recodifica una dirección abierta con `Uri.parse` está mirado en su código
  (`openerService.ts`, `uri.ts`, `extHostWindow.ts`).

## Next

- Las máquinas de GitHub (PR #40).
- Probar en el editor de verdad soltar un fichero y abrir el correo, en Mac y en Windows.
