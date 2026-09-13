# Anniversaire S&D 2027 – Application RSVP

Application d'inscription pour l'anniversaire de Stéphanie & David (6-9 mai 2027).

## 🎯 Vue d'ensemble

- **Frontend** : Site web responsive en HTML/CSS/JavaScript
- **Backend** : Google Apps Script + Google Sheets
- **Email** : Confirmations automatiques via Gmail
- **Stockage** : Google Sheets (sauvegarde brute) + localStorage (backup client)

## 🚀 Installation

### 1. Cloner le repo

```bash
git clone https://github.com/s-dsf/anniversaire-SD-2027.git
cd anniversaire-SD-2027
```

### 2. Configurer Google Apps Script

1. Créez une **Google Sheet** : https://sheets.google.com
2. Nommez-la "Anniversaire S&D 2027" (ou ce que vous voulez)
3. Allez sur **Extensions > Apps Script**
4. **Supprimez le code par défaut** et **collez le contenu de `google-apps-script.gs`**
5. Modifiez la ligne suivante avec votre email (pour recevoir les notifications) :
   ```javascript
   const ORGANIZER_EMAIL = 'stephanieetdavid@example.com'; // ← À remplacer
   ```

### 3. Déployer le Apps Script

1. Cliquez sur **"Déployer"** (en haut à droite)
2. Sélectionnez **"Nouveau déploiement"**
3. **Type** : "Application web"
4. **Exécuter en tant que** : Votre compte
5. **Accès** : "Toute personne"
6. Cliquez **"Déployer"**
7. **Copiez l'URL générée** (commence par `https://script.google.com/macros/s/...`)

### 4. Configurer l'URL du formulaire

1. Ouvrez **`app.js`**
2. Remplacez la ligne 14 avec votre URL :
   ```javascript
   const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/VOTRE_URL_ICI/exec';
   ```

### 5. Déployer le site

Le site est **prêt à être hébergé** sur n'importe quel serveur web ou GitHub Pages :

```bash
# GitHub Pages (si le repo est public)
# Aucune configuration nécessaire, le site est automatiquement accessible à :
# https://s-dsf.github.io/anniversaire-SD-2027/
```

**Ou déployez manuellement sur :**
- Netlify / Vercel / Surge
- Votre propre serveur web (Apache, Nginx, etc.)

## 📋 Fonctionnalités

✅ Formulaire d'inscription complet :
- Nom, prénom, téléphone, email
- Confirmation de présence (Oui/Non)
- Dates d'arrivée et départ
- Horaires (optionnels)
- Nombre d'adultes et d'enfants
- Prénoms des invités
- Demande de couchage
- Régime/allergies
- Message personnalisé

✅ **Emails de confirmation automatiques** :
- Design personnalisé selon la réponse
- Résumé des données saisies
- Email de notification aux organisateurs (optionnel)
- Styling bohème chic conforme au design du site

✅ **Sauvegarde des données** :
- Google Sheet (toutes les réponses)
- localStorage (sauvegarde locale)
- Logs détaillés des erreurs et confirmations d'envoi

✅ **UX améliorée** :
- Design responsive bohème chic
- Champs dynamiques (+/- invités)
- Affichage conditionnel des champs
- Messages d'erreur clairs et personnalisés
- Possibilité de modifier sa réponse
- Feedback visuel pendant l'envoi

## 🔧 Configuration avancée

### Activer la notification des organisateurs

Dans `google-apps-script.gs`, ligne 11 :

```javascript
const ORGANIZER_EMAIL = 'stephanieetdavid@example.com'; // ← Remplacez par votre email
```

Les organisateurs recevront une notification à chaque nouvelle réponse avec tous les détails.

### Ajouter des champs au formulaire

1. Ajoutez un champ HTML dans `index.html` (exemple : `<input name="monChamp" />`)
2. Donnez-lui un attribut `name="..."`
3. Le champ sera automatiquement collecté dans `app.js`
4. Ajoutez une colonne correspondante à `google-apps-script.gs` ligne 33-48

### Modifier le design de l'email

Les templates HTML sont dans `google-apps-script.gs` :
- Fonction `buildAcceptanceEmail()` : email si réponse positive
- Fonction `buildDeclineEmail()` : email si réponse négative

Personnalisez les couleurs, logos, images, etc.

## 📊 Consulter les réponses

1. Ouvrez votre **Google Sheet**
2. Allez sur l'onglet **"Réponses"** (créé automatiquement)
3. Les réponses s'ajoutent en temps réel

**Onglet "Logs"** : Suivi des erreurs, confirmations d'envoi d'email, et diagnostics.

## 🐛 Dépannage

### Les emails ne partent pas

1. ✅ Vérifiez que Google Apps Script est déployé correctement
2. ✅ Vérifiez que vous êtes bien connecté à Gmail
3. ✅ Consultez l'onglet **"Logs"** de la Google Sheet
4. ✅ Vérifiez dans la console Google Apps Script (Exécutions)
5. ✅ Testez avec votre propre email d'abord
6. ✅ Vérifiez que les emails ne finissent pas dans les spams

### L'URL du script ne marche pas

1. Redéployez une nouvelle version (Extensions > Apps Script > Déployer > Gérer les déploiements)
2. Assurez-vous que "Accès" est "Toute personne"
3. Vérifiez que vous avez copié l'URL complète (avec `/exec` à la fin)

### Les données ne s'enregistrent pas

1. Ouvrez la **Console JavaScript** (F12 > Console)
2. Vérifiez s'il y a des erreurs réseau
3. Vérifiez que l'URL du script est correcte dans `app.js`
4. Testez avec une réponse simple (un seul adulte, pas d'enfants)

### L'email a un format bizarre

- Les emails sont envoyés en HTML. Vérifiez que votre client email affiche l'HTML
- Certains clients email (Outlook, etc.) peuvent ne pas afficher le CSS correctement
- Essayez un autre client email pour tester

## 📝 Stack technique

- **HTML5** : Structure sémantique
- **CSS3** : Design responsive, variables CSS, animations
- **Vanilla JavaScript** : Pas de dépendance externe, ~80 lignes
- **Google Apps Script** : Backend serverless, exécution à la demande
- **Google Sheets** : Base de données gratuite et collaborative
- **Gmail/MailApp** : Envoi d'emails depuis l'API Google

## 📄 Licence

Fait avec ❤️ pour l'anniversaire de Stéphanie & David · 2027

---

**Questions ?** Consultez les logs, relisez cette doc, ou testez directement sur le Google Apps Script en mode débogage.