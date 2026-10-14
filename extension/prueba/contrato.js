#!/usr/bin/env node
// El contrato con el arnés: todo lo que el arranque puede mandar, preguntado al
// RSC que viaja dentro de la barra.
//
//   node prueba/contrato.js
//
// ── Por qué existe ──────────────────────────────────────────────────────
//
// «Un poco de todo» no montaba nunca, y «Construir algo» con «Va para largo»
// tampoco (A1 y A2 de la auditoría todo-cuadra, 24-09-2026). Las pruebas de humo
// no lo veían porque allí RSC se finge, con una respuesta de éxito escrita a
// mano: se probaba todo menos lo que fallaba, que es si RSC acepta lo que la
// barra le manda.
//
// Aquí no se finge nada de RSC. Se juega el arranque de verdad —`entrevistar()`
// con el `vscode` falso de siempre— eligiendo una respuesta en cada pregunta.
// Con las respuestas se sacan los flags, con la misma función que usa el
// montaje, y se le pide el plan a RSC en seco: sin aceptarlo, en una carpeta
// temporal. Cada plan cuesta una décima de segundo.
//
// ── Lo que no se toca ───────────────────────────────────────────────────
//
// Nada fuera de las carpetas temporales. Antes de cargar nada se desvían la
// carpeta personal, la configuración de git y el aviso de versión nueva, para
// que ni RSC ni git lean ni escriban lo de quien corre la prueba.

const Module = require('node:module');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');

const temporales = [];
const temporal = (prefijo) => {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), prefijo));
  temporales.push(carpeta);
  return carpeta;
};

const CASA = temporal('contrato-casa-');
fs.writeFileSync(path.join(CASA, '.gitconfig'), '[user]\n\tname = Contrato\n\temail = contrato@example.com\n');
process.env.HOME = CASA;
process.env.USERPROFILE = CASA;
process.env.GIT_CONFIG_GLOBAL = path.join(CASA, '.gitconfig');
process.env.GIT_CONFIG_NOSYSTEM = '1';
process.env.RSC_NO_UPDATE_CHECK = '1';
delete process.env.EXECUTIVE_LAB_HOME;

// `require('vscode')` solo existe dentro del editor: aquí se desvía al falso.
const resolver = Module._resolveFilename;
Module._resolveFilename = function (pedido, ...resto) {
  if (pedido === 'vscode') return require.resolve('./vscode-falso.js');
  return resolver.call(this, pedido, ...resto);
};

const vscode = require('./vscode-falso');

const RAIZ = path.join(__dirname, '..');
const cargar = (m) => require(path.join(RAIZ, 'src', m));
const PAQUETE = path.join(RAIZ, 'media', 'harness', 'node_modules', '@ericrisco', 'rsc');

let pasadas = 0;

const comprobar = async (titulo, fn) => {
  try {
    const detalle = await fn();
    pasadas += 1;
    console.log(`  ✓ ${titulo}${detalle ? ` — ${detalle}` : ''}`);
  } catch (error) {
    console.error(`  ✗ ${titulo}\n    ${error.message}`);
    process.exitCode = 1;
  }
};

// ── Jugar el arranque ───────────────────────────────────────────────────
//
// Cada pregunta pasa por `COMO_SE_PREGUNTA[id]`. Se escucha cuál se está
// haciendo, sin cambiar cómo se hace, para contestar por su identificador y no
// por el texto de la pantalla, que cambia más a menudo.
const arrancar = cargar('arrancar');
const rumbo = cargar('rumbo');
const rscM = cargar('rsc');

let preguntando = null;
for (const [id, preguntar] of Object.entries(arrancar.COMO_SE_PREGUNTA)) {
  arrancar.COMO_SE_PREGUNTA[id] = (...args) => {
    preguntando = id;
    return preguntar(...args);
  };
}

