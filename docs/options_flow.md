===============================================================================
 OPTIONS UTILISATEUR & PERSONNALISATION DYNAMIQUE - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Vue d'ensemble
  2. Architecture du flow d'options
  3. Fichiers concernés
  4. Paramètres et logique
  5. Workflow utilisateur
  6. Personnalisation
  7. Dépannage
  8. Exemples d'utilisation

===============================================================================
1. VUE D'ENSEMBLE
===============================================================================

Le fichier  gère la roue de configuration (UI "options") permettant
de modifier dynamiquement tous les paramètres essentiels du hub sans redémarrer 
ou réinstaller l'intégration :
- Tarification (unique ou heures creuses)
- Horaires, abonnements, activation auto_generate, etc.
- Gestion 100% dynamique et sauvegarde dans l'entrée Home Assistant

===============================================================================
2. ARCHITECTURE DU FLOW D'OPTIONS
===============================================================================

┌────────────────────────────────────────────────────────┐
│ HomeSuiviElecOptionsFlow (classe principale)           │
├────────────────────────────────────────────────────────┤
│ __init__       → Récupère l'entrée courante            │
│ async_step_init() → Présente tous les champs d'options │
│ async_create_entry → Sauvegarde la configuration       │
└────────────────────────────────────────────────────────┘

Logique :
- Utilisation de voluptuous et config_validation pour chaque champ
- Rappel des valeurs courantes
- Affichage adapté selon le type de contrat (prix unique/heures creuses)

===============================================================================
3. FICHIERS CONCERNÉS
===============================================================================

📄 /config/custom_components/home_suivi_elec/options_flow.py
    - Flow des options UI de Home Assistant

📝 Fichiers connexes :
    - config_flow.py  (pour la liaison et les defaults)
    - const.py        (définitions des clefs, contrats, defaults)

===============================================================================
4. PARAMÈTRES ET LOGIQUE
===============================================================================

Paramètres proposés dans l'UI (selon type de contrat) :
- Nom du hub              (CONF_NAME)
- Type de contrat         (CONF_TYPE_CONTRAT)
- Activation auto_generate (CONF_AUTO_GENERATE)
- Tarifs (prix_HT, prix_TTC, HP/HC, abonnement mensuel)
- Plages horaires (HC_START, HC_END)

Schéma dynamique :
- Les defaults sont fusionnés selon l'entrée courante et les templates de const.py
- Tous les champs sont optionnels mais pré-remplis depuis la config existante

Validation :
- Types : float pour tarifs, bool pour activation, string pour horaires
- Positive_float pour s'assurer de tarifs cohérents

===============================================================================
5. WORKFLOW UTILISATEUR
===============================================================================

1. Ouvrir l'engrenage (⚙️) de l'intégration Home Suivi Élec dans Home Assistant
2. Cliquer sur "Options"
3. Tous les paramètres du hub sont affichés (avec leurs valeurs courantes)
4. Modifier ce qui doit l'être, puis sauvegarder
5. Les nouveaux paramètres sont appliqués instantanément

===============================================================================
6. PERSONNALISATION
===============================================================================

- Ajouter/éditer des types de contrat :
    • const.py > CONTRATS, DEFAULTS
- Prédéfinir valeurs plus adaptées à votre usage dans DEFAULTS
- Étendre le schema (ajouter des options) via le code options_flow.py
- Modifier les validations (ex : accepter tarifs négociés/particuliers)

===============================================================================
7. DÉPANNAGE
===============================================================================

PROBLÈME 1 : Les nouveaux paramètres ne sont pas pris en compte
→ Forcer un reload de l'intégration (bouton "options" > enregistrer > reload)

PROBLÈME 2 : Champ disparu/invisible
→ Vérifier type de contrat sélectionné, relancer options

PROBLÈME 3 : Erreur de validation
→ S'assurer des types (float, string) selon les champs renseignés

===============================================================================
8. EXEMPLES D'UTILISATION
===============================================================================

Exemple : Passage d’un contrat prix unique à heures creuses
- Ouvrir options, sélectionner "heures_creuses", remplir tarifs et horaires

Exemple : Mise à jour de l'abonnement mensuel ttc
- Modifier la valeur concernée, enregistrer

Exemple : Réinitialiser les options par défaut
- Effacer la config custom (dans .storage ou via UI), relancer le flow
i-------------------------------------------------------------------------------
💡 NOTE IMPORTANTE : MODIFICATION POSSIBLE VIA LE FRONTEND WEB
-------------------------------------------------------------------------------

Toutes les options exposées par ce flow peuvent être **modifiées à tout moment, soit via la roue d’options Home Assistant, soit depuis l’interface graphique web avancée (“Onglet Configuration” du panel Suivi Élec)**.  
L’UI web interagit en temps réel avec le backend grâce aux APIs REST, permettant ainsi :
- Consultation et hydratation automatique des valeurs courantes
- Modification directe dans le frontend (champs, menus, sélecteurs…)
- Sauvegarde immédiate et synchronisée côté backend (options_flow.py)
- Répercussion instantanée de tout changement, sans redémarrage

**Cette double entrée garantit une configuration toujours à jour, quel que soit le canal d’édition utilisé.**

-------------------------------------------------------------------------------

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================

