===============================================================================
 SYNCHRONISATEUR D’ÉTAT ENTRE SENSORS - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Fonctions principales et objectif
  3. Workflow de synchronisation
  4. Utilisation typique
  5. Points d’attention & dépannage

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le module  centralise la logique de synchronisation des états entre plusieurs sensors :
- Synchronise les entités dupliquées, helpers, ou issues de plateformes hétérogènes
- Garantit la cohérence des mesures et le passage des updates entre entités liés

===============================================================================
2. FONCTIONS PRINCIPALES ET OBJECTIF
===============================================================================

- Détection des sensors dupliqués ou en “groupe logique”
- Propagation d’état (writing back, reset, bascule force synchronization)
- Permet d’éviter des incohérences après migration, fusion ou changement d’intégration

===============================================================================
3. WORKFLOW DE SYNCHRONISATION
===============================================================================

- Appelé lors de certaines opérations flow ou save_selection
- Peut être lancé manuellement (service ou endpoint REST)
- Relance une propagation ou consolide les valeurs clés

===============================================================================
4. UTILISATION TYPIQUE
===============================================================================

- Après une consolidation des sensors, création de nouveaux helpers, ou migration inter-intégrations
- Peut être associé au cleanup ou fix de sensors

===============================================================================
5. POINTS D’ATTENTION & DÉPANNAGE

- Surveiller les logs : détection “sensor non synchronisable” possible si nouveaux modèles non supportés
- En cas de propagation incomplète, lancer un resync manuel

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
