// "Guardar copia de seguridad" y "Volver a como estaba el martes".
//
// Por debajo es git. Por delante, la palabra commit no aparece nunca: el
// diccionario (docs/diccionario.md) la tiene en la lista de prohibidas.
//
// El trabajo sucio lo hace instalador/comun/historial.js, que es el mismo
// módulo que usa el instalador al montar la carpeta. Aquí solo queda lo que
// esto tiene de propio: las palabras.
//
// Y lo hace con el git del sistema, que es obligatorio y está instalado
// (instalador/comun/git.js dice por qué). Durante un tiempo lo hizo una
// biblioteca de JavaScript que viajaba dentro, para un Mac sin las
// herramientas de Xcode; esa biblioteca sigue ahí de resto, pero ya no es el
// camino.

const fs = require('node:fs');
const path = require('node:path');
const proyecto = require('./proyecto');
const entorno = require('./entorno');
const git = require('./git');
const github = require('./github');
const conexiones = require('./conexiones');
const procesos = require('./procesos');

// Se busca una vez y se recuerda, aunque no esté: si no hay módulo no lo va a
// haber más tarde, y no tiene sentido tocar el disco en cada pulsación.
let modulo;
let yaBuscado = false;

function historial() {
  if (!yaBuscado) {
    yaBuscado = true;
    const ruta = entorno.moduloComun('historial');
    try {
      modulo = ruta ? require(ruta) : null;
    } catch {
      modulo = null;
    }
  }
  return modulo;
}

// Las copias las hace el git de verdad, el mismo que usa el arnés: git es
// obligatorio y está instalado (git.js dice por qué).
const comoLlamar = () => ({ git: entorno.git() });

function fechaLarga(cuando = new Date()) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeStyle: 'short' }).format(cuando);
}

// Cuánto hace, en palabras y por días de calendario: a las 00:10, lo de las
// 23:50 es "ayer", no "hoy". El "el martes" del nombre del botón sale de aquí.
function haceCuanto(iso, ahora = Date.now()) {
  const entonces = new Date(iso);
  const dia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((dia(new Date(ahora)) - dia(entonces)) / 86400000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 7) return `el ${new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(entonces)}`;
  return `el ${new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(entonces)}`;
}

