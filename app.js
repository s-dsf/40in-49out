const form = document.querySelector('#rsvpForm');
const success = document.querySelector('#success');
const rsvpIntro = document.querySelector('.rsvp-intro');
const successMessage = document.querySelector('#successMessage');
const submitButton = form.querySelector('.submit');
const values = { adults: 1, children: 0 };

// URL du Google Apps Script (à garder à jour)
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw2iRe6GvjgrKUSEcm6dos8ZX8jog7pM9gOHPnkj1XVlLbo59VCt0PQALJ9Kw92DU42/exec';

/**
 * Récupère les données sauvegardées en localStorage
 */
function getSavedData() {
  const saved = localStorage.getItem('anniversaire-rsvp');
  return saved ? JSON.parse(saved) : null;
}

/**
 * Gère l'affichage, l'activation et la désactivation des champs liés à la présence.
 * Utilise disabled (pas seulement display:none) pour :
 *   - exclure les champs de la validation HTML5 (required ignoré sur disabled)
 *   - exclure les valeurs du FormData lors de la soumission
 */
function toggleAttendanceFields(attending) {
  const attendanceFields = document.querySelector('.attendance-fields');
  const controls = attendanceFields.querySelectorAll('input, select, textarea, button[type="button"]');

  if (attending) {
    attendanceFields.style.display = 'block';
    controls.forEach(el => el.removeAttribute('disabled'));
    renderGuestDetails();
  } else {
    attendanceFields.style.display = 'none';
    controls.forEach(el => el.setAttribute('disabled', ''));
    // Vider les champs dynamiques pour éviter des required orphelins
    document.querySelector('#guestDetails').innerHTML = '';
  }
  // Texte du bouton selon la réponse
  submitButton.innerHTML = attending
    ? 'C\'est parti, je m\'inscris <span>→</span>'
    : 'J\'envoie ma réponse <span>→</span>';
}

/**
 * Remplit le formulaire avec les données sauvegardées
 */
function populateFormWithSavedData() {
  const savedData = getSavedData();
  if (!savedData) return;

  // Helper sécurisé — évite un crash si le champ n'existe pas dans le HTML
  function setField(name, value) {
    const el = form.elements[name];
    if (el) el.value = value ?? '';
  }

  // Remplir les champs simples
  setField('name', savedData.name);
  setField('phone', savedData.phone);
  setField('email', savedData.email);
  setField('attendance', savedData.attendance || 'oui');
  setField('arrival', savedData.arrival || 'jeudi 6 mai');
  setField('arrivalTime', savedData.arrivalTime);
  setField('departure', savedData.departure || 'dimanche 9 mai');
  setField('departureTime', savedData.departureTime);
  setField('transport', savedData.transport);
  setField('sleeping', savedData.sleeping || 'oui');
  setField('arrivalStation', savedData.arrivalStation);
  setField('food', savedData.food || 'aucun');
  setField('message', savedData.message);

  // Restaurer le nombre d'adultes et d'enfants
  values.adults = parseInt(savedData.adults) || 1;
  values.children = parseInt(savedData.children) || 0;
  document.querySelector('#adultsValue').textContent = values.adults;
  document.querySelector('#childrenValue').textContent = values.children;
  setField('adults', values.adults);
  setField('children', values.children);

  // Appliquer la visibilité correcte selon la réponse sauvegardée
  toggleAttendanceFields(savedData.attendance !== 'non');
}

/**
 * Crée dynamiquement les champs pour les noms des invités
 */
function renderGuestDetails() {
  const fields = [];
  const savedData = getSavedData();
  
  // Ajouter les champs pour les adultes
  for (let index = 1; index <= values.adults; index += 1) {
    const savedName = savedData?.guests?.find(g => g.type === 'adulte' && g.name)?.name || '';
    fields.push(
      `<label>Prénom de l'adulte ${index}<input required name="adultName${index}" placeholder="Prénom" value="${savedName || ''}" /></label>`
    );
  }
  
  // Ajouter les champs pour les enfants
  for (let index = 1; index <= values.children; index += 1) {
    const savedChild = savedData?.guests?.find(g => g.type === 'enfant' && g.name);
    const savedName = savedChild?.name || '';
    const savedAge = savedChild?.age || '';
    fields.push(
      `<label>Prénom de l'enfant ${index}<input required name="childName${index}" placeholder="Prénom" value="${savedName || ''}" /></label>` +
      `<label>Âge de l'enfant ${index}<input required type="number" min="0" max="18" name="childAge${index}" placeholder="Âge" value="${savedAge || ''}" /></label>`
    );
  }
  
  document.querySelector('#guestDetails').innerHTML = fields.join('');
}

/**
 * Gère les boutons +/- pour ajouter/retirer des invités
 */
