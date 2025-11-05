"use strict";

// Diagnostic enrichi avec 4 sous-onglets spécialisés
import { fetchViaProxy } from "./proxy.js";
import { toast } from "./uiToast.js";
import { loadCapteursSensor } from "./diagnostic_modules/capteursSensor.js";
import { loadIntegrations } from "./diagnostic_modules/integrations.js";
import { loadSystemLogs } from "./diagnostic_modules/logs.js";
import { loadBackendHealth } from "./diagnostic_modules/healthBackend.js";

console.info("[diagnostics] Module diagnostics enrichi chargé - 4 sous-onglets COMPLETS");

// Variables globales pour la gestion des onglets
let activeSubTab = 'capteurs';
let diagnosticsData = {};

// Cache pour les données
const dataCache = {
    sensors: null,
    integrations: null,
    logs: null,
    health: null,
    lastUpdate: null
};

/**
 * Point d'entrée principal - charge l'interface diagnostics
 */
export async function loadDiagnostics() {
    const container = document.getElementById("diagnosticsGlobal") || document.getElementById("diagnostics-container");
    
    if (!container) {
        console.warn("[diagnostics] Conteneur diagnostics non trouvé - retour silencieux");
        return;
    }
    
    try {
        // Créer la structure de base avec les 4 sous-onglets
        //container.innerHTML = createDiagnosticsLayout();
        
        // Initialiser les gestionnaires d'événements
        initSubTabHandlers();
        
        // Charger le premier sous-onglet par défaut
        await switchSubTab('capteurs');
        
        console.log("✅ Interface diagnostics enrichie COMPLÈTE initialisée");
        
    } catch (error) {
        console.error("❌ Erreur initialisation diagnostics:", error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <h4>❌ Erreur Diagnostics</h4>
                <p>${error.message}</p>
            </div>
        `;
    }
}

/**
 * Crée la structure HTML des sous-onglets diagnostics
 */
function createDiagnosticsLayout() {
    return `
        <div class="diagnostics-enhanced">
            <div class="diagnostics-header">
                <h3>🔍 Diagnostics Système Enrichi</h3>
                <div class="diagnostics-tabs">
                    <button class="tab-button active" data-tab="capteurs">
                        📊 Capteurs (${dataCache.sensors ? dataCache.sensors.length : '...'})</button>
                    <button class="tab-button" data-tab="integrations">
                        🔗 Intégrations</button>
                    <button class="tab-button" data-tab="logs">
                        📜 Logs</button>
                    <button class="tab-button" data-tab="health">
                        💚 Santé</button>
                </div>
            </div>
            <div class="diagnostics-content">
                <div id="diagnostics-tab-content" class="tab-content">
                    <div class="loading-diagnostic">
                        <p>🔄 Chargement...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialise les gestionnaires d'événements pour les onglets
 */
function initSubTabHandlers() {
    const tabButtons = document.querySelectorAll('.diagnostics-tabs .tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const tab = e.target.dataset.tab;
            await switchSubTab(tab);
        });
    });
}

/**
 * Basculer vers un sous-onglet spécifique
 */
async function switchSubTab(tabName) {
    try {
        // Mettre à jour l'UI des onglets
        updateTabButtons(tabName);
        
        // Variable globale de suivi
        activeSubTab = tabName;
        
        // Conteneur de contenu
        const contentContainer = document.getElementById('diagnostics-tab-content');
        
        if (!contentContainer) {
            console.error("[diagnostics] Conteneur tab-content introuvable");
            return;
        }
        
        // Affichage loading
        contentContainer.innerHTML = '<div class="loading-diagnostic"><p>🔄 Chargement...</p></div>';
        
        // Charger le contenu selon l'onglet
        switch (tabName) {
            case 'capteurs':
                await loadCapteursSensor(contentContainer);
                break;
            case 'integrations':
                await loadIntegrations(contentContainer);
                break;
            case 'logs':
                await loadSystemLogs(contentContainer);
                break;
            case 'health':
                await loadBackendHealth(contentContainer);
                break;
            default:
                contentContainer.innerHTML = '<p>⚠️ Onglet non implémenté</p>';
        }
        
        console.log(`✅ Sous-onglet diagnostics '${tabName}' chargé`);
        
    } catch (error) {
        console.error(`❌ Erreur chargement onglet ${tabName}:`, error);
        const contentContainer = document.getElementById('diagnostics-tab-content');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h4>❌ Erreur onglet ${tabName}</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}

/**
 * Met à jour l'état actif des boutons d'onglets
 */
function updateTabButtons(activeTab) {
    const tabButtons = document.querySelectorAll('.diagnostics-tabs .tab-button');
    
    tabButtons.forEach(button => {
        const tabName = button.dataset.tab;
        if (tabName === activeTab) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

/**
 * API helper - récupérer données avec cache
 */
async function getDiagnosticsData(endpoint, cacheKey, maxAge = 30000) {
    const now = Date.now();
    
    // Vérifier le cache
    if (dataCache[cacheKey] && dataCache.lastUpdate && (now - dataCache.lastUpdate < maxAge)) {
        console.log(`[diagnostics] Utilisation cache pour ${cacheKey}`);
        return dataCache[cacheKey];
    }
    
    try {
        console.log(`[diagnostics] Fetch ${endpoint}...`);
        const data = await fetchViaProxy(endpoint);
        
        // Mettre en cache
        dataCache[cacheKey] = data;
        dataCache.lastUpdate = now;
        
        return data;
        
    } catch (error) {
        console.error(`[diagnostics] Erreur fetch ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Utilitaire - formater les données pour affichage
 */
function formatDiagnosticValue(value, type = 'auto') {
    if (value === null || value === undefined) {
        return '<span class="value-null">null</span>';
    }
    
    if (type === 'boolean' || typeof value === 'boolean') {
        return value ? 
            '<span class="value-true">✅ true</span>' : 
            '<span class="value-false">❌ false</span>';
    }
    
    if (type === 'number' || typeof value === 'number') {
        return `<span class="value-number">${value.toLocaleString()}</span>`;
    }
    
    if (type === 'date' && value) {
        const date = new Date(value);
        return `<span class="value-date">${date.toLocaleString()}</span>`;
    }
    
    // String par défaut
    return `<span class="value-string">${String(value)}</span>`;
}

/**
 * Fonction publique pour rafraîchir un onglet spécifique
 */
window.refreshDiagnosticsTab = function(tabName = null) {
    const targetTab = tabName || activeSubTab;
    
    // Vider le cache pour forcer le rechargement
    Object.keys(dataCache).forEach(key => {
        if (key !== 'lastUpdate') {
            dataCache[key] = null;
        }
    });
    
    // Recharger l'onglet actuel
    switchSubTab(targetTab);
    
    toast(`🔄 Onglet ${targetTab} rafraîchi`, 'info');
};

// Export des fonctions utilitaires
window.diagnosticsUtils = {
    getDiagnosticsData,
    formatDiagnosticValue,
    switchSubTab,
    dataCache
};

console.info("[diagnostics] ✅ Module diagnostics enrichi ENTIÈREMENT chargé - 4 sous-onglets");
