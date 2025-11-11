# cli_backend_nav_advanced.py

import difflib
import json
from home_suivi_elec_backend_navigation import BACKEND_NAVIGATION

def fuzzy_lookup(query, threshold=0.3):
    query_lc = query.lower()
    best = None
    best_score = 0.0
    for k in BACKEND_NAVIGATION:
        score = difflib.SequenceMatcher(None, query_lc, k.lower()).ratio()
        if score > best_score:
            best_score = score
            best = k
    if best_score >= threshold:
        return BACKEND_NAVIGATION[best], best, best_score
    return None, None, None

def print_markdown(module, key):
    print("\n---")
    print(f"**Besoin métier :** `{key}`  \n")
    print(f"- **Section doc :** `{module.get('section')}`")
    print(f"- **Fichier Python :** `{module.get('file')}`")
    print(f"- **Fonctions critiques :** `{', '.join(module.get('functions', [])) if 'functions' in module else 'N/A'}`")
    print(f"- **Services HA :** `{', '.join(module.get('services', [])) if 'services' in module else 'N/A'}`")
    print(f"- **Endpoints REST :** `{', '.join(module.get('rest_endpoints', [])) if 'rest_endpoints' in module else 'N/A'}`")
    print(f"- **Clés hass.data :** `{', '.join(module.get('hass_data', [])) if 'hass_data' in module else 'N/A'}`")
    print(f"- **Astuce debug :** {module.get('tips')}")
    print("---\n")

def export_json(module, key):
    out = { "besoin_métier": key }
    out.update(module)
    filename = f"nav_{key.replace(' ','_')}.json"
    print(f"⏎ Export diagnostic JSON : {filename}")
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

def suggest_alternatives(query):
    print("\nSuggestions :")
    for k in BACKEND_NAVIGATION:
        if query.lower() in k.lower():
            print(f"- {k} (Section {BACKEND_NAVIGATION[k]['section']})")
    print("Sinon, essaye une formulation plus courte ou précise.")

if __name__ == "__main__":
    query = input("↪ Décris ton bug ou besoin métier (ex: scoring, dashboard, panel, correction noms…)\n> ")
    module, key, score = fuzzy_lookup(query)
    if module:
        print(f"\nMatch fuzzy sur : **{key}** ({score:.2f})")
        print_markdown(module, key)
        export_json(module, key)
    else:
        print("❓ Aucun module trouvé par fuzzy match.")
        suggest_alternatives(query)

