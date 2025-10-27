===============================================================================
 GESTIONNAIRE DES UTILITY_METER ET SYNCHRO YAML - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Fonctions utilitaires principales
  3. Création et gestion des utility_meter HA
  4. Gestion des cycles et reset
  5. Intégration et extensions

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le fichier  automatise tout ce qui relève de la gestion des utility_meter dans Home Assistant :
- Génère, synchronise ou met à jour les utility_meters (heures, jours, mois…) via YAML ou helpers natifs
- Gère la réinitialisation ou le reset de ces compteurs

===============================================================================
2. FONCTIONS UTILITAIRES PRINCIPALES
===============================================================================

- Fonctions de synchronisation bi-directionnelle : surcharge ou création auto des meters selon la config/flow
- Fonctions de nommage, mapping entre sensors, ou création batch pour tous les cycles
- Outils pour migrer ou nettoyer d’anciens utility_meter

===============================================================================
3. CRÉATION ET GESTION DES UTILITY_METER HA
===============================================================================

- Création automatique lors de la détection et du setup initial
- Rattachement automatique ou update après ajout de nouveaux capteurs
- Expose ou wrappe parfois les services standards d’Home Assistant

===============================================================================
4. GESTION DES CYCLES ET RESET
===============================================================================

- Support complet pour tous les cycles (hourly, daily, weekly, monthly, yearly)
- Reset possible via service, API ou action utilisateur dans l’UI

===============================================================================
5. INTÉGRATION ET EXTENSIONS

- Peut être utilisé par migrate_cleanup, detect_local, energy_tracking pour garantir la cohérence des cycles
- Extension possible : gestion de nouveaux types d’utility_meter, adaptation à des usages/contrats spécifiques

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
