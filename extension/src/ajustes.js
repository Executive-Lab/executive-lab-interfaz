// Cómo quieres que trabaje: lo que se puede ajustar del comportamiento.
//
// Tres cosas que hasta ahora se decidían solas o no se decidían:
//
//   1. **Qué puede hacer sin preguntarte.** Es el ajuste que más miedo da a
//      alguien no técnico —"¿y si me borra algo?"— y vivía en un fichero de
//      configuración que no se enseña. Desde la decisión 182 se escribe donde el
//      editor lo lee de verdad: `claudeCode.initialPermissionMode`, en los ajustes
//      de USUARIO del editor, y vale para todas sus carpetas. Antes iba a
//      `permissions.defaultMode` de `.claude/settings.json`, y la extensión de
//      VS Code no lee los ajustes del proyecto para el modo de arranque
//      (code.claude.com/docs/en/permission-modes, «Switch permission modes»). Codex
//      lo lleva por su cuenta y eso se dice en pantalla en vez de fingir que lo
//      controlamos.
//   2. **Cada cuánto guarda solo.** No existía: guardar era siempre a mano, y
//      quien no se acuerda de pulsar el botón no tiene copias. Justo el público
//      de esto.
//   3. **El objetivo y los límites**, que se escriben el día que se monta la
//      carpeta y no se vuelven a ver nunca.

const fs = require('node:fs');
const vscode = require('vscode');
const proyecto = require('./proyecto');
const identidad = require('./identidad');

// ------------------------------------------- qué puede hacer sin preguntar

// Los modos de Claude Code, dichos por lo que le pasa a quien lo usa. El
// que salta todos los permisos no se ofrece: no es un ajuste, es quitarle el
// freno de mano a alguien que no sabe que lo tiene. `auto` es el de fábrica del
// editor (desde la 2.1.283) y no se escribe: la extensión no lo acepta como valor
// (`initialPermissionMode` admite default, manual, acceptEdits, plan y
// bypassPermissions), así que «ponerlo» es quitar lo escrito.
const PERMISOS = [
  { id: 'plan', nombre: 'Que me lo proponga antes', frase: 'Te cuenta lo que va a hacer y espera a que digas que sí. Lo más prudente.' },
  { id: 'default', nombre: 'Que me pregunte al cambiar algo', frase: 'Lee y mira por su cuenta, pero te pide permiso antes de tocar nada.' },
  { id: 'acceptEdits', nombre: 'Que cambie ficheros sin preguntar', frase: 'Va más rápido y te interrumpe menos. Ten copias al día.' },
  { id: 'auto', nombre: 'Que trabaje solo, con un revisor', frase: 'Va a su ritmo y un segundo revisor para lo que parezca peligroso. Es como viene de fábrica.' },
];

const CLAVE_PERMISO = 'claudeCode.initialPermissionMode';
const donde = require('./donde');

// Lo que el editor tiene puesto de verdad: solo cuenta el ajuste de usuario (el de
// carpeta lo ignora la extensión de Claude). Sin nada, Auto; `manual` es otro
// nombre de `default`; y un valor que no es de la lista —saltarse los permisos,
// puesto a mano— se devuelve tal cual y no se marca ninguna.
function permisoDeAhora() {
  const visto = vscode.workspace.getConfiguration().inspect(CLAVE_PERMISO) || {};
  const puesto = visto.globalValue;
  if (puesto === undefined || puesto === null || puesto === '') return 'auto';
  return puesto === 'manual' ? 'default' : puesto;
}

// En los ajustes de usuario del editor, con el sí de quien pulsa. Solo esa clave.
async function ponerPermiso(cual) {
  if (!PERMISOS.some((p) => p.id === cual)) return { ok: false, mensaje: 'Eso no es una de las opciones.' };

  // Solo con Claude. Con Codex no se inventa un ajuste que nadie lee.
  if (!donde.puedeTenerAjustes()) return { ok: false, mensaje: 'Esto lo lleva tu asistente por su cuenta, no se ajusta desde aquí.' };

  try {
    await vscode.workspace.getConfiguration().update(CLAVE_PERMISO, cual === 'auto' ? undefined : cual, vscode.ConfigurationTarget.Global);
  } catch {
    return { ok: false, mensaje: 'No he podido guardarlo. Pulsa «Algo va mal» y pásale el código a tu tutor.' };
  }
  return { ok: true, mensaje: 'Hecho. Vale para todas tus carpetas y se nota en la próxima conversación que abras.' };
}

