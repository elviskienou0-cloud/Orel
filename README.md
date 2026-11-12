# OREL

OREL est un assistant personnel interactif, développé Windows-first avec une architecture préparée pour Android.

## Fonctions du dépôt

- Interface React + Vite + TypeScript.
- Noyau visuel Three.js et espace de travail à panneaux flottants.
- Suivi local des mains par MediaPipe Tasks Vision.
- Contrôle global du pointeur Windows par gestes dans l'application OREL Desktop.
- Curseur à l'index, clic/glisser-déposer au pincement et défilement à deux doigts.
- Conversation via Ollama local (modèle installé séparément).
- Entrée et sortie vocales via les API du navigateur, avec mode conversation mains libres (écoute, réponse vocale, reprise de l'écoute).
- Historique local contrôlable, exportable et importable.
- Coquille desktop Tauri 2 avec actions natives limitées.

## Prérequis

- Node.js 20 ou plus récent et npm.
- Pour le desktop Windows : Rust stable, les Build Tools Visual Studio C++ et WebView2 Runtime.
- Pour les réponses IA : Ollama installé, démarré et un modèle téléchargé séparément.

## Développement navigateur

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173. Le mode navigateur permet de tester la vision, mais ne contrôle pas le pointeur système.

## Application Windows

```bash
npm run desktop:dev
npm run desktop:build
```

Dans **Contrôle Windows**, active le contrôle global, puis active la caméra. Index pointé : curseur ; pincement : clic/glisser ; deux doigts : défilement ; Échap : arrêt d'urgence.

Le pont natif n'expose que le curseur, le bouton gauche, la molette et trois lancements fixes d'applications. Aucun shell générique, clavier simulé, commande arbitraire ou accès global aux fichiers n'est exposé.

## Conversation vocale

Dans **Voix**, active « Conversation mains libres » pour qu'OREL écoute une phrase, traite la demande, lise sa réponse puis relance l'écoute. Le bouton d'arrêt coupe l'écoute et la synthèse vocale. Ce mode dépend de la prise en charge de SpeechRecognition par le navigateur et de l'autorisation du microphone ; il ne fournit pas de mot de réveil et n'est pas une écoute permanente garantie. La reconnaissance vocale du navigateur peut utiliser un service de reconnaissance externe selon le navigateur et sa configuration. La synthèse vocale utilise les voix installées sur Windows.

## Assistant local

Par défaut, OREL utilise http://localhost:11434 et le modèle qwen2.5:3b. Le modèle doit être installé séparément. OREL ne télécharge pas automatiquement les modèles et ne prétend pas être connecté lorsque le serveur est indisponible.

## Tests et validation

```bash
npm test
npm run typecheck
npm run build
npm run desktop:build
```

La compilation desktop et les gestes réels doivent être validés sur Windows. Les tests automatisés ne remplacent pas les essais caméra, microphone, Ollama et souris sur le PC cible.

## Sécurité

- Caméra et microphone activés uniquement après une action explicite.
- Le contrôle global de la souris est désactivé par défaut.
- Échap désactive le contrôle et libère le bouton gauche.
- Images de caméra traitées localement par OREL.
- Conversations stockées localement jusqu'à export manuel.
- Ne jamais committer de secrets, jetons, mots de passe ou fichiers .env.
- Android est préparé architecturalement, mais aucun APK n'est livré par cette branche.

## Commandes Windows depuis la conversation

Dans OREL Desktop sous Windows, l'assistant reconnaît actuellement quelques commandes explicites :
- « OREL, ouvre la calculatrice »
- « Ouvre le Bloc-notes »
- « Lance l'explorateur de fichiers »

OREL demande une confirmation avant chaque lancement et affiche le résultat dans la conversation. Ces commandes réutilisent uniquement la liste blanche native déjà présente. Les formulations inconnues ou les demandes combinant plusieurs actions ne déclenchent pas d'action Windows. Le routage général de missions et le contrôle du clavier ne sont pas encore disponibles.


## OREL HOLO : vision écran et missions

- **Vision écran** : partage manuel d'un onglet, d'une fenêtre ou de l'écran. OREL n'effectue aucune capture tant que l'utilisateur ne clique pas sur « Analyser la capture ». L'analyse utilise le modèle configuré sur le serveur Ollama local ; un modèle compatible avec les images est nécessaire.
- **Planificateur de missions** : transforme un objectif en 2 à 8 étapes structurées et conserve la progression localement. Les cases sont cochées par l'utilisateur ; cette version ne prétend pas exécuter automatiquement les étapes.
- **Interface spatiale** : conserve le noyau Three.js et les panneaux manipulables à la souris ou par pincement.

## Préparation Android

Le dépôt conserve une architecture Tauri 2 compatible avec une initialisation Android, mais le projet natif Android et l'APK ne sont pas encore générés ni validés dans cette branche. Sur une machine configurée avec Android Studio/SDK, NDK, JDK 17 et les cibles Rust Android, utiliser :

```bash
npm run mobile:android:init
npm run mobile:android:dev
npm run mobile:android:build
```

L'initialisation crée les fichiers natifs Android à auditer avant commit. La compilation Android doit être validée sur un environnement équipé du SDK ; elle ne peut pas être certifiée par le build web.
