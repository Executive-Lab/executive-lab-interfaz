// Lo que se puede hacer solo, se hace solo (P9, decisión 142).
//
// Cada arreglo de «Qué falta por montar» que la barra hace ella misma
// (`como: 'solo'`) y que cambia algo en la carpeta dice una de dos cosas:
//
//   · `alAbrir: true` — la barra lo hace al abrir la carpeta, sin esperar a
//     que nadie pulse, y lo cuenta en una frase;
//   · `retiene: '<caso>'` — cuál de los cuatro casos de P9 pide el sí de esa
//     persona, y por eso se queda en su botón.
//
// Los que solo llevan a otra pantalla (ver…, abrir…) no cambian nada y no
// dicen ninguna de las dos. Hay una prueba que lo exige en todo `terreno.js`.
//
// Aquí está lo que no depende del editor: qué toca, en qué orden y cómo se
// dice. Quién lo hace de verdad lo pone `extension.js`.

// Los cuatro casos de P9, con el nombre que llevan en `retiene`.
const CASOS = ['saleEnSuNombre', 'noSeDeshace', 'cuesta', 'loDecide'];

// Los que solo llevan a otra pantalla.
const esDeIr = (tipo) => /^(ver|abrir)[A-Z]/.test(String(tipo || ''));

// Lo que la activación ya hace por su cuenta, antes de esto: el relevo (C2) y
// los raíles (decisión 108). Van marcados `alAbrir` porque es verdad, y aquí no
// se repiten.
const YA_AL_ACTIVAR = new Set(['arreglarElRelevo', 'ponerLosRailesAlDia']);

// El orden: primero lo que trae lo que falta, después lo que lo ordena. Es
// también la lista cerrada de lo que este módulo sabe mandar hacer: un
// `alAbrir` con otro tipo lo caza la prueba.
const ORDEN = ['arrancar', 'arreglar'];

// Las piezas de la radiografía → [{ tipo, nombres }], una vez por tipo y en
// orden: dos piezas que se arreglan con lo mismo se arreglan una vez.
function queSeHaceSolo(piezas) {
  const porTipo = new Map();
  for (const pieza of piezas || []) {
    const arreglo = pieza && pieza.arreglo;
    if (!arreglo || arreglo.alAbrir !== true || !arreglo.accion) continue;
    const { tipo } = arreglo.accion;
    if (YA_AL_ACTIVAR.has(tipo)) continue;
    if (!porTipo.has(tipo)) porTipo.set(tipo, []);
    porTipo.get(tipo).push(pieza.nombre);
  }
  const puesto = (tipo) => (ORDEN.includes(tipo) ? ORDEN.indexOf(tipo) : ORDEN.length);
  return [...porTipo.entries()]
    .sort(([a], [b]) => puesto(a) - puesto(b))
    .map(([tipo, nombres]) => ({ tipo, nombres }));
}

// Hace las tareas una detrás de otra con `hacer[tipo]`, que devuelve si salió.
// Lo que falla no se cuenta como hecho y se apunta (P3): su pieza sigue en
// «Qué falta por montar» con su botón (P1). Devuelve los nombres arreglados.
async function hacerloSolo(tareas, hacer, apuntar = () => {}) {
  const hechas = [];
  for (const { tipo, nombres } of tareas) {
    const fn = hacer[tipo];
    if (!fn) {
      apuntar(`[solo] ${tipo}: no hay quien lo haga solo`); // diccionario: interno
      continue;
    }
    let ok = false;
    try {
      ok = Boolean(await fn());
    } catch (error) {
      apuntar(`[solo] ${tipo}: ${error.message}`); // diccionario: interno
    }
    apuntar(`[solo] ${tipo} (${nombres.join(', ')}): ${ok}`); // diccionario: interno
    if (ok) hechas.push(...nombres);
  }
  return hechas;
}

// «a, b y c»
const enLista = (cosas) => (cosas.length < 2 ? cosas.join('') : `${cosas.slice(0, -1).join(', ')} y ${cosas[cosas.length - 1]}`);

// La frase que lo cuenta. Con Claude, si se tocó algo que lee al empezar una
// conversación, se dice que la abra otra vez, con la frase de siempre.
function laFrase(hechas, reabrirClaude = false) {
  if (!hechas || !hechas.length) return null;
  const dicha = enLista([...new Set(hechas)].map((n) => `«${n}»`));
  return `Al abrir la carpeta he arreglado solo ${dicha}.${reabrirClaude ? ' Cierra la conversación con Claude y ábrela otra vez para que lo coja.' : ''}`;
}

module.exports = { CASOS, esDeIr, YA_AL_ACTIVAR, ORDEN, queSeHaceSolo, hacerloSolo, laFrase };
