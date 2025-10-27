===============================================================================
 APIS REST, VUES HTTP ET ENDPOINTS - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Vue d'ensemble
  2. Architecture et principes
  3. Principales classes et endpoints REST
  4. Lien avec manage_selection.py et le frontend
  5. Données manipulées et règles de validation
  6. Synchronisation et flux utilisateur
  7. Dépannage

===============================================================================
1. VUE D'ENSEMBLE
===============================================================================

Le module  centralise **l’ensemble des APIs REST exposées par l’intégration pour la sélection, gestion avancée, scoring et diagnostic des capteurs**.  
Il sépare explicitement les vues REST (HTTP) de la logique métier (présente dans manage_selection.py), permettant ainsi une extension facile ainsi qu’un dialogue poussé avec les frontends (web custom + UI HA).

===============================================================================
2. ARCHITECTURE ET PRINCIPES
===============================================================================

┌─────────────────────────────────────────────────────────────┐
│ manage_selection_views.py                                   │
├─────────────────────────────────────────────────────────────┤
│ - Définit de nombreuses classes HomeAssistantView           │
│ - API REST stateless (GET/POST, accès direct, pas d’UI)     │
│ - Utilise les fichiers de données partagés (JSON, yaml)     │
│ - Importe juste la logique load/save/core depuis manage_selection.py
└─────────────────────────────────────────────────────────────┘

Toutes les routes /api/home_suivi_elec/… sont définies ici.

===============================================================================
3. PRINCIPALES CLASSES ET ENDPOINTS REST
===============================================================================

**Sélection et gestion :**
- **GetSensorsView**        :          (état sélection + alternatives)
- **SaveSelectionView**     :       (POST activations frontend)
- **GetSelectionView**      :        (état brut capteurs_selection.json)

**Analyse et usage :**
- **GetConsumptionsView**   :     (consos par période/cycle)
- **GetInstantPowerView**   :  (puissance W de tous les sensors)
- **GetSummaryView**        :          (stats globales, doublons)

**Qualité & auto-selection :**
- **AutoSelectBestSensorsView** :  (auto sélection/scoring)
- **GetSensorQualityScoresView**:  (scores bruts front)

**User config & options :**
- **GetUserConfigView, SaveUserConfigView**  :  et 
- **GetUserOptionsView, SaveUserOptionsView**:  et 

**Sync avancé (si activé) :**
- **GetSyncStatusView/ForceSyncView**        :  / 

===============================================================================
4. LIEN AVEC manage_selection.py ET LE FRONTEND
===============================================================================

- Toutes les APIs sont des “vues” HTTP qui ne font que wrapper des fonctions utilitaires/JSON du cœur métier,
  fournies par manage_selection.py (load/save, enrichissement, vérif):
  - *Aucune logique métier lourde dans ce fichier*
  - *Chaque view lit/écrit les mêmes fichiers que l’UI et la configuration HA (data/capteurs_selection.json, etc)*

- Le frontend (configuration.js, selectionPanel.js, panel React) interagit exclusivement via ces endpoints (POST/GET),
  garantissant ainsi une séparation stricte (aucune bidouille JS côté HA).

===============================================================================
5. DONNÉES MANIPULÉES ET RÈGLES DE VALIDATION
===============================================================================

- Entrées et sorties sont toujours au format JSON strict, 
  validées côté backend (types, présence des champs requis, signature des doublons, etc).
- Le format suit les conventions de manage_selection.py : 
    { "entity_id": ..., "enabled": true, ... }

- Beaucoup d’APIs REST retournent des stats, logs, ou des listes “enrichies” de capteurs :
    * device_id, area_id, integration, qualité, scores, etc.

===============================================================================
6. SYNCHRONISATION ET FLUX UTILISATEUR
===============================================================================

- **Lecture de la sélection**          : via /get_sensors ou /get_selection (UI table, JS, React)
- **Modification (checkbox “enabled”)**: POST sur /save_selection
- **Consultation/Modification options**: /get_user_options et /save_user_options
- **Auto-selection meilleure config**  : /auto_select_best_sensors (pilotée par l’UI)
- **Diagnostic, doublons, scoring**    : via /get_summary, /get_sensor_quality_scores
- **Synchronisation utility_meter**    : /sync/force et statut /sync/status (si actif/demandé)

Toute l’UI frontend fait uniquement des appels fetch/POST sur ces endpoints.  
La cohérence est donc garantie sur tous les canaux (Home Assistant UI, panel custom, frontend JS).

===============================================================================
7. DÉPANNAGE
===============================================================================

PROBLÈME 1 : Données absentes ou vides dans l’UI
→ Valider le retour JSON des APIs via un outil (curl, console réseau)

PROBLÈME 2 : Sauvegarde ou update rejeté
→ Vérifier la validité des données en POST, voir éventuellement les logs backend (errors)

PROBLÈME 3 : Score/qualité non visible en live
→ Lancer manuellement la vue /get_sensor_quality_scores et vérifier “sensors” dans la réponse

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
