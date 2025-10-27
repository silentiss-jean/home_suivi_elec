===============================================================================
 OUTIL DE DEBUG DÉTECTION LOCALE (STANDALONE) - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Usage et contexte
  3. Fonctionnalités du script standalone
  4. Interactions avec detect_local.py et le backend
  5. Cas d’utilisation et limites

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le fichier  est un outil de debug dédié visant à :
- Permettre l’exécution “hors intégration” de la logic de détection locale (hors HA complet),
- Simuler ou tester la détection dans un contexte isolé (dev, test, migration).

===============================================================================
2. USAGE ET CONTEXTE
===============================================================================

Ce script est à lancer manuellement, généralement via la ligne de commande ou environnement de développement.
Il reprend l’algorithme principal de détection mais sans nécessiter que Home Assistant soit opérationnel, permettant ainsi un cycle de debug/test accéléré.

===============================================================================
3. FONCTIONNALITÉS DU SCRIPT STANDALONE
===============================================================================

- Initialisation de structures simulées ou de jeux de données “mock”.
- Exécution des fonctions de détection de detect_local.py en conditions contrôlées (ex : simulation de fichiers d’entrée, etc).
- Aide au débogage d’ajouts d’intégrations matérielles ou de nouveaux patterns.

===============================================================================
4. INTERACTIONS AVEC detect_local.py ET LE BACKEND
===============================================================================

- Se base directement sur les fonctions de detect_local.py, mais ORCHESTRÉ en mode script/test
- Permet de valider l’algorithme de détection séparément du cycle HA complet.
- Les résultats peuvent être comparés/validés avec ceux produits en situation réelle via Home Assistant.

===============================================================================
5. CAS D’UTILISATION ET LIMITES
===============================================================================

- À utiliser en amont ou parallèlement au développement principal du backend (contrib, debug, support, migration…)
- Ne modifie aucune donnée “live” de Home Assistant mais peut servir à construire des fixtures ou générer des rapports.

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
