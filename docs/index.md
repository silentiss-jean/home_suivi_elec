# 🏠 Home Suivi Élec — Documentation complète

Bienvenue dans la documentation technique et fonctionnelle du projet **Home Suivi Élec**, une intégration personnalisée pour **Home Assistant** dédiée au suivi et à la gestion de la consommation électrique.

---

## ⚙️ Objectifs

- Simplifier la **détection et configuration** des capteurs d’énergie.
- Automatiser la création des **Utility Meters**.
- Offrir une **interface web dédiée** dans la barre latérale HA.
- Générer facilement des **cartes Lovelace personnalisées**.

---

## 🧩 Architecture simplifiée
custom_components/home_suivi_elec/
├── core/              # Logique principale (init, config, gestion capteurs)
├── helpers/           # Fonctions utilitaires (validation, intégrations)
├── web_static/        # Interface web statique (HTML + JS)
└── data/              # Données locales générées
---

## 📚 Contenu de la documentation

| Section | Description |
|----------|-------------|
| [Architecture](architecture.md) | Structure interne et interactions |
| [Flux fonctionnel](flow_functionnel.md) | Étapes de fonctionnement de bout en bout |
| [Rôles des fichiers](roles_fichiers.md) | Description détaillée de chaque module |

---

## 🚀 Publication de la documentation

Pour générer et publier la documentation localement :

```bash
pip install mkdocs-material
mkdocs serve
Puis pour publier sur GitHub Pages :
mkdocs gh-deploy
https://votre-compte.github.io/home_suivi_elec/
👨‍💻 Auteur

Jean (Silentiss)
Projet open-source — Licence MIT

