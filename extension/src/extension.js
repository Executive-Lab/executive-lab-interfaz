// La barra lateral Executive Lab.
//
// Una sola vista. Nada de lo que enseña está predefinido: sale de lo que el
// arnés tenga montado en esta carpeta — las herramientas de `01-TOOLS/`, los
// comandos de `.claude/commands/`, la wiki de `02-DOCS/`. Una gestoría y una
// empresa de contratos ven cosas distintas porque tienen cosas distintas.
//
// Todo lo que se enseña está en docs/diccionario.md; si hace falta una palabra
// que no esté, se añade allí primero.

const vscode = require('vscode');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const proyecto = require('./proyecto');
const brujula = require('./brujula');
const identidad = require('./identidad');
const puente = require('./puente');
const acciones = require('./acciones');
const conexiones = require('./conexiones');
const sueltas = require('./sueltas');
// Los encargos con su diagnóstico: «Resolver una incidencia» los usaba sin traerlos, y reventaba siempre (G1).
const encargos = require('./encargos');
const cerebro = require('./cerebro');
const buscador = require('./buscar');
const consejos = require('./consejos');
const recordatorios = require('./recordatorios');
const copias = require('./guardar');
const soporte = require('./soporte');
// Lo que falla, lo que no se entiende y lo que se echa en falta, para Jose (decisión 131).
const avisos = require('./avisos');
const rsc = require('./rsc');
const disfraz = require('./disfraz');
const arrancar = require('./arrancar');
const git = require('./git');
const github = require('./github');
const terreno = require('./terreno');
const saberes = require('./saberes');
const salidas = require('./salidas');
const version = require('./version');
const diario = require('./diario');
const papeles = require('./papeles');
const reglas = require('./reglas');
const ajustes = require('./ajustes');
const donde = require('./donde');
const solo = require('./solo');

// P9: la carpeta que este ordenador ya conoce, los botones que corren el arnés o
// tocan sus copias, y lo que se dice si se pulsan mientras la barra arregla sola.
const CLAVE_CONOCIDA = 'executiveLab.carpetaConocida';
const LOS_DEL_ARNES = new Set(['arrancar', 'arreglar', 'ponerCopias', 'ponerElFreno', 'ponerElBloque', 'elegirAsistente', 'aprenderCapacidad']);
const OCUPADA = 'Estoy arreglando esta carpeta. Pulsa otra vez en un momento.';
// En una carpeta que va por delante, lo que escribe con el arnés espera a que la
// barra se ponga al día (P7, decisión 145; `rsc.correr`). Mientras, el asistente.
const ESCRIBEN_CON_EL_ARNES = new Set(['arrancar', 'arreglar', 'aprenderCapacidad']);
const POR_DELANTE = 'Esta carpeta lleva una versión del arnés más nueva que la de la barra. Hasta que la barra se ponga al día, pídeselo al asistente.';
const nombres = require('./nombres');
const pulso = require('./pulso');
const fijadas = require('./fijadas');
const tema = require('./tema');
const proyectos = require('./proyectos');
const agentes = require('./agentes');
const asistentes = require('./asistentes');
const trato = require('./trato');
const lecciones = require('./lecciones');
const marca = require('./marca');
const web = require('./web');
const rastro = require('./rastro');
const entorno = require('./entorno');
const relevo = require('./relevo');

// Lo que la barra recuerda de esta carpeta, y que nadie más ve: las últimas
// peticiones (para detectar la que se repite) y los consejos que el alumno
// apartó con "ahora no".
// Qué se le dice a esa persona cuando el arranque NO ha montado nada nuevo.
// Cada rama hizo una cosa distinta y decir «ya está listo» en las cuatro sería
// no decir nada.
const LO_QUE_SE_HIZO = {
  traer: 'Ya tienes aquí lo que este proyecto traía puesto.',
  completar: 'He terminado de prepararlo. Ya está entero.',
  sinRecibo: 'Lo he puesto al día con lo que este proyecto declaraba.',
  adoptar: 'Le he puesto lo que le faltaba de la barra.',
  ponerAlDia: 'Lo he puesto al día con la versión que trae la barra.',
};

// Lo que se le pide al asistente para el foro (decisión 139): un mensaje que se
// entienda sin estar aquí, y nada que no deba salir del ordenador.
const PEDIR_AYUDA_EN_EL_FORO = 'Quiero pedir ayuda en el foro de Executive Lab. Escríbeme el mensaje para publicarlo: qué intento hacer, qué ha pasado y qué he probado ya, en pocas líneas y en un bloque que pueda copiar de una vez. Que se entienda sin estar aquí, y sin claves, contraseñas ni datos de clientes. Si no sabes qué me pasa, pregúntamelo antes de escribirlo.';
const CLAVE_PETICIONES = 'executiveLab.peticiones';
// Los recordatorios (decisión 144): cuándo se pulsó cada botón, cuándo se hizo
// o se dejó para luego cada recordatorio, de cuál se avisó ya, y las costumbres
// que la barra convirtió en recordatorio (para decirlo una vez y no repetirlo).
// Lo que dijo la última prueba de cada conexión, con la huella de sus claves
// (decisión 146): la lista lo enseña mientras las claves sigan igual.
const CLAVE_PRUEBAS = 'executiveLab.pruebasDeConexion';
// Las conexiones cuya clave puede escribir y que esa persona eligió dejar así, con
// la huella de sus claves: con otra clave se pregunta otra vez (punto 7 de la 142).
const CLAVE_PUEDEN_ESCRIBIR = 'executiveLab.clavesQuePuedenEscribir';
const CLAVE_USOS = 'executiveLab.usosDeBotones';
const CLAVE_RECORDATORIOS = 'executiveLab.recordatoriosHechos';
const CLAVE_AVISADOS = 'executiveLab.recordatoriosAvisados';
const CLAVE_COSTUMBRES = 'executiveLab.costumbresPuestas';
const CLAVE_RECORDATORIOS_VISTOS = 'executiveLab.recordatoriosVistos';
const CLAVE_SILENCIADOS = 'executiveLab.consejosApartados';
// La última versión de la barra que se abrió aquí, para saber si hay que decir
// qué trae la de ahora; y cuándo se miró en GitHub lo que pasó con los avisos
// mandados de esta carpeta (decisión 134).
const CLAVE_VERSION_VISTA = 'executiveLab.versionVista';
const CLAVE_ARREGLADOS_MIRADOS = 'executiveLab.arregladosMirados';
const CLAVE_MANDADOS = 'executiveLab.avisosMandados';
const UN_DIA = 24 * 60 * 60 * 1000;
// Una versión nueva apartada con «Ahora no» vuelve a salir a los tres días: no
// es urgente, pero quedarse atrás tampoco es gratis (decisión 132).
const VERSION_APARTADA_DURANTE = 3 * 24 * 60 * 60 * 1000;

class Panel {
  constructor(contexto, salida) {
    this.contexto = contexto;
    this.salida = salida;
    this.vista = null;
    // Si esta barra ya se usaba antes de abrirse ahora: una de antes dejó
    // apuntado cuándo miró si había versión nueva. Se mira al arrancar, antes
    // de que Ayuda o la principal lo apunten ellas (revisión de la decisión 134).
    this.yaSeUsaba = Boolean(contexto.globalState && contexto.globalState.get(version.CLAVE));
    // En qué pantalla está el alumno. Cuando el arnés cambia algo por detrás
    // se repinta la que tiene delante, no se le devuelve a la principal: que
    // te saquen de donde estabas mientras rellenas una clave es peor que no
    // enterarte del cambio.
    this.donde = { tipo: 'principal' };
  }

  resolveWebviewView(vista) {
    this.vista = vista;
    this.ponerleElNombre();
    this.pintarPagina();
    vista.webview.onDidReceiveMessage((m) => this.manejar(m));

    // Al volver a mirar la barra lateral, la brújula se pone al día sola.
    vista.onDidChangeVisibility(() => { if (vista.visible) this.refrescar(); });
  }

  // La página entera. Se rehace solo cuando cambia la marca de la empresa,
  // porque eso cambia los colores y el logotipo; lo demás va por mensajes.
  pintarPagina() {
    if (!this.vista) return;
    const medios = vscode.Uri.joinPath(this.contexto.extensionUri, 'media');
    const suya = marca.leer();

    // Al logotipo de la empresa se le da acceso de lectura a su carpeta, y a
    // esa sola: no hace falta abrirle el resto del trabajo del alumno.
    const raices = [medios];
    if (suya && suya.carpeta) raices.push(vscode.Uri.file(suya.carpeta));

    this.vista.webview.options = { enableScripts: true, localResourceRoots: raices };
    this.vista.webview.html = this.html(this.vista.webview, medios, suya);
  }

  // ── Nuestro logotipo, teñido ─────────────────────────────────────────
  //
  // Va escrito en negro. Sobre un tema oscuro del editor eso es un logotipo
  // negro sobre fondo negro: no se ve. Como imagen no hay forma de arreglarlo
  // —una `<img>` no se puede repintar desde la hoja de estilo— así que se mete
  // el dibujo dentro de la página y sus dos colores pasan a ser los de la
  // barra: el nombre toma el color del texto y el asterisco el del acento.
  //
  // Solo el nuestro. El logotipo de una empresa es suyo y se pinta como ella lo
  // hizo; teñirlo sería cambiarle la marca.
  nuestroLogo(medios) {
    try {
      const dibujo = fs.readFileSync(path.join(medios.fsPath, 'logo.svg'), 'utf8');
      // El fichero puede venir en su versión negra o en la blanca, y con los
      // colores escritos en hexadecimal o en `rgb()`. Se aceptan las cuatro
      // formas: así da igual cuál de los dos ficheros esté puesto.
      return `<div class="marca marca--nuestra" role="img" aria-label="Executive Lab">${dibujo
        .replace(/fill="(#0a0a0a|#fefefe|rgb\(\s*10\s*,\s*10\s*,\s*10\s*\)|rgb\(\s*254\s*,\s*254\s*,\s*254\s*\))"/gi, 'fill="currentColor"')
        .replace(/fill="(#EC4429|rgb\(\s*231\s*,\s*60\s*,\s*35\s*\))"/gi, 'fill="var(--acento)"')}</div>`;
    } catch {
      // Si no se puede leer, la imagen de siempre: mejor un logotipo que no se
      // ve en oscuro que una cabecera vacía.
      const uri = (f) => this.vista.webview.asWebviewUri(vscode.Uri.joinPath(medios, f));
      return `<img class="marca" src="${uri('logo.svg')}" alt="Executive Lab">`;
    }
  }

