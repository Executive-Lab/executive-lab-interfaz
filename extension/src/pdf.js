// Un PDF de texto, escrito a mano (decisión 159).
//
// La guía para sacar la clave de cada conexión sale en PDF, y la barra no puede
// pedirle a nadie que instale nada ni salir a internet para hacerlo. Un PDF de
// texto es pequeño: un catálogo, las páginas, dos fuentes de las catorce que
// todo lector de PDF trae dentro (Helvetica y Helvetica-Bold), el texto de cada
// página y una tabla con dónde empieza cada cosa. Eso es todo lo que hay aquí.
//
// · **Las letras.** Las dos fuentes van con `WinAnsiEncoding`, la de Windows para
//   el oeste de Europa: caben á é í ó ú ñ ü ¿ ¡ « » € —. Lo que no cabe se cambia
//   por algo que se lee (una flecha por «›», una «ő» por «o») y, si no hay nada
//   parecido, por «?». Nunca rompe el fichero: dentro de un texto del PDF solo van
//   letras de la tabla, y lo de fuera de lo básico, escrito con su número.
// · **Partir las líneas** por el ancho de verdad de cada letra, con la tabla de
//   anchos de Adobe para esas dos fuentes (las mismas que usa cualquier lector).
// · **Varias páginas**, con el pie en cada una, y un título que no se queda solo
//   al final de una página.
// · **Los enlaces**, como anotaciones `/URI`, y solo los que van por https. El
//   texto que se ve es la dirección misma: no se esconde adónde lleva.
//
// Sin `vscode`: es una función pura, y se prueba entera sin abrir el editor.

const crypto = require('node:crypto');

// A4, en puntos, y los márgenes de un documento normal (2 cm).
const ANCHO_PAGINA = 595.28;
const ALTO_PAGINA = 841.89;
const MARGEN = 56;
const ANCHO_UTIL = ANCHO_PAGINA - 2 * MARGEN;
// El pie va debajo del margen, para no comerse el sitio del texto.
const ALTO_DEL_PIE = 28;

// ── WinAnsiEncoding ──────────────────────────────────────────────────────
//
// Del 32 al 126 y del 160 al 255 es lo mismo que Unicode. Del 128 al 159 trae
// lo que le falta al Latin-1: el euro, las comillas curvas, la raya, los puntos
// suspensivos. Los huecos (129, 141, 143, 144, 157) no son nada.
const DEL_128_AL_159 = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6,
  0x89: 0x2030, 0x8a: 0x0160, 0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201c,
  0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a,
  0x9c: 0x0153, 0x9e: 0x017e, 0x9f: 0x0178,
};
const A_WINANSI = new Map();
for (let b = 0x20; b <= 0x7e; b += 1) A_WINANSI.set(b, b);
for (let b = 0xa0; b <= 0xff; b += 1) A_WINANSI.set(b, b);
for (const [b, u] of Object.entries(DEL_128_AL_159)) A_WINANSI.set(u, Number(b));
const DE_WINANSI = new Map([...A_WINANSI].map(([u, b]) => [b, u]));

// Lo que no está en la tabla y tiene algo parecido que sí. Las flechas son lo que
// más sale: «Configuración → Desarrolladores → API».
const PARECIDOS = new Map(Object.entries({
  '→': '›', '⇒': '›', '➔': '›', '➜': '›', '➝': '›', '⟶': '›', '▸': '›', '▶': '›', '►': '›',
  '←': '‹', '⇐': '‹', '⟵': '‹', '◂': '‹', '◀': '‹', '◄': '‹',
  '↔': '‹›', '↑': '^', '↓': 'v',
  '‐': '-', '‑': '-', '‒': '–', '−': '-', '―': '—', '⁃': '-',
  '′': "'", '″': '"', '‛': '‘', '‟': '“', '❛': '‘', '❜': '’', '❝': '“', '❞': '”',
  '≤': '<=', '≥': '>=', '≠': '!=', '≈': '~',
  '✓': 'v', '✔': 'v', '✗': 'x', '✘': 'x',
  '◦': '•', '▪': '•', '▫': '•', '●': '•', '○': '•', '■': '•', '□': '•', '‣': '•', '⦁': '•',
  'ł': 'l', 'Ł': 'L', 'đ': 'd', 'Đ': 'D', 'ı': 'i', 'ħ': 'h', 'Ħ': 'H',
}));

