#!/bin/bash

VENV_DIR=".venv"

echo "🐍 Chargement de l'environnement virtuel Python..."

# Créer le venv s'il n'existe pas
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Aucun venv trouvé, création en cours..."
    python3 -m venv "$VENV_DIR"
    echo "✅ Environnement virtuel créé dans $VENV_DIR"
fi

# Vérifier si le script est bien sourcé
if [ "$0" = "$BASH_SOURCE" ] || [ "$0" = "$ZSH_NAME" ]; then
    echo "⚠️  Tu dois lancer ce script avec :"
    echo "   source load_venv.sh"
    echo "   ou . load_venv.sh"
    exit 1
fi

# Activer le venv
source "$VENV_DIR/bin/activate"
echo "🚀 Environnement virtuel activé."

# Mettre à jour pip
echo "🔄 Mise à jour de pip..."
pip install --upgrade pip

# Installer les dépendances principales
if [ -f "requirements.txt" ]; then
    echo "📚 Installation des dépendances principales..."
    pip install -r requirements.txt
    echo "✅ Dépendances principales installées."
else
    echo "📁 Aucun fichier requirements.txt trouvé, installation ignorée."
fi

# Installer les dépendances de développement
if [ -f "requirements-dev.txt" ]; then
    echo "🧪 Installation des dépendances de développement..."
    pip install -r requirements-dev.txt
    echo "✅ Dépendances de développement installées."
else
    echo "📁 Aucun fichier requirements-dev.txt trouvé, installation ignorée."
fi

# Vérifier que pytest est bien installé
if ! command -v pytest &> /dev/null; then
    echo "❌ pytest n'est pas disponible. Vérifie requirements-dev.txt ou ton environnement."
else
    echo "✅ pytest est prêt à l'emploi."
fi

echo "🎉 Environnement prêt à l'utilisation."