// La carpeta del arranque desde cero: vacía, con git y sin recibo.
const VACIA = {
  estado: 'vacia', git: { hay: true }, carpeta: { vacia: true, cuantos: 0, parece: null },
  suelo: { faltan: [] }, habilidades: { declaradas: [], enDisco: [], colgando: [] },
  recibo: null, railes: { nombres: null }, claves: null,
};

// Contesta cada pregunta con la opción que diga `elige[id]`, un índice que da
// la vuelta si se pasa, y apunta lo que se ha visto por el camino.
async function jugar(elige = {}) {
  const vistas = [];
  vscode.window.showQuickPick = async (opciones) => {
    const lista = await opciones;
    const id = preguntando;
    const cual = lista[(elige[id] || 0) % lista.length];
    vistas.push({ id, rotulos: lista.map((o) => o.label), elegida: cual.label });
    return cual;
  };
  // Lo que se escribe a mano: el objetivo, si se elige «Otra cosa», y lo demás.
  vscode.window.showInputBox = async () => (preguntando === 'objetivo' ? 'Llevar los contratos de mis proveedores' : 'Prueba');

  const respuestas = await arrancar.entrevistar(rumbo.elegirRama(VACIA), VACIA);
  return { respuestas, vistas };
}

// ── Preguntarle a RSC ───────────────────────────────────────────────────

async function pedirElPlan(flags, carpeta) {
  vscode.guion.raiz = carpeta;
  return rscM.correr(['onboard', ...flags], { tiempoMaximo: 60000 });
}

const huella = (salida) => ((salida || '').match(/^Plan id: ([0-9a-f]{64})$/m) || [])[1];
const loQueDijo = (intento) => `${intento.error || ''}\n${intento.salida || ''}`.trim().split('\n')[0].slice(0, 160);

// Una carpeta como la deja el arranque justo antes de montar: con git.
function carpetaConGit(prefijo) {
  const carpeta = temporal(prefijo);
  execFileSync('git', ['init', '-q'], { cwd: carpeta });
  return carpeta;
}

