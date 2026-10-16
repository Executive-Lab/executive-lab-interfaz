---
type: ftd
title: Codex: confiar una vez en los enganches del arnés
date: 2026-10-17
author: Jose Sanchis
branch: codex-confia-en-los-enganches
status: hecho
---

# Codex: confiar una vez en los enganches del arnés

## Intent

Que con Codex la persona sepa que le falta confiar una vez en lo que el arnés monta en la carpeta. RSC 3.0.22
deja para Codex enganches en `.codex/hooks.json` (la memoria entre conversaciones y otros) y Codex no los corre
hasta que se confía en ellos con `/hooks`. La barra no lo comprobaba ni lo decía. Decisión 178.

## Decisión

- La confianza queda en el `config.toml` de Codex (`[hooks.state."<ruta>:<evento>:<grupo>:<manejador>"]`,
  `trusted_hash`). Formato no documentado, sacado de incidencias de openai/codex.
- La barra solo lee: `extension/src/enganches-de-codex.js` dice `confia`, `falta` o `noSe`.
- Una tarjeta por carpeta, con Codex en uso y enganches del arnés montados: «Dejarlo listo en Codex» (copia
  `/hooks`, abre Codex y lo dice: la extensión de Codex no admite texto) y «Entendido».
- P9: no confía por la persona ni escribe en la configuración de Codex.

## Scope

**Dentro**
- `extension/src/enganches-de-codex.js`, nuevo; `extension.js`, `puente.js` (`abrirEste`) y `panel.js`.
- Una comprobación nueva en `extension/prueba/humo.js`; la fila del diccionario; la decisión 178.

**Fuera**
- Calcular o escribir `trusted_hash`, `trust_level` o `--dangerously-bypass-hook-trust`.
- Comprobar que la huella siga valiendo tras un cambio del enganche.
- Los enganches de otros asistentes (Claude no los pide).

## Checklist

- [x] Documentación oficial y fuentes de RSC (`hook-trust-required`, `trustRequired`)
- [x] Lector de `hooks.state` sin seguir enlaces, con tope y «no se sabe»
- [x] Tarjeta en la sencilla y en la completa, con sus dos botones
- [x] `/hooks` al portapapeles y Codex abierto, sin tocar nada de Codex
- [x] Diccionario y decisión 178
- [x] Mutaciones
- [x] Batería entera

## Evidence

Ver la decisión 178: pruebas, mutaciones y batería.

## Next

Si Codex publica una forma oficial de pedir la confianza desde fuera (openai/codex #21615), la barra podría
dejar el paso hecho con la revisión de la persona delante. Hasta entonces, solo avisa.
