# 🚀 VERSION STABLE PURE - RÉFÉRENCES

## Version Fonctionnelle Confirmée
**Date:** 4 novembre 2025, 18:55 CET  
**Commit:** `28b8122570f9078aae07a8cbb5e0b5168831b475`  
**Status:** ✅ 100% Opérationnel  

## Références Git pour Retour Rapide

### Tags
- `v1.0.86-stable` → Version taguée pour HACS

### Branches  
- `stable-pure-working` → Branche de travail stable
- `backup-version-fonctionnelle-nov4` → Branche de secours

## Commandes de Restauration Rapide

### Retour Version Stable

git checkout stable-pure-working

ou
git checkout v1.0.86-stable

ou
git checkout 28b8122570f9078aae07a8cbb5e0b5168831b475

### Copie vers Home Assistant

rsync -av --delete --exclude='.git' ./ core-ssh:/config/custom_components/home_suivi_elec/
ssh core-ssh "ha core restart"