async function main() {
  rscM.saberDondeEstamos(RAIZ);
  const { ONBOARDING_VALUES } = await import(pathToFileURL(path.join(PAQUETE, 'scripts', 'lib', 'onboarding.js')).href);

  await comprobar('se prueba el arnés que viaja dentro de la barra, en la versión de la clase', () => {
    const entrada = cargar('entorno').entradaDelArnes(null, RAIZ);
    assert.equal(entrada, path.join(PAQUETE, 'scripts', 'rsc.js'), `se está probando otro arnés: ${entrada}`);
    const { version } = JSON.parse(fs.readFileSync(path.join(PAQUETE, 'package.json'), 'utf8'));
    assert.equal(version, rscM.VERSION_DE_RESPALDO, 'el paquete de dentro no es el de la clase');
    return `RSC ${version}`;
  });

  // ── (b) Los interruptores de RSC ────────────────────────────────────────
  //
  // Desde la 2.0.6, RSC separa los interruptores del equipo, que viajan en
  // `.rsc.json`, de los de cada máquina (`targets/opt-outs.js`). El arranque de un
  // clon (`targets/clone-bootstrap.mjs`) se copia a cada carpeta y no puede importar
  // nada, así que lleva la lista del equipo copiada a mano. Su comentario dice que
  // una prueba las mantiene iguales, y esa prueba es de RSC, no de aquí (revisión
  // de la 0.42.0). Esta avisa, al subir de versión, de tres cosas: si las dos copias
  // se separan, si la de este repositorio no es la del paquete, o si RSC trae un
  // interruptor que la barra no sabe nombrar.
  await comprobar('los interruptores de RSC cuadran en sus dos copias, y la barra los nombra todos', async () => {
    const optOuts = await import(pathToFileURL(path.join(PAQUETE, 'targets', 'opt-outs.js')).href);
    const arranque = await import(pathToFileURL(path.join(PAQUETE, 'targets', 'clone-bootstrap.mjs')).href);
    assert.deepEqual([...arranque.PROJECT_OPT_OUTS].sort(), [...optOuts.PROJECT_OPT_OUTS].sort(), 'las dos listas del equipo de RSC no son la misma');
    const deAqui = fs.readFileSync(path.join(RAIZ, '..', '.claude', 'rsc-bootstrap.mjs'), 'utf8');
    assert.equal(deAqui, fs.readFileSync(path.join(PAQUETE, 'targets', 'clone-bootstrap.mjs'), 'utf8'),
      'el arranque de clon de este repositorio no es el del paquete: falta sincronizarlo');
    const reglas = cargar('reglas');
    const conNombre = new Set([...reglas.GUARDIANES, ...reglas.AUTOMATISMOS].map((p) => p.interruptor).filter(Boolean));
    const sinNombre = [...optOuts.PROJECT_OPT_OUTS, ...optOuts.MACHINE_OPT_OUTS].filter((id) => !conNombre.has(`.no-${id}`));
    assert.deepEqual(sinNombre, [], `interruptores de RSC que la barra no sabe nombrar: ${sinNombre.join(', ')}`);
    return `${optOuts.PROJECT_OPT_OUTS.length} del equipo y ${optOuts.MACHINE_OPT_OUTS.length} de cada máquina, todos con nombre`;
  });

  // ── (c) Lo que la barra da por bueno ────────────────────────────────────
  //
  // `rumbo` decide qué se vuelve a preguntar mirando si un valor «vale». Si da
  // por bueno algo que RSC rechaza, se arrastra un arnés que no monta.
  await comprobar('cada valor que la barra da por bueno, RSC también lo acepta', () => {
    const CAMPOS = [
      ['nivel', 'technicalLevel', 'nivel'],
      ['workflow', 'workflow', 'forma de guardar los cambios'],
      ['deQueVa', 'projectKind', 'tipo de proyecto'],
      ['tamano', 'softwareScope', 'tamaño'],
    ];
    const fuera = CAMPOS.flatMap(([nuestro, suyo, nombre]) => rumbo.VALORES[nuestro]
      .filter((valor) => !ONBOARDING_VALUES[suyo].includes(valor))
      .map((valor) => `${valor} no es un ${nombre} de RSC, que acepta ${ONBOARDING_VALUES[suyo].join(' | ')}`));
    assert.ok(!fuera.length, fuera.join('\n    '));
    return `${CAMPOS.length} campos, contra los del paquete`;
  });

  // Y al revés: lo que RSC ofrece se puede elegir. Faltaba «Al grano» (L0), el
  // primero de los cuatro escalones (A4).
  await comprobar('todo lo que RSC acepta se puede elegir en el arranque', () => {
    const OFRECE = {
      technicalLevel: arrancar.COMO_TE_MANEJAS.map((o) => o.nivel),
      // Ni el dial, que RSC retiró, ni `workflow`, que en las carpetas de la barra va
      // siempre a `main` a propósito (decisión 145).
      projectKind: arrancar.DE_QUE_VA.map((o) => o.kind),
      softwareScope: arrancar.QUE_VAS_A_CONSTRUIR.map((o) => o.tamano),
    };
    const sinElegir = Object.entries(OFRECE).flatMap(([campo, ofrece]) => ONBOARDING_VALUES[campo]
      .filter((valor) => !ofrece.includes(valor))
      .map((valor) => `${valor} (${campo}): RSC lo ofrece y el arranque no`));
    assert.ok(!sinElegir.length, sinElegir.join('\n    '));
    return `${Object.keys(OFRECE).length} preguntas, enteras`;
  });

  // ── (d) Lo que RSC exige se pregunta ────────────────────────────────────
  //
  // Se le pregunta a RSC por cada tipo sin decirle el tamaño: si lo necesita,
  // lo pide. Y entonces el arranque tiene que haberlo preguntado.
  await comprobar('cada tipo de proyecto para el que RSC pide el tamaño, el arranque lo pregunta', async () => {
    const carpeta = temporal('contrato-tipos-');
    const faltas = [];
    const loPiden = [];
    for (const kind of ONBOARDING_VALUES.projectKind) {
      const sinTamano = await pedirElPlan(
        ['--technical-level', 'mixed', '--accompaniment', 'L2', '--project-kind', kind, '--goal', 'Probar', '--target', 'claude'],
        carpeta,
      );
      const loPide = /RSC_ONBOARDING_REQUIRED/.test(sinTamano.error) && /software-scope/.test(sinTamano.error);
      if (loPide) loPiden.push(kind);

      const cual = arrancar.DE_QUE_VA.findIndex((o) => o.kind === kind);
      if (cual < 0) {
        faltas.push(`${kind}: RSC lo acepta y el arranque no lo ofrece`);
        continue;
      }
      const { respuestas } = await jugar({ deQueVa: cual });
      if (loPide && !ONBOARDING_VALUES.softwareScope.includes(respuestas.tamano)) {
        faltas.push(`${kind} sin tamaño: RSC lo exige y el arranque no lo pregunta`);
      }
    }
    assert.ok(!faltas.length, faltas.join('\n    '));
    // Si RSC dejara de pedirlo a todos, esto pasaría sin mirar nada: se dice.
    assert.ok(loPiden.length, 'RSC ya no pide el tamaño con ningún tipo: esta comprobación no mira nada, revísala');
    return `lo piden ${loPiden.join(' y ')}, y el arranque lo pregunta`;
  });

  // ── (a) Cada respuesta da un plan ───────────────────────────────────────
  //
  // No se recorren todas las combinaciones (C-8): cada valor de cada pregunta
  // sale al menos una vez con cada tipo de proyecto, que es donde cambia lo que
  // se pregunta. Primero se juega una vez para ver qué pregunta el arranque con
  // ese tipo y cuántas opciones tiene cada pregunta; después, una jugada por
  // opción.
  await comprobar('cada respuesta del arranque da un plan de RSC', async () => {
    const carpeta = temporal('contrato-planes-');
    const rotos = [];
    let pedidos = 0;

    for (let tipo = 0; tipo < arrancar.DE_QUE_VA.length; tipo += 1) {
      const { vistas } = await jugar({ deQueVa: tipo });
      const otras = vistas.filter((v) => v.id !== 'deQueVa');
      const vueltas = Math.max(1, ...otras.map((v) => v.rotulos.length));

      for (let i = 0; i < vueltas; i += 1) {
        const elige = { deQueVa: tipo, ...Object.fromEntries(otras.map((v) => [v.id, i])) };
        const jugada = await jugar(elige);
        const intento = await pedirElPlan(arrancar.flagsDelMontaje(jugada.respuestas), carpeta);
        pedidos += 1;
        if (intento.codigo !== 0 || !huella(intento.salida)) {
          rotos.push(`«${jugada.vistas.map((v) => v.elegida).join(' · ')}» → ${loQueDijo(intento)}`);
        }
      }
    }

    assert.ok(pedidos >= arrancar.DE_QUE_VA.length, `solo se han pedido ${pedidos} planes: la jugada no llega a RSC`);
    assert.deepEqual(fs.readdirSync(carpeta), [], 'pedir el plan en seco ha escrito algo en la carpeta');
    assert.ok(!rotos.length, `${rotos.length} de ${pedidos} jugadas no dan plan:\n    ${rotos.join('\n    ')}`);
    return `${pedidos} planes pedidos, todos con su huella`;
  });

  // ── Un objetivo escrito a mano llega entero ─────────────────────────────
  //
  // RSC decodifica el objetivo, lo limpia y lo vuelve a codificar en su línea
  // de aceptación. Si lo que devuelve es lo que se le mandó, lo recibió entero.
  await comprobar('un objetivo con cualquier carácter llega entero a RSC', async () => {
    const objetivo = 'Cobrar a "Soler & Hijos" el 50% | ^ que falta — ¿ya?';
    const flags = arrancar.flagsDelMontaje({ nivel: 'mixed', dial: 'L2', kind: 'operations', objetivo, asistente: 'claude' });
    const intento = await pedirElPlan(flags, temporal('contrato-objetivo-'));
    const devuelto = (intento.salida.match(/--goal-base64 (\S+)/) || [])[1];
    assert.ok(devuelto, `RSC no ha dado plan: ${loQueDijo(intento)}`);
    assert.equal(Buffer.from(devuelto, 'base64url').toString('utf8'), objetivo, 'RSC ha recibido otro objetivo');
    return 'ida y vuelta';
  });

  // ── (b) Lo que RSC contesta al aplicar ──────────────────────────────────
  //
  // `onboard --accept-plan` tiene dos `RSC_ONBOARDING_INCOMPLETE` que no se
  // parecen en nada (A3):
  //
  //   · por la salida normal, con código 0 y la huella: el plan ESTÁ aplicado y
  //     falta el suelo. Pasa siempre que el plan practica SDD, porque entonces
  //     el suelo incluye los innegociables y `onboard` no los escribe;
  //   · por la de errores, con código 4 y «Recover with»: el montaje falló a
  //     mitad y RSC lo ha deshecho.
  //
  // La barra leía los dos como un fallo. Aquí se aplica de verdad, porque el
  // primero solo sale al aplicar.
  const MONTAJE = { nivel: 'mixed', asistente: 'claude' };
  const INNEGOCIABLES = '02-DOCS/wiki/sdd/constitution.md';

  await comprobar('sin la cadena SDD, el montaje queda listo', async () => {
    vscode.guion.raiz = carpetaConGit('contrato-listo-');
    const hecho = await arrancar.COMO_SE_HACE.montarElArnes({ respuestas: { ...MONTAJE, kind: 'operations', objetivo: 'Organizar el papeleo' } });
    assert.equal(hecho.ok, true, hecho.detalle);
    assert.equal(hecho.forma, 'Listo', `se ha leído como «${hecho.forma}»`);
    return 'operaciones';
  });

  await comprobar('un plan que practica SDD queda montado y listo, con el borrador de los innegociables', async () => {
    // Con la 2, RSC dejaba los innegociables por escribir y el montaje quedaba con
    // el suelo a medias (A3). La 3 deja un borrador, y el arnés queda listo.
    const CASOS = [
      { como: 'algo que irá sumando piezas', kind: 'software', tamano: 'growing', objetivo: 'Montar una web sencilla' },
      { como: 'una plataforma completa', kind: 'software', tamano: 'complex', objetivo: 'Montar una web sencilla' },
      { como: 'una cosa concreta que habla de pagos', kind: 'software', tamano: 'small', objetivo: 'Cobrar los pagos de mis clientes' },
    ];
    const mal = [];
    for (const { como, ...caso } of CASOS) {
      const carpeta = carpetaConGit('contrato-sdd-');
      vscode.guion.raiz = carpeta;
      const hecho = await arrancar.COMO_SE_HACE.montarElArnes({ respuestas: { ...MONTAJE, ...caso } });

      if (!fs.existsSync(path.join(carpeta, '.rsc.json'))) mal.push(`${como}: RSC no lo ha aplicado`);
      else if (!hecho.ok) mal.push(`${como}: RSC lo ha aplicado y la barra lo da por fallo`);
      else if (!['Listo', 'SueloAMedias'].includes(hecho.forma)) mal.push(`${como}: se ha leído como «${hecho.forma}»`);
      else if (hecho.forma === 'Listo' && !fs.existsSync(path.join(carpeta, INNEGOCIABLES))) mal.push(`${como}: «Listo» sin los innegociables`);
      else if (hecho.forma === 'SueloAMedias' && !(hecho.faltan || []).includes(INNEGOCIABLES)) mal.push(`${como}: a medias y no dice qué falta (${(hecho.faltan || []).join(', ') || 'nada'})`);
      // Y con algo que construir, la rama principal abierta, como en clase.
      else if (!fs.existsSync(path.join(carpeta, '.rsc', '.no-trunk-guard'))) mal.push(`${como}: la rama principal queda cerrada al asistente`);
    }
    assert.ok(!mal.length, mal.join('\n    '));
    return `${CASOS.length} montajes, listos y con la rama principal abierta`;
  });

  await comprobar('si RSC deshace el montaje, la barra dice que no se ha podido', async () => {
    // Una trampa que RSC no puede saltar: donde van sus habilidades hay un
    // fichero. Falla a mitad, lo deshace y lo dice por la salida de errores.
    const carpeta = carpetaConGit('contrato-deshecho-');
    fs.writeFileSync(path.join(carpeta, '.claude'), 'soy un fichero, no una carpeta\n');
    vscode.guion.raiz = carpeta;
    const hecho = await arrancar.COMO_SE_HACE.montarElArnes({ respuestas: { ...MONTAJE, kind: 'operations', objetivo: 'Organizar el papeleo' } });
    assert.equal(hecho.ok, false, 'un montaje deshecho no puede darse por bueno');
    assert.equal(hecho.forma, 'Deshecho', `se ha leído como «${hecho.forma}»`);
    assert.match(hecho.detalle, /código 4/, 'el parte no dice con qué código terminó');
    return 'código 4, deshecho';
  });

  // ── Lo que cambia entre dos planes, en español ─────────────────────────
  //
  // Revisión de F2, C2. Volver a montar con otro plan se enseña antes de
  // firmarlo, y la tabla que lo dice en cristiano tenía claves que RSC 2.0.5 no
  // usa (`workflow/sdd`, `agent/base-agents`) y buscaba los agentes entre las
  // habilidades: la pantalla salía en inglés. Aquí se piden los planes de
  // verdad, y cada pieza que entra o sale tiene que tener su nombre.
  await comprobar('lo que cambia entre dos planes de RSC se dice en español', async () => {
    const carpeta = temporal('contrato-cambios-');
    const nombresM = cargar('nombres');
    const seleccion = async (respuestas) => {
      const intento = await pedirElPlan(arrancar.flagsDelMontaje({ ...MONTAJE, objetivo: 'Organizar el papeleo', ...respuestas }), carpeta);
      return rscM.leerElPlanEnSeco(intento.salida).seleccionados;
    };
    const PARES = [
      [{ kind: 'operations' }, { kind: 'software', tamano: 'growing' }],
      [{ kind: 'software', tamano: 'small' }, { kind: 'software', tamano: 'complex' }],
      [{ kind: 'mixed', tamano: 'small' }, { kind: 'mixed', tamano: 'growing' }],
    ];
    const sinNombre = new Set();
    let piezas = 0;
    for (const [antes, despues] of PARES) {
      const eran = (await seleccion(antes)).map((d) => ({ ...d, state: 'selected' }));
      const { entran, salen } = rscM.cambiosDePolitica(await seleccion(despues), eran);
      const claves = [...entran, ...salen];
      // Lo que sale en la pantalla, y no lo que hay en las tablas: cada pieza,
      // con su frase o con su nombre de verdad entre comillas.
      const dicho = arrancar.comoSeDiceLoQueCambia(claves).join(' · ');
      assert.doesNotMatch(dicho, /\b(skill|agent|hook|guard|workflow|capability|route)\//, `«${dicho}» lo dice en clave`);
      for (const clave of claves) {
        piezas += 1;
        const [kind, id] = clave.split('/');
        if (arrancar.PIEZAS_DEL_PLAN[clave]) {
          if (!dicho.includes(arrancar.PIEZAS_DEL_PLAN[clave])) sinNombre.add(clave);
          continue;
        }
        const monton = { agent: 'ayudantes', skill: 'habilidades' }[kind];
        const fila = monton && nombresM.comoSeLlama(monton, id, {});
        if (!fila || !fila.deFuera || !dicho.includes(`«${fila.nombre}»`)) sinNombre.add(clave);
      }
    }
    assert.ok(piezas > 0, 'ningún par cambia nada: la prueba no mira');
    assert.deepEqual([...sinNombre], [], 'estas piezas salen sin nombre en español');
    assert.deepEqual(fs.readdirSync(carpeta), [], 'pedir el plan en seco ha escrito algo en la carpeta');
    return `${piezas} piezas que entran o salen, todas con su nombre`;
  });

  // ── El freno propio sobrevive a RSC ─────────────────────────────────────
  //
  // C1: el freno propio es un enganche nuestro, sin `.rsc/` en la orden, porque
  // RSC quita todo lo que lleva esa aguja cuando reescribe los suyos. Se monta
  // de verdad una carpeta de operaciones, que no trae el freno de RSC, se ponen
  // los raíles y se corre `sync`.
  await comprobar('con la 3, el freno lo pone RSC y el nuestro se aparta; y un sync no lo quita', async () => {
    // C1 y #273: con la 2, RSC no ponía su freno en una carpeta de operaciones y
    // lo ponían los raíles. La 3 lo pone a quien no es técnico. El nuestro sigue
    // enganchado, para las carpetas donde RSC no lo pone, y cuando el de RSC está
    // se aparta sin decir nada: un solo freno, nunca dos.
    const cp = require('node:child_process');
    const carpeta = carpetaConGit('contrato-freno-');
    vscode.guion.raiz = carpeta;
    const montado = await arrancar.COMO_SE_HACE.montarElArnes({ respuestas: { ...MONTAJE, nivel: 'non-technical', kind: 'operations', objetivo: 'Organizar el papeleo' } });
    assert.equal(montado.ok, true, montado.detalle);
    const suyo = path.join(carpeta, '.rsc', 'danger-guard.mjs');
    assert.ok(fs.existsSync(suyo), 'RSC no ha puesto su freno a quien no es técnico (#273)');
    assert.ok(await arrancar.ponerLosRailes({ extensionPath: RAIZ }), 'los raíles no se ponen');
    const conFreno = () => fs.readFileSync(path.join(carpeta, '.claude', 'settings.json'), 'utf8').includes('.claude/skills/executive-lab/freno.mjs');
    assert.ok(conFreno(), 'los raíles no enganchan el freno');

    const orden = JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'rm -rf ~/Documents' } });
    const elSuyo = cp.spawnSync(process.execPath, [suyo, carpeta], { input: orden, encoding: 'utf8' });
    assert.match(elSuyo.stdout, /"deny"/, `el freno de RSC no para un rm -rf: ${elSuyo.stdout.slice(0, 120)}`);
    const nuestro = path.join(carpeta, '.claude', 'skills', 'executive-lab', 'freno.mjs');
    const elNuestro = cp.spawnSync(process.execPath, [nuestro, carpeta], { input: orden, encoding: 'utf8' });
    assert.equal(elNuestro.status, 0);
    assert.doesNotMatch(elNuestro.stdout, /"deny"/, 'frenan los dos: el nuestro no se aparta');

    const sincronizado = await rscM.sincronizar();
    assert.equal(sincronizado.codigo, 0, loQueDijo(sincronizado));
    assert.ok(conFreno(), 'el sync de RSC ha quitado el freno');
    return 'el de RSC frena, el nuestro se aparta, y el sync no lo quita';
  });

  await comprobar('arreglar no cambia los frenos que pide el plan', async () => {
    // C6 y #274: con la 2, `repair` volvía a instalar sin la política del plan y
    // enganchaba frenos que el plan no pedía. Ahora se mira que arreglar deje los
    // mismos frenos que había al montar, sean los que sean en la 3.
    const carpeta = carpetaConGit('contrato-arreglar-');
    vscode.guion.raiz = carpeta;
    const montado = await arrancar.COMO_SE_HACE.montarElArnes({ respuestas: { ...MONTAJE, kind: 'operations', objetivo: 'Organizar el papeleo' } });
    assert.equal(montado.ok, true, montado.detalle);
    const frenos = () => fs.readdirSync(path.join(carpeta, '.rsc')).filter((n) => /-(guard|gate)\.mjs$/.test(n)).sort();
    const enganchados = () => (fs.readFileSync(path.join(carpeta, '.claude', 'settings.json'), 'utf8').match(/\.rsc\/[a-z-]+-(guard|gate)\.mjs/g) || []).sort();
    const antes = { frenos: frenos(), enganchados: enganchados() };
    fs.rmSync(path.join(carpeta, '.claude', 'skills', 'unslop'), { recursive: true, force: true });
    const hecho = await arrancar.COMO_SE_HACE.arreglarLoRoto({ salida: { appendLine() {} } });
    assert.equal(hecho.ok, true, hecho.detalle);
    assert.ok(fs.existsSync(path.join(carpeta, '.claude', 'skills', 'unslop')), 'no se ha arreglado lo roto: la prueba no mira nada');
    assert.deepEqual(frenos(), antes.frenos, 'arreglar ha cambiado los frenos');
    assert.deepEqual(enganchados(), antes.enganchados, 'arreglar ha cambiado lo que se engancha');
    return `arreglado, y los mismos frenos: ${antes.frenos.join(', ') || 'ninguno'}`;
  });

  await comprobar('instalar una habilidad desde la barra deja la carpeta en la versión de la barra', async () => {
    // G4, D2 y T062, con el arnés de verdad: «Añadir» usa el de la clase, la pone
    // en disco, y la carpeta sigue en la versión de la clase.
    const carpeta = carpetaConGit('contrato-anadir-');
    vscode.guion.raiz = carpeta;
    const montado = await arrancar.COMO_SE_HACE.montarElArnes({ respuestas: { ...MONTAJE, kind: 'operations', objetivo: 'Organizar el papeleo' } });
    assert.equal(montado.ok, true, montado.detalle);
    const hecho = await rscM.anadir('bookkeeping');
    assert.equal(hecho.ok, true, 'no se añade');
    assert.ok(fs.existsSync(path.join(carpeta, '.claude', 'skills', 'bookkeeping', 'SKILL.md')), 'y no está en disco');
    const d = JSON.parse(fs.readFileSync(path.join(carpeta, '.rsc.json'), 'utf8'));
    assert.equal(d.catalogVersion, rscM.VERSION_DE_RESPALDO, `la carpeta pasa a la ${d.catalogVersion}`);
    return `bookkeeping, y la ${d.catalogVersion}`;
  });

  vscode.guion.raiz = null;
  console.log(`\n${pasadas} comprobaciones pasadas${process.exitCode ? ' — y alguna ha fallado' : ''}`);
  terminada = true;
}

// Como en `humo.js` (decisión 132): si una prueba se queda esperando algo que
// no llega, Node sale con 0 a medias y sin decir nada. Una batería que no llega
// al final ha fallado.
let terminada = false;
process.on('exit', () => {
  if (terminada) return;
  console.error(`\n  ✗ la batería se ha parado a medias, después de ${pasadas} comprobaciones: una prueba se ha quedado esperando algo que no llega`);
  process.exitCode = 1;
});

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => {
    for (const carpeta of temporales) fs.rmSync(carpeta, { recursive: true, force: true });
  });