// Los tonos de piel y las banderas son «componentes» de un emoji: tampoco se ven.
const NADA = /[\p{Extended_Pictographic}\p{Emoji_Component}\p{Mn}\p{Me}\p{Cf}\u{FE00}-\u{FE0F}]/u;
const ESPACIOS = /[\p{Zs}\t\n\r\v\f\u2028\u2029]/u;

// Una letra en la tabla, o la cadena de bytes que la sustituye.
function unaLetra(letra) {
  const codigo = letra.codePointAt(0);
  // El guion blando no se ve, pero hay lectores que lo pintan (revisión de corrección de la 159).
  if (codigo === 0xad) return '';
  if (A_WINANSI.has(codigo)) return String.fromCharCode(A_WINANSI.get(codigo));
  if (PARECIDOS.has(letra)) return [...PARECIDOS.get(letra)].map(unaLetra).join('');
  // Los saltos, los tabuladores y los espacios raros, un espacio.
  if (ESPACIOS.test(letra) || /\p{Cc}/u.test(letra)) return ' ';
  // Una letra con su acento por separado («ő» es «o» y un acento): la letra.
  const sinAcento = letra.normalize('NFKD').replace(/\p{M}/gu, '');
  if (sinAcento && sinAcento !== letra && [...sinAcento].every((l) => A_WINANSI.has(l.codePointAt(0)))) {
    return [...sinAcento].map(unaLetra).join('');
  }
  // Un dibujo, un acento suelto o una marca invisible no se ve: fuera.
  if (NADA.test(letra)) return '';
  return '?';
}

// Un texto, en bytes de WinAnsi (una letra de la cadena por byte). Primero se
// juntan las letras con su acento: el Mac escribe «é» como «e» y un acento.
function aWinAnsi(texto) {
  let fuera = '';
  for (const letra of String(texto == null ? '' : texto).normalize('NFC')) fuera += unaLetra(letra);
  return fuera;
}

// Al revés, para leer lo que hay escrito (lo usan las pruebas).
function deWinAnsi(bytes) {
  let fuera = '';
  for (let i = 0; i < bytes.length; i += 1) fuera += String.fromCodePoint(DE_WINANSI.get(bytes.charCodeAt(i)) || 0xfffd);
  return fuera;
}

// ── Los anchos de cada letra ─────────────────────────────────────────────
//
// De las tablas de Adobe para Helvetica y Helvetica-Bold, en milésimas del tamaño
// de la letra, por su número en WinAnsi. Del 32 al 126, del 128 al 159 y del 160
// al 255; un hueco de la tabla vale 0, pero nunca se escribe.
const ANCHOS = {
  normal: [
    ...Array(32).fill(0),
    278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
    1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
    667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
    333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
    556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 0,
    556, 0, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0,
    0, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 0, 500, 667,
    278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737, 333,
    400, 584, 333, 333, 333, 556, 537, 278, 333, 333, 365, 556, 834, 834, 834, 611,
    667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
    722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
    556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 584, 611, 556, 556, 556, 556, 500, 556, 500,
  ],
  negrita: [
    ...Array(32).fill(0),
    278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
    975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
    667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
    333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
    611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 0,
    556, 0, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0,
    0, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 0, 500, 667,
    278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737, 333,
    400, 584, 333, 333, 333, 611, 556, 278, 333, 333, 365, 556, 834, 834, 834, 611,
    722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
    722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
    556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278,
    611, 611, 611, 611, 611, 611, 611, 584, 611, 611, 611, 611, 611, 556, 611, 556,
  ],
};

