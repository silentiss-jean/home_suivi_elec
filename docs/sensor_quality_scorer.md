================================================================================
  SYSTÈME DE SCORING DE QUALITÉ DES CAPTEURS - HOME SUIVI ÉLEC
  Documentation complète - Octobre 2025
================================================================================

📋 TABLE DES MATIÈRES
  1. Vue d'ensemble
  2. Architecture du système
  3. Fichiers créés et modifiés
  4. APIs REST disponibles
  5. Utilisation
  6. Personnalisation
  7. Critères de scoring
  8. Dépannage
  9. Exemples d'utilisation

================================================================================
1. VUE D'ENSEMBLE
================================================================================

Le système de scoring de qualité évalue automatiquement chaque capteur selon
10+ critères pour déterminer sa fiabilité et son adéquation à votre usage.

Échelle de notation :
  ⭐⭐⭐⭐ (≥130 pts) : EXCELLENCE - Capteur optimal
  ⭐⭐⭐   (100-129)  : BON - Recommandé pour usage normal
  ⭐⭐     (70-99)    : ACCEPTABLE - Fonctionne mais améliorable
  ⭐       (<70)      : FAIBLE - À éviter ou corriger

Affichage dans l'interface :
  • Badges colorés à côté de chaque capteur
  • Tooltip avec recommandation au survol
  • Score numérique (ex: 110/150)

================================================================================
2. ARCHITECTURE DU SYSTÈME
================================================================================

┌─────────────────────────────────────────────────────────────────┐
│ BACKEND (Python)                                                │
├─────────────────────────────────────────────────────────────────┤
│  sensor_quality_scorer.py                                       │
│    ├─ calculate_quality_score()  → Calcule le score (0-150)    │
│    ├─ get_recommendation()       → Texte recommandation        │
│    └─ get_stars()                → Nombre d'étoiles            │
│                                                                 │
│  manage_selection_views.py                                      │
│    ├─ GetSensorQualityScoresView → API GET /get_sensor_qual... │
│    └─ AutoSelectBestSensorsView  → API POST /auto_select_be... │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (JavaScript)                                           │
├─────────────────────────────────────────────────────────────────┤
│  configuration.js                                               │
│    ├─ enrichWithQualityScores() → Appelle l'API               │
│    ├─ createQualityBadgeHTML()  → Génère le HTML du badge     │
│    └─ computeSensorScore()      → Calcul frontend alternatif  │
│                                                                 │
│  selectionPanel.js                                              │
│    └─ Injection des badges dans les listes de capteurs         │
│                                                                 │
│  style.css                                                      │
│    └─ Styles des badges (.quality-badge)                       │
└─────────────────────────────────────────────────────────────────┘

================================================================================
3. FICHIERS CRÉÉS ET MODIFIÉS
================================================================================

NOUVEAUX FICHIERS :
  📄 /config/custom_components/home_suivi_elec/sensor_quality_scorer.py
     Système complet de scoring avec tous les critères

FICHIERS MODIFIÉS :
  📝 /config/custom_components/home_suivi_elec/__init__.py
     └─ Lignes 531-536 : Import et enregistrement des nouvelles vues

  📝 /config/custom_components/home_suivi_elec/manage_selection_views.py
     └─ Lignes 690-800 : Nouvelles classes API
        • AutoSelectBestSensorsView
        • GetSensorQualityScoresView

  📝 /config/custom_components/home_suivi_elec/web_static/js/configuration.js
     └─ Lignes 14-52 : Fonction enrichWithQualityScores()
     └─ Ligne 243 : Appel de l'enrichissement
     └─ Ligne 244 : Stockage dans window.__ALL_CAPTEURS__

  📝 /config/custom_components/home_suivi_elec/web_static/js/selectionPanel.js
     └─ Ligne 5 : Import createQualityBadgeHTML
     └─ Ligne 93 : Création du badge
     └─ Ligne 100 : Injection dans le HTML

  📝 /config/custom_components/home_suivi_elec/web_static/style.css
     └─ Classes .quality-badge avec gradients colorés

================================================================================
4. APIs REST DISPONIBLES
================================================================================