// ---------------------------------------------------- cada cuánto guarda

// En horas. El cero es "no lo hagas".
const CADA_CUANTO = [
  { id: 0, nombre: 'Solo cuando yo lo diga', frase: 'Se guarda cuando pulsas el botón.' },
  { id: 1, nombre: 'Cada hora', frase: 'Mientras tengas esto abierto y haya algo nuevo que guardar.' },
  { id: 8, nombre: 'Un par de veces al día', frase: 'Suficiente para no perder una mañana de trabajo.' },
];

const CLAVE_GUARDADO = 'executiveLab.guardarSolo';

// De fábrica, cada hora (decisión 164): el mismo valor que el `default` del
// `package.json`, que es el que da el editor de verdad. Aquí también, para que
// sin ajuste —o con uno que no es de la lista— no se apague sin decirlo. Hay una
// prueba que exige que los dos digan lo mismo.
const DE_FABRICA = 1;

const cadaCuantoGuarda = () => {
  const puesto = vscode.workspace.getConfiguration().get(CLAVE_GUARDADO);
  return CADA_CUANTO.some((c) => c.id === puesto) ? puesto : DE_FABRICA;
};

async function ponerCadaCuanto(horas) {
  const cual = Number(horas);
  if (!CADA_CUANTO.some((c) => c.id === cual)) return { ok: false, mensaje: 'Eso no es una de las opciones.' };
  try {
    // Por carpeta, no global: cada arnés lleva su ritmo.
    await vscode.workspace.getConfiguration().update(CLAVE_GUARDADO, cual, vscode.ConfigurationTarget.Workspace);
  } catch {
    return { ok: false, mensaje: 'No he podido guardarlo. Pulsa «Algo va mal» y pásale el código a tu tutor.' };
  }
  return { ok: true, mensaje: cual ? 'Hecho. A partir de ahora guarda solo.' : 'Hecho. Solo guardará cuando lo pidas.' };
}

// -------------------------------------------------- el objetivo y los límites

// Se escriben el día que se monta la carpeta y no se vuelven a ver nunca. Están
// en el perfil, que es lo que el asistente lee antes de contestar: si el
// objetivo ya no es el de entonces, está trabajando para el de entonces.
function seccionDelPerfil(nombres) {
  const ruta = proyecto.ruta(...identidad.PERFIL);
  if (!ruta) return [];
  let texto;
  try {
    texto = fs.readFileSync(ruta, 'utf8');
  } catch {
    return [];
  }

  for (const nombre of nombres) {
    const desde = texto.search(new RegExp(`^##\\s+${nombre}\\s*$`, 'mi'));
    if (desde === -1) continue;
    const resto = texto.slice(desde).split(/\r?\n/).slice(1).join('\n');
    const hasta = resto.search(/^##\s+/m);
    const trozo = hasta === -1 ? resto : resto.slice(0, hasta);

    const puntos = trozo.split(/\r?\n/)
      .map((l) => l.match(/^\s*[-*]\s+(.{3,})$/))
      .filter(Boolean)
      .map((m) => m[1].trim())
      .filter((t) => !/[{}]/.test(t));
    if (puntos.length) return puntos;
  }
  return [];
}

function comoEstamos() {
  return {
    // Con Codex esto no existe: lo lleva él por su cuenta. Se dice, en vez de
    // enseñar tres botones que no cambian nada.
    hayPermisos: donde.puedeTenerAjustes(),
    permisos: PERMISOS,
    permiso: permisoDeAhora(),
    cadaCuanto: CADA_CUANTO,
    guarda: cadaCuantoGuarda(),
    objetivo: identidad.objetivo(),
    metas: seccionDelPerfil(['Goals', 'Objetivos']),
    limites: seccionDelPerfil(['Constraints', 'Límites', 'Limites']),
  };
}

module.exports = {
  CLAVE_PERMISO, permisoDeAhora, comoEstamos, ponerPermiso, ponerCadaCuanto, cadaCuantoGuarda, PERMISOS, CADA_CUANTO, CLAVE_GUARDADO, DE_FABRICA,
};
