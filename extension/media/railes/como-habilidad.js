// Un comando de los raíles, escrito como habilidad (decisión 141).
//
// Lo usan `aplicar.js`, para ponerla, y la barra, para saber si la que hay es
// la de hoy: los dos tienen que escribirla igual, y por eso está aquí y no dos
// veces.
//
// Lo de la barra (`boton`, `grupo`, `icono`) va dentro de `metadata`, que es
// donde el estándar de las habilidades guarda lo que no es suyo. Lo que hace
// algo que no se deshace solo (`disable-model-invocation: true` en la fuente)
// se usa cuando se pide, nunca por su cuenta: en Claude con ese mismo campo, y
// en Codex con su `agents/openai.yaml`.

const CABECERA = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function campoDe(texto, clave) {
  const cabecera = (String(texto).match(CABECERA) || [])[1] || '';
  const linea = cabecera.match(new RegExp(`^${clave}:\\s*(.+?)\\s*$`, 'm'));
  if (!linea) return null;
  // Lo que escribimos nosotros va entre comillas dobles, con sus escapes.
  if (/^".*"$/.test(linea[1])) {
    try {
      return JSON.parse(linea[1]);
    } catch { /* no era eso */ }
  }
  return linea[1].replace(/^["']|["']$/g, '');
}

// La `description` de la cabecera, o null. Con ella se sabe si una que se llama
// como una nuestra es nuestra (de otro día) o del alumno, y entonces no se toca.
const descripcionDe = (texto) => campoDe(texto, 'description');

function comoHabilidad(texto, nombre, quien) {
  const cuerpo = String(texto).replace(CABECERA, '');
  const soloAMano = campoDe(texto, 'disable-model-invocation') === 'true';
  const meta = ['boton', 'grupo', 'icono'].filter((c) => campoDe(texto, c)).map((c) => `  ${c}: ${JSON.stringify(campoDe(texto, c))}`);
  const lineas = [
    '---',
    `name: ${nombre}`,
    `description: ${JSON.stringify(descripcionDe(texto) || nombre)}`,
    ...(soloAMano && quien === 'claude' ? ['disable-model-invocation: true'] : []),
    ...(meta.length ? ['metadata:', ...meta] : []),
    '---',
  ];
  return {
    skill: `${lineas.join('\n')}\n${cuerpo}`,
    // Lo que Codex lee para no usarla por su cuenta, o null.
    openai: soloAMano && quien === 'codex' ? 'policy:\n  allow_implicit_invocation: false\n' : null,
  };
}

module.exports = { comoHabilidad, descripcionDe };
