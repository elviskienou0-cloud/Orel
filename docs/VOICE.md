# Conversation vocale mains libres

## Utilisation

1. Ouvrir OREL Desktop ou OREL dans un navigateur compatible.
2. Ouvrir l'espace **Voix**.
3. Autoriser le microphone lorsque le navigateur le demande.
4. Activer **Conversation mains libres**.
5. Prononcer une demande. OREL transcrit la phrase, l'envoie au moteur local configuré, lit la réponse, puis relance l'écoute.
6. Utiliser **Arrêter la conversation mains libres** pour couper l'écoute et la lecture.

## Comportement et limites

- La langue de reconnaissance et de synthèse est le français (`fr-FR`).
- La conversation mains libres est une boucle d'écoutes ponctuelles, pas un mot de réveil.
- Le navigateur doit exposer `SpeechRecognition` ou `webkitSpeechRecognition`.
- La disponibilité et le traitement de la reconnaissance vocale dépendent du navigateur et de ses paramètres. Certains navigateurs peuvent envoyer l'audio à un service de reconnaissance distant.
- Le modèle de conversation reste le serveur Ollama local configuré dans OREL. Sans Ollama opérationnel, seules les réponses locales programmées sont disponibles.
- Le mode s'arrête en cas d'erreur de reconnaissance, de refus du microphone, de fermeture du composant ou d'action explicite d'arrêt.
- Le mode mains libres active la lecture des réponses. L'utilisateur peut arrêter la synthèse vocale séparément.
- Aucun enregistrement audio permanent n'est stocké par cette fonctionnalité.

## Vérifications

```bash
npm run test:voice
npm test
npm run typecheck
npm run build
```

Les tests automatisés couvrent le cycle de vie des callbacks vocaux avec des doubles de navigateur. Ils ne remplacent pas un essai du microphone et des voix installées sur Windows.