// El ancho de unos bytes de WinAnsi, en puntos, con ese tamaño de letra.
function anchoDeBytes(bytes, negrita, tamano) {
  const tabla = negrita ? ANCHOS.negrita : ANCHOS.normal;
  let total = 0;
  for (let i = 0; i < bytes.length; i += 1) total += tabla[bytes.charCodeAt(i)] || 0;
  return (total * tamano) / 1000;
}

// El ancho de un texto como se escribiría.
const ancho = (texto, negrita = false, tamano = 1000) => anchoDeBytes(aWinAnsi(texto), negrita, tamano);

// ── Partir en líneas ─────────────────────────────────────────────────────
//
// Un párrafo son trozos (`{ texto, negrita, enlace }`), y se parte por los
// espacios, sin pasarse del ancho. Una palabra que no cabe sola en una línea
// (una dirección larga) se parte por letras. Cada línea es una lista de trozos
// con su `x` y su ancho, ya en bytes de WinAnsi.
function partir(trozos, anchoMax, tamano) {
  const piezas = [];
  for (const trozo of [].concat(trozos || [])) {
    const t = typeof trozo === 'string' ? { texto: trozo } : trozo;
    const bytes = aWinAnsi(t.texto);
    for (const parte of bytes.split(/( +)/)) {
      if (parte) piezas.push({ bytes: parte, negrita: Boolean(t.negrita), enlace: t.enlace || null, espacio: /^ +$/.test(parte) });
    }
  }
  const lineas = [];
  let linea = [];
  let usado = 0;
  const cerrar = () => {
    while (linea.length && linea[linea.length - 1].espacio) linea.pop();
    if (linea.length) lineas.push(linea);
    linea = [];
    usado = 0;
  };
  const meter = (pieza) => {
    const w = anchoDeBytes(pieza.bytes, pieza.negrita, tamano);
    linea.push({ ...pieza, ancho: w });
    usado += w;
  };
  for (const pieza of piezas) {
    if (pieza.espacio && !linea.length) continue;
    const w = anchoDeBytes(pieza.bytes, pieza.negrita, tamano);
    if (usado + w <= anchoMax || pieza.espacio) {
      meter(pieza);
      continue;
    }
    if (w <= anchoMax) {
      cerrar();
      meter(pieza);
      continue;
    }
    // No cabe ni sola: por letras, llenando lo que quede de esta línea.
    let resto = pieza.bytes;
    while (resto) {
      let n = 0;
      let lleva = 0;
      while (n < resto.length) {
        const letra = anchoDeBytes(resto[n], pieza.negrita, tamano);
        if (usado + lleva + letra > anchoMax) break;
        lleva += letra;
        n += 1;
      }
      if (!n) {
        if (linea.length) {
          cerrar();
          continue;
        }
        n = 1;
      }
      meter({ ...pieza, bytes: resto.slice(0, n) });
      resto = resto.slice(n);
      if (resto) cerrar();
    }
  }
  cerrar();
  // Los trozos seguidos del mismo estilo, juntos, y cada uno con su x.
  return lineas.map((piezasDeLaLinea) => {
    const juntos = [];
    for (const p of piezasDeLaLinea) {
      const ultimo = juntos[juntos.length - 1];
      if (ultimo && ultimo.negrita === p.negrita && ultimo.enlace === p.enlace) {
        ultimo.bytes += p.bytes;
        ultimo.ancho += p.ancho;
      } else juntos.push({ bytes: p.bytes, negrita: p.negrita, enlace: p.enlace, ancho: p.ancho });
    }
    let x = 0;
    for (const j of juntos) {
      j.x = x;
      x += j.ancho;
    }
    return juntos;
  });
}

// ── Lo que se escribe dentro del PDF ─────────────────────────────────────

