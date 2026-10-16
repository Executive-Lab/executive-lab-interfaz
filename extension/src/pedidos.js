// Lo que el asistente le pide a la barra (decisión 150), y lo que la barra le deja
// cuando un encargo no cabe en su caja (decisión 166, abajo).
//
// La regla 7 de los raíles decía «dile que la busque en la barra y la pulse»: el
// alumno, que estaba hablando con el asistente, tenía que irse a otra pantalla a
// buscar un botón. Ahora el asistente le pregunta y, con su sí, deja escrito el
// pedido: un fichero vacío `02-DOCS/raw/pedidos/<id>.habilidad`. La barra lo ve,
// añade esa habilidad del catálogo de la clase y contesta en `<id>.hecho`, que
// es lo que el asistente lee para decírselo.
//
// Esto es lo que no necesita el editor: dónde está la carpeta, qué pedidos hay,
// qué hacer con cada uno y cómo se contesta. Lo de añadirla, con el arnés, lo
// hace el panel (`atenderLosPedidos`).
//
// ── Sin seguir enlaces ───────────────────────────────────────────────────
//
// La carpeta viene en el repositorio, y quien lo prepara elige lo que hay en
// ella. Si `pedidos` fuera un enlace a otra carpeta del ordenador, o un
// `<id>.hecho` un enlace a un fichero suyo, la barra borraría y escribiría allí
// solo con abrir la carpeta. Así que cada trozo del camino tiene que ser una
// carpeta de verdad, el pedido un fichero de verdad, y la respuesta se escribe
// nueva: se quita lo que hubiera (quitar un enlace no toca lo que apunta) y se
// crea un fichero que no puede existir ya.

const fs = require('node:fs');
const path = require('node:path');

const CARPETA = ['02-DOCS', 'raw', 'pedidos'];
const PIDE = '.habilidad';
const CONTESTA = '.hecho';
// Tres por vez, y cinco sin preguntar en cada sesión: un repositorio con cien
// pedidos no tiene a la barra añadiendo habilidades una hora sin que nadie lo vea
// (revisión de seguridad, 4). De los que hay se leen cincuenta como mucho.
const POR_VEZ = 3;
const POR_SESION = 5;
const LEIDOS = 50;
const ID = /^[a-z0-9-]{2,40}$/;

function carpeta(raiz) {
  if (!raiz) return null;
  let donde = raiz;
  for (const trozo of CARPETA) {
    donde = path.join(donde, trozo);
    try {
      const info = fs.lstatSync(donde);
      if (info.isSymbolicLink() || !info.isDirectory()) return null;
    } catch {
      return null;
    }
  }
  return donde;
}

// Los identificadores pedidos, en orden. Un enlace que se llame `.habilidad` no
// es un pedido. El tope de cada vuelta lo pone quien atiende, después de apartar
// los que esperan a que la persona conteste (revisión de corrección, 6).
function losQueHay(raiz) {
  const donde = carpeta(raiz);
  if (!donde) return [];
  let entradas;
  try {
    entradas = fs.readdirSync(donde, { withFileTypes: true });
  } catch {
    return [];
  }
  return entradas
    .filter((e) => e.isFile() && e.name.endsWith(PIDE) && e.name.length > PIDE.length)
    .map((e) => e.name.slice(0, -PIDE.length))
    .sort()
    .slice(0, LEIDOS);
}

// Un cambio del vigía que es un pedido. Con las dos barras: en Windows la ruta
// va con `\` (revisión de corrección, m9).
const esUnPedido = (ruta) => /[\\/]02-DOCS[\\/]raw[\\/]pedidos[\\/][^\\/]+\.habilidad$/.test(String(ruta || ''));