// Para la línea de las copias de la principal: en el mismo día, en minutos u
// horas; más atrás, como `haceCuanto` (decisión 138).
function haceUnRato(iso, ahora = Date.now()) {
  const minutos = Math.floor((ahora - new Date(iso).getTime()) / 60000);
  if (minutos < 2) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} minutos`;
  const horas = Math.floor(minutos / 60);
  if (horas < 12) return horas === 1 ? 'hace una hora' : `hace ${horas} horas`;
  return haceCuanto(iso, ahora);
}

const NO_PUEDO = 'No puedo guardar copias en este ordenador. Pulsa «Algo va mal» y pásale el código a tu tutor.';
const SIN_PIEZA = 'Falta una pieza para poder guardar. Puedo ponerla yo.';

// Esto volvió a preguntar lo que preguntaba al principio: si hay git. Durante
// un tiempo preguntó algo más amplio —"¿se pueden guardar copias?"— porque la
// biblioteca de JavaScript viajaba con nosotros y la respuesta era que sí
// siempre. Ya no: git es obligatorio, está instalado, y es el que hace el
// trabajo. Una respuesta que siempre era que sí escondía que el arnés se
// quedaba a medias por su cuenta.
let sabemosSiHayGit = null;

async function hayGit() {
  if (sabemosSiHayGit === null) sabemosSiHayGit = await git.hay();
  return sabemosSiHayGit;
}

// Después de instalarlo hay que volver a preguntar, o la barra seguiría
// diciendo que falta.
const olvidarSiHayGit = () => { sabemosSiHayGit = null; };

// Crear el historial de esta carpeta como lo crea la barra: rama `main` y su
// identidad solo aquí, nunca en todo el ordenador (lo hace `historial.iniciar`).
async function iniciar() {
  const h = historial();
  const donde = proyecto.raiz();
  if (!h || !donde || !(await hayGit())) return { ok: false, faltaGit: true };
  return h.iniciar(donde, comoLlamar());
}

// Lo que no entra en una copia (F1): las credenciales que el inventario reconoce
// sueltas, ficheros de claves y ficheros de acceso, también las de una
// aplicación, que están en su sitio pero son claves igual. `historial` deja fuera
// las que git todavía no seguía; una que ya estaba en git sigue ahí, porque
// sacarla lo decide la persona, y la barra lo avisa aparte: en la tarjeta de
// fuera de sitio, o en la suya si es de una aplicación (decisión 135).
// Por aquí pasan el botón y el guardado solo.
function loQueNoEntra() {
  const { claves, ficheros } = require('./sueltas').paraProteger();
  return [...new Set([...claves, ...ficheros].map((s) => s.donde.split(path.sep).join('/')))].sort();
}

// Lo que se ha dejado fuera, dicho como en el diccionario, y el botón que lo
// pone en su sitio, que es el encargo de ordenar las claves.
function dichoDeLoQueNoEntro(excluidos) {
  if (!excluidos.length) return { texto: '', boton: null };
  const nombres = excluidos.map((d) => `«${path.basename(d)}»`);
  const lista = nombres.length < 2 ? nombres.join('') : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
  const deClaves = excluidos.every((d) => /^\.env|(^|\/)\.env/.test(path.basename(d)) || path.basename(d) === '.envrc');
  const queEs = excluidos.length === 1
    ? `es un fichero ${deClaves ? 'de claves de acceso' : 'de acceso'} y no debe salir de este ordenador`
    : `son ficheros ${deClaves ? 'de claves de acceso' : 'de acceso'} y no deben salir de este ordenador`;
  const encargo = require('./encargos').ordenarLasClaves();
  return {
    texto: `No he metido ${lista} en la copia: ${queEs}.`,
    boton: encargo ? { etiqueta: excluidos.length === 1 ? 'Ponerlo en su sitio' : 'Ponerlos en su sitio', accion: { tipo: 'pedir', prompt: encargo.prompt } } : null,
  };
}

// ── Lo pesado no entra en las copias (decisión 147) ─────────────────────
//
// Un alumno de la clase del 13-10 quería meter «unos 100 gigas» de fotos y vídeos
// en su carpeta, y con «guardar solo» encendido entraban todos en el historial,
// que no se deshace. Dos reglas, y las dos se aplican solas (P9):
//
//   · un fichero que pesa más de 20 MB no entra: se queda en la carpeta, fuera de
//     la copia, y se dice. Los vídeos y las imágenes de disco ni llegan aquí: los
//     deja fuera el `.gitignore` de los raíles, también cuando guarda el asistente;
//   · si lo que entraría en una copia pasa de 200 MB en total, no se guarda: son
//     muchos ficheros pequeños, como cien gigas de fotos, o uno que ya estaba en
//     git y ha crecido, y cuáles se guardan lo decide la persona. Se dice, con un
//     botón que se lo pide al asistente.
//
// Lo que ya estaba en git sigue en git, por mucho que pese: sacarlo lo decide la
// persona. Pero cuenta para el total, porque entra en la copia (revisión de la 147:
// una base de datos de 5 GB que cambia entraba entera en cada copia, sin tope).
const LIMITE_FICHERO = 20 * 1024 * 1024;
const LIMITE_TOTAL = 200 * 1024 * 1024;

// Lo que cambia o es nuevo, con lo que pesa. `-z` y sin citar, para que un nombre
// con espacios o tildes llegue tal cual; de un renombrado vale el nombre nuevo, en
// el índice (`R `) o en la carpeta (` R`), y el viejo viene detrás. `nuevo` es lo
// que no estaba en la última copia, que es lo que `historial.guardar` puede dejar
// fuera. Con
// `--untracked-files=all` git abre todas las carpetas nuevas menos una: la que es
// un repositorio, que sale entera y con barra al final.
async function loPendiente(donde) {
  const r = await procesos.git('-c', 'core.quotepath=off', 'status', '--porcelain', '-z', '--untracked-files=all');
  if (r.codigo !== 0) return null;
  const partes = r.salida.split('\0');
  const pendiente = [];
  for (let i = 0; i < partes.length; i += 1) {
    const entrada = partes[i];
    if (!entrada || entrada.length < 4) continue;
    const xy = entrada.slice(0, 2);
    const rel = entrada.slice(3);
    if (/[RC]/.test(xy)) i += 1;
    if (xy.includes('D')) continue;
    const nuevo = xy === '??' || /[ARC]/.test(xy[0]);
    if (xy === '??' && rel.endsWith('/')) { pendiente.push({ rel: rel.slice(0, -1), pesa: 0, nuevo, anidado: true }); continue; }
    // Sin seguir enlaces: de un enlace, git guarda el enlace y no lo que apunta.
    try {
      const datos = fs.lstatSync(path.join(donde, rel));
      if (datos.isFile()) pendiente.push({ rel, pesa: datos.size, nuevo });
    } catch { /* se ha ido entre medias */ }
  }
  return pendiente;
}

// «1,2 GB», «350 MB»: como se dice, con coma.
function cuantoPesa(bytes) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1).replace('.', ',')} GB` : `${Math.round(mb)} MB`;
}

