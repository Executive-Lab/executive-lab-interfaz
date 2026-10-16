// «Conectar algo nuevo» (decisión 167).
//
// Antes mandaba una frase fija, «Quiero conectar un programa nuevo con el que ya
// trabajo. Pregúntame cuál es»: el alumno pulsaba, le daba a enviar, esperaba a
// que el asistente le preguntara y contestaba. Tres pasos para decir un nombre.
// Ahora se pregunta en el propio editor, con lo que la barra ya ve, y el encargo
// sale con el nombre puesto.
//
// Lo que se ofrece, sin inventar nada:
//
//   · los programas de sus claves: las sueltas y también las de una aplicación,
//     que están en su sitio pero dicen qué usa (`sueltas.js`, con el mismo filtro
//     que «Conectar …» de las ideas, decisión 152);
//   · los que nombra su perfil, de entre los que la barra conoce por su nombre;
//   · y «Otro», que se escribe.
//
// Ninguno que ya tenga su conexión. El nombre entra en el encargo limpio
// (`limpio.etiqueta`): lo escribe quien sea, y lo lee el asistente.

const fs = require('node:fs');
const proyecto = require('./proyecto');
const limpio = require('./limpio');

// Cuántos caben en la lista, antes de «Otro».
const CABEN = 8;
// Lo que se lee del perfil, como mucho.
const TOPE_DEL_PERFIL = 64 * 1024;
// Los asistentes salen en el perfil por ser con quien se habla, no por ser un
// programa que conectar.
const NO_SE_OFRECEN = new Set(['anthropic', 'openai']);

const pelar = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]/g, '');
const escaparRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Lo de después del nombre: lo mismo que se le pedía antes (decisiones 146, 156 y 159).
const LO_DEMAS = 'Si tienes la habilidad connect-tool, úsala. '
  + 'Deja los pasos en su README, en una sección «Cómo conectarla», uno por línea y en el orden en que los voy a ver, sacados de su documentación oficial y con la página y el día en que lo comprobaste, y de dónde sale cada clave en su CREDENTIALS.md. '
  + 'Escribe también en su CREDENTIALS.md la clase de acceso que pide, y en su README lo que tendría que pedirle a mi informático, como dice tu habilidad executive-lab. '
  + 'Comprueba que funciona antes de darla por buena.';

// El encargo, con el nombre. Null si no queda nada que nombrar.
function encargo(nombre) {
  const suyo = limpio.etiqueta(nombre, 60);
  return suyo ? `Quiero conectar «${suyo}», un programa con el que ya trabajo. ${LO_DEMAS}` : null;
}

// El texto del perfil, sin su cabecera.
function elPerfil() {
  const ruta = proyecto.ruta('02-DOCS', 'wiki', 'harness', 'user-profile.md');
  try {
    const datos = ruta && fs.lstatSync(ruta);
    if (!datos || !datos.isFile() || datos.size > TOPE_DEL_PERFIL) return '';
    return fs.readFileSync(ruta, 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
  } catch {
    return '';
  }
}

// Lo que se puede ofrecer: [{ nombre, deDonde: 'claves' | 'perfil' }], sin repetir
// y sin los que ya tienen su conexión.
function queSePuedeConectar({ catalogo = [] } = {}) {
  const conexiones = require('./conexiones');
  const sueltas = require('./sueltas');
  const ideas = require('./ideas');

  const yaEstan = new Set(conexiones.proveedores().flatMap((p) => [pelar(p.id), pelar(p.etiqueta)]));
  const vistos = new Map();
  const noSeOfrecen = new Set([...NO_SE_OFRECEN].flatMap((id) => [id, pelar(conexiones.PROVEEDORES[id])]));
  const poner = (nombre, deDonde, id = '') => {
    const clave = pelar(nombre);
    // Ni por su id ni por su nombre: `anthropic` sale como «Claude» (revisión de la 167).
    if (noSeOfrecen.has(String(id).toLowerCase()) || noSeOfrecen.has(clave)) return;
    if (!clave || yaEstan.has(clave) || vistos.has(clave)) return;
    vistos.set(clave, { nombre: limpio.etiqueta(nombre, 60), deDonde });
  };
  const comoSeLlama = (id) => conexiones.PROVEEDORES[String(id).toLowerCase()] || ideas.comoSeLlama(id);

  // Sus claves: el que más claves tiene, primero.
  try {
    const { grupos } = sueltas.reparto(sueltas.buscar({ conLasDeLasApps: true }));
    for (const p of ideas.lasClaves({ reparto: grupos }, catalogo).porMontar) poner(comoSeLlama(p.herramienta), 'claves', p.herramienta);
  } catch { /* sin inventario, con el perfil basta */ }

  // Su perfil: los que la barra conoce, en el orden en que salen.
  const perfil = elPerfil();
  if (perfil) {
    const nombrados = Object.entries(conexiones.PROVEEDORES)
      .filter(([id]) => !NO_SE_OFRECEN.has(id))
      .map(([, nombre]) => ({ nombre, donde: perfil.search(new RegExp(`(?<![\\p{L}\\p{N}])${escaparRegex(nombre)}(?![\\p{L}\\p{N}])`, 'iu')) }))
      .filter((p) => p.donde >= 0)
      .sort((a, b) => a.donde - b.donde);
    for (const { nombre } of nombrados) poner(nombre, 'perfil');
  }

  return [...vistos.values()].slice(0, CABEN);
}

module.exports = { encargo, queSePuedeConectar, LO_DEMAS, CABEN };
