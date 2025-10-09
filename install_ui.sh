#!/bin/bash
# -------------------------------------------------------------------
# Home Suivi Élec - Installation UI simplifiée
# Copie les fichiers web_static vers www/community/home_suivi_elec_ui
# -------------------------------------------------------------------

# Répertoire source (dans le repo git)
SRC_DIR="$(pwd)/custom_components/home_suivi_elec/web_static"

# Répertoire destination sur HA
DST_DIR="/config/www/community/home_suivi_elec_ui"

echo "📂 Création du répertoire destination si nécessaire : $DST_DIR"
mkdir -p "$DST_DIR"

echo "📦 Copie des fichiers depuis $SRC_DIR vers $DST_DIR"
for f in "$SRC_DIR"/*; do
    if [ -f "$f" ]; then
        cp "$f" "$DST_DIR"
        echo "✅ Copié : $f → $DST_DIR"
    fi
done

echo "🎉 Installation UI terminée !"
