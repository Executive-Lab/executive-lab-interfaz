// Lo que el asistente le pide a la barra (decisión 150).
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
// Tres por vez, como mucho: un repositorio con cien no tiene a la barra
// añadiendo habilidades una hora.
const POR_VEZ = 3;
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

// Los identificadores pedidos, en orden y como mucho `POR_VEZ`. Un enlace que
// se llame `.habilidad` no es un pedido.
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
    .slice(0, POR_VEZ);
}

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

// Lo que se le contesta al asistente, que es quien lo lee y se lo dice al alumno.
// `comoSePide` es el `/id` o el `$id` de cada asistente. Con el arnés por delante
// la barra no puede (P7), y el asistente sí, con la versión que declara la carpeta.
function respuesta(que, { id, comoSePide = '', parecidas = [], version = '' } = {}) {
  switch (que) {
    case 'porDelante':
      return /^\d+\.\d+\.\d+$/.test(version)
        ? `En esta carpeta el arnés es más nuevo que el de la barra, y ella no puede añadirla. Añádela tú: npx @ericrisco/rsc@${version} add ${id}`
        : 'En esta carpeta el arnés es más nuevo que el de la barra, y ella no puede añadirla. Añádela tú, con la versión que declara .rsc.json.';
    case 'noEsta':
      return parecidas.length
        ? `«${id}» no está en el catálogo de la clase. Las que más se parecen: ${parecidas.join(', ')}. Pide la que sea con su nombre exacto.`
        : `«${id}» no está en el catálogo de la clase. Pide una con su nombre exacto del catálogo.`;
    case 'yaEstaba':
      return `Ya estaba puesta. Se pide con ${comoSePide}.`;
    case 'anadida':
      return `Añadida. Se pide con ${comoSePide}.`;
    case 'noQuiere':
      return 'La persona ha dicho que ahora no. No la vuelvas a pedir hasta que te lo diga.';
    default:
      return 'No se ha podido añadir. Dile que la busque en Habilidades (skills) y la pulse.';
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

module.exports = { CARPETA, POR_VEZ, carpeta, losQueHay, lasQueSeParecen, queHacer, respuesta, contestar };
