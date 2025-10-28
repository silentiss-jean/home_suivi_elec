===============================================================================
 GESTION SYNCHRONISATION & ORPHELINS – HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
 1. Rôle du fichier
 2. Fonctionnalités principales
 3. Gestion et workflow des capteurs orphelins (depuis v1.0.7)
 4. Interactions et dépendances principales
 5. Points d’attention et dépannage

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le module sensor_sync_manager.py centralise :
- La synchronisation périodique des sensors et l’état courant du parc détecté/monitoré
- Les opérations de maintenance ou correctives sur la base des capteurs métiers (modifications, nettoyages, archivages)
- La détection et le traitement des situations anormales ou bloquantes côté capteurs (dont : capteurs orphelins)

===============================================================================
2. FONCTIONNALITÉS PRINCIPALES
===============================================================================

- Boucle principale de rafraîchissement (planifiée ou appelable via service)
- Contrôle de cohérence des sensors enregistrés vs. l’état réel Home Assistant
- Mise à jour des attributs métiers (date, zone, last_state, etc.)
- Coordination avec les fichiers d’API/admin pour la gestion documentaire et le pilotage des états
- Prise en charge explicite de la supervision des capteurs orphelins (v1.0.7+)

===============================================================================
3. GESTION ET WORKFLOW DES CAPTEURS ORPHELINS (depuis v1.0.7)
===============================================================================

- À chaque synchro : filtrage de tous les capteurs flagués 
- Si l’attribut  > seuil configuré (par défaut : X jours), passage du capteur dans la file d’attente de purge ou popin de notification admin (exemple : via REST ou notifs HA)
- Possibilité de voir/agir sur la liste d’orphelins via l’API ou le frontend admin
- Si un capteur reprend une source valide : reset automatique des champs  et 

Logique :

    for sensor in sensors:
        if sensor.get("pending_cleanup") == True:
            age = (now - iso_to_datetime(sensor['orphaned_since'])).days
            if age > ORPHAN_THRESHOLD_DAYS:
                sensors_to_notify.append(sensor)
        # Réinitialiser si redevenu valide :
        if sensor_recouvré:
            sensor["pending_cleanup"] = False
            sensor.pop("orphaned_since", None)
            sensor["cleanup_status"] = "cleared"

===============================================================================
4. INTERACTIONS ET DÉPENDANCES PRINCIPALES
===============================================================================

- Communique avec manage_selection.py pour exposition frontend/admin
- Utilise la file API pour actions de purge/archivage différée
- Supervisé (ou déclenchable) par des tâches planifiées/callback (ex : cron custom HA)

===============================================================================
5. POINTS D’ATTENTION ET DÉPANNAGE
===============================================================================

- Adapter le seuil de supervision selon le besoin métier ou performance du système
- Penser à vérifier l’intégrité des capteurs validés, et leurs dépendances
- Les opérations admin sont auditables depuis le frontend (log ou notification)

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
