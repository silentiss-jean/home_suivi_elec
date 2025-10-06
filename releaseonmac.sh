#!/bin/bash

# 🧼 Nettoyage des fichiers système macOS
find . -name ".DS_Store" -delete
grep -qxF '.DS_Store' .gitignore || echo '.DS_Store' >> .gitignore

# 📌 Dernier tag SemVer
LAST_TAG=$(git tag --sort=-v:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | tail -n 1)

if [ -z "$LAST_TAG" ]; then
  MAJOR=0
  MINOR=9
  PATCH=0
else
  MAJOR=$(echo "$LAST_TAG" | cut -d. -f1 | tr -d 'v')
  MINOR=$(echo "$LAST_TAG" | cut -d. -f2)
  PATCH=$(echo "$LAST_TAG" | cut -d. -f3)
fi

# 🔁 Incrémentation du tag
while true; do
  PATCH=$((PATCH + 1))
  NEW_TAG="v${MAJOR}.${MINOR}.${PATCH}"
  if ! git rev-parse "$NEW_TAG" >/dev/null 2>&1; then
    break
  fi
done

# 🕒 Horodatage
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")

# 📦 Mise à jour du manifest.json pour home_suivi_elec
MANIFEST="custom_components/home_suivi_elec/manifest.json"
if [ ! -f "$MANIFEST" ]; then
  echo "❌ manifest.json introuvable à l'emplacement attendu : $MANIFEST"
  exit 1
fi

# ✅ Mise à jour de la version dans manifest.json (compatible macOS)
sed -i '' "s/\"version\": \".*\"/\"version\": \"${NEW_TAG#v}\"/" "$MANIFEST"

# 🔍 Vérification des changements
CHANGES=$(git status --porcelain)
if [ -z "$CHANGES" ]; then
  echo "⚠️ Aucun changement détecté. Rien à publier."
  exit 0
fi

# 📂 Affichage des fichiers modifiés
echo "📂 Fichiers modifiés :"
git diff --name-only

# ✅ Commit + tag
git add .
git commit -m "🚀 Release $NEW_TAG — horodaté $TIMESTAMP"
git tag -a "$NEW_TAG" -m "✅ Version compatible HACS générée par releaseonmac.sh ($TIMESTAMP)"
git push origin dev
git push origin "$NEW_TAG"

echo ""
echo "✅ Version $NEW_TAG publiée avec succès et compatible HACS"
