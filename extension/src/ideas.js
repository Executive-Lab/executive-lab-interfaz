// Se adapta y da ideas (F6 del plan de simplificar la barra, decisión 152).
//
// Jose, 05-10-2026: *«que sea inteligente e interactiva y que solo ponga lo
// necesario según el caso, y en brownfield se adapte y dé ideas»*.
//
// Dos cosas, y las dos salen del disco y de reglas, no de una ocurrencia del
// modelo (P5):
//
//   1. «Esto parece …». En una carpeta que ya tenía cosas, la primera vez, una
//      tarjeta con lo que la barra ya sabe leer: de qué parece (`terreno`), con
//      qué está hecho (lo que RSC apuntó al montarlo), de qué programas hay
//      claves (`sueltas`) y cuántos documentos hay sin colocar (`papeles`). Y si
//      el arnés guardó una copia de lo suyo al montarse, se dice y se puede ver
//      (punto 8 de la decisión 142: Eric aconseja hacer antes una copia, y RSC
//      ya la hace; faltaba que se viera).
//   2. Dos o tres ideas sacadas de lo que hay, de una en una en la tarjeta de
//      siempre, cada una con su botón y su «Ahora no». En una carpeta nueva
//      salen de lo que dijo al prepararla («Para qué es esto»).
//
// No es un menú: es la tarjeta de siempre, y la lista entera en Ayuda ›
// Sugerencias. Y nada nombrado a fuego: los programas salen del nombre de sus
// claves, y con qué está hecho, del catálogo (`capacidades.json`).
//
// `loQueParece`, `lasIdeas` y `queSeDiceDeLaCopia` son puras: se prueban con
// situaciones inventadas. `queSeVe` y `laCopiaDelMontaje` leen el disco.

const fs = require('node:fs');
const path = require('node:path');

const DIAS = 86400000;
// Lo apartado con «Ahora no» vuelve a las dos semanas, como los consejos.
const APARTADA_DURANTE = 14 * DIAS;
// Dos o tres ideas, no un menú.
const CABEN = 3;
// Cuántos programas se nombran en «Esto parece» antes de decir cuántos más.
const PROGRAMAS_QUE_CABEN = 3;
// Topes de la copia del montaje (revisión de seguridad, 1 y 3). Esto se mira en
// cada repintado, y `.rsc/` lo puede traer un repositorio de fuera: cuántas
// copias se miran, cuánto puede pesar el manifiesto de una y hasta dónde se dice
// el nombre de cada cosa guardada.
const COPIAS_QUE_SE_MIRAN = 200;
const MANIFIESTO_COMO_MUCHO = 256 * 1024;
const NOMBRE_COMO_MUCHO = 60;

const pelar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const plural = (n, uno, varios) => (n === 1 ? uno : varios.replace('{n}', n));

// «a», «a y b», «a, b y c»; y «e» delante de «i» o «hi» que no abran
// diptongo: «Holded e Instagram», pero «madera y hierro».
const laY = (siguiente) => (/^h?i(?![aeiou])/.test(pelar(siguiente)) ? 'e' : 'y');
function enUnaFrase(lista) {
  if (lista.length < 2) return lista.join('');
  const ultimo = lista[lista.length - 1];
  return `${lista.slice(0, -1).join(', ')} ${laY(ultimo)} ${ultimo}`;
}

// El nombre de un programa deducido de sus claves o de su carpeta: `STRIPE` o
// `stripe` → «Stripe». Lo que ya trae mayúsculas y minúsculas se deja como está.
function comoSeLlama(herramienta) {
  const limpio = String(herramienta || '').replace(/[_-]+/g, ' ').trim();
  if (!limpio) return limpio;
  if (limpio !== limpio.toUpperCase() && limpio !== limpio.toLowerCase()) return limpio;
  return limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase();
}

