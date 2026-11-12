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
- Desktop : Tauri 2, pont natif réduit à une liste d'applications autorisées et au contrôle limité du pointeur Windows.
- Android : adaptateurs mobiles à créer séparément, sans exposer les commandes Windows.

## Contrôle gestuel Windows

- Disponible uniquement dans OREL Desktop sur Windows.
- L'utilisateur active le contrôle global explicitement à chaque session ; la caméra reste une permission séparée.
- Le doigt index pilote le curseur avec lissage et réglage de sensibilité.
- Le pincement appuie sur le bouton gauche ; le relâchement termine le clic ou le glisser-déposer.
- Le geste deux doigts pilote la molette verticale.
- La perte de la main, l'arrêt de caméra, la fermeture du composant ou Échap relâchent le bouton gauche.
- Les commandes Rust utilisent les API Windows pour positionner le curseur et envoyer uniquement les événements de souris gauche et molette.
- Aucun clavier, shell, commande arbitraire ou accès global aux fichiers n'est exposé.
- Les actions de bouton gauche sont journalisées dans le répertoire de données OREL.
- La version navigateur ne peut pas contrôler le pointeur système.

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

## Vision gestuelle

- MediaPipe Tasks Vision est fixé à la version stable 0.10.35 ; le runtime WASM utilise exactement la même version.
- Jusqu'à deux mains et leurs 21 points sont suivis localement.
- Le classificateur de gestes reste heuristique et dépend de l'angle, de la lumière et de la position de la main.
- Le premier chargement du moteur WASM et du modèle nécessite Internet.
- L'inférence se déroule sur le thread principal ; le profilage réel sur le PC cible reste nécessaire.

## Validation restante

- Exécuter les tests TypeScript, Node et build.
- Compiler l'application Tauri sur Windows avec Rust et WebView2.
- Vérifier les commandes de souris sur le PC cible.
- Mesurer la précision, le délai et la consommation mémoire sur le portable de 8 Go.
- Android n'est pas implémenté dans cette branche.
