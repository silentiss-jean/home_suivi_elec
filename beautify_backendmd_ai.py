import re
import shutil

INPUT_MD = "docs/backend.md"
OUTPUT_MD = "docs/backend.md.beautified"
BACKUP_MD = "docs/backend.md.bak"

def format_module_headers(content):
    # Header module : 3.X nom_module.py — Résumé et accès rapide devient #### ...
    header_pattern = re.compile(r"^(?!#+)(\s*3\.\d+\s+[a-zA-Z0-9_/]+\.py\s+—\s+Résumé et accès rapide)", flags=re.MULTILINE)
    formatted = re.sub(header_pattern, r"#### \1", content)
    # Aération
    formatted = re.sub(r"(\n*)(#### 3\.\d+ .+ — Résumé et accès rapide)", r"\n\2", formatted)
    return formatted

def format_lists(content):
    # Listes avec tiret, étoile, numérotation : ajoute une ligne vide avant
    content = re.sub(r"([^\n])(\n[-*] )", r"\1\n\n\2", content)
    content = re.sub(r"([^\n])(\n\d+\.)", r"\1\n\n\2", content)
    return content

def format_subtitles(content):
    # Mise en valeur des sous-titres (🧠, ⚙️, 🔗, 🔄, 🧪, Debug, etc.)
    sub_patterns = [
        (r"^([-–—]*)🧠", "\n**🧠 Rôle métier**"),
        (r"^([-–—]*)⚙️", "\n**⚙️ Fonctionnement technique**"),
        (r"^([-–—]*)🔗", "\n**🔗 Interactions et dépendances**"),
        (r"^([-–—]*)🔄", "\n**🔄 Cycle de vie**"),
        (r"^([-–—]*)🧪", "\n**🧪 Exemple(s)**"),
        (r"^([-–—]*)Debug & Repérage", "\n**Debug & Repérage rapide (IA)**"),
    ]
    for patt, repl in sub_patterns:
        content = re.sub(patt, repl, content, flags=re.MULTILINE)
    return content

def format_code_tables_mermaid(content):
    # Tableaux markdown : aère avant chaque table
    content = re.sub(r"([^\n])(\n\|)", r"\1\n\n\2", content)
    # Blocs code : s'assure juste qu'il y a une ligne vide avant/après
    content = re.sub(r"([^\n])(\n```(?:python|yaml|bash|mermaid)?)", r"\1\n\2", content)
    content = re.sub(r"(``````)", r"\n\1\n", content, flags=re.DOTALL)
    return content

def remove_extra_blank(content):
    # Nettoie les triples/doubles blank inutiles
    content = re.sub(r"\n{3,}", "\n\n", content)
    # Remove leading blank at start
    content = re.sub(r"^\s+", "", content)
    return content

def report_corrections(orig, formatted):
    print("\n--- Rapport sur les corrections syntaxiques ---")
    headers_orig = re.findall(r"^\s*3\.\d+\s+[a-zA-Z0-9_/]+\.py\s+— Résumé et accès rapide", orig, flags=re.MULTILINE)
    headers_form = re.findall(r"^####\s*3\.\d+\s+[a-zA-Z0-9_/]+\.py\s+— Résumé et accès rapide", formatted, flags=re.MULTILINE)
    for h in headers_orig:
        if f"#### {h.strip()}" not in headers_form:
            print(f"Header corrigé : '{h.strip()}' → '#### {h.strip()}'")
    print("Headers au bon format :", len(headers_form))
    print("---\n")

def beautify_backend_md(input_md, output_md, backup_md):
    shutil.copyfile(input_md, backup_md)
    with open(input_md, encoding="utf-8") as fin:
        orig = fin.read()
    content = orig
    content = format_module_headers(content)
    content = format_subtitles(content)
    content = format_lists(content)
    content = format_code_tables_mermaid(content)
    content = remove_extra_blank(content)
    report_corrections(orig, content)
    with open(output_md, "w", encoding="utf-8") as fout:
        fout.write(content)
    print(f"✅ Fichier beautifié : {output_md}\n(backup : {backup_md})")

if __name__ == "__main__":
    beautify_backend_md(INPUT_MD, OUTPUT_MD, BACKUP_MD)

