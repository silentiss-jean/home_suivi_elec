===============================================================================
 VALIDATION DES CHAMPS & CONTRÔLES SYNTAXIQUES - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Logique de validation implémentée
  3. Utilisation typique et intégration
  4. Extension et points de vigilance

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le module  centralise toutes les fonctions de validation de données :
- Validation des formats (ex. : horaires, numéros…)
- Aide à la robustesse des flows de configuration/options

===============================================================================
2. LOGIQUE DE VALIDATION IMPLÉMENTÉE
===============================================================================

- Fonctions fondées sur voluptuous (vol.*) pour lever rapidement les erreurs de saisie
- Ex. :  vérifie le format HH:MM

---