// Un número con dos decimales como mucho: «56», «783.89».
const num = (n) => (Math.round(n * 100) / 100).toFixed(2).replace(/\.?0+$/, '') || '0';

// Un texto del PDF entre paréntesis. Los paréntesis y la barra invertida, con su
// barra delante; lo que no es ASCII imprimible, con su número en octal. Así el
// fichero es ASCII de punta a punta, y un byte raro no rompe nada.
function cadena(bytes) {
  let fuera = '(';
  for (let i = 0; i < bytes.length; i += 1) {
    const c = bytes.charCodeAt(i);
    if (c === 0x28 || c === 0x29 || c === 0x5c) fuera += `\\${bytes[i]}`;
    else if (c >= 0x20 && c <= 0x7e) fuera += bytes[i];
    else fuera += `\\${c.toString(8).padStart(3, '0')}`;
  }
  return `${fuera})`;
}

// Un texto de los datos del documento (el título), en UTF-16 con su marca, para
// que se lea bien en cualquier sistema.
function cadenaUnicode(texto) {
  let hex = 'FEFF';
  for (const unidad of String(texto)) {
    for (let i = 0; i < unidad.length; i += 1) hex += unidad.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0');
  }
  return `<${hex}>`;
}

// Solo https, y como la escribe el navegador: con lo raro ya codificado. Lo
// demás (javascript:, file:, http:) se queda en texto, sin enlace.
function enlaceSeguro(direccion) {
  try {
    const url = new URL(String(direccion));
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    // Que no lleve nada fuera de lo imprimible: el PDF lo guarda tal cual.
    return /^[\x21-\x7e]+$/.test(url.href) && url.href.length <= 2000 ? url.href : null;
  } catch {
    return null;
  }
}

// ── El documento ─────────────────────────────────────────────────────────
//
// Los bloques, en orden:
//   { tipo: 'titulo', texto }
//   { tipo: 'seccion', texto }
//   { tipo: 'parrafo', trozos | texto, pequeno }   (pequeño: en gris, más chico)
//   { tipo: 'lista', numerada, elementos: [trozos | texto] }
// Un trozo es `{ texto, negrita, enlace }`. `pie(n, total)` es el texto del pie.
const ESTILOS = {
  titulo: { tamano: 18, interlinea: 23, antes: 0, despues: 8, negrita: true },
  seccion: { tamano: 13, interlinea: 17, antes: 14, despues: 4, negrita: true },
  parrafo: { tamano: 11, interlinea: 15, antes: 0, despues: 6, negrita: false },
  pequeno: { tamano: 9.5, interlinea: 13, antes: 0, despues: 6, negrita: false, gris: true },
  lista: { tamano: 11, interlinea: 15, antes: 0, despues: 3, negrita: false },
};
const SANGRIA_NUMERO = 20;
const SANGRIA_PUNTO = 14;

