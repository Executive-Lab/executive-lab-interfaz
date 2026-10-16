---
type: ftd
title: Los datos de clientes, en Ayuda y a tiempo
date: 2026-10-15
author: Jose Sanchis
branch: los-datos-de-clientes
status: hecho
---

# Los datos de clientes, en Ayuda y a tiempo

## Intent

Punto 12 de [lo que se puede, se hace solo](lo-que-se-puede-se-hace-solo.md) («7. Los datos de clientes»): *«En
Ayuda, lo que dijo Eric: con datos de clientes, licencia de empresa, y dónde se apaga que se usen tus datos. Es
para leer, no se hace solo; ser proactiva aquí es decirlo a tiempo»*. Decisión 153.

La barra no puede hacerlo por nadie: una licencia cuesta dinero, y los ajustes son de su cuenta (P9). Lo que sí
hace sola es decirlo, una vez y antes de que los datos salgan del ordenador.

## Decisión

- **En Ayuda, «Si trabajas con datos de clientes»**: en la sencilla, entre Sugerencias y Más ayuda; y en Más
  ayuda, en Guías. Una pantalla para leer con tres partes:
  - con datos de clientes, una licencia de empresa, que de fábrica no entrena con lo que le das. Con un plan
    personal depende de un ajuste;
  - dónde se apaga en Claude y en Codex (ChatGPT), con el camino de menús y un botón a su página de ajustes;
  - lo que no se pega nunca, y que valorar con el pulgar puede mandar la conversación entera.
- **El texto, en `extension/media/datos-de-clientes.json`** (P5), con la fecha en que se comprobó y los
  enlaces a lo que dicen Anthropic y OpenAI. El diccionario la mira como a las otras tablas.
- **La tarjeta, una vez por carpeta**, con «Leerlo» y «Entendido». Sale con la primera conexión con todas sus
  claves puestas, o con el primer documento entregado. Son las dos puertas por las que entran los datos, y lo
  siguiente es hablar de ellos con el asistente. Va detrás de lo que impide trabajar, del recordatorio y de
  «Recargar ahora», y delante de todo lo demás.

## Lo que dice, comprobado el 15-10-2026

Las páginas, con lo que dice cada una, están en la decisión 153. En corto:

| Dato | Dónde se comprobó |
|---|---|
| Claude Team, Enterprise y Education, y la API, no entrenan de fábrica | `privacy.claude.com/en/articles/7996868` (18-8-2026), `claude.com/pricing`, `anthropic.com/news/updates-to-our-consumer-terms` |
| Claude Free, Pro y Max (también con Claude Code): entrena si lo permites | `privacy.claude.com/en/articles/10023580` (16-3-2026), `claude.com/pricing` («Opt-out») |
| Configuración › Privacidad › «Ayudar a mejorar nuestros modelos de IA», en `claude.ai/settings/data-privacy-controls` | `privacy.claude.com/es/articles/12109829` (3-8-2026) |
| ChatGPT Business, Enterprise y Edu, y la clave de acceso, no entrenan de fábrica; Plus y Pro, sí | `learn.chatgpt.com/docs/pricing`, `learn.chatgpt.com/docs/enterprise/chatgpt-work-cloud-security`, `developers.openai.com/api/docs/guides/your-data` |
| Settings › Data controls › «Improve the model for everyone», que vale también para las tareas de Codex. En pantalla, en inglés y con la traducción al lado: el nombre en español no está comprobado | `learn.chatgpt.com/docs/browser`, leída; `help.openai.com/en/articles/7730893`, con el buscador (da 403 a una petición automática) |
| El enlace `chatgpt.com/#settings/DataControls` | `learn.chatgpt.com/docs/use-chatgpt` y `/docs/changelog` |
| El pulgar manda la conversación entera, aunque esté apagado | `privacy.claude.com` (los dos artículos) y la ayuda de OpenAI |

## Scope

**Dentro**
- La pantalla, su tabla y los dos botones en Ayuda.
- La tarjeta: cuándo sale, que sale una vez por carpeta y dónde va en el orden.
- La prueba de humo y las mutaciones.
- La decisión 153, el diccionario y el punto 12 del repaso.

**Fuera**
- Tocar los ajustes de la cuenta de nadie o contratar nada: lo decide su negocio y cuesta dinero (P9).
- Volver a enseñar la tarjeta si un día cambia el texto: hoy sale una vez y punto (ver Next).
- «Include environments» de Codex en la nube: la barra trabaja con Codex en el editor.
- La transcripción de la clase no está en el repositorio: las palabras de Eric son las del repaso de la 142.

