/**
 * Anniversaire S&D 2027 - Google Apps Script
 * À placer dans Extensions > Apps Script de la feuille de réponses,
 * puis Déployer > Gérer les déploiements > Modifier > Nouvelle version.
 * Type : application web ; exécuter en tant que : vous ; accès : toute personne.
 */

const SHEET_NAME = 'Réponses';
const LOG_SHEET_NAME = 'Logs';
const ORGANIZER_EMAIL = 'stephanieetdavid@example.com'; // À remplacer par votre email

function doGet() {
  return ContentService.createTextOutput('Le formulaire RSVP est prêt.');
}

function doPost(event) {
  try {
    const data = JSON.parse(event.postData.contents);
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

    // Créer l'en-tête si la feuille est vide
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Reçu le',
        'Nom',
        'Type',
        'Âge',
        'Téléphone',
        'E-mail',
        'Présence',
        'Jour d\'arrivée',
        'Heure d\'arrivée',
        'Jour de départ',
        'Heure de départ',
        'Couchage',
        'Gare/Aéroport',
        'Régime/Allergies',
        'Message'
      ]);
      sheet.setFrozenRows(1);
    }

    // Créer une ligne pour chaque invité
    data.guests.forEach(guest => {
      sheet.appendRow([
        data.confirmedAt,
        guest.name,
        guest.type === 'adulte' ? 'Adulte' : 'Enfant',
        guest.age || '',
        data.phone,
        data.email,
        data.attendance === 'oui' ? 'Oui' : 'Non',
        data.attendance === 'oui' ? data.arrival : '',
        data.attendance === 'oui' ? data.arrivalTime : '',
        data.attendance === 'oui' ? data.departure : '',
        data.attendance === 'oui' ? data.departureTime : '',
        data.sleeping === 'oui' ? 'Oui' : 'Non',
        data.arrivalStation || '',
        data.food || '',
        data.message || ''
      ]);
    });

    // Envoyer l'email de confirmation
    sendConfirmationEmail(data);

    // Notifier les organisateurs
    notifyOrganizers(data);

    // Logger le succès
    logEvent(data.email, 'SUCCESS', `Réponse de ${data.name} enregistrée avec succès (${data.guests.length} personne(s))`);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    logEvent('UNKNOWN', 'ERROR', error.message + ' | ' + error.stack);
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Envoie un email de confirmation personnalisé à l'invité
 */
function sendConfirmationEmail(data) {
  const isComing = data.attendance === 'oui';
  
  const subject = isComing
    ? '✦ C\'est noté ! Rendez-vous du 6 au 9 mai 2027'
    : '✦ Merci beaucoup pour ta réponse';

  const htmlContent = isComing
    ? buildAcceptanceEmail(data)
    : buildDeclineEmail(data);

  try {
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      htmlBody: htmlContent,
      name: 'Stéphanie & David · Mai 2027'
    });
    Logger.log(`Email envoyé à ${data.email}`);
  } catch (error) {
    logEvent(data.email, 'EMAIL_ERROR', `Erreur lors de l'envoi: ${error.message}`);
    throw error;
  }
}

/**
 * Construit l'email HTML pour une réponse positive
 */
