# 🧩 Home Suivi Élec

## 🎯 Objectif

Intégration **Home Assistant** pour le suivi énergétique :
- Détection automatique des capteurs de puissance
- Sélection des capteurs, affichage dynamique des consommations
- Calcul et synthèse coûts, gestion abonnements/tarifs, suivi capteur externe
- UI web dédiée multi-onglets (détection, configuration, résumé)

---

## 🚀 Fonctionnalités clés

- Détection instantanée capteurs puissance/énergie lors du démarrage
- Sélection dynamique des capteurs à suivre + gestion du capteur externe
- Visualisation en temps réel (tableaux, alertes, coûts)
- Services automatisés pour la génération backend
- Génération de dashboard Lovelace (à venir)

---

## 📖 Documentation

La documentation complète :  
- **docs/guide-utilisateur.md** : Utilisation de l’interface, workflow utilisateur
- **docs/architecture.md** : Schémas techniques, modules et flux de données
- **docs/flux_fonctionnel.md** : Parcours technique du capteur à l’UI
- **docs/reference-technique.md** : Endpoints REST, structure des JSON, debug, API
- **docs/roadmap.md** : Idées et évolutions à venir

---

## 🖥️ Accès & installation

- UI : [http://<IP_HA>:8123/local/community/home_suivi_elec_ui/index.html](#)
- Backend : `custom_components/home_suivi_elec/`
- Données : `/config/custom_components/home_suivi_elec/data/`
- Logs : `/config/home-assistant.log`

---

## 👨‍💻 Auteur & état

Développé par **Jean**.  
Projet en bêta, non encore publié sur HACS.

---

