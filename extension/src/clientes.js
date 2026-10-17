// Los datos de clientes (decisión 153, el punto 12 de la 142).
//
// En la clase del 13-10, Eric: con datos de clientes, licencia de empresa, y dónde
// se apaga que se usen tus datos. Es para leer. La barra no puede contratar una
// licencia (cuesta dinero) ni tocar los ajustes de la cuenta de nadie (es suya):
// lo que hace sola es decirlo a tiempo (P9). Una vez por carpeta, y en cuanto
// empiezan a entrar datos de verdad: la primera conexión con sus claves puestas, o
// los primeros documentos que le da. Es justo antes de hablar de ellos con el
// asistente, que es cuando salen de este ordenador.
//
// El texto vive en `media/datos-de-clientes.json` (P5), comprobado en las páginas
// de Anthropic y OpenAI el día que pone `comprobado`. Aquí no se escribe ni una
// frase: se lee la tabla y se decide cuándo se dice.

const fs = require('node:fs');
const path = require('node:path');

// Ya se dijo: se apunta en el almacén de la carpeta, así que se dice una vez en
// cada una. Lo apuntan «Entendido» y leerlo, venga de la tarjeta o de Ayuda.
const CLAVE = 'executiveLab.datosDeClientesDicho';

// Una conexión por la que ya entran datos: con todas sus claves puestas, o con su
// fichero de acceso, y no a medio hacer. Es lo mismo que pide la pregunta de
// cuándo caduca la clave (decisión 149).
const estaPuesta = (c) => Boolean(c) && !c.aMedioHacer
  && (Array.isArray(c.claves) && c.claves.length ? c.claves.every((k) => k && k.puesta) : Boolean(c.conFichero));

// Por dónde empiezan a entrar: 'conexion', 'documentos' o null. Los documentos son
// los de «Documentos entregados»: sin leer, ya leídos y los originales guardados.
function porDondeEntran({ conexiones = [], documentos = 0 } = {}) {
  if (conexiones.some(estaPuesta)) return 'conexion';
  if (Number(documentos) > 0) return 'documentos';
  return null;
}

// La tabla, tal cual. Si no se puede leer, revienta: quien la pide lo apunta.
function laTabla(carpetaDeLaExtension) {
  return JSON.parse(fs.readFileSync(path.join(carpetaDeLaExtension, 'media', 'datos-de-clientes.json'), 'utf8'));
}

// Lo que se pinta en Ayuda: sin las notas ni la tarjeta.
//
// Sin Claude puesto, lo que es un ajuste de Claude no sale (decisión 185): su botón
// escribe una clave que el editor no conoce hasta que está su extensión.
function paraLeer(tabla, { conClaude = true } = {}) {
  const { titulo, entradilla, pie, fuentes = [] } = tabla;
  const partes = (tabla.partes || [])
    .map((p) => ({ ...p, lineas: (p.lineas || []).filter((l) => conClaude || !l.interruptor) }))
    .filter((p) => p.lineas.length);
  return { titulo, entradilla, partes, pie, fuentes };
}

// Lo que dice la tarjeta, según por dónde han empezado a entrar.
function laTarjeta(tabla, porDonde) {
  const t = (tabla && tabla.tarjeta) || {};
  return porDonde && t[porDonde] ? { texto: t[porDonde], detalle: t.detalle || '' } : null;
}

module.exports = { CLAVE, estaPuesta, porDondeEntran, laTabla, paraLeer, laTarjeta };
