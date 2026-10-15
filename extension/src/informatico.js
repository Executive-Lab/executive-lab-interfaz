// «Pídeselo a tu informático» (decisión 156).
//
// Muchas veces la clave no la puede sacar quien usa la barra: la tiene quien
// administra la cuenta, o hay que dar permisos que no sabe dar. Jose, al pedir el
// plan: *«que se pueda saber qué preguntar a informáticos y técnicos»*.
//
// Esto arma un mensaje listo para mandar, con dos partes:
//
//   · Lo de esa herramienta, que lo escribe el asistente al investigarla, en una
//     sección «## Para tu informático» del README de la conexión: para qué es,
//     qué acceso y con qué permisos, si basta con leer, la página y qué
//     preguntarle (P5: no se inventa al pulsar). Si no está, se arma con lo que
//     ya se sabe del disco, y se ofrece pedírsela al asistente.
//   · Cómo hacerla llegar sin que se filtre, que lo pone la barra. Va escrito una
//     vez, aquí, y revisado: es el riesgo que nombra la propuesta («el mensaje da
//     un consejo de seguridad equivocado»), y no se le deja a cada conversación.
//
// La barra no manda nada: lo copia, o abre el correo de esa persona con el
// mensaje puesto, y lo manda ella (P9: sale de su ordenador en su nombre).
//
// Nunca lleva el valor de una clave. Lo que viene del disco pasa por los valores
// de las claves de la carpeta, y por las formas de clave que ya tapa «Algo va mal».

const conexiones = require('./conexiones');
const proyecto = require('./proyecto');

const QUITADA = '[clave quitada]';
const CORREO_QUITADO = '[correo quitado]';
// Lo que cabe de lo que escribió el asistente, por líneas enteras.
const CABE_LO_SUYO = 4000;

// Lo que se dice de cada clase de acceso cuando el asistente no lo dejó escrito.
const QUE_HACE_FALTA = {
  clave: 'Una clave de acceso.',
  usuario: 'Un usuario y una contraseña.',
  fichero: 'Un fichero de acceso: una cuenta de servicio o un certificado.',
  cuenta: 'Entrar con mi cuenta. No hace falta ninguna clave, pero puede que tengas que autorizarlo tú como administrador.',
  direccion: 'Una dirección que da la herramienta (un webhook).',
};
const CUENTA_Y_MAS = 'Entrar con mi cuenta, además de lo de abajo. Puede que tengas que autorizarlo tú como administrador.';

// ── Cómo hacerla llegar, por seguridad ───────────────────────────────────
//
// Lo de siempre con un secreto (OWASP, Secrets Management Cheat Sheet): que no
// viaje por donde se queda guardado y se reenvía, que lo que se dé sea solo para
// esto y con lo mínimo, para poder quitarlo sin romper nada, y con fecha de
// caducidad si se puede, que la barra pregunta y avisa (decisión 149). Lo mejor
// de todo: que no viaje, que lo pegue él en la barra de este ordenador, que
// supone estar delante o conectado a él. Y si ya viajó, que se anule: una clave
// que ha pasado por un correo ya no es segura (revisión de seguridad de la 156).
// `{X}` es el nombre de la herramienta.
const POR_SEGURIDAD = {
  clave: [
    'Cómo hacérmela llegar, por seguridad:',
    '- Nunca me la mandes por correo ni por mensajería, ni la pegues en la conversación con el asistente: ahí se queda guardada y se puede reenviar.',
    '- Lo mejor es que la pegues tú mismo en mi ordenador, en la barra de Executive Lab: Conexiones (tools) → {X}. Para eso tienes que estar delante de él, o conectado a él. Así no pasa por ningún otro sitio.',
    '- Si no puede ser, compártela conmigo con un gestor de contraseñas.',
    '- Mejor una nueva, solo para esto y con los permisos mínimos, que una que ya se use para otra cosa: así se puede quitar sin romper nada.',
    '- Si se le puede poner fecha de caducidad, pónsela y dime cuál es.',
    '- Si ya me la has mandado por correo o por mensajería, anúlala y saca otra: esa ya no es segura.',
  ],
  usuario: [
    'Cómo hacérmelos llegar, por seguridad:',
    '- Nunca me los mandes por correo ni por mensajería, ni los pegues en la conversación con el asistente: ahí se quedan guardados y se pueden reenviar.',
    '- Lo mejor es que los escribas tú mismo en mi ordenador, en la barra de Executive Lab: Conexiones (tools) → {X}. Para eso tienes que estar delante de él, o conectado a él. Así no pasan por ningún otro sitio.',
    '- Si no puede ser, compártelos conmigo con un gestor de contraseñas.',
    '- Mejor un usuario solo para esto y con los permisos mínimos, que el tuyo o el de otra persona: así se puede quitar sin romper nada.',
    '- Si la contraseña caduca, dime cuándo.',
    '- Si ya me los has mandado por correo o por mensajería, cambia la contraseña: esa ya no es segura.',
  ],
  fichero: [
    'Cómo hacérmelo llegar, por seguridad:',
    '- Nunca me lo mandes por correo ni por mensajería, ni lo pegues en la conversación con el asistente: ahí se queda guardado y se puede reenviar.',
    '- Lo mejor es que lo sueltes tú mismo en mi ordenador, en la barra de Executive Lab: Conexiones (tools) → {X}. Para eso tienes que estar delante de él, o conectado a él. Lo pone en su sitio y no sale de ahí.',
    '- Si no puede ser, compártelo conmigo con un gestor de contraseñas.',
    '- Mejor uno nuevo, solo para esto y con los permisos mínimos, que uno que ya se use para otra cosa: así se puede anular sin romper nada.',
    '- Si ya me lo has mandado por correo o por mensajería, anúlalo y saca otro: ese ya no es seguro.',
  ],
  cuenta: [
    'Por seguridad:',
    '- No hace falta que me mandes ninguna clave ni contraseña: entro yo con mi cuenta.',
    '- Si hay que autorizarlo como administrador, dime qué tengo que aceptar, y que sean los permisos mínimos.',
  ],
};
const Y_EL_FICHERO = '- Y lo mismo con el fichero de acceso: tampoco por correo ni por mensajería.';

