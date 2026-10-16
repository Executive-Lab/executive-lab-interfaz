// git, que es obligatorio — visto desde la barra lateral.
//
// El mecanismo (cómo se comprueba, cómo se instala en cada sistema, y por qué
// no lo llevamos dentro) está en instalador/comun/git.js, que es el mismo
// fichero que usa el instalador. Aquí solo queda lo que esto tiene de propio:
// saber dónde puede vivir un git que dejó el instalador, y qué hacer si el
// módulo compartido no aparece.

const entorno = require('./entorno');

// Se busca una vez y se recuerda, como historial.js: si no está, no va a estar
// más tarde.
let modulo;
let yaBuscado = false;

function compartido() {
  if (!yaBuscado) {
    yaBuscado = true;
    const donde = entorno.moduloComun('git');
    try {
      modulo = donde ? require(donde) : null;
    } catch {
      modulo = null;
    }
  }
  return modulo;
}

// Se le pasa el git que sepamos, que en una máquina con instalador es el suyo.
const comoLlamar = () => ({ git: entorno.git() });

// Sin módulo no se puede comprobar nada. Se responde que NO hay git, que es la
// respuesta prudente: enseña el botón de ponerlo en vez de dejar que la
// preparación aborte a mitad. El empaquetado comprueba que el módulo va dentro
// (extension/preparar-paquete.js) y una prueba lo verifica.
async function hay() {
  const m = compartido();
  return m ? m.hay(comoLlamar()) : false;
}

// Una sola vez a la vez (decisión 165): preparar la carpeta lo pone mientras
// pregunta, y en ese rato «Ponerla ahora» o volver a pulsar no pueden lanzar un
// segundo instalador. Quien llega después espera al que ya está.
let enCurso = null;
const NO_HE_PODIDO = 'No he podido poner git. Pulsa «Algo va mal» y pásale el código a tu tutor.';

function instalar(avisar = () => {}) {
  const m = compartido();
  if (!m) {
    const aMano = 'Pídesela a tu tutor: se llama git.';
    return Promise.resolve({ ok: false, mensaje: aMano });
  }
  if (!enCurso) {
    enCurso = Promise.resolve()
      .then(() => m.instalar(comoLlamar(), avisar))
      // Lo que falle por dentro se cuenta como un fallo, con su motivo (P3).
      .catch((error) => ({ ok: false, mensaje: NO_HE_PODIDO, detalle: error.message }))
      .finally(() => { enCurso = null; });
  }
  return enCurso;
}

const seEstaPoniendo = () => Boolean(enCurso);

function comoSeInstala() {
  const m = compartido();
  return m ? m.comoSeInstala() : 'Pídesela a tu tutor: se llama git.';
}

function sePuedeInstalarSolo() {
  const m = compartido();
  return Boolean(m && m.sePuedeInstalarSolo());
}

// La línea de debajo de «Preparar esta carpeta» cuando falta git y se puede
// poner solo (decisión 165): pulsar es el sí de instalarlo (P9), y se dice.
// Sin poder ponerlo solo no hay línea: sale lo de siempre, con su botón.
const AL_PREPARAR = 'Al pulsar pongo también git, para tus copias. Mientras se pone, te hago las preguntas.';

module.exports = { hay, instalar, seEstaPoniendo, comoSeInstala, sePuedeInstalarSolo, AL_PREPARAR };
