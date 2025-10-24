# generator.py

## Description
Le module `generator.py` est chargé de la génération automatique des fichiers de configuration YAML et des interfaces Lovelace pour Home Suivi Élec. Il transforme les données détectées et synchronisées en formats exploitables par Home Assistant.

## Fonctionnalités principales
- Génération asynchrone de fichiers YAML à partir des capteurs détectés.
- Création de fichiers configurables et extensibles pour faciliter la maintenance et la personnalisation.
- Point d'entrée `run_all` qui orchestre la génération complète lors de l'exécution du backend.

## Interactions principales
- Lit les capteurs stockés dans `hass.data["home_suivi_elec"]["capteurs"]` collectés par d'autres modules comme `detect_local.py`.
- Utilise des fonctions asynchrones pour écrire les fichiers avec `aiofiles`.
- Produit un fichier de configuration YAML automatique à transmettre à Home Assistant.

## Notes techniques
Le code fait usage de la programmation asynchrone Python pour garantir une exécution fluide et non bloquante dans l'environnement Home Assistant. La génération automatique facilite la mise à jour et l'adaptation aux nouvelles configurations détectées.

---
