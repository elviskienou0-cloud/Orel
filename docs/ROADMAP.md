# Feuille de route OREL V1

## État des modules

| Module | État dans cette branche | Validation restante |
|---|---|---|
| Interface React/Vite | Implémentée | Essais ergonomiques |
| Noyau Three.js | Prototype interactif | Étendre les panneaux et interactions |
| Caméra et suivi des mains | Prototype fonctionnel selon essais utilisateur | Profilage FPS, éclairage et stabilité |
| Gestes | 5 gestes heuristiques | Calibration et robustesse multi-orientation |
| Assistant textuel | Interface et adaptateur Ollama | Connexion réelle au modèle local |
| Voix | API navigateur | Vérifier interruption et fin de reconnaissance |
| Mémoire | Historique local, effacement, export/import | Recherche et essais de restauration |
| Desktop Windows | Coquille Tauri 2 et trois actions fixes | Compilation, installateur et essais Windows |
| Permissions | Actions natives limitées et journalisées | Ajouter des capacités uniquement après audit |
| Android | Préparation documentaire et séparation des adaptateurs | Projet mobile et essais réels ultérieurs |

## Critères de validation

- npm test doit réussir.
- npm run typecheck doit réussir.
- npm run build doit réussir.
- npm run desktop:build doit réussir sur Windows configuré avec Rust et WebView2.
- Les tests réels de caméra, microphone, Ollama, commandes gestuelles et fermeture doivent être réalisés sur le portable cible.
- Aucun résultat de build ou test local ne doit être annoncé sans preuve d'exécution.

## Hors périmètre de cette branche

- Contrôle Windows illimité ou shell arbitraire.
- Accès automatique à tous les fichiers personnels.
- Installation ou désinstallation silencieuse de logiciels.
- Envoi de messages externes ou achats.
- Véritable hologramme optique.
- APK Android final.
