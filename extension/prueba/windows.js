// Lo que solo se puede probar en Windows.
//
//   node extension/prueba/windows.js
//
// Corre en la máquina Windows de GitHub (`.github/workflows/windows.yml`), que
// para un repositorio público no cuesta nada. En cualquier otro sistema sale
// sin hacer nada: lo de aquí son justo las preguntas que un Mac no responde.
//
//   · el relevo de Node (C2) en Git Bash, que es con lo que Claude Code corre
//     los enganches en Windows, y en PowerShell y cmd;
//   · el freno de los raíles, enganchado como lo deja `aplicar.js` y pasado por
//     Git Bash, que deniega un `rm -rf` con el relevo como único `node`;
//   · qué Python elige la barra para los guiones de una herramienta (F4): `py
//     -3` primero, porque `python` puede ser el atajo que abre la Tienda;
//   · que un git recién puesto se encuentra por su sitio, sin estar en el PATH
//     de la barra, y que RSC lo encuentra por su nombre (decisión 165).

const assert = require('node:assert');
const cp = require('node:child_process');
const fs = require('node:fs');
const Module = require('node:module');
const os = require('node:os');
const path = require('node:path');

if (process.platform !== 'win32') {
  console.log('SALTADA: esto es lo que solo se puede probar en Windows.');
  process.exit(0);
}

const RAIZ = path.join(__dirname, '..');
const resolver = Module._resolveFilename;
Module._resolveFilename = function (pedido, ...resto) {
  if (pedido === 'vscode') return require.resolve('./vscode-falso.js');
  return resolver.call(this, pedido, ...resto);
};
const cargar = (m) => require(path.join(RAIZ, 'src', m));

const fallos = [];
async function comprobar(que, hacer) {
  try {
    const nota = await hacer();
    console.log(`  ✓ ${que}${nota ? ` — ${nota}` : ''}`);
  } catch (error) {
    fallos.push(que);
    console.log(`  ✗ ${que}\n    ${String(error && error.message).split('\n').join('\n    ')}`);
  }
}

// Un PATH sin ningún `node` de verdad, con el relevo delante: el ordenador de un
// alumno que solo instaló la extensión.
const relevo = cargar('relevo');
const entorno = cargar('entorno');
const carpetaDelRelevo = fs.mkdtempSync(path.join(os.tmpdir(), 'relevo-'));
relevo.escribirElRelevo(carpetaDelRelevo, process.execPath, 'win32');
const clavePath = Object.keys(process.env).find((k) => k.toLowerCase() === 'path') || 'Path';
const tieneNode = (dir) => ['node.exe', 'node.cmd', 'node'].some((n) => fs.existsSync(path.join(dir, n)));
const sinNode = String(process.env[clavePath] || '').split(path.delimiter).filter((d) => d && !tieneNode(d));
const conRelevo = { ...process.env, [clavePath]: [carpetaDelRelevo, ...sinNode].join(path.delimiter) };
const mismo = (a, b) => path.resolve(String(a).trim()).toLowerCase() === path.resolve(String(b).trim()).toLowerCase();

