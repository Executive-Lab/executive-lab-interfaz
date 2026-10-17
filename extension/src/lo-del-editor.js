// Lo del asistente que el instalador deja en los ajustes de usuario, puesto por
// la barra si falta (decisión 163). Para quien solo instaló la barra, que no ha
// pasado por el instalador.
//
// Qué se pone y cómo se decide está en `instalador/comun/ajustes-del-editor.js`,
// el mismo que usa el instalador: aquí solo se dice con qué asistentes, cómo se
// escribe —por el editor, que respeta los comentarios de sus ajustes— y la frase.
//
// Solo lo del asistente (`claudeCode.*`, `chatgpt.*`). Lo de todo el editor —la
// confianza, las actualizaciones, la bienvenida— no lo toca nunca la barra: en el
// ordenador de quien usa el editor para otras cosas le cambiaría todas las
// ventanas (decisiones 15 y 71). Eso lo pone el instalador, en el del alumno.
//
// Una vez por ordenador y por clave: lo que ya está en la constancia, lo pusiera
// el instalador o la barra, no se vuelve a mirar. Si la persona lo quita, no
// vuelve. Una clave de un asistente que todavía no está puesto no se puede
// escribir (el editor no la conoce): se queda sin mirar y se pone cuando esté.

const path = require('node:path');
const vscode = require('vscode');
const entorno = require('./entorno');
const asistentes = require('./asistentes');

// Los ajustes de usuario están en la carpeta de la que cuelga el almacén de la
// barra: `<User>/globalStorage/<la barra>`. Si no tiene esa forma, no se sabe
// dónde dejar la constancia, y no se pone nada.
function carpetaDeUsuario(contexto) {
  const almacen = contexto && contexto.globalStorageUri && contexto.globalStorageUri.fsPath;
  if (!almacen) return null;
  const global = path.dirname(almacen);
  return path.basename(global) === 'globalStorage' ? path.dirname(global) : null;
}

// Con qué asistentes, según `executiveLab.asistente` (decisión 158): el del
// ajuste, los dos, o en automático los que estén puestos.
function conQuienes(comun) {
  const puestos = asistentes.ASISTENTES.filter((a) => asistentes.estaInstalado(a)).map((a) => a.id);
  return comun.asistentesDe(asistentes.elAjuste(), puestos);
}

async function ponerLoQueFalta(contexto, salida) {
  const carpeta = carpetaDeUsuario(contexto);
  const modulo = entorno.moduloComun('ajustes-del-editor');
  if (!carpeta || !modulo) return null;
  const comun = require(modulo);
  const quienes = conQuienes(comun);
  if (!quienes.length) return null;

  const configuracion = vscode.workspace.getConfiguration();
  const toca = comun.queToca(quienes);
  // Nunca lo del editor, aunque el módulo un día lo diga mal.
  for (const clave of Object.keys(toca)) if (!comun.DE_LA_BARRA.includes(clave)) delete toca[clave];

  return comun.ponerLoQueFalta({
    carpeta,
    toca,
    // Lo que diga en sus ajustes de usuario, sí o no, es suyo.
    laTiene: (clave) => {
      const visto = configuracion.inspect(clave);
      return Boolean(visto) && visto.globalValue !== undefined;
    },
    escribir: async (nuevos) => {
      const puestas = [];
      for (const [clave, valor] of Object.entries(nuevos)) {
        try {
          await configuracion.update(clave, valor, vscode.ConfigurationTarget.Global);
          puestas.push(clave);
        } catch (error) {
          // Un asistente que no está puesto: el editor no conoce su clave.
          if (salida) salida.appendLine(`[editor] ${clave}: ${error.message}`); // diccionario: interno
        }
      }
      return puestas;
    },
  });
}

// Lo que se ha puesto, en una frase y por lo que le cambia a la persona.
function laFrase(puestas) {
  const hay = (clave) => (puestas || []).includes(clave);
  const frases = [];
  const deClaude = [
    hay('claudeCode.focusView') && 'enseñándote solo lo que le pides y lo que te contesta',
    hay('claudeCode.hideOnboarding') && 'sin su lista de primeros pasos',
    hay('claudeCode.spinnerVerbs') && 'diciéndote en español lo que hace mientras trabaja',
  ].filter(Boolean);
  if (deClaude.length) frases.push(`He dejado a Claude ${deClaude.join(', ')}.`);
  if (hay('chatgpt.openOnStartup')) frases.push('He dejado Codex abriéndose solo al arrancar.');
  return frases.length ? frases.join(' ') : null;
}

module.exports = { carpetaDeUsuario, conQuienes, ponerLoQueFalta, laFrase };
