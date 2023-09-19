# Front part of the PS8 project

Pour démarrer le front, deux choix s'offrent à vous :
- Ouvrir un server dans le dossier `front` et ouvrir le fichier [server.html](index.html) dans un navigateur ([Avec serveur](#avec-serveur))

Le fichier js va importer les modules et les utiliser dans [Application.js](../mobile/www/assets/scripts/Application.js) pour les faire fonctionner.
Néanmoins, cela n'est possible que dans un serveur, car les modules sont chargés via des requêtes HTTP.

**Attention :** le serveur doit être lancé depuis le dossier `front` pour que les modules soient chargés correctement.

[JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#other_differences_between_modules_and_standard_scripts)