# OREL

OREL est un assistant personnel interactif, développé Windows-first avec une architecture préparée pour Android.

## Fonctions du dépôt

- Interface React + Vite + TypeScript.
- Noyau visuel Three.js et espace de travail à panneaux flottants.
- Déplacement des panneaux à la souris ou par pincement de la main.
- Réglage de la stabilité des gestes et de la sensibilité du pincement.
- Suivi local des mains par MediaPipe Tasks Vision.
- Reconnaissance gestuelle de base.
- Conversation via Ollama local (modèle installé séparément).
- Entrée et sortie vocales via les API du navigateur.
- Historique local contrôlable, exportable et importable.
- Coquille desktop Tauri 2 avec une liste très limitée d'applications Windows autorisées.

## Prérequis

- Node.js 20 ou plus récent et npm.
- Pour le desktop Windows : Rust stable, les Build Tools Visual Studio C++ et WebView2 Runtime.
- Pour les réponses IA : Ollama installé, démarré et un modèle téléchargé séparément.

## Développement navigateur

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173.

## Assistant local

Par défaut, OREL utilise http://localhost:11434 et le modèle qwen2.5:3b.
Dans Ollama, télécharge le modèle séparément, démarre le serveur, puis autorise l'origine locale OREL dans la configuration CORS d'Ollama. Le test de connexion vérifie l'API /api/tags. OREL ne télécharge pas automatiquement les modèles et ne prétend pas être connecté lorsque le serveur est indisponible.

## Application Windows

```bash
npm run desktop:dev
npm run desktop:build
```

Le pont natif expose uniquement trois lancements fixes : Bloc-notes, Calculatrice et Explorateur de fichiers. Chaque action demande une confirmation dans l'interface et est inscrite dans le journal local OREL. Aucun shell générique, aucune commande arbitraire, aucun accès global aux fichiers et aucune modification des paramètres système ne sont exposés.

## Tests et validation

```bash
npm test
npm run typecheck
npm run build
```

La compilation desktop doit aussi être vérifiée sur Windows avec Rust et WebView2. Les tests automatiques ne remplacent pas les essais webcam, microphone, Ollama et gestes sur le PC cible.

## Sécurité

- Caméra et microphone activés uniquement après une action explicite.
- Images de caméra traitées localement par OREL.
- Conversations stockées localement jusqu'à export manuel.
- Ne jamais committer de secrets, jetons, mots de passe ou fichiers .env.
- Ne jamais placer de clés privées dans des variables VITE_*.
- Actions natives limitées, visibles, confirmées et journalisées.

## Android

Voir [docs/ANDROID_PREPARATION.md](docs/ANDROID_PREPARATION.md). Android est préparé architecturalement, mais aucun APK n'est livré par cette branche.
