// Lo que la 3 trae encendido y en una carpeta de la barra no va (decisión 145).
//
// La 3 de RSC cierra la rama principal al asistente si ve CI, un despliegue o dos
// personas, y la primera vez mueve a otra rama lo que no se había subido. También
// sube `01-TOOLS/` y la wiki solas a una rama del remoto y se actualiza sola.
//
// Dos clases de cosas, y no se tratan igual:
//   · lo que saca algo del ordenador, o lo cambia, sin preguntar —subir la wiki,
//     actualizarse—: apagado siempre, también en una carpeta que ya era de
//     alguien, porque lo trae la barra y P9 lo deja a su sí;
//   · la rama principal abierta, que es cómo trabaja el asistente: como en clase,
//     solo en las carpetas cuyo historial creó la barra (P4), y nunca encima de un
//     «ramas y PR» que el equipo ya eligió (`trunk-open`).
//
// ── Dónde y cuándo ───────────────────────────────────────────────────────
//
// En `rsc.correr`, justo antes de cualquier orden que escriba, mientras la carpeta
// pase de la 2 a la 3 (o no tenga arnés todavía). Un solo sitio, porque una 2 pasa
// a la 3 por montar, traer, ponerla al día, añadir, arreglar o cambiar de
// asistente, y decidirlo en dos de ellos dejaba los otros sin nada (revisión de
// corrección del paso a la 3, 1, reproducido). Y justo antes, no al principio del
// montaje: si alguien dice que no, o la orden falla, se quita lo puesto (2).
//
// Antes que lo de la barra, lo que el equipo ya apagó en `.rsc.json`: con `.rsc/`
// puesta, RSC rehace sus decisiones con las marcas que encuentra y perdería las que
// solo están escritas allí. Pasó al subir este repositorio, y el `repair` de la 3
// en una carpeta de la 2 lo hacía igual.
//
// Después es suyo: una carpeta que ya va en la 3 no se toca, y si alguien enciende
// algo, se queda encendido.

const fs = require('node:fs');
const path = require('node:path');
const proyecto = require('./proyecto');

const QUE_NO_SALE = ['.no-knowledge-sync', '.no-auto-update'];
const PRINCIPAL_ABIERTA = ['.no-trunk-guard'];
const MARCAS_DE_LA_BARRA = [...QUE_NO_SALE, ...PRINCIPAL_ABIERTA];

// Si existe con ese nombre, sea lo que sea: un enlace roto también cuenta, y no se
// sigue para crear su destino (revisión de seguridad del paso a la 3, H5).
const existe = (ruta) => { try { fs.lstatSync(ruta); return true; } catch { return false; } };

// La carpeta declara una 2, o nada todavía, y la barra trae una 3.
function pasaALaTres() {
  const mayor = (v) => Number((String(v || '').match(/^v?(\d+)\./) || [])[1]);
  return !(mayor(proyecto.versionDelCatalogo()) >= 3) && mayor(require('./rsc').VERSION_DE_RESPALDO) >= 3;
}

// Pone las marcas y devuelve lo que ha creado, para poder quitarlo. Nunca a través
// de un enlace, y nunca pisa nada que ya tenga ese nombre.
function decidirComoLaBarra({ principalAbierta = true } = {}) {
  const raiz = proyecto.raiz();
  if (!raiz) return null;
  const dondeVan = path.join(raiz, '.rsc');
  try {
    if (existe(dondeVan) && fs.lstatSync(dondeVan).isSymbolicLink()) return null;
    const optOuts = (proyecto.declaracion() || {}).optOuts;
    const declaradas = (Array.isArray(optOuts) ? optOuts : []).filter((id) => typeof id === 'string' && /^[a-z0-9-]+$/.test(id));
    const abrir = principalAbierta && !declaradas.includes('trunk-open');
    const puestas = { carpeta: !existe(dondeVan), ficheros: [] };
    fs.mkdirSync(dondeVan, { recursive: true });
    for (const marca of [...declaradas.map((id) => `.no-${id}`), ...QUE_NO_SALE, ...(abrir ? PRINCIPAL_ABIERTA : [])]) {
      const fichero = path.join(dondeVan, marca);
      if (existe(fichero)) continue;
      fs.writeFileSync(fichero, '', { flag: 'wx' });
      puestas.ficheros.push(fichero);
    }
    return puestas;
  } catch {
    return null;
  }
}

// Lo que se puso, quitado: la orden no salió, y la carpeta se queda como estaba.
function quitar(puestas) {
  if (!puestas) return;
  for (const fichero of puestas.ficheros) { try { fs.unlinkSync(fichero); } catch { /* ya no estaba */ } }
  if (puestas.carpeta) { try { fs.rmdirSync(path.join(proyecto.raiz(), '.rsc')); } catch { /* no está vacía: no es solo nuestra */ } }
}

// Lo que llama `rsc.correr` antes de una orden que escribe. La rama principal solo
// se abre en una carpeta cuyo historial creó la barra: se pregunta aquí, tarde, para
// no cargar `terreno` (que carga `rsc`) al cargar este módulo.
async function antesDeEscribir() {
  if (!pasaALaTres()) return null;
  const nuestra = await require('./terreno').podemosGuardarElPuntoDePartida();
  return decidirComoLaBarra({ principalAbierta: Boolean(nuestra) });
}

module.exports = { QUE_NO_SALE, PRINCIPAL_ABIERTA, MARCAS_DE_LA_BARRA, existe, pasaALaTres, decidirComoLaBarra, quitar, antesDeEscribir };
