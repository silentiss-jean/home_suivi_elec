# config_flow.py

## Description
Ce fichier gère le flux de configuration (config flow) pour l'intégration Home Suivi Élec dans Home Assistant.
Il permet à l'utilisateur de configurer le nom du hub, le type de contrat, et des options comme l'auto-génération de données via un formulaire interactif.

## Fonctionnalités principales
- Classe `HomeSuiviElecFlow` héritant de `ConfigFlow` de Home Assistant.
- Validation des entrées utilisateur avec voluptuous.
- Vérification pour éviter la duplication des noms de hub dans la configuration existante.
- Construction de formulaires dynamiques pour la saisie des paramètres.

## Interactions
- Utilise des constantes définies dans `const.py` pour les valeurs de configuration possibles.
- Fait appel à `HomeSuiviElecOptionsFlow` dans `options_flow.py` pour gérer les options avancées.

## Extrait de Code

```python
class HomeSuiviElecFlow(config_entries.ConfigFlow, domain=DOMAIN):
    async def async_step_user(self, user_input=None):
        # Gère la saisie utilisateur et la validation
```

---

