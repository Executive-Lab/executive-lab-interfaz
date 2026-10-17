// Decisión 189: cuando falla una escritura, el aviso dice cuál y por qué en una
// frase, no «No he podido guardar nada de eso». El motivo sale del código del
// sistema (`EACCES`, `ENOSPC`…) y se cuenta como lo contaría una persona; si es
// uno que no se conoce, se dice sin inventar.
const MOTIVOS = {
  EACCES: 'no tengo permiso para escribir en esa carpeta',
  EPERM: 'el sistema no me deja escribir ahí',
  EROFS: 'esa carpeta es de solo lectura',
  ENOSPC: 'no queda sitio en el disco',
  EDQUOT: 'no queda sitio en el disco',
  EBUSY: 'otro programa lo tiene abierto',
  ENAMETOOLONG: 'el nombre es demasiado largo',
  ENOENT: 'la carpeta ya no está',
  EMFILE: 'hay demasiados ficheros abiertos a la vez',
  EISDIR: 'ahí hay una carpeta con ese nombre',
  EEXIST: 'ya hay algo con ese nombre',
};

function porQueNoSePudo(error) {
  const codigo = error && error.code;
  return MOTIVOS[codigo] || 'el sistema no me ha dejado y no ha dicho por qué';
}

module.exports = { porQueNoSePudo, MOTIVOS };