const ORDENAR_LO_PESADO = 'En esta carpeta hay muchos archivos nuevos o cambiados que pesan mucho, como fotos, vídeos o una base de datos, y no caben en las copias. '
  + 'Ayúdame a decidir cuáles se guardan en las copias y cuáles se quedan solo en la carpeta, y deja fuera de las copias los que no, '
  + 'apuntándolos en el .gitignore; si alguno ya estaba en las copias, sácalo de ellas sin quitarlo de la carpeta. No borres ni muevas ninguno.'; // diccionario: interno

// Lo que se queda fuera de una copia: las claves, lo pesado y lo que ya tiene sus
// propias copias —un repositorio dentro de la carpeta, que en la copia sería solo
// una referencia y además haría que git corriera su configuración—. O que es
// demasiado.
async function loQueSeQuedaFuera(donde) {
  let claves = [];
  try {
    claves = loQueNoEntra();
  } catch { /* sin inventario se guarda como siempre: el .gitignore de los raíles sigue ahí */ }
  // Sin saber qué hay, no se guarda: guardaría sin tope (revisión de la 147).
  const pendiente = await loPendiente(donde);
  if (!pendiente) return null;
  const anidados = pendiente.filter((p) => p.anidado).map((p) => p.rel);
  const pesados = pendiente.filter((p) => p.nuevo && p.pesa > LIMITE_FICHERO).map((p) => p.rel);
  const entra = (p) => !p.nuevo || (p.pesa <= LIMITE_FICHERO && !claves.includes(p.rel));
  const total = pendiente.filter(entra).reduce((suma, p) => suma + p.pesa, 0);
  return { claves, pesados, anidados, excluir: [...new Set([...claves, ...pesados, ...anidados])], demasiado: total > LIMITE_TOTAL ? total : 0 };
}

// «a», «a y b», «a, b y c», y con más, los tres primeros y cuántos más: con miles
// de vídeos en bruto, el aviso los nombraba todos.
const enLista = (fuera) => {
  const nombres = fuera.slice(0, 3).map((d) => `«${path.basename(d)}»`);
  if (fuera.length > 3) return `${nombres.join(', ')} y ${(fuera.length - 3).toLocaleString('es-ES')} más`;
  return nombres.length < 2 ? nombres.join('') : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
};

function dichoDeLoPesado(fuera) {
  if (!fuera.length) return '';
  return fuera.length === 1
    ? `No he metido ${enLista(fuera)} en la copia: pesa mucho y la haría enorme. Sigue en tu carpeta.`
    : `No he metido ${enLista(fuera)} en la copia: pesan mucho y la harían enorme. Siguen en tu carpeta.`;
}

function dichoDeLoAnidado(fuera) {
  if (!fuera.length) return '';
  return fuera.length === 1
    ? `No he metido ${enLista(fuera)} en la copia: tiene sus propias copias. Sigue en tu carpeta.`
    : `No he metido ${enLista(fuera)} en la copia: tienen sus propias copias. Siguen en tu carpeta.`;
}

