===============================================================================
 DÉTECTION LOCALE ET INITIALISATION DES CAPTEURS - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
 1. Rôle du fichier
 2. Fonctionnalités principales
 3. Workflow et enchaînement backend
 4. Interactions et dépendances principales
 5. Gestion des capteurs orphelins (NOUVEAUTÉ v1.0.7)
 6. Points d’attention et dépannage

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le module réalise :
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
5. GESTION DES CAPTEURS ORPHELINS (NOUVEAUTÉ v1.0.7)
===============================================================================

Depuis la version 1.0.7, le module détecte et marque automatiquement les « capteurs orphelins » :  
- Un capteur virtuel sans source valide (attribut `source_entity` absent ou inexistant dans l’instance HA)
- Dès sa détection, le sensor reçoit :
    • orphaned_since (datetime ISO UTC)
    • pending_cleanup = True (flag de supervision)
    • cleanup_status = "pending"

Exemple de logique :

    if is_virtual and not is_helper:
        source_entity = state.attributes.get("source_entity")
        if not source_entity or not hass.states.get(source_entity):
            sensor_data["orphaned_since"] = datetime.utcnow().isoformat()
            sensor_data["pending_cleanup"] = True
            sensor_data["cleanup_status"] = "pending"
            sensors.append(sensor_data)
            continue

Un capteur orphelin reste dans cet état jusqu’à:
- Réassociation à une source valide (reset des flags)
- Traitement manuel ou automatique par l’admin (API/Frontend, voir `sensor_sync_manager.py` et `manage_selection.py`)
- Purge ou archivage après délai, selon la configuration système

===============================================================================
6. POINTS D’ATTENTION ET DÉPANNAGE
===============================================================================

- Si des entités attendues ne remontent pas, lancer manuellement la détection (service HA)
- Adapter l’algorithme si de nouvelles intégrations matérielles sont ajoutées à l’écosystème
- Pour le suivi des orphelins, vérifier la liste exposée dans le frontend admin

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================

