// «Pídeselo a tu informático» (decisión 154).
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

const QUITADA = '[clave quitada]';

// Lo que se dice de cada clase de acceso cuando el asistente no lo dejó escrito.
const QUE_HACE_FALTA = {
  clave: 'Una clave de acceso.',
  usuario: 'Un usuario y una contraseña.',
  fichero: 'Un fichero de acceso: una cuenta de servicio o un certificado.',
  cuenta: 'Entrar con mi cuenta. No hace falta ninguna clave, pero puede que tengas que autorizarlo tú como administrador.',
  direccion: 'Una dirección que da la herramienta (un webhook).',
};

// ── Cómo hacerla llegar, por seguridad ───────────────────────────────────
//
// Lo de siempre con un secreto (OWASP, Secrets Management Cheat Sheet): que no
// viaje por donde se queda guardado y se reenvía, que lo que se dé sea solo para
// esto y con lo mínimo, para poder quitarlo sin romper nada, y con fecha de
// caducidad si se puede, que la barra pregunta y avisa (decisión 149). Y lo
// mejor de todo: que no viaje, que lo pegue él en la barra de este ordenador.
// `{X}` es el nombre de la herramienta.
const POR_SEGURIDAD = {
  clave: [
    'Cómo hacérmela llegar, por seguridad:',
    '- Nunca me la mandes por correo ni por mensajería, ni la pegues en la conversación con el asistente: ahí se queda guardada y se puede reenviar.',
    '- Lo mejor es que la pegues tú en la barra de Executive Lab de mi ordenador, en Conexiones (tools) → {X}. Así no pasa por ningún otro sitio.',
    '- Si no puede ser, compártela conmigo con un gestor de contraseñas.',
    '- Mejor una nueva, solo para esto y con los permisos mínimos, que una que ya se use para otra cosa: así se puede quitar sin romper nada.',
    '- Si se le puede poner fecha de caducidad, pónsela y dime cuál es.',
  ],
  usuario: [
    'Cómo hacérmelos llegar, por seguridad:',
    '- Nunca me los mandes por correo ni por mensajería, ni los pegues en la conversación con el asistente: ahí se quedan guardados y se pueden reenviar.',
    '- Lo mejor es que los escribas tú en la barra de Executive Lab de mi ordenador, en Conexiones (tools) → {X}. Así no pasan por ningún otro sitio.',
    '- Si no puede ser, compártelos conmigo con un gestor de contraseñas.',
    '- Mejor un usuario solo para esto y con los permisos mínimos, que el tuyo o el de otra persona: así se puede quitar sin romper nada.',
    '- Si la contraseña caduca, dime cuándo.',
  ],
  fichero: [
    'Cómo hacérmelo llegar, por seguridad:',
    '- Nunca me lo mandes por correo ni por mensajería, ni lo pegues en la conversación con el asistente: ahí se queda guardado y se puede reenviar.',
    '- Lo mejor es que lo sueltes tú en la barra de Executive Lab de mi ordenador, en Conexiones (tools) → {X}. Lo pone en su sitio y no sale de ahí.',
    '- Si no puede ser, compártelo conmigo con un gestor de contraseñas.',
    '- Mejor uno nuevo, solo para esto y con los permisos mínimos, que uno que ya se use para otra cosa: así se puede anular sin romper nada.',
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
function enTextoLlano(md) {
  return String(md || '')
    .split(/\r?\n/)
    .map((l) => l
      .replace(/^#{1,6}\s+/, '')
      .replace(/\[([^\]]+)\]\((\S+?)\)/g, '$1 ($2)')
      .replace(/\*\*|__/g, '')
      .replace(/`/g, '')
      .replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Lo que viene del disco no lleva ningún valor de una clave: ni los de esta
// carpeta, ni nada con forma de clave. Las largas primero, que una puede llevar
// dentro otra más corta (lo hace ya `valoresDeClaves`).
function sinClaves(texto, valores = conexiones.valoresDeClaves()) {
  let limpio = String(texto == null ? '' : texto);
  for (const valor of valores) if (valor) limpio = limpio.split(valor).join(QUITADA);
  let formas = [];
  try {
    formas = require('./avisos').FORMAS_DE_CLAVE || [];
  } catch { /* sin ellas, con los valores de la carpeta */ }
  for (const forma of formas) limpio = limpio.replace(forma, QUITADA);
  return limpio;
}

// Lo que se sabe del disco cuando el asistente no escribió la sección.
function loQueSeSabe(datos) {
  const lineas = ['Lo que hace falta:'];
  for (const clase of datos.proveedor.acceso || []) lineas.push(`- ${QUE_HACE_FALTA[clase]}`);
  for (const c of datos.claves) lineas.push(c.donde ? `- ${c.clave}: ${c.donde}` : `- ${c.clave}`);
  if (datos.proveedor.ayuda) lineas.push(`- Se hace aquí: ${datos.proveedor.ayuda}`);
  lineas.push('- Con los permisos mínimos: si basta con leer, mejor de solo lectura.');
  return lineas.join('\n');
}

// El mensaje de una conexión. Null si la conexión no está.
function mensaje(proveedorId) {
  const datos = conexiones.claves(proveedorId);
  if (!datos) return null;
  const valores = conexiones.valoresDeClaves();
  const nombre = sinClaves(datos.proveedor.etiqueta, valores).slice(0, 80);
  const escrito = conexiones.paraTuInformatico(proveedorId);
  const deLaCarpeta = Boolean(escrito);
  const loSuyo = deLaCarpeta ? enTextoLlano(escrito).slice(0, 4000) : loQueSeSabe(datos);

  const cuerpo = [
    'Hola:',
    '',
    `Estoy conectando ${nombre} con mi asistente de IA y necesito tu ayuda para darle acceso.`,
    '',
    sinClaves(loSuyo, valores),
    '',
    ...porSeguridad(datos.proveedor.acceso, nombre),
    '',
    'Gracias.',
  ].join('\n');

  return {
    proveedor: { id: datos.proveedor.id, etiqueta: datos.proveedor.etiqueta },
    asunto: `Acceso a ${nombre} para mi asistente de IA`,
    cuerpo,
    // Si sale de lo que escribió el asistente o de lo que la barra sabe.
    deLaCarpeta,
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

const codificar = (t) => encodeURIComponent(String(t).replace(/\r?\n/g, '\r\n'));
const enlace = (asunto, cuerpo) => `mailto:?subject=${codificar(asunto)}&body=${codificar(cuerpo)}`;

function correo({ asunto, cuerpo }, { plataforma = process.platform } = {}) {
  const entero = enlace(asunto, cuerpo);
  if (plataforma !== 'win32' || entero.length <= CABE_EN_WINDOWS) return { enlace: entero, alPortapapeles: false };
  return { enlace: enlace(asunto, PEGALO), alPortapapeles: true };
}

module.exports = { mensaje, correo, sinClaves, enTextoLlano, porSeguridad, cualDeSeguridad, POR_SEGURIDAD, QUITADA, CABE_EN_WINDOWS };
