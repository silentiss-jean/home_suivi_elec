===============================================================================
 GESTION DE LA SÉLECTION DES CAPTEURS - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Vue d'ensemble
  2. Architecture, flux et fichiers liés
  3. Fonctions et logique principale
  4. APIs REST et synchronisation front-end
  5. Données JSON, format et exemples
  6. Workflow utilisateur complet (+ UI)
  7. Personnalisation & extension
  8. Dépannage

===============================================================================
1. VUE D'ENSEMBLE
===============================================================================

 gère toute la logique de sélection, de sauvegarde et de filtrage des capteurs énergétiques à suivre dans l’intégration.
Il synchronise l’état métier entre Home Assistant (backend / data/) et le frontend (UI web et panel selection), tout en conservant la cohérence via un fichier centralisé .

Rôles :
- Gestion du format, de la sauvegarde asynchrone, et des accès concurrents à la sélection
- Filtrage de la liste/état des capteurs à exposer dans l’interface
- APIs REST pour lecture/écriture avec le front (configPanel, configuration.js, selectionPanel.js…)

===============================================================================
2. ARCHITECTURE, FLUX ET FICHIERS LIÉS
===============================================================================

┌──────────────────────────────────────────────────────┐
│ Backend (manage_selection.py)                        │
├──────────────────────────────────────────────────────┤
│ - async_setup_selection_api/hass : expose APIs       │
│ - Fonctions load_json/save_json/add/get/disabling    │
│ - Accès/MAJ : data/capteurs_selection.json           │
├──────────────────────────────────────────────────────┤
│ Fichiers utilisés :                                 │
│    • data/capteurs_selection.json                   │
│    • manage_selection_views.py (déclare REST UI)    │
│    • configuration.js, selectionPanel.js (Front)    │
│    • selectionPanel.jsx (React panel)               │
└──────────────────────────────────────────────────────┘

===============================================================================
3. FONCTIONS ET LOGIQUE PRINCIPALE
===============================================================================

Fonctions clés :
- **load_json(path)** : lit la sélection (JSON) asynchrone
- **save_json(data, path)** : écrit la sélection asynchrone + backups automatiques
- **get_selected_capteurs(hass, ...)**
    → Retourne la sélection courante (par intégration/filtre/type)
- **add_capteur(selection, capteur)**
    → Ajoute/active un capteur dans la bonne section
- **disable_capteur(selection, entity_id)**
    → Désactive/unflag un capteur donné

Fonctions avancées/REST :
- **async_setup_selection_api(hass[, sync_manager])**
    → Expose toutes les APIs REST vers le frontend (lecture, écriture, auto-selection, recherche doublons)

===============================================================================
4. APIS REST ET SYNCHRONISATION FRONT-END
===============================================================================

- **get_sensors / get_selection** : expose la liste des capteurs sélectionnables
- **save_selection** : stocke toute la sélection depuis l’UI (checkbox)
- **set_ignored_entity / choose_best_for_device** : gestion avancée des doublons
- **auto_select_best_sensors** : sélection intelligente via scoring qualité

Ces endpoints sont utilisés par :
- configuration.js (chargement + binding checkbox + badges + synchronisation état)
- selectionPanel.js (interface React ou JS custom)

L’appel POST/GET est asynchrone et la sélection est rechargée à chaque modification (aucun reload HA requis).

===============================================================================
5. DONNÉES JSON, FORMAT ET EXEMPLES
===============================================================================

Fichier clé :  (maj auto après chaque save/sélection)

Exemple :

{
"tapo": [
{ "entity_id": "sensor.bureau_prise_ordinateur_today_energy", "enabled": true, "quality_score": 120 }
],
"powercalc": [ ... ],
"mqtt": [ ... ],
...
}
Champs principaux d’un capteur :
- entity_id (str, unique)
- enabled (bool)
- auto_selected (bool, optionnel)
- quality_score (int, optionnel)
- ... (autres métadonnées si enrichissement)

===============================================================================
6. WORKFLOW UTILISATEUR (BACK + FRONT)
===============================================================================

1. L’utilisateur coche/décoche ses capteurs dans l’interface (configPanel/React ou JS)
2. Le frontend envoie (POST) la sélection complète via 
3. manage_selection.py met à jour  (sauvegarde atomique, backup auto)
4. Toute nouvelle sélection est visible instantanément dans l’UI ET prise en compte par les calculs Home Assistant
5. Les APIs REST permettent récupération, auto-filtrage, et interaction directe avec la sélection via JS ou terminal (curl)

**Note :**
- La sélection peut être modifiée soit depuis l’UI Home Assistant, soit depuis le frontend custom (onglet Configuration ou Sélection).
- Les deux flux convergent vers ce même backend et ce même fichier clé.

===============================================================================
7. PERSONNALISATION & EXTENSION
===============================================================================

- Ajouter des attributs personnalisés à chaque capteur (score, tags…) : enrichir le format JSON + adaptater le load/save dans manage_selection.py.
- Intégrer un scoring custom ou automatique (via sensor_quality_scorer.py) dans la sélection.
- Modifier le comportement API (filtre, auto-selection) en adaptant async_setup_selection_api (REST).

===============================================================================
8. DÉPANNAGE
===============================================================================

PROBLÈME 1 : Capteur non visible dans l’UI
→ Vérifier qu’il apparaît dans capteurs_selection.json + valider enabled:true

PROBLÈME 2 : Sélection non enregistrée
→ Vérifier les requêtes POST du front (console réseau) / logs du backend

PROBLÈME 3 : Sélection O/N pas prise en compte dans Home Assistant
→ Forcer le rechargement de l’intégration, ou relancer la détection

PROBLÈME 4 : Doublons/Conflits non gérés
→ Utiliser la fonction auto_select_best_sensors ou “choisir le meilleur” dans l’UI

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