const pelar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Si pide una que no está, las que más se parecen: por un trozo del
// identificador o por una de sus palabras en español («facturas» → invoicing).
function lasQueSeParecen(id, catalogo = []) {
  const trozos = pelar(id).split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
  if (!trozos.length) return [];
  return catalogo
    .map((c) => {
      const suyos = [...String(c.id).split('-'), ...(c.palabras || []).map(pelar)];
      const aciertos = trozos.filter((t) => suyos.some((s) => s === t || (s.length >= 4 && t.length >= 4 && (s.startsWith(t) || t.startsWith(s))))).length;
      return { id: c.id, aciertos };
    })
    .filter((c) => c.aciertos > 0)
    .sort((a, b) => b.aciertos - a.aciertos || a.id.localeCompare(b.id))
    .slice(0, 3)
    .map((c) => c.id);
}

// Qué hacer con un pedido, sin tocar nada. `sola` dice si la barra puede
// añadirla sin preguntar (P9: carpeta de confianza, que este ordenador conoce y
// con un arnés que no va por delante).
function queHacer(id, { catalogo = [], enDisco = [], sola = false } = {}) {
  const del = ID.test(id) ? catalogo.find((c) => c.id === id) : null;
  if (!del) return { que: 'noEsta', parecidas: lasQueSeParecen(id, catalogo) };
  if (enDisco.includes(id)) return { que: 'yaEstaba', nombre: del.nombre };
  return { que: sola ? 'anadir' : 'preguntar', nombre: del.nombre };
}

// Cómo se pide, en una frase. `comoSePide` es el `/id` de Claude o el `$id` de
// Codex; con Codex, una del arnés se pide con palabras, y esa frase no cabe detrás
// de «Se pide con» (revisión de corrección, 7).
const sePide = (id, comoSePide) => (/^[/$][a-z0-9-]+$/.test(comoSePide || '') ? `Se pide con ${comoSePide}.` : `Se pide nombrándola: «${id}».`);

// Lo que se le contesta al asistente, que es quien lo lee y se lo dice al alumno.
// El nombre del fichero solo sale si es un identificador de verdad: lo que lee el
// asistente con la voz de la barra no lo escribe un repositorio (revisión de
// seguridad, 2). Y ninguna respuesta le da una orden que correr: con el arnés por
// delante, `npx` en esta carpeta leería su `.npmrc` (revisión de seguridad, 1; la
// barra tampoco lo usa ahí, `rsc.correr`).
function respuesta(que, { id, comoSePide = '', parecidas = [] } = {}) {
  const nombre = ID.test(id || '') ? `«${id}»` : 'Ese nombre';
  switch (que) {
    case 'porDelante':
      return 'En esta carpeta el arnés es más nuevo que el de la barra, y ella no puede añadirla. Díselo a la persona: se podrá cuando la barra se ponga al día. No la añadas tú.';
    case 'sinConfianza':
      return 'Esta carpeta no es de confianza en el editor, y la barra no añade nada que se pida desde ella. Si la persona confía en la carpeta, que la busque en Habilidades (skills) y la pulse.';
    case 'noEsta':
      return parecidas.length
        ? `${nombre} no está en el catálogo de la clase. Las que más se parecen: ${parecidas.join(', ')}. Pide la que sea con su nombre exacto.`
        : `${nombre} no está en el catálogo de la clase. Pide una con su nombre exacto del catálogo.`;
    case 'yaEstaba':
      return `Ya estaba puesta. ${sePide(id, comoSePide)}`;
    case 'anadida':
      return `Añadida. ${sePide(id, comoSePide)}`;
    case 'noQuiere':
      return 'La persona ha dicho que ahora no. No la vuelvas a pedir hasta que te lo diga.';
    default:
      return 'No se ha podido añadir. Dile que la busque en Habilidades (skills) y la pulse.';
  }
}

// La respuesta de otra vez se quita al ver un pedido nuevo, antes de decidir: si
// no, el asistente leería la vieja como la de ahora (revisión de corrección, 1).
// Quitar un enlace no toca lo que apunta.
function olvidarLaRespuesta(raiz, id) {
  const donde = carpeta(raiz);
  if (!donde || !id || /[\\/]/.test(id)) return;
  try {
    fs.rmSync(path.join(donde, `${id}${CONTESTA}`), { force: true });
  } catch { /* una carpeta con ese nombre: `contestar` tampoco podrá */ }
}