┌─────────────────────────────────────────────────────────────────┐
│ API 1 : Récupération des scores                                │
├─────────────────────────────────────────────────────────────────┤
│ URL      : /api/home_suivi_elec/get_sensor_quality_scores      │
│ Méthode  : GET                                                  │
│ Auth     : Aucune (accessible localement)                       │
│                                                                 │
│ Réponse JSON :                                                  │
│ {                                                               │
│   "success": true,                                              │
│   "sensors": [                                                  │
│     {                                                           │
│       "entity_id": "sensor.xxx",                                │
│       "quality_score": 110,                                     │
│       "recommendation": "⭐⭐⭐ BON - Recommandé",                │
│       "stars": "⭐⭐⭐",                                           │
│       "friendly_name": "...",                                   │
│       "integration": "...",                                     │
│       ...                                                       │
│     }                                                           │
│   ],                                                            │
│   "total": 219                                                  │
│ }                                                               │
│                                                                 │
│ Exemple d'utilisation :                                         │
│   curl http://localhost:8123/api/home_suivi_elec/get_sensor... │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ API 2 : Sélection automatique des meilleurs capteurs           │
├─────────────────────────────────────────────────────────────────┤
│ URL      : /api/home_suivi_elec/auto_select_best_sensors       │
│ Méthode  : POST                                                 │
│ Auth     : Aucune                                               │
│                                                                 │
│ Fonction :                                                      │
│   • Analyse tous les capteurs                                   │
│   • Sélectionne le meilleur pour chaque appareil               │
│   • Évite les doublons                                          │
│   • Privilégie les capteurs physiques                           │
│                                                                 │
│ Réponse JSON :                                                  │
│ {                                                               │
│   "success": true,                                              │
│   "selected_count": 15,                                         │
│   "selected": [                                                 │
│     "sensor.xxx",                                               │
│     "sensor.yyy",                                               │
│     ...                                                         │
│   ]                                                             │
│ }                                                               │
│                                                                 │
│ Exemple d'utilisation :                                         │
│   curl -X POST http://localhost:8123/api/home_suivi_elec/au... │
└─────────────────────────────────────────────────────────────────┘

================================================================================
5. UTILISATION
================================================================================

5.1 DANS L'INTERFACE WEB
─────────────────────────
1. Ouvrir : http://VOTRE_IP:8123/local/home_suivi_elec/
2. Aller dans l'onglet "Configuration"
3. Les badges s'affichent automatiquement à côté de chaque capteur

5.2 SÉLECTION AUTOMATIQUE
──────────────────────────
1. Cliquer sur le bouton "✨ Lancer la sélection automatique"
2. Le système analyse tous les capteurs
3. Sélection automatique des meilleurs selon les critères :
   • Energy (kWh) prioritaire sur Power (W)
   • Score de qualité optimal
   • Un seul capteur par appareil
   • Capteurs physiques > virtuels

5.3 EXPORT DES SCORES
──────────────────────
Pour analyser les scores en dehors de l'interface :

  # Export JSON complet
  curl http://localhost:8123/api/home_suivi_elec/get_sensor_quality_scores \
    > /config/sensor_scores.json

  # Top 10 des meilleurs capteurs
  curl -s http://localhost:8123/api/home_suivi_elec/get_sensor_quality_scores \
    | jq '.sensors | sort_by(-.quality_score) | .[:10]'

  # Capteurs avec score < 100
  curl -s http://localhost:8123/api/home_suivi_elec/get_sensor_quality_scores \
    | jq '.sensors[] | select(.quality_score < 100)'

================================================================================
6. PERSONNALISATION
================================================================================

6.1 MODIFIER LES SEUILS DE SCORING
───────────────────────────────────
Fichier : sensor_quality_scorer.py

Fonction : get_recommendation(score: int)

  # Valeurs actuelles
  if score >= 130:
      return "⭐⭐⭐⭐ EXCELLENCE"
  elif score >= 100:
      return "⭐⭐⭐ BON"
  elif score >= 70:
      return "⭐⭐ ACCEPTABLE"
  else:
      return "⭐ FAIBLE"

  # Pour être plus exigeant, augmentez les seuils :
  if score >= 140:  # Au lieu de 130
      return "⭐⭐⭐⭐ EXCELLENCE"
  # etc.

