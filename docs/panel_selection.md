===============================================================================
 PANEL DE SÉLECTION (UI LEGACY/TEST) - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Fonctionnalités principales
  3. Workflow typique d’utilisation
  4. Dépendances/fichiers liés
  5. Dépannage et notes

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le fichier  sert à :
- Fournir un panel web personnalisé pour la sélection ou l’inspection des capteurs Home Suivi Élec,
- Proposer une vue synthétique ou un outil de test de sélection (en complément ou alternative à la config UI principale).

===============================================================================
2. FONCTIONNALITÉS PRINCIPALES
===============================================================================

- Génère/sert une interface permettant de voir les capteurs sélectionnés, leur statut, et agir sur l’activation/la sélection directement depuis une page dédiée.
- Peut être utilisé pour diagnostic, migration, ou en complément d’un panel React custom.

===============================================================================
3. WORKFLOW TYPIQUE D’UTILISATION
===============================================================================

- Accessible comme panneau additionnel ou route spéciale sous Home Assistant
- Permet de tester rapidement les sélections sans impacter la configuration principale
- Souvent utilisé lors de la phase de testing ou migration d’un setup.

===============================================================================
4. DÉPENDANCES/FICHIERS LIÉS
===============================================================================

- manage_selection.py : source les capteurs
- manage_selection_views.py : endpoints REST utilisés
- Peut interagir avec web_static/ (panneaux JS) ou customPanel

===============================================================================
5. DÉPANNAGE ET NOTES
===============================================================================

- À privilégier pour dev/diagnostic : ne remplace pas l’UI utilisateur principale.
- En cas de non-rafraîchissement, vérifier que le panel se synchronise bien avec le backend via les endpoints REST.

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
