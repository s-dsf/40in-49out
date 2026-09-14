/**
 * Anniversaire S&D 2027 — Google Apps Script
 * UNE LIGNE PAR PERSONNE (adulte ou enfant)
 *
 * Colonnes : Reçu le | Nom | Type | Âge | Téléphone | Email |
 *            Présence | Jour d'arrivée | Heure d'arrivée | Jour de départ |
 *            Heure de départ | Couchage | Gare/Aéroport |
 *            Régime/Allergies | Message
 *
 * Déployer en tant que : Application Web
 *   • Exécuter en tant que : Moi
 *   • Autorisé pour : Tout le monde (anonymes)
 */

const SHEET_NAME      = 'Réponses';
const LOG_SHEET_NAME  = 'Logs';
const NOTIF_EMAIL     = 's.desferet@gmail.com';

// ─── helpers ─────────────────────────────────────────────────────────────────
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Script actif ✦' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      'Reçu le', 'Nom', 'Type', 'Âge',
      'Téléphone', 'Email', 'Présence',
      'Jour d\'arrivée', 'Heure d\'arrivée',
      'Jour de départ', 'Heure de départ',
      'Couchage', 'Gare/Aéroport',
      'Régime/Allergies', 'Message',
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#c58061')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function logEvent(email, status, message) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!logSheet) {
    logSheet = ss.insertSheet(LOG_SHEET_NAME);
    logSheet.appendRow(['Timestamp', 'Email', 'Status', 'Message']);
  }
  logSheet.appendRow([new Date().toISOString(), email, status, message]);
}

