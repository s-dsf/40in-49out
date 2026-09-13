# Configuration Google Apps Script - Guide complet

## 📋 Étape 1 : Créer une Google Sheet

1. Allez sur **https://sheets.google.com**
2. Cliquez sur **"+ Nouveau"** pour créer une nouvelle feuille
3. Nommez-la : **"Anniversaire S&D 2027"** (ou ce que vous préférez)

## 📜 Étape 2 : Ajouter le Google Apps Script

1. Dans votre Google Sheet, cliquez sur **Extensions > Apps Script**
   
   ![Step 2](https://raw.githubusercontent.com/s-dsf/anniversaire-SD-2027/main/docs/step2.png)

2. Une nouvelle fenêtre s'ouvre avec du code par défaut
3. **Sélectionnez tout le code** et **supprimez-le**
4. **Collez le contenu complet du fichier `google-apps-script.gs`** de ce repo

## ⚙️ Étape 3 : Configuration de l'email des organisateurs

À la **ligne 11** du script, remplacez :

```javascript
const ORGANIZER_EMAIL = 'stephanieetdavid@example.com';
```

Par votre adresse email :

```javascript
const ORGANIZER_EMAIL = 'votre.email@gmail.com';
```

> **Note** : Vous recevrez une notification à chaque nouvelle réponse avec tous les détails.

## 🚀 Étape 4 : Déployer le Apps Script

1. Cliquez sur le bouton **"Déployer"** (en haut à droite)

   ![Deploy](https://raw.githubusercontent.com/s-dsf/anniversaire-SD-2027/main/docs/deploy.png)

2. Sélectionnez **"Nouveau déploiement"** (ou "Créer un déploiement")

3. Cliquez sur l'icône **⚙️** (engrenage) en haut à gauche et sélectionnez :
   - **Type** : "Application web"

4. Remplissez les champs :
   - **Exécuter en tant que** : Sélectionnez votre compte Gmail
   - **Accès** : "Toute personne"

5. Cliquez sur **"Déployer"**

6. Une fenêtre **"Autoriser l'accès"** peut apparaître. Cliquez sur votre compte et autorisez l'application

7. **COPIE L'URL générée** (ressemble à) :
   ```
   https://script.google.com/macros/s/AKfycbyYG7A64yKEnifhRWUj5knZSeWWbazZETcZFOyrijeasr8vJxiIkd19gji0HbrEq7Lb/exec
   ```

## 🔗 Étape 5 : Configurer l'URL dans le formulaire

1. Ouvrez le fichier **`app.js`** dans ce repo
2. Trouvez la ligne 14 :
   ```javascript
   const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyYG7A64yKEnifhRWUj5knZSeWWbazZETcZFOyrijeasr8vJxiIkd19gji0HbrEq7Lb/exec';
   ```
3. **Remplacez-la par votre URL** copiée à l'étape précédente
4. **Committez et pushez** le changement

## ✅ Étape 6 : Tester

1. Allez sur votre site (ex: https://s-dsf.github.io/anniversaire-SD-2027/)
2. Remplissez le formulaire avec vos données
3. Cliquez sur **"C'est parti, je m'inscris"**
4. Vérifiez que vous recevez l'email de confirmation
5. Vérifiez votre Google Sheet - une nouvelle ligne doit s'être ajoutée

## 📊 Consulter les réponses

- Allez dans votre **Google Sheet**
- Vous verrez deux onglets :
  - **"Réponses"** : Toutes les réponses complètes
  - **"Logs"** : Historique des envois d'emails et erreurs

## 🐛 Dépannage

### Les emails ne partent pas

1. Vérifiez l'onglet **"Logs"** de votre Google Sheet
2. Ouvrez Google Apps Script et cliquez sur **"Exécutions"** pour voir les erreurs
3. Vérifiez que vous avez autorisé l'application à envoyer des emails

### L'URL du script ne fonctionne pas

- Vérifiez que l'**"Accès"** est bien défini à **"Toute personne"**
- Redéployez avec une nouvelle version (Déployer > Gérer les déploiements > Modifier)

### Les données ne s'enregistrent pas

- Vérifiez dans la **Console** du navigateur (F12) s'il y a des erreurs
- Vérifiez que l'URL du script est correcte dans `app.js`

---

**Besoin d'aide ?** Consultez le README.md pour plus de détails ! 🚀