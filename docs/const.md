===============================================================================
 CONSTANTES GLOBALES, CLÉS ET VALEURS PAR DÉFAUT - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Constantes clés définies
  3. Carte des contrats (CONTRATS)
  4. Dictionnaire des valeurs par défaut (DEFAULTS)
  5. Fichiers utilisant const.py
  6. Points d’attention & extension
  7. Dépannage

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le fichier  centralise **toutes les constantes globales de l’intégration** :
- Noms de domaine, chemins de fichiers, clés de configuration (flow/options)
- Dictionnaire des types de contrats suivis ("prix unique", "heures creuses"…)
- Cartographie de toutes les clés attendues dans le backend et le frontend
- Valeurs par défaut des tarifs et abonnements

Il garantit la cohérence et la maintenabilité de tous les autres modules.

===============================================================================
2. CONSTANTES CLÉS DÉFINIES
===============================================================================

Principales clés et conventions :
- DOMAIN (nom d’intégration pour Home Assistant)
- FICHIER_CAPTEURS (chemin relatif principal des capteurs détectés)
- CONF_* (clés de configuration et d’options pour le flow, la roue, le backend, etc)
- CONTRATS (carte textuelle des types de contrats supportés)
- DEFAULTS (valeurs par défaut pour tous les paramètres principaux, par contrat)

===============================================================================
3. CARTE DES CONTRATS (CONTRATS)
===============================================================================

Structure :
- "prix_unique" : Tarif unique, un prix courant pour toute la période
- "heures_creuses" : Différenciation entre Heures Pleines (HP) et Heures Creuses (HC)

Modifiable pour ajouter d’autres types (weekend, triphasé…) selon besoin.

===============================================================================
4. DICTIONNAIRE DES VALEURS PAR DÉFAUT (DEFAULTS)
===============================================================================

Définit pour chaque contrat :
- Tarifs (€ HT, TTC) par kWh selon option choisie
- Abonnement mensuel (HT & TTC)
- Plages horaires (HC_START, HC_END) si applicable

Utilisé pour :
- Initialiser la configuration au premier démarrage
- Proposer des valeurs dans le flow ou l’UI
- Valider et normaliser les entrées utilisateur

===============================================================================
5. FICHIERS UTILISANT const.py
===============================================================================

-  : clé pour la génération des schémas de formulaire flow
-  : utilisation massive pour l’affichage des valeurs et la validation
- , , etc : accès aux clés/consts
- Toute personnalisation d’options front-end ou REST fait référence à ce module.

===============================================================================
6. POINTS D’ATTENTION & EXTENSION
===============================================================================

- Pour ajouter un type de contrat : ajouter une entrée dans CONTRATS + DEFAULTS
- Pour tout nouveau paramètre global : l’ajouter ici, puis référencer côté flow/options/front
- Toujours utiliser les CONF_* pour référencer en dur (évite typo et facilite refacto)
- Modifiez d’abord DEFAULTS ici, puis redémarrez l’intégration pour propager

===============================================================================
7. DÉPANNAGE
===============================================================================

PROBLÈME 1 : Une clé n’est pas reconnue dans les flows
→ Vérifier qu’elle existe dans const.py et est correctement importée

PROBLÈME 2 : Les valeurs par défaut ne sont pas proposées
→ Vérifier et compléter DEFAULTS ; bien utiliser les CONF_* partout

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
