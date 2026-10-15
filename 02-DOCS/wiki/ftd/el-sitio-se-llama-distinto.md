---
type: ftd
title: El sitio se llama distinto
date: 2026-10-15
status: hecho
---

# El sitio se llama distinto

## Intent

Incidencia GR4ZCV (15-10-2026): «Hay una versión nueva de la barra: la 0.51.0» y, al pulsar «Actualizar
ahora», «No he podido ponerla». El repositorio pasó a llamarse `Executive-Lab/executive-vscode-interfaz`, y
el paquete llegaba con un nombre que la barra no daba por suyo (`sinPaquete`). Decisión 148.

## Scope

**Dentro**
- Dar por bueno el paquete del repositorio de su propia release, si está en una de nuestras cuentas.
- `REPO` y `SITIOS` con el nombre nuevo, y los README también.
- El informe de «Algo va mal» dice qué barra corre.

**Fuera**
- El nombre del repositorio: Jose elige quedarse con el nuevo («aún no tiene nadie la barra»).
- Publicar la 0.52.0: la saca la sesión que lleva esa versión.

## Checklist

- [x] 1. La regla nueva en `version.js`, y las cuentas en `sitio.js`.
- [x] 2. La prueba de humo con la release tal cual la contestó GitHub el 15-10: con el código de `main`
  falla (`hoy`), y con el arreglo pasa.
- [x] 3. Mutaciones a mano: 4, las 4 tumbadas (sin el control de cuentas, sin el de mismo repositorio,
  sin guardar el sitio de la release, y la cuenta comparada por el principio del nombre).
- [x] 4. El informe dice `Barra: <versión>`, o `(no se sabe)`.
- [x] 5. Revisión adversaria de seguridad: no bloquea. Probó un repositorio de un alumno en la
  organización, una `html_url` cambiada, las mayúsculas, lo recordado en el almacén, el canal de pruebas
  y las redirecciones. Para todo eso siguen haciendo falta el autor, quien sube el fichero y la huella.
  Dos notas menores: el control de cuentas solo frena un traslado a una cuenta ajena, y las cuentas salen
  de `SITIOS`, así que añadir un sitio en otra cuenta la da por nuestra.
- [x] 6. Las máquinas de GitHub: el-dmg, windows, vscode-de-verdad y el-exe en verde (PR #32).

## Evidence

- `humo.js`: «si el repositorio cambia de nombre, la barra sigue poniéndose al día (GR4ZCV)» y «el informe
  de incidencia dice por qué falló, no solo que falló».

## Next

- Sacar la 0.52.0 con esto dentro. La saca la sesión que lleva esa versión.
- Una barra 0.47–0.51 que aparezca por ahí hay que ponerla a mano una vez, porque lleva la regla vieja.
