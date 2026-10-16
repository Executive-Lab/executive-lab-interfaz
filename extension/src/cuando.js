// Cuándo toca algo: los recordatorios de las habilidades con botón (decisión 144).
//
// Una habilidad puede llevar en su `metadata` un `cuando` con la hora en el
// formato de siempre de cron —minuto, hora, día del mes, mes y día de la
// semana—: `"0 9 * * 1"` es cada lunes a las 9. Lo escribe el asistente cuando
// el alumno dice «esto, cada lunes», o la barra, cuando ve la costumbre en los
// botones y el alumno dice que sí. A su hora, la barra lo recuerda con un botón.
//
// Cron, y no una frase, porque el asistente lo escribe sin dudar y aquí se lee
// sin adivinar (P5). Lo que se enseña, en cambio, va en palabras: `enPalabras`.
//
// Y la costumbre (`costumbre`): con qué regularidad se pulsa un botón. Se mira
// solo lo que pasa por la barra, que es lo que la barra ve.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const LIMITES = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]];

// Un campo de cron, en el conjunto de números que acepta; o null si no se entiende.
function campo(texto, [min, max]) {
  const valores = new Set();
  for (const trozo of String(texto).split(',')) {
    const m = trozo.match(/^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/);
    if (!m) return null;
    const paso = m[2] ? Number(m[2]) : 1;
    if (!paso) return null;
    let [desde, hasta] = m[1] === '*' ? [min, max] : m[1].split('-').map(Number);
    if (hasta === undefined) hasta = m[2] ? max : desde;
    if (desde < min || hasta > max || desde > hasta) return null;
    for (let v = desde; v <= hasta; v += paso) valores.add(v);
  }
  return valores;
}

// Un horario de verdad cabe en una línea corta. Lo que pase de aquí no se lee:
// lo escribe quien hizo la carpeta (revisión adversaria de la 155).
const TOPE = 100;

function leer(cron) {
  if (String(cron || '').length > TOPE) return null;
  const partes = String(cron || '').trim().split(/\s+/);
  if (partes.length !== 5) return null;
  const campos = partes.map((p, i) => campo(p, LIMITES[i]));
  if (campos.some((c) => !c)) return null;
  // El 7 también es domingo.
  if (campos[4].has(7)) campos[4].add(0);
  return { minuto: campos[0], hora: campos[1], dia: campos[2], mes: campos[3], semana: campos[4], partes };
}

const valido = (cron) => Boolean(leer(cron));

// Como cron: si se dan día del mes y día de la semana, vale cualquiera de los dos.
function tocaEseDia(c, fecha) {
  const conDia = c.partes[2] !== '*';
  const conSemana = c.partes[4] !== '*';
  const porDia = c.dia.has(fecha.getDate());
  const porSemana = c.semana.has(fecha.getDay());
  if (!c.mes.has(fecha.getMonth() + 1)) return false;
  if (conDia && conSemana) return porDia || porSemana;
  if (conDia) return porDia;
  if (conSemana) return porSemana;
  return true;
}

// Esa hora de ese día, en la hora del ordenador. Si no existe porque ese día se
// adelanta el reloj (las 2:30 del último domingo de marzo, en España), el primer
// momento que sí existe después: las 3:00. Así se avisa, como hace cron, en vez
// de saltarse el día (revisión adversaria de la 155). Con el reloj atrasado, la
// primera de las dos.
function aSuHora(dia, h, m) {
  const fecha = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), h, m);
  if (fecha.getHours() === h && fecha.getMinutes() === m && fecha.getDate() === dia.getDate()) return fecha.getTime();
  // Un hueco: de minuto en minuto hacia atrás, mientras el reloj siga marcando
  // esa hora o una posterior del mismo día. Ningún hueco pasa de unas horas.
  const pedida = h * 60 + m;
  let t = fecha.getTime();
  for (let paso = 0; paso < 6 * 60; paso += 1) {
    const antes = new Date(t - 60000);
    if (antes.getDate() !== dia.getDate() || antes.getHours() * 60 + antes.getMinutes() < pedida) break;
    t -= 60000;
  }
  const primera = new Date(t);
  return primera.getDate() === dia.getDate() ? primera.getTime() : null;
}

// La última vez que tocó, como mucho hace 62 días; o null. En la hora del
// ordenador, que es la de quien lo usa.
function ultimaVez(cron, ahora = Date.now()) {
  const c = leer(cron);
  if (!c) return null;
  const hoy = new Date(ahora);
  for (let atras = 0; atras <= 62; atras += 1) {
    const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - atras);
    if (!tocaEseDia(c, dia)) continue;
    const horas = [...c.hora].sort((a, b) => b - a);
    const minutos = [...c.minuto].sort((a, b) => b - a);
    for (const h of horas) {
      for (const m of minutos) {
        const fecha = aSuHora(dia, h, m);
        if (fecha !== null && fecha <= ahora) return fecha;
      }
    }
  }
  return null;
}

