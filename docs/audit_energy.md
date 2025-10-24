# audit_energy.sh

### Description
Ce script shell Bash permet de lister les capteurs ("sensors") énergétiques configurés dans Home Assistant. Il analyse le fichier `core.entity_registry`, lequel contient l'enregistrement des entités configurées.

### Fonctionnement
- Le script cible le fichier `/config/.storage/core.entity_registry`.
- Il utilise des commandes texte (cat, grep, sed, sort) pour extraire :
  - Les capteurs ayant une unité de mesure d'énergie ou de puissance (W, kW, kWh, Wh, MWh).
  - Ceux ayant une classe d'appareil correspondant à la puissance ou à l'énergie.
  - Leur plate-forme d'origine et leur identifiant d'entité (`entity_id`).
- Il affiche une liste unique triée de la plateforme suivie de l'identifiant de chaque capteur énergétique.

### Usage
Le script est utile pour auditer les capteurs liés à l'énergie dans la configuration Home Assistant, ce qui peut servir de base à d'autres traitements analytiques dans le backend.
