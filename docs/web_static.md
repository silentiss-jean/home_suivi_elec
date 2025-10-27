===============================================================================
 FRONTEND CUSTOM HOME SUIVI ÉLEC — ARCHITECTURE UI
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle et structure globale
  2. Principaux modules JS (vanilla)
  3. Composants React (JSX)
  4. Flux d’interaction front/backend
  5. Modèles de navigation : panels, vues & toast
  6. Points d’attention

===============================================================================
1. RÔLE ET STRUCTURE GLOBALE
===============================================================================
Le dossier  regroupe tous les fichiers frontend utilisés pour la gestion, la sélection et le diagnostic des capteurs dans Home Suivi Élec :
- UI indépendante embarquée (iframe Home Assistant ou accès direct)
- Orchestration des panels, vues, et logiques front

Fichiers principaux :  
- , : gabarits HTML statiques pour l’UI
- : logique métier (configuration, diagnostic, panels, proxy, state, utils…)
- : composants React pour UI avancée

===============================================================================
2. PRINCIPAUX MODULES JS (VANILLA, DÉCOUPAGE)
===============================================================================

-  : Point d’entrée principal, initialisation des panels et listeners globaux.
-  : Gestion du token Home Assistant, fallback mode non-auth.
-  /  /  /  :
  - Orchestration complète de la config utilisateur, scoring, points, sauvegardes, rendering dynamique, synchronisation backend (API REST).
-  : Centralisation de l’état global UI ; gestion auto du localStorage.
-  : Bus d’événements pour la communication inter-panels/modules.
-  : Affichage et rafraîchissement des capteurs détectés.
-  : Panel de diagnostics techniques (utilise proxy.js).
-  : pousse toutes les requêtes backend dans un endpoint proxy unique (sécurisation et abstraction).
-  : fonctions utilitaires réutilisables (normalize, count, find…).
-  : UI de sélection des capteurs, gestion des conflits, actions de masse.
-  : UI spécialisée pour la gestion du capteur “de référence” (et mode manuel).
-  /  : gestion des doublons multi-intégrations et intra-intégration, affichage, actions backend.
-  : Encapsulation de la sauvegarde globale des sélections/options.
-  : Vue résumé, agrégation et affichage synthétique des stats.

===============================================================================
3. COMPOSANTS REACT (JSX)
===============================================================================

Situés dans  :
-  : Composant principal de sélection, scoring, auto-comparaison par appareil.
-  : Badge de score qualité affiché par capteur (explicite pour l’utilisateur).
-  : Vue avancée, décomposition de score et affichage complet technique/JSON.

Tous les composants sont pensés "plug and play" et interopérables avec les modules JS vanilla.

===============================================================================
4. FLUX D’INTERACTION FRONT/BACKEND
===============================================================================

- Toute action/panel frontend effectue ses requêtes via les endpoints proxy ( ou APIs custom).
- La plupart des mutations d’état (sélections, changements de contrats, options…) sont propagées en backend via API POST (et mises à jour en temps réel).
- L’état (selected/alternatives/reference…) est hydraté automatiquement à l’ouverture et mise à jour inter-panel.

===============================================================================
5. MODÈLES DE NAVIGATION : PANELS, VUES & TOAST
===============================================================================

- Navigation tabulaire (home / configuration / detection / diagnostics)
- Système de toasts (uiToast.js) pour tous les feedbacks/actions non bloquants
- Panels dynamiques sensibles à l’état, support du mode expert en React, affichage des helpers/statistiques, filtrage des doublons
- Vue résumé toujours synchronisée sur la sélection et l’état backend

===============================================================================
6. POINTS D’ATTENTION
===============================================================================

- Auth : le token Home Assistant est récupéré dynamiquement, fallback automatique si non dispo (ex : accès local/iframe).
- Toute nouvelle intégration ou extension UI passe par l’ajout de modules JS ou JSX dans ce répertoire — respecter le découpage existant.
- Pour diagnostiquer un bug UI, vérifier la propagation d’état dans stateModule et le passage via eventBus.
- Sur mobile, privilégier la vue résumé ou config.html, certains panels peuvent être trop larges.

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================

