import re
import sys
import os
from pathlib import Path

BACKEND_MD = "docs/backend.md"
BACKUP_MD = "docs/backend.md.bak"
DRY_RUN_MD = "docs/backend.md.dryrun"

def generate_resume_block(module_name, summary, python_file, classes, functions, services, endpoints, hass_data, logs, examples, debug_tips):
    block = (
        f"#### {module_name} — Résumé et accès rapide\n\n"
        f"- **Rôle métier** : {summary}\n"
        f"- **Fichier Python** : {python_file}\n"
        f"- **Classe(s) principale(s)** : {', '.join(classes) if classes else 'N/A'}\n"
        f"- **Fonctions critiques** : {', '.join(functions) if functions else 'N/A'}\n"
        f"- **Services HA** : {', '.join(services) if services else 'N/A'}\n"
        f"- **Endpoints REST** : {', '.join(endpoints) if endpoints else 'N/A'}\n"
        f"- **Clés hass.data** : {', '.join(hass_data) if hass_data else 'N/A'}\n"
        f"- **Logs/caractéristiques** : {', '.join(logs) if logs else 'N/A'}\n"
        f"- **Exemples d’usage** : {examples}\n"
        f"- **Pour debuguer** : {debug_tips}\n\n"
    )
    return block

def update_module_section(md_path, module_pattern, new_resume_block, dry_run=True):
    with open(md_path, encoding="utf-8") as f:
        content = f.read()

    # Find start of this module's section (pattern: #### 3.X nom_du_module.py)
    matches = list(re.finditer(r"^####\s*3\.\d+\s*"+re.escape(module_pattern)+r"[\s—-]+Résumé et accès rapide.*?$", content, flags=re.MULTILINE | re.UNICODE))
    if not matches:
        print(f"Section '#### 3.X {module_pattern} — Résumé et accès rapide' not found in backend.md.")
        # Inject the block at the end if not found
        content += "\n\n" + new_resume_block
        print(f"Bloc ajouté en fin de fichier.")
    else:
        start = matches[0].start()
        # Find end of block (next section header or end of file)
        next_section = re.search(r"^####\s*3\.\d+\s*[a-zA-Z0-9_/]+\.py", content[matches[0].end():], flags=re.MULTILINE)
        block_end = matches[0].end() + (next_section.start() if next_section else len(content[matches[0].end():]))
        # Replace everything between start and block_end
        content = content[:start] + new_resume_block + content[block_end:]
        print(f"Bloc mis à jour pour {module_pattern}.")

    target_file = DRY_RUN_MD if dry_run else md_path
    # Backup before overwriting (if not dry-run)
    if not dry_run and os.path.exists(md_path):
        print("Backup du fichier d'origine créé dans 'docs/backend.md.bak'")
        with open(md_path, "r", encoding="utf-8") as orig, open(BACKUP_MD, "w", encoding="utf-8") as bak:
            bak.write(orig.read())
    # Write new content
    with open(target_file, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ Fichier {'(dryrun)' if dry_run else '(réel)'} mis à jour : {target_file}")

def main():
    # Exemple d'appel CLI :
    # python update_backend_md.py "init.py" dryrun
    if len(sys.argv) < 3:
        print("Usage: python update_backend_md.py module.py [dryrun|commit]")
        sys.exit(1)
    module = sys.argv[1]
    dry_run = sys.argv[2] == "dryrun"

    # -- À adapter ou automatiser selon extraction code/source --
    # Bloc résumé pour init.py (exemple, à convertir en extraction automatique pour les autres modules)
    resume_block = generate_resume_block(
        "3.1 init.py",
        "Orchestration et setup global de l’intégration, enregistrement services, endpoints, lifecycle et gestion hass.data.",
        "custom_components/home_suivi_elec/init.py",
        ["N/A (fonctionnel)"],
        ["async_setup", "async_setup_entry", "setup_sensors_after_detection", "_delayed_start"],
        ["generate_local_data", "generate_selection", "fix_sensor_names", "copy_ui_files", "migrate_cleanup"],
        ["/api/home_suivi_elec/set_ignored_entity", "/api/home_suivi_elec/get_diagnostics", "/api/home_suivi_elec/choose_best_for_device"],
        ["DOMAIN", "energy_sensors", "sync_manager", "options"],
        ["[SETUP_ENTRY]", "[SERVICE]", "[INIT]", "[RESET]", "[MIGRATION]"],
        "Setup automatique après démarrage HA, orchestration des modules backend, enregistrement panneau UI.",
        (
            "Vérifier état des services HA, endpoints REST, analyse hass.data, logs setup global. "
            "Inspecter hass.data à chaque setup/reload, vérifier panel UI sidebar et logs boot. "
            "Analyse des logs pour chaque phase du boot/setup asynchrone et exceptions/fallback signalés."
        )
    )

    update_module_section(BACKEND_MD, module, resume_block, dry_run=dry_run)

if __name__ == "__main__":
    main()

