===============================================================================
 SURVEILLANCE TEMPS RÉEL DE LA PUISSANCE - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Fonctions et logiques principales
  3. Intégration au flux backend
  4. Utilisation typique et extensions
  5. Points d’attention/dépannage

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le module  centralise la logique de suivi temps réel de la puissance (W) pour les capteurs compatibles.
- Collecte, agrégation et diffusion continue de la puissance instantanée

===============================================================================
2. FONCTIONS ET LOGIQUES PRINCIPALES
===============================================================================

- S’abonne/écoute les changements de states sur les entités concernées
- Met à disposition “live” des sensors HSE dédiés : sensor.hse_live_whatever, etc.
- Peut rafraîchir périodiquement les mesures pour garantir la fraîcheur backend et frontend

===============================================================================
3. INTÉGRATION AU FLUX BACKEND
===============================================================================

- Déployé automatiquement lors du setup principal (__init__.py + energy_tracking.py)
- Peut être utilisé indépendamment des cycles d’énergie
- Alimente la vue temps réel de l’UI et l’historique HSE

===============================================================================
4. UTILISATION TYPOQUE & EXTENSIONS
===============================================================================

- Utilisé pour générer des jauges “live”, alarmes puissance momentanée, etc.
- Extension : ajouter de nouveaux triggers, alertes seuils, ou supports matériels

===============================================================================
5. POINTS D’ATTENTION/DÉPANNAGE
===============================================================================

- En cas d’absence de valeurs live : vérifier que les sensors sources sont bien compatibles (state_class, unit)
- Log utile pour le troubleshooting (voir niveaux info/warning)

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
