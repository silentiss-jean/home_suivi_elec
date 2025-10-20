# 🌐 Flux complet des capteurs – Home Suivi Élec

Ce diagramme montre le parcours d’un capteur, de sa détection à l’affichage et à la sauvegarde.

```mermaid
flowchart TD
    %% Détection
    A[Capteurs disponibles] --> B[detect_local.js: Détection et tri]
    B --> C{Capteur déjà existant ?}
    C -- Oui --> D[Mettre à jour état / valeur]
    C -- Non --> E[Ajouter capteur à la liste brute]

    %% Normalisation
    D --> F[utils.js: normalizeSensors]
    E --> F

    %% Sélection utilisateur
    F --> G[manage_selection.js: sélection / désélection]
    G --> H{Capteur actif ?}
    H -- Oui --> I[Calculs consommation delta / tarifs]
    H -- Non --> J[Ignorer pour résumé]

    %% Calculs
    I --> K[utility_meter_manager.js: calcul consommation & alertes]
    K --> L[summary.js: génération résumé & messages]

    %% UI
    L --> M[panel_selection.js: préparation panels UI]
    M --> N[app.js / detection.js / configuration.js]
    N --> O[UI web interactive (rafraîchissement 30s)]

    %% Sauvegarde backend
    G --> P[Sauvegarde choix utilisateur]
    P --> Q[data/*.json]

    %% Génération cartes Lovelace
    K --> R[generator.js: création cartes HA]
    R --> S[Home Assistant UI]

    %% Flux global retour
    O -->|Rafraîchissement| L
🔹 Explications des blocs
	1.	Détection et tri
	•	detect_local.js : récupère tous les capteurs existants, supprime doublons.
	2.	Normalisation
	•	utils.js : structure les capteurs par intégration pour un accès rapide.
	3.	Sélection utilisateur
	•	manage_selection.js : l’utilisateur choisit les capteurs à suivre.
	4.	Calculs consommation & alertes
	•	utility_meter_manager.js : delta, tarifs, messages d’alerte.
	5.	Résumé & UI
	•	summary.js + panel_selection.js + app.js : génération panels et affichage interactif.
	6.	Sauvegarde
	•	JSON persistants : capteurs_detectes.json, status_sensor.json, entry_data.json.
	7.	Cartes Lovelace
	•	generator.js : export pour intégration Home Assistant.

