===============================================================================
 INTERFACE DE SÉLECTION & API ORPHELINS – HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
 1. Rôle du fichier
 2. Fonctionnalités principales
 3. API de gestion des capteurs orphelins (depuis v1.0.7)
 4. Interactions et dépendances principales
 5. Points d’attention et dépannage

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le module manage_selection.py regroupe :
- La gestion des sélections/synchronisations d’entités côté admin/utilisateur avancé
- L’exposition API REST des entités critiques (ex : capteurs éligibles au suivi, capteurs orphelins)
- Les actions massives ou unitaires côté backend sur les capteurs suivis

===============================================================================
2. FONCTIONNALITÉS PRINCIPALES
===============================================================================

- Exposition d’un endpoint REST pour la sélection/affichage des entités
- Export JSON pour le frontend d’admin (listes paramétrables, filtres, etc.)
- Actions PATCH/POST pour la gestion de la base de capteurs surveillés (édition, archivage, suppression...)
- Extension v1.0.7 : gestion directe des capteurs orphelins (API + actions associées)

===============================================================================
3. API DE GESTION DES CAPTEURS ORPHELINS (depuis v1.0.7)
===============================================================================

- Endpoint principal : 
    • GET : liste tous les capteurs avec , détail des champs métiers utiles (nom, zone, date orphelin, dernier état)
    • PATCH/POST : modification état ou suppression/archivage/report différé d’un capteur orphelin (attributs cibles : archived, deleted, orphaned_since, cleanup_status)
    • Call typique : 

- La base des orphelins exposés est synchronisée en temps réel avec sensor_sync_manager.py

- Actions autorisées via API :
    -  : archivage logiciel, non suppression immédiate
    -  : suppression immédiate ou mise en attente de purge
    -  : report du traitement (reset d’horodatage ou notifié plus tard)
    - toute restitution ou revalidation d’une source retire le sensor de la liste

Exemple de payload API :

    {
        "id": "sensor.virtuel_inconnu_42",
        "action": "archive"
    }

===============================================================================
4. INTERACTIONS ET DÉPENDANCES PRINCIPALES
===============================================================================

- Relié au frontend d’administration custom (tableau de gestion orphelins)
- Dialogue direct avec sensor_sync_manager.py pour l’exactitude de l’état exposé
- Utilisé par les autres services métier (purge, historique...)

===============================================================================
5. POINTS D’ATTENTION ET DÉPANNAGE
===============================================================================

- Un sensor archivé reste visible dans les historiques, mais inactif
- La suppression ne peut être annulée que via restauration HA
- Toute modification API se retrouve instantanément côté UI

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
