# Architecture

## Principes

1. Partager la logique métier TypeScript autant que possible.
2. Isoler les adaptateurs de plateforme : caméra, microphone, stockage et actions natives.
3. Traiter les images de caméra localement par défaut.
4. Injecter les fournisseurs IA derrière des modules dédiés, sans secret dans le navigateur.
5. Représenter les capacités avec des états explicites : indisponible, permission requise, initialisation, prêt, erreur.

## Couches

- Interface : React et navigation.
- Présentation 3D : Three.js dans un composant dédié, entouré de panneaux HTML flottants et déplaçables.
- Vision : MediaPipe Tasks Vision et caméra du navigateur.
- Gestes : fonctions pures convertissant les 21 points en événements sémantiques ; stabilité et seuil de pincement réglables.
- Voix : API SpeechRecognition et SpeechSynthesis du navigateur, avec gestion de fin et d'erreur.
- Mémoire : historique local limité à 100 messages, validation stricte, import/export JSON.
- IA : adaptateur Ollama local avec test de connexion, délais d'attente et annulation.
- Desktop : Tauri 2, pont natif réduit à une liste d'applications autorisées.
- Android : adaptateurs mobiles à créer séparément, sans exposer les commandes Windows.

## Assistant IA

- Serveur par défaut : http://localhost:11434 ; modèle : qwen2.5:3b.
- Le modèle doit être installé et démarré séparément par l'utilisateur.
- Le navigateur doit être autorisé par la configuration CORS d'Ollama.
- OREL vérifie /api/tags avant de déclarer la connexion opérationnelle.
- Les requêtes sont limitées dans le temps et peuvent être annulées.
- Si Ollama est indisponible, seules les intentions locales explicitement programmées répondent. OREL ne simule pas une intelligence générale.

## Mémoire et confidentialité

- Les conversations sont conservées dans localStorage, jusqu'à 100 messages.
- Les sauvegardes exportées contiennent les conversations. L'utilisateur choisit explicitement le fichier de sauvegarde et son import.
- Les imports sont validés, limités à 2 Mo et à 100 messages.
- Aucun historique n'est synchronisé vers un serveur.

## Sécurité du pont Windows

- La version navigateur ne possède aucun accès au système de fichiers, aux processus ou au shell Windows.
- Tauri n'expose pas de commande shell générique.
- Seuls Bloc-notes, Calculatrice et Explorateur de fichiers sont lançables par identifiants fixes.
- La confirmation utilisateur est demandée avant le lancement depuis l'interface.
- Chaque lancement autorisé est ajouté à un journal local dans le répertoire de données OREL.
- Aucun argument libre, chemin libre, script, installation logicielle ou changement de configuration système n'est accepté.
- Les actions natives restent désactivées hors de l'application desktop.

## Vision gestuelle

- MediaPipe Tasks Vision est fixé à la version stable 0.10.35 ; le runtime WASM utilise exactement la même version.
- Jusqu'à deux mains et leurs 21 points sont suivis localement.
- Le classificateur de gestes reste heuristique et dépend de l'angle, de la lumière et de la position de la main.
- Les raccourcis de navigation restent désactivés par défaut.
- Dans l’espace de travail, un pincement maintenu sur un panneau permet de le déplacer ; le déplacement souris reste disponible.
- Le premier chargement du moteur WASM et du modèle nécessite Internet.
- L'inférence se déroule sur le thread principal et doit être profilée sur le PC cible.

## Limites et validations restantes

- Le test Ollama et le build navigateur doivent être exécutés localement.
- La compilation Tauri et les permissions WebView2 doivent être vérifiées sur Windows.
- Les performances doivent être mesurées sur le portable réel de 8 Go.
- Android n'est pas implémenté dans cette branche.
