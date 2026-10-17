---
type: ftd
title: Solo lo que debe hacerse solo
date: 2026-10-17
author: Jose Sanchis
branch: solo-lo-que-debe
status: hecho
---

# Solo lo que debe hacerse solo

## Intent

Jose corrigió la regla P9: *«ojo: diferencia. debe hacerse solo lo que debe hacerse solo, no lo que puede. Lo que es
mejor que haga el alumno o que requiere info del alumno hay que pedírsela»*. La constitución decía «Lo que se puede
hacer solo, se hace solo» y las decisiones 181 y 184 lo habían leído como «todo lo local, gratis y reversible, sin
preguntar». Decisión 187.

## Decisión

- **P9 pasa a «Lo que debe hacerse solo, se hace solo».** Se hace solo lo que protege o mantiene sin que la persona tenga
  que pensarlo (copias, poner al día, arreglar lo que es de la barra, lo que hace falta para que funcione). Se le
  pregunta lo que necesita información suya (nivel, negocio, objetivo, datos) y lo que es mejor que decida o haga él
  (preferencias, cómo trabaja, lo que le enseña algo). Siguen las cuatro excepciones, a un clic.
- Está en la constitución y en la regla 9 del asistente (`siempre.md`, en `skills/`, en los raíles de la barra y en
  `.claude/skills/`).
- **Vuelven a preguntarse**: `nivel` («¿Qué tal te manejas con el ordenador?»), `alcance` y `personas` (se usan: perfil,
  nombre sugerido y primer mensaje), y la vista sencilla.
- **Pasan a pregunta, a un clic**: los consejos de Claude (`spinnerTipsEnabled`) y el recordatorio por costumbre.
- **Se quedan solos**: copias, punto de partida y git con su clic, el asistente que falta y «Los dos» (ya lo pidió en
  los ajustes), español y `ask` de Claude, avisos del sistema, verbos en español, raíles y marcas de RSC, poner la
  barra al día, y todo lo que solo informa.
- **A decidir por Jose**: el control remoto y la vista enfocada que ponen el instalador y la barra (decisión 143, que
  pidió él mismo).
- La tabla entera, con dónde y por qué, está en la decisión 187.

## Scope

**Dentro**
- `constitution.md`, `siempre.md` (tres copias y los raíles), `diccionario.md`.
- `arrancar.js`, `rumbo.js`, `extension.js`, `ajustes-locales.js`, `panel.js`, comentarios que citaban el título.
- `humo.js` y `empresas-distintas.js`.

**Fuera**
- Los textos históricos de las decisiones viejas: no se reescriben.
- Los instaladores (Mac y Windows) y lo que ponen al instalar.

## Checklist

- [x] Reescribir P9 y la regla 9 del asistente
- [x] Repasar lo que la barra hace sola y clasificarlo, en una tabla
- [x] Devolver `nivel`, `alcance` y `personas`, comprobando que sus datos se usan
- [x] La vista sencilla, otra vez a pregunta
- [x] Consejos de Claude y recordatorio por costumbre, a pregunta
- [x] Diccionario
- [x] Pruebas y mutaciones
- [x] Batería entera

## Evidence

Ver la decisión 187: la tabla del repaso, los números de las pruebas y las mutaciones, cada una puesta y restaurada desde
copia.

## Next

Decidir si el control remoto y la vista enfocada se preguntan también (afecta a los instaladores del Mac y de Windows).
