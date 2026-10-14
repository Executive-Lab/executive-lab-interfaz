---
type: ftd
title: La barra pasa a la 3
date: 2026-10-14
author: Jose Sanchis
branch: a-la-3
status: in-progress
---

# La barra pasa a la 3

## Intent

Es el punto 6 de `ftd/lo-que-se-puede-se-hace-solo.md`. En la clase del 13-10-2026 los alumnos montaron
RSC desde el chat, con la 3.0.22, y la 3.x se pone al día sola dentro de su serie. La barra seguía
fijada en la 2.0.15. Ante una carpeta más nueva, ofrecía «Ponerla como la de la clase», que la bajaba a
la 2.0.15: justo lo contrario de lo que hizo la clase.

Ensayo del 14-10 con la 3.0.22: fallan 14 comprobaciones de la batería y 3 del contrato.

## Lo que hay que saber de la 3.x

- **Se actualiza sola.** Lo hace al empezar cada conversación, con `npx`, dentro de su serie. Se apaga
  con `RSC_NO_UPDATE_CHECK`, que la barra ya pone en el entorno del asistente (C4). En las carpetas de
  la barra, por tanto, las versiones las sigue llevando la barra.
- **No se protege de un arnés más viejo.** No compara versiones: un `sync` de la 3.0.22 sobre una
  carpeta de la 3.0.25 la baja sin avisar.
- **El dial está retirado** desde la 2.1.0. `--accompaniment` se acepta y no se usa.
- **Pregunta main o ramas** (`--workflow`), solo en proyectos de software o mixtos. Si no se le dice,
  elige ramas para «Una plataforma completa».
- **Cierra `main` al asistente** si ve CI, un despliegue (`vercel.json`, `netlify.toml`…) o dos
  personas en los últimos 50 commits. Además, la primera vez mueve a una rama `rescue/…` los commits
  de `main` que no se habían subido.
- **Sube sola** `01-TOOLS/` y la wiki a una rama `rsc/knowledge` del remoto (`knowledge-sync`,
  encendido por defecto).
- **Da permiso al asistente** para guardar, subir y abrir PR sin preguntar (`git-permissions`,
  encendido en una instalación nueva).
- **Habilidades retiradas:** `bro`, `eli5` y `show-me`. **Nuevas:** `connect-tool` y el agente
  `finding-verifier`. **Guardianes nuevos:** `branch-guard` y `copy-guard`, entre otros.
