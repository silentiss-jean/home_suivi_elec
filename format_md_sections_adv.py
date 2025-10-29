import re
from pathlib import Path
import shutil

INPUT_MD = "docs/backend.md"
OUTPUT_MD = "docs/backend.md.beautified"
BACKUP_MD = "docs/backend.md.bak"

def format_headers(content):
    # Ajoute '#### ' devant entête module n'ayant pas déjà des dièses
    pattern = r"^(?!#+)(\s*3\.\d+\s+[a-zA-Z0-9_/]+\.py\s+—\s+Résumé et accès rapide)"
    formatted = re.sub(pattern, r"#### \1", content, flags=re.MULTILINE)
    return formatted

def vertical_spacing(content):
    # Ajoute une ligne vide avant chaque header de module (> 3.X ...)
    pattern = r"(\n*)(####\s*3\.\d+\s+[a-zA-Z0-9_/]+\.py\s+—\s+Résumé et accès rapide)"
    formatted = re.sub(pattern, r"\n\2", content)
    formatted = re.sub(r"\n{3,}", "\n\n", formatted)
    return formatted

def format_lists_and_code(content):
    # Listes markdown : ajoute un saut de ligne entre une phrase et une liste
    content = re.sub(r"([^\n])(\n[-*] )", r"\1\n\n\2", content)
    # Tableaux markdown : ajoute une ligne vide avant
    content = re.sub(r"([^\n])(\n\|)", r"\1\n\n\2", content)
    # Blocs de code ```
    content = re.sub(r"```(\w+)?\n", r"\n``````\n", content)
    # Citations markdown (> ...)
    content = re.sub(r"(^|\n)(> .+)", r"\1\n\2", content)
    # Nettoyage double/triple after lists/tables/code
    content = re.sub(r"\n{3,}", "\n\n", content)
    return content

def report_corrections(original, formatted):
    report = []
    # Cherche les headers corrigés
    orig_headers = re.findall(r"^\s*3\.\d+\s+[a-zA-Z0-9_/]+\.py\s+—\s+Résumé et accès rapide", original, flags=re.MULTILINE)
    form_headers = re.findall(r"^####\s*3\.\d+\s+[a-zA-Z0-9_/]+\.py\s+—\s+Résumé et accès rapide", formatted, flags=re.MULTILINE)
    for h in orig_headers:
        if f"#### {h.strip()}" not in form_headers:
            report.append(f"Header corrigé : '{h.strip()}' --> '#### {h.strip()}'")
    print("\n--- REPORT CORRECTIONS ---")
    if report:
        for line in report:
            print(line)
    else:
        print("Aucun header à corriger.")
    print("---\n")

def format_markdown_file(input_md, output_md, backup_md):
    shutil.copyfile(input_md, backup_md)
    with open(input_md, encoding="utf-8") as f:
        content = f.read()
    original = content
    
    content = format_headers(content)
    content = vertical_spacing(content)
    content = format_lists_and_code(content)
    
    report_corrections(original, content)
    
    with open(output_md, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ Formatage & beautification terminés. Nouveau fichier : {output_md} (backup : {backup_md})")

if __name__ == "__main__":
    format_markdown_file(INPUT_MD, OUTPUT_MD, BACKUP_MD)

