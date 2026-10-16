// «Seguir donde lo dejé» dice por dónde ibas (decisión 160).
//
// RSC ya guarda el siguiente paso. `memory resume` devuelve una línea `next:`
// con el apartado Next del documento de trabajo de la última sesión y cuántas
// casillas le quedan (`session-memory-core.mjs`, `nextSteps`). La barra solo
// leía `files:`. Ahora, donde ofrece «Seguir donde lo dejé», dice en una frase
// por dónde ibas, y se lo pasa al asistente en el encargo.
//
// Sin el asistente y sin red (P5): se lee del disco.
//   · Primero, los documentos que nombra `next:`. Se vuelven a leer, porque esa
//     línea no dice si están terminados.
//   · Si ninguno sigue en marcha, el documento de trabajo en marcha más reciente
//     de `02-DOCS/wiki/ftd/`.
//
// ── Terminado es terminado, aunque diga otra cosa ────────────────────────
//
// En las carpetas de la barra se trabaja en la rama principal y nadie fusiona,
// así que el enganche que pone `status: done` no corre nunca: los documentos se
// quedan `in-progress` para siempre. No se ofrece:
//   · el que dice `status: done` (o `hecho`, como los de este repositorio);
//   · el que no tiene ninguna casilla sin marcar: con todas marcadas está
//     terminado, y sin ninguna no se sabe qué queda.
//
// ── Lo que se lee lo escribió otro ───────────────────────────────────────
//
// Acaba en pantalla y en un encargo. Así que con tope, sin seguir enlaces (un
// documento que fuera un enlace a /dev/zero colgaba la barra, revisión de la
// 149), limpio con `limpio.etiqueta` (revisión de la 154) y sin claves: en clase
// se comparte pantalla.

const fs = require('node:fs');
const path = require('node:path');
const limpio = require('./limpio');
const frontmatter = require('./frontmatter');

const CARPETA = ['02-DOCS', 'wiki', 'ftd'];
// Los que puede nombrar `next:`: los mismos que mira RSC. El nombre, sin barras
// ni dos puntos: «02-DOCS/wiki/ftd/x.md: el paso (2 open) | …».
const EN_EL_NEXT = /(?:^|\|\s*)(02-DOCS\/wiki\/(?:ftd|sdd\/(?:specs|plans|progress))\/[^\s/|:]+\.md):/g;
// Un nombre que se puede escribir tal cual en un encargo: letras, números, `_`,
// `.` y `-`. Lo demás no se lee.
const NOMBRE = /^[\p{L}\p{N}][\p{L}\p{N}_.-]{0,79}\.md$/u;
const TERMINADO = /^(done|hecho)$/i;
const TOPE_POR_DOCUMENTO = 256 * 1024;
// Cuántos se miran en la carpeta y cuántos se leen como mucho.
const CUANTOS_SE_MIRAN = 500;
const CUANTOS_SE_LEEN = 20;
const LARGO_DEL_PASO = 90;
const LARGO_DEL_TITULO = 50;
// Una línea se corta antes de pasarle una expresión: una de 40.000 espacios
// colgaba cada repintado (revisión de seguridad de la 159).
const LARGO_DE_UNA_LINEA = 2000;

const SEGUIR = 'Sigue donde lo dejamos la última vez: mira lo último que hicimos, dime en qué punto estamos y qué sería lo siguiente.';

// ------------------------------------------------------------ desde el disco

// La carpeta, si cada trozo es una carpeta de verdad. `lstat` no sigue enlaces:
// un enlace no es una carpeta.
function sinEnlaces(raiz, carpetas) {
  let donde = raiz;
  for (const parte of carpetas) {
    donde = path.join(donde, parte);
    try {
      if (!fs.lstatSync(donde).isDirectory()) return null;
    } catch {
      return null;
    }
  }
  return donde;
}