// El siguiente aviso, estrictamente después de ahora. Se recorren días del
// calendario local: sumar 24 horas se equivocaría al cambiar la hora. Ocho
// años cubren incluso los dos 29 de febrero separados por un siglo no bisiesto.
function proximaVez(cron, ahora = Date.now()) {
  const c = leer(cron);
  if (!c || !Number.isFinite(ahora)) return null;
  const hoy = new Date(ahora);
  const horas = [...c.hora].sort((a, b) => a - b);
  const minutos = [...c.minuto].sort((a, b) => a - b);
  for (let adelante = 0; adelante <= 8 * 366; adelante += 1) {
    const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + adelante);
    if (!tocaEseDia(c, dia)) continue;
    for (const h of horas) for (const m of minutos) {
      // Una hora que no existe por el cambio de hora, en el primer momento que sí.
      const fecha = aSuHora(dia, h, m);
      if (fecha !== null && fecha > ahora) return fecha;
    }
  }
  return null;
}

const laHora = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
// «a la 1:00», «a las 9:00».
const aLaHora = (h, m) => `${h === 1 ? 'a la' : 'a las'} ${laHora(h, m)}`;
// «los lunes», «los sábados».
const enPlural = (dia) => (dia.endsWith('s') ? dia : `${dia}s`);

// En palabras, para la pantalla. Lo que no sabe decir bien lo dice en general.
function enPalabras(cron) {
  const c = leer(cron);
  if (!c) return null;
  const [mi, ho, di, me, se] = c.partes;
  const unaHora = /^\d+$/.test(mi) && /^\d+$/.test(ho) ? ` ${aLaHora(Number(ho), Number(mi))}` : '';
  if (!unaHora) return 'varias veces al día';
  if (me !== '*') return `en fechas fijas${unaHora}`;
  if (di === '*' && se === '*') return `cada día${unaHora}`;
  if (di === '*' && (se === '1-5')) return `de lunes a viernes${unaHora}`;
  if (di === '*') {
    const dias = [...c.semana].filter((d) => d !== 7).sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DIAS[d]);
    if (dias.length === 1) return `cada ${dias[0]}${unaHora}`;
    const plurales = dias.map(enPlural);
    return `los ${plurales.slice(0, -1).join(', ')} y ${plurales[plurales.length - 1]}${unaHora}`;
  }
  // Del 29 en adelante, no todos los meses lo tienen: se dice, y esos se saltan.
  if (se === '*' && /^\d+$/.test(di)) return Number(di) >= 29 ? `el día ${di}, en los meses que lo tienen,${unaHora}` : `el día ${di} de cada mes${unaHora}`;
  return `en fechas fijas${unaHora}`;
}

// ── La costumbre ────────────────────────────────────────────────────────
//
// De cuándo se ha pulsado un botón (`veces`, en milisegundos), si hay una
// regularidad que merezca un recordatorio: el mismo día de la semana en tres
// de las últimas cinco semanas, el mismo día del mes en tres meses (de los
// últimos cien días), o casi todos
// los días laborables de la última semana. La hora, la del medio de las veces.
// Devuelve el cron, o null. Pide lo justo para no proponer nada por casualidad.
function costumbre(veces = [], ahora = Date.now()) {
  const recientes = veces.filter((t) => t <= ahora && ahora - t <= 100 * 86400000).map((t) => new Date(t));
  const enLasUltimas = (dias) => recientes.filter((f) => ahora - f.getTime() <= dias * 86400000);
  if (recientes.length < 3) return null;
  const horaDelMedio = (fechas) => {
    const h = fechas.map((f) => f.getHours()).sort((a, b) => a - b);
    return h[Math.floor(h.length / 2)];
  };
  const semanaDe = (f) => Math.floor((new Date(f.getFullYear(), f.getMonth(), f.getDate()).getTime() + 4 * 86400000) / (7 * 86400000));

  // Casi cada día laborable de los últimos siete.
  const ultimaSemana = recientes.filter((f) => ahora - f.getTime() <= 7 * 86400000 && f.getDay() >= 1 && f.getDay() <= 5);
  const diasDistintos = new Set(ultimaSemana.map((f) => f.toDateString()));
  if (diasDistintos.size >= 4) return `0 ${horaDelMedio(ultimaSemana)} * * 1-5`;

  // El mismo día de la semana, en tres semanas distintas de las últimas cinco.
  for (let d = 0; d < 7; d += 1) {
    const ese = enLasUltimas(35).filter((f) => f.getDay() === d);
    if (new Set(ese.map(semanaDe)).size >= 3) return `0 ${horaDelMedio(ese)} * * ${d}`;
  }

  // El mismo día del mes, en tres meses distintos.
  for (let dia = 1; dia <= 28; dia += 1) {
    const ese = recientes.filter((f) => f.getDate() === dia);
    if (new Set(ese.map((f) => `${f.getFullYear()}-${f.getMonth()}`)).size >= 3) return `0 ${horaDelMedio(ese)} ${dia} * *`;
  }
  return null;
}

module.exports = { valido, ultimaVez, proximaVez, enPalabras, costumbre };
