# Préparation Android

Android reste une cible préparée, pas une fonctionnalité déclarée terminée dans cette version.

## Principes de portage

- Conserver les modules métier TypeScript indépendants de Tauri et du navigateur.
- Isoler les API natives derrière des adaptateurs de plateforme.
- Demander séparément les autorisations caméra et microphone au moment de leur utilisation.
- Garder le traitement des images sur l'appareil par défaut.
- Ne pas réutiliser les commandes Windows sur Android.
- Prévoir un stockage local mobile distinct de localStorage pour les données durables.
- Adapter l'interface aux écrans tactiles et aux tailles mobiles avant d'ajouter les gestes.

## Choix de V1

La version actuelle prépare la séparation du code métier et de la couche native. Aucun APK n'est produit par le chantier Windows. Le portage Android nécessitera un projet mobile, les permissions Android, une stratégie de stockage, les tests sur appareil réel et une chaîne de signature dédiée.