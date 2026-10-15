// Regresiones del mapa Codex: el fichero leído, lo mostrado y lo invocado
// deben corresponder. Solo usa empresas temporales, nunca la cuenta de Codex.
const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const Module = require('node:module');
const resolver = Module._resolveFilename;
Module._resolveFilename = function (pedido, ...resto) {
  return pedido === 'vscode' ? require.resolve('./vscode-falso') : resolver.call(this, pedido, ...resto);
};
const vscode = require('./vscode-falso');
const extension = path.resolve(__dirname, '..');
const cargar = (nombre) => require(path.join(extension, 'src', nombre));
let raiz;
const poner = (rel, texto = '') => {
  const fichero = path.join(raiz, rel);
  fs.mkdirSync(path.dirname(fichero), { recursive: true });
  fs.writeFileSync(fichero, texto);
  return fichero;
};
const habilidad = (rel, nombre, boton = '') => poner(`${rel}/SKILL.md`,
  `---\nname: ${nombre}\ndescription: Prepara el resumen de la empresa.\nmetadata:\n  boton: ${boton}\n---\nInstrucciones.\n`);
const declaracion = (extra = {}) => poner('.rsc.json', JSON.stringify({ version: 1, targets: ['codex'], skills: [], ownSkills: [], ...extra }));

beforeEach(() => {
  raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'mapeos-codex-'));
  vscode.guion.raiz = raiz;
  vscode.guion.extensionesInstaladas = ['openai.chatgpt'];
  vscode.guion.comandosDeCodex = ['chatgpt.openSidebar', 'chatgpt.newChat', 'chatgpt.newCodexPanel', 'chatgpt.addToThread'];
  vscode.registrado.ejecutados.length = 0;
  vscode.registrado.mensajes.length = 0;
  cargar('asistentes').saberDondeGuardar(null);
  declaracion();
});
afterEach(() => { fs.rmSync(raiz, { recursive: true, force: true }); });

test('habilidades nativas y de RSC: solo manifiestos, sin mezclar las de Claude', () => {
  habilidad('.codex/rsc/bro', 'bro');
  habilidad('.agents/skills/resumen', 'resumen-semanal', 'Preparar el resumen');
  habilidad('.claude/skills/ajena', 'ajena');
  fs.mkdirSync(path.join(raiz, '.agents/skills/a-medias'), { recursive: true });
  fs.mkdirSync(path.join(raiz, '.codex/rsc/vacia'), { recursive: true });
  fs.mkdirSync(path.join(raiz, '.agents/skills/es-carpeta/SKILL.md'), { recursive: true });
  assert.deepEqual(cargar('rsc').habilidadesEnDisco().sort(), ['bro', 'resumen']);
  const sabe = cargar('saberes').queSabe(extension);
  assert.equal(sabe.instaladas, 2);
  assert.equal(sabe.otras.find((h) => h.id === 'resumen').prompt, '$resumen-semanal');
  assert.equal(cargar('acciones').acciones()[0].prompt, '$resumen-semanal');
  const fijada = cargar('fijadas').candidatos(extension).flatMap((g) => g.cosas).find((c) => c.id === 'habilidad:resumen');
  assert.equal(fijada.accion.prompt, '$resumen-semanal');
  assert.match(cargar('saberes').comoSePide('bro'), /Usa la habilidad «bro»/);
});

test('con dos copias de una habilidad, la ficha lee la misma que invoca el botón', () => {
  habilidad('.codex/rsc/resumen', 'resumen', 'La del arnés');
  const nativa = habilidad('.agents/skills/resumen', 'resumen-local', 'Mi resumen');
  assert.equal(cargar('donde').ficheroDeLaHabilidad('resumen'), nativa);
  const ficha = cargar('saberes').queSabe(extension).otras.find((h) => h.id === 'resumen');
  assert.equal(ficha.nombre, 'Mi resumen');
  assert.equal(ficha.prompt, '$resumen-local');
  assert.deepEqual(cargar('rsc').habilidadesEnDisco(), ['resumen']);
  habilidad('.codex/rsc/bookkeeping', 'bookkeeping', 'La del catálogo');
  habilidad('.agents/skills/bookkeeping', 'mi-contabilidad', 'Mi contabilidad');
  const delCatalogo = cargar('saberes').queSabe(extension).sabe.find((h) => h.id === 'bookkeeping');
  assert.equal(delCatalogo.nombre, 'Mi contabilidad');
  assert.equal(delCatalogo.prompt, '$mi-contabilidad');
});

test('la descripción YAML de varias líneas llega entera a la ficha de la habilidad', () => {
  poner('.agents/skills/informe/SKILL.md', '---\nname: informe\ndescription: >-\n  Prepara el informe\n  de la empresa.\nmetadata:\n  boton: "Revisar \\"cobros\\""\n---\n');
  const [ficha] = cargar('saberes').queSabe(extension).otras;
  assert.equal(ficha.frase, 'Prepara el informe de la empresa.');
  assert.equal(ficha.nombre, 'Revisar "cobros"');
  assert.equal(ficha.prompt, '$informe');
});