async function guardar(mensaje) {
  const h = historial();
  if (!h || !(await hayGit())) return { ok: false, faltaGit: true, mensaje: SIN_PIEZA };

  const donde = proyecto.raiz();
  if (!donde) return { ok: false, mensaje: NO_PUEDO };

  const fuera = await loQueSeQuedaFuera(donde);
  if (!fuera) return { ok: false, mensaje: NO_PUEDO };
  if (fuera.demasiado) {
    return {
      ok: false,
      demasiado: true,
      mensaje: `No he guardado la copia: hay ${cuantoPesa(fuera.demasiado)} de archivos nuevos o cambiados y la copia se haría enorme. Tus archivos siguen en la carpeta.`,
      boton: { etiqueta: 'Que el asistente los ordene', accion: { tipo: 'pedir', prompt: ORDENAR_LO_PESADO } },
    };
  }

  const hecho = await h.guardar(donde, mensaje || `Copia de seguridad — ${fechaLarga()}`, { ...comoLlamar(), excluir: fuera.excluir });
  if (!hecho.ok) return { ok: false, mensaje: NO_PUEDO };
  const excluidos = hecho.excluidos || [];
  const deClaves = dichoDeLoQueNoEntro(excluidos.filter((e) => fuera.claves.includes(e)));
  const dePeso = dichoDeLoPesado(excluidos.filter((e) => fuera.pesados.includes(e) && !fuera.claves.includes(e)));
  const deAnidados = dichoDeLoAnidado(excluidos.filter((e) => fuera.anidados.includes(e)));
  if (hecho.sinCambios) {
    return { ok: true, sinCambios: true, mensaje: 'No ha cambiado nada desde la última copia. No hace falta guardar.' };
  }

  const guardada = hecho.cuantos === 1 ? 'Copia guardada. Había un cambio.' : `Copia guardada. Había ${hecho.cuantos} cambios.`;
  return {
    ok: true,
    mensaje: [guardada, deClaves.texto, dePeso, deAnidados].filter(Boolean).join(' '),
    ...(deClaves.boton ? { boton: deClaves.boton } : {}),
    excluidos,
  };
}

async function copias(cuantas = 10) {
  const h = historial();
  const donde = proyecto.raiz();
  if (!h || !donde) return [];

  const { copias: lista } = await h.historial(donde, cuantas, comoLlamar());
  return lista.map((c) => ({ ...c, etiqueta: `Como estaba ${haceCuanto(c.cuando)}` }));
}

// La copia que deja la barra al terminar de montar (`arrancar.js`): «Punto de
// partida — <fecha>». La guarda ella, no la persona, así que no dice que se haya
// empezado nada (decisión 164: con ella, la tarjeta de la cuenta no salía nunca).
const esElPuntoDePartida = (copia) => Boolean(copia) && /^Punto de partida — /.test(String(copia.asunto || ''));

// ── Guardar solo (decisión 164: cada hora, de fábrica) ───────────────────
//
// Una vuelta del reloj de `extension.js`. Devuelve qué ha pasado, para poder
// probarlo sin esperar una hora. No guarda:
//   · si está apagado o no toca todavía;
//   · si en esta carpeta eligió seguir sin copias;
//   · sin git en el ordenador;
//   · en un historial que no creó la barra en este ordenador
//     (`terreno.podemosGuardarSolo`): ni en el de arriba, ni en uno suyo, ni en
//     un clon;
//   · si no hay nada nuevo.
// Se mira de quién es el historial antes de contar los cambios: sin `.git`
// propio, `git status` contaría los del proyecto de arriba.
async function guardarSiToca({ horas, desde, ahora = Date.now(), sigueSinCopias = false }) {
  if (!horas) return { hecho: 'apagado' };
  if (ahora - desde < horas * 60 * 60 * 1000) return { hecho: 'noToca' };
  if (sigueSinCopias) return { hecho: 'sinCopias' };
  if (!(await hayGit())) return { hecho: 'sinGit' };
  if (!(await require('./terreno').podemosGuardarSolo())) return { hecho: 'noEsSuyo' };
  if (!(await cambiosSinGuardar())) return { hecho: 'sinCambios' };
  return { hecho: 'guardada', ...(await guardar(`Copia automática — ${fechaLarga()}`)) };
}

