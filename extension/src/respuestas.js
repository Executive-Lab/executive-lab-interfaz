// Las respuestas de «Preparar esta carpeta», guardadas hasta que se monta
// (decisión 165).
//
// Sin git, pulsar «Preparar esta carpeta» es el sí de ponerlo (P9): se pone a
// instalar y, mientras tanto, se hacen las preguntas. En cuanto aparece, se
// monta con ellas. Si git falla, tarda demasiado o se recarga la ventana a
// mitad, lo contestado no se pierde: se guarda aquí y no se vuelve a preguntar.
//
// Va en el estado del editor para esta carpeta, que un repositorio no puede
// traer escrito, y con la carpeta a la que pertenece: si se abre otra en la
// misma ventana, no vale para ella. Se olvida al montar, o si dice que no.

const proyecto = require('./proyecto');

const CLAVE = 'executiveLab.respuestasGuardadas';

// El de la activación. Quien tenga el suyo a mano (el arranque, con su
// `contexto`) lo pasa, y entonces manda ese.
let dondeGuardar = null;
const saberDondeGuardar = (workspaceState) => { dondeGuardar = workspaceState || null; };
const elDe = (estado) => estado || dondeGuardar;

// { raiz, rama, respuestas, cuando }, o null si no hay, si es de otra carpeta o
// si no se puede leer.
function leer(estado) {
  const memoria = elDe(estado);
  try {
    const guardado = memoria && memoria.get(CLAVE);
    if (!guardado || typeof guardado !== 'object' || !guardado.respuestas) return null;
    return guardado.raiz === proyecto.raiz() ? guardado : null;
  } catch {
    return null;
  }
}

async function guardar({ respuestas, rama }, estado) {
  const memoria = elDe(estado);
  const raiz = proyecto.raiz();
  if (!memoria || !raiz || !respuestas) return false;
  try {
    await memoria.update(CLAVE, { raiz, rama: rama || null, respuestas, cuando: new Date().toISOString() });
    return true;
  } catch {
    return false;
  }
}

async function olvidar(estado) {
  const memoria = elDe(estado);
  if (!memoria) return false;
  try {
    await memoria.update(CLAVE, undefined);
    return true;
  } catch {
    return false;
  }
}

module.exports = { CLAVE, saberDondeGuardar, leer, guardar, olvidar };
