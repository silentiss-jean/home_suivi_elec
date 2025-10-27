===============================================================================
 DÉTECTION LOCALE ET INITIALISATION DES CAPTEURS - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Fonctionnalités principales
  3. Workflow et enchaînement backend
  4. Interactions et dépendances principales
  5. Points d’attention et dépannage

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le module  réalise :
- La détection automatique de tous les capteurs d’énergie, puissance, et dispositifs pertinents déjà présents sur une instance Home Assistant,
- L’initialisation automatisée des liaisons et des entités du backend nécessaires au suivi énergétique,
- Une réduction massive de la configuration manuelle à la première utilisation.

===============================================================================
2. FONCTIONNALITÉS PRINCIPALES
===============================================================================

- Scan exhaustif de la configuration locale : recherche et identification des entités compatibles (energy/power, intégrations supportées, etc.).
- Enregistrement des éléments trouvés dans les structures de données métier propres à l’intégration.
- Coordination avec la génération des entités manquantes (via generator.py) et synchronisation avec utility_meter_manager.py pour les compteurs.
- Peut être déclenché automatiquement lors du setup ou manuellement pour une re-détection (service HA dédié).

===============================================================================
3. WORKFLOW ET ENCHAÎNEMENT BACKEND
===============================================================================

- Appelé à l’étape d’initialisation principale (__init__.py)
- Résultats immédiatement utilisés par :
    • generator.py (pour créer ou compléter entités HA),
    • utility_meter_manager.py (pour la synchro utilitaire),
    • energy_tracking.py (pour l’historisation).

===============================================================================
4. INTERACTIONS ET DÉPENDANCES PRINCIPALES
===============================================================================

- Fichier central du boot backend Home Suivi Élec
- Dialogue avec tout module ayant besoin d’un inventaire fiable des sensors (manage_selection.py, generator, etc.)
- Peut être utilisé en conjonction avec debug_json_sets.py pour valider le résultat de la détection

===============================================================================
5. POINTS D’ATTENTION ET DÉPANNAGE
===============================================================================

- Si des entités attendues ne remontent pas, lancer manuellement la détection (service HA)
- Adapter l’algorithme si de nouvelles intégrations matérielles sont ajoutées à l’écosystème

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
