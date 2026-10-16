// Las conexiones MCP que ya tiene cada asistente (decisión 175). Solo lectura (P9).
//
// Mucha gente conecta herramientas pidiéndoselo al asistente, sin pasar por la
// barra: Claude las apunta en `.mcp.json` (de la carpeta) o en su `.claude.json`
// (tuyas, para esta carpeta o para todas), y Codex en `[mcp_servers.<nombre>]` de
// `.codex/config.toml` (de la carpeta) o del `config.toml` de tu usuario. De cada
// una, la barra sabe solo: cómo se llama, de qué asistente es, de dónde sale y si
// es un programa del ordenador o una dirección web. NUNCA un valor: ni una
// variable de entorno, ni una cabecera, ni un argumento, ni la dirección ni la
// orden. Esos campos no se guardan en ninguna variable que salga de aquí.
//
// Con cuidado, porque son ficheros suyos:
//   · sin seguir enlaces (ni el fichero ni la carpeta `.codex`);
//   · con un tope de tamaño; pasado el tope, ese fichero no se lee;
//   · si el JSON o el TOML no se entiende, no se enseña nada de ese fichero:
//     no se adivina.
//
// Para TOML no sirve `retirados.leerElToml` ni `toml-campos`: el primero rechaza
// el fichero entero ante una tabla en línea (`env = { A = "b" }`, que es lo normal
// aquí) y el segundo se para en la primera tabla.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TOPE_DE_UNA_CONFIGURACION = 256 * 1024; // .mcp.json y config.toml
const TOPE_DE_CLAUDE_JSON = 32 * 1024 * 1024; // el de Claude guarda también el historial de cada carpeta; con mucho pasa de 8 MB (se lee solo al abrir Conexiones)
const LINEA_MAS_LARGA = 2000;
const MAS_SERVIDORES_QUE_ESTOS = 100; // por fichero; más no es una lista de verdad
const NOMBRE_MAS_LARGO = 60;

const ASISTENTES = { claude: 'Claude', codex: 'Codex' };
const TIPOS_WEB = new Set(['http', 'sse', 'ws', 'streamable-http']);

const esEnlace = (ruta) => { try { return fs.lstatSync(ruta).isSymbolicLink(); } catch { return false; } };

// Qué no se pudo leer (un enlace, uno que se pasa del tope, uno que falla al abrirse): se dice, no se calla.
const NO_SE_PUDO = Symbol('no se pudo leer');

// El texto de un fichero normal; null si no hay; NO_SE_PUDO si hay y no se lee.
function leerSinEnlaces(ruta, tope, { carpetas = [] } = {}) {
  try {
    if (carpetas.some(esEnlace) || esEnlace(ruta)) return NO_SE_PUDO;
    const stat = fs.lstatSync(ruta);
    if (!stat.isFile() || stat.size > tope) return NO_SE_PUDO;
    return fs.readFileSync(ruta, 'utf8');
  } catch (error) {
    return error && error.code === 'ENOENT' ? null : NO_SE_PUDO;
  }
}

// El nombre tal cual lo puso la persona, sin nada raro: es lo único que sale del fichero, aparte del tipo.
function limpiarElNombre(nombre) {
  if (typeof nombre !== 'string') return null;
  const limpio = nombre.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, '').trim();
  return limpio && limpio.length <= NOMBRE_MAS_LARGO ? limpio : null;
}

const propio = (objeto, clave) => Object.prototype.hasOwnProperty.call(objeto, clave);
const esUnObjeto = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

// ---------------------------------------------------------------- Claude

// Un servidor de Claude: qué tipo es, o null si no se sabe. Una entrada con `url`
// y sin `type` Claude misma la salta con un error, y una `sdk` solo la registra
// un programa que la usa; ninguna de las dos es una conexión que se vea.
function tipoDeClaude(entrada) {
  if (!esUnObjeto(entrada)) return null;
  const tipo = entrada.type;
  if (tipo === undefined || tipo === 'stdio') return typeof entrada.command === 'string' && entrada.command ? 'programa' : null;
  if (typeof tipo === 'string' && TIPOS_WEB.has(tipo)) return typeof entrada.url === 'string' && entrada.url ? 'web' : null;
  return null;
}

