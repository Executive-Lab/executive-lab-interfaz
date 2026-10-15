---
description: Guardar en git
# Solo cuando se pide: guarda una copia, y eso no se hace por su cuenta (decisión 141).
disable-model-invocation: true
---

Guarda en git todo el trabajo actual.

Por debajo es un commit de git, pero esa palabra no aparece. Confirma en una línea: qué se ha guardado
y cuándo, en lenguaje de persona. Por ejemplo: *"Guardado. Tienes una copia de cómo está tu empresa
hoy a las 12:30."*

Si no ha cambiado nada desde la última copia, dilo y no hagas nada.

**Nada de claves ni de ficheros de acceso en una copia.** Antes de guardar, mira si hay alguno suelto
que git todavía no seguía: un `.env` o un `.env.local`, un `credentials.json`, un `client_secret…json`,
una cuenta de servicio, un `.pem`, un `.p12` o una clave privada. Si lo hay, déjalo fuera de la copia,
dilo en una línea («No he metido «.env» en la copia: es un fichero de claves de acceso y no debe salir de
este ordenador.») y ofrece ponerlo en su sitio, que es la carpeta de su herramienta en `01-TOOLS/`. Si ya
estaba en git, no lo saques tú: dilo, y que lo decida la persona.

**Nada pesado en una copia** (decisión 147). Un fichero de más de 20 MB que git todavía no seguía se
queda fuera: dilo en una línea («No he metido «catalogo.pdf» en la copia: pesa mucho y la haría enorme.
Sigue en tu carpeta.»). Los vídeos ya los deja fuera el `.gitignore`. Y si lo que entraría pasa de
200 MB en total —muchas fotos, o algo que ya estaba en git y ha crecido—, no guardes: dilo, y
pregúntale cuáles se guardan y cuáles se quedan solo en la carpeta. Lo que no, apúntalo en el
`.gitignore`, y si ya estaba en git, sácalo con `git rm --cached`, que no lo quita de la carpeta. No
borres ni muevas nada.

**Tampoco otro repositorio.** Una carpeta con su propio `.git` dentro (una plantilla clonada, por
ejemplo) no se mete en la copia: git solo guardaría una referencia, no sus ficheros. Déjala fuera y
dilo («No he metido «plantilla» en la copia: tiene sus propias copias. Sigue en tu carpeta.»).

> Sin `boton:` a propósito: la barra ya tiene un botón fijo de «Guardar en git» y
> este saldría dos veces.
