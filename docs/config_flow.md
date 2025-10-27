===============================================================================
 FLUX DE CONFIGURATION & OPTIONS UTILISATEUR - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Vue d'ensemble
  2. Architecture du flow
  3. Fichiers concernés
  4. Étapes du flow utilisateur
  5. Paramètres, options & validation
  6. Personnalisation
  7. Dépannage
  8. Exemples d'utilisation

===============================================================================
1. VUE D'ENSEMBLE
===============================================================================

Le fichier  gère tout le workflow de configuration lors de l'installation ou mise à jour de l'intégration :
- Création du hub principal (nom, contrat, options)
- Saisie et validation des tarifs et paramètres spécifiques
- Gestion automatique des doublons et des entrées existantes
- Lancement ou modification de la configuration sans redémarrer Home Assistant

===============================================================================
2. ARCHITECTURE DU FLOW
===============================================================================

┌──────────────────────────────────────────────────────────┐
│ ConfigFlow : HomeSuiviElecFlow (classe principale)       │
├──────────────────────────────────────────────────────────┤
│  async_step_user()   → Step 1 : Nom du hub, contrat, auto│
│  async_step_tarifs() → Step 2 : Tarifs et options        │
│  async_create_entry  → Création finale du hub            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Liaison OptionsFlow                                      │
├──────────────────────────────────────────────────────────┤
│ HomeSuiviElecOptionsFlow  → Gère les options post-install│
└──────────────────────────────────────────────────────────┘

===============================================================================
3. FICHIERS CONCERNÉS
===============================================================================

📄 /config/custom_components/home_suivi_elec/config_flow.py
    - Définition du flow principal et gestion des étapes

📝 Fichiers connexes :
    - options_flow.py  (Options post-install & roue de config HA)
    - const.py         (Constantes, contrats, defaults)
    - manifest.json    (Déclaration du flow dans l'intégration)

===============================================================================
4. ÉTAPES DU FLOW UTILISATEUR
===============================================================================

Étape 1 : Saisie principale
  - Nom du hub (unique)
  - Type de contrat (prix unique, heures creuses…)
  - Option auto_generate (active le setup automatique)

Étape 2 : Saisie des tarifs
  - Selon type sélectionné :
    • Prix unique : Saisie prix HT, TTC, abonnement mensuel
    • Heures creuses : Saisie HP/HC, horaires et abonnements

Validation :
  - Si doublon de nom (hub déjà existant) > Flow abort ("hub_exists")
  - Si OK > Création de la config et passage à l’intégration

===============================================================================
5. PARAMÈTRES, OPTIONS & VALIDATION
===============================================================================

Paramètres requis :
  - CONF_NAME           : Nom du hub (str, unique)
  - CONF_TYPE_CONTRAT   : Type de contrat (clé dans CONTRATS)
  - CONF_AUTO_GENERATE  : Booléen (activation setup auto)

Paramètres optionnels selon contrat (vol.Schema) :
  - CONF_PRIX_HT, CONF_PRIX_TTC
  - CONF_ABONNEMENT_MENSUEL_HT, CONF_ABONNEMENT_MENSUEL_TTC
  - CONF_PRIX_HT_HP, CONF_PRIX_HT_HC
  - CONF_PRIX_TTC_HP, CONF_PRIX_TTC_HC
  - CONF_HC_START, CONF_HC_END

Validation :
  - Utilisation de voluptuous pour tous les champs
  - Valeurs par défaut fournies (DEFAULTS selon contrat)
  - Types (float, string, bool) vérifiés avant création

===============================================================================
6. PERSONNALISATION
===============================================================================

Contrats personnalisés :
  - Ajouter/éditer les types dans const.py > CONTRATS, DEFAULTS

Tarifs et plages horaires :
  - Modifier les valeurs dans DEFAULTS pour suggérer des tarifs

Options avancées :
  - Activer/désactiver la génération automatique via auto_generate

OptionsFlow :
  - Personnaliser la roue d’options (advanced settings) > options_flow.py

===============================================================================
7. DÉPANNAGE
===============================================================================

PROBLÈME 1 : Impossible de créer un hub (abort "hub_exists")
→ Choisir un nom unique
→ Vérifier la liste des hubs dans la config HA

PROBLÈME 2 : Valeurs refusées ou erreurs de validation
→ Revoir types et champs requis (float, string)
→ Utiliser les options proposées par défaut

PROBLÈME 3 : Contrat ou tarif manquant
→ Vérifier const.py pour les clés disponibles

===============================================================================
8. EXEMPLES D'UTILISATION
===============================================================================

Exemple : Ajouter un hub principal
  1. Installer l’intégration via HACS
  2. Saisir nom du hub et type de contrat dans le flow
  3. Valider et saisir les tarifs
  4. Le hub apparaît dans les intégrations Home Assistant

Exemple : Personnaliser le contrat
  - Modifier const.py pour ajouter "weekend" ou un nouveau type
  - Relancer le flow pour proposer le nouveau choix

Exemple : Options avancées via la roue
  - Cliquer sur l’engrenage > Options
  - Modifier les paramètres dynamiquement (auto_generate, tarifs...)

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