function deUnMcpServers(mapa, asistente, origen) {
  if (!esUnObjeto(mapa)) return null;
  const claves = Object.keys(mapa);
  if (claves.length > MAS_SERVIDORES_QUE_ESTOS) return null;
  const fuera = [];
  for (const clave of claves) {
    const nombre = limpiarElNombre(clave);
    const tipo = tipoDeClaude(mapa[clave]);
    if (nombre && tipo) fuera.push({ nombre, asistente, origen, tipo });
  }
  return fuera;
}

function deClaude({ raiz, casa, entorno }) {
  const servidores = [];
  const noSeEntendio = [];
  const ficheroJson = (ruta, tope) => {
    const texto = leerSinEnlaces(ruta, tope);
    if (texto === null) return { hay: false };
    if (texto === NO_SE_PUDO) return { hay: true, datos: undefined };
    try {
      return { hay: true, datos: JSON.parse(texto) };
    } catch {
      return { hay: true, datos: undefined };
    }
  };

  // .mcp.json de la carpeta: { "mcpServers": { nombre: {...} } }
  const delProyecto = ficheroJson(path.join(raiz, '.mcp.json'), TOPE_DE_UNA_CONFIGURACION);
  if (delProyecto.hay) {
    const lista = esUnObjeto(delProyecto.datos) && propio(delProyecto.datos, 'mcpServers')
      ? deUnMcpServers(delProyecto.datos.mcpServers, 'claude', 'carpeta') : null;
    if (lista) servidores.push(...lista);
    else if (!(esUnObjeto(delProyecto.datos) && !propio(delProyecto.datos, 'mcpServers'))) noSeEntendio.push({ asistente: 'claude', origen: 'carpeta' });
  }

  // El de la persona: mcpServers (todas las carpetas) y projects[<ruta>].mcpServers (esta).
  const carpetaDeClaude = entorno.CLAUDE_CONFIG_DIR || casa;
  const delUsuario = ficheroJson(path.join(carpetaDeClaude, '.claude.json'), TOPE_DE_CLAUDE_JSON);
  if (delUsuario.hay) {
    const d = delUsuario.datos;
    if (!esUnObjeto(d)) {
      noSeEntendio.push({ asistente: 'claude', origen: 'usuario' });
    } else {
      if (propio(d, 'mcpServers')) {
        const lista = deUnMcpServers(d.mcpServers, 'claude', 'usuario');
        if (lista) servidores.push(...lista); else noSeEntendio.push({ asistente: 'claude', origen: 'usuario' });
      }
      if (propio(d, 'projects') && esUnObjeto(d.projects) && propio(d.projects, raiz)) {
        const aqui = d.projects[raiz];
        if (esUnObjeto(aqui) && propio(aqui, 'mcpServers')) {
          const lista = deUnMcpServers(aqui.mcpServers, 'claude', 'tuyoAqui');
          if (lista) servidores.push(...lista); else noSeEntendio.push({ asistente: 'claude', origen: 'tuyoAqui' });
        }
      }
    }
  }
  return { servidores, noSeEntendio };
}

// ----------------------------------------------------------------- Codex

// El texto sin lo de dentro de las comillas (y sin el comentario del final), o
// null si una comilla no se cierra.
function sinTextos(linea) {
  let fuera = '';
  let i = 0;
  while (i < linea.length) {
    const c = linea[i];
    if (c === '#') break;
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < linea.length && linea[j] !== c) j += c === '"' && linea[j] === '\\' ? 2 : 1;
      if (j >= linea.length) return null;
      fuera += '""';
      i = j + 1;
    } else {
      fuera += c;
      i += 1;
    }
  }
  return fuera;
}

