# 🧩 Home Suivi Élec

## 🎯 Objectif du projet
Home Suivi Élec est une intégration personnalisée pour **Home Assistant** destinée à :
- **Détecter automatiquement** les capteurs de puissance (`power`, `energy`, etc.) disponibles.
- **Regrouper** ces capteurs par intégration (Tapo, Powercalc, Sonoff, etc.).
- **Permettre à l’utilisateur** de sélectionner les capteurs à inclure dans le suivi énergétique global.
- **Calculer et visualiser** automatiquement le coût énergétique total dans Home Assistant via des cartes Lovelace générées.
- Fournir une **interface web dédiée** pour gérer la détection, la configuration, la personnalisation et la génération des cartes.

---

## ⚙️ Fonctionnalités actuelles
- [x] Détection automatique des capteurs de puissance au démarrage (`generate_local_data`)
- [x] Génération du fichier `/config/custom_components/home_suivi_elec/data/capteurs_power.json`
- [x] Génération automatique du fichier Lovelace `/config/suivi_elec_auto.yaml`
- [x] Interface web accessible via :
http://<IP_HA>:8123/local/community/home_suivi_elec_ui/index.html
- [x] Menu principal avec 4 sous-pages : Détection, Configuration, Customisation, Génération cartes
- [ ] Affichage des capteurs dans l’interface
- [ ] Sélection/désélection des capteurs à inclure
- [ ] Indicateur de nouveaux capteurs détectés
- [ ] Personnalisation de l’interface et des cartes

---

## 🧠 Structure du projet
custom_components/home_suivi_elec/
├── init.py                  → Setup principal + enregistrement des services
├── const.py                     → Constantes globales (DOMAIN, options…)
├── detect_local.py              → Détection automatique des capteurs (JSON)
├── generator.py                 → Génération des fichiers Lovelace YAML
├── manage_selection.py          → API REST (get_sensors, save_selection…)
├── web_static/                  → Interface web (index.html, app.js, styles.css…)
│   └── index.html
│   └── app.js
├── data/
│   └── capteurs_power.json      → Liste des capteurs détectés
│   └── capteurs_selection.json  → (à venir) Sélection utilisateur
└── doc/
└── onglets_status.md        → Documentation de l’état actuel de l’UI
---

## 🔧 Services disponibles
| Nom du service | Description | Automatique |
|----------------|--------------|--------------|
| `home_suivi_elec.generate_local_data` | Détecte les capteurs et crée `capteurs_power.json` | ✅ au démarrage |
| `home_suivi_elec.generate_selection` | Crée `capteurs_selection.json` (sélection utilisateur) | ⏳ à automatiser |
| `home_suivi_elec.generate_lovelace_auto` | Génère `suivi_elec_auto.yaml` pour Lovelace | ✅ au démarrage |
| `home_suivi_elec.copy_ui_files` | Copie les fichiers web vers `/www/community` | ✅ au démarrage |

---

## 🧭 Prochaines étapes
1. **Connecter l’UI à `capteurs_selection.json`**  
   → Afficher la liste des capteurs et permettre de les cocher/décocher.  
2. **Créer le service `save_selection`**  
   → Enregistrer les choix dans `capteurs_selection.json`.  
3. **Ajouter un indicateur de nouveaux capteurs**  
   → Icône ou badge clignotant sur la page Détection.  
4. **Améliorer la personnalisation de l’interface**  
   → Thèmes, affichage en grille, filtres par intégration/pièce.  
5. **Test & validation**  
   → Vérifier cohérence JSON/UI/cartes Lovelace.

---

## 🧰 Accès rapide
- UI : [http://<IP_HA>:8123/local/community/home_suivi_elec_ui/index.html](#)
- Logs HA : `/config/home-assistant.log`
- Données : `/config/custom_components/home_suivi_elec/data/`

---

## 👨‍💻 Auteurs
Projet développé et testé par **Jean** avec support de ChatGPT (OpenAI).  
Version en développement — non encore publiée sur HACS.