test('una habilidad nativa no oculta que falta la copia declarada por RSC', async () => {
  declaracion({ skills: ['bookkeeping'] });
  habilidad('.agents/skills/bookkeeping', 'mi-contabilidad');
  fs.mkdirSync(path.join(raiz, '.rsc'));
  const terreno = cargar('terreno').mirarYClasificar();
  assert.deepEqual(terreno.habilidades.colgando, ['bookkeeping']);
  assert.equal(terreno.clonado, true);
  const rsc = cargar('rsc');
  const correr = rsc.correr;
  try {
    rsc.correr = async () => ({ codigo: 0 });
    assert.equal((await rsc.anadir('bookkeeping')).ok, false);
    habilidad('.codex/rsc/bookkeeping', 'bookkeeping');
    assert.equal((await rsc.anadir('bookkeeping')).ok, true);
    rsc.correr = async () => ({ codigo: 1 });
    assert.equal((await rsc.anadir('bookkeeping')).ok, false);
  } finally { rsc.correr = correr; }
});

test('añadir con los dos asistentes exige una copia para cada uno', async () => {
  declaracion({ targets: ['claude', 'codex'] });
  habilidad('.codex/rsc/bookkeeping', 'bookkeeping');
  const rsc = cargar('rsc');
  const correr = rsc.correr;
  try {
    rsc.correr = async () => ({ codigo: 0 });
    assert.equal((await rsc.anadir('bookkeeping')).ok, false);
    habilidad('.claude/skills/bookkeeping', 'bookkeeping');
    assert.equal((await rsc.anadir('bookkeeping')).ok, true);
  } finally { rsc.correr = correr; }
});

test('agentes TOML: nombre declarado, comillas, comentarios y descripción de varias líneas', () => {
  poner('.codex/agents/plazos.toml', `name = 'vigilar_plazos' # su identidad\ndescription = """\nRevisa los plazos\nde los contratos.\n"""\ndeveloper_instructions = '''\nname = "no-es-el-nombre"\n'''\n[otra]\nname = "tampoco"\n`);
  poner('.codex/agents/ajeno.md', '---\nname: ajeno\n---');
  const [agente] = cargar('agentes').queHay();
  assert.equal(cargar('agentes').queHay().length, 1);
  assert.equal(agente.id, 'plazos');
  assert.equal(agente.fichero, 'plazos.toml');
  assert.match(agente.queHace, /Revisa los plazos\nde los contratos/);
  assert.match(agente.prompt, /«vigilar_plazos»/);
  assert.equal(cargar('agentes').dondeVive(agente.fichero), path.join(raiz, '.codex/agents/plazos.toml'));
  const campos = cargar('toml-campos').leer('name = "revisor"\ndescription = "Revisa \\u00e1reas y \\"avisos\\"." # comentario\n');
  assert.equal(campos.description, 'Revisa áreas y "avisos".');
});

test('los choques de agentes conservan TOML, sus instrucciones y un nombre libre', () => {
  const texto = 'name = \'revisor\' # identidad\ndescription = "Revisa los contratos"\ndeveloper_instructions = """\nname = "no tocar"\n"""\n';
  poner('.codex/agents/revisor.toml', texto);
  poner('.codex/agents/revisor-propio.toml', 'ocupado');
  const ajena = cargar('ajena');
  const { choques } = ajena.resumen({ gestionados: ['.codex/agents/revisor.toml'] }, raiz);
  assert.equal(choques.length, 1);
  assert.equal(choques[0].sugerido, 'revisor-propio-2');
  const resultado = ajena.resolver(choques, { '.codex/agents/revisor.toml': 'renombrar' }, raiz);
  assert.equal(resultado.ok, true);
  const renombrado = fs.readFileSync(path.join(raiz, '.codex/agents/revisor-propio-2.toml'), 'utf8');
  assert.equal(renombrado, texto.replace("'revisor'", '"revisor-propio-2"'));
  assert.equal(fs.existsSync(path.join(raiz, '.codex/agents/revisor-propio-2.md')), false);
});

test('un agente ilegible no se mueve a medias al resolver un choque', () => {
  const origen = poner('.codex/agents/roto.toml', 'name = ["no es una cadena"]\n');
  const ajena = cargar('ajena');
  const { choques } = ajena.resumen({ gestionados: ['.codex/agents/roto.toml'] }, raiz);
  assert.equal(ajena.resolver(choques, { '.codex/agents/roto.toml': 'renombrar' }, raiz).ok, false);
  assert.equal(fs.existsSync(origen), true);
});

test('las reglas no rellenan Codex con las de Claude', () => {
  poner('CLAUDE.md', '## Working rules\n- Esta regla es solo para Claude.\n');
  assert.deepEqual(cargar('reglas').queHay().deLaCasa, []);
  poner('AGENTS.md', '# Normas\n- Las facturas se revisan antes de enviar.\n');
  assert.deepEqual(cargar('reglas').queHay().deLaCasa, ['Las facturas se revisan antes de enviar.']);
});

