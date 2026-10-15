// Un panel falso que además deja pulsar: lee los data-accion de lo pintado,
// guarda los manejadores de clic y deja escribir en la caja y en el título.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const deshacer = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// `lienzo`: lo que devuelve `createElement('canvas')`, para probar la foto del
// cerebro (decisión 151). Sin él, no hay lienzo, como en este navegador de mentira.
function montarPanelConClics(fichero = path.join(__dirname, '..', 'media', 'panel.js'), { lienzo = null } = {}) {
  const oyentes = {};
  const enviados = [];
  let pintado = '';
  let clics = [];
  let teclas = [];
  let escrito = {};

  const campo = (selector) => {
    if (selector === 'textarea[data-aviso]') {
      const m = pintado.match(/<textarea([^>]*\bdata-aviso(?=[\s>])[^>]*)>([\s\S]*?)<\/textarea>/);
      if (!m) return null;
      return {
        get value() { return selector in escrito ? escrito[selector] : deshacer(m[2]); },
        hasAttribute: (a) => new RegExp(`(^|\\s)${a}(?=[\\s=>]|$)`).test(m[1]),
        focus() {},
      };
    }
    if (selector === 'input[data-aviso-titulo]') {
      const m = pintado.match(/<input([^>]*\bdata-aviso-titulo\b[^>]*)>/);
      if (!m) return null;
      const valor = (m[1].match(/value="([^"]*)"/) || [])[1] || '';
      return { get value() { return selector in escrito ? escrito[selector] : deshacer(valor); } };
    }
    return null;
  };
  const otro = () => ({ set innerHTML(v) {}, addEventListener() {}, querySelectorAll: () => [], querySelector: () => null, classList: { add() {}, remove() {} }, dataset: {}, focus() {} });
  const app = {
    set innerHTML(v) { pintado = v; clics = []; teclas = []; escrito = {}; },
    get innerHTML() { return pintado; },
    addEventListener() {},
    // Cada elemento con `data-accion`, con sus atributos (para `role`) y lo que
    // escucha: el clic y, en lo que hace de botón, la tecla.
    querySelectorAll: (sel) => (sel === '[data-accion]'
      ? [...pintado.matchAll(/<[a-zA-Z]+\b([^>]*\bdata-accion="([^"]*)"[^>]*)>/g)].map((m) => ({
        dataset: { accion: deshacer(m[2]) },
        getAttribute: (nombre) => ((m[1].match(new RegExp(`\\s${nombre}="([^"]*)"`)) || [])[1] ?? null),
        addEventListener: (ev, fn) => {
          if (ev === 'click') clics.push({ accion: JSON.parse(deshacer(m[2])), fn });
          if (ev === 'keydown') teclas.push({ accion: JSON.parse(deshacer(m[2])), fn });
        },
        closest: () => otro(),
      }))
      : []),
    querySelector: campo,
    classList: { add() {}, remove() {} },
    dataset: {},
    focus() {},
  };
  const contexto = {
    acquireVsCodeApi: () => ({ postMessage: (m) => enviados.push(m), getState: () => undefined, setState() {} }),
    document: {
      getElementById: (id) => (id === 'app' ? app : otro()),
      createElement: (que) => (que === 'canvas' && lienzo ? lienzo() : otro()),
      addEventListener(que, fn) { oyentes[que] = fn; },
      querySelector: () => null,
      querySelectorAll: () => [],
      scrollingElement: { scrollTop: 0 },
      body: { classList: { add() {}, remove() {} } },
    },
    window: { addEventListener(que, fn) { oyentes[que] = fn; } },
    FileReader: class { readAsDataURL() {} },
    setInterval: () => 0,
    clearInterval() {},
    setTimeout: () => 0,
    console,
  };
  contexto.globalThis = contexto;
  vm.createContext(contexto);
  vm.runInContext(fs.readFileSync(fichero, 'utf8'), contexto, { filename: 'panel.js' });
  return {
    mandar(mensaje) { oyentes.message({ data: mensaje }); return pintado; },
    escribir(selector, valor) { escrito[selector] = valor; },
    pulsar(tipo) {
      const b = clics.find((c) => c.accion.tipo === tipo);
      if (!b) throw new Error(`no hay botón ${tipo}`);
      b.fn();
    },
    // Una tecla sobre lo que hace de botón: devuelve si se dejó de hacer lo de siempre.
    teclear(tipo, tecla) {
      const b = teclas.find((c) => c.accion.tipo === tipo);
      if (!b) throw new Error(`nada que se pulse con el teclado: ${tipo}`);
      let parado = false;
      b.fn({ key: tecla, preventDefault() { parado = true; } });
      return parado;
    },
    enviados,
  };
}

module.exports = { montarPanelConClics };
