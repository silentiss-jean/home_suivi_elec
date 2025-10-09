#!/bin/bash
# 🧩 Copie des fichiers UI Home Suivi Élec vers /config/www/community/home_suivi_elec_ui

SRC_DIR="custom_components/home_suivi_elec/web_static"
DST_DIR="/config/www/community/home_suivi_elec_ui"

echo "📦 Copie de l'interface UI..."
mkdir -p "$DST_DIR"

cp -v "$SRC_DIR"/* "$DST_DIR"/ 2>/dev/null || {
  echo "❌ Erreur de copie, vérifie que le dossier source existe : $SRC_DIR"
  exit 1
}

echo "✅ Interface copiée avec succès dans $DST_DIR"
