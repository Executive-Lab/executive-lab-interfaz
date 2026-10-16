// ¿El historial de esta carpeta es de alguien, o lo creó la barra?
//
// Lo preguntan dos: la barra (`terreno.historialAjeno`), con su git que no
// bloquea, y los raíles (`aplicar.js`), que también se ponen a mano y entonces
// no hay barra que lo diga (decisión 161). Para que no haya dos versiones de la
// misma verdad, las preguntas a git y lo que se concluye viven aquí, y cada uno
// pone su manera de preguntar.
//
// Nuestro quiere decir que nació en la barra, y eso no lo cambia que luego guarde
// en él quien trabaja aquí, ni que sea un clon en otro ordenador (B6). Dos
// pruebas, de más fuerte a menos:
//   1. la marca que deja la barra al crearlo (`git config --local`), que no viaja
//      en un clon;
//   2. su raíz, el primer commit: si es uno de los que escribe la barra —el punto
//      de partida o una copia—, nació aquí. Esa sí viaja.
// Sin `.git`, o recién creado y sin ningún commit, no hay nada que proteger.
//
// Y lo que no se puede leer es de alguien (revisión de la 161). `rev-list` sale
// con error igual en un historial recién creado que en una rama huérfana de un
// repositorio con commits, o con un git que no deja leer (`safe.directory`, un
// HEAD roto). Solo es «recién creado» si HEAD apunta a una rama que todavía no
// existe y no hay ninguna otra referencia.

const fs = require('node:fs');
const path = require('node:path');

const MARCA_DEL_HISTORIAL = 'executivelab.historial';
const ASUNTOS_DE_LA_BARRA = /^(Punto de partida|Copia automática|Copia de seguridad) — /;

// Cada `yield` es una pregunta a git (sus argumentos), y recibe `{ codigo, salida }`.
function* preguntas() {
  const marca = yield ['config', '--local', '--get', MARCA_DEL_HISTORIAL];
  if (marca.codigo === 0 && marca.salida.trim() === 'nuestro') return false;

  const raices = yield ['rev-list', '--max-parents=0', 'HEAD'];
  if (raices.codigo !== 0) {
    const cabeza = yield ['symbolic-ref', '-q', 'HEAD'];
    if (cabeza.codigo !== 0) return true;
    const referencias = yield ['for-each-ref', '--count=1', '--format=%(refname)'];
    return !(referencias.codigo === 0 && !referencias.salida.trim());
  }
  const [primera, ...otras] = raices.salida.split('\n').map((l) => l.trim()).filter(Boolean);
  // Dos raíces son dos historias juntadas, y una de ellas no es nuestra.
  if (!primera || otras.length) return true;

  const asunto = yield ['log', '-1', '--format=%s', primera];
  return !(asunto.codigo === 0 && ASUNTOS_DE_LA_BARRA.test(asunto.salida.trim()));
}

const sinHistorial = (raiz) => !fs.existsSync(path.join(raiz, '.git'));

// Con un git que espera (los raíles).
function esAjenoEsperando(raiz, git) {
  if (sinHistorial(raiz)) return false;
  const camino = preguntas();
  let paso = camino.next();
  while (!paso.done) paso = camino.next(git(paso.value));
  return paso.value;
}

// Con uno que no (la barra).
async function esAjeno(raiz, git) {
  if (sinHistorial(raiz)) return false;
  const camino = preguntas();
  let paso = camino.next();
  while (!paso.done) paso = camino.next(await git(paso.value));
  return paso.value;
}

module.exports = { MARCA_DEL_HISTORIAL, ASUNTOS_DE_LA_BARRA, esAjeno, esAjenoEsperando };
