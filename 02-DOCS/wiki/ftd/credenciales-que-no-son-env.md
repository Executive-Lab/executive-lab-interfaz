---
type: ftd
title: Las credenciales que no son un .env
date: 2026-10-16
status: hecho
---

# Las credenciales que no son un .env

## Intent

Cerrar el pendiente de `cada-clave-tiene-un-sitio.md` (22-09): cuentas de servicio, claves y
certificados, `token.json` de OAuth. La 105 ya cubría casi todo; esta cierra lo que faltaba. Decisión 170.

## Scope

- Reconocer por forma: `refresh_token` dentro de un `.json`, `.ppk`.
- Mirar un nivel más de carpetas (con tope); lo de una aplicación sigue siendo suyo.
- Las que lee el sistema de un sitio fijo (`.netrc`, `.pgpass`, `.git-credentials`, `.htpasswd`,
  `.aws/credentials`): se protegen, no se mueven.
- Taparlas si el asistente las imprime.

## Checklist

- [x] Averiguar qué cubría la 105/156/167 con una carpeta de prueba.
- [x] `sueltas.js`: `refresh_token`, `.ppk`, segundo nivel, `ficherosDelSistema` en `paraProteger`.
- [x] `conexiones.js`: `secretosDeTexto`.
- [x] Prueba en `humo.js` y mutaciones tumbadas.
- [x] Decisión 170.

## Evidence

Ver la decisión 170 y la comprobación «las credenciales que no son un .env» de `humo.js`.

## Next

Decidir los ficheros de acceso de la raíz de una aplicación (apuntado en la 167).