// Cuál de las cuatro, por lo que pide. Sin saberlo, la de una clave, que es lo
// más corriente y la más estricta.
function cualDeSeguridad(acceso) {
  const clases = acceso || [];
  if (clases.length && clases.every((c) => c === 'cuenta')) return 'cuenta';
  if (clases.includes('fichero') && clases.every((c) => c === 'fichero' || c === 'cuenta')) return 'fichero';
  if (clases.includes('usuario') && clases.every((c) => c === 'usuario' || c === 'cuenta')) return 'usuario';
  return 'clave';
}

function porSeguridad(acceso, nombre) {
  const cual = cualDeSeguridad(acceso);
  const lineas = POR_SEGURIDAD[cual].map((l) => l.replace('{X}', nombre));
  if (cual !== 'fichero' && (acceso || []).includes('fichero')) lineas.push(Y_EL_FICHERO);
  return lineas;
}

// Lo que escribió el asistente, en texto llano: un correo no pinta negritas.
// Con topes en el enlace: `[[[[…` era cuadrático sin ellos.
function enTextoLlano(md) {
  return String(md || '')
    .split(/\r?\n/)
    .map((l) => l
      .replace(/^#{1,6}\s+/, '')
      .replace(/\[([^[\]\n]{1,200})\]\((\S{1,500}?)\)/g, '$1 ($2)')
      .replace(/\*\*|__/g, '')
      .replace(/`/g, '')
      .replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Que no lleve ninguna clave ───────────────────────────────────────────
//
// La revisión de seguridad de la 156 lo rompió por seis sitios, y por cada uno
// hay una vía aquí. Se tapa sobre el texto crudo, antes de tocarlo, y otra vez
// sobre el mensaje entero: pasarlo a texto llano quita `__`, `**` y comillas
// invertidas, y eso puede juntar una clave que antes estaba partida.
//
//   · El valor tal cual, y también codificado como va en una dirección
//     (`encodeURIComponent`) y en base64 (también dentro de otro base64, en sus
//     tres desfases), con el mínimo de 8 caracteres para lo que se deriva.
//   · El valor partido por espacios, saltos de línea, guiones, puntos o guiones
//     bajos: se busca sin separadores y se tapa el tramo entero.
//   · Los cortos (4 o 5 caracteres) de una clave que por su nombre es secreta,
//     solo como palabra entera: un «test» de ajuste no se tapa en «testing».
//   · Una dirección con usuario y clave (`https://usuario:clave@sitio`).
//   · Lo que tiene forma de clave (las de «Algo va mal») y lo que lo parece por
//     lo revuelto que es: mayúsculas, minúsculas y cifras sin orden, o una ristra
//     hexadecimal larga.
const SEPARADOR = /[\s\-_.]/;
const MINIMO_DERIVADO = 8;

// Los valores cortos de una clave secreta, de los `.env` de las conexiones.
function clavesCortas() {
  const cortas = new Set();
  try {
    for (const { id } of conexiones.proveedores()) {
      const env = proyecto.ruta('01-TOOLS', id, '.env');
      if (!env) continue;
      for (const [nombre, valor] of conexiones.leerEnv(env)) {
        if (typeof valor === 'string' && valor.length >= 4 && valor.length < 6 && conexiones.NOMBRE_SECRETO.test(nombre)) cortas.add(valor);
      }
    }
  } catch { /* sin conexiones, nada corto que tapar */ }
  return [...cortas];
}

// Solo las de las claves que son secretas por su nombre, y las de los ficheros de
// acceso: un ajuste como la dirección de su panel o `production` no se tapa, que
// el informático necesita saber adónde ir (revisión de corrección de la 156).
function valoresQueTapar() {
  return { largos: conexiones.valoresDeClaves({ soloSecretas: true }), cortos: clavesCortas() };
}

// Las formas en que puede aparecer un valor: tal cual, en una dirección y en base64.
function formasDe(valor) {
  const formas = new Set([valor]);
  if (valor.length < MINIMO_DERIVADO) return [...formas];
  const codificado = encodeURIComponent(valor);
  formas.add(codificado);
  formas.add(codificado.replace(/%20/g, '+'));
  const bytes = Buffer.from(valor, 'utf8');
  // En base64 cada 3 bytes son 4 letras: según dónde caiga dentro de otro texto
  // en base64, sale de tres formas. De cada una, lo que solo depende del valor.
  for (const [desfase, saltar] of [[0, 0], [1, 2], [2, 3]]) {
    const total = desfase + bytes.length;
    const entero = Buffer.concat([Buffer.alloc(desfase), bytes]).toString('base64').replace(/=+$/, '');
    const nucleo = entero.slice(saltar, 4 * Math.floor(total / 3));
    if (nucleo.length >= MINIMO_DERIVADO) {
      formas.add(nucleo);
      formas.add(nucleo.replace(/\+/g, '-').replace(/\//g, '_'));
    }
  }
  return [...formas].sort((a, b) => b.length - a.length);
}

// El valor partido por separadores: se busca sin ellos y se tapa el tramo.
function taparPartido(texto, valor) {
  const compacto = valor.replace(/[\s\-_.]/g, '');
  if (compacto.length < MINIMO_DERIVADO) return texto;
  let plano = '';
  const donde = [];
  for (let i = 0; i < texto.length; i += 1) {
    if (!SEPARADOR.test(texto[i])) {
      plano += texto[i];
      donde.push(i);
    }
  }
  const tramos = [];
  for (let desde = plano.indexOf(compacto); desde !== -1; desde = plano.indexOf(compacto, desde + compacto.length)) {
    tramos.push([donde[desde], donde[desde + compacto.length - 1] + 1]);
  }
  let limpio = texto;
  for (const [ini, fin] of tramos.reverse()) limpio = `${limpio.slice(0, ini)}${QUITADA}${limpio.slice(fin)}`;
  return limpio;
}

const escaparRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function entropia(t) {
  const cuenta = new Map();
  for (const c of t) cuenta.set(c, (cuenta.get(c) || 0) + 1);
  let h = 0;
  for (const n of cuenta.values()) h -= (n / t.length) * Math.log2(n / t.length);
  return h;
}
const PARECE_REVUELTO = (t) => (/[A-Z]/.test(t) && /[a-z]/.test(t) && /[0-9]/.test(t) && t.length >= 20 && entropia(t) >= 3.5)
  || /^[0-9a-f]{32,}$/i.test(t);

function sinClaves(texto, valores = valoresQueTapar()) {
  let limpio = String(texto == null ? '' : texto);
  const { largos = [], cortos = [] } = Array.isArray(valores) ? { largos: valores } : valores;
  for (const valor of largos) {
    if (!valor) continue;
    for (const forma of formasDe(valor)) limpio = limpio.split(forma).join(QUITADA);
    limpio = taparPartido(limpio, valor);
  }
  for (const valor of cortos) {
    limpio = limpio.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escaparRegex(valor)}(?![\\p{L}\\p{N}])`, 'gu'), QUITADA);
  }
  // Una dirección con usuario y clave dentro.
  limpio = limpio.replace(/\b([a-z][a-z0-9+.-]{1,20}:\/\/)([^\s/@:]{0,100}):([^\s/@]{1,300})@/gi, `$1$2:${QUITADA}@`);
  let formas = [];
  try {
    formas = require('./avisos').FORMAS_DE_CLAVE || [];
  } catch { /* sin ellas, con lo demás */ }
  for (const forma of formas) limpio = limpio.replace(forma, QUITADA);
  // Y lo que lo parece, aunque no sea de esta carpeta. Sin «/» ni «.», que son de
  // las direcciones.
  return limpio.replace(/[A-Za-z0-9+=_-]{20,400}/g, (t) => (PARECE_REVUELTO(t) ? QUITADA : t));
}

// Por líneas enteras: cortar a mitad de línea podía partir una clave y dejar
// medio valor que ya no se reconoce. Y una línea sola que no cabe, por letras
// enteras: un emoji partido hacía fallar el correo.
function porLineas(texto, cabe = CABE_LO_SUYO) {
  const lineas = String(texto).split('\n');
  const quedan = [];
  let largo = 0;
  for (const linea of lineas) {
    if (largo + linea.length + 1 > cabe) {
      if (!quedan.length) quedan.push(Array.from(linea).slice(0, cabe).join(''));
      quedan.push('(…)');
      break;
    }
    quedan.push(linea);
    largo += linea.length + 1;
  }
  return quedan.join('\n');
}

// Lo que viene del README va a un tercero: sin direcciones de correo, que
// podrían ser de cualquiera, y las páginas que no son de la herramienta se
// enseñan antes de mandarlo.
const UN_CORREO = /[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,24}/g;
const UNA_PAGINA = /https?:\/\/[^\s<>()"'«»[\]]{1,500}/g;
const dominio = (direccion) => {
  try {
    return new URL(direccion).hostname.toLowerCase().split('.').slice(-2).join('.');
  } catch {
    return '';
  }
};
function paginasAjenas(texto, laSuya) {
  const suyo = laSuya ? dominio(laSuya) : '';
  const ajenas = [...new Set(String(texto).match(UNA_PAGINA) || [])].filter((u) => !suyo || dominio(u) !== suyo);
  return ajenas.slice(0, 5);
}

// Un nombre en una línea: sin saltos ni caracteres de control, que en el asunto
// de un correo abren otra cabecera («\rBcc: …»).
const enUnaLinea = (t, cabe) => Array.from(String(t || '').replace(/[\u0000-\u001f\u007f\s]+/g, ' ').trim()).slice(0, cabe).join('');

// Lo que se sabe del disco cuando el asistente no escribió la sección.
function loQueSeSabe(datos) {
  const lineas = ['Lo que hace falta:'];
  const clases = datos.proveedor.acceso || [];
  for (const clase of clases) {
    // Entrar con la cuenta y además una clave: que no diga «no hace falta ninguna clave».
    lineas.push(clase === 'cuenta' && clases.length > 1 ? `- ${CUENTA_Y_MAS}` : `- ${QUE_HACE_FALTA[clase]}`);
  }
  for (const c of datos.claves) lineas.push(c.donde ? `- ${c.clave}: ${c.donde}` : `- ${c.clave}`);
  if (datos.proveedor.ayuda) lineas.push(`- Se hace aquí: ${datos.proveedor.ayuda}`);
  lineas.push('- Con los permisos mínimos: si basta con leer, mejor de solo lectura.');
  return lineas.join('\n');
}

// El mensaje de una conexión. Null si la conexión no está.
//
// Primero lo de la barra: el saludo y la parte de seguridad. Después, separado y
// marcado como cita, lo que preparó el asistente, que es un texto de la carpeta
// en primera persona camino de un tercero.
function mensaje(proveedorId) {
  const datos = conexiones.claves(proveedorId);
  if (!datos) return null;
  // «Entrar con tu cuenta» con un ID y un secreto que crear (revisión de
  // corrección de la 156): no es solo entrar, también hay una clave que hacer
  // llegar, y la parte de seguridad tiene que ser la de una clave.
  const acceso = datos.proveedor.acceso || [];
  const clases = acceso.length && acceso.every((c) => c === 'cuenta') && datos.claves.some((c) => c.secreta) ? ['cuenta', 'clave'] : acceso;
  const valores = valoresQueTapar();
  const nombre = enUnaLinea(sinClaves(enUnaLinea(datos.proveedor.etiqueta, 200), valores).replace(UN_CORREO, CORREO_QUITADO), 80);
  const crudo = conexiones.paraTuInformatico(proveedorId);
  const deLaCarpeta = Boolean(crudo);
  let loSuyo;
  if (deLaCarpeta) {
    const llano = enTextoLlano(porLineas(sinClaves(crudo, valores))).replace(UN_CORREO, CORREO_QUITADO);
    loSuyo = ['Lo que preparó el asistente para esta herramienta:', ...llano.split('\n').map((l) => (l ? `> ${l}` : '>'))].join('\n');
  } else {
    loSuyo = loQueSeSabe({ ...datos, proveedor: { ...datos.proveedor, acceso: clases } }).replace(UN_CORREO, CORREO_QUITADO);
  }

  const cuerpo = sinClaves([
    'Hola:',
    '',
    `Estoy conectando ${nombre} con mi asistente de IA y necesito tu ayuda para darle acceso.`,
    '',
    ...porSeguridad(clases, nombre),
    '',
    loSuyo,
    '',
    'Gracias.',
  ].join('\n'), valores);

  return {
    // El nombre, ya tapado: sale de la primera línea del README, que escribe cualquiera.
    proveedor: { id: datos.proveedor.id, etiqueta: nombre },
    asunto: enUnaLinea(`Acceso a ${nombre} para mi asistente de IA`, 200),
    cuerpo,
    // Si sale de lo que escribió el asistente o de lo que la barra sabe.
    deLaCarpeta,
    // Las páginas que lleva y no son de la herramienta: se enseñan antes de mandarlo.
    paginasAjenas: deLaCarpeta ? paginasAjenas(cuerpo, datos.proveedor.ayuda) : [],
    tieneSuPagina: Boolean(datos.proveedor.ayuda),
  };
}

// ── Mandarlo por correo ──────────────────────────────────────────────────
//
// Un `mailto:` sin destinatario: lo pone la persona, en su correo, y lo manda
// ella. Asunto y cuerpo con `encodeURIComponent` y los saltos de línea como
// `%0D%0A`, que es lo que pide la norma del `mailto:` (RFC 6068).
//
// Y se abre tal cual, como texto, no con `Uri.parse`: el editor decodifica lo
// que va detrás del `?` al leerlo, y al abrirlo lo vuelve a codificar a su
// manera. Un «?» del mensaje salía como «%3F» y un «&» partía el cuerpo en dos.
// Con el texto, lo abre como está («open the url-string AS IS», en su código).
//
// En Windows, el sistema corta las direcciones sobre los 2.048 caracteres
// (decisión 130): si no cabe, el mensaje va al portapapeles y el correo se abre
// con el asunto y una línea que dice que lo pegue.
const CABE_EN_WINDOWS = 2000;
const PEGALO = 'Te he copiado el mensaje: pégalo aquí con Ctrl+V.';

// Con las mitades sueltas de un emoji cambiadas por «�»: `encodeURIComponent`
// lanzaba con ellas (revisión de seguridad de la 156).
const bienFormado = (t) => String(t).replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD');
const codificar = (t) => encodeURIComponent(bienFormado(t).replace(/\r?\n/g, '\r\n'));
const enlace = (asunto, cuerpo) => `mailto:?subject=${codificar(asunto)}&body=${codificar(cuerpo)}`;

function correo({ asunto, cuerpo }, { plataforma = process.platform } = {}) {
  const entero = enlace(asunto, cuerpo);
  if (plataforma !== 'win32' || entero.length <= CABE_EN_WINDOWS) return { enlace: entero, alPortapapeles: false };
  return { enlace: enlace(asunto, PEGALO), alPortapapeles: true };
}

module.exports = { mensaje, correo, sinClaves, formasDe, porLineas, enTextoLlano, porSeguridad, cualDeSeguridad, POR_SEGURIDAD, QUITADA, CORREO_QUITADO, CABE_EN_WINDOWS };
