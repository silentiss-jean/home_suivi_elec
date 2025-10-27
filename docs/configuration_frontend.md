===============================================================================
 INTERACTIONS FRONTEND <-> BACKEND : CONFIGURATION & OPTIONS
 Documentation complète (interaction configuration.js <=> options_flow.py)
===============================================================================

📋 TABLE DES MATIÈRES
1. Vue d'ensemble
2. Architecture et modules liés
3. Liaison bidirectionnelle (synchronisation des options)
4. Workflow utilisateur (modification + sauvegarde UX)
5. APIs, méthodes et appels utilisés
6. Points d’attention et bonnes pratiques
7. Cas d'usage typiques
8. Dépannage

===============================================================================
1. VUE D'ENSEMBLE
===============================================================================

Le système de configuration Home Suivi Élec offre une **interface unifiée et dynamique** :
- L'utilisateur peut consulter/modifier tous les paramètres clés (tarifs, type contrat, plages horaires…) directement depuis l’UI web,
- Ces actions déclenchent des mises à jour instantanées côté backend Home Assistant, via les endpoints gérés par .

Les modules JavaScript du front (configuration.js, configuration.state.js, configuration.api.js) orchestrent la lecture, l’affichage, et la modification de la configuration, en dialogue permanent avec le backend.

===============================================================================
2. ARCHITECTURE ET MODULES LIÉS
===============================================================================

┌─────────────────────────────────────────────────────┐
│ FRONTEND (web_static/js/)                           │
├─────────────────────────────────────────────────────┤
│ configuration.js       ⇒  charge l’état global,     │
│                        modifie, déclenche save      │
│ configuration.api.js   ⇒  appels fetch (REST POST/GET) backend
│ configuration.state.js ⇒  hydrate l’UI, récupère    │
│                        et met à jour les champs     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ BACKEND (custom_components/home_suivi_elec/)        │
├─────────────────────────────────────────────────────┤
│ options_flow.py        ⇒  expose options modifiables│
│ config_flow.py         ⇒  initialisation, defaults  │
│ manage_selection_views.py ⇒  APIs REST centralisées │
└─────────────────────────────────────────────────────┘

===============================================================================
3. LIAISON BIDIRECTIONNELLE (SYNC OPTIONS)
===============================================================================

- **Lecture initiale** : au chargement, le front appelle  (via ).
- **Hydratation dynamique** : le JS () peuple tous les champs de la config, selon le contrat, et sélectionne dynamiquement les blocs à afficher.
- **Modification** : tout changement dans l'UI (text input, sélecteur, etc) est bindé (voir bindUserOptions) et préparé sous forme de payload JS.
- **Sauvegarde** : clic “Enregistrer’’ déclenche  qui POST sur .
- **Mise à jour backend** : ces données sont traitées et persistées par  — donc relecture OK et options immédiatement effectives.

**Résumé :**
Chaque champ affiché (tarif, heures, type, etc.) dans l’UI correspond à une clé traitée dans  et est modifiable bi-directionnellement.

===============================================================================
4. WORKFLOW UTILISATEUR (MODIF + SAVE)
===============================================================================

1. L'utilisateur accède à l'onglet configuration dans l'UI.
2. L’UI JS charge les valeurs via REST (getUserOptions).
3. Il modifie champs, menus, heures, tarifs (input, select…).
4. Sur clic “Enregistrer” :
    - Création d’un objet payload JS
    - POST direct au backend via API REST
    - options_flow.py reçoit, contrôle, sauvegarde
5. Les changements sont accessibles côté Home Assistant ET re-propagés au front (hydratation).

**Temps réel:** la modification est visible immédiatement, sans reload complet de HA ni perte de contexte.

===============================================================================
5. APIs, MÉTHODES ET APPELS UTILISÉS
===============================================================================

- **getUserOptions** (GET ) — lecture des options actuelles
- **saveUserOptions** (POST ) — écriture options modifiées
- Hydratation via **hydrateUserConfig(options)** (configuration.state.js)
- Liaison bouton/événement via **bindUserOptions(onSave)**
    - le callback asynchrone encapsule le POST JS->HA puis retrigger UI update

===============================================================================
6. POINTS D'ATTENTION ET BONNES PRATIQUES
===============================================================================

- **Conventions de nommage** : s’assurer que les clefs du backend et du JS restent synchronisées
- **Types** : bien respecter float pour tarifs, string pour horaires — erreurs de type empêchent la sauvegarde côté backend
- **Changement de type de contrat** : l’UI affiche/masque dynamiquement les bons blocs et sauvegarde la config adaptée au schéma choisi

**Important** : TOUS les réglages modifiables sur la roue d’options OU via l’onglet frontend sont 100% synchronisés,
pas d’ambiguïté ni de doublon, un seul état source dans le backend.

===============================================================================
7. CAS D'USAGE TYPIQUES
===============================================================================

- Mise à jour du tarif HP/HC via frontend :
    • Changement dans l’UI, clic “Enregistrer” → modif instantanée du backend

- Changement de type de contrat (fixe <> heures creuses) :
    • Switch dans le JS, le bloc affiché change, payload POSTé au backend avec les nouvelles options

- Correction d’un mauvais tarif :
    • Correction dans l’UI, enregistrement immédiat (zero reload HA)

===============================================================================
8. DÉPANNAGE
===============================================================================

PROBLÈME 1 : Les modifications ne sont pas visibles dans l’UI
→ Vérifier que ‘hydrateUserConfig’ est bien appelé après chaque saveUserOptions,
→ Vider cache navigateur ou forcer rechargement

PROBLÈME 2 : Sauvegarde échouée (erreur REST)
→ Vérifier que tous les champs nécessaires sont renseignés et aux bons types

PROBLÈME 3 : Désynchronisation entre roue d’options et frontend custom
→ Relancer intégration (reload), tester via REST APIs que les valeurs sont cohérentes

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
