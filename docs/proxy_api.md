===============================================================================
 PROXY API & PASSERELLE REQUÊTES HTTP - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Principes et fonctionnalités
  3. Intégration backend/REST
  4. Sécurité et filtres
  5. Dépannage

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

 permet de :
- Servir de proxy/relais pour des requêtes HTTP/REST, typiquement entre le frontend custom (JS) et différents endpoints Home Assistant/internes,
- Simplifier le routage, l’auth ou le filtrage de certaines routes API du projet.

===============================================================================
2. PRINCIPES ET FONCTIONNALITÉS
===============================================================================

- Expose une vue HomeAssistantView dédiée (POST/GET)
- Peut filtrer, logger, ou modifier au vol les requêtes entrantes/sortantes
- Permet le développement d’UI évolués sans exposer toutes les APIs internes directement

===============================================================================
3. INTÉGRATION BACKEND/REST
===============================================================================

- Appelé à l’initialisation pour enregistrer le endpoint
- Utilisé principalement par configuration.js, selectionPanel.js ou autres modules frontend qui nécessitent des proxys vers APIs HA

===============================================================================
4. SÉCURITÉ ET FILTRES
===============================================================================

- Vérifie l’authentification/permissions si nécessaire (peut être True/False selon le contexte)
- Peut logguer les accès, bloquer des patterns, ou transformer certains payloads

===============================================================================
5. DÉPANNAGE

- Problèmes de routage ou d’autorisations : vérifier les logs proxy_api et la stack d’appels côté UI/API client
- Toujours traiter les retours d’erreur JSON pour un debug efficace

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
