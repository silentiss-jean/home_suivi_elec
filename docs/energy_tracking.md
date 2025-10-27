===============================================================================
 SUIVI ÉNERGÉTIQUE & SYNCHRONISATION AVANCÉE - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Fonctions principales
  3. Modes de suivi (energy/power)
  4. Interfaçage & triggers backend
  5. Flux de synchronisation avec utility_meter
  6. Dépannage

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le module  orchestre le **suivi automatique** des flux d’énergie pour chaque capteur enregistré par l’intégration :
- Suivi, calcul et historisation des valeurs pour chaque sensor/compteur
- Synchronisation fine selon les cycles (heure, jour, semaine...)
- Adaptation entre sensors “power” (valeur instantanée) et “energy” (cumulés)

===============================================================================
2. FONCTIONS PRINCIPALES
===============================================================================

- Création dynamique de sensors spécialisés selon le type de mesure et cycle associé
- Calcul “trapezoïdal” ou cumul direct selon si la source est de type “power” ou “energy”
- Transformation, propagation des métadonnées, application de scores/fiabilité

===============================================================================
3. MODES DE SUIVI (ENERGY/POWER)
===============================================================================

- Mode “energy” : suit la valeur cumulative kWh, modélisée par des entités de type “CumulativeEnergyCycleSensor”
- Mode “power” : calcule l’énergie via intégration sur la puissance instantanée (“PowerEnergyCycleSensor”)

===============================================================================
4. INTERFAÇAGE & TRIGGERS BACKEND
===============================================================================

- Étroitement lié au flux d’initialisation (detect_local.py) et à la sélection (manage_selection.py)
- Peut être réinitialisé par service HA ou API REST
- Les entities générées sont à disposition de tous les modules analytique/export

===============================================================================
5. FLUX DE SYNCHRONISATION AVEC UTILITY_METER
===============================================================================

- Peut déclencher, lors du setup ou d’un changement de sélection, la synchronisation des utility_meter YAML ou helper HA
- Garantit une cohérence des mesures sur tous les cycles énergétiques

===============================================================================
6. DÉPANNAGE
===============================================================================

- Incohérences sur les cumuls : vérifier la bonne catégorisation energy/power des sensors sources
- Sensors absents : relancer une détection locale ou vérifier manage_selection.py

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
