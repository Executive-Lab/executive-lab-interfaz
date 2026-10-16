// La guía para sacar la clave, en PDF (decisión 159).
//
// Jose: *«tiene que quedar claro la guía de cómo sacar la API key para cada
// conexión. Lo ideal es que te dé un PDF o alguna guía muy bien establecida de
// cómo sacarla y dónde meterla»*. Es lo que más cuesta en clase: la guía de un
// paso cada vez (decisión 146) va en la barra, al lado de los campos, y hay quien
// la quiere en papel, al lado del ordenador, o para pasársela a un compañero.
//
// Lo que lleva, en este orden, y de dónde sale (P5: nada se inventa al pulsar):
//
//   · el título;
//   · **Antes de empezar**: lo que hace falta, si el asistente lo dejó escrito;
//   · **Los pasos**: los de «Cómo conectarla», los mismos que la guía de la barra,
//     con la página donde se hace como enlace;
//   · **Qué dato es cada cosa**: cada clave por su nombre en la barra, con dónde se
//     saca según su CREDENTIALS.md. Nunca un valor;
//   · **Dónde ponerla**: lo pone la barra, igual para todas, según la clase de
//     acceso (decisión 156);
//   · **Si no puedes sacarla tú**: «Pídeselo a tu informático», que ya existe;
//   · **Por seguridad**: la parte fija de la 156, dicha a quien la saca;
//   · **De dónde sale**: la página oficial que leyó el asistente y el día en que
//     lo comprobó, si constan.
//
// Las tres primeras las preparó el asistente, y el PDF lo dice debajo del título:
// no hablan con la voz de la barra. Todo lo que viene del disco pasa por el mismo
// tapado de claves que el mensaje para el informático.
//
// Se guarda en `01-TOOLS/<herramienta>/out/`, donde va lo que produce cada
// conexión: sale en Documentos, en Resultados (out), para abrirla o llevársela.
// La plantilla de RSC deja `out/` fuera de las copias, y está bien así: se vuelve a
// hacer con un clic. Y si una conexión hecha a mano no lo deja fuera, tampoco pasa
// nada, porque no lleva ningún valor de ninguna clave.

const fs = require('node:fs');
const path = require('node:path');
const conexiones = require('./conexiones');
const informatico = require('./informatico');
const proyecto = require('./proyecto');
const pdf = require('./pdf');
const { quedaDentro } = require('./foto');

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// «15 de octubre de 2026», de una fecha o de «2026-10-15».
function elDia(cuando) {
  if (typeof cuando === 'string') {
    const [anio, mes, dia] = cuando.split('-').map(Number);
    return `${dia} de ${MESES[mes - 1]} de ${anio}`;
  }
  return `${cuando.getDate()} de ${MESES[cuando.getMonth()]} de ${cuando.getFullYear()}`;
}

// Un nombre en una línea, sin caracteres de control y con tope.
const enUnaLinea = (t, cabe) => Array.from(String(t == null ? '' : t).replace(/[\u0000-\u001f\u007f\s]+/g, ' ').trim()).slice(0, cabe).join('');

// El fichero: «Guía para sacar la clave de Holded.pdf», y el segundo, «(2)». El
// nombre sale de la primera línea del README, así que no lleva nada que un
// sistema no acepte en un nombre de fichero. Y 40 letras como mucho: con cuatro
// bytes cada una, 60 pasaban de los 255 que admite un nombre en el Mac.
// Sin caracteres invisibles: uno que da la vuelta al texto hacía que el nombre se
// leyera al revés (revisión de seguridad de la 159).
function nombreDelFichero(nombre, n = 1) {
  const limpio = enUnaLinea(String(nombre == null ? '' : nombre).replace(/\p{Cf}/gu, ''), 40).replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').replace(/^[.\s]+|[.\s]+$/g, '') || 'esta conexión';
  return `Guía para sacar la clave de ${limpio}${n > 1 ? ` (${n})` : ''}.pdf`;
}

