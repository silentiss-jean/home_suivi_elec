┌──────────────────────────────────────────────────────────┐
│ 1. Utilisateur configure via Options Flow (UI HA)       │
│    Paramètres → Intégrations → Home Suivi Élec → ⚙️     │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ 2. Sauvegardé dans ConfigEntry                          │
│    /config/.storage/core.config_entries                 │
│    { data: {...}, options: {...} }                      │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ 3. Backend Python (GetUserOptionsView)                  │
│    /api/home_suivi_elec/get_user_options                │
│    Fusionne data + options → JSON                       │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ 4. Frontend JavaScript (configuration.api.js)           │
│    getUserOptions() → fetch API                         │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ 5. Hydratation (configuration.state.js)                 │
│    hydrateUserConfig(options)                           │
│    Remplit les champs HTML                              │
└──────────────────────────────────────────────────────────┘

📍 D'OÙ VIENNENT LES DONNÉES
1. Source initiale : ConfigEntry (Home Assistant)
Les données sont stockées dans Home Assistant dans la config entry de l'intégration :

text
/config/.storage/core.config_entries

{
  "entry_id": "xxxxx",
  "domain": "home_suivi_elec",
  "data": {
    "abonnementHT": 13.79,
    "abonnementTTC": 19.791,
    "prix_ht": 0.1327,
    "prix_ttc": 0.1952
  },
  "options": {
    "externalCapteur": "sensor.atome_live_power",
    "useExternal": false
  }
}
2. Backend Python : GetUserOptionsView
Fichier : manage_selection_views.py
Endpoint : /api/home_suivi_elec/get_user_options
async def get(self, request):
    # 1️⃣ Récupère la config entry
    entries = self.hass.config_entries.async_entries("home_suivi_elec")
    entry = entries[0]
    
    # 2️⃣ Fusionne data + options
    data = dict(entry.data or {})
    opts = dict(entry.options or {})
    eff = {**data, **opts}  # Merge
    
    # 3️⃣ Construit la réponse JSON
    resp = {
        "typeContrat": "fixe",
        "abonnementHT": eff.get("abonnementHT", 0),
        "abonnementTTC": eff.get("abonnementTTC", 0),
        "prix_ht": eff.get("prix_ht", 0),
        "prix_ttc": eff.get("prix_ttc", 0),
        "prix_ht_hp": eff.get("prix_ht_hp", 0),
        "prix_ttc_hp": eff.get("prix_ttc_hp", 0),
        ...
    }
    return self.json(resp)
3. Frontend JavaScript : configuration.js
Fichier : web_static/js/configuration.js
// 1️⃣ Appelle l'API
import { getUserOptions } from './configuration.api.js';

async function loadConfig() {
  const options = await getUserOptions(); // ← Appel API
  hydrateUserConfig(options); // ← Remplit les champs
}

4. Hydratation : configuration.state.js
Fichier : web_static/js/configuration.state.js
export function hydrateUserConfig(options) {
  // options = { prix_ht: 0.1327, prix_ttc: 0.1952, ... }
  
  // Mapping Backend → Frontend
  setVal("tarifFixeHT", options.prix_ht);   // 0.1327
  setVal("tarifFixeTTC", options.prix_ttc); // 0.1952
}


📝 OÙ SONT SAUVEGARDÉES LES DONNÉES
Lors de la sauvegarde depuis l'interface web
Frontend :

javascript
// configuration.state.js - bindSaveUserConfig()
const payload = {
  prix_ht: 0.1327,
  prix_ttc: 0.1952
};
await saveUserOptions(payload); // ← Appel API
Backend :

python
# manage_selection_views.py - SaveUserOptionsView
async def post(self, request):
    body = await request.json()  # payload
    entry = self.hass.config_entries.async_entries("home_suivi_elec")[0]
    
    # Met à jour les options
    current_opts = dict(entry.options or {})
    current_opts.update(body)
    
    # Sauvegarde dans ConfigEntry
    self.hass.config_entries.async_update_entry(entry, options=current_opts)
🔍 VÉRIFIER LES DONNÉES
Dans Home Assistant (fichier de stockage)
bash
cat /config/.storage/core.config_entries | grep -A 30 home_suivi_elec
Via API (navigateur)
javascript
fetch('/api/home_suivi_elec/get_user_options').then(r => r.json()).then(console.log)
Dans les logs Python
bash
ha core logs | grep -i "get_user_options"
Résumé : Les données viennent de ConfigEntry (stockage Home Assistant), sont exposées via l'API REST Python, puis récupérées et affichées par le JavaScript frontend. 🎯