  html(webview, medios, suya) {
    const nonce = crypto.randomBytes(16).toString('base64');
    const uri = (fichero) => webview.asWebviewUri(vscode.Uri.joinPath(medios, fichero));
    // Las fuentes y el logotipo viajan dentro de la extensión: la interfaz no
    // pide nada a la red, así que funciona igual sin conexión o con el IT de
    // la empresa bloqueando dominios.
    const csp = [
      "default-src 'none'",
      `style-src ${webview.cspSource}`,
      `font-src ${webview.cspSource}`,
      `img-src ${webview.cspSource}`,
      `script-src 'nonce-${nonce}'`,
    ].join('; ');

    // Si el alumno ha contado cuál es la web de su empresa, manda su marca.
    // Sin logotipo utilizable, su nombre escrito: siempre se lee, y en muchas
    // pymes es lo único que hay.
    const escapar = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    // Una plaquita detrás del logotipo cuando no se vea sobre su propio fondo.
    // No se tiñe: el logotipo de una empresa es suyo. El color va en el estilo
    // de la página, junto al resto de la marca.
    const placa = suya && suya.placa ? ' con-placa' : '';

    let cabecera;
    if (suya && suya.logo && suya.logoSinNombre) {
      // El logotipo es solo el símbolo: una ene de puntos preciosa que no dice
      // de quién es esto. El nombre va al lado, como en su propia web.
      cabecera = `<div class="marca-fila">
  <img class="marca marca--simbolo${placa}" src="${webview.asWebviewUri(vscode.Uri.file(suya.logo))}" alt="">
  <p class="marca--nombre">${escapar(suya.nombre)}</p>
</div>`;
    } else if (suya && suya.logo) {
      cabecera = `<img class="marca${placa}" src="${webview.asWebviewUri(vscode.Uri.file(suya.logo))}" alt="${escapar(suya.nombre || 'Tu empresa')}">`;
    } else if (suya && suya.nombre) {
      cabecera = `<p class="marca marca--nombre">${escapar(suya.nombre)}</p>`;
    } else {
      cabecera = this.nuestroLogo(medios);
    }

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="stylesheet" href="${uri('panel.css')}">
${marca.estilo(suya)}
</head>
<body>
${cabecera}
<div id="app" aria-live="polite"></div>
<script nonce="${nonce}" src="${uri('panel.js')}"></script>
</body>
</html>`;
  }

  // El rótulo de la barra, con el nombre que puso el alumno.
  //
  // El del contenedor ("Mi Empresa") es estático y VS Code no deja cambiarlo,
  // pero el de la vista sí. Y hacía falta: llamarle "empresa" al departamento
  // de marketing de alguien es justo lo que la decisión 16 dice que no se
  // haga —"puede ser un arnés para llevar contabilidad, o solo rrhh"— y
  // llevaba desde entonces sin aplicarse aquí.
  ponerleElNombre() {
    if (!this.vista) return;
    const { arnes, empresa } = identidad.leer();
    this.vista.title = arnes || 'Tu trabajo';
    // El segundo nombre va de subtítulo, en gris y a la derecha.
    this.vista.description = arnes && empresa ? empresa : undefined;
  }

  enviar(mensaje) {
    if (this.vista) this.vista.webview.postMessage(mensaje);
  }

  // El aviso de lo que se hizo solo al abrir sale en la principal, con la barra
  // a la vista. Si no, espera: cada vez que se pinta la principal se mira, y se
  // pinta al cargar el panel y al volver a mirarlo (revisión de corrección, 4 y 8).
  soltarElAviso() {
    if (!this.avisoPendiente || !this.vista || this.vista.visible === false || this.donde.tipo !== 'principal') return;
    const aviso = this.avisoPendiente;
    this.avisoPendiente = null;
    this.enviar(aviso);
  }

  // Una carpeta que este ordenador ya conoce: alguien ha pulsado aquí un botón
  // que corre el arnés. Va en el estado del editor para esta carpeta, que un
  // repositorio no puede traer escrito.
  carpetaConocida() {
    return Boolean(this.contexto.workspaceState && this.contexto.workspaceState.get(CLAVE_CONOCIDA));
  }

  async darPorConocida() {
    if (this.contexto.workspaceState && !this.carpetaConocida()) await this.contexto.workspaceState.update(CLAVE_CONOCIDA, true);
  }

  // ── Lo que se puede hacer solo, se hace solo (P9, decisión 142) ─────────
  //
  // Al abrir la carpeta, lo que «Qué falta por montar» marca `alAbrir` se hace
  // sin esperar a nadie, y se cuenta en una frase. Lo que falla se queda en su
  // pieza, con su botón, y apuntado para «Algo va mal».
  //
  // Solo con la carpeta de confianza: arreglar corre el arnés, y en una sin
  // confianza la barra hace solo lo que dice su `package.json`. El examen es a
  // fondo —tres procesos del arnés—, y se paga una vez, al abrir.
  async hacerSoloLoQueSePuede() {
    if (vscode.workspace.isTrusted === false || !proyecto.raiz()) return [];
    // Solo en una carpeta que este ordenador ya conoce. Con el instalador, la
    // confianza del editor va apagada y vale para todas, así que no distingue un
    // repositorio recién traído de fuera (revisión de seguridad, H2). La primera
    // vez, con su botón; pulsarlo la da por conocida.
    if (!this.carpetaConocida()) {
      this.salida.appendLine('[solo] carpeta que este ordenador no conoce todavía: espera a un clic'); // diccionario: interno
      return [];
    }
    // Montada con un arnés más nuevo que el de la clase: correr encima el de la
    // barra la bajaría sin su sí (revisión de seguridad, M1).
    if (rsc.comoEsLaVersion(proyecto.versionDelCatalogo()) === 'nueva') {
      this.salida.appendLine('[solo] carpeta de un arnés más nuevo que el de la clase: no se toca sola'); // diccionario: interno
      return [];
    }
    const mirar = async () => (await terreno.radiografia({
      aFondo: (await terreno.reconocer({ profundo: true })).arnes,
      sigueSinCopias: this.eligioSinCopias(),
    })).piezas;
    const tareas = solo.queSeHaceSolo(await mirar());
    if (!tareas.length) return [];

    // Mientras dura, los botones que corren el arnés esperan (ver `manejar`).
    this.arreglandoSolo = true;
    let hechas = [];
    try {
      hechas = await solo.hacerloSolo(tareas, {
        // `yaEstaba` es que no había nada que hacer: no se cuenta como arreglado.
        arrancar: async () => {
          const hecho = await arrancar.arrancar(this.contexto, this.salida, { sinNadieDelante: true });
          return hecho.ok && !hecho.yaEstaba;
        },
        arreglar: async () => {
          const { ok, detalle } = await soporte.arreglar();
          if (detalle) this.salida.appendLine(detalle);
          return ok;
        },
        // Sin git no se instala nada solo: eso abre el instalador del sistema. Y con
        // demasiado peso no se guarda (decisión 147): no queda historial a medias, y la
        // pieza sigue con su botón, que lo dice.
        ponerCopias: async () => {
          const hecho = await arrancar.ponerLasCopias(this.contexto);
          if (!hecho.ok && hecho.mensaje) this.salida.appendLine(`[solo] copias: ${hecho.mensaje}`); // diccionario: interno
          return hecho.ok;
        },
      }, (linea) => this.salida.appendLine(linea));
      // Lo que se va a decir arreglado se mira otra vez: un `repair` que no
      // encuentra nada sale bien igual, y la frase diría algo que no ha pasado
      // (revisión de corrección, 3). Solo cuenta lo que ya no sale como pendiente.
      if (hechas.length) {
        const siguen = new Set((await mirar()).filter((p) => p.estado === 'no' || p.estado === 'aMedias').map((p) => p.nombre));
        hechas = hechas.filter((nombre) => !siguen.has(nombre));
      }
    } finally {
      this.arreglandoSolo = false;
    }

    // Lo que trae o arregla el arnés lo lee Claude al empezar una conversación.
    const frase = solo.laFrase(hechas, donde.paraQuien() === 'claude' && hechas.length > 0);
    if (frase) this.avisoPendiente = { tipo: 'aviso', texto: frase };
    // Sin sacar a nadie de donde está: se repinta lo que tenga delante, y la
    // frase sale cuando esté en la principal.
    await this.repintarLoQueHaya();
    this.soltarElAviso();
    return hechas;
  }

  // Repinta lo que el alumno tenga delante. Lo llama el vigía del arnés.
  async repintarLoQueHaya() {
    const d = this.donde;
    if (d.tipo === 'conexiones') return this.verConexiones();
    if (d.tipo === 'conexion') return this.verConexion(d.proveedor);
    if (d.tipo === 'cerebro') return this.verCerebro();
    if (d.tipo === 'tema') return this.verTema(d.tema);
    // En una pantalla de lectura o de resultado no se toca nada: está leyendo.
    if (d.tipo === 'quieto') return undefined;
    return this.refrescar(true);
  }

  async refrescar(fresco = false) {
    this.donde = { tipo: 'principal' };
    this.ponerleElNombre();
    this.enviar({ tipo: 'cargando' });
    const suya = marca.leer();
    this.enviar({
      tipo: 'estado',
      estado: await brujula.estado({ fresco }),
      // Lo más alto de la barra: hasta cinco cosas que elige quien la usa, de
      // entre sus botones, sus consultas y sus habilidades. Sin elegir nada,
      // los botones que el asistente ha creado.
      acciones: fijadas.puestas(this.almacen(), this.contexto.extensionPath),
      // Cuatro datos de hoy en una línea, en vez de la tarjeta que contaba
      // dónde estabas: eso ya lo hace `orient` en la conversación, y mejor.
      pulso: await pulso.deHoy(),
      // Si el asistente de esta carpeta llega a tener botones. Codex no: RSC no
      // le escribe comandos a ninguno de su familia. Sin esto, la barra
      // enseñaba un hueco y nadie sabía si era que no había o que no iban.
      puedeTenerBotones: donde.puedeTenerBotones(),
      // Cuántos hay de cada cosa, para que el rótulo de su fila lo diga.
      comandos: acciones.todos().length,
      // El apartado de SDD sale solo si esa carpeta construye algo.
      hayProyectos: proyectos.hayAlgo(),
      // Los ayudantes tampoco salen hasta que hay uno.
      hayAgentes: agentes.hayAlguno(),
      modo: disfraz.modoDeEstaVentana(),
      // Si la empresa aún no tiene cara puesta, el panel la ofrece en vez de
      // esperar a que el alumno caiga en contarlo.
      marcaPuesta: Boolean(suya && suya.tokens),
      // Cómo llama el alumno a esto: sale en "lo que sabe de…".
      comoSeLlama: identidad.deQuien(),
      // Como mucho uno, y siempre con un botón que lo resuelve ahí mismo.
      consejo: await this.elConsejoQueToca(),
      // Lo que toca a esta hora, con su botón; y la costumbre que la barra
      // acaba de convertir en recordatorio, dicha una vez (decisión 144).
      recordatorio: await this.elRecordatorioQueToca(),
      costumbrePuesta: await this.ponerLasCostumbres(),
      // Un aviso para Executive Lab que espera a que la persona diga si se
      // manda: lo ha preparado su asistente, la barra al fallar, o ella misma
      // sin poder mandarlo. Como mucho uno; los demás, en Ayuda.
      avisoParaExecutiveLab: this.elAvisoQueToca(),
      // Y lo que pasó con uno que ya mandó: arreglado, o leído (decisión 134).
      arreglado: this.elArregladoQueToca(),
      // La sencilla o la completa de antes, y qué piezas salen en la sencilla
      // (decisión 138). Nada se ha borrado: está apagado.
      barraCompleta: vscode.workspace.getConfiguration().get('executiveLab.barraCompleta') === true,
      piezas: this.lasPiezas(),
      // Para la sencilla: lo que hay en Acciones, la línea de las copias y la versión.
      habilidades: this.habilidadesSuyas(),
      copias: await this.lasCopias(),
      versionDeLaBarra: this.versionDeLaBarra(),
      // Lo nuevo de la versión que acaba de poner. Antes de mirar si hay otra:
      // mirar deja escrito en el almacén que esta barra ya se usaba.
      queTrae: await this.queTraeLaDeAhora(),
      // Con la sesión de GitHub del editor basta; si no la hay, el botón no
      // desaparece — lleva a la guía, que es lo que hace falta cuando no sabes
      // qué es una cuenta de esas.
      puedeSubir: await copias.puedeSubir(),
      // La barra no está en la tienda del editor, y nadie se enteraría de que
      // hay algo mejor. Se mira una vez al día, y se pone solo si la persona
      // pulsa «Actualizar ahora» (decisión 132).
      ...(await this.laVersionQueToca()),
    });
    this.soltarElAviso();
    // Sin esperar: si hay algo que decir, repinta ella sola.
    this.mirarLosArregladosSiToca().catch((error) => this.salida.appendLine(`[avisos] ${error.stack || error.message}`)); // diccionario: interno
    this.ponerLaNuevaSolaSiToca().catch((error) => this.salida.appendLine(`[version] sola: ${error.stack || error.message}`)); // diccionario: interno
  }

  // ── La barra sencilla (decisión 138) ─────────────────────────────────

  // Qué sale en la sencilla. La tabla viaja con la barra; si no se puede leer,
  // todo lo de la sencilla sale y lo demás no: mejor de más que una pantalla vacía.
  lasPiezas() {
    try {
      return JSON.parse(fs.readFileSync(path.join(this.contexto.extensionPath, 'media', 'piezas.json'), 'utf8'));
    } catch (error) {
      this.salida.appendLine(`[piezas] ${error.message}`); // diccionario: interno
      return { tarjetaUnica: true, documentos: true, acciones: true, ayuda: true, copias: true, pie: true };
    }
  }

  // Las suyas: las del catálogo que ha añadido y las que ha escrito; no las
  // que el arnés monta para funcionar.
  habilidadesSuyas() {
    try {
      return rsc.habilidadesEnDisco().filter((id) => !nombres.esFontaneria(id)).length;
    } catch {
      return 0;
    }
  }

  // La línea de las copias: solo si la carpeta las tiene.
  async lasCopias() {
    try {
      const [ultima] = await copias.copias(1);
      if (!ultima) return null;
      const hace = copias.haceUnRato(ultima.cuando);
      const subir = Boolean(await copias.puedeSubir()) || Boolean(await github.remoto());
      return { hace, sinGuardar: Boolean(await copias.cambiosSinGuardar()), subir };
    } catch (error) {
      this.salida.appendLine(`[copias] ${error.message}`); // diccionario: interno
      return null;
    }
  }

  // ------------------------------------------------------- la versión

  // La nueva, si la hay y no se apartó con «Ahora no» hace poco; y si ya se
  // puso y falta recargar, eso, que si no el aviso seguiría diciendo que hay una
  // nueva cuando ya está bajada.
  async laVersionQueToca() {
    const laNueva = await version.laNuevaSiHay(this.contexto, this.versionDeLaBarra());
    const nueva = laNueva && laNueva.version;
    const apartada = (this.almacen().get(CLAVE_SILENCIADOS) || {})[`version:${nueva}`];
    const hacePoco = apartada && Date.now() - apartada < VERSION_APARTADA_DURANTE;
    return {
      hayVersionNueva: nueva && (!hacePoco || this.versionPuesta === nueva) ? nueva : null,
      // Una de prueba, para quien se ofreció a probarlas antes (decisión 134).
      versionDePrueba: Boolean(laNueva && laNueva.deprueba),
      versionPuesta: this.versionPuesta || null,
    };
  }

  // ── Lo que trae la que acaba de poner ─────────────────────────────────
  //
  // Una vez, al abrir una versión más nueva que la última que vio (decisión
  // 134). La primera vez que se abre la barra no hay nada con qué comparar: si
  // ya se usaba antes —una de antes de esto dejó apuntado cuándo miró si había
  // versión nueva—, viene de una más vieja y se le enseña; si no, es una
  // instalación nueva y se calla.
  async queTraeLaDeAhora() {
    try {
      const actual = this.versionDeLaBarra();
      if (!actual) return null;
      const almacen = this.contexto.globalState;
      let vista = almacen.get(CLAVE_VERSION_VISTA);
      if (!vista) {
        vista = this.yaSeUsaba ? '0.0.0' : actual;
        await almacen.update(CLAVE_VERSION_VISTA, vista);
      }
      if (!version.esMasNueva(actual, vista)) return null;
      return { version: actual, cosas: await version.queTrae(this.contexto, actual) };
    } catch (error) {
      this.salida.appendLine(`[version] qué trae: ${error.stack || error.message}`); // diccionario: interno
      return null;
    }
  }

  async yaLoHeVisto() {
    await this.contexto.globalState.update(CLAVE_VERSION_VISTA, this.versionDeLaBarra());
    return this.refrescar(true);
  }

  // Quien quiera, recibe también las de prueba. Lo recordado del otro canal no
  // vale: se vuelve a mirar al pintar.
  async probarAntes(si) {
    try {
      await vscode.workspace.getConfiguration().update(version.AJUSTE_PROBAR_ANTES, si === true, vscode.ConfigurationTarget.Global);
    } catch (error) {
      // Unos ajustes del editor rotos, o de solo lectura (revisión).
      this.salida.appendLine(`[version] no se guarda probar antes: ${error.message}`); // diccionario: interno
      return this.enviar({ tipo: 'aviso', texto: 'No he podido guardar el ajuste. Pulsa «Algo va mal» y pásale el código a tu tutor.', malo: true });
    }
    await this.contexto.globalState.update(version.CLAVE, undefined);
    return this.verAyuda();
  }

  // ── Sola (decisión 136) ───────────────────────────────────────────────
  //
  // Con «Que se ponga al día sola» encendido, que es como viene: al ver que hay
  // una más nueva, se baja, se comprueba y se pone, sin esperar a nadie y sin
  // pantalla de espera. Al terminar, la tarjeta dice que ya está puesta, con
  // «Recargar ahora». Si no se puede, se queda el botón de siempre y no se
  // vuelve a intentar sola hasta la próxima vez que se abra el editor.
  async ponerLaNuevaSolaSiToca() {
    if (!version.actualizarSola() || this.poniendoLaNueva) return;
    const actual = this.versionDeLaBarra();
    if (!actual) return;
    const laNueva = await version.laNuevaSiHay(this.contexto, actual);
    if (!laNueva || laNueva.version === this.versionPuesta || laNueva.version === this.solaNoPudo) return;
    this.poniendoLaNueva = true;
    let hecho;
    try {
      hecho = await version.ponerLaNueva(this.contexto, actual);
    } finally {
      this.poniendoLaNueva = false;
    }
    this.salida.appendLine(`[version] sola: ${hecho.ok ? `puesta la ${hecho.version}` : `no se ha puesto${hecho.version ? ` la ${hecho.version}` : ''}: ${hecho.motivo}${hecho.detalle ? ` (${hecho.detalle})` : ''}`}`); // diccionario: interno
    if (hecho.ok) {
      this.versionPuesta = hecho.version;
      await this.repintarLoQueHaya();
    } else if (hecho.motivo !== 'yaEstaAlDia') {
      this.solaNoPudo = laNueva.version;
    }
  }

  async actualizarSola(si) {
    try {
      await vscode.workspace.getConfiguration().update(version.AJUSTE_SOLA, si === true, vscode.ConfigurationTarget.Global);
    } catch (error) {
      this.salida.appendLine(`[version] no se guarda actualizar sola: ${error.message}`); // diccionario: interno
      return this.enviar({ tipo: 'aviso', texto: 'No he podido guardar el ajuste. Pulsa «Algo va mal» y pásale el código a tu tutor.', malo: true });
    }
    return this.verAyuda();
  }

  // Desde el botón: bajarla, comprobarla e instalarla es de `version.js`.
  async ponerLaNueva() {
    // Un doble clic serían dos descargas escribiendo en el mismo fichero.
    if (this.poniendoLaNueva) return undefined;
    this.poniendoLaNueva = true;
    try {
      return await this.ponerLaNuevaYa();
    } finally {
      this.poniendoLaNueva = false;
    }
  }

  async ponerLaNuevaYa() {
    this.enviar({ tipo: 'esperando', que: 'Bajando la versión nueva…' });
    const hecho = await version.ponerLaNueva(this.contexto, this.versionDeLaBarra());
    this.salida.appendLine(`[version] ${hecho.ok ? `puesta la ${hecho.version}` : `no se ha puesto${hecho.version ? ` la ${hecho.version}` : ''}: ${hecho.motivo}${hecho.detalle ? ` (${hecho.detalle})` : ''}`}`); // diccionario: interno
    if (hecho.ok) {
      this.versionPuesta = hecho.version;
      await this.refrescar(true);
      return this.enviar({
        tipo: 'aviso',
        texto: `Ya está puesta la ${hecho.version}. Recarga la ventana para empezar a usarla: no se pierde nada.`,
        boton: { etiqueta: 'Recargar ahora', accion: { tipo: 'recargar' } },
      });
    }
    await this.refrescar(true);
    if (hecho.motivo === 'yaEstaAlDia') return this.enviar({ tipo: 'aviso', texto: 'Ya tienes la última.' });
    // De repuesto, la página: es lo que había antes, y con un fallo de aquí
    // sigue sirviendo a quien le ayude.
    return this.enviar({
      tipo: 'aviso',
      texto: 'No he podido ponerla. Pulsa «Algo va mal» y pásale el código a tu tutor.',
      malo: true,
      boton: { etiqueta: 'Abrir su página', accion: { tipo: 'bajarLaNueva' } },
    });
  }

  // ------------------------------------------------------- los consejos

  // El almacén de esta carpeta: lo que se ha ido pidiendo y lo que el alumno
  // apartó con "ahora no". No se ve, no se versiona y no sale de aquí.
  almacen() {
    return this.contexto.workspaceState || this.contexto.globalState;
  }

  // Lo que el alumno ya tiene escrito, todo junto: de ahí se saca qué le
  // vendría bien. No se manda a ninguna parte; se lee aquí y se tira.
  corpus() {
    return [
      identidad.objetivo(),
      identidad.deQuien(),
      cerebro.catalogo().map((t) => `${t.etiqueta} ${t.descripcion || ''} ${t.articulos.map((a) => `${a.titulo} ${a.resumen}`).join(' ')}`).join(' '),
      acciones.acciones().map((a) => a.etiqueta).join(' '),
      conexiones.proveedores().map((p) => p.etiqueta).join(' '),
      cerebro.loQueAunNoSabe(5).join(' '),
    ].join(' ');
  }

  // Lo que la barra puede ver por sí misma leyendo el disco. Lo usan dos: el
  // consejo suelto de la pantalla principal —como mucho uno— y la pantalla de
  // sugerencias, que los enseña todos. Antes esto vivía dentro del primero, así
  // que el segundo no habría podido existir sin copiarlo.
  async queVeoYo() {
    const [ultima] = await copias.copias(1);
    return {
      esperando: cerebro.esperandoLectura(),
      esperandoDesdeHace: cerebro.esperandoDesdeHace(),
      conexionesAMedias: conexiones.proveedores().filter((p) => p.faltan > 0),
      diasSinCopia: ultima ? Math.floor((Date.now() - new Date(ultima.cuando).getTime()) / 86400000) : null,
      cambiosSinGuardar: await copias.cambiosSinGuardar(),
      peticiones: this.almacen().get(CLAVE_PETICIONES) || [],
      corpus: this.corpus(),
      yaInstaladas: rsc.habilidadesPuestas(),
      catalogo: consejos.capacidades(this.contexto.extensionPath),
      // Uno basta para el consejo suelto; la pantalla de sugerencias los
      // enseña todos, así que aquí se piden unos cuantos.
      huecos: cerebro.loQueAunNoSabe(4),
      silenciados: this.almacen().get(CLAVE_SILENCIADOS) || {},
      // Lo que el asistente apuntó tras trabajar y nadie leía (decisión 102).
      huecosDeAutomatizacion: consejos.huecosDeAutomatizacion(),
    };
  }

  async elConsejoQueToca() {
    try {
      if (!proyecto.arnesCompleto()) return null;
      return consejos.elQueToca(await this.queVeoYo());
    } catch (error) {
      // Un consejo es un extra: si falla, la barra sigue funcionando igual.
      this.salida.appendLine(`[consejos] ${error.stack || error.message}`);
      return null;
    }
  }

  async ahoraNo(id) {
    const silenciados = { ...(this.almacen().get(CLAVE_SILENCIADOS) || {}), [id]: Date.now() };
    await this.almacen().update(CLAVE_SILENCIADOS, silenciados);
    return this.refrescar(true);
  }

  // Añadir una habilidad del catálogo (`rsc add`), sin que el alumno vea nada
  // de esto. Se nombra por su nombre —«Facturación»— y se le dice cómo se
  // invoca, que con Claude es escribir `/su-identificador`.
  async aprenderCapacidad(id, nombre) {
    this.enviar({ tipo: 'esperando', que: `Añadiendo ${nombre}…` });
    const { ok } = await rsc.anadir(id);
    await this.refrescar(true);
    this.enviar({
      tipo: 'aviso',
      texto: ok
        ? `${nombre} ya está puesta. Se pide con ${saberes.comoSePide(id)}.`
        : 'No he podido añadirla. Pulsa «Algo va mal» y pásale el código a tu tutor.',
      malo: !ok,
    });
  }

  async manejar(mensaje) {
    const rutas = {
      listo: () => this.refrescar(),
      refrescar: () => this.refrescar(true),
      volver: () => this.refrescar(),
      pedir: () => this.pedir(mensaje.prompt),
      dejarLaClaveAsi: () => this.dejarLaClaveAsi(mensaje.proveedor, mensaje.huella),
      hacerElRecordatorio: () => this.hacerElRecordatorio(mensaje.nombre),
      ahoraNoRecordatorio: () => this.dejarElRecordatorio(mensaje.nombre),
      quitarRecordatorio: () => this.quitarRecordatorio(mensaje.nombre),
      entendidaLaCostumbre: () => this.dejarDeDecirLaCostumbre(mensaje.nombre, false),
      noHaceFaltaLaCostumbre: () => this.dejarDeDecirLaCostumbre(mensaje.nombre, true),
      conversacionNueva: () => this.conversacionNueva(),
      pedirAyudaEnElForo: () => this.pedirAyudaEnElForo(),
      abrir: () => vscode.env.openExternal(vscode.Uri.parse(mensaje.url)),
      bajarLaNueva: () => vscode.env.openExternal(version.dondeBajarla()),
      verLaRelease: () => vscode.env.openExternal(version.dondeVerla(this.versionDeLaBarra())),
      yaLoHeVisto: () => this.yaLoHeVisto(),
      probarAntes: () => this.probarAntes(mensaje.cual),
      actualizarSola: () => this.actualizarSola(mensaje.cual),
      yaLoSe: () => this.yaLoSe(mensaje.numero),
      ponerLaNueva: () => this.ponerLaNueva(),
      recargar: () => vscode.commands.executeCommand('workbench.action.reloadWindow'),

      verConexiones: () => this.verConexiones(),
      verConexion: () => this.verConexion(mensaje.proveedor),
      guardarClave: () => this.guardarClave(mensaje.proveedor, mensaje.clave, mensaje.valor),
      pasoDeLaGuia: () => this.pasoDeLaGuia(mensaje.proveedor, mensaje.paso, mensaje.todos),
      probar: () => this.probar(mensaje.proveedor),
      hacerCosita: () => this.hacerCosita(mensaje.proveedor, mensaje.fichero, mensaje.etiqueta, mensaje.pideDatos),

      buscar: () => this.buscar(mensaje.texto, mensaje.donde),
      verCerebro: () => this.verCerebro(),
      verTema: () => this.verTema(mensaje.tema),
      leerArticulo: () => this.leerArticulo(mensaje.ruta, mensaje.tema, mensaje.desde),
      abrirFuera: () => this.abrirFuera(mensaje.ruta),
      cambiarArticulo: () => this.pedir(`Quiero cambiar lo que sabes sobre "${mensaje.titulo}". Ábrelo, enséñame qué dice y pregúntame qué hay que corregir.`),
      anadirDocumentos: () => this.anadirDocumentos(),
      soltarDocumentos: () => this.soltarDocumentos(mensaje.ficheros, mensaje.para),
      abrirPanelCompleto: () => cerebro.abrirPanel(),

      verCopias: () => this.verCopias(),
      guardarCopia: () => this.guardarCopia(),
      subirCopia: () => this.subirCopia(),
      volverA: () => this.volverA(mensaje.id),

      algoVaMal: () => this.algoVaMal(),
      verContar: () => this.verContar(),
      contar: () => this.contar(mensaje.cual),
      contarLaIncidencia: () => this.contarLaIncidencia(),
      verElAviso: () => this.verElAviso(mensaje.fichero),
      mandarElAviso: () => this.mandarElAviso(mensaje.texto, mensaje.titulo),
      noMandarElAviso: () => this.noMandarElAviso(),
      resolverIncidencia: () => this.resolverIncidencia(mensaje.cual),
      verElInforme: () => this.verElInforme(mensaje.fichero),
      arreglar: () => this.arreglar(),
      arrancar: () => this.arrancar(),
      instalarGit: () => this.instalarGit(),
      ponerCopias: () => this.ponerCopias(),
      arreglarElRelevo: () => this.arreglarElRelevo(),
      ponerElFreno: () => this.ponerElFreno(),
      ponerElBloque: () => this.ponerElBloque(),
      conectarGitHub: () => this.conectarGitHub(),
      verCopiaFuera: () => this.verCopiaFuera(),
      verRadiografia: () => this.verRadiografia(),
      guardarLaRevision: () => this.guardarLaRevision(),
      verSaberes: () => this.verSaberes(),
      verSalidas: () => this.verSalidas(),
      verHuecos: () => this.verHuecos(),
      verPapeles: () => this.verPapeles(),
      abrirPapel: () => this.abrirPapel(mensaje.ruta),
      quitarPapel: () => this.quitarPapel(mensaje.ruta, mensaje.nombre),
      verAyuda: () => this.verAyuda(),
      verReglas: () => this.verReglas(),
      abrirReglas: () => this.abrirReglas(mensaje.cual),
      abrirRevision: () => this.abrirRevision(mensaje.fichero),
      ponerLosRailesAlDia: () => this.ponerLosRailesAlDia(),
      verAsistente: () => this.verAsistente(),
      verComoTrabaja: () => this.verComoTrabaja(),
      verFijadas: () => this.verFijadas(),
      verLaCara: () => this.verLaCara(),
      verProyectos: () => this.verProyectos(),
      verSugerencias: () => this.verSugerencias(),
      verComandos: () => this.verComandos(),
      verAgentes: () => this.verAgentes(),
      verAgente: () => this.verAgente(mensaje.fichero),
      verProyecto: () => this.verProyecto(mensaje.fichero),
      materialDeMarca: () => this.materialDeMarca(),
      quitarLaCara: () => this.quitarLaCara(),
      fijar: () => this.cambiarFijada(fijadas.fijar, mensaje.cual),
      soltar: () => this.cambiarFijada(fijadas.soltar, mensaje.cual),
      ponerPermiso: () => this.cambiarAjuste(ajustes.ponerPermiso, mensaje.cual),
      ponerCadaCuanto: () => this.cambiarAjuste(ajustes.ponerCadaCuanto, mensaje.cual),
      elegirAsistente: () => this.elegirAsistente(mensaje.cual),
      verDiario: () => this.verDiario(),
      verSesion: () => this.verSesion(mensaje.fichero),
      verTrato: () => this.verTrato(),
      ponerPalabras: () => this.ponerPalabras(mensaje.cual),
      abrirSalida: () => this.abrirSalida(mensaje.herramienta, mensaje.fichero),
      guardarSalida: () => this.guardarSalida(mensaje.herramienta, mensaje.fichero),
      abrirCarpetaDeSalida: () => salidas.abrirLaCarpeta(mensaje.herramienta),
      ponerLaCara: () => this.ponerLaCara(),
      elegirCarpeta: () => this.elegirCarpeta(),
      // La salida de una carpeta que no se prepara: una nueva, dentro de la
      // personal (B1).
      crearCarpeta: () => arrancar.crearUnaCarpetaDentro(os.homedir(), this.salida),
      abrirAsistente: () => puente.abrirConversacion(),
      ahoraNo: () => this.ahoraNo(mensaje.id),
      aprenderCapacidad: () => this.aprenderCapacidad(mensaje.capacidad, mensaje.nombre),
      verEditorCompleto: () => this.verEditorCompleto(),
      modoSencillo: () => this.modoSencillo(),
    };

    const accion = rutas[mensaje.tipo];
    if (!accion) return;

    if (ESCRIBEN_CON_EL_ARNES.has(mensaje.tipo) && rsc.vaPorDelante()) return this.enviar({ tipo: 'aviso', texto: POR_DELANTE });
    if (LOS_DEL_ARNES.has(mensaje.tipo)) {
      // Mientras la barra arregla sola, un segundo arreglo pisaría al primero
      // sobre los mismos ficheros (revisión de corrección, 5 y 6).
      if (this.arreglandoSolo) return this.enviar({ tipo: 'aviso', texto: OCUPADA });
      // Y quien pulsa uno da la carpeta por conocida: desde ahí, lo que se
      // pueda se hace solo al abrirla (P9; revisión de seguridad, H2).
      await this.darPorConocida();
    }

    try {
      await accion();
    } catch (error) {
      // Nada de excepciones en crudo: el alumno ve una frase y una salida.
      this.salida.appendLine(`[${mensaje.tipo}] ${error.stack || error.message}`);
      // Esto es un fallo de la barra, no del alumno, y a Jose no le llegaba
      // nunca. Se deja apuntado para Executive Lab; sale solo si la persona
      // lo ve y dice que sí (decisión 131).
      avisos.apuntarUnFallo({ accion: mensaje.tipo, error, lineas: this.salida.ultimas ? this.salida.ultimas() : [] });
      this.enviar({ tipo: 'aviso', texto: 'Algo no ha ido bien. Pulsa «Algo va mal» y pásale el código a tu tutor.', malo: true });
    }
  }

  async pedir(prompt) {
    // Un botón sin texto no se manda. Parece de cajón y no lo era: un botón mal
    // montado le escribió a Jose la palabra "undefined" en su conversación,
    // porque `encodeURIComponent(undefined)` es la cadena "undefined" y el
    // enlace la entregó tan contento. Lo que llegue vacío se queda aquí, se
    // apunta con nombre y apellidos, y se dice que algo va mal.
    if (typeof prompt !== 'string' || !prompt.trim()) {
      this.salida.appendLine(`[pedir] un botón ha mandado un texto que no vale: ${JSON.stringify(prompt)}`); // diccionario: interno
      this.enviar({ tipo: 'aviso', texto: 'Ese botón está mal montado. Pulsa «Algo va mal» y pásale el código a tu tutor.', malo: true });
      return;
    }

    await this.anotarLaPeticion(prompt);
    await this.anotarElUso(prompt);
    const como = await puente.enviar(prompt, this.salida);
    // No se dice "se lo he pedido": los dos comandos de Claude dejan el texto
    // escrito en su caja y no lo envían (asistentes.js lo documenta). Decir que
    // ya se lo hemos pedido dejaba a la persona esperando una respuesta que no
    // iba a llegar hasta que ella misma le diera a enviar.
    if (como === 'directo') this.enviar({ tipo: 'aviso', texto: 'Te lo he dejado escrito en la conversación. Dale a enviar.' });
  }

  // Ayuda › Conversación nueva. Con Codex no hay comando para eso: se abre su
  // barra y se dice dónde está el botón.
  async conversacionNueva() {
    const quien = asistentes.elDeAhora();
    if (!asistentes.estaInstalado(quien)) return this.sinAsistente(quien);
    if (await puente.conversacionNueva()) return this.enviar({ tipo: 'aviso', texto: 'Te he abierto una conversación nueva.' });
    if (!await puente.abrirConversacion()) {
      return this.enviar({ tipo: 'aviso', texto: `No he podido abrir ${quien.nombre}. Pulsa «Algo va mal» y pásale el código a tu tutor.`, malo: true });
    }
    return this.enviar({ tipo: 'aviso', texto: `Te he abierto ${quien.nombre}. Para empezar una conversación nueva, pulsa el «+» de arriba de su ventana.` });
  }

  // Sin el asistente no hay con quién hablar: ni se abre nada ni se manda
  // esperar una respuesta que no va a llegar.
  sinAsistente(quien) {
    return this.enviar({ tipo: 'aviso', texto: `${quien.nombre} no está en este ordenador. Díselo a tu tutor.`, malo: true });
  }

  // Ayuda › Pedir ayuda en el foro. El foro tiene muchas puertas, así que no se
  // abre ninguna: el asistente escribe el mensaje y se dice dónde pegarlo
  // (Jose: «solo copiar el mensaje y decir que hay que ir a Resolver dudas en
  // Circle»).
  async pedirAyudaEnElForo() {
    const quien = asistentes.elDeAhora();
    if (!asistentes.estaInstalado(quien)) return this.sinAsistente(quien);
    const como = await puente.enviar(PEDIR_AYUDA_EN_EL_FORO, this.salida);
    const donde = 'Cuando te conteste, copia el mensaje y pégalo en «Resolver dudas», en Circle.';
    if (como === 'directo') return this.enviar({ tipo: 'aviso', texto: `Te lo he dejado escrito en la conversación: dale a enviar. ${donde}` });
    if (como === 'copiado') return this.enviar({ tipo: 'aviso', texto: donde });
    return this.enviar({ tipo: 'aviso', texto: 'No he podido hablar con el asistente. Pulsa «Algo va mal» y pásale el código a tu tutor.', malo: true });
  }

  // ── Los recordatorios (decisión 144) ──────────────────────────────────

  // Cuándo se pulsó cada botón (una habilidad o un comando, `/x` o `$x`): de ahí
  // sale la costumbre. Solo el nombre y la hora, en su ordenador.
  async anotarElUso(prompt) {
    const m = String(prompt || '').trim().match(/^[/$]([a-z0-9][a-z0-9-]*)$/i);
    if (!m || !acciones.acciones().some((b) => b.nombre === m[1])) return;
    const antes = this.almacen().get(CLAVE_USOS) || [];
    await this.almacen().update(CLAVE_USOS, [...antes, { nombre: m[1], t: Date.now() }].slice(-200));
  }

  // Los que tocan, del más antiguo al más nuevo. La principal enseña uno; el
  // aviso del editor sale para cada uno, una vez.
  async losRecordatoriosQueTocan() {
    try {
      const hechos = { ...(this.almacen().get(CLAVE_RECORDATORIOS) || {}) };
      const vistos = { ...(this.almacen().get(CLAVE_RECORDATORIOS_VISTOS) || {}) };
      const { tocan, nuevos } = recordatorios.losQueTocan(hechos, vistos);
      if (nuevos.length) {
        for (const { nombre, cuando: cron } of nuevos) {
          hechos[nombre] = Date.now();
          vistos[nombre] = cron;
        }
        await this.almacen().update(CLAVE_RECORDATORIOS, hechos);
        await this.almacen().update(CLAVE_RECORDATORIOS_VISTOS, vistos);
      }
      return tocan.map((t) => ({ nombre: t.nombre, etiqueta: t.etiqueta, enPalabras: t.enPalabras, ultima: t.ultima }));
    } catch (error) {
      this.salida.appendLine(`[recordatorios] ${error.message}`); // diccionario: interno
      return [];
    }
  }

  async elRecordatorioQueToca() {
    return (await this.losRecordatoriosQueTocan())[0] || null;
  }

  // P9: si un botón se pulsa con costumbre, se pone su recordatorio sin
  // preguntar —se quita con un clic— y se dice una vez. Una costumbre que el
  // alumno dijo que no hacía falta no vuelve a ponerse.
  async ponerLasCostumbres() {
    try {
      const puestas = { ...(this.almacen().get(CLAVE_COSTUMBRES) || {}) };
      for (const c of recordatorios.costumbres(this.almacen().get(CLAVE_USOS) || [])) {
        if (puestas[c.nombre]) continue;
        const hecho = recordatorios.ponerCuando(c.nombre, c.cron);
        if (!hecho.ok) continue;
        puestas[c.nombre] = { cron: c.cron, etiqueta: c.etiqueta, enPalabras: c.enPalabras, porDecir: true };
        // Empieza a contar desde ahora: hoy ya lo ha hecho él.
        await this.almacen().update(CLAVE_RECORDATORIOS, { ...(this.almacen().get(CLAVE_RECORDATORIOS) || {}), [c.nombre]: Date.now() });
        this.salida.appendLine(`[recordatorios] puesto por costumbre: ${c.nombre} (${c.cron})`); // diccionario: interno
      }
      await this.almacen().update(CLAVE_COSTUMBRES, puestas);
      const [nombre, dicha] = Object.entries(puestas).find(([, p]) => p.porDecir) || [];
      return nombre ? { nombre, etiqueta: dicha.etiqueta, enPalabras: dicha.enPalabras } : null;
    } catch (error) {
      this.salida.appendLine(`[recordatorios] ${error.message}`); // diccionario: interno
      return null;
    }
  }

  async marcarHecho(nombre) {
    await this.almacen().update(CLAVE_RECORDATORIOS, { ...(this.almacen().get(CLAVE_RECORDATORIOS) || {}), [nombre]: Date.now() });
  }

  async hacerElRecordatorio(nombre) {
    const uno = recordatorios.losQueHay().find((r) => r.nombre === nombre);
    await this.marcarHecho(nombre);
    if (!uno) return this.refrescar(true);
    await this.pedir(uno.prompt);
    return this.refrescar(true);
  }

  async dejarElRecordatorio(nombre) {
    await this.marcarHecho(nombre);
    return this.refrescar(true);
  }

  async quitarRecordatorio(nombre) {
    const hecho = recordatorios.ponerCuando(nombre, null);
    // Lo que se quita no vuelve por costumbre, venga de donde venga; y si se
    // vuelve a poner, empieza a contar desde entonces.
    const puestas = { ...(this.almacen().get(CLAVE_COSTUMBRES) || {}) };
    puestas[nombre] = { ...(puestas[nombre] || {}), quitado: true, porDecir: false };
    await this.almacen().update(CLAVE_COSTUMBRES, puestas);
    const vistos = { ...(this.almacen().get(CLAVE_RECORDATORIOS_VISTOS) || {}) };
    delete vistos[nombre];
    await this.almacen().update(CLAVE_RECORDATORIOS_VISTOS, vistos);
    if (this.donde && this.donde.tipo === 'quieto') await this.verSaberes();
    else await this.refrescar(true);
    return this.enviar({ tipo: 'aviso', texto: hecho.ok ? `Ya no te recordaré «${hecho.boton.etiqueta}».` : 'No he podido quitar ese recordatorio. Pulsa «Algo va mal» y pásale el código a tu tutor.', malo: !hecho.ok });
  }

  async dejarDeDecirLaCostumbre(nombre, quitarla) {
    const puestas = { ...(this.almacen().get(CLAVE_COSTUMBRES) || {}) };
    if (puestas[nombre]) puestas[nombre] = { ...puestas[nombre], porDecir: false };
    await this.almacen().update(CLAVE_COSTUMBRES, puestas);
    if (quitarla) return this.quitarRecordatorio(nombre);
    return this.refrescar(true);
  }

  // Cada minuto, desde `activate`: si ha llegado la hora de uno, se dice una vez
  // aunque la barra esté cerrada, y la principal lo enseña con su botón.
  async mirarLosRecordatorios() {
    const avisados = { ...(this.almacen().get(CLAVE_AVISADOS) || {}) };
    const sinAvisar = (await this.losRecordatoriosQueTocan()).filter((t) => avisados[t.nombre] !== t.ultima);
    if (!sinAvisar.length) return;
    for (const t of sinAvisar) avisados[t.nombre] = t.ultima;
    await this.almacen().update(CLAVE_AVISADOS, avisados);
    if (!this.donde || this.donde.tipo === 'principal') await this.refrescar(true);
    // Sin esperar a uno para enseñar el siguiente: cada aviso, con su botón.
    await Promise.all(sinAvisar.map(async (t) => {
      const quiere = await vscode.window.showInformationMessage(`Toca: ${t.etiqueta}.`, 'Hacerlo ahora');
      if (quiere === 'Hacerlo ahora') await this.hacerElRecordatorio(t.nombre);
    }));
  }

  // Se guardan las últimas peticiones para poder ver cuál se repite y ofrecer
  // dejarla como botón. Solo el texto que el alumno ya ha mandado, aquí, en su
  // ordenador: ni se envía ni se versiona.
  async anotarLaPeticion(prompt) {
    if (!prompt || prompt.startsWith('/')) return; // un botón ya es un botón
    const antes = this.almacen().get(CLAVE_PETICIONES) || [];
    await this.almacen().update(CLAVE_PETICIONES, [...antes, prompt].slice(-20));
  }

  // ------------------------------------------------------- conexiones

  verConexiones() {
    this.donde = { tipo: 'conexiones' };
    this.enviar({
      tipo: 'conexiones',
      // Cada una, con cómo fue su última prueba, si sus claves no han cambiado.
      proveedores: conexiones.proveedores().map((p) => ({ ...p, prueba: this.laUltimaPrueba(p.id) })),
      // Si el arnés se montó sobre un proyecto que ya existía, puede haber
      // claves guardadas donde estuvieran. Aquí no se leen: se avisa.
      sueltas: sueltas.resumen(),
      // Las de una aplicación están en su sitio, pero si ya se guardaron en git
      // viajan con cada copia: eso se dice aparte (decisión 135).
      enLasCopias: sueltas.deLasAppsEnLasCopias(),
    });
  }

  verConexion(proveedor, aviso = null) {
    const datos = conexiones.claves(proveedor);
    if (!datos) return this.verConexiones();
    this.donde = { tipo: 'conexion', proveedor };
    // Conecta con una clave que puede escribir y no ha dicho qué hace: la pregunta
    // sigue aquí, también si se fue mientras se probaba (revisión del punto 7).
    if (!aviso) {
      const ultima = this.laUltimaPrueba(proveedor);
      if (ultima && ultima.puedeEscribir) aviso = this.loQueDijoLaPrueba(proveedor, { ok: true, puedeEscribir: true, mensaje: ultima.mensaje, huella: conexiones.huella(proveedor) });
    }
    const desordenadas = sueltas.resumen();
    const guia = (this.guias || {})[proveedor] || {};
    return this.enviar({
      tipo: 'conexion',
      ...datos,
      // Por qué paso de la guía va, o si quiere verlos todos (decisión 146).
      paso: Math.min(Math.max(Number(guia.paso) || 0, 0), Math.max(datos.proveedor.pasos.length - 1, 0)),
      todosLosPasos: Boolean(guia.todos),
      cositas: conexiones.scripts(proveedor),
      // Si alguna clave de esta conexión está en otro sitio, el botón que lo
      // arregla va aquí mismo, que es donde se ve el problema (decisión 104).
      ordenar: desordenadas ? desordenadas.prompt : null,
      aviso,
    });
  }

  // Guardar, y si ya están todas, probarla sin que nadie lo pida (P9): lo
  // siguiente que haría el alumno es pulsar «Probar», y lo que necesita saber
  // es si funciona (decisión 146).
  async guardarClave(proveedor, clave, valor) {
    const { ok, mensaje } = conexiones.escribir(proveedor, clave, valor);
    if (!ok) return this.verConexion(proveedor, { texto: mensaje, malo: true });
    const datos = conexiones.claves(proveedor);
    const faltan = datos ? datos.claves.filter((c) => !c.puesta).length : 0;
    if (faltan || !conexiones.tienePrueba(proveedor)) {
      return this.verConexion(proveedor, { texto: faltan ? `Guardada. ${faltan === 1 ? 'Falta 1 por poner.' : `Faltan ${faltan} por poner.`}` : mensaje, malo: false });
    }
    this.enviar({ tipo: 'esperando', que: 'Guardada. Probando la conexión…' });
    const prueba = await this.probarYApuntar(proveedor);
    // Si mientras tanto se fue a otra pantalla, no se le devuelve: lo que salió
    // ya está apuntado y la lista lo dice.
    const sigueAqui = this.donde && this.donde.tipo === 'conexion' && this.donde.proveedor === proveedor;
    if (!sigueAqui) return this.donde && this.donde.tipo === 'conexiones' ? this.verConexiones() : undefined;
    const aviso = this.loQueDijoLaPrueba(proveedor, prueba);
    return this.verConexion(proveedor, { ...aviso, texto: `Guardada. ${aviso.texto}` });
  }

  async probar(proveedor) {
    this.enviar({ tipo: 'esperando', que: 'Probando la conexión…' });
    const hecho = await this.probarYApuntar(proveedor);
    this.verConexion(proveedor, this.loQueDijoLaPrueba(proveedor, hecho));
  }

  // Lo que se dice de una prueba. Si conecta y la clave puede cambiar y borrar,
  // se pregunta una vez, con las dos salidas: lo decide su negocio (P9, «loDecide»).
  // Si ya eligió dejarla así, se dice sin preguntar, mientras sea esa clave.
  loQueDijoLaPrueba(proveedor, hecho) {
    if (!hecho.puedeEscribir) return { texto: hecho.mensaje, malo: !hecho.ok };
    if (this.laDejoAsi(proveedor)) return { texto: 'Conectado. Funciona. Esta clave puede cambiar y borrar, como elegiste.', malo: false };
    const datos = conexiones.claves(proveedor);
    // Recortado: sale de la primera línea de su README, que puede escribir cualquiera.
    const nombre = String((datos && datos.proveedor && datos.proveedor.etiqueta) || proveedor).slice(0, 60);
    return {
      texto: `${hecho.mensaje} ¿La dejas así o la cambias por una de solo lectura?`,
      malo: false,
      botones: [
        // Con la huella de la clave que se probó: si cambia antes del clic, no vale.
        { etiqueta: 'Dejarla así', accion: { tipo: 'dejarLaClaveAsi', proveedor, huella: hecho.huella || conexiones.huella(proveedor) } },
        { etiqueta: 'Cambiarla por una de solo lectura', accion: { tipo: 'pedir', prompt: `La conexión con ${nombre} (01-TOOLS/${proveedor}/) funciona, pero su clave puede cambiar y borrar, y quiero una de solo lectura. Guíame paso a paso para sacarla en ${nombre}: mira su CREDENTIALS.md y la documentación oficial, y dime qué permisos marcar y cuáles no. Cuando la tenga, la pego en la barra, en esta conexión, y la barra la prueba.` } }, // diccionario: interno
      ],
    };
  }

  laDejoAsi(proveedor) {
    const huella = conexiones.huella(proveedor);
    return Boolean(huella) && (this.almacen().get(CLAVE_PUEDEN_ESCRIBIR) || {})[proveedor] === huella;
  }

  async dejarLaClaveAsi(proveedor, laProbada) {
    const huella = conexiones.huella(proveedor);
    if (!huella) return this.verConexiones();
    // La clave cambió entre la pregunta y el clic: esa no se ha probado.
    if (laProbada !== huella) return this.verConexion(proveedor, { texto: 'La clave ha cambiado desde la prueba. Pulsa «Probar la conexión» otra vez.', malo: false });
    await this.almacen().update(CLAVE_PUEDEN_ESCRIBIR, { ...(this.almacen().get(CLAVE_PUEDEN_ESCRIBIR) || {}), [proveedor]: huella });
    return this.verConexion(proveedor, { texto: 'Hecho. Mientras sea esta clave, no te lo vuelvo a preguntar.', malo: false });
  }

  async probarYApuntar(proveedor) {
    // La huella de las claves que se prueban, de antes: si cambian mientras la
    // prueba corre, lo que diga no es de las nuevas.
    const huella = conexiones.huella(proveedor);
    const hecho = await conexiones.probar(proveedor);
    // Lo pasajero —sin internet, no contesta— no dice nada de la conexión: no
    // se recuerda, y se queda lo que hubiera.
    if (hecho.pasajero) return hecho;
    const pruebas = { ...(this.almacen().get(CLAVE_PRUEBAS) || {}) };
    pruebas[proveedor] = { ok: hecho.ok, mensaje: hecho.mensaje, cuando: Date.now(), huella, ...(hecho.puedeEscribir ? { puedeEscribir: true } : {}) };
    await this.almacen().update(CLAVE_PRUEBAS, pruebas);
    return { ...hecho, huella };
  }

  // La última prueba, si sus claves siguen como cuando se probó; si no, null.
  laUltimaPrueba(proveedor) {
    const una = (this.almacen().get(CLAVE_PRUEBAS) || {})[proveedor];
    if (!una || una.huella !== conexiones.huella(proveedor)) return null;
    return {
      ok: una.ok,
      mensaje: una.mensaje,
      cuando: copias.haceCuanto(new Date(una.cuando).toISOString()),
      // Conecta, pero la clave puede escribir y no ha dicho qué hace con ella.
      ...(una.puedeEscribir && !this.laDejoAsi(proveedor) ? { puedeEscribir: true } : {}),
    };
  }

  // La guía, de paso en paso. Se recuerda mientras dure la ventana.
  pasoDeLaGuia(proveedor, paso, todos = false) {
    this.guias = { ...(this.guias || {}), [proveedor]: { paso, todos } };
    return this.verConexion(proveedor);
  }

  // Modo mixto: lo que solo mira se ejecuta y se enseña; lo que pide datos o
  // toca algo se lo pedimos al asistente, que pregunta y pide permiso.
  async hacerCosita(proveedor, fichero, etiqueta, pideDatos) {
    if (pideDatos) {
      await this.pedir(`Quiero "${etiqueta}". Usa 01-TOOLS/${proveedor}/${fichero} y pregúntame los datos que te falten.`);
      return;
    }

    this.enviar({ tipo: 'esperando', que: `${etiqueta}…` });
    const hecho = await conexiones.ejecutar(proveedor, fichero);
    if (!hecho.ok) return this.verConexion(proveedor, { texto: hecho.mensaje, malo: true, ...(hecho.boton ? { boton: hecho.boton } : {}) });
    if (!hecho.texto) return this.verConexion(proveedor, { texto: hecho.mensaje, malo: false });
    this.donde = { tipo: 'quieto' };
    return this.enviar({ tipo: 'resultado', titulo: hecho.titulo, texto: hecho.texto, proveedor });
  }

  // ---------------------------------------------------------- cerebro

  verCerebro(aviso = null) {
    this.donde = { tipo: 'cerebro' };
    this.enviar({
      tipo: 'cerebro',
      temas: cerebro.catalogo(),
      sinOrdenar: cerebro.sinOrdenar().slice(0, 8),
      esperando: cerebro.esperandoLectura(),
      yaLeidos: cerebro.yaLeidos(),
      hayPanel: cerebro.hayPanel(),
      aviso,
    });
  }

  verTema(tema) {
    const encontrado = cerebro.catalogo().find((t) => t.id === tema);
    if (!encontrado) return this.verCerebro();
    this.donde = { tipo: 'tema', tema };
    return this.enviar({ tipo: 'tema', tema: encontrado });
  }

  // Buscar es mirar, no conversar: lo resuelve la barra leyendo el disco, sin
  // abrir una conversación ni hacer esperar a nadie (docs/friccion.md §4).
  buscar(texto, donde = null) {
    // Mientras se busca no se repinta por detrás: el vigía borraría lo escrito
    // en la caja a media palabra.
    this.donde = { tipo: 'quieto' };
    return this.enviar({ tipo: 'resultados', ...buscador.buscar(texto, 15, donde) });
  }

  // Se lee dentro del panel: la vista previa de VS Code enseña el frontmatter
  // antes que el texto, y eso es justo lo que aquí no se enseña nunca.
  leerArticulo(ruta, tema, desde) {
    const leido = cerebro.leerArticulo(ruta);
    if (!leido.ok) return this.enviar({ tipo: 'aviso', texto: leido.mensaje, malo: true });
    this.donde = { tipo: 'quieto' };

    // Con qué sigue y con qué venía, dentro del mismo tema: leer una cosa y
    // tener que volver dos pantallas para leer la siguiente es una tontería.
    let hermanos = null;
    if (tema) {
      const lista = cerebro.articulos(tema);
      const i = lista.findIndex((a) => a.ruta === ruta);
      if (i !== -1) {
        hermanos = {
          anterior: i > 0 ? lista[i - 1] : null,
          siguiente: i < lista.length - 1 ? lista[i + 1] : null,
        };
      }
    }

    return this.enviar({ tipo: 'articulo', ...leido, tema, desde, hermanos, ruta });
  }

  async abrirFuera(ruta) {
    const { ok, mensaje } = await cerebro.abrirFuera(ruta);
    if (!ok) this.enviar({ tipo: 'aviso', texto: mensaje, malo: true });
  }

  // Soltados encima de la barra. Llegan ya leídos por el panel, porque el
  // editor no le da la ruta de lo que se suelta — y hace bien.
  async soltarDocumentos(ficheros, para = 'documentos') {
    if (!ficheros || !ficheros.length) return this.refrescar();

    // Arrastrado encima de la pantalla de la marca, el material va a su
    // carpeta: es lo que el asistente mira para sacar los colores, y en la
    // bandeja de documentos se mezclaría con las facturas.
    if (para === 'marca') {
      const puesto = tema.guardarSoltado(ficheros);
      if (!puesto.ok) return this.verLaCara({ texto: puesto.mensaje, malo: true });
      await puente.enviar(tema.queLePedimos({ web: tema.comoEstamos().web, puestos: puesto.puestos }));
      return this.verLaCara({ texto: `${puesto.mensaje} Se lo he pasado al asistente.`, malo: false });
    }

    const { ok, cuantos, mensaje } = cerebro.guardarSoltados(ficheros);
    if (!ok) return this.enviar({ tipo: 'aviso', texto: mensaje, malo: true });

    await this.refrescar(true);
    this.enviar({ tipo: 'aviso', texto: mensaje });
    await puente.enviar(`Te he dejado ${cuantos === 1 ? 'un documento nuevo' : `${cuantos} documentos nuevos`} en la bandeja. Léelos y cuéntame qué has aprendido.`);
    return undefined;
  }

  async anadirDocumentos() {
    const { ok, cuantos, mensaje } = await cerebro.anadirDocumentos();
    if (!ok) return this.verCerebro({ texto: mensaje, malo: true });
    if (!cuantos) return this.verCerebro();

    await puente.enviar('He dejado documentos nuevos en la bandeja de entrada. Léelos, guárdalos donde toque y cuéntame en dos líneas qué has aprendido.');
    brujula.olvidar();
    return this.verCerebro({ texto: mensaje, malo: false });
  }

  // ----------------------------------------------------------- copias

  async verCopias() {
    this.enviar({ tipo: 'copias', copias: await copias.copias(8) });
  }

  // La pantalla de la copia de fuera. Enseña en qué punto está esto —si ha
  // entrado en su cuenta y a dónde va la copia— antes de ofrecer nada, porque
  // "guardar fuera" son tres cosas distintas y de ahí viene la confusión: una
  // cuenta, un sitio donde guardar, y el acto de subir.
  // "¿Hasta qué punto está montada esta carpeta?", pieza por pieza. Existe
  // porque la pantalla principal solo sabe decir si hay arnés o no, y quien no
  // ve conexiones no sabe si es que no hay o es que no se encuentran.
  // "¿Esto qué sabe hacer?" — de las primeras preguntas delante de algo nuevo,
  // y hasta ahora sin respuesta: el consejero ofrecía una capacidad cuando
  // encajaba y no había forma de ver el resto.
  // Llevarte un archivo: lo que el asistente ha producido, en el `out/` que RSC
  // define en cada herramienta.
  async verSalidas() {
    this.donde = { tipo: 'quieto' };
    this.enviar({ tipo: 'salidas', herramientas: salidas.loQueHaProducido() });
  }

  async abrirSalida(herramienta, fichero) {
    const { ok, mensaje } = await salidas.abrir(herramienta, fichero);
    if (!ok) this.enviar({ tipo: 'aviso', texto: mensaje, malo: true });
  }

  async guardarSalida(herramienta, fichero) {
    const hecho = await salidas.guardarCopia(herramienta, fichero);
    if (hecho.cancelado) return;
    this.enviar({ tipo: 'aviso', texto: hecho.mensaje, malo: !hecho.ok });
  }

  async verSaberes() {
    this.donde = { tipo: 'quieto' };
    const sabe = saberes.queSabe(this.contexto.extensionPath, this.corpus());
    this.enviar({
      tipo: 'saberes',
      sabe: sabe.sabe,
      puedeAprender: sabe.puedeAprender,
      // Lo que no pega con este arnés: va plegado, no se tira.
      lasDemas: sabe.lasDemas,
      deQueVa: sabe.deQueVa,
      suyas: sabe.suyas,
      otras: sabe.otras,
      // Las que el arnés monta para funcionar. Plegadas, pero se ven.
      deSerie: sabe.deSerie,
      // Lo que se recuerda, y cuándo: se ve y se quita aquí (decisión 144).
      recordatorios: recordatorios.losQueHay().map((r) => ({ nombre: r.nombre, etiqueta: r.etiqueta, enPalabras: r.enPalabras })),
      // Los comandos de antes, que son habilidades (decisión 141). Si ya hay una
      // habilidad con ese nombre, manda ella, como en Claude.
      // Y por el rótulo: el «resume-session» del arnés se llama «Seguir donde lo
      // dejé», igual que la habilidad `seguir`, y hacen lo mismo.
      comandos: (() => {
        const yaSon = new Set(rsc.habilidadesEnDisco());
        const rotulos = new Set([...sabe.suyas, ...sabe.sabe, ...sabe.otras, ...sabe.deSerie].map((h) => String(h.nombre || '').toLowerCase()));
        return acciones.todos().filter((c) => !yaSon.has(c.nombre) && !rotulos.has(String(c.etiqueta || '').toLowerCase()));
      })(),
      instaladas: sabe.instaladas,
      encajan: sabe.encajan,
    });
  }

  // El archivador: los papeles que han entrado, en sus tres montones. Antes de
  // los tres solo se veía un número — "tienes 3 sin leer" y ni forma de saber
  // cuáles son.
  async verPapeles(avisoLocal = null) {
    this.donde = { tipo: 'quieto' };
    this.enviar({ tipo: 'papeles', ...papeles.queHay(), aviso: avisoLocal });
  }

  // Se pregunta antes, y con el nombre del documento dentro de la pregunta: un
  // "¿seguro?" a secas no dice qué se va a borrar.
  async quitarPapel(ruta, nombre) {
    const seguro = await vscode.window.showWarningMessage(
      `¿Quito "${nombre}"? Todavía no lo ha leído nadie, así que no se pierde nada aprendido.`,
      { modal: true },
      'Sí, quítalo',
    );
    if (seguro !== 'Sí, quítalo') return undefined;

    const { ok, mensaje } = papeles.quitar(ruta);
    return this.verPapeles({ texto: mensaje, malo: !ok });
  }

  async abrirPapel(ruta) {
    const { ok, mensaje } = await papeles.abrir(ruta);
    if (!ok) this.enviar({ tipo: 'aviso', texto: mensaje, malo: true });
  }

  // Todo lo que sirve cuando alguien se atasca, junto. "¿Y ahora qué hago?" es
  // la pregunta más frecuente que hay y no tenía botón en ningún sitio.
  async verAyuda() {
    this.donde = { tipo: 'quieto' };
    const laNueva = await version.laNuevaSiHay(this.contexto, this.versionDeLaBarra());
    this.enviar({
      tipo: 'ayuda',
      github: await github.estado(),
      avisos: this.losAvisosQueEsperan(),
      // Qué barra es esta, y si hay otra: aquí sale aunque se apartara con «Ahora no».
      version: {
        esta: this.versionDeLaBarra(),
        nueva: laNueva ? laNueva.version : null,
        deprueba: Boolean(laNueva && laNueva.deprueba),
        puesta: this.versionPuesta || null,
        probarAntes: version.probarAntes(),
        sola: version.actualizarSola(),
      },
    });
  }

  // ── Resolver una incidencia ────────────────────────────────────────────
  //
  // Jose: *«debería haber un botón donde ponga resolver incidencias […] y
  // entonces el asistente audita todo»*. Lo que el alumno sabe decir es el
  // síntoma; el diagnóstico lo tiene la barra. Se mandan juntos, y el
  // asistente repasa la carpeta entera antes de contestar.
  //
  // Las opciones se dan hechas porque una caja de texto vacía delante de
  // alguien atascado es una pared (regla 5 del diccionario). «Otra cosa» abre
  // la caja, con ejemplos.
  async resolverIncidencia(cual) {
    const SINTOMAS = {
      conexiones: 'No encuentro mis conexiones, o falta alguna que yo sé que tengo.',
      clave: 'Una conexión dice que le faltan claves y yo creo que ya las tengo puestas.',
      noHace: 'Le pido cosas al asistente y no hace lo que espero.',
      montar: 'Algo no se ha montado bien en esta carpeta.',
    };

    let sintoma = SINTOMAS[cual];
    if (!sintoma) {
      sintoma = (await vscode.window.showInputBox({
        title: 'Resolver una incidencia',
        prompt: 'Cuéntame qué pasa, con tus palabras. Lo demás lo mira él.',
        placeHolder: 'Por ejemplo: "no sé dónde están las claves de mis herramientas"',
        ignoreFocusOut: true,
      }) || '').trim();
      if (!sintoma) return undefined;
    }

    this.enviar({ tipo: 'esperando', que: 'Mirando cómo está todo…' });
    const encargo = encargos.resolverUnaIncidencia({ sintoma, queVe: await this.loQueNoCuadra() });
    return this.pedir(encargo.prompt);
  }

  // Hechos leídos del disco para acompañar a la incidencia. Nada de
  // impresiones: lo que el asistente no puede ver de un vistazo y la barra sí.
  async loQueNoCuadra() {
    const visto = [];
    try {
      const revision = await terreno.radiografia({ sigueSinCopias: this.eligioSinCopias() });
      for (const pieza of revision.piezas || []) {
        if (pieza.estado === 'no' || pieza.estado === 'aMedias') visto.push(`${pieza.nombre}: ${pieza.detalle}`);
      }
      for (const p of conexiones.proveedores()) {
        if (p.aMedioHacer) visto.push(`La conexión ${p.etiqueta} está a medio preparar (sigue con la plantilla).`);
        else if (p.fueraDeSitio) visto.push(`${p.etiqueta} tiene ${p.fueraDeSitio === 1 ? 'una clave guardada' : `${p.fueraDeSitio} claves guardadas`} fuera de su carpeta.`);
        else if (p.faltan) visto.push(`A ${p.etiqueta} ${p.faltan === 1 ? 'le falta una clave' : `le faltan ${p.faltan} claves`}.`);
      }
      const desordenadas = sueltas.resumen();
      if (desordenadas) {
        if (desordenadas.claves) {
          visto.push(`Hay ${desordenadas.claves === 1 ? 'una clave' : `${desordenadas.claves} claves`} fuera de sitio en: ${desordenadas.ficheros.join(', ')}.`);
          for (const g of desordenadas.reparto) {
            visto.push(`  · ${g.claves.join(', ')} parecen de ${g.herramienta}${g.existe ? '' : ', que no tiene carpeta en 01-TOOLS'}.`);
          }
          if (desordenadas.sinDueno.length) visto.push(`  · Sin dueño claro: ${desordenadas.sinDueno.map((x) => x.nombre).join(', ')}.`);
        }
        // Y las credenciales que son un fichero entero, que van a otro sitio.
        for (const f of desordenadas.ficherosDeAcceso) {
          visto.push(`${f.donde} es ${f.queEs.toLowerCase()} y está fuera de su sitio${f.herramienta ? `; parece de ${f.herramienta}` : ', y no se sabe de quién'}.`);
        }
      }
      const enLasCopias = sueltas.deLasAppsEnLasCopias();
      if (enLasCopias) visto.push(`Hay claves de una aplicación guardadas en git, en su sitio pero dentro de cada copia: ${enLasCopias.ficheros.join(', ')}.`);
      for (const g of reglas.losGuardianes()) {
        if (g.estado === 'apagado') visto.push(`El freno "${g.nombre}" está apagado.`);
      }
    } catch (error) {
      this.salida.appendLine(`[incidencia] ${error.stack || error.message}`); // diccionario: interno
    }
    return visto;
  }

  // Las reglas que el asistente respeta siempre. Son tres sitios de RSC y no se
  // veía ninguno — y uno de ellos, la constitución, es de los dos ficheros que
  // el arnés marca como "léete esto antes de cada cosa que hagas".
  async verReglas() {
    this.donde = { tipo: 'quieto' };
    this.enviar({ tipo: 'reglas', ...reglas.queHay() });
  }

  // ── Los raíles de esta carpeta, al día ─────────────────────────────────
  //
  // Los raíles los copia el wizard al montar, con los que llevara la barra
  // ese día. Cuando la barra sube de versión, las carpetas montadas antes se
  // quedan con las reglas viejas y **nada lo dice**: el asistente sigue
  // leyendo lo de la semana pasada (F13 de la auditoría, decisión 108).
  //
  // Esto no decide nada: repone lo que esta carpeta ya declaró tener, con la
  // versión de ahora. Los raíles son nuestros y se sobrescriben enteros, así
  // que es lo mismo que hace `repair` y va sin preguntar — pero se dice.
  async ponerLosRailesAlDia(callado = false) {
    if (!callado) this.enviar({ tipo: 'esperando', que: 'Poniendo al día lo que la barra deja escrito…' });
    // En una carpeta cuyo historial no creó la barra, lo que toca ficheros suyos
    // no se repone en silencio: se ofrece con su botón (C-4).
    const ajena = !(await terreno.podemosGuardarElPuntoDePartida());
    const ok = await arrancar.ponerLosRailes(this.contexto, { ajena });
    this.salida.appendLine(`[railes] al día: ${ok}${ajena ? ' (historial de alguien: lo suyo, pendiente)' : ''}`); // diccionario: interno
    await this.refrescar(true);
    if (!ok) {
      this.enviar({ tipo: 'aviso', texto: 'No he podido ponerlo al día. Pulsa «Algo va mal» y pásale el código a tu tutor.', malo: true });
    } else if (!callado) {
      this.enviar({ tipo: 'aviso', texto: 'Ya está al día. El asistente lee las reglas de ahora.' });
    }
    return ok;
  }

  // La revisión que escribió el asistente. Es una página entera, así que se
  // abre fuera, como el panel de conocimiento: dentro del editor se vería el
  // código de la página, que no es lo que nadie quiere ver.
  async abrirRevision(fichero) {
    const donde = terreno.dondeViveLaRevision(fichero);
    if (!donde) return this.enviar({ tipo: 'aviso', texto: 'Esa revisión ya no está.', malo: true });
    await vscode.env.openExternal(vscode.Uri.file(donde));
    return undefined;
  }

  async abrirReglas(cual) {
    const donde = reglas.dondeVive(cual);
    if (!donde) return this.enviar({ tipo: 'aviso', texto: 'Eso todavía no está escrito.', malo: true });

    const uri = vscode.Uri.file(donde);
    try {
      await vscode.commands.executeCommand('markdown.showPreviewToSide', uri);
    } catch {
      await vscode.window.showTextDocument(uri, { viewColumn: vscode.ViewColumn.Beside, preview: true });
    }
    return undefined;
  }

  // Todos los comandos, no solo los que llevan botón.
  async verComandos() {
    this.donde = { tipo: 'quieto' };
    this.enviar({ tipo: 'comandos', comandos: acciones.todos(), puedeTenerBotones: donde.puedeTenerComandos() });
  }

  // Qué le vendría bien a esto: lo que ve la barra leyendo el disco, y un botón
  // para lo que solo puede ver el asistente.
  async verSugerencias() {
    this.donde = { tipo: 'quieto' };
    let ahora = [];
    try {
      ahora = consejos.consejos(await this.queVeoYo());
    } catch (error) {
      this.salida.appendLine(`[sugerencias] ${error.stack || error.message}`);
    }
    this.enviar({
      tipo: 'sugerencias',
      ahora,
      hayAgentes: agentes.hayAlguno(),
      hayProyectos: proyectos.hayAlgo(),
    });
  }

  // Los ayudantes. No salen en la pantalla principal hasta que hay uno.
  async verAgentes() {
    this.donde = { tipo: 'quieto' };
    this.enviar({ tipo: 'agentes', agentes: agentes.queHay() });
  }

  async verAgente(fichero) {
    const donde2 = agentes.dondeVive(fichero);
    if (!donde2) return this.enviar({ tipo: 'aviso', texto: 'Ese ayudante ya no está.', malo: true });
    return papeles.abrirFichero(donde2);
  }

  // Lo que se acordó construir. Solo existe donde se construya algo con SDD.
  async verProyectos() {
    this.donde = { tipo: 'quieto' };
    this.enviar({ tipo: 'proyectos', montones: proyectos.queHay() });
  }

  async verProyecto(fichero) {
    const donde = proyectos.dondeVive(fichero);
    if (!donde) return this.enviar({ tipo: 'aviso', texto: 'Eso ya no está.', malo: true });
    return papeles.abrirFichero(donde);
  }

  // ------------------------------------------------ la cara de la empresa
  //
  // El diseño lo hace el asistente. Esto solo recoge el material y se lo pasa:
  // la web, el logotipo, su manual de marca, o palabras.
  async verLaCara(avisoLocal = null) {
    this.donde = { tipo: 'quieto' };
    this.enviar({ tipo: 'laCara', ...tema.comoEstamos(), aviso: avisoLocal });
  }

  async materialDeMarca() {
    const hecho = await tema.elegirMaterial();
    if (hecho.cancelado) return this.verLaCara();
    if (!hecho.ok) return this.verLaCara({ texto: hecho.mensaje, malo: true });

    await puente.enviar(tema.queLePedimos({ web: tema.comoEstamos().web, puestos: hecho.puestos }));
    return this.verLaCara({ texto: `${hecho.mensaje} Se lo he pasado al asistente.`, malo: false });
  }

  async quitarLaCara() {
    const { ok, mensaje } = tema.quitarla();
    if (ok) this.pintarPagina();
    return this.verLaCara({ texto: mensaje, malo: !ok });
  }

  // Elegir qué va arriba del todo. Lo que use de verdad esa persona no lo
  // sabemos nosotros, así que lo elige ella.
  async verFijadas(avisoLocal = null) {
    this.donde = { tipo: 'quieto' };
    this.enviar({
      tipo: 'fijadas',
      grupos: fijadas.candidatos(this.contexto.extensionPath),
      elegidas: fijadas.elegidas(this.almacen()),
      tope: fijadas.TOPE,
      aviso: avisoLocal,
    });
  }

  async cambiarFijada(cambiar, cual) {
    const { ok, mensaje } = await cambiar(this.almacen(), cual, this.contexto.extensionPath);
    await this.verFijadas(ok ? null : { texto: mensaje, malo: true });
    if (ok) await this.refrescar(true);
  }

  // El subapartado de personalización: cuatro cosas que cambian el día a día.
  async verComoTrabaja(avisoLocal = null) {
    this.donde = { tipo: 'quieto' };
    this.enviar({ tipo: 'comoTrabaja', ...ajustes.comoEstamos(), aviso: avisoLocal });
  }

  async cambiarAjuste(poner, cual) {
    const { ok, mensaje } = await poner(cual);
    return this.verComoTrabaja({ texto: mensaje, malo: !ok });
  }

  async verAsistente(avisoLocal = null) {
    this.donde = { tipo: 'quieto' };
    this.enviar({ tipo: 'asistente', ...asistentes.comoEstamos(), aviso: avisoLocal });
  }

  async elegirAsistente(cual) {
    const nombre = (asistentes.porId(cual) || {}).nombre || cual;
    const { ok, mensaje, detalle, cancelado } = await asistentes.elegir(cual, {
      // Si la carpeta no está montada para él, se prepara también para él (E1).
      montar: async (id) => {
        this.enviar({ tipo: 'esperando', que: `Preparando esta carpeta para ${nombre}…` });
        return arrancar.prepararTambienPara(id, this.contexto);
      },
    });
    // Lo que dijo el arnés, para «Algo va mal» (revisión de F5, I3).
    this.salida.appendLine(`[asistente] con ${cual}: ${ok ? 'hecho' : (cancelado ? 'sin su sí' : 'no')}${detalle ? ` · ${detalle}` : ''}`); // diccionario: interno
    // Primero el repintado y después lo dicho: al revés, el repintado tapaba el
    // aviso de los frenos, que es el único momento en que sirve (I5).
    if (ok) {
      vigilarOtraVez();
      await this.refrescar(true);
    }
    await this.verAsistente({ texto: mensaje, malo: !ok && !cancelado });
  }

  // Lo que sabe que no sabe. Estaba al final de la pantalla de conceptos,
  // detrás de todo lo demás, que es donde no lo ve nadie.
  async verHuecos() {
    this.donde = { tipo: 'quieto' };
    this.enviar({ tipo: 'huecos', huecos: cerebro.loQueAunNoSabe(20) });
  }

  // El diario del arnés: lo que se hizo cada día y lo que se decidió. Las dos
  // cosas las escribe RSC solo y hasta ahora no las veía nadie.
  async verDiario() {
    this.donde = { tipo: 'quieto' };
    this.enviar({
      tipo: 'diario',
      sesiones: diario.sesiones(),
      decisiones: diario.decisiones(),
      // `log.md` es el registro de operaciones del arnés: es diario, no
      // documentación. Salía en la pantalla de documentos, que no es su sitio.
      aprendido: cerebro.aprendidoUltimamente(5),
    });
  }

  // Una anotación entera NO cabe en la barra. Se probó y se vio: media página
  // de texto en una columna de 300px, con los nombres de fichero saliéndose
  // por el lado, no hay quien la lea. Así que se abre al lado, ya compuesta,
  // que es donde se lee un documento largo.
  async verSesion(fichero) {
    const donde = diario.dondeVive(fichero);
    if (!donde) return this.enviar({ tipo: 'aviso', texto: 'Esa anotación ya no está.', malo: true });

    const uri = vscode.Uri.file(donde);
    try {
      // Compuesto, no en crudo: quien lee esto no tiene por qué ver los
      // asteriscos y las almohadillas.
      await vscode.commands.executeCommand('markdown.showPreviewToSide', uri);
    } catch {
      await vscode.window.showTextDocument(uri, { viewColumn: vscode.ViewColumn.Beside, preview: true });
    }
    return undefined;
  }

  // Cuánto te explica y con qué palabras. Lo guarda el arnés en su perfil y lo
  // lee todo lo demás antes de contestar, así que esto no es un adorno de la
  // barra: cambia cómo habla el asistente en la conversación.
  // El aviso viaja dentro del mensaje, no aparte: un `aviso` suelto repinta la
  // pantalla principal, y elegir una opción aquí te echaría de la pantalla.
  //
  // Y con lo que ha aprendido de ti: las lecciones de la memoria de RSC, que
  // son de la misma clase —cómo trabajar contigo— y no se enseñaban en ningún
  // sitio. El botón de aprender manda lo que se escribiría a mano: con Claude,
  // el comando `learn` tal cual; con los demás, la petición con palabras.
  async verTrato(avisoLocal = null) {
    this.donde = { tipo: 'quieto' };
    const como = trato.comoEstamos();
    this.enviar({
      tipo: 'trato',
      vocabularios: como.vocabularios,
      palabras: como.palabras,
      aprendido: lecciones.queHaAprendido(10),
      comoAprende: donde.paraQuien() === 'claude'
        ? '/learn'
        : 'Quiero que aprendas algo de cómo trabajo contigo. Pregúntame qué es y guárdalo como una lección tuya, con tu comando de aprender.',
      aviso: avisoLocal,
    });
  }

  async cambiarElTrato(poner, cual) {
    const { ok, mensaje } = poner(cual);
    return this.verTrato(ok
      ? { texto: 'Hecho. Se nota en la próxima cosa que le pidas.', malo: false }
      : { texto: mensaje, malo: true });
  }

  ponerPalabras(cual) { return this.cambiarElTrato(trato.ponerPalabras, cual); }

  async verRadiografia() {
    this.donde = { tipo: 'quieto' };
    this.enviar({ tipo: 'esperando', que: 'Mirando qué hay aquí…' });
    // Ojo con esparcir aquí dentro: `tipo` es el nombre del mensaje y quien
    // lo pise deja al panel sin saber qué pintar. Pasó, y la pantalla se
    // quedaba en "Mirando qué hay aquí…" para siempre.
    // A fondo: aquí sí se puede pagar. Alguien acaba de pulsar para ver esto y
    // hay una pantalla de espera delante; la principal, que se repinta sola, no
    // puede permitirse tres subprocesos del arnés cada vez.
    const aFondo = (await terreno.reconocer({ profundo: true })).arnes;
    const radio = await terreno.radiografia({ aFondo, sigueSinCopias: this.eligioSinCopias() });
    this.enviar({ tipo: 'radiografia', queEs: radio.queEs, piezas: radio.piezas });
  }

  async verCopiaFuera() {
    this.donde = { tipo: 'quieto' };
    this.enviar({ tipo: 'esperando', que: 'Un momento…' });
    this.enviar({ tipo: 'copiaFuera', github: await github.estado() });
  }

  // Entrar en la cuenta. Lo hace el editor, con su propio diálogo y su
  // navegador: aquí no se pide ni se guarda ninguna clave.
  async conectarGitHub() {
    const hecho = await github.conectar();
    if (!hecho.ok) {
      if (!hecho.cancelado) this.salida.appendLine(`[conectarGitHub] ${hecho.detalle}`);
      return this.verCopiaFuera();
    }
    await this.refrescar(true);
    this.enviar({ tipo: 'aviso', texto: `Ya estás dentro${hecho.usuario ? ` como ${hecho.usuario}` : ''}. Ya puedes guardar copias fuera.` });
    return undefined;
  }

  async subirCopia() {
    this.enviar({ tipo: 'esperando', que: 'Subiendo a GitHub…' });
    const hecho = await copias.subirCopia();
    // Sin cuenta no se enseña un error: se enseña cómo entrar.
    if (hecho.faltaGitHub) return this.verCopiaFuera();
    // Por qué no subió, para «Algo va mal», sin el token (F2).
    if (hecho.detalle) this.salida.appendLine(`[subir] ${hecho.detalle}`); // diccionario: interno

    await this.refrescar(true);
    this.enviar({ tipo: 'aviso', texto: hecho.mensaje, malo: !hecho.ok });
    return undefined;
  }

  async guardarCopia() {
    const { ok, mensaje, boton } = await copias.guardar();
    this.enviar({ tipo: 'aviso', texto: mensaje, malo: !ok, ...(boton ? { boton } : {}) });
    if (ok) brujula.olvidar();
  }

  async volverA(id) {
    const eleccion = await vscode.window.showWarningMessage(
      'Voy a dejar esta carpeta como estaba entonces. Guardo antes una copia de lo de ahora, por si acaso.',
      { modal: true },
      'Sí, vuelve atrás',
    );
    if (eleccion !== 'Sí, vuelve atrás') return;

    const { ok, mensaje } = await copias.volverA(id);
    this.enviar({ tipo: 'aviso', texto: mensaje, malo: !ok });
    await this.refrescar(true);
  }

  // Lo que se ve en pantalla, escrito en un documento para poder pasárselo a
  // alguien. Jose: «podemos reportarlo en un markdown y luego un botón para
  // afinar las cosas». Va donde va todo lo que se lee: la bandeja del arnés; y
  // si no hay arnés, fuera del proyecto, que es donde no estorba.
  async guardarLaRevision() {
    const { piezas, queEs } = await terreno.radiografia({ sigueSinCopias: this.eligioSinCopias() });
    const cuando = new Date().toISOString().slice(0, 10);

    const linea = (p) => `| ${{ si: '✓', aMedias: '!', no: '·' }[p.estado] || '·'} | ${p.nombre} | ${p.detalle} |`;
    const texto = [
      `# Qué hay montado en esta carpeta`,
      '',
      `Fecha: ${cuando}`,
      `Estado: ${queEs}`,
      '',
      '| | Pieza | Cómo está |',
      '|---|---|---|',
      ...piezas.map(linea),
      '',
      ...(piezas.some((p) => p.arreglo) ? [
        '## Lo que falta, y quién puede hacerlo',
        '',
        ...piezas.filter((p) => p.arreglo).map((p) => `- **${p.nombre}** — ${p.arreglo.etiqueta} (${{ solo: 'lo hace la barra', agente: 'se lo pide al asistente', persona: 'lo tienes que hacer tú' }[p.arreglo.como]})`),
      ] : ['Está todo.']),
      '',
    ].join('\n');

