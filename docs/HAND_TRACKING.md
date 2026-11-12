# Vision gestuelle OREL

## Activation

1. Lance OREL Desktop sur Windows ou ouvre la version navigateur sur localhost/HTTPS pour les essais de vision seuls.
2. Dans **Contrôle Windows**, active explicitement le contrôle global si tu utilises l'application desktop.
3. Sélectionne **Activer la caméra** et autorise son accès.
4. Garde une main clairement visible, avec un éclairage frontal.
5. Attends la fin du premier téléchargement du modèle.
6. Désactive le contrôle ou appuie sur Échap avant de quitter une session. Arrêter la caméra libère aussi le bouton gauche si un glissement était en cours.

## Gestes de contrôle global Windows

| Geste | Action |
|---|---|
| Index pointé | Déplacer le curseur Windows |
| Pincement pouce-index | Appuyer sur le bouton gauche ; relâcher pour cliquer, maintenir pour glisser-déposer |
| Deux doigts en V | Faire défiler verticalement en déplaçant la main |
| Perte de la main / arrêt caméra | Relâcher automatiquement le bouton gauche |
| Échap | Désactiver le contrôle global et relâcher le bouton gauche |

Le contrôle natif est disponible uniquement dans OREL Desktop pour Windows. La version navigateur ne peut pas piloter le pointeur système. L'activation du contrôle global et l'autorisation caméra sont deux actions séparées. Le bouton gauche est le seul bouton de souris simulé ; aucun clavier, terminal ou shell n'est exposé.

## Réglage et précision

- Le curseur utilise un lissage exponentiel pour réduire les tremblements.
- Une zone périphérique de 6 % évite les mouvements involontaires près des bords.
- La sensibilité est réglable dans OREL.
- Le suivi est limité à environ 20 images par seconde pour rester adapté aux PC modestes.
- Les mouvements sont relatifs à la surface visible de la webcam et sont projetés sur la résolution principale de Windows.

## Runtime assets

Le premier démarrage télécharge MediaPipe Tasks Vision 0.10.35 et le modèle Hand Landmarker public. Le modèle est ensuite exécuté localement. OREL n'envoie pas les images de la webcam.

## Sécurité et limites

- Le contrôle global est désactivé par défaut et doit être activé à chaque session.
- Échap est le raccourci d'arrêt d'urgence.
- Le bouton gauche est automatiquement relâché à la perte de la main, à l'arrêt de la caméra et à la fermeture du composant.
- Les commandes natives sont limitées au déplacement du curseur, au bouton gauche et à la molette.
- Un clic gestuel agit sur la fenêtre Windows au premier plan. Évite de laisser une fenêtre contenant une action sensible sous le curseur.
- La précision réelle dépend de la webcam, de la lumière, de la distance, de l'angle et de la fatigue de la main. Une calibration physique plus avancée et des essais sur le PC cible restent nécessaires.
- Le système ne garantit pas encore une manipulation parfaite de chaque application ou de ses contrôles spécifiques.