// Deja la carpeta exactamente como estaba en esa copia — también quita lo que
// se creó después — sin destruir nada: antes se guarda lo de ahora, y la
// vuelta atrás queda registrada como una copia más, así que también se puede
// deshacer.
async function volverA(id) {
  const h = historial();
  const donde = proyecto.raiz();
  if (!h || !donde) return { ok: false, mensaje: NO_PUEDO };

  const previa = await guardar(`Copia de seguridad antes de volver atrás — ${fechaLarga()}`);
  if (!previa.ok) return previa;

  const movido = await h.volverA(donde, id, comoLlamar());
  if (!movido.ok) {
    return movido.error === 'identificador con mala pinta'
      ? { ok: false, mensaje: 'Esa copia no existe.' }
      : { ok: false, mensaje: 'No he podido volver atrás. Pulsa «Algo va mal» y pásale el código a tu tutor.' };
  }

  const etiqueta = movido.cuando ? haceCuanto(movido.cuando) : 'entonces';
  // Con lo que se queda fuera, como cualquier copia: se guardaba sin la lista, y
  // metía las claves que la copia de antes había dejado fuera (decisión 147).
  const despues = await loQueSeQuedaFuera(donde);
  if (despues && !despues.demasiado) await h.guardar(donde, `Vuelta a como estaba ${etiqueta}`, { ...comoLlamar(), excluir: despues.excluir });

  // ── Decir lo que le acaba de pasar a lo que tenía sin guardar ──────────
  //
  // Volver atrás hace justo lo que promete: la carpeta vuelve a como estaba.
  // Lo que no decía es que el trabajo de después **desaparece de la carpeta**.
  // Está a salvo —la copia de arriba se hace antes precisamente para eso— pero
  // el mensaje era «Listo. Tu empresa ha vuelto a como estaba entonces» y nada
  // más.
  //
  // Probado con un documento sin guardar: desaparece de la vista sin una
  // palabra. Quien lo estuviera escribiendo hace diez minutos no tiene forma de
  // saber que sigue existiendo, y el susto es de los que hacen llamar al tutor
  // creyendo que se ha perdido algo. Se dice, y solo cuando de verdad había
  // algo que salvar.
  const habiaTrabajoSinGuardar = previa.ok && !previa.sinCambios;
  return {
    ok: true,
    mensaje: habiaTrabajoSinGuardar
      ? `Listo. Esta carpeta ha vuelto a como estaba ${etiqueta}. Lo que tenías hecho después ya no está en las carpetas, pero no se ha perdido: lo guardé justo antes, y aquí abajo lo tienes para volver.`
      : `Listo. Esta carpeta ha vuelto a como estaba ${etiqueta}.`,
  };
}

// --------------------------------------- la copia que no está en este Mac
//
// Una copia en el ordenador no salva de que el ordenador se rompa o se pierda.
// Por eso, si el alumno tiene puesta esa conexión, se le ofrece además
// guardarla fuera.
//
// El nombre del sitio NO se escribe en la interfaz: sale de la carpeta que el
// alumno tenga en sus conexiones, como todo lo demás (docs/diccionario.md, "no
// hay ninguna herramienta escrita en el código"). Aquí solo se sabe leer la
// clave y empujar.
const CONEXION = 'github';

function laClave() {
  const carpeta = proyecto.ruta('01-TOOLS', CONEXION);
  if (!carpeta || !fs.existsSync(carpeta)) return null;

  const env = conexiones.leerEnv(path.join(carpeta, '.env'));
  const clave = env.get('GITHUB_TOKEN') || env.get('GH_TOKEN');
  return clave ? { clave, donde: env.get('GITHUB_REPO') || null, usuario: env.get('GITHUB_USER') || null } : null;
}

// ¿Se puede guardar fuera? Con la sesión de GitHub del editor basta; la clave
// escrita a mano sigue valiendo para quien ya la tuviera puesta.
//
// La sesión se mira en silencio: si no la hay no se abre ningún diálogo, que
// esto se llama al pintar el panel y un panel no puede ponerse a pedir cosas
// por su cuenta.
async function comoEntrar() {
  const sesion = await github.sesion();
  if (sesion) {
    return { clave: sesion.accessToken, usuario: sesion.account ? sesion.account.label : null, delEditor: true };
  }
  return laClave();
}

const puedeSubir = async () => Boolean(await comoEntrar());

