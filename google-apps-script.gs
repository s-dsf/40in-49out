/**
 * À placer dans Extensions > Apps Script de la feuille de réponses,
 * puis Déployer > Gérer les déploiements > Modifier > Nouvelle version.
 * Type : application web ; exécuter en tant que : vous ; accès : toute personne.
 */
const SHEET_NAME = 'Réponses';

function doGet() {
  return ContentService.createTextOutput('Le formulaire RSVP est prêt.');
}

function doPost(event) {
  try {
    const data = JSON.parse(event.postData.contents);
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Reçu le', 'Nom', 'Téléphone', 'E-mail', 'Présence', 'Jour d’arrivée', 'Heure d’arrivée', 'Jour de départ', 'Heure de départ', 'Adultes', 'Enfants', 'Invités (prénoms / âges)', 'Dort sur place', 'Transport', 'Gare / aéroport d’arrivée', 'Régime / allergies', 'Message']);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([data.confirmedAt, data.name, data.phone, data.email, data.attendance, data.arrival, data.arrivalTime, data.departure, data.departureTime, data.adults, data.children, JSON.stringify(data.guests || []), data.sleeping, data.transport, data.arrivalStation, data.food, data.message]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}
