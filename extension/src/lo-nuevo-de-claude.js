// Dos cosas de Claude Code que le sirven a quien no es técnico (decisión 185).
//
// 1. El control remoto que no puede activarse. La barra y el instalador dejan
//    `remoteControlAtStartup: true` (decisión 143), pero Claude solo lo conecta
//    con un plan de pago, y en Team y Enterprise si un Owner lo activó antes en
//    los ajustes de administración; y con `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`
//    o `DISABLE_GROWTHBOOK` puestas en el entorno no está disponible
//    (code.claude.com/docs/en/remote-control, «Requirements»). Ayuda lo dice en
//    llano, y solo si el editor tiene alguna de esas dos variables lo dice también.
//
// 2. «Que Claude solo vea lo que le pegues»: `claudeCode.attachOpenFile`
//    (code.claude.com/docs/en/vs-code, tabla de ajustes; pide Claude Code
//    v2.1.271 o más: con una anterior se ignora y no pasa nada). A `false`, Claude
//    ya no recibe el fichero abierto en el editor, solo lo que se selecciona. Es un
//    ajuste de usuario del editor, así que vale para todas sus carpetas. Lo pone y
//    lo quita quien pulsa el botón, nadie más (P9: es local y se deshace).

const vscode = require('vscode');

const VARIABLES_QUE_LO_APAGAN = ['CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC', 'DISABLE_GROWTHBOOK'];
const CLAVE_VE_LO_ABIERTO = 'claudeCode.attachOpenFile';
// Si la persona ya lo tenía a `false` antes de pulsar, no lo pusimos nosotros.
const CLAVE_LO_PUSIMOS = 'executiveLab.soloLoPegadoPuesto';

// Las variables que Claude trataría como puestas. Un valor vacío, `0` o `false` no
// las enciende (como el resto de las variables de Claude Code).
function loQueApagaElControlRemoto(entorno = process.env) {
  return VARIABLES_QUE_LO_APAGAN.filter((v) => {
    const valor = String(entorno[v] === undefined ? '' : entorno[v]).trim().toLowerCase();
    return valor !== '' && valor !== '0' && valor !== 'false';
  });
}

// Lo que Ayuda necesita saber; `null` si Claude no está puesto (no viene a cuento).
function paraAyuda({ conClaude, entorno = process.env } = {}) {
  if (!conClaude) return null;
  return { apagado: loQueApagaElControlRemoto(entorno).length > 0 };
}

// ¿Está puesto en los ajustes de usuario del editor a `false`?
function soloLoPegado() {
  const visto = vscode.workspace.getConfiguration().inspect(CLAVE_VE_LO_ABIERTO);
  return Boolean(visto) && visto.globalValue === false;
}

// `cual`: true, que solo vea lo pegado; false, que vuelva a ver el fichero abierto.
async function ponerSoloLoPegado(contexto, cual) {
  const configuracion = vscode.workspace.getConfiguration();
  if (cual) {
    await contexto.globalState.update(CLAVE_LO_PUSIMOS, !soloLoPegado());
    await configuracion.update(CLAVE_VE_LO_ABIERTO, false, vscode.ConfigurationTarget.Global);
    return true;
  }
  // Lo que pusimos se quita; lo que ya tenía a `false` de antes, al volver a
  // pedirlo se deja como lo pide: a `true`, que es el valor de fábrica.
  const nuestro = contexto.globalState.get(CLAVE_LO_PUSIMOS) !== false;
  await configuracion.update(CLAVE_VE_LO_ABIERTO, nuestro ? undefined : true, vscode.ConfigurationTarget.Global);
  await contexto.globalState.update(CLAVE_LO_PUSIMOS, undefined);
  return false;
}

module.exports = { VARIABLES_QUE_LO_APAGAN, CLAVE_VE_LO_ABIERTO, CLAVE_LO_PUSIMOS, loQueApagaElControlRemoto, paraAyuda, soloLoPegado, ponerSoloLoPegado };
