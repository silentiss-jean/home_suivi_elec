===============================================================================
 ANALYTIQUE ÉNERGIE & AGGRÉGATS - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Fonctions et logiques principales
  3. Workflow analytique
  4. Points de connexion & dépendances
  5. Usage et extension
  6. Dépannage

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le module  gère le calcul, l’analyse et l’agrégation avancée des données énergétiques détectées par l’intégration :
- Calculs d’indicateurs globaux ou détaillés sur les capteurs (moyenne, ratio, cumul, etc)
- Identification de tendances, outliers, ou anomalies énergétiques
- Support pour futures extensions statistiques/rapports

===============================================================================
2. FONCTIONS ET LOGIQUES PRINCIPALES
===============================================================================

- Fonctions d’agrégation et de traitement sur les séries sources HA (power, energy)
- Support d’agrégation par cycle (jour, semaine, mois…)
- Extraction de métriques avancées (classement top N, variance, etc.)

===============================================================================
3. WORKFLOW ANALYTIQUE
===============================================================================

- Appelé en batch ou à la demande (en général via backend ou UI diagnosis panel)
- Nourrit les modules de reporting ou d’export (energy_export.py)
- Peut alimenter des dashboards ou des API REST “diagnostic”

===============================================================================
4. POINTS DE CONNEXION & DÉPENDANCES
===============================================================================

- Dépend directement des données HA collectées via detect_local.py & energy_tracking.py
- Peut collaborer avec generator.py pour sourcer des dashboards analytics Lovelace
- Utilisé pour la génération d’alertes, ou stats de synthèse

===============================================================================
5. USAGE ET EXTENSION
===============================================================================

- Extension possible en ajoutant de nouveaux indicateurs ou traitements : il suffit d’ajouter les fonctions analytiques dans ce module
- Parfaitement chainable avec les flux d’export/reporting

===============================================================================
6. DÉPANNAGE
===============================================================================

- Si des agrégats sont incohérents, vérifier la présence d’anomalies dans les données brutes ou dans la logique de filtrage.
- Logger les étapes pour traquer les valeurs inattendues.

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