test('AGENTS.override.md manda en la ficha y al abrir las reglas, salvo si está vacío', () => {
  poner('AGENTS.md', '## Working rules\n- La regla habitual de esta empresa.\n');
  const override = poner('AGENTS.override.md', '# Excepción\n- La regla de esta entrega.\n');
  assert.deepEqual(cargar('reglas').queHay().deLaCasa, ['La regla de esta entrega.']);
  assert.equal(cargar('reglas').dondeVive('otros'), override);
  fs.writeFileSync(override, ' \n');
  assert.deepEqual(cargar('reglas').queHay().deLaCasa, ['La regla habitual de esta empresa.']);
  assert.equal(cargar('reglas').dondeVive('otros'), path.join(raiz, 'AGENTS.md'));
});

test('los raíles respetan el override de otra persona y se apuntan allí con su sí', () => {
  const texto = '# Normas\n- Se revisa todo antes de enviarlo.\n';
  const override = poner('AGENTS.override.md', texto);
  const aplicar = (...flags) => {
    const resultado = cp.spawnSync(process.execPath, [path.join(extension, 'media/railes/aplicar.js'), raiz, '--ajena', ...flags], { encoding: 'utf8' });
    assert.equal(resultado.status, 0, resultado.stderr);
  };
  aplicar();
  assert.equal(fs.readFileSync(override, 'utf8'), texto);
  assert.ok(cargar('terreno').loQueFaltaPorPoner().includes('Cómo se trabaja aquí'));
  const tocados = cargar('ajena').resumen({ gestionados: ['.codex/rsc/bro'] }, raiz).tocados;
  assert.ok(tocados.some((t) => t.fichero === 'AGENTS.override.md'));
  aplicar('--poner-bloque');
  const despues = fs.readFileSync(override, 'utf8');
  assert.ok(despues.startsWith(texto));
  assert.match(despues, /\.codex\/rsc\/executive-lab\/siempre\.md/);
  assert.equal(fs.existsSync(path.join(raiz, 'AGENTS.md')), false);
  assert.ok(!cargar('terreno').loQueFaltaPorPoner().includes('Cómo se trabaja aquí'));
});

test('Codex recibe el texto entero por el portapapeles y el atajo de cada sistema', async () => {
  const puente = cargar('puente');
  for (const [plataforma, atajo] of [['darwin', 'Cmd+V'], ['win32', 'Ctrl+V'], ['linux', 'Ctrl+V']]) {
    const texto = 'Prepara el informe con sus tildes.\n'.repeat(300);
    assert.equal(await puente.enviar(texto, null, { plataforma }), 'copiado');
    assert.equal(vscode.registrado.portapapeles, texto);
    assert.ok(vscode.registrado.mensajes.at(-1).includes(atajo));
  }
  assert.ok(vscode.registrado.ejecutados.every((e) => e.id === 'chatgpt.openSidebar'));
});

test('los raíles no escriben a través de un override enlazado', { skip: process.platform === 'win32' }, () => {
  const fuera = fs.mkdtempSync(path.join(os.tmpdir(), 'override-de-otra-empresa-'));
  const fichero = path.join(fuera, 'reglas.md');
  try {
    fs.writeFileSync(fichero, '# Mis reglas\n');
    fs.symlinkSync(fichero, path.join(raiz, 'AGENTS.override.md'));
    const resultado = cp.spawnSync(process.execPath, [path.join(extension, 'media/railes/aplicar.js'), raiz, '--ajena', '--poner-bloque'], { encoding: 'utf8' });
    assert.equal(resultado.status, 0, resultado.stderr);
    assert.equal(fs.readFileSync(fichero, 'utf8'), '# Mis reglas\n');
    assert.match(resultado.stdout, /no escribo a través/);
  } finally { fs.rmSync(fuera, { recursive: true, force: true }); }
});

test('conversación nueva usa los comandos reales de Codex y prueba el repuesto si falla', async () => {
  const puente = cargar('puente');
  assert.equal(await puente.conversacionNueva(), true);
  assert.deepEqual(vscode.registrado.ejecutados.map((e) => e.id), ['chatgpt.newChat']);
  const ejecutar = vscode.commands.executeCommand;
  try {
    vscode.commands.executeCommand = async (id, ...args) => {
      if (id === 'chatgpt.newChat') throw new Error('no está disponible');
      return ejecutar(id, ...args);
    };
    assert.equal(await puente.conversacionNueva(), true);
    assert.equal(vscode.registrado.ejecutados.at(-1).id, 'chatgpt.newCodexPanel');
    vscode.guion.comandosDeCodex = [];
    assert.equal(await puente.conversacionNueva(), false);
  } finally { vscode.commands.executeCommand = ejecutar; }
});