    const dentro = proyecto.arnesCompleto() && proyecto.ruta('02-DOCS', 'raw');
    const carpeta = dentro || (this.contexto.globalStorageUri && this.contexto.globalStorageUri.fsPath);
    if (!carpeta) {
      return this.enviar({ tipo: 'aviso', texto: 'No he podido dejarlo escrito en ningún sitio.', malo: true });
    }

    const fichero = path.join(carpeta, `que-hay-montado-${cuando}.md`);
    fs.mkdirSync(carpeta, { recursive: true });
    fs.writeFileSync(fichero, texto);
    await vscode.commands.executeCommand('markdown.showPreviewToSide', vscode.Uri.file(fichero));
    return this.enviar({ tipo: 'aviso', texto: 'Te lo he dejado escrito y abierto al lado.' });
  }

  // ---------------------------------------------------------- soporte

  async algoVaMal() {
    this.enviar({ tipo: 'esperando', que: 'Estoy mirando qué pasa. Tarda un poco.' });
    const informe = await soporte.revisar({
      lineas: this.salida.ultimas ? this.salida.ultimas() : [],
      carpetaAparte: this.contexto.globalStorageUri && this.contexto.globalStorageUri.fsPath,
      barra: this.versionDeLaBarra(),
    });
    (this.salida.sinGuardar || this.salida.appendLine).call(this.salida, informe.informe);
    this.ultimoInforme = informe.fichero;
    // Para «Contárselo a Executive Lab» desde esta misma pantalla: el informe
    // va con el aviso aunque no se haya podido dejar escrito en ningún sitio.
    this.ultimaIncidencia = { codigo: informe.codigo, informe: informe.informe };
    this.enviar({
      tipo: 'incidencia',
      codigo: informe.codigo,
      fichero: informe.fichero,
      sano: informe.sano,
      desconocido: informe.desconocido,
      hayQueTocarAlgo: informe.hayQueTocarAlgo,
      // Si lo que falta es git, `rsc repair` no lo va a arreglar: hay que
      // ponerlo. Mejor ese botón que uno que no puede funcionar.
      faltaGit: informe.faltaGit,
      comoSeInstalaGit: git.comoSeInstala(),
    });
  }

  // El informe entero, abierto en el editor. El alumno dicta el código y ya
  // está; esto es para cuando el tutor está delante —o al otro lado de una
  // pantalla compartida— y quiere leerlo sin buscar el fichero.
  async verElInforme(fichero) {
    const donde = fichero || this.ultimoInforme;
    if (!donde || !fs.existsSync(donde)) {
      this.enviar({ tipo: 'aviso', texto: 'No he podido dejarlo escrito en ningún sitio.', malo: true });
      return;
    }
    await vscode.window.showTextDocument(vscode.Uri.file(donde), { viewColumn: vscode.ViewColumn.Beside });
  }

  // ── Contárselo a Executive Lab ─────────────────────────────────────────
  //
  // Tres entradas y una sola pantalla para mandar (avisos.js): el alumno, desde
  // Ayuda o desde «Algo va mal»; su asistente, que lo deja escrito porque se lo
  // dicen los raíles; y la barra, cuando un botón revienta por dentro. En los
  // tres casos se enseña entero y se puede cambiar, y solo sale con «Mandarlo».
  // El sitio es público y la incidencia va con su cuenta: eso lo decide la
  // persona, aviso por aviso (decisión 131).

  versionDeLaBarra() {
    return this.contexto.extension ? this.contexto.extension.packageJSON.version : null;
  }

  losAvisosQueEsperan() {
    try {
      return avisos.pendientes().map((a) => ({ fichero: a.fichero, titulo: a.titulo, origen: a.origen }));
    } catch (error) {
      this.salida.appendLine(`[avisos] ${error.stack || error.message}`); // diccionario: interno
      return [];
    }
  }

  // ── Lo que pasó con lo que se mandó (decisión 134) ─────────────────────
  //
  // Se recuerda en el almacén de esta carpeta, que no ve ni toca nadie más: un
  // fichero de la carpeta lo podría escribir cualquiera, y la tarjeta diría lo
  // que él quisiera con la cara de Executive Lab (revisión de seguridad).
  async apuntarElMandado(numero, aviso) {
    if (!Number.isInteger(numero)) return;
    const mandados = { ...(this.almacen().get(CLAVE_MANDADOS) || {}) };
    mandados[numero] = { titulo: aviso.titulo, tipo: aviso.tipo, cuando: new Date().toISOString() };
    // Los cincuenta más nuevos bastan: de uno más viejo ya no se espera nada.
    const guardados = Object.entries(mandados).sort(([, a], [, b]) => String(b.cuando).localeCompare(String(a.cuando))).slice(0, 50);
    await this.almacen().update(CLAVE_MANDADOS, Object.fromEntries(guardados));
  }

  elArregladoQueToca() {
    const mandados = this.almacen().get(CLAVE_MANDADOS) || {};
    const [numero, cual] = Object.entries(mandados).find(([, m]) => m && m.cerrado && !m.avisado) || [];
    return numero ? { numero: Number(numero), titulo: cual.titulo, tipo: cual.tipo, como: cual.como, enlace: avisos.enlaceDe(numero) } : null;
  }

  // Una vez al día por carpeta, sin que nadie espere, y solo si hay algo que
  // esperar: pintar no puede depender de GitHub. La hora se apunta antes de
  // mirar, así que un fallo de red no hace que se pregunte en cada repintado.
  async mirarLosArregladosSiToca() {
    const almacen = this.almacen();
    const mandados = almacen.get(CLAVE_MANDADOS) || {};
    const abiertos = Object.entries(mandados).filter(([, m]) => m && !m.cerrado);
    if (!abiertos.length) return;
    if (Date.now() - (almacen.get(CLAVE_ARREGLADOS_MIRADOS) || 0) < UN_DIA) return;
    await almacen.update(CLAVE_ARREGLADOS_MIRADOS, Date.now());

    const desde = abiertos.map(([, m]) => m.cuando).filter(Boolean).sort()[0] || new Date(0).toISOString();
    const cerradas = await avisos.lasCerradas(abiertos.map(([n]) => Number(n)), { desde });
    if (!cerradas) {
      this.salida.appendLine('[avisos] no he podido mirar en GitHub: mañana otra vez'); // diccionario: interno
      return;
    }
    const ahora = Date.now();
    const puestos = { ...(almacen.get(CLAVE_MANDADOS) || {}) };
    let nuevas = 0;
    for (const [numero, cerrada] of Object.entries(cerradas)) {
      if (!puestos[numero]) continue;
      // Una cerrada hace más de dos meses ya no es noticia: se apunta y se calla.
      const vieja = cerrada.cuando && ahora - new Date(cerrada.cuando).getTime() > 60 * UN_DIA;
      puestos[numero] = { ...puestos[numero], cerrado: cerrada.cuando || new Date(ahora).toISOString(), como: cerrada.como, avisado: vieja ? true : undefined };
      if (!vieja) nuevas += 1;
    }
    await almacen.update(CLAVE_MANDADOS, puestos);
    this.salida.appendLine(`[avisos] mirado en GitHub: ${Object.keys(cerradas).length} cerradas, ${nuevas} por decir`); // diccionario: interno
    if (nuevas) await this.repintarLoQueHaya();
  }

  async yaLoSe(numero) {
    const mandados = { ...(this.almacen().get(CLAVE_MANDADOS) || {}) };
    if (mandados[numero]) {
      mandados[numero] = { ...mandados[numero], avisado: true };
      await this.almacen().update(CLAVE_MANDADOS, mandados);
    }
    return this.refrescar(true);
  }

  elAvisoQueToca() {
    try {
      return avisos.elQueToca(this.almacen().get(CLAVE_SILENCIADOS) || {});
    } catch (error) {
      this.salida.appendLine(`[avisos] ${error.stack || error.message}`); // diccionario: interno
      return null;
    }
  }

  verContar() {
    this.donde = { tipo: 'quieto' };
    this.enviar({
      tipo: 'contar',
      tipos: Object.entries(avisos.TIPOS).map(([id, t]) => ({ id, etiqueta: t.etiqueta, icono: t.icono })),
    });
  }

  contar(cual) {
    return this.ensenarElAviso({ tipo: avisos.TIPOS[cual] ? cual : 'falla', origen: 'alumno', titulo: '', texto: '', detalle: '' });
  }

  // Desde «Algo va mal»: con el informe y su código, que es lo que el tutor
  // tiene apuntado. Así Jose y el tutor hablan de lo mismo.
  contarLaIncidencia() {
    const hubo = this.ultimaIncidencia;
    return this.ensenarElAviso({
      tipo: 'falla',
      origen: 'alumno',
      titulo: '',
      texto: '',
      detalle: hubo ? `Código de incidencia: ${hubo.codigo}\n\n--- informe de «Algo va mal» ---\n${hubo.informe}` : '',
    });
  }

  verElAviso(fichero) {
    const aviso = fichero ? avisos.pendientes().find((a) => a.fichero === fichero) : null;
    if (!aviso) return this.enviar({ tipo: 'aviso', texto: 'Ese aviso ya no está.' });
    return this.ensenarElAviso(aviso);
  }

  async ensenarElAviso(aviso, nota = null) {
    this.donde = { tipo: 'quieto' };
    // Lo suyo que la barra sabe y no está en el perfil: su usuario de GitHub y
    // el sitio de su copia, que salen en el informe de «Algo va mal».
    const cuenta = await github.estado();
    const otros = [cuenta.usuario, cuenta.remoto && cuenta.remoto.corto].filter(Boolean);
    // Lo que se enseña es lo que se manda: los datos, el texto y el título, ya
    // limpios. Lo que la persona cambie después se vuelve a mirar al pulsar.
    const conQue = avisos.datos({
      barra: this.versionDeLaBarra(),
      editor: vscode.version,
      tipo: aviso.tipo,
      origen: aviso.origen,
      lineas: this.salida.ultimas ? this.salida.ultimas() : [],
      detalle: aviso.detalle,
      otros,
    });
    const texto = avisos.limpiar(aviso.texto || '', { otros });
    const titulo = avisos.limpiar(aviso.titulo || '', { otros });
    this.avisoDelante = { ...aviso, texto, titulo, datos: conQue, otros };
    const cual = avisos.TIPOS[aviso.tipo];
    // `cual` y no `tipo`: un `tipo` en los datos pisa el del mensaje, y el panel
    // se queda sin saber qué pintar (ya pasó una vez).
    this.enviar({
      tipo: 'elAviso',
      cual: aviso.tipo,
      etiqueta: cual.etiqueta,
      icono: cual.icono,
      ejemplo: cual.ejemplo,
      origen: aviso.origen,
      texto,
      // El título es lo primero que se ve en GitHub. El del alumno sale de lo
      // que escribe; el que puso su asistente o la barra se enseña y se puede
      // cambiar (revisión de seguridad: antes salía sin que nadie lo viera).
      titulo: aviso.origen === 'alumno' ? null : titulo,
      datos: conQue,
      nota,
      guardado: Boolean(aviso.fichero),
      hayQueEscribir: aviso.origen === 'alumno',
    });
  }

  async mandarElAviso(texto, titulo) {
    // Se coge y se suelta antes de esperar a nada: un doble clic manda dos
    // mensajes, y sin esto eran dos incidencias con su cuenta (revisión).
    const delante = this.avisoDelante;
    this.avisoDelante = null;
    if (!delante) return this.refrescar();
    const escrito = String(texto == null ? '' : texto).trim();
    const conTitulo = delante.origen === 'alumno'
      ? avisos.tituloDe(escrito)
      : String(titulo == null ? delante.titulo : titulo).replace(/\s+/g, ' ').trim();
    // El panel no deja mandarlo vacío; esto es por si algún día sí.
    if (!escrito && delante.origen === 'alumno') return this.ensenarElAviso(delante);

    // Si lo que ha escrito lleva algo que no puede salir, no se manda otra cosa
    // que lo que ha visto: se le enseña limpio, y lo manda si le parece bien.
    const limpio = avisos.limpiar(escrito, { otros: delante.otros });
    const tituloLimpio = avisos.limpiar(conTitulo, { otros: delante.otros });
    if (limpio !== escrito || tituloLimpio !== conTitulo) {
      return this.ensenarElAviso({ ...delante, texto: limpio, titulo: tituloLimpio },
        'He quitado lo que no debe salir de aquí. Míralo y, si está bien, vuelve a pulsar «Mandarlo».');
    }
    const aviso = { ...delante, texto: escrito, titulo: conTitulo || avisos.tituloDe(escrito) };

    this.enviar({ tipo: 'esperando', que: 'Mandándolo…' });
    let entrar = await copias.comoEntrar();
    if (!entrar) {
      // Ha pulsado «Mandarlo»: pedirle que entre es lo que toca, con el
      // diálogo de siempre del editor.
      const conectado = await github.conectar();
      if (conectado.ok) entrar = await copias.comoEntrar();
    }
    if (!entrar) return this.dejarloParaLuego(aviso, 'No lo he mandado: hace falta entrar en tu cuenta de GitHub. Lo dejo guardado en Ayuda para cuando quieras.');

    const hecho = await avisos.mandar(avisos.componer({ ...aviso, barra: this.versionDeLaBarra(), otros: delante.otros }), entrar.clave);
    this.salida.appendLine(`[avisos] ${hecho.ok ? `mandado: ${hecho.url || 'sin enlace'}` : `no ha salido: ${hecho.motivo}${hecho.estado ? ` (${hecho.estado})` : ''}`}`); // diccionario: interno
    if (!hecho.ok) return this.dejarloParaLuego(aviso, 'No he podido mandarlo. Lo dejo guardado en Ayuda y lo puedes volver a intentar.');

    // Se guarda en `mandados/` con su enlace: así ni la barra ni el asistente
    // vuelven a proponer lo que ya se contó.
    if (!avisos.archivar(aviso, avisos.MANDADOS, { enlace: hecho.url })) {
      this.salida.appendLine('[avisos] mandado, pero no he podido apuntarlo como mandado'); // diccionario: interno
    }
    await this.olvidarElApartado(aviso);
    // Y se recuerda aquí, para decirle lo que pase con él (decisión 134).
    await this.apuntarElMandado(hecho.numero, aviso);
    await this.refrescar(true);
    return this.enviar({
      tipo: 'aviso',
      texto: 'Mandado. Lo lee quien hace esta barra, y así se arregla para todos.',
      boton: hecho.url ? { etiqueta: 'Verlo en GitHub', accion: { tipo: 'abrir', url: hecho.url } } : null,
    });
  }

  // Lo que escribió no se pierde: se guarda en su sitio, o se deja uno nuevo,
  // y queda esperando en Ayuda y en la pantalla principal.
  async dejarloParaLuego(aviso, porQue) {
    const guardado = aviso.fichero ? avisos.reescribir(aviso) : Boolean(avisos.preparar(aviso));
    if (!guardado) this.salida.appendLine('[avisos] no he podido dejarlo guardado'); // diccionario: interno
    this.avisoDelante = null;
    await this.refrescar(true);
    return this.enviar({ tipo: 'aviso', texto: guardado ? porQue : 'No he podido mandarlo. Pulsa «Algo va mal» y pásale el código a tu tutor.', malo: true });
  }

  // Un aviso que ya no espera no tiene nada que apartar: su «Ahora no» se
  // quedaba para siempre en el almacén de la carpeta (auditoría final).
  async olvidarElApartado(aviso) {
    const id = aviso && aviso.nombre ? `aviso:${aviso.nombre}` : null;
    const apartados = this.almacen().get(CLAVE_SILENCIADOS) || {};
    if (!id || !(id in apartados)) return;
    const { [id]: _olvidado, ...resto } = apartados;
    await this.almacen().update(CLAVE_SILENCIADOS, resto);
  }

  async noMandarElAviso() {
    const delante = this.avisoDelante;
    this.avisoDelante = null;
    // Uno que ya estaba escrito va a `descartados/`: la barra no lo vuelve a
    // enseñar, y el asistente sabe que esto la persona no lo quiso contar.
    const estaba = Boolean(delante && delante.fichero);
    if (estaba && !avisos.archivar(delante, avisos.DESCARTADOS)) {
      this.salida.appendLine('[avisos] no he podido apartarlo'); // diccionario: interno
    }
    if (estaba) await this.olvidarElApartado(delante);
    await this.refrescar(true);
    if (estaba) this.enviar({ tipo: 'aviso', texto: 'No lo mando, y no te lo vuelvo a proponer.' });
  }

  async arreglar() {
    this.enviar({ tipo: 'esperando', que: 'Arreglándolo…' });
    const { ok, mensaje, detalle } = await soporte.arreglar();
    if (detalle) this.salida.appendLine(detalle);
    this.enviar({ tipo: 'aviso', texto: mensaje, malo: !ok });
    await this.refrescar(true);
  }

  // La pieza que falta es git, y sin ella no se monta nada (git.js dice por
  // qué). No la repartimos: se lanza el instalador oficial del sistema. Puede
  // tardar mucho —en un Mac limpio son uno o dos gigas—, así que va con barra
  // de progreso y contando lo que pasa.
  async instalarGit() {
    if (!git.sePuedeInstalarSolo()) {
      return this.enviar({ tipo: 'aviso', texto: git.comoSeInstala(), malo: true });
    }

    const hecho = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'Poniendo lo que falta', cancellable: false },
      (progreso) => git.instalar((que) => progreso.report({ message: que })),
    );

    // La respuesta anterior está recordada; sin esto la barra seguiría
    // diciendo que falta justo después de ponerla.
    copias.olvidarSiHayGit();

    if (!hecho.ok) {
      this.salida.appendLine(`[instalarGit] ${hecho.mensaje}`);
      return this.enviar({ tipo: 'aviso', texto: hecho.mensaje, malo: true });
    }

    await this.refrescar(true);
    return this.enviar({ tipo: 'aviso', texto: 'Ya está. Puedes preparar la carpeta.' });
  }

  // Si en esta carpeta se eligió seguir sin copias. Es la misma clave que
  // guarda el arranque.
  eligioSinCopias() {
    return Boolean(this.contexto.workspaceState && this.contexto.workspaceState.get('executiveLab.sigueSinCopias'));
  }

  // El botón de «Lo que el arnés hace solo» (C2): el relevo, otra vez. El
  // proceso de Claude que ya estaba abierto no lo ve, porque el PATH se hereda
  // al arrancar, así que se dice que se abra la conversación de nuevo.
  async arreglarElRelevo() {
    const puesto = relevo.ponerAlActivar({ carpeta: dondeVaElRelevo(this.contexto), ejecutable: entorno.node() });
    this.salida.appendLine(`[relevo] ${puesto.modo}${puesto.error ? `: ${puesto.error}` : ''}`); // diccionario: interno
    await this.refrescar(true);
    return this.enviar(puesto.modo === 'ninguno'
      ? { tipo: 'aviso', texto: 'No he podido arreglarlo. Pulsa «Algo va mal» y pásale el código a tu tutor.', malo: true }
      : { tipo: 'aviso', texto: 'Cierra la conversación con Claude y ábrela otra vez para que lo coja.' });
  }

  // El botón del freno pendiente (C-4): con el sí de quien lo pulsa, se engancha
  // en sus ajustes. Claude lo coge al abrir la conversación otra vez, porque lee
  // los enganches al empezar.
  async ponerElFreno() {
    // Los raíles salen con 0 aunque no puedan leer los ajustes: se mira que haya
    // quedado enganchado de verdad antes de decir que sí (revisión de F3, M1).
    const ok = await arrancar.ponerLosRailes(this.contexto, { ajena: true, ponerFreno: true })
      && terreno.comoEstaElFreno().nuestro;
    this.salida.appendLine(`[railes] el freno: ${ok}`); // diccionario: interno
    await this.refrescar(true);
    return this.enviar(ok
      ? { tipo: 'aviso', texto: 'Ya está. Cierra la conversación con Claude y ábrela otra vez para que lo coja.' }
      : { tipo: 'aviso', texto: 'No he podido ponerlo. Pulsa «Algo va mal» y pásale el código a tu tutor.', malo: true });
  }

  // El botón del bloque de `CLAUDE.md` pendiente (C-4). Toca un fichero suyo,
  // así que antes se pregunta con la frase de cuando se monta sobre lo de alguien.
  // Ajustar lo de siempre no es montar el arnés: se pregunta con el nombre del
  // botón, y vale para cualquier asistente (revisión de F4, m5).
  async ponerElBloque() {
    const si = 'Ajustarlo ahora';
    // Lo que falta, dicho como se dice en el resumen de montar: sus instrucciones,
    // su `.gitignore` (F1), o los dos.
    const falta = terreno.loQueFaltaPorPoner();
    const lista = falta.length ? falta : ['Cómo se trabaja aquí'];
    const dicha = lista.length < 2 ? lista.join('') : `${lista.slice(0, -1).join(', ')} y ${lista[lista.length - 1]}`;
    const elegido = await vscode.window.showInformationMessage(
      `Aquí ya hay cosas tuyas. Voy a tocar esto: ${dicha}. No borro nada tuyo.`,
      { modal: true },
      si,
      'No, déjalo',
    );
    if (elegido !== si) return this.enviar({ tipo: 'aviso', texto: 'No he tocado nada. Cuando quieras, el botón sigue aquí.' });
    const ok = await arrancar.ponerElBloque(this.contexto) && terreno.tieneElBloque();
    this.salida.appendLine(`[railes] lo de siempre, a mano: ${ok}`); // diccionario: interno
    await this.refrescar(true);
    const conClaude = donde.paraQuien() === 'claude';
    return this.enviar(ok
      ? { tipo: 'aviso', texto: conClaude ? 'Ya está. Cierra la conversación con Claude y ábrela otra vez para que lo coja.' : 'Ya está.' }
      : { tipo: 'aviso', texto: 'No he podido ponerlo. Pulsa «Algo va mal» y pásale el código a tu tutor.', malo: true });
  }

  // Las copias de una carpeta que se montó sin ellas. Si falta git, se pone
  // antes, con el mismo botón de siempre.
  async ponerCopias() {
    let hecho = await arrancar.ponerLasCopias(this.contexto);
    if (hecho.faltaGit) {
      await this.instalarGit();
      hecho = await arrancar.ponerLasCopias(this.contexto);
      if (hecho.faltaGit) return undefined; // lo que pasa ya lo ha dicho instalarGit
    }
    this.enviar({ tipo: 'aviso', texto: hecho.mensaje, malo: !hecho.ok, ...(hecho.boton ? { boton: hecho.boton } : {}) });
    return this.refrescar(true);
  }

  async arrancar() {
    const hecho = await arrancar.arrancar(this.contexto, this.salida);
    if (hecho.enMarcha) return this.enviar({ tipo: 'aviso', texto: OCUPADA });

    if (hecho.cancelado) {
      // Dijo que no a montar el arnés sobre lo que ya tenía. La barra funciona
      // sobre el arnés, así que no se instala nada — y se dice, en vez de
      // dejar la pantalla igual y que parezca que no ha pasado nada.
      if (hecho.sinPermiso) {
        this.enviar({ tipo: 'aviso', texto: 'No he tocado nada. Cuando quieras, el botón sigue aquí.' });
      }
      return this.refrescar();
    }

    // Falta git y ha dicho que lo pone: no es un error que mirar, es un botón
    // que pulsar, y la pantalla ya lo enseña.
    if (hecho.faltaGit) return this.refrescar(true);

    // Ha elegido seguir sin copias. Tampoco es un error.
    if (hecho.sigueSinCopias) {
      this.enviar({ tipo: 'aviso', texto: hecho.mensaje });
      return this.refrescar(true);
    }

    if (!hecho.ok) return this.enviar({ tipo: 'aviso', texto: hecho.mensaje, malo: true });

    // Lo que ya estaba no se celebra: no se ha montado nada.
    if (hecho.yaEstaba) {
      this.enviar({ tipo: 'aviso', texto: hecho.mensaje });
      return this.refrescar(true);
    }

    if (hecho.avisos && hecho.avisos.length) {
      this.salida.appendLine(`[arrancar] terminó con pegas: ${hecho.avisos.join(', ')}`); // diccionario: interno
    }
    // Lo que salió mal y hay que decir, aunque lo demás esté montado (B10).
    for (const pega of hecho.pegas || []) this.enviar({ tipo: 'aviso', texto: pega, malo: true });
    if (hecho.encargos && hecho.encargos.length) {
      this.salida.appendLine(`[arrancar] falta que el asistente haga: ${hecho.encargos.join(', ')}`); // diccionario: interno
    }

    // ── Lo que solo tiene sentido cuando se acaba de montar de cero ───────
    //
    // Traer un arnés de otro ordenador, completar un suelo o adoptar uno que ya
    // estaba no son "montar tu empresa": esa persona ya tenía esto. Preguntarle
    // por la vista sencilla y por GitHub otra vez, y decirle «acabo de montar
    // aquí un arnés», sería contarle una película que no ha pasado.
    const reciénMontado = ['desdeCero', 'encimaDeLoQueHay', 'otroArnes'].includes(hecho.rama);

    if (!reciénMontado) {
      this.enviar({ tipo: 'aviso', texto: LO_QUE_SE_HIZO[hecho.rama] || hecho.mensaje });
      await this.siFaltaAlgoDecirlo(true);
      await puente.enviar('He puesto al día el arnés de esta carpeta. Mira qué hay montado y cuéntame en dos líneas por dónde seguimos.');
      return undefined;
    }

    // Se pregunta, no se impone: puede ser la carpeta de un alumno o la de
    // alguien que solo está mirando cómo funciona esto.
    const sencilla = await vscode.window.showInformationMessage(
      `${hecho.mensaje} ¿Dejo esta ventana en vista sencilla, sin barras ni ficheros a la vista?`,
      'Sí, más sencillo',
      'No, déjala como está',
    );
    if (sencilla === 'Sí, más sencillo') await this.modoSencillo();
    await this.refrescar(true);
    // La lista de lo que falta se deja para el final, después de GitHub: si
    // saliera ahora, la pregunta de la cuenta le caería encima.

    // La cuenta de GitHub, aquí y no cuando haga falta.
    //
    // Antes esto solo salía el día que alguien pulsaba "Subir a GitHub", que es
    // el peor momento: ya quiere guardar algo y se encuentra con que le toca
    // crearse una cuenta. Montar la carpeta es cuando se está montando todo, y
    // es la única vez que el alumno espera trámites.
    //
    // Se ofrece, no se impone: quien no lo quiera ahora lo tiene en Histórico
    // para siempre, y la carpeta funciona igual sin ello.
    if (!(await github.estado()).conectado) {
      const ahora = await vscode.window.showInformationMessage(
        'Te queda una cosa: una cuenta de GitHub para guardar tu trabajo fuera de este ordenador. Si se rompe el portátil, lo recuperas. ¿Te la preparo ahora?',
        'Sí, ahora',
        'Más tarde',
      );
      if (ahora === 'Sí, ahora') await this.verCopiaFuera();
    }

    // La cara, al momento y por la barra: ya tenemos la web, así que no hay
    // que esperar a que el asistente la mire —ni a que el alumno le dé a
    // enviar—. Lo que salga es un primer intento; al asistente se le pide que
    // lo afine, no que lo haga desde cero (decisión 103).
    const cara = hecho.web ? await this.sacarLaCara(hecho.web) : null;
    const conWeb = hecho.web ? `\n\n${marca.queLePedimos(hecho.web, Boolean(cara && cara.ok))}\n\n` : '';

    // Si la carpeta ya traía claves —un `.env` de antes, un `.env.local`—, el
    // plan de a dónde va cada una viaja en este primer mensaje: es cuando el
    // asistente está montando y cuando el alumno espera trámites. Antes solo
    // salía si alguien entraba en Conexiones y pulsaba (decisión 104). Ahora
    // va con los demás encargos del arranque, en `hecho.paraElMensaje` (A7).
    const comoSeLlama = hecho.nombres.arnes || identidad.deQuien();
    await puente.enviar(arrancar.primerMensaje(hecho, { comoSeLlama, conWeb, conFreno: arrancar.hayFreno() }));
    await this.siFaltaAlgoDecirlo(false);
    return undefined;
  }

  // Jose, sobre qué ver al terminar: «si está todo bien, ¿no debería ir a la
  // pantalla principal?». Eso. La lista de piezas solo sale cuando hay algo que
  // decir — y entonces sale con un botón por cada cosa, que es lo que le
  // faltaba a esa pantalla desde el principio.
  async siFaltaAlgoDecirlo(refrescarSiEstaTodo) {
    const revision = await terreno.radiografia({ sigueSinCopias: this.eligioSinCopias() });
    if (revision.listo) {
      if (refrescarSiEstaTodo) await this.refrescar(true);
      return;
    }
    this.donde = { tipo: 'quieto' };
    this.enviar({ tipo: 'radiografia', origen: 'init', ...revision });
  }

  // La web se pregunta aquí, en una caja nativa, no mandándole a Claude un
  // párrafo pidiéndole que la pregunte él. Un dato que el alumno tiene en la
  // cabeza no necesita una conversación de ida y vuelta.
  async ponerLaCara() {
    const escrito = await vscode.window.showInputBox({
      title: 'Ponerle la cara de tu empresa',
      prompt: '¿Cuál es la web de tu empresa? De ahí saco los colores y el logotipo.',
      placeHolder: 'nexusconsulting.com',
      ignoreFocusOut: true,
    });
    const limpio = (escrito || '').trim();
    if (!limpio) return;

    const direccion = /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`;
    const cara = await this.sacarLaCara(direccion);
    await this.pedir(marca.queLePedimos(direccion, cara.ok));
  }

  // La barra mira la web y deja un primer intento de cara; si lo consigue, se
  // ve al momento. Si no —sin red, web caída, una web sin color de marca— no
  // pasa nada: no se escribe nada y el asistente lo hará con calma.
  async sacarLaCara(direccion) {
    this.enviar({ tipo: 'esperando', que: 'Mirando tu web…' });
    const cara = await web.sacarLaCara(direccion);
    if (!cara.ok) this.salida.appendLine(`[cara] ${direccion}: ${cara.motivo}`); // diccionario: interno
    await this.refrescar(true);
    if (cara.ok) {
      this.enviar({
        tipo: 'aviso',
        texto: `Ya lleva la cara de ${cara.nombre}${cara.logo ? ', con su logotipo' : ''}. Le he pedido al asistente que la afine.`,
      });
    }
    return cara;
  }

  // Elegir sobre qué carpeta se trabaja. Hace falta al arrancar —quien abre
  // esto sin nada abierto no tiene por dónde empezar— y después, para cambiar
  // de sitio sin tener que saber dónde está el menú de VS Code.
  async elegirCarpeta() {
    const elegida = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: 'Trabajar aquí',
      title: 'Elige la carpeta con la que quieres trabajar',
      defaultUri: proyecto.raiz() ? vscode.Uri.file(path.dirname(proyecto.raiz())) : undefined,
    });
    if (!elegida || !elegida.length) return;

    // Se abre en esta misma ventana: abrir otra deja al alumno con dos y sin
    // saber cuál es la suya.
    await vscode.commands.executeCommand('vscode.openFolder', elegida[0], { forceNewWindow: false });
  }

  // ------------------------------------------------------ interruptor

  async verEditorCompleto() {
    const { ok, mensaje } = await disfraz.verEditorCompleto(this.contexto, this.salida);
    this.enviar({ tipo: 'aviso', texto: mensaje, malo: !ok });
    if (ok) {
      await this.refrescar(true);
      await disfraz.proponerReabrir('Para que se vea entero, hay que cerrar y abrir esta ventana.');
    }
  }

  async modoSencillo() {
    const { mensaje } = await disfraz.volverAModoSencillo(this.contexto, this.salida);
    this.enviar({ tipo: 'aviso', texto: mensaje });
    await this.refrescar(true);
    await disfraz.proponerReabrir('Para que se aplique, hay que cerrar y abrir esta ventana.');
  }
}

// El disfraz base se pone en el primer arranque. Las claves de Claude solo
// existen cuando su extensión ya está activa, así que lo que no entre se
// reintenta una vez.
async function vestir(contexto, salida) {
  const { primeraVez, aplicadas, pendientes } = await disfraz.aplicar(contexto, salida);
  if (pendientes.length) setTimeout(() => disfraz.aplicar(contexto, salida).catch(() => {}), 8000);
  if (primeraVez && aplicadas) {
    await disfraz.proponerReabrir('Ya está todo preparado. Para que se vea bien, hay que cerrar y abrir de nuevo.');
  }
}

// El panel se ajusta al arnés conforme se monta. Cuando el asistente conecta
// una herramienta, crea un comando o escribe en la wiki, eso aparece solo: sin
// esto, el alumno tendría que cerrar y abrir para ver lo que acaba de pedir.
//
// Lo que se vigila es exactamente lo que el panel lee (ver `decisiones.md` §7).
//
// Y eso había dejado de ser verdad. Aquí estaba escrito `.claude/commands/*.md`
// y nada más de lo que escribe el asistente, cuando el panel lee además sus
// habilidades y sus ayudantes. Dos consecuencias, las dos silenciosas: una
// habilidad recién puesta no aparecía hasta cerrar y abrir, y en un arnés de
// Codex **no se vigilaba nada suyo**, porque sus cosas no viven en `.claude/`.
//
// Así que las carpetas del asistente se preguntan, no se escriben. Lo fijo es
// lo que no depende de él: la declaración, las herramientas y la wiki.
// Y los avisos para Executive Lab, que deja el asistente y la barra enseña.
const LO_FIJO = ['.rsc.json', '01-TOOLS/**', '02-DOCS/wiki/**', '02-DOCS/inbox/*', '02-DOCS/raw/avisos/*'];

// Relativa a la raíz, que es lo que quiere `RelativePattern`.
function suCarpeta(completa) {
  const raiz = proyecto.raiz();
  if (!completa || !raiz) return null;
  return path.relative(raiz, completa).split(path.sep).join('/');
}

function loQueMira() {
  const suyas = [
    donde.carpetaDeComandos(),
    donde.carpetaDeHabilidades(),
    // Las de botón, que con Codex van aparte (decisión 141).
    donde.carpetaDeBotones(),
    donde.carpetaDeAgentes(),
  ].map(suCarpeta).filter(Boolean).map((c) => `${c}/**`);

  return `{${[...LO_FIJO, ...new Set(suyas)].join(',')}}`;
}

// Volver a vigilar lo del asistente de ahora. Cambiar de asistente ya no toca
// `.rsc.json` (la elección va aparte, E1), y era lo que rearmaba el vigía: sin
// esto se seguían vigilando las carpetas del anterior (revisión de F5, I4).
let vigilarOtraVez = () => {};

function vigilarElArnes(contexto, panel) {
  const carpetas = vscode.workspace.workspaceFolders;
  if (!carpetas || !carpetas.length) return;

  let vigia = null;
  let mirando = null;
  let reloj = null;

  // Una tanda de cambios (RSC escribe muchos ficheros de golpe) es un solo
  // repintado, no veinte.
  const alCambiar = (uri) => {
    const esMarca = uri.fsPath.includes(`${marca.CARPETA.join('/')}/`) || uri.fsPath.includes(marca.FICHERO);
    // El índice del buscador se hizo con lo que había antes de este cambio.
    buscador.olvidar();
    // Cambiar de asistente cambia dónde vive todo lo suyo, y eso se escribe en
    // `.rsc.json`. Sin rearmar, se seguirían vigilando las carpetas del
    // anterior: la barra dejaría de enterarse de lo que pasa en las de ahora.
    //
    // Se rearma **después** de este aviso, no durante: rearmar es tirar el
    // vigía que nos está llamando ahora mismo, y deshacerse de algo desde
    // dentro de su propio manejador es de esas cosas que van bien hasta que un
    // día no. Sale gratis esperar al siguiente tick.
    if (uri.fsPath.endsWith('.rsc.json') && loQueMira() !== mirando) setTimeout(armar, 0);
    clearTimeout(reloj);
    reloj = setTimeout(() => {
      // La marca cambia los colores y el logotipo, así que hay que rehacer la
      // página entera; lo demás se actualiza por mensaje.
      if (esMarca) panel.pintarPagina();
      panel.repintarLoQueHaya().catch(() => {});
    }, 600);
  };

  function armar() {
    if (vigia) vigia.dispose();
    mirando = loQueMira();
    vigia = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(carpetas[0], mirando));
    vigia.onDidCreate(alCambiar);
    vigia.onDidChange(alCambiar);
    vigia.onDidDelete(alCambiar);
  }

  armar();
  vigilarOtraVez = () => { if (loQueMira() !== mirando) armar(); };
  contexto.subscriptions.push({ dispose: () => { clearTimeout(reloj); if (vigia) vigia.dispose(); } });
}

// En modo avanzado nuestra barra puede no estar a la vista, así que la vuelta
// al modo sencillo vive en la barra de estado, que sí se ve.
function vigilarElModo(contexto) {
  const boton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  boton.command = 'executiveLab.modoSencillo';
  boton.text = '$(circle-filled) Modo sencillo';
  boton.tooltip = 'Volver a la vista sencilla en esta ventana';
  boton.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');

  const repintar = () => {
    if (disfraz.modoDeEstaVentana() === 'avanzado') boton.show();
    else boton.hide();
  };
  repintar();

  contexto.subscriptions.push(boton, vscode.workspace.onDidChangeConfiguration(repintar));
  return repintar;
}

// Guardar solo, cada tanto.
//
// ── Por qué existe ───────────────────────────────────────────────────────
//
// Guardar era siempre a mano, y quien no se acuerda de pulsar el botón no
// tiene copias. Que es exactamente el público de esto: alguien que está
// pensando en sus facturas, no en su historial.
//
// ── Las tres cosas que NO hace, que son lo importante ────────────────────
//
//   · **No toca el historial de otra persona.** Si la carpeta ya venía con
//     trabajo de alguien, no se guarda nada solo: la decisión 28 lo dice para
//     el primer guardado y aquí vale igual, o con más razón, porque aquí no
//     hay nadie mirando.
//   · **No guarda si no hay nada nuevo.** Una copia idéntica a la anterior es
//     ruido en una lista que alguien tiene que poder leer.
//   · **No avisa.** Una barra que interrumpe cada hora para decir que todo va
//     bien es una barra que se acaba cerrando. Si falla, se apunta en la salida
//     y ya; es un extra, no puede estropearle el rato a nadie.
function guardarSolo(panel, salida) {
  // Se mira cada cuarto de hora y se guarda cuando toque: así cambiar el ajuste
  // no obliga a reiniciar nada, y un portátil que se suspende no pierde el turno.
  const MIRAR_CADA = 15 * 60 * 1000;
  let ultima = Date.now();

  const reloj = setInterval(async () => {
    try {
      const horas = ajustes.cadaCuantoGuarda();
      if (!horas) return;
      if (Date.now() - ultima < horas * 60 * 60 * 1000) return;

      if (!(await copias.hayGit())) return;
      if (!(await copias.cambiosSinGuardar())) return;
      if (!(await terreno.podemosGuardarElPuntoDePartida())) return;

      const hecho = await copias.guardar(`Copia automática — ${copias.fechaLarga()}`);
      ultima = Date.now();
      if (!hecho.ok) salida.appendLine(`[guardarSolo] ${hecho.mensaje}`);
      else await panel.refrescar(true);
      // Lo que se quedó fuera por ser una credencial (F1): la pieza de las claves
      // fuera de sitio ya lo enseña; aquí, para «Algo va mal».
      if (hecho.excluidos && hecho.excluidos.length) salida.appendLine(`[guardarSolo] fuera de la copia: ${hecho.excluidos.join(', ')}`); // diccionario: interno
    } catch (error) {
      salida.appendLine(`[guardarSolo] ${error.stack || error.message}`);
    }
  }, MIRAR_CADA);

  // Que no sea este reloj lo que mantenga vivo el proceso. En el editor da
  // igual —la ventana sigue abierta de todos modos— pero sin esto las pruebas
  // se quedan colgadas para siempre al arrancar la extensión, que es como se
  // descubrió.
  if (typeof reloj.unref === 'function') reloj.unref();

  return { dispose: () => clearInterval(reloj) };
}

// El relevo vive en el almacén de la barra, fuera de la carpeta del alumno (P8).
const dondeVaElRelevo = (contexto) => (contexto.globalStorageUri ? path.join(contexto.globalStorageUri.fsPath, 'relevo') : null);

// En los ajustes de usuario de Claude, con `instalador/comun/control-remoto.js`:
// sin tocar nada más, y respetando lo que esa persona ya hubiera decidido.
function ponerElControlRemoto(salida) {
  try {
    const modulo = entorno.moduloComun('control-remoto');
    if (!modulo) return;
    const { hecho } = require(modulo).ponerElControlRemoto();
    salida.appendLine(`[control remoto] ${hecho}`); // diccionario: interno
  } catch (error) {
    salida.appendLine(`[control remoto] ${error.message}`); // diccionario: interno
  }
}

function activate(contexto) {
  // El canal se envuelve para que todo lo que apuntemos por dentro acabe
  // también en el informe de "Algo va mal": ver rastro.js.
  const salida = rastro.envolver(
    vscode.window.createOutputChannel('Executive Lab'),
    contexto.globalStorageUri && contexto.globalStorageUri.fsPath,
  );
  rsc.saberDondeEstamos(contexto.extensionPath);
  // Sin arnés, los avisos para Executive Lab esperan en el almacén de la barra,
  // como el informe de «Algo va mal».
  avisos.dondeSinArnes(contexto.globalStorageUri && contexto.globalStorageUri.fsPath);
  // Con qué asistente se habla en esta carpeta, elegido aquí (E1).
  asistentes.saberDondeGuardar(contexto.workspaceState);
  buscador.saberDondeEstamos(contexto.extensionPath);

  // El relevo de Node, antes de que se abra el chat del asistente: así su
  // proceso y los enganches del arnés lo heredan (C2). Vive en el almacén de
  // la barra, fuera de la carpeta del alumno.
  // Si Claude ya estaba en marcha, su proceso no ve lo que se ponga ahora: se
  // apunta, y la pieza pide abrir la conversación otra vez (revisión de F3, I3).
  const claude = vscode.extensions.getExtension('anthropic.claude-code');
  const elRelevo = relevo.ponerAlActivar({
    carpeta: dondeVaElRelevo(contexto),
    ejecutable: entorno.node(),
    yaHabiaAsistente: Boolean(claude && claude.isActive),
  });
  salida.appendLine(`[relevo] ${elRelevo.modo}${elRelevo.carpeta ? ` en ${elRelevo.carpeta}` : ''}${elRelevo.error ? `: ${elRelevo.error}` : ''}`); // diccionario: interno
  // El control remoto de Claude, para todas las sesiones (decisión 143), como lo
  // ponen los instaladores: así también lo tiene quien solo instaló el .vsix.
  if (claude) ponerElControlRemoto(salida);
  // Para poder comparar los raíles de la carpeta con los que trae la barra.
  terreno.saberDondeEstamos(contexto.extensionPath);
  const panel = new Panel(contexto, salida);
  // Los recordatorios, cada minuto, y una vez al poco de abrir por si alguno tocó
  // con el editor cerrado (decisión 144).
  const mirar = () => panel.mirarLosRecordatorios().catch((error) => salida.appendLine(`[recordatorios] ${error.message}`)); // diccionario: interno
  const relojDeRecordatorios = setInterval(mirar, 60 * 1000);
  const primeraMirada = setTimeout(mirar, 8000);
  // Que no sean ellos los que mantengan vivo el proceso: el editor ya lo hace.
  for (const reloj of [relojDeRecordatorios, primeraMirada]) if (reloj && reloj.unref) reloj.unref();
  contexto.subscriptions.push({ dispose: () => { clearInterval(relojDeRecordatorios); clearTimeout(primeraMirada); } });
  const comando = (id, fn) => vscode.commands.registerCommand(id, fn);
  const repintarModo = vigilarElModo(contexto);

  contexto.subscriptions.push(
    salida,
    guardarSolo(panel, salida),
    vscode.window.registerWebviewViewProvider('executiveLab.panel', panel),
    comando('executiveLab.refrescar', () => panel.refrescar(true)),
    comando('executiveLab.guardar', () => panel.guardarCopia()),
    comando('executiveLab.conexiones', () => panel.verConexiones()),
    comando('executiveLab.cerebro', () => panel.verCerebro()),
    comando('executiveLab.radiografia', () => panel.verRadiografia()),
    comando('executiveLab.saberes', () => panel.verSaberes()),
    comando('executiveLab.salidas', () => panel.verSalidas()),
    comando('executiveLab.huecos', () => panel.verHuecos()),
    comando('executiveLab.papeles', () => panel.verPapeles()),
    comando('executiveLab.ayuda', () => panel.verAyuda()),
    comando('executiveLab.reglas', () => panel.verReglas()),
    comando('executiveLab.asistente', () => panel.verAsistente()),
    comando('executiveLab.comoTrabaja', () => panel.verComoTrabaja()),
    comando('executiveLab.fijadas', () => panel.verFijadas()),
    comando('executiveLab.laCara', () => panel.verLaCara()),
    comando('executiveLab.proyectos', () => panel.verProyectos()),
    comando('executiveLab.sugerencias', () => panel.verSugerencias()),
    comando('executiveLab.comandos', () => panel.verComandos()),
    comando('executiveLab.agentes', () => panel.verAgentes()),
    comando('executiveLab.diario', () => panel.verDiario()),
    comando('executiveLab.trato', () => panel.verTrato()),
    comando('executiveLab.copiaFuera', () => panel.verCopiaFuera()),
    comando('executiveLab.documentos', () => panel.anadirDocumentos()),
    comando('executiveLab.algoVaMal', () => panel.algoVaMal()),
    comando('executiveLab.empezarEmpresa', () => panel.manejar({ tipo: 'arrancar' })),
    comando('executiveLab.elegirCarpeta', () => panel.elegirCarpeta()),
    comando('executiveLab.ponerLaCara', () => panel.ponerLaCara()),
    comando('executiveLab.seguir', () => panel.pedir('Recuérdame en qué estábamos y sigamos por donde lo dejamos.')),
    comando('executiveLab.empezar', () => panel.pedir('Quiero empezar algo nuevo en mi empresa. Pregúntame qué necesito.')),
    comando('executiveLab.diagnosticoPuente', () => puente.diagnostico(salida)),
    comando('executiveLab.verEditorCompleto', async () => { await panel.verEditorCompleto(); repintarModo(); }),
    comando('executiveLab.modoSencillo', async () => { await panel.modoSencillo(); repintarModo(); }),
    comando('executiveLab.quitarDeTodo', async () => {
      const seguro = await vscode.window.showWarningMessage(
        'Voy a quitar el aspecto de Executive Lab de todas las ventanas, no solo de esta. Tus ajustes propios no se tocan.',
        { modal: true },
        'Quítalo',
      );
      if (seguro !== 'Quítalo') return;
      const { quitadas } = await disfraz.quitar(contexto, salida);
      repintarModo();
      await disfraz.proponerReabrir(`Quitado de ${quitadas} ajustes. Hay que cerrar y abrir para verlo.`);
    }),
  );

  vigilarElArnes(contexto, panel);

  // La barra de actividad está oculta por el disfraz, así que si no forzamos
  // nuestra vista el alumno se encuentra el explorador de ficheros delante.
  vscode.commands.executeCommand('executiveLab.panel.focus');

  // Y el chat de Claude ya abierto en el centro: el alumno no tiene que
  // buscarlo. Su extensión puede tardar en activarse; se le da un momento.
  setTimeout(() => puente.abrirConversacion().catch(() => {}), 1500);

  // El disfraz se pone solo en una instalación de verdad. Quien prueba la
  // extensión desde el código no quiere que le desaparezca su editor: ahí se
  // pone a mano con "Volver al modo sencillo".
  if (contexto.extensionMode !== vscode.ExtensionMode.Development) {
    vestir(contexto, salida).catch((e) => salida.appendLine(`[disfraz] ${e.message}`));
  }

  // Y si esta carpeta se montó con una barra anterior, sus raíles son de
  // entonces: el asistente estaría leyendo las reglas de aquel día. Se repone
  // lo que la carpeta ya declaró tener, con la versión de ahora — reponer no
  // es decidir, así que va solo y sin preguntar (decisión 108). Callado: si
  // sale bien no hay nada que contarle a nadie, y si sale mal la lista de
  // piezas lo dice con su botón.
  setTimeout(async () => {
    // Lo que una barra anterior dejó escrito en los enganches —la ruta del Node
    // de este ordenador, y la marca que la escondía de git— se deshace al abrir.
    // Es nuestro, y deshacerlo no es decidir (C3, decisión 119).
    arrancar.apuntarLosEnganches(salida).catch((e) => salida.appendLine(`[enganches] ${e.message}`)); // diccionario: interno
    if (!terreno.comoEstanLosRailes().alDia) {
      salida.appendLine('[railes] los de esta carpeta son de una versión anterior: se reponen'); // diccionario: interno
      await panel.ponerLosRailesAlDia(true).catch((e) => salida.appendLine(`[railes] ${e.message}`)); // diccionario: interno
    }
    // Y lo demás que se puede hacer solo, después de los raíles (P9).
    await panel.hacerSoloLoQueSePuede().catch((e) => salida.appendLine(`[solo] ${e.message}`)); // diccionario: interno
  }, 3000);
}

function deactivate() {}

module.exports = { activate, deactivate };