// Cada bloque, en líneas de la página: lo que se escribe, a qué altura y con qué
// separación. `pegada` es la línea que no se queda sola al final de una página
// (un título, sin lo que le sigue).
function enLineas(bloques) {
  const lineas = [];
  for (const bloque of bloques || []) {
    const tipo = bloque.tipo === 'parrafo' && bloque.pequeno ? 'pequeno' : bloque.tipo;
    const estilo = ESTILOS[tipo];
    if (!estilo) continue;
    if (tipo === 'lista') {
      const sangria = bloque.numerada ? SANGRIA_NUMERO : SANGRIA_PUNTO;
      // Un elemento que se queda en nada (solo dibujos) no sale, ni se salta su número.
      const conAlgo = (bloque.elementos || []).map((e) => partir(e, ANCHO_UTIL - sangria, estilo.tamano)).filter((p) => p.length);
      if (!conAlgo.length) continue;
      conAlgo.forEach((partidas, i) => {
        const marca = bloque.numerada ? `${i + 1}.` : '•';
        partidas.forEach((trozos, j) => lineas.push({
          estilo,
          sangria,
          marca: j === 0 ? aWinAnsi(marca) : null,
          trozos,
          antes: j === 0 && i === 0 ? estilo.antes : 0,
          despues: j === partidas.length - 1 ? estilo.despues : 0,
        }));
      });
      // Un poco de aire al acabar la lista.
      lineas[lineas.length - 1].despues += 3;
      continue;
    }
    const trozos = bloque.trozos || [{ texto: bloque.texto, negrita: estilo.negrita }];
    const conEstilo = trozos.map((t) => (typeof t === 'string' ? { texto: t, negrita: estilo.negrita } : { ...t, negrita: t.negrita || estilo.negrita }));
    const partidas = partir(conEstilo, ANCHO_UTIL, estilo.tamano);
    partidas.forEach((t, j) => lineas.push({
      estilo,
      sangria: 0,
      marca: null,
      trozos: t,
      antes: j === 0 ? estilo.antes : 0,
      despues: j === partidas.length - 1 ? estilo.despues : 0,
      pegada: (tipo === 'seccion' || tipo === 'titulo') && j === partidas.length - 1,
    }));
  }
  return lineas;
}

// Las líneas, repartidas en páginas. Cada una con su y (la base de la letra).
function enPaginas(lineas) {
  const arriba = ALTO_PAGINA - MARGEN;
  const abajo = MARGEN;
  const paginas = [[]];
  let y = arriba;
  const cabe = (l, desde) => desde - l.antes - l.estilo.interlinea >= abajo;
  for (let i = 0; i < lineas.length; i += 1) {
    const l = lineas[i];
    const primera = !paginas[paginas.length - 1].length;
    // Un título no se queda solo: con lo que le sigue, o a la página siguiente.
    const siguiente = l.pegada ? lineas[i + 1] : null;
    const conLaSiguiente = siguiente ? l.antes + l.estilo.interlinea + l.despues + siguiente.estilo.interlinea : 0;
    if (!primera && (!cabe(l, y) || (siguiente && y - conLaSiguiente < abajo))) {
      paginas.push([]);
      y = arriba;
    }
    const enPrimera = !paginas[paginas.length - 1].length;
    y -= (enPrimera ? 0 : l.antes) + l.estilo.interlinea;
    paginas[paginas.length - 1].push({ ...l, y });
    y -= l.despues;
  }
  return paginas;
}

const COLOR_TEXTO = '0.13 0.13 0.13';
const COLOR_GRIS = '0.4 0.4 0.4';
const COLOR_ENLACE = '0.05 0.3 0.65';

// Lo que se pinta en una página, y sus enlaces (con su rectángulo).
function laPagina(lineasDeLaPagina, pie) {
  const ops = [];
  const enlaces = [];
  for (const l of lineasDeLaPagina) {
    const x0 = MARGEN + l.sangria;
    const tamano = l.estilo.tamano;
    const color = l.estilo.gris ? COLOR_GRIS : COLOR_TEXTO;
    ops.push('BT');
    if (l.marca) {
      ops.push(`/F1 ${num(tamano)} Tf ${color} rg ${num(MARGEN)} ${num(l.y)} Td ${cadena(l.marca)} Tj`);
      ops.push('ET', 'BT');
    }
    ops.push(`${num(x0)} ${num(l.y)} Td`);
    for (const t of l.trozos) {
      const enlace = t.enlace ? enlaceSeguro(t.enlace) : null;
      ops.push(`/${t.negrita ? 'F2' : 'F1'} ${num(tamano)} Tf ${enlace ? COLOR_ENLACE : color} rg ${cadena(t.bytes)} Tj`);
      if (enlace) enlaces.push({ x: x0 + t.x, y: l.y, ancho: t.ancho, tamano, url: enlace });
    }
    ops.push('ET');
  }
  // Los enlaces, subrayados, para que se vea que se pulsan.
  for (const e of enlaces) ops.push(`${COLOR_ENLACE} rg ${num(e.x)} ${num(e.y - 1.6)} ${num(e.ancho)} 0.6 re f`);
  if (pie) {
    const bytes = aWinAnsi(pie);
    ops.push(`BT /F1 8.5 Tf ${COLOR_GRIS} rg ${num(MARGEN)} ${num(ALTO_DEL_PIE)} Td ${cadena(bytes)} Tj ET`);
  }
  return { contenido: ops.join('\n'), enlaces };
}