// Lo que se le pide al asistente cuando todavía no hay pasos (P1): que los escriba
// de la documentación oficial, donde la barra los lee.
// El nombre sale de la primera línea del README: en una línea, con tope y tapado.
function loQueSeLePide(etiqueta, proveedorId) {
  const nombre = enUnaLinea(informatico.sinClaves(enUnaLinea(etiqueta, 200)), 80) || proveedorId;
  return `Prepara la guía para sacar la clave de ${nombre} (01-TOOLS/${proveedorId}/), como dice tu habilidad executive-lab: `
    + 'busca en su documentación oficial cómo se saca y escribe los pasos en su README, bajo «## Cómo conectarla», numerados y con los nombres exactos de los menús y los botones. '
    + 'Pon delante lo que hace falta («Antes de empezar: …») y detrás la página oficial y el día en que lo comprobaste («Fuente: … · comprobado el …»). '
    + 'No escribas ningún paso que no hayas comprobado, y no pongas ninguna clave.';
}

// Las palabras de «Dónde ponerla», según la clase de acceso (decisión 156): lo
// mismo que se ve en la pantalla de la conexión.
function dondePonerla(datos, nombre, conPrueba) {
  const clases = datos.proveedor.acceso || [];
  const acciones = [];
  if (clases.includes('cuenta')) acciones.push('pulsa «Entrar»: el asistente te abre el navegador para que entres con tu cuenta');
  if (clases.includes('fichero')) acciones.push('suelta el fichero de acceso encima de la barra, o pulsa «Elegir el fichero»');
  const formas = datos.claves.map((c) => c.forma);
  if (formas.length || !acciones.length) {
    if (formas.length && formas.every((f) => f === 'usuario' || f === 'contrasena')) acciones.push('escribe el usuario y la contraseña en sus casillas → Guardar');
    else if (formas.length && formas.every((f) => f === 'direccion')) acciones.push('pega la dirección entera en su casilla → Guardar');
    else acciones.push('pega cada dato en su casilla → Guardar');
  }
  // Se prueba sola al guardar o al soltar el fichero, si trae prueba (decisiones 146 y 156).
  const sola = conPrueba && (formas.length || clases.includes('fichero')) ? 'Se prueba sola y te dice si funciona.' : '';
  const camino = `Abre la barra de Executive Lab → Conexiones (tools) → ${nombre}`;
  if (acciones.length === 1) return [{ tipo: 'parrafo', texto: `${camino} → ${acciones[0]}.${sola ? ` ${sola}` : ''}` }];
  return [
    { tipo: 'parrafo', texto: `${camino}, y allí:` },
    { tipo: 'lista', elementos: acciones.map((a) => `${a.charAt(0).toUpperCase()}${a.slice(1)}.`) },
    ...(sola ? [{ tipo: 'parrafo', texto: sola }] : []),
  ];
}

