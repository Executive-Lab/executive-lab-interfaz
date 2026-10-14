---
type: ftd
title: La barra se va a la organización Executive-Lab
date: 2026-10-09
status: hecho
---

# La barra se va a la organización Executive-Lab

## Intent

Jose, 08-10-2026: *«el proyecto está en Executive-Lab, no? la org»*, y *«si, dale»* a preparar el
traslado. Decisión 140.

## Scope

**Dentro**
- La 0.47.0, que acepta las dos direcciones y no saca quién publica de la dirección.
- Después, el traslado del repositorio, la dirección de `git` de esta carpeta, los README y una versión que
  pregunte ya a la dirección nueva.

**Fuera**
- Publicar como la organización: las versiones las sigue publicando `minarkap`.

## Checklist

- [x] 1. `sitio.js`, y `version.js` y `avisos.js` lo usan — 6 mutantes, los 6 tumbados.
- [x] 2. Revisión de seguridad — sin nada que bloquee; un refuerzo aplicado (el paquete, subido por
  `minarkap`; las seis versiones publicadas lo cumplen) y un detalle (nuestra dirección con un punto
  detrás ya no se tapa). 2 mutantes más, los 2 tumbados. VS Code de verdad: «todo bien».
- [x] 3. La 0.47.0 publicada (09-10-2026).
- [x] 4. El traslado, el 14-10-2026, con el sí de Jose y la 0.49.0 recién publicada.
- [x] 5. Tras el traslado: la dirección vieja redirige (301, en la API y en la descarga); contra GitHub de
  verdad, el código de la barra pregunta a la vieja, recibe la 0.49.0 con el paquete en `Executive-Lab` y la
  da por buena para ponerla sola. `origin`, README y `sitio.js` (`REPO` en la organización) cambiados; la
  0.50.0 ya pregunta allí.

## Evidence

- `humo.js` 357: «solo se baja un paquete de fiar… y el traslado a la organización», y la limpieza de
  los avisos con las dos direcciones.

## Next

- El paso 4 es decisión de Jose: cuándo.