// El PDF entero, en un Buffer.
function documento({ titulo = '', bloques = [], pie = null } = {}) {
  const paginas = enPaginas(enLineas(bloques));
  const total = paginas.length;

  // Los objetos, por número. 1 el catálogo, 2 las páginas, 3 y 4 las fuentes, 5
  // los datos del documento; después, de cada página, ella, lo que pinta y sus enlaces.
  const objetos = [];
  const reservar = () => objetos.push(null);
  const poner = (n, texto) => { objetos[n - 1] = texto; };
  for (let i = 0; i < 5; i += 1) reservar();
  const hijos = [];
  paginas.forEach((lineas, i) => {
    const { contenido, enlaces } = laPagina(lineas, typeof pie === 'function' ? pie(i + 1, total) : null);
    const nPagina = reservar();
    const nContenido = reservar();
    const nEnlaces = enlaces.map(() => reservar());
    hijos.push(nPagina);
    enlaces.forEach((e, j) => poner(nEnlaces[j],
      `<< /Type /Annot /Subtype /Link /Rect [${num(e.x)} ${num(e.y - 3)} ${num(e.x + e.ancho)} ${num(e.y + e.tamano)}] /Border [0 0 0] /A << /Type /Action /S /URI /URI ${cadena(e.url)} >> >>`));
    poner(nPagina, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(ANCHO_PAGINA)} ${num(ALTO_PAGINA)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${nContenido} 0 R${nEnlaces.length ? ` /Annots [${nEnlaces.map((n) => `${n} 0 R`).join(' ')}]` : ''} >>`);
    // El salto de antes de `endstream` no cuenta en `/Length`.
    poner(nContenido, `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`);
  });
  poner(1, '<< /Type /Catalog /Pages 2 0 R /Lang (es-ES) >>');
  poner(2, `<< /Type /Pages /Kids [${hijos.map((n) => `${n} 0 R`).join(' ')}] /Count ${hijos.length} >>`);
  poner(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  poner(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  poner(5, `<< /Title ${cadenaUnicode(titulo)} /Creator (Executive Lab) /Producer (Executive Lab) >>`);

  // Cada objeto, apuntando dónde empieza: la tabla del final lo necesita al byte.
  // La segunda línea, con bytes altos, dice a quien lo copie que no es texto.
  let cuerpo = '%PDF-1.4\n%âãÏÓ\n';
  const dondeEmpieza = [];
  objetos.forEach((texto, i) => {
    dondeEmpieza.push(cuerpo.length);
    cuerpo += `${i + 1} 0 obj\n${texto}\nendobj\n`;
  });
  const tabla = cuerpo.length;
  const id = crypto.createHash('sha256').update(Buffer.from(cuerpo, 'latin1')).digest('hex').slice(0, 32).toUpperCase();
  cuerpo += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (const n of dondeEmpieza) cuerpo += `${String(n).padStart(10, '0')} 00000 n \n`;
  cuerpo += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R /Info 5 0 R /ID [<${id}> <${id}>] >>\nstartxref\n${tabla}\n%%EOF\n`;
  return Buffer.from(cuerpo, 'latin1');
}

module.exports = {
  documento, aWinAnsi, deWinAnsi, ancho, partir, enlaceSeguro, cadena, ANCHOS,
  ANCHO_PAGINA, ALTO_PAGINA, MARGEN, ANCHO_UTIL,
};