// Lo que va en la guía de una conexión, en bloques para `pdf.documento`. Null si
// la conexión no está.
function contenido(proveedorId, { cuando = new Date() } = {}) {
  const datos = conexiones.claves(proveedorId);
  const leido = datos && conexiones.laGuia(proveedorId);
  if (!datos || !leido) return null;
  const valores = informatico.valoresQueTapar();
  const tapar = (t) => informatico.sinClaves(String(t == null ? '' : t), valores);
  // Tapado sobre el texto tal cual y **como se va a escribir**: el PDF quita lo que
  // no se ve y cambia lo que no cabe en WinAnsi, y una clave con un espacio de ancho
  // cero, un dibujo o un acento suelto en medio, o en letras de ancho completo,
  // salía entera sin que el tapado la viera (revisión de seguridad de la 159).
  const comoSale = (t) => tapar(pdf.deWinAnsi(pdf.aWinAnsi(tapar(t))));
  // El nombre va en el título, en los datos del documento y en el nombre del fichero.
  const nombre = enUnaLinea(comoSale(enUnaLinea(datos.proveedor.etiqueta, 200)), 80) || proveedorId;
  const pasos = leido.pasos.map((p) => tapar(p).slice(0, 1000));
  const clases = datos.proveedor.acceso || [];
  const titulo = `Cómo sacar la clave de ${nombre} y dónde ponerla`;

  const bloques = [
    { tipo: 'titulo', texto: titulo },
    { tipo: 'parrafo', pequeno: true, texto: 'Antes de empezar, los pasos y qué dato es cada cosa los preparó el asistente para esta herramienta. Lo demás lo pone la barra de Executive Lab, igual para todas.' },
  ];

  // Antes de empezar, si el disco lo dice.
  const antes = leido.antes.map((t) => tapar(t)).map((t) => `${t.charAt(0).toUpperCase()}${t.slice(1)}`);
  if (antes.length) {
    bloques.push({ tipo: 'seccion', texto: 'Antes de empezar' });
    bloques.push(antes.length === 1 ? { tipo: 'parrafo', texto: antes[0] } : { tipo: 'lista', elementos: antes });
  }

  // Los pasos, con la página donde se hace.
  bloques.push({ tipo: 'seccion', texto: 'Los pasos' });
  const ayuda = datos.proveedor.ayuda ? tapar(datos.proveedor.ayuda) : null;
  if (ayuda) bloques.push({ tipo: 'parrafo', trozos: [{ texto: 'Se hace aquí: ' }, { texto: ayuda, enlace: ayuda }] });
  bloques.push({ tipo: 'lista', numerada: true, elementos: pasos });

  // Qué dato es cada cosa: el nombre de la casilla y dónde se saca. Ningún valor.
  bloques.push({ tipo: 'seccion', texto: 'Qué dato es cada cosa' });
  const cadaUno = datos.claves.map((c) => (c.donde
    ? [{ texto: `${c.etiqueta}: `, negrita: true }, { texto: tapar(c.donde) }]
    : [{ texto: c.etiqueta, negrita: true }]));
  if (clases.includes('fichero')) cadaUno.push([{ texto: 'Fichero de acceso: ', negrita: true }, { texto: 'una cuenta de servicio o un certificado.' }]);
  if (cadaUno.length) bloques.push({ tipo: 'lista', elementos: cadaUno });
  else if (clases.includes('cuenta')) bloques.push({ tipo: 'parrafo', texto: `No hay nada que pegar: entras con tu cuenta de ${nombre} en el navegador, y el asistente hace el resto.` });
  else bloques.push({ tipo: 'parrafo', texto: 'Esta conexión no pide ninguna clave.' });

  // Dónde ponerla, Si no puedes sacarla tú y Por seguridad: lo pone la barra.
  bloques.push({ tipo: 'seccion', texto: 'Dónde ponerla' }, ...dondePonerla(datos, nombre, conexiones.tienePrueba(proveedorId)));
  bloques.push(
    { tipo: 'seccion', texto: 'Si no puedes sacarla tú' },
    { tipo: 'parrafo', texto: 'Si la clave la tiene otra persona, o te piden permisos que no sabes dar, pulsa «Pídeselo a tu informático» en la pantalla de esta conexión: te prepara el mensaje para mandárselo.' },
  );
  // Entrar con tu cuenta y además una clave que pegar: la de una clave (revisión de corrección de la 156).
  const deSeguridad = clases.length && clases.every((c) => c === 'cuenta') && datos.claves.some((c) => c.secreta) ? ['cuenta', 'clave'] : clases;
  bloques.push({ tipo: 'seccion', texto: 'Por seguridad' }, { tipo: 'lista', elementos: informatico.porSeguridadParaTi(deSeguridad) });

  // De dónde sale: la página oficial y el día en que se comprobó, si constan.
  bloques.push({ tipo: 'seccion', texto: 'De dónde sale' });
  const fuente = leido.fuente;
  const url = fuente ? tapar(fuente.url) : null;
  const compruebalo = 'Pídele al asistente que compruebe estos pasos en la página oficial.';
  if (url && fuente.fecha) {
    bloques.push({ tipo: 'parrafo', trozos: [{ texto: `Comprobado el ${elDia(fuente.fecha)} en ` }, { texto: url, enlace: url }, { texto: '. Esto cambia: si algo no cuadra, mira lo que dice esa página.' }] });
  } else if (url) {
    bloques.push({ tipo: 'parrafo', trozos: [{ texto: 'Salen de ' }, { texto: url, enlace: url }, { texto: `, sin fecha de comprobación. ${compruebalo}` }] });
  } else {
    bloques.push({ tipo: 'parrafo', texto: compruebalo });
  }

  // Y otra vez el tapado, sobre todo lo que se va a escribir y como se va a escribir.
  // Lo de la barra no lleva claves, y así nada del disco se queda sin pasar por él.
  for (const b of bloques) {
    if (b.texto) b.texto = comoSale(b.texto);
    // El enlace, igual que su texto: lo que se ve es adónde lleva.
    if (b.trozos) b.trozos = b.trozos.map((t) => ({ ...t, texto: comoSale(t.texto), ...(t.enlace ? { enlace: comoSale(t.enlace) } : {}) }));
    if (b.elementos) b.elementos = b.elementos.map((e) => (Array.isArray(e) ? e.map((t) => ({ ...t, texto: comoSale(t.texto) })) : comoSale(e)));
  }

  return {
    nombre,
    titulo,
    bloques,
    pie: (n, total) => `Executive Lab · ${elDia(cuando)} · página ${n} de ${total}`,
    conPasos: pasos.length > 0,
    prompt: loQueSeLePide(nombre, proveedorId),
  };
}

