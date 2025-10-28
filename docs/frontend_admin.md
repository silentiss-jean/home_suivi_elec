===============================================================================
 INTERFACE ADMINISTRATEUR & PANNEAU ORPHELINS – HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
 1. Rôle du fichier / panneau
 2. Fonctionnalités principales
 3. Tableau « capteurs orphelins » (v1.0.7+)
 4. Interactions et dépendances principales
 5. Points d’attention

===============================================================================
1. RÔLE DU FICHIER / PANNEAU
===============================================================================

Les fichiers du frontend administrateur (index.html, diagnostic_orphans.html, diagnosticSensors.js) fournissent :
- Un dashboard avancé pour l’administration et la supervision des capteurs suivis Home Suivi Élec
- Un accès direct aux fonctions de gestion, purge et archivage des capteurs, dont les capteurs orphelins

===============================================================================
2. FONCTIONNALITÉS PRINCIPALES
===============================================================================

- Affichage d’un tableau de tous les capteurs métiers, filtrable et triable
- Affichage d’un sous-tableau dédié aux capteurs orphelins (nouveau v1.0.7)
- Boutons d’action ligne à ligne (archiver, supprimer, reporter)
- Notifications contextuelles et mises à jour temps réel via appel API backend
- Interaction totale avec les endpoints REST de manage_selection.py

===============================================================================
3. TABLEAU « CAPTEURS ORPHELINS » (v1.0.7+)
===============================================================================

- Accessible depuis l’onglet ou la page dédiée, diagnostic_orphans.html
- Colonnes affichées :
    • Nom du capteur
    • Zone (si pertinent)
    • Date de passage en orphelin
    • Dernier état remonté
    • Boutons action (archiver, supprimer, reporter)
- Actions disponibles en base :
    - archive : met le capteur hors production (historique conservé)
    - delete : supprime le capteur virtuel de la base
    - delay : reporte l’action (remet à zéro l’alerte)
- Toute action déclenche un appel  adapté

Logique d’appel JS :

    fetch('/api/home_suivi_elec/orphelins?action=archive&id=sensor_x')
    fetch('/api/home_suivi_elec/orphelins?action=delete&id=sensor_y')
    fetch('/api/home_suivi_elec/orphelins?action=delay&id=sensor_z')

===============================================================================
4. INTERACTIONS ET DÉPENDANCES PRINCIPALES
===============================================================================

- Dependances sur :
    - manage_selection.py pour la remontée dynamique de la liste d’orphelins
    - sensor_sync_manager.py pour la réactualisation état métier
- Dialogue permanent via REST (méthodes GET/PATCH/POST) pour toute modification

===============================================================================
5. POINTS D’ATTENTION
===============================================================================

- Les actions de purge/suppression sont définitives ! (prévoir sauvegarde avant clean massif)
- La synchronisation backend/JS est automatique (pas de refresh manuel nécessaire en standard)
- Toute évolution du format ou du nom des attributs doit être répercutée côté JS/API

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
