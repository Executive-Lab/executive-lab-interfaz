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
- Un fichero de `keys/` que ya estaba en git: esta pantalla no lo mira.
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

## Evidence

- `humo.js`: «cada clase de acceso, su forma: clave, usuario y contraseña, fichero, entrar con tu
  cuenta y dirección; sin decirlo, como antes».
- `humo.js`: ««Pídeselo a tu informático»: sale del README, lleva la parte de seguridad, ningún
  valor, y el correo va bien codificado».
- Que el editor recodifica una dirección abierta con `Uri.parse` está mirado en su código
  (`openerService.ts`, `uri.ts`, `extHostWindow.ts`).

## Next

- Revisión adversaria y las máquinas de GitHub (PR).
- Probar en el editor de verdad soltar un fichero y abrir el correo, en Mac y en Windows.
