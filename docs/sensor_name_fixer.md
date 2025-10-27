===============================================================================
 CORRECTEUR AUTOMATIQUE DE NOMS DE SENSORS - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Workflow et logique principale
  3. Intégration backend/flows
  4. Extensions et personnalisation
  5. Dépannage

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le module  automatise la correction de noms de sensors (renommage, normalisation, uniformité) dans Home Suivi Élec :
- Assure l’uniformité et la compatibilité des noms entités Home Assistant
- Gère les cas problématiques pour éviter des bugs d’affichage, duplicatas ou collision de noms

===============================================================================
2. WORKFLOW ET LOGIQUE PRINCIPALE
===============================================================================

- Fonctions asynchrones de scan, détection et modification des noms trop longs ou non conformes
- Service manuel pour correction à la demande ou batch global (ex : fix_sensor_names)
- Log détaillé des changements appliqués

===============================================================================
3. INTÉGRATION BACKEND/FLOWS
===============================================================================

- Activé automatiquement lors du setup principal (__init__.py)
- Peut être déclenché manuellement via un service Home Assistant dédié
- Implique la relecture/écriture sur entity_registry

===============================================================================
4. EXTENSIONS ET PERSONNALISATION
===============================================================================

- Peut être adapté pour appliquer des règles maison de normalisation, gérer des exceptions, appliquer des préfixes
- Extensible pour forcer un certain schéma de nommage sur de nouveaux modèles de devices

===============================================================================
5. DÉPANNAGE

- Si certains sensors restent non modifiés : vérifier les logs et les patterns exclus/ignorés
- Peut nécessiter un reload/restart d’Home Assistant pour voir le changement en UI

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
