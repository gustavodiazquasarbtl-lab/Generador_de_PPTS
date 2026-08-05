/**
 * AUDITORÍA BTL — Backend en Google Apps Script
 * -----------------------------------------------------
 * Cómo instalar:
 * 1) Crea una Hoja de cálculo nueva en Google Sheets (vacía, el script
 *    crea las pestañas "Auditorias" y "Respuestas" automáticamente).
 * 2) Extensiones > Apps Script.
 * 3) Borra el contenido de Code.gs y pega TODO este archivo.
 * 4) Implementar > Nueva implementación > tipo "Aplicación web".
 *      - Ejecutar como: Yo (tu cuenta)
 *      - Quién tiene acceso: Cualquier usuario
 * 5) Copia la URL que termina en /exec y pégala en la app (Configuración
 *    > Conexión con Google Sheets).
 * 6) Cada vez que cambies este código, tienes que crear una NUEVA versión
 *    de la implementación (Implementar > Gestionar implementaciones > ✏️
 *    > Nueva versión) para que los cambios surtan efecto en la URL /exec.
 */

const SHEET_AUDITORIAS = 'Auditorias';
const SHEET_RESPUESTAS = 'Respuestas';

function doGet(e) {
  var action = (e.parameter && e.parameter.action) || 'list';
  if (action === 'list') return jsonResponse(listAuditorias());
  if (action === 'ping') return jsonResponse({ ok: true, msg: 'Conectado correctamente' });
  return jsonResponse({ ok: false, error: 'Acción no soportada: ' + action });
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    if (action === 'create') return jsonResponse(createAuditoria(body.auditoria));
    if (action === 'update') return jsonResponse(updateAuditoria(body.auditoria));
    if (action === 'delete') return jsonResponse(deleteAuditoria(body.id));
    return jsonResponse({ ok: false, error: 'Acción no soportada: ' + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (name === SHEET_AUDITORIAS) {
      sh.appendRow(['ID', 'Tienda', 'Supervisor', 'Fecha', 'CreadoEn', 'ActualizadoEn']);
    }
    if (name === SHEET_RESPUESTAS) {
      sh.appendRow(['AuditoriaID', 'PreguntaID', 'PreguntaTexto', 'Elemento', 'Respuesta']);
    }
  }
  return sh;
}

function createAuditoria(a) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var shA = getSheet(SHEET_AUDITORIAS);
    var shR = getSheet(SHEET_RESPUESTAS);
    var now = new Date();
    shA.appendRow([a.id, a.tienda, a.supervisor, a.fecha, now, now]);
    appendRespuestas(shR, a);
    return { ok: true, id: a.id };
  } finally {
    lock.releaseLock();
  }
}

function updateAuditoria(a) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var shA = getSheet(SHEET_AUDITORIAS);
    var shR = getSheet(SHEET_RESPUESTAS);
    var dataA = shA.getDataRange().getValues();
    var now = new Date();
    var found = false;
    for (var i = 1; i < dataA.length; i++) {
      if (String(dataA[i][0]) === String(a.id)) {
        shA.getRange(i + 1, 2, 1, 3).setValues([[a.tienda, a.supervisor, a.fecha]]);
        shA.getRange(i + 1, 6).setValue(now);
        found = true;
        break;
      }
    }
    if (!found) throw new Error('Auditoría no encontrada: ' + a.id);

    // Reemplaza las respuestas anteriores de esta auditoría
    var dataR = shR.getDataRange().getValues();
    for (var j = dataR.length - 1; j >= 1; j--) {
      if (String(dataR[j][0]) === String(a.id)) shR.deleteRow(j + 1);
    }
    appendRespuestas(shR, a);
    return { ok: true, id: a.id };
  } finally {
    lock.releaseLock();
  }
}

function deleteAuditoria(id) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var shA = getSheet(SHEET_AUDITORIAS);
    var shR = getSheet(SHEET_RESPUESTAS);
    var dataA = shA.getDataRange().getValues();
    for (var i = dataA.length - 1; i >= 1; i--) {
      if (String(dataA[i][0]) === String(id)) shA.deleteRow(i + 1);
    }
    var dataR = shR.getDataRange().getValues();
    for (var j = dataR.length - 1; j >= 1; j--) {
      if (String(dataR[j][0]) === String(id)) shR.deleteRow(j + 1);
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function appendRespuestas(shR, a) {
  var rows = [];
  var textos = a.preguntasTexto || {};
  Object.keys(a.respuestas || {}).forEach(function (pid) {
    var texto = textos[pid] || pid;
    var elMap = a.respuestas[pid] || {};
    Object.keys(elMap).forEach(function (el) {
      rows.push([a.id, pid, texto, el, elMap[el]]);
    });
  });
  if (rows.length) {
    shR.getRange(shR.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
  }
}

function listAuditorias() {
  var shA = getSheet(SHEET_AUDITORIAS);
  var shR = getSheet(SHEET_RESPUESTAS);
  var dataA = shA.getDataRange().getValues();
  var dataR = shR.getDataRange().getValues();

  var respMap = {}; // id -> { respuestas: {pid: {el: val}}, elementos: [...] }
  for (var j = 1; j < dataR.length; j++) {
    var row = dataR[j];
    var id = row[0], pid = row[1], el = row[3], val = row[4];
    if (!respMap[id]) respMap[id] = { respuestas: {}, elementos: [] };
    if (!respMap[id].respuestas[pid]) respMap[id].respuestas[pid] = {};
    respMap[id].respuestas[pid][el] = val;
    if (respMap[id].elementos.indexOf(el) === -1) respMap[id].elementos.push(el);
  }

  var auditorias = [];
  for (var i = 1; i < dataA.length; i++) {
    var r = dataA[i];
    var id = r[0];
    if (!id) continue;
    auditorias.push({
      id: id,
      tienda: r[1],
      supervisor: r[2],
      fecha: formatFecha(r[3]),
      creadoEn: r[4] ? new Date(r[4]).getTime() : null,
      actualizadoEn: r[5] ? new Date(r[5]).getTime() : null,
      elementos: respMap[id] ? respMap[id].elementos : [],
      respuestas: respMap[id] ? respMap[id].respuestas : {}
    });
  }
  return { ok: true, auditorias: auditorias };
}

function formatFecha(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return v;
}