// Un fichero de verdad y que cabe, o null. Se abre sin seguir enlaces donde se
// puede, y se mira otra vez lo abierto: entre mirar y abrir pudo cambiar.
function leerSiCabe(completa, tope = TOPE_POR_DOCUMENTO) {
  let fd;
  try {
    const antes = fs.lstatSync(completa);
    if (!antes.isFile() || antes.size > tope) return null;
    fd = fs.openSync(completa, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
    const datos = fs.fstatSync(fd);
    if (!datos.isFile() || datos.size > tope) return null;
    const trozo = Buffer.alloc(datos.size);
    const leidos = fs.readSync(fd, trozo, 0, trozo.length, 0);
    return trozo.subarray(0, leidos).toString('utf8');
  } catch {
    return null;
  } finally {
    if (fd !== undefined) try { fs.closeSync(fd); } catch { /* ya está */ }
  }
}

// ------------------------------------------------------------ un documento

// Una línea de markdown, en texto: sin la marca de la lista, la casilla, los
// enlaces ni las negritas, y sin el punto final.
const enUnaLinea = (linea) => String(linea || '').slice(0, LARGO_DE_UNA_LINEA)
  .replace(/^[ \t]*(?:[-*+>]|\d+[.)])[ \t]+/, '')
  .replace(/^\[[ xX]\][ \t]*/, '')
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/\*\*|__|`/g, '')
  .replace(/[\s.;:,]+$/, '')
  .trim();

const tieneLetras = (texto) => /[\p{L}\p{N}]/u.test(texto);

// La primera línea con algo del apartado Next (o Siguiente, o Próximo), hasta el
// siguiente título.
function pasoDelNext(cuerpo) {
  const lineas = cuerpo.split('\n');
  const desde = lineas.findIndex((l) => /^##[ \t]*(?:next|siguiente|pr[oó]ximo|lo siguiente)\b/i.test(l));
  if (desde === -1) return '';
  for (const linea of lineas.slice(desde + 1)) {
    if (/^#{1,6}[ \t]/.test(linea)) break;
    const paso = enUnaLinea(linea);
    if (tieneLetras(paso)) return paso;
  }
  return '';
}

// «informe-de-octubre.md» → «Informe de octubre».
function delNombre(rel) {
  const nombre = path.posix.basename(rel, '.md').replace(/[-_]+/g, ' ').trim();
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

// Lo que dice un documento: null si está terminado o no se sabe qué queda.
function deUnDocumento(textoEntero, rel) {
  const texto = String(textoEntero || '').replace(/\r\n?/g, '\n');
  const cabecera = frontmatter.analizar(texto);
  if (TERMINADO.test(String(cabecera.status || '').trim())) return null;
  // Sin la cabecera ni los bloques de código: una plantilla de ejemplo con
  // «- [ ]» dentro no es una casilla.
  const cuerpo = texto
    .replace(/^---\n[\s\S]*?\n---(?:\n|$)/, '')
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, '');
  const abiertas = [...cuerpo.matchAll(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+\[ \][ \t]*(.*)$/gm)];
  if (!abiertas.length) return null;
  const titulo = enUnaLinea(cabecera.title || (cuerpo.match(/^#[ \t]+(.+)$/m) || [])[1] || '') || delNombre(rel);
  // Sin Next, la primera casilla sin marcar es lo siguiente.
  const siguiente = pasoDelNext(cuerpo) || enUnaLinea(abiertas.map((a) => a[1]).find((a) => tieneLetras(enUnaLinea(a))) || '');
  if (!tieneLetras(siguiente)) return null;
  return { ruta: rel, titulo, siguiente, quedan: abiertas.length };
}

function laTarea(raiz, rel) {
  const partes = rel.split('/');
  if (!NOMBRE.test(partes[partes.length - 1])) return null;
  const carpeta = sinEnlaces(raiz, partes.slice(0, -1));
  if (!carpeta) return null;
  const texto = leerSiCabe(path.join(carpeta, partes[partes.length - 1]));
  return texto === null ? null : deUnDocumento(texto, rel);
}

// Los documentos que nombra la línea `next:` de la continuación, en su orden.
function enElNext(continuacion) {
  const linea = String(continuacion || '').split('\n').find((l) => l.startsWith('next: '));
  if (!linea) return [];
  return [...linea.slice('next: '.length, 8192).matchAll(EN_EL_NEXT)].map((m) => m[1]);
}

// El documento de trabajo en marcha más reciente: los de la carpeta, del último
// tocado al primero. Lo que no es un fichero (un enlace, una carpeta) no gasta
// lecturas.
function elMasReciente(raiz) {
  const carpeta = sinEnlaces(raiz, CARPETA);
  if (!carpeta) return null;
  let nombres;
  try {
    nombres = fs.readdirSync(carpeta);
  } catch {
    return null;
  }
  // Por nombre antes del tope: así los que quedan fuera son siempre los mismos.
  const porFecha = nombres.filter((n) => NOMBRE.test(n)).sort().slice(0, CUANTOS_SE_MIRAN)
    .map((nombre) => {
      try {
        const datos = fs.lstatSync(path.join(carpeta, nombre));
        return datos.isFile() ? { nombre, cuando: datos.mtimeMs } : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.cuando - a.cuando || a.nombre.localeCompare(b.nombre));
  for (const { nombre } of porFecha.slice(0, CUANTOS_SE_LEEN)) {
    const tarea = laTarea(raiz, [...CARPETA, nombre].join('/'));
    if (tarea) return tarea;
  }
  return null;
}

// ------------------------------------------------------------ lo que se dice

// En una línea, sin comillas ni nada que no se vea, sin claves y con su tope. Se
// tapa antes de cortar: cortada, una clave ya no se reconoce.
function paraEnsenar(texto, tope) {
  let dicho = limpio.etiqueta(texto, 1000);
  try {
    dicho = require('./informatico').sinClaves(dicho);
  } catch { /* sin conexiones que leer, con lo demás */ }
  return dicho.length > tope ? `${dicho.slice(0, tope - 1).trimEnd()}…` : dicho;
}

const pasos = (n) => (n === 1 ? 'queda 1 paso' : `quedan ${n} pasos`);
const casillas = (n) => (n === 1 ? 'Queda 1 casilla sin marcar' : `Quedan ${n} casillas sin marcar`);

// El encargo: el de siempre y, si se sabe, por dónde iba. Lo lee el asistente.
function encargo(ibas) {
  if (!ibas) return SEGUIR;
  return `${SEGUIR} En «${ibas.titulo}» (${ibas.ruta}) iba por esto: ${ibas.siguiente}. ${casillas(ibas.quedan)}. Si ya está hecho, compruébalo y márcalo.`; // diccionario: interno
}

// Lo que sale en pantalla y el encargo, o null si no hay nada en marcha: entonces
// «Seguir donde lo dejé» se queda como estaba (P1).
function porDondeIbas(raiz, continuacion) {
  if (!raiz) return null;
  let tarea = null;
  for (const rel of enElNext(continuacion).slice(0, 3)) {
    tarea = laTarea(raiz, rel);
    if (tarea) break;
  }
  tarea = tarea || elMasReciente(raiz);
  if (!tarea) return null;
  const ibas = {
    ruta: tarea.ruta,
    titulo: paraEnsenar(tarea.titulo, LARGO_DEL_TITULO),
    siguiente: paraEnsenar(tarea.siguiente, LARGO_DEL_PASO),
    quedan: tarea.quedan,
  };
  return {
    ...ibas,
    texto: `Ibas por: ${ibas.siguiente}, y te ${pasos(ibas.quedan)} de «${ibas.titulo}».`,
    accion: { tipo: 'pedir', prompt: encargo(ibas) },
  };
}

// ── La tarjeta del día (decisión 160, revisión de producto) ─────────────
//
// Quien vuelve al día siguiente abre la barra y no sabe por dónde iba
// (`docs/friccion.md` §4). La primera vez de cada día que se pinta la principal
// en una carpeta con algo hecho, una tarjeta se lo dice, con «Seguir donde lo
// dejé». Lo hecho es lo que ya sabe la brújula: un documento de trabajo en marcha
// o, si no, dónde tocó la última sesión según la memoria del arnés.
//
// Se decide la primera vez de cada día y se apunta. Lo que se haga después ese
// mismo día no la saca: eso no es «la última vez», es hoy. Y con cualquiera de sus
// dos botones se va hasta mañana.
const CLAVE_DEL_DIA = 'executiveLab.laUltimaVez';

// El día de este ordenador, no el de Greenwich: a las 00:30 ya es mañana.
const elDia = (ahora = new Date()) => {
  const d = new Date(ahora);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Lo que diría la tarjeta con lo que sabe la brújula, o null.
function laTarjeta(brujula) {
  if (!brujula || !brujula.listo) return null;
  const ibas = brujula.ibasPor;
  if (ibas && ibas.siguiente && ibas.accion) {
    return {
      texto: `La última vez ibas por: ${ibas.siguiente}, y te ${pasos(ibas.quedan)} de «${ibas.titulo}».`,
      accion: { tipo: 'seguirDondeLoDeje', prompt: ibas.accion.prompt },
    };
  }
  const zona = limpio.etiqueta(brujula.laUltimaZona, LARGO_DEL_PASO);
  if (zona) return { texto: `La última vez trabajaste en ${zona}.`, accion: { tipo: 'seguirDondeLoDeje', prompt: SEGUIR } };
  return null;
}

// La de hoy, si toca. `almacen` es el de esta carpeta.
async function laDeHoy(almacen, brujula, ahora = new Date()) {
  const hoy = elDia(ahora);
  const tarjeta = laTarjeta(brujula);
  let apuntado = almacen.get(CLAVE_DEL_DIA);
  if (!apuntado || apuntado.dia !== hoy) {
    apuntado = { dia: hoy, toca: Boolean(tarjeta) };
    await almacen.update(CLAVE_DEL_DIA, apuntado);
  }
  return apuntado.toca && tarjeta ? { ...tarjeta, ahoraNo: { tipo: 'ahoraNoLaUltimaVez' } } : null;
}

// «Ahora no» o «Seguir donde lo dejé»: hasta mañana.
const hastaManana = (almacen, ahora = new Date()) => almacen.update(CLAVE_DEL_DIA, { dia: elDia(ahora), toca: false });

module.exports = {
  porDondeIbas, encargo, deUnDocumento, enElNext, SEGUIR,
  laTarjeta, laDeHoy, hastaManana, elDia, CLAVE_DEL_DIA,
};
