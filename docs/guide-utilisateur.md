# 🗂️ Guide utilisateur Home Suivi Élec

Ce document accompagne l’utilisation de l’UI web Home Suivi Élec, étape par étape.

---

## 🏠 Page d’accueil / Résumé

- Résumé rapide : nombre total de capteurs, nombre d’actifs, coût énergétique estimé, dernier rafraîchissement
- Tableaux de consommation (interne, externe, delta)
- Affichage des coûts selon période (heure, jour, semaine, mois, année)
- Alerte visible si le capteur externe est indisponible/invalide

---

## 🔍 Onglet Détection

- **Objectif :** visualiser tous les capteurs de puissance/énergie détectés par Home Assistant
- Fonction :
  - Bouton pour relancer la détection manuelle des capteurs
  - Liste groupée par intégration
  - Indicateur du nombre total détecté et dernière mise à jour
- **NB :** impossible de sélectionner ou configurer les capteurs ici — *passage à l’onglet Configuration nécessaire*

---

## ⚙️ Onglet Configuration

- Sélectionner/désélectionner les capteurs à suivre :
  - Cases à cocher par capteur
  - Groupes par intégration (ex : Tapo, Powercalc…)
  - “Tout sélectionner/désélectionner” par groupe
- Définir le capteur externe de référence :
  - Choix d’un capteur Home Assistant ou saisie manuelle
  - Activation/désactivation du mode externe
- Saisir abonnement, tarif(s) électricité et plages horaires HP/HC
- Sauvegarde via bouton dédié (sauvegarde intégrale des préférences)

---

## 🖼️ Autres fonctionnalités de l’UI

- Alerte instantanée en cas de capteur externe absent/KO
- Actualisation auto toutes les 30 secondes ou manuelle (bouton)
- Navigation rapide entre onglets en haut de l’UI

---

## 📝 Points d’usage et bonnes pratiques

- Utilisez la détection pour voir si un nouveau capteur apparaît après ajout/installation dans Home Assistant
- Sauvegardez la configuration chaque fois que vous modifiez la sélection ou les tarifs
- Vérifiez l’alerte “Capteur externe indisponible” avant de valider ou relire la synthèse des coûts

---

## 🔗 Pour aller plus loin

- Documentation technique : [architecture.md](architecture.md), [reference-technique.md](reference-technique.md)
- Flux métier complet : [flux_fonctionnel.md](flux_fonctionnel.md)

