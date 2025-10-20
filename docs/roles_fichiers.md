# 📘 Rôle des fichiers

| Fichier | Description |
|----------|--------------|
| `__init__.py` | Point d’entrée : init async, services, API, copie fichiers statiques |
| `config_flow.py` | Configuration initiale via l’UI de Home Assistant |
| `options_flow.py` | Gestion de la reconfiguration / options |
| `const.py` | Définition des constantes globales |
| `detect_local.py` | Détection automatique des capteurs |
| `manage_selection.py` | Gestion de la sélection utilisateur |
| `generator.py` | Génération de cartes Lovelace |
| `utility_meter_manager.py` | Écriture des `utility_meter` dans `/config/packages/` |
| `panel_selection.py` | Ajout du panneau web dans la sidebar |
| `debug_json_sets.py` | Outils de debug / export JSON |
| `helpers/validation.py` | Validation des champs utilisateur |
| `helpers/integration_quality_fetch.py` | Télécharge la qualité des intégrations HA |
| `web_static/*.html` | Pages HTML autonomes |
| `web_static/js/*.js` | Scripts front-end modulaires |
| `utils.js` | Fonctions partagées (normalisation, comptage, recherche) |

