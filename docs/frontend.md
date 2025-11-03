# Frontend Architecture - Option B (Modular)

## Structure Overview

La nouvelle architecture frontend organise les modules par fonctionnalité plutôt que par type de fichier.

```
custom_components/home_suivi_elec/web_static/
├── index.html              # Point d'entrée principal  
├── style.css               # Feuille de style globale
├── tabs/                   # Templates HTML des onglets
│   ├── diagnostic_sensors.html
│   └── generate.html
└── js/                     # Modules JavaScript
    ├── shared/             # ⚙️ Utilitaires partagés
    │   ├── app.js          # Assembleur principal
    │   ├── auth.js         # Authentification
    │   ├── eventBus.js     # Bus d'événements
    │   ├── stateModule.js  # Gestion d'état
    │   ├── uiToast.js      # Notifications UI
    │   ├── utils.js        # Fonctions utilitaires
    │   └── proxy.js        # Proxy API
    ├── configuration/      # ⚙️ Configuration & sélection
    │   ├── configuration.js     # Module principal
    │   ├── configuration.api.js # APIs configuration  
    │   ├── configuration.state.js # État configuration
    │   ├── configuration.view.js  # Vues configuration
    │   ├── selectionPanel.js     # Panel sélection capteurs
    │   └── referencePanel.js     # Panel capteur de référence
    ├── detection/          # 🔍 Détection des capteurs
    │   └── detection.js    # Module de détection
    ├── diagnostics/        # 🔧 Diagnostics techniques
    │   ├── diagnostics.js       # Module principal
    │   └── diagnosticSensors.js # Sous-onglet capteurs
    ├── duplicates/         # 🔄 Gestion des doublons
    │   ├── duplicates.api.js    # APIs doublons
    │   └── duplicatesPanel.js   # Panel doublons
    ├── generation/         # 🧩 Génération Lovelace
    │   └── generate.js     # Générateur YAML
    ├── save/               # 💾 Opérations de sauvegarde
    │   └── savePanel.js    # Panel sauvegarde globale
    ├── summary/            # 🏠 Résumé accueil
    │   └── summary.js      # Module résumé
    └── modules/            # 📋 Legacy (en cours de migration)
        ├── diagnosticSensors.js
        └── generate.js
```

## Points d'entrée

### Principal : `js/shared/app.js`
- Assembleur principal de l'application
- Gestion des onglets et navigation
- Initialisation des modules
- Gestion des événements globaux

### Secondaire : `js/diagnostics/diagnostics.js`  
- Module diagnostics technique
- Chargement des sous-onglets diagnostics

## Organisation par fonctionnalité

### ⚙️ **shared/** - Utilitaires partagés
- **app.js** : Point d'entrée, orchestration, navigation
- **auth.js** : Gestion authentification Home Assistant  
- **eventBus.js** : Communication inter-modules
- **stateModule.js** : Gestion d'état global
- **uiToast.js** : Système de notifications
- **utils.js** : Fonctions utilitaires communes
- **proxy.js** : Proxy pour requêtes API

### ⚙️ **configuration/** - Configuration & Sélection
- **configuration.js** : Logique principale configuration
- **configuration.api.js** : APIs (getSensors, saveSelection, etc.)
- **configuration.state.js** : Gestion état utilisateur (tarifs)
- **configuration.view.js** : Rendu vues (bandeau, doublons)
- **selectionPanel.js** : Interface sélection capteurs
- **referencePanel.js** : Panel capteur de référence

### 🔍 **detection/** - Détection des capteurs
- **detection.js** : Détection et affichage capteurs par intégration

### 🔧 **diagnostics/** - Diagnostics techniques  
- **diagnostics.js** : Diagnostics généraux
- **diagnosticSensors.js** : Sous-onglet diagnostics capteurs

### 🔄 **duplicates/** - Gestion des doublons
- **duplicates.api.js** : APIs gestion doublons
- **duplicatesPanel.js** : Interface doublons et conflits

### 🧩 **generation/** - Génération Lovelace
- **generate.js** : Générateur cartes YAML Lovelace

### 💾 **save/** - Sauvegardes
- **savePanel.js** : Interface sauvegarde globale

### 🏠 **summary/** - Résumé accueil
- **summary.js** : Calculs et affichage résumé énergétique

## Architecture des modules

Chaque module suit un patron consistant :

```javascript
// Module type : feature/feature.js
import { utils } from '../shared/utils.js';
import { toast } from '../shared/uiToast.js';

// Export principal
export async function loadFeature() {
  // Logique du module
}

// Exports secondaires si nécessaire
export function helperFunction() {
  // ...
}
```

## Communication inter-modules

### Event Bus (événements)
```javascript
import { emit, on } from '../shared/eventBus.js';

// Émettre un événement
emit('selection:saved', { data });

// Écouter un événement  
on('selection:saved', (data) => {
  // Réagir
});
```

### State Module (état partagé)
```javascript
import stateModule from '../shared/stateModule.js';

// Lire l'état
const config = stateModule.get('user');

// Modifier l'état
stateModule.set('user', { abonnementHT: 45.50 });
```

### Toast Notifications
```javascript
import { toast } from '../shared/uiToast.js';

toast.success('✅ Opération réussie');
toast.error('❌ Erreur detected');
toast.info('ℹ️ Information');
```

## APIs Backend

Tous les appels API sont centralisés dans les modules `*.api.js` :

```javascript
// configuration/configuration.api.js
export async function getSensors() {
  const response = await fetch('/api/home_suivi_elec/get_sensors');
  return await response.json();
}
```

## Chargement des onglets

### Navigation principale (index.html)
```javascript
// Onglets principaux gérés par app.js
function showTab(tab) {
  // Active l'onglet + charge le module associé
  if (tab === 'configuration') {
    loadConfiguration(); // depuis configuration/configuration.js
  }
}
```

### Sous-onglets dynamiques
```javascript
// Chargement HTML + JS à la demande
const html = await (await fetch('tabs/diagnostic_sensors.html')).text();
container.innerHTML = html;
await loadDiagnosticSensors(); // depuis diagnostics/diagnosticSensors.js
```

## 🔄 Migration Status

### ✅ Migré vers Option B
- Tous les modules principaux
- Structure par fonctionnalité
- Points d'entrée modernes
- Communication inter-modules

### 📋 En cours
- `modules/diagnosticSensors.js` → `diagnostics/diagnosticSensors.js` (✅ déjà fait)
- `modules/generate.js` → `generation/generate.js` (✅ déjà fait)

### 🧹 À nettoyer
Les anciens fichiers plats dans `js/` (app.js, diagnostics.js, etc.) peuvent être supprimés car remplacés par leurs équivalents modulaires.

## Avantages de l'Option B

1. **📁 Organisation claire** : Un dossier = une fonctionnalité
2. **🔍 Facilité de recherche** : Tout est groupé logiquement  
3. **⚙️ Maintenance simplifiée** : Modifications localisées
4. **🚀 Extensibilité** : Ajout de nouvelles features facile
5. **🧩 Modularité** : Import/export clairs entre modules
6. **📚 Documentation** : Structure auto-documentée

## Future Roadmap

- [ ] Suppression complète dossier `modules/`
- [ ] Ajout système de thèmes dans `shared/`
- [ ] Module `customisation/` pour personnalisation UI
- [ ] Tests unitaires par module
- [ ] Bundle optimization avec tree-shaking
