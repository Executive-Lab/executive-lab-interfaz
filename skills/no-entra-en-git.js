// Lo que no entra en las copias de git: las claves y los ficheros de acceso (F1).
//
// ── Por qué está aquí, al lado de los raíles ─────────────────────────────
//
// Lo necesitan dos sitios que no se pueden hablar: los raíles (`aplicar.js`),
// que ponen el bloque en el `.gitignore` de la carpeta, y la barra
// (`extension/src/terreno.js`), que mira si está y si es el de hoy. Como
// `sitios.js`, vive junto a los raíles para que `aplicar.js` lo encuentre al
// lado desde las dos carpetas desde las que se ejecuta, y la barra lo lee desde
// `../media/railes/`.
//
// ── Qué se deja fuera ────────────────────────────────────────────────────
//
// RSC solo deja fuera de git lo suyo (`.rsc/`), y la plantilla de cada
// herramienta, su `.env`, `keys/` y `out/`. Un `.env` o un `credentials.json`
// sueltos en la raíz entraban en la copia, y subían con «Subir a GitHub».
//
// La lista es lo que el inventario de la barra reconoce como credencial
// (`sueltas.js`, decisiones 104 y 105), escrito como lo entiende git. Menos
// `*.key`: en un Mac, las presentaciones de Keynote acaban así, y quedarían fuera
// de las copias sin que nadie lo supiera. Una `.key` que es una clave de verdad
// la deja fuera la barra al guardar, porque mira lo que lleva dentro.
//
// Es aditivo: lo que ya estaba en git sigue en git (git no deja de seguir un
// fichero porque se ignore), y eso lo avisa la barra, que lo sabe mirar.

const LO_QUE_NO_ENTRA = [
  '.env',
  '.env.*',
  '!.env.example',
  '!.env.sample',
  '!.env.template',
  '!.env.dist',
  '.envrc',
  '*.pem',
  '*.p8',
  '*.p12',
  '*.pfx',
  '*.jks',
  '*.keystore',
  'id_rsa',
  'id_ed25519',
  'id_ecdsa',
  'id_dsa',
  'credentials.json',
  'client_secret*.json',
  'token.json',
  'serviceAccountKey.json',
  'firebase-adminsdk*.json',
  '*service-account*.json',
  '*service_account*.json',
  '*serviceaccount*.json',
  // El informe de «Algo va mal»: la barra lo deja aquí para que el asistente lo
  // lea, con las rutas de este ordenador. No sale de él (revisión final, seguridad).
  '02-DOCS/raw/incidencias/',
  // Los avisos para Executive Lab, mandados o no: llevan lo que la barra apuntó
  // por dentro, y lo que sale de aquí sale limpio y solo con su sí (decisión 131).
  '02-DOCS/raw/avisos/',
  // Lo que el asistente le pide a la barra y lo que ella le contesta (decisión 150).
  '02-DOCS/raw/pedidos/',
  // Los ajustes de Claude de esta persona en este ordenador (decisión 157). Claude
  // lo deja fuera de git cuando lo crea él, pero aquí lo crean RSC, para su memoria,
  // y la barra. RSC solo lo excluye en `.git/info/exclude` si ya había git al
  // montar: con «seguir sin copias» y «Ponerlas ahora» después, entraba en la copia,
  // y con él en git la memoria de RSC deja de engancharse.
  '.claude/settings.local.json',
  // Y la constancia de lo que la barra puso en él, que es de este ordenador: si
  // viajara, otra carpeta podría traer una plantada (revisión de seguridad de la 157).
  '.rsc/executive-lab-ajustes-locales.json',
  // La copia de cómo estaba la configuración de Codex de la carpeta antes de que la
  // barra le quitara un modelo retirado (decisión 157): es para volver atrás aquí.
  '.codex/*.copia-executive-lab-*',
  // Los vídeos y las imágenes de disco, que pesan mucho y hacen el historial enorme
  // sin vuelta atrás (decisión 147). Aquí, y no solo al guardar desde la barra,
  // porque así tampoco entran cuando guarda el asistente. Con las dos formas de
  // cada letra: el iPhone escribe `.MOV`, y git no siempre mira sin mayúsculas.
  '*.[mM][pP]4',
  '*.[mM][oO][vV]',
  '*.[mM]4[vV]',
  '*.[aA][vV][iI]',
  '*.[mM][kK][vV]',
  '*.[wW][eE][bB][mM]',
  '*.[wW][mM][vV]',
  '*.[mM][pP][gG]',
  '*.[mM][pP][eE][gG]',
  '*.3[gG][pP]',
  '*.[dD][mM][gG]',
  '*.[iI][sS][oO]',
];

// Las marcas van como comentarios de `.gitignore`: una línea con `<!--`, como las
// de los ficheros de instrucciones, sería un patrón más.
const DESDE = '# executive-lab:start';
const HASTA = '# executive-lab:end';
const ENTRE_MARCAS = /# executive-lab:start[\s\S]*?# executive-lab:end/;

const elBloque = () => [
  DESDE,
  '# Lo que no entra en las copias: claves, ficheros de acceso, vídeos y lo de este ordenador. Lo pone la barra de Executive Lab.',
  ...LO_QUE_NO_ENTRA,
  HASTA,
].join('\n');

// El bloque que hay en un `.gitignore`, o null.
const elQueHay = (texto) => ((texto || '').match(ENTRE_MARCAS) || [])[0] || null;

module.exports = { LO_QUE_NO_ENTRA, DESDE, HASTA, ENTRE_MARCAS, elBloque, elQueHay };