document.querySelectorAll('[data-step]').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.step;
    const delta = Number(button.dataset.delta);
    const minValue = key === 'adults' ? 1 : 0; // Au moins 1 adulte
    const maxValue = 10; // Max 10 personnes pour éviter les abus
    
    values[key] = Math.max(minValue, Math.min(maxValue, values[key] + delta));
    document.querySelector(`#${key}Value`).textContent = values[key];
    if (form.elements[key]) form.elements[key].value = values[key];
    renderGuestDetails();
  });
});

/**
 * Gère l'affichage/masquage des champs conditionnels selon la présence
 */
document.querySelectorAll('input[name="attendance"]').forEach(radio => {
  radio.addEventListener('change', () => {
    toggleAttendanceFields(radio.value === 'oui');
  });
});

/**
 * Soumet le formulaire et envoie les données
 */
form.addEventListener('submit', async event => {
  event.preventDefault();
  
  // Vérifier la validité du formulaire
  if (!form.reportValidity()) return;

  // Désactiver le bouton pendant l'envoi
  submitButton.disabled = true;
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Envoi en cours…';

  try {
    // Collecter les données du formulaire (les champs disabled sont exclus automatiquement)
    const formData = Object.fromEntries(new FormData(form));
    const isComing = formData.attendance === 'oui';
    
    // Construire un tableau d'objets pour chaque personne (uniquement si présent)
    const guests = [];
    
    if (isComing) {
      // Ajouter les adultes
      for (let index = 1; index <= values.adults; index++) {
        const adultName = formData[`adultName${index}`];
        if (adultName) {
          guests.push({ name: adultName, type: 'adulte', age: null });
        }
      }
      
      // Ajouter les enfants
      for (let index = 1; index <= values.children; index++) {
        const childName = formData[`childName${index}`];
        const childAge = formData[`childAge${index}`];
        if (childName && childAge) {
          guests.push({ name: childName, type: 'enfant', age: parseInt(childAge) });
        }
      }
    }
    
    // Créer l'objet de données
    const globalData = {
      confirmedAt: new Date().toISOString(),
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      attendance: formData.attendance,
      // Champs présence : vides si refus (exclus du FormData par disabled)
      arrival: formData.arrival || '',
      arrivalTime: formData.arrivalTime || '',
      departure: formData.departure || '',
      departureTime: formData.departureTime || '',
      transport: formData.transport || '',
      adults: isComing ? values.adults : 0,
      children: isComing ? values.children : 0,
      guests: guests,
      sleeping: formData.sleeping || '',
      arrivalStation: formData.arrivalStation || '',
      food: formData.food || '',
      message: formData.message || ''
    };
    
    // Vérifier si c'est une modification
    const savedData = getSavedData();
    const isModification = savedData && savedData.email === globalData.email;
    globalData.isModification = isModification;
    
    // Sauvegarder localement (backup)
    localStorage.setItem('anniversaire-rsvp', JSON.stringify(globalData));

    console.log('📤 Envoi des données:', globalData);

    // Envoyer au Google Apps Script
    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(globalData)
    });
    console.log('✅ Données envoyées (réponse opaque — normal en no-cors)');

    // Message de succès personnalisé
    if (isModification) {
      successMessage.innerHTML = isComing
        ? `<strong>${formData.name}</strong>, ta réponse a été mise à jour ! 🎉<br><br>Un email de confirmation t'a été envoyé à <strong>${formData.email}</strong>.`
        : `<strong>${formData.name}</strong>, ta réponse a bien été modifiée. 💌<br><br>On espère quand même te revoir bientôt !`;
    } else {
      successMessage.innerHTML = isComing
        ? `<strong>${formData.name}</strong>, c'est noté ! 🎉<br><br>Un email de confirmation t'a été envoyé à <strong>${formData.email}</strong>. À très vite pour fêter ça !`
        : `<strong>${formData.name}</strong>, merci pour ta réponse ! 💌<br><br>C'est dommage, mais on comprend. On pense fort à toi !`;
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error);
    successMessage.innerHTML = `
      <strong>Oups !</strong><br><br>
      Ta réponse a bien été sauvegardée sur cet appareil, mais n'a pas pu être envoyée.<br><br>
      <small>Essaie de rafraîchir la page et de réessayer. Si le problème persiste, contacte-nous directement.</small>
    `;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
    
    form.classList.add('hidden');
    rsvpIntro.classList.add('hidden');
    success.classList.remove('hidden');
  }
});

/**
 * Permet de modifier sa réponse
 */
document.querySelector('#editResponse').addEventListener('click', () => {
  success.classList.add('hidden');
  form.classList.remove('hidden');
  rsvpIntro.classList.remove('hidden');
  window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
});

// Initialisation
populateFormWithSavedData();
// Si aucune donnée sauvegardée, vérifier l'état initial du radio (oui = checked par défaut)
if (!getSavedData()) {
  const defaultAttendance = form.querySelector('input[name="attendance"]:checked');
  if (defaultAttendance) toggleAttendanceFields(defaultAttendance.value === 'oui');
}
renderGuestDetails();

// Animations douces au scroll
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