## Checklist

- [x] 1. El texto, en su tabla y comprobado hoy en las páginas oficiales — la prueba exige las tres partes, los
  dos caminos de menús, cada asistente de la barra y los enlaces oficiales, y que el pie diga la fecha de
  `comprobado`.
- [x] 2. En Ayuda, en la sencilla y en Más ayuda, con el nombre de su pantalla — la prueba pulsa los dos y pinta
  la pantalla entera, con «Volver» a Ayuda.
- [x] 3. La tarjeta, una vez por carpeta, sin tapar lo urgente — la prueba la saca en una carpeta nueva por cada
  puerta y mira que no vuelve; y la pinta contra cada tarjeta de antes y de después.
- [x] 4. La prueba de humo y las mutaciones — 20 mutaciones, las 20 tumbadas; tras la revisión, 39 de 39.
- [x] 5. Decisión 153, diccionario y el punto 12.
- [x] 6. La revisión adversaria, arreglada con su prueba.

## Evidence

- `humo.js`: «los datos de clientes: en Ayuda para leer, dichos una vez al entrar los primeros datos, sin tapar
  lo urgente y con los enlaces oficiales». **375 comprobaciones** (eran 374), todas en verde.
- **Veinte mutaciones, las veinte tumbadas**:
  - el panel no lee `datosDeClientes` del estado (tumba también la prueba de lo que va al lado del estado);
  - la tarjeta antes que «sin git», antes que el recordatorio, o detrás del consejo;
  - «Entendido» no lo apunta; leerlo no lo apunta; se apunta para todas las carpetas;
  - cuenta una conexión a medio hacer, o una a la que le falta una clave;
  - solo cuentan los documentos sin leer;
  - los ajustes de ChatGPT por http; lo que dice OpenAI, en otra página; el camino de ChatGPT, mal;
  - sin el botón en la Ayuda sencilla, o en Más ayuda;
  - el diccionario no mira la tabla;
  - la pantalla se salta una parte; «Volver» lleva a la principal; sin la tabla, no dice nada;
  - la extensión no manda la tarjeta.
- `contrato.js` con 14, `empresas-distintas.js` con las tres empresas, y `comprobar-diccionario.js`, en verde.
- Las páginas se miraron el 15-10-2026. Las de Anthropic y la documentación de OpenAI, leídas directamente. La
  ayuda de OpenAI (`help.openai.com`) da 403 a una petición automática, y se leyó con el buscador.
- **La revisión adversaria** (corrección, datos y seguridad) encontró esto, y está arreglado (decisión 153):
  - lo que deja la barra en `raw/` (avisos, pedidos, incidencias y «Qué falta por montar» por escrito)
    contaba como documento entregado: hacía salir la tarjeta sin documentos, y salía en «Documentos
    entregados». Ahora se salta en los dos sitios, de la misma lista, y solo arriba de `raw/`;
  - leerlo desde Ayuda antes de que entrara nada la gastaba: ahora sale igual cuando entran;
  - cuatro mutantes vivían (el fichero de acceso, un `.env.example` vacío, dos conexiones, «Entendido» sin
    repintar), y ahora caen;
  - en ChatGPT, el nombre en español no estaba comprobado: va en inglés, como la fuente, con la traducción al
    lado. Dice «las tareas de Codex», y Education entra en las licencias de Claude;
  - de seguridad, y de antes: la ruta `abrir` abría cualquier esquema y cualquier sitio. Ahora solo https; lo
    nuestro, directo; lo demás, preguntando con el sitio a la vista. Hay una prueba nueva con `javascript:`,
    `file:`, `http:` y sitios ajenos.
- Tras la revisión: `humo.js` **376** comprobaciones, todas en verde, contrato 14, empresas y diccionario. **Las
  20 mutaciones de antes y 19 nuevas, 39 de 39 tumbadas.**

## Next

- ~~Las máquinas de GitHub, y fusionar.~~ Fusionada el 15-10 (PR #38), con las cuatro máquinas en verde.
- Verlo en un VS Code de verdad, con una persona delante.
- Si el texto cambia de verdad (otra licencia, otro menú), decidir si la tarjeta vuelve a salir. Hoy sale una
  vez por carpeta y no vuelve.
- Volver a mirar las páginas antes de cada versión que toque esto: cambian, y la fecha va en pantalla.