// Si el pedido sigue ahí: una pregunta que se contesta tarde no responde a un
// pedido que el asistente ya retiró.
function sigue(raiz, id) {
  const donde = carpeta(raiz);
  if (!donde || !id || /[\\/]/.test(id)) return false;
  try {
    return fs.lstatSync(path.join(donde, `${id}${PIDE}`)).isFile();
  } catch {
    return false;
  }
}

// Contestar y quitar el pedido. Devuelve si la respuesta quedó escrita. El pedido
// se quita igual: uno que no se puede contestar no se repite cada minuto.
function contestar(raiz, id, texto) {
  const donde = carpeta(raiz);
  if (!donde || !id || /[\\/]/.test(id)) return false;
  let escrita = false;
  const hecho = path.join(donde, `${id}${CONTESTA}`);
  try {
    fs.rmSync(hecho, { force: true });
    fs.writeFileSync(hecho, `${texto}\n`, { flag: 'wx' });
    escrita = true;
  } catch { /* una carpeta con ese nombre, o sin permiso: sin respuesta */ }
  try {
    fs.unlinkSync(path.join(donde, `${id}${PIDE}`));
  } catch { /* ya no estaba */ }
  return escrita;
}

// ── Y al revés: lo que la barra le deja al asistente (decisión 166) ───────
//
// Un encargo que no cabe en el enlace —en Windows se corta sobre los 2.048
// caracteres, y «Que las ordene» ya ocupa 2.212— se deja aquí, en un fichero, y
// al asistente le llega una sola línea que lo nombra. Igual en los dos sistemas,
// para que lo que pasa en Windows se vea también en un Mac.
//
// Esta carpeta, y no otra, porque es el buzón entre los dos: ya está fuera de
// git en el bloque de la barra, fuera de «Documentos entregados» y del barrido
// de la bandeja. Y si en esta carpeta no está fuera de git, no se escribe nada.
//
// Sin seguir enlaces, como lo de arriba: lo que ya hay en el camino tiene que ser
// una carpeta de verdad, lo que falta se crea de uno en uno, y el fichero se
// escribe nuevo (`wx`), con un nombre que no puede estar.
const ENCARGO = /^encargo-\d{8}-\d{9}-[0-9a-f]{6}\.md$/;
// Los últimos que se guardan. Uno que no se llegó a mandar se queda un rato; no
// se acumulan para siempre.
const ENCARGOS_GUARDADOS = 20;

// Si esta carpeta queda fuera de git. Primero se mira el bloque de la barra en el
// `.gitignore`, la línea exacta (uno de antes de la decisión 150 no la lleva); y
// después, lo que de verdad dice git (`check-ignore`): un `!` más abajo, o un
// `.gitignore` de otra carpeta, puede dejar entrar lo que el bloque deja fuera.
// Si git dice que no, no está fuera. Si no hay git o no contesta, vale lo que dice
// el bloque, como antes (decisión 166, la revisión).
async function quedaFueraDeGit(raiz) {
  if (!elBloqueLoDeja(raiz)) return false;
  let codigo = -1;
  try {
    ({ codigo } = await require('./procesos').git('-C', raiz, 'check-ignore', '-q', '--', `${CARPETA.join('/')}/encargo-x.md`));
  } catch { /* sin git: vale el bloque */ }
  return codigo !== 1;
}

function elBloqueLoDeja(raiz) {
  if (!raiz) return false;
  let texto;
  try {
    const fichero = path.join(raiz, '.gitignore');
    if (!fs.lstatSync(fichero).isFile()) return false;
    texto = fs.readFileSync(fichero, 'utf8');
  } catch {
    return false;
  }
  const bloque = require('../media/railes/no-entra-en-git').elQueHay(texto);
  return Boolean(bloque) && bloque.split(/\r?\n/).some((linea) => linea.trim() === `${CARPETA.join('/')}/`);
}

