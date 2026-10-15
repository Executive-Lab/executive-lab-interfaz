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
// Y en esas mismas carpetas, dos cosas más de la 3 que a un alumno lo pierden
// (decisión 157):
//   · `.no-worktree-isolation`: con dos conversaciones abiertas en la carpeta
//     (cuenta como abierta media hora desde lo último que hizo), RSC le dice al
//     asistente que trabaje en `.worktrees/<rama>/` y que la persona abra el
//     proyecto desde allí (`session-memory-adapter.mjs`, `isolationContext`), y su
//     freno no le deja cambiar de rama (`branch-guard.mjs`, `isolationDenial`). Es
//     un `optOut` del proyecto: RSC lo apunta en `.rsc.json` al escribir, como el
//     de la rama principal, y viaja con la carpeta.
//   · `.team-safe-3`: no es un interruptor, es lo que RSC deja tras decir una vez,
//     en la primera conversación con la 3, cuatro puntos de ramas, worktrees,
//     FTD/SDD y `rsc/knowledge` (`team-safe-start.mjs`, `teamSafeAnnouncement`). El
//     cuarto aquí es falso, porque compartir está apagado. Puesto antes, no se dice.
//     No viaja en `.rsc.json`: es de esta máquina.
// La revisión periódica (`.no-audit`) ya la apagan los raíles en todas las
// carpetas (`CALLAR` en `aplicar.js`), y RSC la apunta igual: no se repite aquí.
//
// Todo lo que se pone se devuelve, y si la orden no sale se quita igual.
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
// Solo en las carpetas cuyo historial creó la barra, como la rama principal.
const COMO_EN_CLASE = ['.no-worktree-isolation', '.team-safe-3'];
const MARCAS_DE_LA_BARRA = [...QUE_NO_SALE, ...PRINCIPAL_ABIERTA, ...COMO_EN_CLASE];

// Lo que llevan dentro. RSC solo mira si existen; lo que dicen es para quien
// abra la carpeta `.rsc/` y se pregunte de dónde salen.
const POR_QUE = {
  '.team-safe-3': 'Lo puso la barra de Executive Lab al montar: el aviso de la 3 no se le dice a un alumno.\n', // diccionario: interno
};

// Si existe con ese nombre, sea lo que sea: un enlace roto también cuenta, y no se
// sigue para crear su destino (revisión de seguridad del paso a la 3, H5).
const existe = (ruta) => { try { fs.lstatSync(ruta); return true; } catch { return false; } };

// La carpeta declara una 2, o nada todavía, y la barra trae una 3.
function pasaALaTres() {
  const mayor = (v) => Number((String(v || '').match(/^v?(\d+)\./) || [])[1]);
  return !(mayor(proyecto.versionDelCatalogo()) >= 3) && mayor(require('./rsc').VERSION_DE_RESPALDO) >= 3;
}

// Pone las marcas y devuelve lo que ha creado, para poder quitarlo. Nunca a través
// de un enlace, y nunca pisa nada que ya tenga ese nombre. `nuestra`: el historial
// de la carpeta lo creó la barra.
function decidirComoLaBarra({ nuestra = true } = {}) {
  const raiz = proyecto.raiz();
  if (!raiz) return null;
  const dondeVan = path.join(raiz, '.rsc');
  try {
    if (existe(dondeVan) && fs.lstatSync(dondeVan).isSymbolicLink()) return null;
    const optOuts = (proyecto.declaracion() || {}).optOuts;
    const declaradas = (Array.isArray(optOuts) ? optOuts : []).filter((id) => typeof id === 'string' && /^[a-z0-9-]+$/.test(id));
    const abrir = nuestra && !declaradas.includes('trunk-open');
    const puestas = { carpeta: !existe(dondeVan), ficheros: [] };
    fs.mkdirSync(dondeVan, { recursive: true });
    const marcas = [...declaradas.map((id) => `.no-${id}`), ...QUE_NO_SALE, ...(abrir ? PRINCIPAL_ABIERTA : []), ...(nuestra ? COMO_EN_CLASE : [])];
    for (const marca of marcas) {
      const fichero = path.join(dondeVan, marca);
      if (existe(fichero)) continue;
      fs.writeFileSync(fichero, POR_QUE[marca] || '', { flag: 'wx' });
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
  return decidirComoLaBarra({ nuestra: Boolean(nuestra) });
}

module.exports = { QUE_NO_SALE, PRINCIPAL_ABIERTA, COMO_EN_CLASE, MARCAS_DE_LA_BARRA, existe, pasaALaTres, decidirComoLaBarra, quitar, antesDeEscribir };
