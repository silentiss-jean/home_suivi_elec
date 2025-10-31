===============================================================================
 SUIVI ÉNERGÉTIQUE & SYNCHRONISATION AVANCÉE - HOME SUIVI ÉLEC
 Documentation complète - Solution NO-SHORTENING - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Fonctions principales
  3. Modes de suivi (energy/power)
  4. Solution NO-SHORTENING intégrée
  5. Interfacage & triggers backend
  6. Flux de synchronisation avec utility_meter
  7. Dépannage

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le module energy_tracking.py orchestre le **suivi automatique** des flux d'énergie pour chaque capteur enregistré par l'intégration :
- Suivi, calcul et historisation des valeurs pour chaque sensor/compteur
- Synchronisation fine selon les cycles (heure, jour, semaine...)
- Adaptation entre sensors "power" (valeur instantanée) et "energy" (cumulés)
- ✅ **NOUVEAU** : Création avec noms complets préservés (solution NO-SHORTENING)

===============================================================================
2. FONCTIONS PRINCIPALES
===============================================================================

- Création dynamique de sensors spécialisés selon le type de mesure et cycle associé
- Calcul "trapezoïdal" ou cumul direct selon si la source est de type "power" ou "energy"
- Transformation, propagation des métadonnées, application de scores/fiabilité
- ✅ **AMÉLIORÉ** : Génération entity_id complets sans raccourcissement

===============================================================================
3. MODES DE SUIVI (ENERGY/POWER)
===============================================================================

- Mode "energy" : suit la valeur cumulative kWh, modélisée par des entités de type "CumulativeEnergyCycleSensor"
- Mode "power" : calcule l'énergie via intégration sur la puissance instantanée ("PowerEnergyCycleSensor")

===============================================================================
4. SOLUTION NO-SHORTENING INTÉGRÉE
===============================================================================

🎯 **CHANGEMENTS TECHNIQUES APPLIQUÉS** :

**Préservation noms complets** :
```python
# ✅ NOUVEAU : Noms complets préservés + préfixes
if source_type == "energy":
    entity_id = f"sensor.hse_live_{base_name}_{cycle_short}"  # Complet
else:
    entity_id = f"sensor.hse_live_{base_name}_{cycle_short}"  # Complet
```

**Correspondance directe parent↔enfant** :
- Plus de hash ni troncature des noms
- Association directe basée sur suffixes (_h, _d, _w, _m, _y)
- Élimination des orphelins par design

**Exemples de noms générés** :
```bash
# AVANT (avec hash) :
sensor.hse_live_sprclbcdah_h  # Illisible

# MAINTENANT (NO-SHORTENING) :
sensor.hse_live_salon_prise_radiateur_canape_live_box_consommation_energy_h  # Lisible
sensor.hse_live_salon_prise_radiateur_canape_live_box_consommation_energy_d
sensor.hse_live_salon_prise_radiateur_canape_live_box_consommation_energy_w
sensor.hse_live_salon_prise_radiateur_canape_live_box_consommation_energy_m
sensor.hse_live_salon_prise_radiateur_canape_live_box_consommation_energy_y
```

🏆 **RÉSULTATS OBTENUS** :
- 100% de correspondance parent↔enfant (vs 48% avant)
- Noms lisibles dans logs et interface
- Debug facilité par traçabilité complète

===============================================================================
5. INTERFAÇAGE & TRIGGERS BACKEND
===============================================================================

- Étroitement lié au flux d'initialisation (detect_local.py) et à la sélection (manage_selection.py)
- Peut être réinitialisé par service HA ou API REST
- Les entities générées sont à disposition de tous les modules analytique/export
- ✅ **NOUVEAU** : Intégration API `/diagnostic_groups` pour validation temps réel

===============================================================================
6. FLUX DE SYNCHRONISATION AVEC UTILITY_METER
===============================================================================

- Peut déclencher, lors du setup ou d'un changement de sélection, la synchronisation des utility_meter YAML ou helper HA
- Garantit une cohérence des mesures sur tous les cycles énergétiques
- ✅ **AMÉLIORÉ** : Correspondance directe avec noms complets (plus de mapping complexe)

===============================================================================
7. DÉPANNAGE
===============================================================================

🔍 **PROBLÈMES CLASSIQUES** :

**Incohérences sur les cumuls** :
- Vérifier la bonne catégorisation energy/power des sensors sources
- Contrôler les logs de création des cycles

**Sensors absents** :
- Relancer une détection locale ou vérifier manage_selection.py
- ✅ **NOUVEAU** : Vérifier API `/diagnostic_groups` pour état associations

✅ **PROBLÈMES RÉSOLUS (NO-SHORTENING)** :

**Orphelins (65 sur 125 avant)** :
- ❌ Ancien problème : Mismatch entre noms créés vs recherchés
- ✅ Résolu : Correspondance directe, 0 orphelin

**Noms illisibles** :
- ❌ Ancien problème : Hash `sprclbcdah` non déchiffrable
- ✅ Résolu : Noms complets préservés et descriptifs

**Debug complexe** :
- ❌ Ancien problème : Impossible de tracer les associations
- ✅ Résolu : Logs lisibles, API diagnostic disponible

🛠️ **OUTILS DE DEBUG** :
- API `/diagnostic_groups` : État temps réel des associations
- Logs [ENERGY_TRACKING] : Traçabilité création sensors
- entity_registry : Vérification enregistrement HA

===============================================================================
HISTORIQUE DES VERSIONS
===============================================================================

v2.0 NO-SHORTENING (31 octobre 2025)
  ✅ Intégration solution NO-SHORTENING
  ✅ Préservation noms complets dans création sensors
  ✅ Correspondance directe parent↔enfant
  ✅ Élimination orphelins (0/125 vs 65/125)
  ✅ Intégration API diagnostic_groups

v1.0 (octobre 2025)
  ❌ Création avec noms raccourcis/hashés
  ❌ 52% d'orphelins dus au mismatch
  ❌ Debug complexe par noms illisibles

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================