// ─── POST ────────────────────────────────────────────────────────────────────
function doPost(event) {
  try {
    const data  = JSON.parse(event.postData.contents);
    const sheet = getOrCreateSheet();
    const now   = new Date();

    // Tableau de personnes : [{name, type:'adulte'|'enfant', age}, ...]
    const guests = Array.isArray(data.guests) && data.guests.length > 0
      ? data.guests
      : [{ name: data.name || '', type: 'adulte', age: null }];

    // Une ligne par personne
    guests.forEach(function(guest) {
      sheet.appendRow([
        now,
        guest.name  || '',
        guest.type === 'enfant' ? 'Enfant' : 'Adulte',
        guest.age   || '',
        data.phone  || '',
        data.email  || '',
        data.attendance === 'oui' ? 'Oui' : 'Non',
        data.attendance === 'oui' ? (data.arrival  || '') : '',
        data.attendance === 'oui' ? (data.arrivalTime || '') : '',
        data.attendance === 'oui' ? (data.departure || '') : '',
        data.attendance === 'oui' ? (data.departureTime || '') : '',
        data.sleeping === 'oui' ? 'Oui' : 'Non',
        data.arrivalStation || '',
        data.food || '',
        data.message || '',
      ]);
    });

    // E-mail de confirmation à l'inscrit
    if (data.email) {
      sendConfirmationEmail(data, guests);
    }

    // Notification aux organisateurs
    notifyOrganizers(data, guests);

    logEvent(data.email || 'UNKNOWN', 'SUCCESS',
      'Réponse de ' + (data.name || '?') + ' enregistrée (' + guests.length + ' pers.)');

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    logEvent('UNKNOWN', 'ERROR', err.message + ' | ' + (err.stack || ''));
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── E-mails ─────────────────────────────────────────────────────────────────
function sendConfirmationEmail(data, guests) {
  const isComing = data.attendance === 'oui';
  const subject  = isComing
    ? '✦ C\'est noté ! Rendez-vous du 6 au 9 mai 2027'
    : '✦ Merci beaucoup pour ta réponse';

  const htmlBody = isComing
    ? buildAcceptanceEmail(data, guests)
    : buildDeclineEmail(data);

  MailApp.sendEmail({
    to:       data.email,
    subject:  subject,
    htmlBody: htmlBody,
    name:     'Stéphanie & David · Mai 2027',
  });
}

function buildAcceptanceEmail(data, guests) {
  const nbAdults   = guests.filter(function(g) { return g.type !== 'enfant'; }).length;
  const nbChildren = guests.filter(function(g) { return g.type === 'enfant'; }).length;
  const nbTotal    = guests.length;

  const guestNames = guests.map(function(g) {
    return g.name + (g.type === 'enfant' && g.age ? ' (' + g.age + ' ans)' : '');
  }).join(', ');

  const couchageLabel = data.sleeping === 'oui'
    ? 'Demande inscrite sur la liste'
    : 'Non sur place';

  const stationLine = data.arrivalStation
    ? '<tr><td style="padding:7px 0;font-weight:700;color:#f0e6d3;white-space:nowrap;">Gare/Aéroport&nbsp;:</td>'
      + '<td style="padding:7px 0 7px 16px;color:#f0e6d3;">' + data.arrivalStation + '</td></tr>'
    : '';

  const foodLine = (data.food && data.food !== 'aucun')
    ? '<tr><td style="padding:7px 0;font-weight:700;color:#f0e6d3;white-space:nowrap;">Régime/Allergies&nbsp;:</td>'
      + '<td style="padding:7px 0 7px 16px;color:#f0e6d3;">' + data.food + '</td></tr>'
    : '';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SD2027//RSVP//FR',
    'BEGIN:VEVENT',
    'DTSTART;VALUE=DATE:20270506',
    'DTEND;VALUE=DATE:20270510',
    'SUMMARY:40 IN · 49 OUT — Anniversaire Stéphanie & David',
    'DESCRIPTION:Gîte Deldadetcha — 901 route du Bousquet 40230 Saubrigues',
    'LOCATION:901 route du Bousquet\\, 40230 Saubrigues',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const icsBase64 = Utilities.base64Encode(icsContent);
  const icsDataUri = 'data:text/calendar;base64,' + icsBase64;

  return '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#e8ddd0;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#e8ddd0;padding:30px 0;">'
    + '<tr><td align="center">'
    + '<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#2d2926;border-radius:16px;overflow:hidden;">'
    + '<tr><td style="padding:40px 40px 24px;text-align:center;">'
    + '<div style="font-size:28px;color:#f0e6d3;margin-bottom:16px;">✦</div>'
    + '<h1 style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#f0e6d3;">Trop chouette&nbsp;!</h1>'
    + '<p style="margin:8px 0 0;font-style:italic;color:#c58061;font-size:15px;">Ta réponse est bien enregistrée</p>'
    + '</td></tr>'
    + '<tr><td style="padding:0 40px 28px;">'
    + '<p style="margin:0 0 12px;color:#f0e6d3;font-size:15px;line-height:1.6;">Salut <strong>' + data.name + '</strong>,</p>'
    + '<p style="margin:0 0 20px;color:#d9cfc5;font-size:15px;line-height:1.6;">Super, tu nous rejoins ! Voici un résumé de ta confirmation&nbsp;:</p>'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#3d3530;border-left:4px solid #c58061;border-radius:0 8px 8px 0;padding:18px 22px;font-size:14px;line-height:1.7;">'
    + '<tr><td style="padding:0;"><table cellpadding="0" cellspacing="0" width="100%">'
    + '<tr><td style="padding:7px 0;font-weight:700;color:#f0e6d3;white-space:nowrap;">Arrivée&nbsp;:</td>'
    + '<td style="padding:7px 0 7px 16px;color:#f0e6d3;">' + (data.arrival || '') + (data.arrivalTime ? ' à ' + data.arrivalTime : '') + '</td></tr>'
    + '<tr><td style="padding:7px 0;font-weight:700;color:#f0e6d3;white-space:nowrap;">Départ&nbsp;:</td>'
    + '<td style="padding:7px 0 7px 16px;color:#f0e6d3;">' + (data.departure || '') + (data.departureTime ? ' à ' + data.departureTime : '') + '</td></tr>'
    + '<tr><td style="padding:7px 0;font-weight:700;color:#f0e6d3;white-space:nowrap;">Nombre de personnes&nbsp;:</td>'
    + '<td style="padding:7px 0 7px 16px;color:#f0e6d3;">' + nbTotal + ' (' + nbAdults + ' adulte(s), ' + nbChildren + ' enfant(s))</td></tr>'
    + '<tr><td style="padding:7px 0;font-weight:700;color:#f0e6d3;white-space:nowrap;vertical-align:top;">Qui vient&nbsp;:</td>'
    + '<td style="padding:7px 0 7px 16px;color:#f0e6d3;">' + guestNames + '</td></tr>'
    + stationLine
    + '<tr><td style="padding:7px 0;font-weight:700;color:#f0e6d3;white-space:nowrap;">Couchage&nbsp;:</td>'
    + '<td style="padding:7px 0 7px 16px;color:#f0e6d3;">' + couchageLabel + '</td></tr>'
    + foodLine
    + '</table></td></tr></table>'
    + '</td></tr>'
    + '<tr><td style="padding:4px 40px 28px;text-align:center;">'
    + '<a href="' + icsDataUri + '" style="display:inline-block;background:#66704e;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:100px;font-size:14px;font-weight:600;">📅&nbsp; Ajouter au calendrier</a>'
    + '</td></tr>'
    + '<tr><td style="padding:0 40px 28px;">'
    + '<p style="margin:0 0 20px;color:#f0e6d3;font-size:15px;">À très vite pour fêter ça ensemble&nbsp;! 🎉</p>'
    + '<p style="margin:0;color:#66704e;font-size:13px;line-height:1.7;"><strong style="color:#8faa75;">Gîte Deldadetcha</strong><br>901 route du Bousquet<br>40230 Saubrigues</p>'
    + '</td></tr>'
    + '<tr><td style="border-top:1px solid #4a4440;padding:20px 40px;text-align:center;">'
    + '<p style="margin:0;color:#9e9189;font-size:12px;line-height:1.8;">'
    + 'Stéphanie &amp; David<br><em>6 – 9 mai 2027</em><br>'
    + '<em>Un peu de bohème, beaucoup de love et surtout zéro prise de tête ✦</em>'
    + '</p>'
    + '</td></tr>'
    + '</table>'
    + '</td></tr></table>'
    + '</body></html>';
}

function buildDeclineEmail(data) {
  return '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#e8ddd0;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#e8ddd0;padding:30px 0;">'
    + '<tr><td align="center">'
    + '<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#2d2926;border-radius:16px;overflow:hidden;">'
    + '<tr><td style="padding:40px 40px 24px;text-align:center;">'
    + '<div style="font-size:28px;color:#f0e6d3;margin-bottom:16px;">✦</div>'
    + '<h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:700;color:#f0e6d3;">Merci pour ta réponse</h1>'
    + '</td></tr>'
    + '<tr><td style="padding:0 40px 32px;">'
    + '<p style="margin:0 0 12px;color:#f0e6d3;font-size:15px;line-height:1.6;">Salut <strong>' + data.name + '</strong>,</p>'
    + '<p style="margin:0 0 12px;color:#d9cfc5;font-size:15px;line-height:1.6;">Dommage, on aurait adoré te voir là ! On espère qu\'on se retrouvera une autre fois 💛</p>'
    + '<p style="margin:0;color:#9e9189;font-size:14px;line-height:1.6;">Si tes plans changent avant le <strong style="color:#f0e6d3;">15 novembre</strong>, n\'hésite pas à revenir sur l\'invitation.</p>'
    + '</td></tr>'
    + '<tr><td style="border-top:1px solid #4a4440;padding:20px 40px;text-align:center;">'
    + '<p style="margin:0;color:#9e9189;font-size:12px;line-height:1.8;">'
    + 'Stéphanie &amp; David<br><em>6 – 9 mai 2027</em><br>'
    + '<em>Un peu de bohème, beaucoup de love et surtout zéro prise de tête ✦</em>'
    + '</p>'
    + '</td></tr>'
    + '</table>'
    + '</td></tr></table>'
    + '</body></html>';
}

function notifyOrganizers(data, guests) {
  const guestList = guests.map(function(g) {
    return g.name + (g.type === 'enfant' && g.age ? ' (' + g.age + ' ans)' : '');
  }).join(', ');

  const subject = '[RSVP] ' + data.name + ' — '
    + (data.attendance === 'oui' ? 'CONFIRMÉ ✓' : 'REFUSÉ ✗');

  const body = [
    'Nouvelle réponse reçue :',
    '',
    'NOM : ' + data.name,
    'TÉLÉPHONE : ' + (data.phone || ''),
    'EMAIL : ' + (data.email || ''),
    'PRÉSENCE : ' + (data.attendance === 'oui' ? 'OUI ✓' : 'NON ✗'),
    '',
    data.attendance === 'oui' ? [
      'Arrivée : ' + (data.arrival || '') + (data.arrivalTime ? ' à ' + data.arrivalTime : ''),
      'Départ : '  + (data.departure || '') + (data.departureTime ? ' à ' + data.departureTime : ''),
      'Nombre : '  + guests.length + ' pers. (' + guests.filter(function(g){return g.type!=='enfant';}).length + ' adulte(s), ' + guests.filter(function(g){return g.type==='enfant';}).length + ' enfant(s))',
      'Prénoms : ' + guestList,
      'Gare/Aéro : ' + (data.arrivalStation || '—'),
      'Couchage : ' + (data.sleeping === 'oui' ? 'Oui' : 'Non'),
      'Régime : '  + (data.food || 'aucun'),
      '',
      'Message : ' + (data.message || '(aucun)'),
    ].join('\n') : '',
  ].filter(function(l){ return l !== undefined; }).join('\n');

  MailApp.sendEmail(NOTIF_EMAIL, subject, body);
}