(async () => {
  console.log('\nLo que solo se puede probar en Windows\n');

  await comprobar('fuera del relevo no queda ningún node', () => {
    const r = cp.spawnSync('where', ['node'], { env: { ...process.env, [clavePath]: sinNode.join(path.delimiter) }, encoding: 'utf8' });
    assert.notEqual(r.status, 0, `sigue habiendo un node: ${r.stdout.trim()}`);
    return `${sinNode.length} carpetas en el PATH, ninguna con node`;
  });

  const bash = entorno.bash();
  await comprobar('la barra encuentra Git Bash', () => {
    assert.ok(bash && fs.existsSync(bash), `no hay bash donde lo busca la barra: ${bash}`);
    return bash;
  });

  await comprobar('el relevo, en Git Bash: command -v node es el relevo y lanza el Node de la barra', () => {
    const r = cp.spawnSync(bash, ['-c', 'command -v node; node -p process.execPath'], { env: conRelevo, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const [donde, cual] = r.stdout.trim().split(/\r?\n/);
    assert.match(donde, /relevo-/, `Git Bash encuentra otro node: ${donde}`);
    assert.ok(mismo(cual, process.execPath), `el relevo lanza otro Node: ${cual}`);
    return donde;
  });

  await comprobar('el relevo, en PowerShell', () => {
    const r = cp.spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'node -p process.execPath'], { env: conRelevo, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.ok(mismo(r.stdout, process.execPath), `PowerShell lanza otro Node: ${r.stdout.trim()}`);
    return 'node.cmd';
  });

  await comprobar('el relevo, en cmd', () => {
    const r = cp.spawnSync('cmd.exe', ['/d', '/s', '/c', 'node -p process.execPath'], { env: conRelevo, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.ok(mismo(r.stdout, process.execPath), `cmd lanza otro Node: ${r.stdout.trim()}`);
    return 'node.cmd';
  });

  await comprobar('el freno de los raíles deniega un rm -rf en Git Bash, con el relevo', () => {
    const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'freno-'));
    fs.mkdirSync(path.join(carpeta, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(carpeta, '.rsc.json'), JSON.stringify({ version: 1, targets: ['claude'] }));
    fs.writeFileSync(path.join(carpeta, '.claude', 'settings.json'), '{}\n');
    const puestos = cp.spawnSync(process.execPath, [path.join(RAIZ, 'media', 'railes', 'aplicar.js'), carpeta], { encoding: 'utf8' });
    assert.equal(puestos.status, 0, puestos.stderr);
    const ajustes = JSON.parse(fs.readFileSync(path.join(carpeta, '.claude', 'settings.json'), 'utf8'));
    const freno = (ajustes.hooks.PreToolUse || []).flatMap((e) => e.hooks || []).map((h) => h.command).find((o) => o.includes('/executive-lab/freno.mjs'));
    assert.ok(freno, 'los raíles no enganchan el freno');
    // Como lo corre Claude Code en Windows: Git Bash, y la carpeta en
    // CLAUDE_PROJECT_DIR con su ruta de Windows.
    const pasar = (orden) => cp.spawnSync(bash, ['-c', freno], {
      input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: orden } }),
      encoding: 'utf8',
      env: { ...conRelevo, CLAUDE_PROJECT_DIR: carpeta },
    });
    const peligrosa = pasar('rm -rf ./informes');
    assert.equal(peligrosa.status, 0, peligrosa.stderr);
    assert.match(peligrosa.stdout, /"permissionDecision":\s*"deny"/, `deja pasar un rm -rf: ${peligrosa.stdout}${peligrosa.stderr}`);
    assert.doesNotMatch(pasar('ls -la').stdout, /"deny"/, 'y frena también lo que no es peligroso');
    return 'deniega, y deja pasar lo demás';
  });

  await comprobar('el relevo se reconoce aunque la unidad llegue en otra caja', () => {
    // El almacén de la extensión llega a veces con la unidad en minúscula (`c:\\…`)
    // y otras en mayúscula. En Windows las rutas no distinguen: comparadas a pelo,
    // el relevo no se reconocía a sí mismo y la barra decía que ya había un node
    // (lo cazó la barra en un VS Code de Windows, 28-09-2026).
    const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'relevo-caja-'));
    relevo.escribirElRelevo(carpeta, process.execPath, 'win32');
    const otraCaja = carpeta.replace(/^([a-zA-Z]):/, (_, u) => `${u === u.toUpperCase() ? u.toLowerCase() : u.toUpperCase()}:`);
    const env = { [clavePath]: [otraCaja, ...sinNode].join(path.delimiter) };
    const puesto = relevo.asegurar({ carpeta, ejecutable: process.execPath, env, plataforma: 'win32' });
    assert.equal(puesto.modo, 'relevoVSCode', `toma su propio relevo por un node del sistema: ${JSON.stringify(puesto)}`);
    const veces = env[clavePath].split(path.delimiter).filter((d) => d.toLowerCase() === carpeta.toLowerCase()).length;
    assert.equal(veces, 1, `el relevo sale ${veces} veces en el PATH`);
    return `${otraCaja.slice(0, 2)} y ${carpeta.slice(0, 2)}, la misma carpeta`;
  });

  await comprobar('un git recién puesto se encuentra por su sitio, y RSC lo encuentra por su nombre', async () => {
    // El PATH de la barra es el de cuando se abrió el editor. Un git que se pone
    // con la barra abierta no está en él, y la carpeta no se montaría sola. Se
    // finge quitando del PATH toda carpeta con un git.exe (decisión 165).
    const donde = entorno.git();
    assert.ok(path.isAbsolute(donde) && fs.existsSync(donde), `la barra busca git por su nombre: ${donde}`);
    const sinGit = String(process.env[clavePath] || '').split(path.delimiter).filter((d) => d && !fs.existsSync(path.join(d, 'git.exe')));
    const r0 = cp.spawnSync('git', ['--version'], { env: { ...process.env, [clavePath]: sinGit.join(path.delimiter) }, encoding: 'utf8' });
    assert.notEqual(r0.status, 0, 'la prueba no ha quitado git del PATH');
    const conHerramientas = entorno.entornoConHerramientas({ ...process.env, [clavePath]: sinGit.join(path.delimiter) });
    const r = cp.spawnSync('git', ['--version'], { env: conHerramientas, encoding: 'utf8' });
    assert.equal(r.status, 0, `RSC no encontraría git por su nombre: ${r.stderr || (r.error && r.error.message)}`);
    assert.equal(await cargar('git').hay(), true, 'la barra dice que no hay git');
    return donde;
  });

  // Los avisos del sistema (decisión 162), sin lanzar ninguno: en esta máquina
  // nadie los vería, y una prueba no enseña avisos de verdad.
  await comprobar('el enganche de los avisos corre en Git Bash con el relevo, y sale con 0', () => {
    const al = cargar('ajustes-locales');
    const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'avisos-'));
    fs.mkdirSync(path.join(carpeta, ...al.AVISAR.slice(0, -1)), { recursive: true });
    fs.copyFileSync(path.join(RAIZ, 'media', 'railes', 'executive-lab', 'avisar.mjs'), path.join(carpeta, ...al.AVISAR));
    // Un tipo que no avisa: si sale con 0, el relevo ha encontrado node y el guion ha corrido.
    const hecho = cp.spawnSync(bash, ['-c', al.ORDEN_DE_AVISAR], {
      input: JSON.stringify({ hook_event_name: 'Notification', notification_type: 'auth_success' }),
      encoding: 'utf8',
      env: { ...conRelevo, CLAUDE_PROJECT_DIR: carpeta },
      timeout: 30000,
    });
    assert.equal(hecho.status, 0, `${hecho.stdout}${hecho.stderr}`);
    return 'node del relevo, guion encontrado';
  });

  await comprobar('el guion de los avisos lo entiende PowerShell 5.1, sin correrlo', async () => {
    const { pathToFileURL } = require('node:url');
    const { GUION_DE_WINDOWS } = await import(pathToFileURL(path.join(RAIZ, 'media', 'railes', 'executive-lab', 'avisar.mjs')).href);
    const leer = `$e = $null; [void][System.Management.Automation.Language.Parser]::ParseInput($env:EL_GUION, [ref]$null, [ref]$e); if ($e.Length) { $e | ForEach-Object { $_.Message }; exit 1 }; 'bien'`;
    const hecho = cp.spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', leer], {
      env: { ...process.env, EL_GUION: GUION_DE_WINDOWS }, encoding: 'utf8', timeout: 60000,
    });
    assert.equal(hecho.status, 0, `${hecho.stdout}${hecho.stderr}`);
    assert.match(hecho.stdout, /bien/);
    return 'sin errores al leerlo';
  });

  await comprobar('para los guiones en Python, la barra elige py -3', async () => {
    const conexiones = cargar('conexiones');
    const elegido = await conexiones.quePython();
    assert.ok(elegido, 'no encuentra ningún Python, y en esta máquina hay');
    assert.deepEqual([elegido.programa, ...elegido.antes], ['py', '-3'], `elige ${elegido.programa} ${elegido.antes.join(' ')}`);
    const r = cp.spawnSync(elegido.programa, [...elegido.antes, '-c', 'import sys; print(sys.version_info[0])'], { encoding: 'utf8' });
    assert.equal(r.stdout.trim(), '3');
    return 'py -3';
  });

  // Decisión 189: lo de rutas y saltos de línea, con el disco y el git de Windows.
  await comprobar('rutas de verdad: con otras mayúsculas es el mismo sitio, y la marca se reconoce con «\\»', () => {
    const { estaDentro, mismoSitio, sitioReal } = cargar('rutas');
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'Rutas-'));
    const hija = path.join(base, 'Wiki', 'Brand');
    fs.mkdirSync(hija, { recursive: true });
    const enMinusculas = path.join(base.toLowerCase(), 'wiki', 'brand', 'logo.png');
    assert.ok(path.sep === '\\', 'esto no es Windows');
    assert.equal(estaDentro(base, enMinusculas), true, 'la misma carpeta, en minúsculas, no está dentro');
    assert.equal(mismoSitio(base, base.toUpperCase()), true);
    assert.equal(estaDentro(base, `${base}-otra\\a.md`), false, 'una hermana que empieza igual');
    // El sitio real trae las mayúsculas que tiene en el disco, escriban como escriban.
    const real = sitioReal(path.join(base.toLowerCase(), 'wiki', 'brand'));
    assert.ok(real.endsWith(path.join('Wiki', 'Brand')), `el sitio real no trae las mayúsculas del disco: ${real}`);
    // Y la marca, con una ruta como la que da VS Code en Windows.
    assert.equal(cargar('marca').esDeLaMarca(path.join(base, '02-DOCS', 'wiki', 'brand', 'logo.png')), true);
    return 'mayúsculas, hermana y «\\»';
  });

  await comprobar('el historial dice «no he podido mirar» y no «sin cambios» (git de Windows)', async () => {
    const historialM = require(path.join(RAIZ, '..', 'instalador', 'comun', 'historial.js'));
    const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'cambios-'));
    assert.equal(await historialM.cuantosCambios(path.join(carpeta, 'no-existe')), null);
    const git = (...a) => cp.spawnSync('git', ['-C', carpeta, ...a], { encoding: 'utf8' });
    assert.equal(git('init', '-q').status, 0);
    assert.equal(await historialM.cuantosCambios(carpeta), 0, 'una carpeta limpia son 0');
    fs.writeFileSync(path.join(carpeta, 'a.txt'), 'uno\r\ndos\r\n');
    assert.equal(await historialM.cuantosCambios(carpeta), 1, 'un fichero nuevo es 1');
    return 'null, 0 y 1';
  });

  await comprobar('un perfil guardado con «\\r\\n» se lee entero y se reescribe con «\\r\\n»', () => {
    const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'perfil-'));
    const perfil = path.join(carpeta, '02-DOCS', 'wiki', 'harness', 'user-profile.md');
    fs.mkdirSync(path.dirname(perfil), { recursive: true });
    fs.writeFileSync(perfil, '---\r\nempresa: Soler\r\n---\r\n\r\n# Perfil\r\n\r\n## Goals\r\n- Facturar sin errores\r\n- Cobrar antes\r\n');
    const vscode = require('./vscode-falso.js');
    const antes = vscode.guion.raiz;
    try {
      vscode.guion.raiz = carpeta;
      assert.deepEqual(cargar('ajustes').comoEstamos().metas, ['Facturar sin errores', 'Cobrar antes']);
      assert.ok(cargar('trato').ponerPalabras('technical').ok);
      const escrito = fs.readFileSync(perfil, 'utf8');
      assert.ok(!/(^|[^\r])\n/.test(escrito), `se ha mezclado con «\\n»: ${JSON.stringify(escrito)}`);
      return 'lista entera, salto igual';
    } finally {
      vscode.guion.raiz = antes;
    }
  });

  console.log(`\n${fallos.length ? `${fallos.length} fallos` : 'todo bien'}\n`);
  process.exit(fallos.length ? 1 : 0);
})();