const existe = (ruta) => {
  try {
    fs.lstatSync(ruta);
    return true;
  } catch {
    return false;
  }
};

// La escribe en `01-TOOLS/<herramienta>/out/`, sin pisar ninguna (la segunda lleva
// «(2)»), sin seguir enlaces y solo dentro de la carpeta de trabajo. Sin pasos no
// escribe nada: un PDF vacío no le sirve a nadie (P1), y se dice qué pedirle.
function guardar(proveedorId, { cuando = new Date() } = {}) {
  const hecho = contenido(proveedorId, { cuando });
  if (!hecho) return { ok: false, motivo: 'noEsta' };
  if (!hecho.conPasos) return { ok: false, motivo: 'sinPasos', prompt: hecho.prompt };
  const raiz = proyecto.raiz();
  const carpeta = proyecto.ruta('01-TOOLS', proveedorId, 'out');
  // Antes de crear nada, y otra vez después: entre una cosa y otra pudo cambiar.
  if (!carpeta || !quedaDentro(raiz, carpeta)) return { ok: false, motivo: 'fuera' };
  let datos;
  try {
    datos = pdf.documento(hecho);
  } catch (error) {
    return { ok: false, motivo: 'noSeArma', detalle: error.message };
  }
  try {
    fs.mkdirSync(carpeta, { recursive: true });
    if (!fs.lstatSync(carpeta).isDirectory() || !quedaDentro(raiz, carpeta)) return { ok: false, motivo: 'fuera' };
    let fichero = null;
    for (let n = 1; n <= 500 && !fichero; n += 1) {
      const nombre = nombreDelFichero(hecho.nombre, n);
      // Con `lstat`: un enlace que cuelga también cuenta como ocupado.
      if (!existe(path.join(carpeta, nombre))) fichero = nombre;
    }
    if (!fichero) return { ok: false, motivo: 'demasiadas' };
    // `wx`: si entre mirar y escribir apareciera algo con ese nombre, no se pisa ni se sigue.
    fs.writeFileSync(path.join(carpeta, fichero), datos, { flag: 'wx' });
    return { ok: true, fichero, completa: path.join(carpeta, fichero) };
  } catch (error) {
    return { ok: false, motivo: 'noSeEscribe', detalle: error.message };
  }
}

module.exports = { contenido, guardar, nombreDelFichero, loQueSeLePide, elDia };
