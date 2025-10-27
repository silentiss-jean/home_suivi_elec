GÉNÉRATEUR & FETCHER DE QUALITÉ D’INTÉGRATION - HOME SUIVI ÉLEC
Documentation complète - Octobre 2025
📋 TABLE DES MATIÈRES

Rôle du fichier

Logique et workflow principal

Utilisation recommandée

Dépannage & extension

===============================================================================

RÔLE DU FICHIER
===============================================================================

Le module helpers/integration_quality_fetch.py permet :

Récupérer la liste officielle des intégrations Home Assistant et leurs niveaux de qualité

Générer un mapping qualité (quality_map) pour la priorisation/scoring des capteurs

===============================================================================
2. LOGIQUE ET WORKFLOW PRINCIPAL
Script autonome lançant une requête vers la page officielle HA, extrait le bloc “integrations”

Nettoyage/normalisation du pseudo-JSON retourné (correction syntaxique)

Génération d’un fichier YAML integration_quality.yaml dans /data/

===============================================================================
3. UTILISATION RECOMMANDÉE
À lancer ponctuellement pour mettre à jour la qualité référencée des intégrations (ex : nouvelle version HA, changement de scale)

Source d’autorité pour sensor_quality_scorer.py ou toute sélection automatisée

===============================================================================
4. DÉPANNAGE & EXTENSION

Si erreur de parsing : vérifier le format de la page HA et ajuster les regex

Peut être étendu pour traiter d’autres sources ou enrichir les critères qualité

===============================================================================
FIN DE LA DOCUMENTATION
