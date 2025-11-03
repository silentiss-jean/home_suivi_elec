# 🧹 Legacy Files Cleanup Required

## Files to Delete Manually

These legacy flat JS files need to be deleted as they have been replaced by modular versions:

### Core Files to Delete:
- `js/app.js` (replaced by `js/shared/app.js`)
- `js/diagnostics.js` (replaced by `js/diagnostics/diagnostics.js`)
- `js/detection.js` (replaced by `js/detection/detection.js`)
- `js/summary.js` (replaced by `js/summary/summary.js`)

### Configuration Files to Delete:
- `js/configuration.js` (replaced by `js/configuration/configuration.js`)
- `js/configuration.api.js` (replaced by `js/configuration/configuration.api.js`)
- `js/configuration.state.js` (replaced by `js/configuration/configuration.state.js`)
- `js/configuration.view.js` (replaced by `js/configuration/configuration.view.js`)
- `js/referencePanel.js` (replaced by `js/configuration/referencePanel.js`)
- `js/selectionPanel.js` (replaced by `js/configuration/selectionPanel.js`)

### Other Files to Delete:
- `js/duplicates.api.js` (replaced by `js/duplicates/duplicates.api.js`)
- `js/duplicatesPanel.js` (replaced by `js/duplicates/duplicatesPanel.js`)
- `js/savePanel.js` (replaced by `js/save/savePanel.js`)
- `js/auth.js` (replaced by `js/shared/auth.js`)
- `js/eventBus.js` (replaced by `js/shared/eventBus.js`)
- `js/stateModule.js` (replaced by `js/shared/stateModule.js`)
- `js/utils.js` (replaced by `js/shared/utils.js`)
- `js/uiToast.js` (replaced by `js/shared/uiToast.js`)
- `js/proxy.js` (replaced by `js/shared/proxy.js`)

## Keep:
- `js/modules/` directory (contains 2 files still referenced)
- All new modular directories: `shared/`, `configuration/`, `detection/`, etc.

## Command Line Cleanup (SSH):

```bash
cd /config/custom_components/home_suivi_elec/web_static/js

# Remove legacy files
rm -f app.js diagnostics.js detection.js summary.js
rm -f configuration.js configuration.api.js configuration.state.js configuration.view.js
rm -f referencePanel.js selectionPanel.js
rm -f duplicates.api.js duplicatesPanel.js savePanel.js
rm -f auth.js eventBus.js stateModule.js utils.js uiToast.js proxy.js

# Verify modular structure remains
ls -la */
```

## Status: ✅ Modular structure ready, legacy cleanup pending
