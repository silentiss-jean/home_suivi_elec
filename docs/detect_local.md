# detect_local.py

## Description
Le module `detect_local.py` est responsable de la détection automatique des éléments locaux liés à l’intégration Home Suivi Élec. Il identifie et configure les composants déjà présents dans Home Assistant, tels que les capteurs ou dispositifs énergétiques, afin de faciliter la configuration initiale du backend.

## Fonctionnalités principales
- Analyse de la configuration Home Assistant locale afin d’identifier les capteurs d’énergie ou de puissance.
- Automatisation de la création des entités ou de leur liaison si elles existent déjà.
- Communication avec les autres modules du backend pour initialiser les comportements par défaut selon la détection effectuée.

## Interactions principales
- **__init__.py** : appelle `run_detect_local()` lors du démarrage du composant pour procéder à la détection.
- **generator.py** : utilise les informations détectées pour générer ou synchroniser les entités manquantes.
- **utility_meter_manager.py** : s’appuie sur les résultats de détection pour synchroniser les compteurs d’énergie.

## Notes techniques
Ce fichier joue un rôle stratégique dans l’automatisation du processus d’installation du backend. Il contribue à réduire la configuration manuelle nécessaire, garantissant une meilleure intégration avec l’environnement Home Assistant.

---