6.2 MODIFIER LES COULEURS DES BADGES
─────────────────────────────────────
Fichier : style.css

  .quality-badge.quality-excellent {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    /* Violet : Excellence */
  }

  .quality-badge.quality-good {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    /* Bleu : Bon */
  }

  .quality-badge.quality-medium {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    /* Orange : Moyen */
  }

  .quality-badge.quality-low {
    background: linear-gradient(135deg, #f85032 0%, #e73827 100%);
    /* Rouge : Faible */
  }

6.3 AJUSTER LES CRITÈRES DE SCORING
────────────────────────────────────
Fichier : sensor_quality_scorer.py

Fonction : calculate_quality_score(sensor: dict)

Points attribués par critère :
  State class "total_increasing"          +25 pts
  State class "measurement"               +20 pts
  Device class défini                     +15 pts
  Unité valide (W, kWh)                   +15 pts
  Intégration fiable (Shelly, Zigbee)     +20 pts
  Données disponibles                     +10 pts
  Capteur physique                        +10 pts
  State class match type                  +10 pts
  Mise à jour récente                     +5 pts
  Attributs complets                      +10 pts

Pour modifier, ajustez les valeurs dans la fonction.

================================================================================
7. CRITÈRES DE SCORING DÉTAILLÉS
================================================================================

CRITÈRE 1 : STATE CLASS (max 25 pts)
─────────────────────────────────────
  • "total_increasing" : +25 pts → Meilleur pour énergie cumulative
  • "total"            : +20 pts → Bon pour totaux
  • "measurement"      : +20 pts → Bon pour mesures instantanées
  • Absent             : +0 pts

CRITÈRE 2 : DEVICE CLASS (max 15 pts)
──────────────────────────────────────
  • "power" ou "energy" : +15 pts
  • Autre valeur        : +10 pts
  • Absent              : +0 pts

CRITÈRE 3 : UNITÉ DE MESURE (max 15 pts)
─────────────────────────────────────────
  • "kWh" (energy)  : +15 pts
  • "W" (power)     : +15 pts
  • Autre unité     : +5 pts
  • Absent          : +0 pts

CRITÈRE 4 : INTÉGRATION SOURCE (max 20 pts)
────────────────────────────────────────────
  Fiables (local) :
    • shelly, mqtt, modbus, z_wave, zigbee : +20 pts
  
  Moyennes :
    • tplink, tuya, tasmota : +15 pts
  
  Virtuelles :
    • template, utility_meter, integration : +10 pts
  
  Autres :
    • min_max, statistics : +5 pts

CRITÈRE 5 : DISPONIBILITÉ DONNÉES (max 10 pts)
───────────────────────────────────────────────
  • État disponible et valide : +10 pts
  • État "unavailable"        : +0 pts

CRITÈRE 6 : TYPE DE CAPTEUR (max 10 pts)
─────────────────────────────────────────
  • Capteur physique (non helper) : +10 pts
  • Capteur virtuel (helper)      : +5 pts

CRITÈRE 7 : COHÉRENCE TYPE/STATE_CLASS (max 10 pts)
────────────────────────────────────────────────────
  • Energy + total_increasing : +10 pts
  • Power + measurement       : +10 pts
  • Incohérence               : +0 pts

CRITÈRE 8 : FRAÎCHEUR DES DONNÉES (max 5 pts)
──────────────────────────────────────────────
  • Mise à jour < 5 minutes : +5 pts
  • Données anciennes       : +0 pts

CRITÈRE 9 : ATTRIBUTS DISPONIBLES (max 10 pts)
───────────────────────────────────────────────
  • Attributs riches (device_id, area_id, etc.) : +10 pts
  • Attributs minimaux                          : +5 pts

CRITÈRE 10 : BONUS SPÉCIAUX (variable)
───────────────────────────────────────
  • Capteur non dupliqué : +5 pts
  • Nom explicite        : +3 pts

TOTAL MAXIMUM : ~150 points

================================================================================
8. DÉPANNAGE
================================================================================

PROBLÈME 1 : Les badges ne s'affichent pas
───────────────────────────────────────────
Solution 1 : Vider le cache du navigateur
  1. F12 → Onglet "Network"
  2. Clic droit → "Clear browser cache"
  3. Ctrl+Shift+R pour recharger

Solution 2 : Vérifier l'import dans selectionPanel.js
  grep "import.*createQualityBadgeHTML" \
    /config/custom_components/home_suivi_elec/web_static/js/selectionPanel.js
  
  # Doit retourner :
  # import { createQualityBadgeHTML } from "./configuration.js";

Solution 3 : Vérifier les erreurs JavaScript
  1. F12 → Onglet "Console"
  2. Chercher des erreurs rouges
  3. Si "createQualityBadgeHTML is not defined" → Recharger la page

PROBLÈME 2 : API retourne 404
──────────────────────────────
Solution : Redémarrer Home Assistant
  ha core restart

Vérification : Tester l'API
  curl http://localhost:8123/api/home_suivi_elec/get_sensor_quality_scores

PROBLÈME 3 : Scores incorrects ou absents
──────────────────────────────────────────
Cause 1 : L'enrichissement n'a pas été appelé

  # Vérifier dans la console du navigateur
  window.__ALL_CAPTEURS__
  
  # Si undefined, recharger la page

Cause 2 : Le capteur manque d'attributs
  
  # Vérifier les attributs du capteur dans Home Assistant
  # Developer Tools → States → Chercher le capteur
  # Vérifier : state_class, device_class, unit_of_measurement

PROBLÈME 4 : Tous les capteurs ont le même score
──────────────────────────────────────────────────
Vérification : Consulter les logs Home Assistant
  
  grep "quality_score" /config/home-assistant.log
  
  # Redémarrer l'intégration si nécessaire

================================================================================
9. EXEMPLES D'UTILISATION
================================================================================

EXEMPLE 1 : Trouver les capteurs à améliorer
─────────────────────────────────────────────
curl -s http://localhost:8123/api/home_suivi_elec/get_sensor_quality_scores \
  | jq '.sensors[] | select(.quality_score < 80) | 
    {entity_id, score: .quality_score, integration, recommendation}'

EXEMPLE 2 : Comparer deux capteurs pour le même appareil
──────────────────────────────────────────────────────────
curl -s http://localhost:8123/api/home_suivi_elec/get_sensor_quality_scores \
  | jq '.sensors[] | select(.entity_id | contains("bureau")) | 
    {entity_id, score: .quality_score, stars}'

EXEMPLE 3 : Statistiques par intégration
─────────────────────────────────────────
curl -s http://localhost:8123/api/home_suivi_elec/get_sensor_quality_scores \
  | jq '[.sensors[] | .integration] | group_by(.) | 
    map({integration: .[0], count: length})'

EXEMPLE 4 : Export pour analyse Excel
──────────────────────────────────────
curl -s http://localhost:8123/api/home_suivi_elec/get_sensor_quality_scores \
  | jq -r '.sensors[] | [.entity_id, .quality_score, .integration, 
    .recommendation] | @csv' > scores.csv

