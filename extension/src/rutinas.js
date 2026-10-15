// Elegir un horario en palabras. El formato que se guarda sigue siendo el de
// las habilidades; la persona solo elige frecuencia, día y hora (decisión 155).
const vscode = require('vscode');

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
        ...(i >= 28 ? { description: 'En los meses que tengan ese día' } : {}) }));
    const elegido = await vscode.window.showQuickPick(opciones, {
      title: `Horario de «${etiqueta}»`, placeHolder: '¿Qué día?',
    });
    if (!elegido) return null;
    dia = elegido.dia;
  }
  const campos = actual.split(/\s+/);
  const hora = await vscode.window.showInputBox({
    title: `Horario de «${etiqueta}»`, prompt: '¿A qué hora? Se usa la hora de este ordenador.',
    value: /^\d+$/.test(campos[0]) && /^\d+$/.test(campos[1])
      ? `${String(campos[1]).padStart(2, '0')}:${String(campos[0]).padStart(2, '0')}` : '09:00',
    placeHolder: '09:00',
    validateInput: (valor) => aCron(frecuencia.id, dia, valor) ? null : 'Escribe una hora entre 00:00 y 23:59, por ejemplo 09:00.',
  });
  return hora === undefined ? null : aCron(frecuencia.id, dia, hora);
}

const fecha = (t) => Number.isFinite(t) ? new Intl.DateTimeFormat('es-ES', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(t)) : null;

const CREAR_RUTINA = 'Quiero crear una rutina para esta carpeta y verla en «Rutinas y horarios» de la barra. Pregúntame qué trabajo quiero repetir y cuándo. Prepara una habilidad con botón y su horario según las instrucciones de Executive Lab. Explícame cuándo me avisará la barra y qué tengo que pulsar para hacerla.';

function automatica(quien) {
  if (quien === 'codex') return {
    texto: 'Las tareas programadas se crean y se revisan en ChatGPT, en la app o en la web. Si necesitan archivos de este ordenador, debe estar encendido y tener la app abierta. Las tareas de la web trabajan con sus documentos y conexiones.',
    guia: 'https://learn.chatgpt.com/docs/automations',
    prompt: 'Quiero preparar una tarea programada con Codex. Ayúdame a definir el trabajo, el horario, la zona horaria y dónde revisar el resultado. Si necesita los archivos de esta carpeta, prepara las instrucciones para crearla en la app de escritorio de ChatGPT, con el ordenador encendido y la app abierta. Si basta con documentos y conexiones de la web, explícame cómo crearla allí. El editor no tiene el gestor de tareas programadas: deja claro qué pasos quedan por hacer y comprueba el estado en el gestor antes de darla por activa.',
  };
  return {
    texto: 'Las rutinas de Claude en la nube trabajan con lo subido a GitHub y con sus conexiones, incluso con este ordenador apagado. Si necesitan archivos que solo están aquí, se programan en la app de escritorio, con el ordenador encendido y la app abierta.',
    guia: 'https://code.claude.com/docs/en/routines',
    prompt: 'Quiero preparar una tarea programada con Claude. Ayúdame a definir el trabajo, el horario, la zona horaria y dónde revisar el resultado. Si basta con lo que está en GitHub y con las conexiones de Claude, guíame para crear una rutina en Claude. Si necesita archivos que solo están en este ordenador, prepara las instrucciones para programarla en la app de escritorio, con el ordenador encendido y la app abierta. Deja claro qué pasos quedan por hacer y comprueba el estado en el gestor antes de darla por activa.',
  };
}

module.exports = { aCron, elegirHorario, fecha, automatica, CREAR_RUTINA };
