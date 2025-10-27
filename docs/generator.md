===============================================================================
 GÉNÉRATEUR DE DASHBOARDS & CARTES - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Fonctions de génération de dashboards
  3. Intégration Lovelace & YAML
  4. Workflow d’utilisation intégration
  5. Extension et personnalisation
  6. Dépannage

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le fichier  centralise toute la **génération dynamique de dashboards et de cartes Lovelace** pour Home Assistant.
- Génération automatique de vues, graphiques, jauges et entités contextuelles à partir des sensors energy/power recensés
- Automatisation de la configuration UI (Top 10, historiques, distribution...)

===============================================================================
2. FONCTIONS DE GÉNÉRATION DE DASHBOARDS
===============================================================================

-  : carte Top 10 consommateurs
-  : graphique historique 7J
-  : camembert daily
-  : cartes jauges individuelles
-  : vues “par cycle” (jour, semaine, mois...)
-  : dashboard complet multivue pour import Lovelace

===============================================================================
3. INTÉGRATION LOVELACE & YAML
===============================================================================

- Génère du YAML compatible Lovelace/Raw Editor, enregistrable directement dans 
- Ajout d’un header, d’entêtes explicatives et support du multi-vue

===============================================================================
4. WORKFLOW D’UTILISATION INTÉGRATION
===============================================================================

- Appelé manuellement (service HA, bouton UI) ou lors de l’auto-génération Lovelace
- Produit le dashboard et le sauvegarde au bon format en un seul appel

===============================================================================
5. EXTENSION ET PERSONNALISATION
===============================================================================

- Possibilité d’ajouter des types de cartes Lovelace supplémentaires :
  modifier/dupliquer les fonctions génériques
- Adapter l’ordre ou enrichir les métadonnées pour des dashboards avancés

===============================================================================
6. DÉPANNAGE
===============================================================================

- Fichier non généré ou incomplet : vérifier les logs sur la détection sensors HSE
- YAML non valide : contrôler la compatibilité syntaxique ou refaire un export

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