// Si un nombre sale en un texto como palabra entera: «Go» no está en «algo».
function comoPalabra(texto, nombre) {
  const buscado = pelar(nombre).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${buscado}($|[^a-z0-9])`).test(pelar(texto));
}

// Con qué está hecho, con el nombre que le da el catálogo. Lo que el catálogo
// no nombra (`node` a secas) no se dice.
function conQueEstaHecho(stacks = [], catalogo = []) {
  const nombres = stacks
    .map((id) => (catalogo.find((c) => c.id === id) || {}).nombre)
    .filter((nombre) => typeof nombre === 'string' && nombre);
  return [...new Set(nombres)];
}

// «hecha», «hecho» o «hechos», según lo que parece: «una web hecha con…».
function hechoCon(parece) {
  if (/^una\s/i.test(parece)) return 'hecha';
  if (/^unas\s/i.test(parece)) return 'hechas';
  if (/^(unos|varios)\s/i.test(parece)) return 'hechos';
  return 'hecho';
}

// ── 1. «Esto parece …» ───────────────────────────────────────────────────
//
// `parece`        lo que dice `terreno` por los ficheros de la raíz («una web»)
// `stacks`        lo que RSC apuntó al montar (`onboarding.plan.evidence`)
// `programas`     de quién son las claves sueltas, ya con su nombre
// `clavesSinDueno` cuántas claves sueltas no dicen de quién son
// `ficheros`      cuántos ficheros de acceso hay fuera de su sitio
// `documentos`    cuántos documentos hay sin colocar en la carpeta
//
// Devuelve la frase, o null si no hay nada que decir.
function loQueParece({
  parece = null, stacks = [], catalogo = [], programas = [], clavesSinDueno = 0, ficheros = 0, documentos = 0,
} = {}) {
  // «algo en Python hecho con Python» no: lo que ya dice lo que parece, sobra.
  // Por palabra entera, que «algo» lleva «go» dentro.
  const hecho = conQueEstaHecho(stacks, catalogo).filter((nombre) => !(parece && comoPalabra(parece, nombre)));

  let base = null;
  if (parece) base = `Esto parece ${parece}${hecho.length ? ` ${hechoCon(parece)} con ${enUnaFrase(hecho)}` : ''}`;
  else if (hecho.length) base = `Esto parece algo hecho con ${enUnaFrase(hecho)}`;

  const partes = [];
  // Si la primera lleva su propia «y» («claves de Stripe y Pexels»).
  let conSuY = false;
  if (programas.length) {
    const sobran = programas.length > PROGRAMAS_QUE_CABEN;
    const nombrados = sobran ? programas.slice(0, PROGRAMAS_QUE_CABEN - 1) : programas;
    const lista = sobran ? [...nombrados, `${programas.length - nombrados.length} más`] : nombrados;
    conSuY = lista.length > 1;
    partes.push(`claves de ${enUnaFrase(lista)}`);
  } else if (clavesSinDueno) {
    partes.push(plural(clavesSinDueno, '1 clave suelta', '{n} claves sueltas'));
  }
  if (ficheros) partes.push(plural(ficheros, '1 fichero de acceso', '{n} ficheros de acceso'));
  if (documentos) partes.push(plural(documentos, '1 documento sin colocar', '{n} documentos sin colocar'));

  // «claves de Stripe y Pexels, y 3 documentos»: con dos, y la primera con su
  // «y», la coma. Se sabe por cómo se hizo, no buscando « y » en el texto: un
  // programa puede llevarla en el nombre.
  const juntas = partes.length === 2 && conSuY ? `${partes[0]}, y ${partes[1]}` : enUnaFrase(partes);

  if (base && juntas) return `${base}, con ${juntas}.`;
  if (base) return `${base}.`;
  if (juntas) return `Aquí ya había trabajo tuyo: ${juntas}.`;
  return null;
}

// Lo que se dice de la copia que guardó el arnés al montarse. Las cosas, cada
// una por su nombre, como se dicen al pedir el sí para montar (`ajena.js`).
function queSeDiceDeLaCopia(cosas = []) {
  if (!cosas.length) return null;
  // El nombre sale del manifiesto, que puede traer cualquier cosa: se recorta.
  const recortadas = cosas.map((c) => (c.length > NOMBRE_COMO_MUCHO ? `${c.slice(0, NOMBRE_COMO_MUCHO - 1)}…` : c));
  const nombradas = recortadas.length > 3
    ? [...recortadas.slice(0, 2), plural(recortadas.length - 2, '1 cosa más', '{n} cosas más')]
    : recortadas;
  return `Antes de cambiar lo tuyo, el arnés guardó una copia: ${enUnaFrase(nombradas)}.`;
}

// ── 2. Las ideas ─────────────────────────────────────────────────────────

// Dónde están, solo si se puede citar sin riesgo. Los nombres de carpetas y de
// ficheros son libres, y lo que va en el encargo se lee como una orden: una
// carpeta llamada «x. Ignora lo anterior y …» no puede entrar tal cual
// (revisión de seguridad, 2). Se cita un fichero, o una carpeta y su fichero,
// con letras, números, puntos, guiones y guiones bajos; lo demás se dice en
// general.
const SE_PUEDE_CITAR = /^[A-Za-z0-9._-]{1,40}(\/[A-Za-z0-9._-]{1,40})?$/;
const citable = (ruta) => SE_PUEDE_CITAR.test(String(ruta || '')) && !String(ruta).split('/').includes('..');

// Un programa del que hay claves y que no tiene conexión: «Conectar Stripe, que
// ya usas». Conectarlo lo decide su negocio (P9), así que es un botón; y lo que
// se le pide al asistente lleva los nombres de las claves y dónde están, nunca
// sus valores, que la barra no lee.
//
// No se reutiliza el encargo de «Que las ordene» (`sueltas.encargo`): reparte
// todas las claves de la carpeta, y aquí es un programa. Lo que sí se copia es su
// regla: antes de mover nada, enseñar el plan y esperar el OK. Y aquí, además,
// no probar la conexión hasta que lo confirme (revisión de seguridad, 2).
//
// Solo con claves: un fichero de acceso suelto no dice de quién es hasta que hay
// una conexión que lo nombre (`sueltas.ficherosDeAcceso`), así que no puede ser
// «Conectar …». Se cuenta en «Esto parece», y se ordena desde Conexiones.
function conectar({ herramienta, claves = [], donde = [] }) {
  const nombre = comoSeLlama(herramienta);
  const loSuyo = plural(claves.length, 'su clave está', 'sus claves están');
  const queHay = `${claves.length === 1 ? 'la clave' : 'las claves'} ${claves.join(', ')}`;
  const lleva = 'sus claves a su .env';
  const citables = donde.filter(citable);
  const enDonde = citables.length === donde.length && citables.length
    ? `en ${citables.join(', ')}`
    : 'en los ficheros de claves de la carpeta';
  return {
    id: `conectar-${herramienta}`,
    texto: `Ya usas ${nombre}: ${loSuyo} en la carpeta, pero todavía no tiene su conexión.`,
    boton: `Conectar ${nombre}`,
    accion: {
      tipo: 'pedir',
      prompt: `Por lo que hay en esta carpeta, ya uso ${nombre} y todavía no tiene conexión: hay ${queHay}, ${enDonde}. `
        + 'Conéctalo. Si tienes la habilidad connect-tool, úsala. '
        + `Móntalo con el protocolo de harness: copia 01-TOOLS/_TEMPLATE a 01-TOOLS/${herramienta}, lleva ahí ${lleva}, `
        + 'escribe su .env.example, su CREDENTIALS.md con dónde se saca cada una, los pasos en su README, en una sección «Cómo conectarla», y su prueba de conexión. '
        + 'No imprimas ni me pegues ningún valor, y antes de mover nada mira qué lo está leyendo ahora y no lo rompas. '
        + 'Antes de crear o mover nada, enséñame en pocas líneas qué vas a hacer y espera mi OK. '
        + 'No pruebes la conexión hasta que te lo confirme, y cuando la pruebes, comprueba que funciona antes de darlo por buena.',
    },
  };
}

// Los documentos tirados en la carpeta. El botón y lo que pide son los de
// Documentos entregados › Sin colocar todavía: un nombre por cosa.
function colocar(cuantos) {
  return {
    id: 'colocar-documentos',
    texto: cuantos === 1
      ? 'Hay 1 documento sin colocar en la carpeta. Todavía no ha sacado nada de él.'
      : `Hay ${cuantos} documentos sin colocar en la carpeta. Todavía no ha sacado nada de ellos.`,
    boton: cuantos === 1 ? 'Que lo coloque y lo lea' : 'Que los coloque y los lea',
    accion: {
      tipo: 'pedir',
      prompt: 'Hay documentos sueltos en la carpeta, fuera de la bandeja. Míralos, ponlos donde toque y cuéntame en dos líneas qué has sacado de ellos. '
        + 'Si alguno es parte de un proyecto de esta carpeta —una imagen que usa la web, por ejemplo—, déjalo donde está.',
    },
  };
}

// Lo que dijo al prepararla, entre comillas y sin pasarse de largo.
function corto(objetivo) {
  const limpio = String(objetivo || '').trim().replace(/[.\s]+$/, '');
  return limpio.length > 70 ? `${limpio.slice(0, 69).trimEnd()}…` : limpio;
}

// Una habilidad del catálogo que encaja, con el mismo `id` y la misma acción que
// el consejo de `consejos.js`: si la tarjeta ya la propuso, su «Ahora no» vale
// para las dos.
function anadir(capacidad, objetivo) {
  const porQue = objetivo ? `Para «${corto(objetivo)}»` : 'Por lo que hay aquí';
  return {
    id: `capacidad-${capacidad.id}`,
    texto: `${porQue}, te vendría bien la habilidad (skill) ${capacidad.nombre}. ${capacidad.frase}`,
    boton: 'Añadirla',
    accion: { tipo: 'aprenderCapacidad', capacidad: capacidad.id, nombre: capacidad.nombre },
  };
}

// Todas las ideas, en orden:
//
//   1. un programa del que hay claves y que no tiene conexión, el de más claves;
//   2. los documentos sin colocar;
//   3. las habilidades del catálogo que encajan: primero con lo que dijo al
//      prepararla, después con lo que hay. En una carpeta nueva solo hay esto;
//   4. los demás programas sin conexión.
//
// Así las tres primeras, que son las de la tarjeta, son de tres clases.
function ordenadas({ porMontar = [], documentos = 0, delObjetivo = [], deLoQueHay = [], objetivo = '' } = {}) {
  const lista = [];
  if (porMontar.length) lista.push(conectar(porMontar[0]));
  if (documentos) lista.push(colocar(documentos));
  const yaEsta = new Set();
  for (const capacidad of delObjetivo) {
    yaEsta.add(capacidad.id);
    lista.push(anadir(capacidad, objetivo));
  }
  for (const capacidad of deLoQueHay) {
    if (!yaEsta.has(capacidad.id)) lista.push(anadir(capacidad, null));
  }
  for (const programa of porMontar.slice(1)) lista.push(conectar(programa));
  return lista;
}

const sinApartar = ({ silenciados = {}, ahora = Date.now() }) => (idea) => !silenciados[idea.id] || ahora - silenciados[idea.id] > APARTADA_DURANTE;

// Las de la tarjeta: como mucho tres, y de una en una. Se cortan a tres antes
// de quitar las apartadas: «Ahora no» deja ver la siguiente, no saca una cuarta.
function lasIdeas(opciones = {}) {
  return ordenadas(opciones).slice(0, CABEN).filter(sinApartar(opciones));
}

// Las de Ayuda › Sugerencias: la lista entera, sin las apartadas.
function todasLasIdeas(opciones = {}) {
  return ordenadas(opciones).filter(sinApartar(opciones));
}

// ── Lo que se lee del disco ──────────────────────────────────────────────

// Una carpeta de verdad, no un enlace: lo de `.rsc/` lo puede traer un
// repositorio de fuera, y abrir con el sistema un enlace a otro sitio podría
// abrir un programa en vez de una carpeta.
function esCarpetaDeVerdad(ruta) {
  try {
    const info = fs.lstatSync(ruta);
    return info.isDirectory() && !info.isSymbolicLink();
  } catch {
    return false;
  }
}

function leerElManifiesto(fichero) {
  try {
    const info = fs.lstatSync(fichero);
    if (!info.isFile() || info.size > MANIFIESTO_COMO_MUCHO) return null;
    return JSON.parse(fs.readFileSync(fichero, 'utf8'));
  } catch {
    return null;
  }
}

// La huella de un fichero, para saber si ha cambiado sin leerlo.
function huellaDe(fichero) {
  try {
    const info = fs.lstatSync(fichero);
    return `${info.size}:${info.mtimeMs}`;
  } catch {
    return null;
  }
}

// Lo último que se encontró, por la carpeta de las copias y su `mtime`: si no
// ha cambiado nada, no se vuelve a leer ningún manifiesto (revisión de
// seguridad, 1). El de la copia elegida se mira por su huella, por si lo
// reescriben en su sitio.
let enMemoria = { clave: null, id: null, huella: null, cosas: null };

// Qué es lo guardado, dicho como se dice al pedir el sí para montar.
function queEsLoGuardado(rel) {
  const sitios = require('../media/railes/sitios');
  const ajena = require('./ajena');
  const carpeta = path.posix.dirname(rel);
  const nombre = path.posix.basename(rel);
  for (const suyo of Object.values(sitios.SITIOS)) {
    const es = (partes) => Array.isArray(partes) && carpeta === partes.join('/');
    // Una habilidad en un fichero (Cursor: `<id>.mdc`) se nombra sin su extensión;
    // y un botón es una habilidad (decisión 141), esté donde los deje el asistente.
    if (es(suyo.habilidades) || es(suyo.botones)) {
      return `la habilidad «${suyo.habilidadEnUnFichero ? nombre.replace(new RegExp(`\\${suyo.habilidadEnUnFichero}$`), '') : nombre}»`;
    }
    if (es(suyo.comandos)) return `el comando «${nombre.replace(/\.md$/, '')}»`;
    if (es(suyo.agentes)) return `el agente «${nombre.replace(/\.(md|toml)$/, '')}»`;
  }
  return ajena.comoSeDice(rel);
}

// La copia que RSC guarda antes de montar (`.rsc/backups/`, la operación
// `onboarding-transaction`). Vale la del primer montaje: antes de él, todo lo
// que había era de esa persona; en los siguientes, lo que se guarda ya es del
// arnés. De ella, lo que existía y no es de RSC. Null si no hay nada suyo.
//
// Con topes: se miran las 200 primeras por su nombre (RSC las nombra por la
// fecha), se ordenan por la fecha real de su carpeta y no por la que dice el
// manifiesto, que puede decir cualquier cosa, y los manifiestos se leen de uno en
// uno hasta el primer montaje.
function laCopiaDelMontaje(raiz) {
  if (!raiz) return null;
  const copias = path.join(raiz, '.rsc', 'backups');
  if (!esCarpetaDeVerdad(path.join(raiz, '.rsc')) || !esCarpetaDeVerdad(copias)) return null;

  let clave;
  try {
    clave = `${copias}:${fs.lstatSync(copias).mtimeMs}`;
  } catch {
    return null;
  }
  const conCarpeta = (id, cosas) => {
    const carpeta = path.join(copias, id, 'files');
    return esCarpetaDeVerdad(carpeta) ? { id, carpeta, cosas } : null;
  };
  if (enMemoria.clave === clave) {
    // Ningún montaje entre las copias: hasta que cambie la carpeta, sigue sin haberlo.
    if (!enMemoria.id) return null;
    if (huellaDe(path.join(copias, enMemoria.id, 'manifest.json')) === enMemoria.huella) {
      return enMemoria.cosas ? conCarpeta(enMemoria.id, enMemoria.cosas) : null;
    }
  }

  let ids;
  try {
    ids = fs.readdirSync(copias).sort().slice(0, COPIAS_QUE_SE_MIRAN);
  } catch {
    return null;
  }
  const porFecha = ids
    .map((id) => {
      try {
        const info = fs.lstatSync(path.join(copias, id));
        return info.isDirectory() && !info.isSymbolicLink() ? { id, cuando: info.mtimeMs } : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.cuando - b.cuando || a.id.localeCompare(b.id));

  let primero = null;
  for (const { id } of porFecha) {
    const manifiesto = leerElManifiesto(path.join(copias, id, 'manifest.json'));
    if (manifiesto && manifiesto.operation === 'onboarding-transaction') {
      primero = { id, manifiesto };
      break;
    }
  }
  if (!primero) {
    enMemoria = { clave, id: null, huella: null, cosas: null };
    return null;
  }

  const { DE_RSC } = require('./ajena');
  const entradas = Array.isArray(primero.manifiesto.entries) ? primero.manifiesto.entries : [];
  // Lo que existía, no es de RSC y no es un enlace: los enlaces los pone RSC, que
  // enlaza sus habilidades en vez de copiarlas.
  const suyas = entradas.filter((e) => e && e.existed === true && e.kind !== 'symlink' && typeof e.path === 'string' && e.path && !DE_RSC.test(e.path));
  const cosas = suyas.length ? [...new Set(suyas.map((e) => queEsLoGuardado(e.path)))] : null;
  enMemoria = { clave, id: primero.id, huella: huellaDe(path.join(copias, primero.id, 'manifest.json')), cosas };
  return cosas ? conCarpeta(primero.id, cosas) : null;
}

// La copia, como la pinta la pantalla: la frase y el botón para verla. La
// acción no lleva la ruta: la extensión la vuelve a buscar en el disco.
function laCopiaEnPantalla(copia) {
  if (!copia) return null;
  return { texto: queSeDiceDeLaCopia(copia.cosas), accion: { tipo: 'verLaCopiaDelMontaje' } };
}

// Los documentos sin colocar, todos: `papeles` corta su lista a 40 para
// enseñarla, y aquí se cuentan. Qué es un documento lo decide `papeles.donde`,
// la misma regla que la lista —sobre la carpeta abierta, que es `raiz`—, con dos
// cosas más (revisión de corrección, 1):
//   · los ficheros de bloqueo de Office (`~$presupuesto.docx`) no son nada;
//   · en un proyecto —lo dice `terreno`, o RSC apuntó con qué está hecho— un
//     texto, una imagen o una tabla de la raíz son del proyecto: el
//     `requirements.txt`, el `robots.txt`, el logo de la web. Ahí solo cuentan
//     los documentos de oficina.
const DE_OFICINA = /\.(pdf|docx?|xlsx?|pptx?|odt|ods|odp|rtf|pages|numbers|key|eml|msg)$/i;
function sinColocar(raiz, { esUnProyecto = false } = {}) {
  const papeles = require('./papeles');
  try {
    return fs.readdirSync(raiz, { withFileTypes: true })
      .filter((e) => e.isFile() && !e.name.startsWith('.') && !e.name.startsWith('~$') && papeles.donde(e.name))
      .filter((e) => !esUnProyecto || DE_OFICINA.test(e.name))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

// Si en la carpeta hay algo suyo, aunque la barra no sepa decir qué es: lo que
// no es del arnés ni va escondido. Sin nada así, la primera lectura no tiene nada
// que decir y no lo tendrá (revisión de corrección, 8).
const DEL_ARNES = new Set(['01-TOOLS', '02-DOCS', 'CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'CONVENTIONS.md', 'Thumbs.db']);
function hayAlgoSuyo(raiz) {
  try {
    return fs.readdirSync(raiz).some((n) => !n.startsWith('.') && !DEL_ARNES.has(n));
  } catch {
    return false;
  }
}

// Prefijos que no son un programa: `DEBUG_MODE`, `FEATURE_FLAG_X`,
// `NEXT_TELEMETRY_DISABLED` (revisión de corrección, 2). No es una lista de
// herramientas: es la de lo que nunca lo es.
const NO_SON_UN_PROGRAMA = new Set(['DEBUG', 'FEATURE', 'FEATURES', 'FLAG', 'FLAGS', 'TELEMETRY', 'LOG', 'LOGS', 'LOGGING', 'NODE', 'ENV', 'PORT',
  'HOST', 'URL', 'BASE', 'PUBLIC', 'TEST', 'DEV', 'PROD', 'LOCAL', 'CACHE', 'TIMEOUT', 'MAX', 'MIN', 'DEFAULT', 'ENABLE', 'DISABLE']);

// De quién son las claves sueltas, con su nombre, y cuáles no tienen conexión.
// Un programa sin conexión cuenta si alguna de sus claves suena a secreto o si el
// catálogo lo conoce, y nunca si su prefijo no es de nadie. Los ficheros de
// acceso, aparte: se cuentan, y no se ofrece conectarlos.
function lasClaves(resumen, catalogo = []) {
  if (!resumen) return { programas: [], porMontar: [], sinDueno: 0, ficheros: 0 };
  const { SUENA_A_SECRETO } = require('./sueltas');
  const reparto = resumen.reparto || [];
  const esUnPrograma = (g) => g.existe || (!NO_SON_UN_PROGRAMA.has(String(g.herramienta).toUpperCase())
    && (g.claves.some((c) => SUENA_A_SECRETO.test(c)) || catalogo.some((c) => pelar(c.id) === pelar(g.herramienta))));
  const suyos = reparto.filter(esUnPrograma);

  const porMontar = suyos
    .filter((g) => !g.existe)
    .map((g) => ({ herramienta: g.herramienta, claves: [...g.claves], donde: [...g.donde] }));
  // El que más se usa primero: el de más claves.
  porMontar.sort((a, b) => b.claves.length - a.claves.length || a.herramienta.localeCompare(b.herramienta));
  return {
    programas: suyos.map((g) => comoSeLlama(g.herramienta)),
    porMontar,
    sinDueno: (resumen.sinDueno || []).length,
    ficheros: (resumen.ficherosDeAcceso || []).length,
  };
}

// Todo junto, leído del disco: la tarjeta «Esto parece» (o null) y las ideas.
// `corpus` es lo que la barra ya junta para los consejos (su objetivo, su
// wiki, sus botones y sus conexiones); aquí se le añade lo que hay en la
// carpeta.
function queSeVe({ carpetaDeLaExtension, corpus = '', silenciados = {}, ahora = Date.now() } = {}) {
  const proyecto = require('./proyecto');
  const terreno = require('./terreno');
  const consejos = require('./consejos');
  const identidad = require('./identidad');
  const rsc = require('./rsc');

  const raiz = proyecto.raiz();
  if (!raiz) return { parece: null, idea: null, ideas: [], hayAlgoSuyo: false };

  const visto = terreno.mirarYClasificar();
  const catalogo = consejos.capacidades(carpetaDeLaExtension);
  const evidencia = ((((proyecto.declaracion() || {}).onboarding || {}).plan || {}).evidence) || {};
  const stacks = Array.isArray(evidencia.stacks) ? evidencia.stacks.filter((s) => typeof s === 'string') : [];
  const parece = visto.carpeta && visto.carpeta.parece;
  const documentos = sinColocar(raiz, { esUnProyecto: Boolean(parece) || stacks.length > 0 });
  const { programas, porMontar, sinDueno, ficheros } = lasClaves(visto.claves, catalogo);
  const copia = laCopiaEnPantalla(laCopiaDelMontaje(raiz));

  const texto = loQueParece({
    parece, stacks, catalogo, programas, clavesSinDueno: sinDueno, ficheros, documentos: documentos.length,
  });
  const tarjeta = texto || copia ? { texto, copia, entendido: { tipo: 'entendidoLoQueParece' } } : null;

  const objetivo = identidad.objetivo();
  const yaInstaladas = rsc.habilidadesPuestas();
  const loQueHay = [
    corpus,
    ...programas,
    ...conQueEstaHecho(stacks, catalogo),
    // «factura-enero.pdf» dice «factura enero».
    ...documentos.map((d) => d.replace(/\.[^.]+$/, '').replace(/[-_.]+/g, ' ')),
  ].join(' ');
  const opciones = {
    porMontar,
    documentos: documentos.length,
    delObjetivo: consejos.loQuePodriaAprender({ corpus: objetivo, yaInstaladas, catalogo }),
    deLoQueHay: consejos.loQuePodriaAprender({ corpus: loQueHay, yaInstaladas, catalogo }),
    objetivo,
    silenciados,
    ahora,
  };
  // La de la tarjeta, de las tres primeras; y la lista entera, para Sugerencias.
  return { parece: tarjeta, idea: lasIdeas(opciones)[0] || null, ideas: todasLasIdeas(opciones), hayAlgoSuyo: hayAlgoSuyo(raiz) };
}

module.exports = {
  loQueParece, lasIdeas, todasLasIdeas, queSeDiceDeLaCopia, laCopiaDelMontaje, laCopiaEnPantalla, queSeVe, lasClaves, comoSeLlama,
  enUnaFrase, sinColocar, hayAlgoSuyo, APARTADA_DURANTE, CABEN,
};