// Crea el sitio la primera vez, privado, y devuelve a dónde hay que empujar.
async function dondeSubir({ clave, donde, usuario }) {
  if (donde) return `https://github.com/${donde}.git`;

  const nombre = (proyecto.raiz() || 'mi-trabajo').split(/[\\/]/).pop()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'mi-trabajo';

  const respuesta = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clave}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    // Privado siempre: son los papeles de su empresa.
    body: JSON.stringify({ name: nombre, private: true, auto_init: false }),
  });

  if (respuesta.ok) {
    const creado = await respuesta.json();
    return `${creado.clone_url}`;
  }
  // 422 es "ya existe uno con ese nombre", que es exactamente lo que queremos.
  if (respuesta.status === 422 && usuario) return `https://github.com/${usuario}/${nombre}.git`;
  return null;
}

// Decisión 183: sin internet no es un fallo de la cuenta, y «entra otra vez» no
// arregla nada. Se reconoce por el error de la red (fetch) o por lo que dice git.
const SIN_RED = /fetch failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENETUNREACH|EHOSTUNREACH|network is unreachable|could not resolve host|unable to access|failed to connect|connection timed out|temporary failure in name resolution|getaddrinfo/i;
const esSinRed = (cosa) => {
  if (!cosa) return false;
  const texto = typeof cosa === 'string' ? cosa : `${cosa.message || ''} ${(cosa.cause && (cosa.cause.code || cosa.cause.message)) || ''} ${cosa.code || ''}`;
  return SIN_RED.test(texto);
};
const SIN_CONEXION = 'No hay conexión a internet, y sin ella no puedo subirlo. Mira que estés conectado y vuelve a intentarlo.';

async function subirCopia() {
  const credenciales = await comoEntrar();
  if (!credenciales) return { ok: false, faltaGitHub: true, mensaje: 'Todavía no has entrado en tu cuenta para guardar fuera.' };

  const h = historial();
  const donde = proyecto.raiz();
  if (!h || !donde) return { ok: false, mensaje: NO_PUEDO };

  // Primero lo de aquí: no tendría sentido subir una foto vieja.
  const antes = await guardar();
  if (!antes.ok) return antes;

  let url;
  let sinRed = false;
  try {
    url = await dondeSubir(credenciales);
  } catch (error) {
    url = null;
    sinRed = esSinRed(error);
  }
  if (!url) {
    if (sinRed) return { ok: false, sinRed: true, mensaje: SIN_CONEXION };
    return {
      ok: false,
      mensaje: credenciales.delEditor
        ? 'No he podido preparar el sitio donde guardarla. Prueba a entrar otra vez en tu cuenta.'
        : 'No he podido preparar el sitio donde guardarla. Revisa la clave en Conexiones.',
    };
  }

  await h.enlazar(donde, url, comoLlamar());
  const subida = await h.subir(donde, { url, token: credenciales.clave }, comoLlamar());
  if (subida.ok) return { ok: true, mensaje: 'Copia guardada fuera de este ordenador.' };
  if (esSinRed(subida.error)) return { ok: false, sinRed: true, detalle: subida.error, mensaje: SIN_CONEXION };
  return {
    ok: false,
    // Lo que dijo git, ya sin el token (`historial` lo limpia), para «Algo va mal» (F2).
    detalle: subida.error,
    mensaje: credenciales.delEditor
      ? 'No he podido guardarla fuera. Prueba a entrar otra vez en tu cuenta.'
      : 'No he podido guardarla fuera. Revisa la clave en Conexiones.',
  };
}

// Cuánto ha cambiado desde la última copia. Es para avisar, no para decidir:
// si no se puede saber, se dice que cero y no se avisa de nada.
async function cambiosSinGuardar() {
  const h = historial();
  const donde = proyecto.raiz();
  if (!h || !donde) return 0;
  return h.cuantosCambios(donde, comoLlamar());
}

module.exports = { esSinRed, LIMITE_FICHERO, LIMITE_TOTAL, cuantoPesa, iniciar, guardar, copias, esElPuntoDePartida, guardarSiToca, volverA, cambiosSinGuardar, subirCopia, puedeSubir, comoEntrar, fechaLarga, haceCuanto, haceUnRato, hayGit, olvidarSiHayGit };
