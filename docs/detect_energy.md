===============================================================================
 DÉTECTION DES CAPTEURS ÉNERGIE - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Logique de détection
  3. Fonctionnement et workflow
  4. Dépendances & intégrations supportées
  5. Dépannage & extension

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le fichier  permet de :
- Scanner tous les sensors Home Assistant,
- Détecter ceux liés aux mesures d’énergie ou puissance (kWh, W…),
- Identifier l’intégration d’origine (par device ou état registry).

Il sert à automatiser la découverte des entités pertinentes pour le suivi énergétique et la configuration initiale.

===============================================================================
2. LOGIQUE DE DÉTECTION
===============================================================================

- Parcours de tous les sensors via hass.states.async_all("sensor")
- Filtrage : ne retient que ceux dont l’entity_id démarre par 
- Récupération de device_id via entity_registry et device_registry
- Identification de l’intégration d’origine (powercalc, hue, tplink, tapo, etc)
- Affichage/log/return des sensors reconnus comme fiables

===============================================================================
3. FONCTIONNEMENT ET WORKFLOW
===============================================================================

Ce script peut être lancé automatiquement ou en manuel pour :
- Générer la liste initiale des capteurs énergie reconnus (avant toute sélection ou scoring)
- Diagnostiquer des oublis ou erreurs dans la détection auto

Les résultats sont affichés en log ou sur la console si appelé en script.

===============================================================================
4. DÉPENDANCES & INTÉGRATIONS SUPPORTÉES
===============================================================================

- Dépend fort de entity_registry et device_registry HA
- Liste ENERGY_INTEGRATIONS à jour selon les plateformes supportées
- Extensible via ajout dans ENERGY_INTEGRATIONS (pour nouvelles plateformes détectées)

===============================================================================
5. DÉPANNAGE & EXTENSION
===============================================================================

- Si aucun sensor n’est reconnu, vérifier la disponibilité des intégrations concernées ou la compatibilité devices.
- Pour étendre la détection, compléter la liste ENERGY_INTEGRATIONS dans ce fichier.

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
