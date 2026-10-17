// Decisión 183: ningún mensaje sin salida. Un aviso del editor que dice «Pulsa
// «Algo va mal»…» lleva el botón «Algo va mal», que abre esa pantalla; antes
// mandaba a buscar algo que no estaba a la vista.
const vscode = require('vscode');

const BOTON = 'Algo va mal';

async function avisarConSalida(texto) {
  const elegido = await vscode.window.showWarningMessage(texto, BOTON);
  if (elegido === BOTON) {
    // La barra puede estar cerrada: se abre antes, porque «Algo va mal» responde en ella.
    try { await vscode.commands.executeCommand('executiveLab.panel.focus'); } catch { /* sin barra, el informe se hace igual */ }
    await vscode.commands.executeCommand('executiveLab.algoVaMal');
  }
  return elegido;
}

module.exports = { avisarConSalida, BOTON };
