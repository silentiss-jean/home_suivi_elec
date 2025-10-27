===============================================================================
 PACKAGE HELPERS - INITIALISATION - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Structure et usage du package
  3. Points d’attention

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le fichier  sert à :
- Marquer le dossier  comme package Python
- Permet le regroupement, l’import, et la distribution centralisée des fonctions utilitaires dans l’intégration

===============================================================================
2. STRUCTURE ET USAGE DU PACKAGE
===============================================================================

- Toutes les fonctions utilitaires, tests, ou helpers métiers réutilisables sont désormais centralisées dans ce dossier
- Facilite la maintenance et l’import propre dans les autres modules (__init__.py, sensors, flows, etc.)

===============================================================================
3. POINTS D’ATTENTION
===============================================================================

- Ne contient pas de logique métier directe : tous les helpers doivent être accessibles via import
- Les helpers spécifiques doivent être documentés individuellement (voir fichiers suivants)

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
