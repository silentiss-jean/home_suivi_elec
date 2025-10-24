# const.py

## Description
Le fichier `const.py` regroupe l'ensemble des constantes utilisées dans l'intégration **Home Suivi Élec**. Il centralise toutes les clés de configuration, les domaines, ainsi que les valeurs par défaut, assurant la cohérence entre les différents modules du backend.

## Fonctions principales
- Fournir des identifiants constants pour les options de configuration (par exemple, `CONF_NAME`, `CONF_TYPE_CONTRAT`, `CONF_AUTO_GENERATE`, etc.).
- Définir les dictionnaires de contrats (`CONTRATS`) et valeurs par défaut (`DEFAULTS`) utilisés dans les modules de configuration (`config_flow.py` et `options_flow.py`).
- Être importé dans les autres modules afin d’éviter les duplications de chaînes de caractères dans le code.

## Interactions principales
- **config_flow.py** : utilise les constantes pour construire les schémas de formulaire et gérer la validation des données utilisateur.
- **options_flow.py** : reprend les mêmes constantes pour afficher et modifier les paramètres existants.
- **__init__.py** : utilise les constantes globales `DOMAIN` et `CONF_AUTO_GENERATE` lors de l’initialisation du composant.

## Importance technique
`const.py` agit comme un pivot entre les modules du backend, simplifiant la maintenance et la mise à jour du projet. Toute évolution des noms de paramètres ou des options globales passe par ce fichier.

---