- **Pone su propio freno** a los no técnicos (#273, arreglado en la 2.0.16), así que nuestro rodeo
  sobra.

## Decisión

Decisión 145. P7 pasa de «la versión exacta de la clase» a **«la serie de la clase, y la lleva la
barra»**:

- La barra trae una versión de la serie, hoy la 3.0.22.
- **Lo que va por detrás** (una 3 más vieja o una 2) **se pone al día solo**, por P9.
- **Lo que va por delante está al día.** La barra no corre encima un arnés más viejo ni ofrece bajarla.
  Lo que necesite el arnés en esa carpeta espera a que la barra se ponga al día, y eso pasa solo.
- El arnés no se actualiza por su cuenta en las carpetas de la barra (C4).

Y por P9, en las carpetas de la barra:
- **`main` abierto** (`--workflow main` al montar, y `rsc main unlock` al pasar a la 3), como se hizo en
  clase;
- **apagado lo que sale del ordenador sin preguntar:** `knowledge-sync off` y `git-permissions off`.
  Compartir con el equipo será un botón, cuando toque.

## Scope

**Dentro**

- El paquete de la 3.0.22 en `media/harness`, y la versión en todos los sitios donde está escrita.
- La comparación de versiones por series, y la pieza «La versión del arnés».
- El montaje: fuera la pregunta del dial, con `--workflow main`, y los tres interruptores.
- Los nombres y el catálogo: habilidades retiradas y nuevas, y guardianes.
- La regla 7, con los verbos nuevos.
- Las pruebas, el diccionario y la constitución (P7).

**Fuera**

- Quitar el rodeo del freno: va aparte, con su prueba, porque depende de qué frenos pone la 3.x en
  cada tipo de proyecto.
- Correr el arnés de una carpeta que va por delante bajándolo de npm sin Node, que pediría resolver las
  dependencias a mano. Si hiciera falta, se hace después.

## Checklist

- [x] 1. El paquete y la versión, en todos los sitios, también en este repositorio.
- [x] 2. La versión por series: por detrás se pone al día solo, y por delante está al día sin que nadie la
  baje ni corra encima un arnés más viejo. El código de bajarla, quitado.
- [x] 3. El montaje: sin dial, `--workflow main`, y `main` abierto y lo que sale apagado también al pasar
  de la 2, sin perder lo que el equipo ya tenía apagado.
- [x] 4. Nombres, catálogo, guardianes y los seis interruptores nuevos.
- [x] 5. La regla 7.
- [x] 6. Las 14 + 3 comprobaciones del ensayo, en verde y sin bajar el listón.
- [x] 7. Constitución (P7), decisión 145, diccionario y batería larga.
- [x] 8. Revisión adversaria: seguridad y corrección. Dos fallos altos y reproducidos, y siete más,
  arreglados con su prueba (decisión 145).

## Evidence

- `humo.js`: 366 comprobaciones pasadas. `contrato.js`: 14, con la 3.0.22 de verdad.
  `empresas-distintas.js`: las tres empresas enteras. Diccionario, en verde.
- Con el arnés de verdad se vio lo que la 3 cambia, y cada cosa quedó con su prueba:
  - escribe un borrador de los innegociables, así que un plan con SDD queda listo;
  - pone su propio freno a quien no es técnico, y el nuestro se aparta sin frenar dos veces;
  - deja el perfil fuera de git (`info/exclude`), así que en un clon los nombres se preguntan una vez y
    traerlo sin nadie delante espera a su botón;
  - en Codex monta tantas habilidades como declara, que ya no son 32.
- **Un fallo propio, encontrado al subir este repositorio:** con `.rsc/` puesta, el `sync` rehizo las
  decisiones apagadas solo con las marcas de la carpeta y se perdieron `audit`, `gitmoji` y
  `worktree-cleanup`. `decidirComoLaBarra` pone antes las que declara `.rsc.json`, y hay prueba.
- Las marcas, la rama principal abierta y `gitPermissions: false` se comprueban en el montaje de verdad
  de la batería larga.

- **La revisión adversaria encontró dos fallos altos, reproducidos:**
  - npx, en una carpeta que va por delante, leía su `.npmrc` y ejecutaba lo que quisiera solo con
    abrir la barra. Ya no se usa npx: ahí se mira con el arnés de dentro y no se escribe.
  - Una 2 pasaba a la 3 por «Añadir», «Arreglar» o «cambiar de asistente» sin que la barra decidiera
    nada, y el `repair` de la 3 perdía las decisiones del equipo. Ahora se decide en un solo sitio
    (`decidir.js`, desde `rsc.correr`) y justo antes de escribir.

  Y siete más, también arreglados:
  - lo que sale del ordenador, apagado también en lo ajeno;
  - `.no-auto-update` como marca;
  - `git-permissions off` solo en lo nuevo, y dicho si falla;
  - un «ramas y PR» del equipo, respetado;
  - `optOuts` raros;
  - sin seguir enlaces;
  - fuera el dial de la plantilla del perfil.

## Next

- Quien trabaje en la carpeta principal de este repositorio tiene que poner al día su arnés:
  `npm install --prefix extension/media/harness` y luego el `sync` del de dentro.
- Los nombres del arnés y de la empresa viven en el perfil, que con la 3 es de cada uno y no viaja en
  git. Si hiciera falta que un clon no los pregunte, tendrían que ir en un fichero del equipo.
- Quitar el rodeo del freno, que con la 3 sobra en casi todas las carpetas.