function buildAcceptanceEmail(data) {
  const guestNames = data.guests
    .map(g => `${g.name}${g.type === 'enfant' ? ` (${g.age} ans)` : ''}`)
    .join(', ');

  return `
    <div style="font-family: 'DM Sans', Arial, sans-serif; color: #45382e; line-height: 1.8; background: linear-gradient(135deg, #f7f0e5 0%, #ede1ce 100%); padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 32px; margin-bottom: 10px;">✦</div>
          <h1 style="margin: 0; font-size: 24px; font-family: 'Playfair Display', serif;">Trop chouette !</h1>
          <p style="margin: 5px 0 0 0; color: #aa654d; font-style: italic;">Ta réponse est bien enregistrée</p>
        </div>

        <p style="margin: 20px 0; color: #45382e;">Salut <strong>${data.name}</strong>,</p>

        <p style="margin: 15px 0; color: #45382e;">Super, tu nous rejoins ! Voici un résumé de ta confirmation :</p>

        <div style="background: #f7f0e5; padding: 20px; border-left: 4px solid #aa654d; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 5px 0;"><strong>Arrivée :</strong> ${data.arrival} ${data.arrivalTime ? 'à ' + data.arrivalTime : ''}</p>
          <p style="margin: 5px 0;"><strong>Départ :</strong> ${data.departure} ${data.departureTime ? 'à ' + data.departureTime : ''}</p>
          <p style="margin: 5px 0;"><strong>Nombre de personnes :</strong> ${parseInt(data.adults) + parseInt(data.children)} (${data.adults} adulte(s), ${data.children} enfant(s))</p>
          <p style="margin: 5px 0;"><strong>Qui vient :</strong> ${guestNames}</p>
          <p style="margin: 5px 0;"><strong>Couchage :</strong> ${data.sleeping === 'oui' ? 'Demande inscrite sur la liste' : 'Non sur place'}</p>
          ${data.food !== 'aucun' && data.food ? `<p style="margin: 5px 0;"><strong>Infos diet/allergies :</strong> ${data.food}</p>` : ''}
          ${data.arrivalStation ? `<p style="margin: 5px 0;"><strong>Arrivée :</strong> ${data.arrivalStation}</p>` : ''}
        </div>

        <p style="margin: 20px 0; color: #45382e;">À très vite pour fêter ça ensemble ! 🎉</p>

        <p style="margin: 15px 0; color: #66704e; font-size: 13px;">
          <strong>Gîte Deldadetcha</strong><br>
          901 route du Bousquet<br>
          40230 Saubrigues
        </p>

        <div style="border-top: 1px solid #d9cbbb; padding-top: 20px; margin-top: 20px; text-align: center; color: #66704e; font-size: 13px;">
          <p style="margin: 0;">Stéphanie & David</p>
          <p style="margin: 5px 0 0 0;"><em>6 – 9 mai 2027</em></p>
          <p style="margin: 5px 0 0 0;"><em>Un peu de bohème, beaucoup de love et surtout zéro prise de tête ✦</em></p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Construit l'email HTML pour une réponse négative
 */
function buildDeclineEmail(data) {
  return `
    <div style="font-family: 'DM Sans', Arial, sans-serif; color: #45382e; line-height: 1.8; background: linear-gradient(135deg, #f7f0e5 0%, #ede1ce 100%); padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 32px; margin-bottom: 10px;">✦</div>
          <h1 style="margin: 0; font-size: 24px; font-family: 'Playfair Display', serif;">Merci pour ta réponse</h1>
        </div>

        <p style="margin: 20px 0; color: #45382e;">Salut <strong>${data.name}</strong>,</p>

        <p style="margin: 15px 0; color: #45382e;">Merci beaucoup de nous avoir répondu. Tu vas nous manquer, mais on pense fort à toi !</p>

        <p style="margin: 20px 0; color: #45382e;">N'hésite pas à nous recontacter si tes plans changent avant le 15 novembre.</p>

        <div style="border-top: 1px solid #d9cbbb; padding-top: 20px; margin-top: 20px; text-align: center; color: #66704e; font-size: 13px;">
          <p style="margin: 0;">Stéphanie & David</p>
          <p style="margin: 5px 0 0 0;"><em>6 – 9 mai 2027</em></p>
          <p style="margin: 5px 0 0 0;"><em>Un peu de bohème, beaucoup de love et surtout zéro prise de tête ✦</em></p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Notifie les organisateurs d'une nouvelle réponse
 */
function notifyOrganizers(data) {
  if (!ORGANIZER_EMAIL || ORGANIZER_EMAIL === 'stephanieetdavid@example.com') {
    return; // Ne pas envoyer si l'email n'est pas configuré
  }

  const subject = `[RSVP] ${data.name} - ${data.attendance === 'oui' ? 'CONFIRMED ✓' : 'DECLINED ✗'}`;
  const guestList = data.guests
    .map(g => `${g.name}${g.type === 'enfant' ? ` (${g.age} ans)` : ''}`)
    .join(', ');

  const body = `Nouvelle réponse reçue le ${new Date(data.confirmedAt).toLocaleDateString('fr-FR')} à ${new Date(data.confirmedAt).toLocaleTimeString('fr-FR')}:

NOM: ${data.name}
TÉLÉPHONE: ${data.phone}
EMAIL: ${data.email}
PRÉSENCE: ${data.attendance === 'oui' ? 'CONFIRMÉ ✓' : 'REFUSÉ ✗'}

${data.attendance === 'oui' ? `
DATES:
  Arrivée: ${data.arrival} ${data.arrivalTime ? 'à ' + data.arrivalTime : ''}
  Départ: ${data.departure} ${data.departureTime ? 'à ' + data.departureTime : ''}

NOMBRE DE PERSONNES: ${parseInt(data.adults) + parseInt(data.children)}
  - Adultes: ${data.adults}
  - Enfants: ${data.children}
  - Prénoms: ${guestList}

COUCHAGE: ${data.sleeping === 'oui' ? 'Demande inscrite' : 'Non'}
ARRIVÉE (gare/aéroport): ${data.arrivalStation || 'N/A'}
RÉGIME/ALLERGIES: ${data.food || 'Aucun'}

MESSAGE: ${data.message || '(aucun)'}
` : ''}`;

  try {
    MailApp.sendEmail(ORGANIZER_EMAIL, subject, body);
  } catch (error) {
    Logger.log('Erreur lors de la notification des organisateurs: ' + error.message);
  }
}

/**
 * Enregistre les événements dans une feuille de log
 */
function logEvent(email, status, message) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);

  if (!logSheet) {
    logSheet = spreadsheet.insertSheet(LOG_SHEET_NAME);
    logSheet.appendRow(['Timestamp', 'Email', 'Status', 'Message']);
  }

  logSheet.appendRow([
    new Date().toISOString(),
    email,
    status,
    message
  ]);
}
