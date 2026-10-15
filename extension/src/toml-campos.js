// Las cadenas de la cabecera de un agente TOML. No interpreta configuración:
// lee name/description sin confundir las instrucciones ni las tablas con ella.
// Conserva las posiciones para renombrar solo el name, sin reescribir el cuerpo.
function cadenas(texto) {
  const campos = {};
  let i = 0;
  const hastaFinDeLinea = () => {
    const fin = texto.indexOf('\n', i);
    i = fin < 0 ? texto.length : fin + 1;
  };
  while (i < texto.length) {
    const inicio = i;
    const linea = texto.slice(i, texto.indexOf('\n', i) < 0 ? texto.length : texto.indexOf('\n', i));
    if (/^\s*\[/.test(linea)) break; // desde una tabla ya no son campos raíz
    const clave = linea.match(/^[ \t]*([A-Za-z_][\w-]*)[ \t]*=[ \t]*/);
    if (!clave) { hastaFinDeLinea(); continue; }
    i += clave[0].length;
    const desde = i;
    const comilla = texto[i];
    if (comilla !== '"' && comilla !== "'") { hastaFinDeLinea(); continue; }
    const triple = texto.slice(i, i + 3) === comilla.repeat(3);
    const cierre = comilla.repeat(triple ? 3 : 1);
    i += cierre.length;
    let valor = '';
    let valida = true;
    let cerrada = false;
    if (triple && texto.slice(i, i + 2) === '\r\n') i += 2;
    else if (triple && texto[i] === '\n') i += 1;
    while (i < texto.length) {
      if (texto.startsWith(cierre, i)) { i += cierre.length; cerrada = true; break; }
      const c = texto[i++];
      if (!triple && /[\r\n]/.test(c)) { valida = false; break; }
      if (comilla === '"' && c === '\\') {
        if (triple && /^[ \t]*\r?\n/.test(texto.slice(i))) {
          i += texto.slice(i).match(/^\s*/)[0].length;
          continue;
        }
        const escapado = texto[i++];
        const escapes = { b: '\b', t: '\t', n: '\n', f: '\f', r: '\r', '"': '"', '\\': '\\' };
        if (Object.hasOwn(escapes, escapado)) valor += escapes[escapado];
        else if (escapado === 'u' || escapado === 'U') {
          const n = escapado === 'u' ? 4 : 8;
          const hex = texto.slice(i, i + n);
          const codigo = Number.parseInt(hex, 16);
          if (hex.length !== n || !/^[\da-f]+$/i.test(hex) || codigo > 0x10ffff || (codigo >= 0xd800 && codigo <= 0xdfff)) valida = false;
          else valor += String.fromCodePoint(codigo);
          i += n;
        } else valida = false;
      } else valor += c;
    }
    const hasta = i;
    const resto = texto.slice(i, texto.indexOf('\n', i) < 0 ? texto.length : texto.indexOf('\n', i));
    if (cerrada && valida && /^[ \t\r]*(?:#.*)?$/.test(resto)) campos[clave[1]] = { valor, desde, hasta };
    // Incluso una cadena que no interesa se consume entera: una línea name =
    // dentro de developer_instructions no puede cambiar la identidad del agente.
    if (i <= inicio) i = inicio + 1;
    hastaFinDeLinea();
  }
  return campos;
}

const leer = (texto) => Object.fromEntries(Object.entries(cadenas(texto)).map(([k, v]) => [k, v.valor]));
function renombrar(texto, nombre) {
  const campo = cadenas(texto).name;
  if (!campo) throw new Error('El agente no tiene un name válido.');
  return texto.slice(0, campo.desde) + JSON.stringify(nombre) + texto.slice(campo.hasta);
}

module.exports = { leer, renombrar };
