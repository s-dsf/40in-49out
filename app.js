const form = document.querySelector('#rsvpForm');
const success = document.querySelector('#success');
const rsvpIntro = document.querySelector('.rsvp-intro');
const successMessage = document.querySelector('#successMessage');
const values = { adults: 1, children: 0 };
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyYG7A64yKEnifhRWUj5knZSeWWbazZETcZFOyrijeasr8vJxiIkd19gji0HbrEq7Lb/exec';

function renderGuestDetails() {
  const fields = [];
  for (let index = 1; index <= values.adults; index += 1) {
    fields.push(`<label>Prénom de l’adulte ${index}<input required name="adultName${index}" placeholder="Prénom" /></label>`);
  }
  for (let index = 1; index <= values.children; index += 1) {
    fields.push(`<label>Prénom de l’enfant ${index}<input required name="childName${index}" placeholder="Prénom" /></label><label>Âge de l’enfant ${index}<input required type="number" min="0" max="17" name="childAge${index}" placeholder="Âge" /></label>`);
  }
  document.querySelector('#guestDetails').innerHTML = fields.join('');
}

document.querySelectorAll('[data-step]').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.step;
    values[key] = Math.max(key === 'adults' ? 1 : 0, values[key] + Number(button.dataset.delta));
    document.querySelector(`#${key}Value`).textContent = values[key];
    form.elements[key].value = values[key];
    renderGuestDetails();
  });
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const data = Object.fromEntries(new FormData(form));
  data.guests = Array.from({ length: values.adults }, (_, index) => ({ name: data[`adultName${index + 1}`], type: 'adulte' }))
    .concat(Array.from({ length: values.children }, (_, index) => ({ name: data[`childName${index + 1}`], age: data[`childAge${index + 1}`], type: 'enfant' })));
  data.confirmedAt = new Date().toISOString();
  localStorage.setItem('anniversaire-rsvp', JSON.stringify(data));

  try {
    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    successMessage.textContent = 'C’est noté, ta réponse est bien partie chez nous. À très vite pour fêter ça !';
  } catch {
    successMessage.textContent = 'Oups, ta réponse est sauvegardée sur cet appareil mais n’a pas pu être envoyée. Réessaie dans un instant ou contacte-nous directement.';
  }

  form.classList.add('hidden');
  rsvpIntro.classList.add('hidden');
  success.classList.remove('hidden');
});

document.querySelector('#editResponse').addEventListener('click', () => {
  success.classList.add('hidden');
  form.classList.remove('hidden');
  rsvpIntro.classList.remove('hidden');
});

renderGuestDetails();
