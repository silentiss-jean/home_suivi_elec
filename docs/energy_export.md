===============================================================================
 EXPORTATION DES DONNÉES ÉNERGÉTIQUES - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Logique d’export
  3. Formats et points d’export
  4. Intégrations et dépendances
  5. Workflow d’utilisation
  6. Dépannage

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

 permet la **génération et l’export** des données énergétiques extraites ou calculées par l’intégration, vers des fichiers externes ou API tierces :
- Extraction brute ou agrégée au format CSV/YAML/JSON selon la cible
- Préparation de données pour analyse offline ou import dans d'autres outils
- Possibilité de partitionner ou filtrer à l’export

===============================================================================
2. LOGIQUE D’EXPORT
===============================================================================

- Lecture des données via energy_tracking.py, manage_selection.py, ou tout module analytique
- Encodage et sérialisation dans le format cible
- Sauvegarde sur le disque HA ou en point d’API externe (selon config)

===============================================================================
3. FORMATS ET POINTS D’EXPORT
===============================================================================

- Support attendu pour CSV, YAML, JSON (extensible)
- Points de sortie typiques: , share réseau, ou push API REST

===============================================================================
4. INTÉGRATIONS ET DÉPENDANCES
===============================================================================

- Utilisation directe des sorties analytiques (energy_analytics.py)
- Peut être appelé en batch/scheduled ou sur demande depuis l’UI/REST

===============================================================================
5. WORKFLOW D’UTILISATION
===============================================================================

1. Appel de la fonction d’export (manuel, cron, event HA)
2. Génération du fichier cible dans le format souhaité
3. Possibilité d’intégration avec des workflows d’archivage externes

===============================================================================
6. DÉPANNAGE
===============================================================================

- Problèmes de sérialisation : vérifier le format d’entrée et le mapping des noms de champs
- Absence de fichiers générés : vérifier les droits d’écriture du dossier, les logs backend

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