================================================================================
10. MAINTENANCE ET ÉVOLUTION
================================================================================

MISES À JOUR FUTURES POSSIBLES
───────────────────────────────
1. Ajout de nouveaux critères de scoring
   • Fiabilité historique (uptime)
   • Précision des mesures
   • Latence de mise à jour

2. Dashboard dédié aux scores
   • Graphiques d'évolution
   • Classement des capteurs
   • Alertes pour capteurs défaillants

3. Recommandations automatiques
   • Suggestions de remplacement
   • Détection des capteurs obsolètes

BACKUP RECOMMANDÉ
─────────────────
Avant toute modification :
  
  # Backup complet
  tar -czf home_suivi_elec_backup_$(date +%Y%m%d).tar.gz \
    /config/custom_components/home_suivi_elec/

================================================================================
HISTORIQUE DES VERSIONS
================================================================================

v1.0 beta (26 octobre 2025)
  ✅ Système de scoring complet
  ✅ API REST fonctionnelles
  ✅ Badges visuels dans l'interface
  ✅ Sélection automatique des meilleurs capteurs
  ✅ 219 capteurs analysés et scorés

================================================================================
SUPPORT ET CONTRIBUTION
================================================================================

En cas de problème :
  1. Consulter la section 8 (Dépannage)
  2. Vérifier les logs : /config/home-assistant.log
  3. Tester les APIs avec curl

Pour contribuer :
  • Proposer de nouveaux critères de scoring
  • Améliorer les seuils selon votre usage
  • Partager vos configurations optimales

================================================================================
FIN DE LA DOCUMENTATION
================================================================================