// La carpeta, creando lo que falte menos `02-DOCS`: sin él no hay arnés, y no se
// fabrica media pieza del suelo.
function carpetaParaEscribir(raiz) {
  if (!raiz) return null;
  let donde = raiz;
  for (const [i, trozo] of CARPETA.entries()) {
    donde = path.join(donde, trozo);
    let info = null;
    try {
      info = fs.lstatSync(donde);
    } catch (error) {
      if (error.code !== 'ENOENT' || i === 0) return null;
    }
    if (info && (info.isSymbolicLink() || !info.isDirectory())) return null;
    if (!info) {
      try {
        fs.mkdirSync(donde);
      } catch {
        return null;
      }
    }
  }
  return donde;
}

// Los de otras veces, menos los últimos. Solo ficheros de verdad con nuestro
// nombre: quitar un enlace no toca lo que apunta, pero no se toca lo que no es nuestro.
function recogerLosViejos(donde) {
  let suyos;
  try {
    suyos = fs.readdirSync(donde, { withFileTypes: true }).filter((e) => e.isFile() && ENCARGO.test(e.name)).map((e) => e.name).sort();
  } catch {
    return;
  }
  for (const nombre of suyos.slice(0, Math.max(0, suyos.length - ENCARGOS_GUARDADOS))) {
    try {
      fs.unlinkSync(path.join(donde, nombre));
    } catch { /* ya no estaba */ }
  }
}

// Deja el encargo y dice dónde, relativo a la carpeta de trabajo y con `/`, que
// es como lo lee el asistente. Lo que llega aquí ya va limpio de claves: lo tapa
// quien llama, como el informe de «Algo va mal».
async function dejarUnEncargo(raiz, texto, ahora = new Date()) {
  if (!await quedaFueraDeGit(raiz)) return { ok: false, motivo: 'el .gitignore no deja fuera los pedidos' }; // diccionario: interno
  const donde = carpetaParaEscribir(raiz);
  if (!donde) return { ok: false, motivo: 'la carpeta de los pedidos no es una carpeta de verdad' }; // diccionario: interno
  // Con los milésimos: por el nombre se sabe cuáles son los viejos.
  const sello = ahora.toISOString().slice(0, 23).replace(/[-:.]/g, '').replace('T', '-');
  const nombre = `encargo-${sello}-${require('node:crypto').randomBytes(3).toString('hex')}.md`;
  try {
    fs.writeFileSync(path.join(donde, nombre), `${String(texto).trim()}\n`, { flag: 'wx' });
  } catch (error) {
    return { ok: false, motivo: error.message };
  }
  recogerLosViejos(donde);
  return { ok: true, ruta: [...CARPETA, nombre].join('/') };
}

// La línea que se le manda. Dice de dónde sale para que lo haga como si se lo
// hubieran escrito en la caja: lo manda la persona, con su «enviar».
const laLinea = (ruta) => `Lee el encargo que te he dejado en ${ruta} y hazlo. Lo he dejado ahí porque no cabía aquí.`;

// Un cambio del vigía que es uno de estos: no hay nada que repintar.
const esUnEncargo = (ruta) => /[\\/]02-DOCS[\\/]raw[\\/]pedidos[\\/]encargo-[^\\/]+\.md$/.test(String(ruta || ''));

module.exports = {
  CARPETA, POR_VEZ, POR_SESION, carpeta, losQueHay, esUnPedido, lasQueSeParecen, queHacer, sePide, respuesta, olvidarLaRespuesta, sigue, contestar,
  ENCARGO, ENCARGOS_GUARDADOS, quedaFueraDeGit, carpetaParaEscribir, dejarUnEncargo, laLinea, esUnEncargo,
};
