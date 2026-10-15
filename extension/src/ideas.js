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

const pelar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const plural = (n, uno, varios) => (n === 1 ? uno : varios.replace('{n}', n));

// «a», «a y b», «a, b y c».
function enUnaFrase(lista) {
  if (lista.length < 2) return lista.join('');
  return `${lista.slice(0, -1).join(', ')} y ${lista[lista.length - 1]}`;
}

// El nombre de un programa deducido de sus claves: `STRIPE` → «Stripe». Lo que
// ya trae mayúsculas y minúsculas —el nombre de su carpeta— se deja como está.
function comoSeLlama(herramienta) {
  const limpio = String(herramienta || '').replace(/[_-]+/g, ' ').trim();
  if (!limpio || limpio !== limpio.toUpperCase()) return limpio;
  return limpio.charAt(0) + limpio.slice(1).toLowerCase();
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
// `documentos`    cuántos documentos hay sin colocar en la carpeta
//
// Devuelve la frase, o null si no hay nada que decir.
function loQueParece({
  parece = null, stacks = [], catalogo = [], programas = [], clavesSinDueno = 0, documentos = 0,
} = {}) {
  // «algo en Python hecho con Python» no: lo que ya dice lo que parece, sobra.
  const hecho = conQueEstaHecho(stacks, catalogo).filter((nombre) => !(parece && pelar(parece).includes(pelar(nombre))));

  let base = null;
  if (parece) base = `Esto parece ${parece}${hecho.length ? ` ${hechoCon(parece)} con ${enUnaFrase(hecho)}` : ''}`;
  else if (hecho.length) base = `Esto parece algo hecho con ${enUnaFrase(hecho)}`;

  const partes = [];
  if (programas.length) {
    const sobran = programas.length > PROGRAMAS_QUE_CABEN;
    const nombrados = sobran ? programas.slice(0, PROGRAMAS_QUE_CABEN - 1) : programas;
    partes.push(`claves de ${enUnaFrase(sobran ? [...nombrados, `${programas.length - nombrados.length} más`] : nombrados)}`);
  } else if (clavesSinDueno) {
    partes.push(plural(clavesSinDueno, '1 clave suelta', '{n} claves sueltas'));
  }
  if (documentos) partes.push(plural(documentos, '1 documento sin colocar', '{n} documentos sin colocar'));

  // «claves de Stripe y Pexels, y 3 documentos»: con una «y» dentro, la coma.
  const juntas = partes.length < 2 ? partes.join('') : `${partes[0]}${partes[0].includes(' y ') ? ', y ' : ' y '}${partes[1]}`;

  if (base && juntas) return `${base}, con ${juntas}.`;
  if (base) return `${base}.`;
  if (juntas) return `Aquí ya había trabajo tuyo: ${juntas}.`;
  return null;
}

// Lo que se dice de la copia que guardó el arnés al montarse. Las cosas, cada
// una por su nombre, como se dicen al pedir el sí para montar (`ajena.js`).
function queSeDiceDeLaCopia(cosas = []) {
  if (!cosas.length) return null;
  const nombradas = cosas.length > 3
    ? [...cosas.slice(0, 2), plural(cosas.length - 2, '1 cosa más', '{n} cosas más')]
    : cosas;
  return `Antes de cambiar lo tuyo, el arnés guardó una copia: ${enUnaFrase(nombradas)}.`;
}

// ── 2. Las ideas ─────────────────────────────────────────────────────────

// Un programa del que hay claves y que no tiene conexión: «Conectar Stripe, que
// ya usas». Conectarlo lo decide su negocio (P9), así que es un botón; y lo que
// se le pide al asistente lleva los nombres de las claves y dónde están, nunca
// sus valores, que la barra no lee.
function conectar({ herramienta, claves = [], donde = [], conFichero = false }) {
  const nombre = comoSeLlama(herramienta);
  const loSuyo = claves.length
    ? plural(claves.length, 'su clave está', 'sus claves están')
    : 'su fichero de acceso está';
  const queHay = [
    claves.length ? `${claves.length === 1 ? 'la clave' : 'las claves'} ${claves.join(', ')}` : '',
    conFichero ? 'un fichero de acceso' : '',
  ].filter(Boolean).join(' y ');
  const lleva = [
    claves.length ? 'sus claves a su .env' : '',
    conFichero ? 'el fichero de acceso a su carpeta keys' : '',
  ].filter(Boolean).join(' y ');
  return {
    id: `conectar-${herramienta}`,
    texto: `Ya usas ${nombre}: ${loSuyo} en la carpeta, pero todavía no tiene su conexión.`,
    boton: `Conectar ${nombre}`,
    accion: {
      tipo: 'pedir',
      prompt: `Por lo que hay en esta carpeta, ya uso ${nombre} y todavía no tiene conexión: hay ${queHay}, en ${donde.join(', ')}. `
        + 'Conéctalo. Si tienes la habilidad connect-tool, úsala. '
        + `Móntalo con el protocolo de harness: copia 01-TOOLS/_TEMPLATE a 01-TOOLS/${herramienta}, lleva ahí ${lleva}, `
        + 'escribe su .env.example, su CREDENTIALS.md con dónde se saca cada una, los pasos en su README, en una sección «Cómo conectarla», y su prueba de conexión. '
        + 'No imprimas ni me pegues ningún valor, y antes de mover nada mira qué lo está leyendo ahora y no lo rompas. Comprueba que funciona antes de darlo por bueno.',
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

// Las ideas, en orden y como mucho tres:
//
//   1. un programa del que hay claves y que no tiene conexión, el de más claves;
//   2. los documentos sin colocar;
//   3. las habilidades del catálogo que encajan: primero con lo que dijo al
//      prepararla, después con lo que hay. En una carpeta nueva solo hay esto.
//
// Se cortan a tres antes de quitar las apartadas: «Ahora no» deja ver la
// siguiente, no saca una cuarta.
function lasIdeas({
  porMontar = [], documentos = 0, delObjetivo = [], deLoQueHay = [], objetivo = '', silenciados = {}, ahora = Date.now(),
} = {}) {
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
  return lista
    .slice(0, CABEN)
    .filter((idea) => !silenciados[idea.id] || ahora - silenciados[idea.id] > APARTADA_DURANTE);
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
    if (!info.isFile() || info.size > 1024 * 1024) return null;
    return JSON.parse(fs.readFileSync(fichero, 'utf8'));
  } catch {
    return null;
  }
}

// Qué es lo guardado, dicho como se dice al pedir el sí para montar.
function queEsLoGuardado(rel) {
  const sitios = require('../media/railes/sitios');
  const ajena = require('./ajena');
  const carpeta = path.posix.dirname(rel);
  const nombre = path.posix.basename(rel);
  for (const suyo of Object.values(sitios.SITIOS)) {
    const es = (partes) => Array.isArray(partes) && carpeta === partes.join('/');
    if (es(suyo.habilidades)) return `la habilidad «${nombre}»`;
    if (es(suyo.comandos)) return `el comando «${nombre.replace(/\.md$/, '')}»`;
    if (es(suyo.agentes)) return `el agente «${nombre.replace(/\.(md|toml)$/, '')}»`;
  }
  return ajena.comoSeDice(rel);
}

// La copia que RSC guarda antes de montar (`.rsc/backups/`, la operación
// `onboarding-transaction`). Vale la del primer montaje: antes de él, todo lo
// que había era de esa persona; en los siguientes, lo que se guarda ya es del
// arnés. De ella, lo que existía y no es de RSC. Null si no hay nada suyo.
function laCopiaDelMontaje(raiz) {
  if (!raiz) return null;
  const copias = path.join(raiz, '.rsc', 'backups');
  if (!esCarpetaDeVerdad(path.join(raiz, '.rsc')) || !esCarpetaDeVerdad(copias)) return null;

  let ids;
  try {
    ids = fs.readdirSync(copias);
  } catch {
    return null;
  }
  const montajes = ids
    .filter((id) => esCarpetaDeVerdad(path.join(copias, id)))
    .map((id) => ({ id, manifiesto: leerElManifiesto(path.join(copias, id, 'manifest.json')) }))
    .filter(({ manifiesto }) => manifiesto && manifiesto.operation === 'onboarding-transaction')
    .sort((a, b) => String(a.manifiesto.createdAt || '').localeCompare(String(b.manifiesto.createdAt || '')) || a.id.localeCompare(b.id));
  const [primero] = montajes;
  if (!primero) return null;

  const { DE_RSC } = require('./ajena');
  const entradas = Array.isArray(primero.manifiesto.entries) ? primero.manifiesto.entries : [];
  const suyas = entradas.filter((e) => e && e.existed === true && typeof e.path === 'string' && e.path && !DE_RSC.test(e.path));
  const carpeta = path.join(copias, primero.id, 'files');
  if (!suyas.length || !esCarpetaDeVerdad(carpeta)) return null;
  return { id: primero.id, carpeta, cosas: [...new Set(suyas.map((e) => queEsLoGuardado(e.path)))] };
}

// La copia, como la pinta la pantalla: la frase y el botón para verla. La
// acción no lleva la ruta: la extensión la vuelve a buscar en el disco.
function laCopiaEnPantalla(copia) {
  if (!copia) return null;
  return { texto: queSeDiceDeLaCopia(copia.cosas), accion: { tipo: 'verLaCopiaDelMontaje' } };
}

// Los documentos sin colocar, todos: `papeles` corta su lista a 40 para
// enseñarla, y aquí se cuentan. Qué es un documento lo decide `papeles.donde`,
// la misma regla que la lista.
function sinColocar(raiz) {
  const papeles = require('./papeles');
  try {
    return fs.readdirSync(raiz, { withFileTypes: true })
      .filter((e) => e.isFile() && !e.name.startsWith('.') && papeles.donde(e.name))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

// De quién son las claves sueltas, con su nombre, y cuáles no tienen conexión.
function lasClaves(resumen) {
  if (!resumen) return { programas: [], porMontar: [], sinDueno: 0 };
  const reparto = resumen.reparto || [];
  const deAcceso = (resumen.ficherosDeAcceso || []).filter((f) => f.herramienta);
  const programas = [...new Set([...reparto.map((g) => g.herramienta), ...deAcceso.map((f) => f.herramienta)])].map(comoSeLlama);

  const porMontar = reparto
    .filter((g) => !g.existe)
    .map((g) => ({ herramienta: g.herramienta, claves: [...g.claves], donde: [...g.donde], conFichero: false }));
  for (const f of deAcceso.filter((x) => !x.existe)) {
    const suyo = porMontar.find((p) => p.herramienta === f.herramienta);
    if (suyo) {
      suyo.conFichero = true;
      if (!suyo.donde.includes(f.donde)) suyo.donde.push(f.donde);
    } else {
      porMontar.push({ herramienta: f.herramienta, claves: [], donde: [f.donde], conFichero: true });
    }
  }
  // El que más se usa primero: el de más claves.
  porMontar.sort((a, b) => b.claves.length - a.claves.length || a.herramienta.localeCompare(b.herramienta));
  return { programas, porMontar, sinDueno: (resumen.sinDueno || []).length };
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
  if (!raiz) return { parece: null, ideas: [] };

  const visto = terreno.mirarYClasificar();
  const catalogo = consejos.capacidades(carpetaDeLaExtension);
  const evidencia = ((((proyecto.declaracion() || {}).onboarding || {}).plan || {}).evidence) || {};
  const stacks = Array.isArray(evidencia.stacks) ? evidencia.stacks.filter((s) => typeof s === 'string') : [];
  const documentos = sinColocar(raiz);
  const { programas, porMontar, sinDueno } = lasClaves(visto.claves);
  const copia = laCopiaEnPantalla(laCopiaDelMontaje(raiz));

  const texto = loQueParece({
    parece: visto.carpeta && visto.carpeta.parece, stacks, catalogo, programas, clavesSinDueno: sinDueno, documentos: documentos.length,
  });
  const parece = texto || copia ? { texto, copia, entendido: { tipo: 'entendidoLoQueParece' } } : null;

  const objetivo = identidad.objetivo();
  const yaInstaladas = rsc.habilidadesPuestas();
  const loQueHay = [
    corpus,
    ...programas,
    ...conQueEstaHecho(stacks, catalogo),
    // «factura-enero.pdf» dice «factura enero».
    ...documentos.map((d) => d.replace(/\.[^.]+$/, '').replace(/[-_.]+/g, ' ')),
  ].join(' ');
  const ideas = lasIdeas({
    porMontar,
    documentos: documentos.length,
    delObjetivo: consejos.loQuePodriaAprender({ corpus: objetivo, yaInstaladas, catalogo }),
    deLoQueHay: consejos.loQuePodriaAprender({ corpus: loQueHay, yaInstaladas, catalogo }),
    objetivo,
    silenciados,
    ahora,
  });
  return { parece, ideas };
}

module.exports = {
  loQueParece, lasIdeas, queSeDiceDeLaCopia, laCopiaDelMontaje, laCopiaEnPantalla, queSeVe, lasClaves, comoSeLlama,
  APARTADA_DURANTE, CABEN,
};