const cuantos = (texto, a, b) => texto.split(a).length - texto.split(b).length;

// `mcp_servers."mi.servidor".env` -> ['mcp_servers', 'mi.servidor', 'env']; null si no se entiende.
function partesDe(cabecera) {
  const partes = [];
  let i = 0;
  const n = cabecera.length;
  while (i < n) {
    while (cabecera[i] === ' ' || cabecera[i] === '\t') i += 1;
    let parte;
    if (cabecera[i] === '"' || cabecera[i] === "'") {
      const c = cabecera[i];
      const j = cabecera.indexOf(c, i + 1);
      if (j < 0 || (c === '"' && cabecera.slice(i, j).includes('\\'))) return null;
      parte = cabecera.slice(i + 1, j);
      i = j + 1;
    } else {
      const m = /^[A-Za-z0-9_-]+/.exec(cabecera.slice(i));
      if (!m) return null;
      parte = m[0];
      i += parte.length;
    }
    partes.push(parte);
    while (cabecera[i] === ' ' || cabecera[i] === '\t') i += 1;
    if (i >= n) break;
    if (cabecera[i] !== '.') return null;
    i += 1;
  }
  return partes.length ? partes : null;
}

const CABECERA = /^\s*\[([^[\]]*)\]\s*(?:#.*)?$/;
const CLAVE_DE_ARRIBA = /^\s*(?:mcp_servers|"mcp_servers"|'mcp_servers')\s*[.=]/;

// Los servidores de un config.toml de Codex, o null si no se entiende ni una línea.
function servidoresDeToml(texto, origen) {
  if (texto.length > TOPE_DE_UNA_CONFIGURACION || /"""|'''/.test(texto)) return null;
  const lineas = texto.split('\n');
  if (lineas.some((l) => l.length > LINEA_MAS_LARGA)) return null;
  const servidores = new Map(); // nombre -> { tipo, apagado }
  let actual = null; // el servidor de la tabla en que estamos, solo en la tabla exacta
  let enLaDeServidores = false;
  let enUnaLista = 0;
  for (const cruda of lineas) {
    const linea = cruda.replace(/\r$/, '');
    const limpia = sinTextos(linea);
    if (limpia === null) return null;
    if (enUnaLista > 0) {
      enUnaLista += cuantos(limpia, '[', ']');
      if (enUnaLista < 0 || cuantos(limpia, '{', '}') !== 0) return null;
      continue;
    }
    if (!limpia.trim()) continue;
    const cabecera = linea.match(CABECERA);
    if (cabecera) {
      const partes = partesDe(cabecera[1].trim());
      if (!partes) return null;
      actual = null;
      enLaDeServidores = false;
      if (partes[0] === 'mcp_servers') {
        if (partes.length === 1) {
          enLaDeServidores = true;
        } else if (partes.length === 2) {
          const nombre = limpiarElNombre(partes[1]);
          if (servidores.has(partes[1]) || !nombre || servidores.size >= MAS_SERVIDORES_QUE_ESTOS) return null;
          actual = { nombre: partes[1], tipo: null, apagado: false };
          servidores.set(partes[1], actual);
        }
      }
      continue;
    }
    if (/^\s*\[/.test(linea) || cuantos(limpia, '{', '}') !== 0) return null;
    // `mcp_servers.x.command = …` o `mcp_servers = { … }` como clave suelta: no se entiende.
    if (CLAVE_DE_ARRIBA.test(linea) && actual === null) return null;
    // Una tabla `[mcp_servers]` con sus servidores en claves con puntos: tampoco.
    if (enLaDeServidores) return null;
    const abiertos = cuantos(limpia, '[', ']');
    if (abiertos < 0) return null;
    if (abiertos > 0) enUnaLista = abiertos;
    if (actual) {
      // Solo si es un texto (`command = "…"`): no se guarda el valor, se mira que lo sea.
      const clave = linea.match(/^\s*(command|url|enabled)\s*=\s*(\S)/);
      if (clave) {
        if (clave[1] === 'command' && (clave[2] === '"' || clave[2] === "'")) actual.tipo = actual.tipo || 'programa';
        else if (clave[1] === 'url' && (clave[2] === '"' || clave[2] === "'")) actual.tipo = actual.tipo || 'web';
        else if (clave[1] === 'enabled' && /^\s*enabled\s*=\s*false\s*(?:#.*)?$/.test(linea)) actual.apagado = true;
      }
    }
  }
  if (enUnaLista !== 0) return null;
  const fuera = [];
  for (const s of servidores.values()) {
    if (s.tipo && !s.apagado) fuera.push({ nombre: limpiarElNombre(s.nombre), asistente: 'codex', origen, tipo: s.tipo });
  }
  return fuera;
}

function deCodex({ raiz, casa, entorno }) {
  const servidores = [];
  const noSeEntendio = [];
  const aqui = path.join(raiz, '.codex');
  const delaCarpeta = leerSinEnlaces(path.join(aqui, 'config.toml'), TOPE_DE_UNA_CONFIGURACION, { carpetas: [aqui] });
  const delUsuario = leerSinEnlaces(path.join(entorno.CODEX_HOME || path.join(casa, '.codex'), 'config.toml'), TOPE_DE_UNA_CONFIGURACION);
  for (const [texto, origen] of [[delaCarpeta, 'carpeta'], [delUsuario, 'usuario']]) {
    if (texto === null) continue;
    const lista = texto === NO_SE_PUDO ? null : servidoresDeToml(texto, origen);
    if (lista) servidores.push(...lista); else noSeEntendio.push({ asistente: 'codex', origen });
  }
  return { servidores, noSeEntendio };
}

// ------------------------------------------------------------------ todo

// `asistentes`: los ids (`claude`, `codex`) que se usan en esta carpeta.
function leer({ raiz, asistentes = [], casa = os.homedir(), entorno = process.env } = {}) {
  const vacio = { servidores: [], noSeEntendio: [] };
  if (!raiz) return vacio;
  const quien = [...new Set(asistentes)].filter((a) => propio(ASISTENTES, a));
  const partes = quien.map((a) => (a === 'claude' ? deClaude : deCodex)({ raiz, casa, entorno }));
  return {
    servidores: partes.flatMap((p) => p.servidores),
    noSeEntendio: partes.flatMap((p) => p.noSeEntendio),
  };
}

// En una carpeta sin confianza, lo que sale de un fichero de la carpeta (que puede
// venir en un repo clonado) el asistente no lo activa así: se dice que falta aprobarlo.
function conLaConfianza(servidores, confiable) {
  return servidores.map((s) => (!confiable && s.origen === 'carpeta' ? { ...s, sinAprobar: true } : s));
}

const parecido = (texto) => String(texto).toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');

// Si el servidor se llama como una herramienta que la barra ya conoce, se dice
// cuál: la lista no la duplica, la nombra junto a ella. Solo si coincide entero.
// `esSuya`: solo si sale de lo de la persona (su `.claude.json`) se afirma que es
// su conexión; un fichero de la carpeta puede venir en un repo clonado y llamarse
// como cualquiera, así que ahí solo se dice que se llama igual.
function conLasConocidas(servidores, proveedores = []) {
  const conocidas = proveedores.map((p) => ({ clave: [parecido(p.id), parecido(p.etiqueta)], etiqueta: p.etiqueta }));
  return servidores.map((s) => {
    const mia = parecido(s.nombre);
    const hallada = mia ? conocidas.find((c) => c.clave.includes(mia)) : null;
    return hallada ? { ...s, herramienta: hallada.etiqueta, esSuya: s.origen !== 'carpeta' } : s;
  });
}

module.exports = { leer, conLasConocidas, conLaConfianza, servidoresDeToml, ASISTENTES };
