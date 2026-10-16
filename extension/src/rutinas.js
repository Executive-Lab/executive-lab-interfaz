// Dos cosas que se parecen y no son la misma (decisión 155, y su revisión
// adversaria), cada una con su nombre:
//
// - **El recordatorio** lo lleva la barra (decisión 144): a su hora avisa, y se
//   hace con un clic. Aquí se elige su hora en palabras —frecuencia, día y hora—
//   y se guarda en el formato de las habilidades.
// - **Lo que se hace solo, sin avisar**, lo lleva el asistente en su gestor: una
//   rutina de Claude o una tarea programada de ChatGPT. La barra no la crea ni la
//   da por activa: prepara el encargo, con la verdad de dónde puede ir.
const vscode = require('vscode');
const limpio = require('./limpio');

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const FRECUENCIAS = [
  { label: 'Cada día', id: 'diaria' },
  { label: 'De lunes a viernes', id: 'laborables' },
  { label: 'Un día de la semana', id: 'semanal' },
  { label: 'Un día del mes', id: 'mensual' },
];

function aCron(frecuencia, dia, hora) {
  const m = String(hora || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
  const inicio = `${Number(m[2])} ${Number(m[1])}`;
  if (frecuencia === 'diaria') return `${inicio} * * *`;
  if (frecuencia === 'laborables') return `${inicio} * * 1-5`;
  if (!Number.isInteger(dia)) return null;
  if (frecuencia === 'semanal' && dia >= 0 && dia <= 6) return `${inicio} * * ${dia}`;
  if (frecuencia === 'mensual' && dia >= 1 && dia <= 31) return `${inicio} ${dia} * *`;
  return null;
}

// La hora que ya tenía, para cambiarla sin volver a escribirla.
function laHoraDe(cron) {
  const campos = String(cron || '').split(/\s+/);
  return /^\d+$/.test(campos[0]) && /^\d+$/.test(campos[1])
    ? `${String(campos[1]).padStart(2, '0')}:${String(campos[0]).padStart(2, '0')}` : '09:00';
}

async function elegirHorario(etiqueta, actual = '') {
  const frecuencia = await vscode.window.showQuickPick(FRECUENCIAS, {
    title: `Horario de «${etiqueta}»`, placeHolder: '¿Con qué frecuencia te lo recuerdo?',
  });
  if (!frecuencia) return null;
  let dia;
  if (frecuencia.id === 'semanal' || frecuencia.id === 'mensual') {
    const opciones = frecuencia.id === 'semanal'
      ? [1, 2, 3, 4, 5, 6, 0].map((d) => ({ label: DIAS[d], dia: d }))
      : Array.from({ length: 31 }, (_, i) => ({ label: `El día ${i + 1}`, dia: i + 1,
        ...(i >= 28 ? { description: 'En los meses que lo tienen' } : {}) }));
    const elegido = await vscode.window.showQuickPick(opciones, {
      title: `Horario de «${etiqueta}»`, placeHolder: '¿Qué día?',
    });
    if (!elegido) return null;
    dia = elegido.dia;
  }
  const hora = await vscode.window.showInputBox({
    title: `Horario de «${etiqueta}»`, prompt: '¿A qué hora? Se usa la hora de este ordenador.',
    value: laHoraDe(actual),
    placeHolder: '09:00',
    validateInput: (valor) => aCron(frecuencia.id, dia, valor) ? null : 'Escribe una hora entre 00:00 y 23:59, por ejemplo 09:00.',
  });
  return hora === undefined ? null : aCron(frecuencia.id, dia, hora);
}

const fecha = (t) => Number.isFinite(t) ? new Intl.DateTimeFormat('es-ES', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(t)) : null;

// «Crear un recordatorio nuevo»: lo que se pide es un recordatorio con botón, de
// los que lleva la barra. Ni «rutina» ni «tarea programada»: un Claude leería
// «crea una rutina» como su `/schedule`, que es otra cosa.
const CREAR_RECORDATORIO = 'Quiero un recordatorio con botón en esta carpeta: que la barra me avise a una hora y yo lo haga con un clic. Pregúntame qué trabajo quiero que me recuerde y cuándo. Prepáralo como una habilidad con botón y su horario, según las instrucciones de Executive Lab. Esto lo lleva la barra: no uses /schedule ni tareas programadas. Dime en una línea cuándo me avisará y qué tendré que pulsar.';

// Dónde puede hacerse sola, con la verdad de cada asistente (revisión adversaria
// de la 155; fuentes del 15-10-2026):
// - Claude, en su nube (https://code.claude.com/docs/en/routines): trabaja con una
//   copia de lo subido a GitHub, pide un plan de pago y va como mucho una vez por
//   hora. El `.env` y `keys/` no viajan: lo que usa conexiones no funciona allí,
//   y nunca se propone copiar claves a la nube.
// - Claude, en su app de escritorio (https://code.claude.com/docs/en/desktop-scheduled-tasks):
//   trabaja con esta carpeta, con el ordenador encendido y la app abierta.
// - ChatGPT (https://learn.chatgpt.com/docs/automations): sus tareas programadas
//   se crean en ChatGPT, no en el editor. La app de escritorio ve esta carpeta; la
//   web, no. Como la habilidad está aquí, la app de escritorio.
const DONDE = {
  nube: {
    descripcion: 'Una rutina en la nube de Claude',
    guia: 'https://code.claude.com/docs/en/routines',
  },
  escritorio: {
    descripcion: 'Usa tus conexiones: tarea programada en la app de escritorio de Claude',
    guia: 'https://code.claude.com/docs/en/desktop-scheduled-tasks',
  },
  chatgpt: {
    descripcion: 'Tarea programada en la app de escritorio de ChatGPT',
    guia: 'https://learn.chatgpt.com/docs/automations',
  },
};

const dondeSeHaceSola = (quien, conConexiones) => {
  if (quien === 'codex') return { id: 'chatgpt', ...DONDE.chatgpt };
  return conConexiones ? { id: 'escritorio', ...DONDE.escritorio } : { id: 'nube', ...DONDE.nube };
};

// La línea de la pantalla, debajo de los recordatorios.
const explicacion = (nombre) => `Para que se haga sin ti, te preparo el encargo para ${nombre}. Se crea y se revisa en su gestor, no aquí.`;

// El encargo. Lo que viene de la carpeta —el rótulo del botón— entra limpio, y
// la habilidad se nombra por cómo se pide, que ya viene comprobado.
function queSeHagaSola({ quien, etiqueta, invocacion, enPalabras = null, conConexiones = false }) {
  const donde = dondeSeHaceSola(quien, conConexiones);
  const nombre = limpio.etiqueta(etiqueta) || limpio.etiqueta(invocacion);
  const inicio = `Quiero que «${nombre}» se haga sola, sin que me avise la barra${enPalabras ? `: ${enPalabras}.` : '. Pregúntame cada cuánto.'}`;
  const habilidad = `Que use la habilidad que aquí se pide con ${invocacion}: léela para conservar sus instrucciones.`;
  const sinAviso = enPalabras ? ' Cuando esté creada, quita su horario de la habilidad para que la barra no me lo recuerde también.' : '';
  if (donde.id === 'nube') {
    return `${inicio} Con una rutina de Claude en la nube, que funciona aunque tenga el ordenador apagado. Antes de crearla, cuéntame lo que hace falta: un plan de pago de Claude y esta carpeta subida a GitHub, con la habilidad dentro, porque la rutina trabaja con una copia de lo que hay allí y lo que solo está en este ordenador no lo ve. Va como mucho una vez cada hora. ${habilidad} Si para hacerla hicieran falta claves de acceso, no las copies a la nube: dímelo y la preparamos en la app de escritorio de Claude. La guía: ${donde.guia}. Créala tú si puedes desde aquí; si no, dime los pasos que hago yo en Claude y te confirmo cuando esté creada.${sinAviso}`;
  }
  if (donde.id === 'escritorio') {
    return `${inicio} Usa conexiones de esta carpeta, y sus claves no salen de este ordenador, así que en la nube de Claude no funcionaría: prepárala como tarea programada de la app de escritorio de Claude, que trabaja con esta carpeta mientras el ordenador está encendido y la app abierta. ${habilidad} No copies claves a ningún otro sitio. La guía: ${donde.guia}. Dime los pasos que hago yo en la app de escritorio de Claude y te confirmo cuando esté creada.${sinAviso}`;
  }
  return `${inicio} Con una tarea programada de ChatGPT. Desde el editor no se gestionan: se crean en ChatGPT. Como la habilidad está en esta carpeta, tiene que ser en la app de escritorio de ChatGPT, con el ordenador encendido y la app abierta: las de la web no ven esta carpeta. ${habilidad} No copies claves a ningún otro sitio. La guía: ${donde.guia}.${sinAviso} Dime los pasos que hago yo en ChatGPT y te confirmo cuando esté creada.`;
}

module.exports = { aCron, laHoraDe, elegirHorario, fecha, CREAR_RECORDATORIO, DONDE, dondeSeHaceSola, explicacion, queSeHagaSola };
