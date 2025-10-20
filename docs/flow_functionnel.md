# 🔁 Flux fonctionnel détaillé

## Étapes principales

1. **Démarrage de l’intégration**
   - `__init__.py` initialise le module.
   - Copie des fichiers statiques si nécessaire.
   - Enregistre les endpoints REST.

2. **Détection automatique**
   - `detect_local.py` analyse les entités disponibles.
   - Filtre selon des critères (type, domaine, device_class).
   - Résultats sauvegardés dans `data/capteurs_detectes.json`.

3. **Configuration**
   - `config_flow.py` ouvre un formulaire dans Home Assistant.
   - L’utilisateur sélectionne les capteurs pertinents.

4. **Sauvegarde / Options**
   - `options_flow.py` gère la reconfiguration.
   - Les choix sont stockés dans `config_entry.data`.

5. **Génération Utility Meter**
   - `utility_meter_manager.py` lit la sélection.
   - Écrit un YAML complet pour le package.
   - Fichier sauvegardé + backup automatique.

6. **Affichage Web**
   - Le panneau latéral charge `/home_suivi_elec/index.html`.
   - Les pages JS interagissent via API REST.

