// diagnostic_modules/integrations.js
// Module intégrations ÉNERGÉTIQUES - Version corrigée pour le suivi énergétique

"use strict";

import { fetchViaProxy } from "/local/community/home_suivi_elec_ui/js/shared/proxy.js";
import { toast } from "/local/community/home_suivi_elec_ui/js/shared/uiToast.js";

console.info("[integrations] Module intégrations ÉNERGÉTIQUES chargé");

/**
 * Point d'entrée principal pour l'onglet intégrations énergétiques
 */
export async function loadIntegrations(container) {
    if (!container) {
        console.error('❌ [loadIntegrations] Container requis');
        return;
    }

    console.log('🔧 [loadIntegrations] Chargement des intégrations énergétiques...');

    // Afficher un indicateur de chargement
    container.innerHTML = `
        <div class="loading-placeholder">
            <div class="spinner"></div>
            <p>Chargement des intégrations énergétiques...</p>
        </div>
    `;

    try {
        // ✅ APPEL CORRECT pour les intégrations énergétiques
        console.log('[loadIntegrations] Appel API /api/home_suivi_elec/get_sensors');
        const sensorsData = await fetchViaProxy('/api/home_suivi_elec/get_sensors');

        console.log('[loadIntegrations] Réponse get_sensors:', sensorsData);

        if (sensorsData.error) {
            throw new Error(sensorsData.message || 'Erreur lors du chargement des capteurs');
        }

        // ✅ TRANSFORMATION des données capteurs en intégrations énergétiques
        const integrationsData = transformSensorsToIntegrations(sensorsData);
        console.log('[loadIntegrations] Intégrations énergétiques extraites:', integrationsData);

        // ✅ RENDU des intégrations énergétiques
        renderEnergyIntegrationsData(container, integrationsData);
        console.log('✅ [loadIntegrations] Interface intégrations énergétiques rendue');

    } catch (error) {
        console.error('❌ [loadIntegrations] Erreur:', error);
        container.innerHTML = `
            <div class="error-placeholder">
                <h3>❌ Erreur de chargement des intégrations énergétiques</h3>
                <p><strong>Endpoint:</strong> /api/home_suivi_elec/get_sensors</p>
                <p><strong>Erreur:</strong> ${error.message}</p>
                <button onclick="window.showDiagTab('integrations')" class="retry-btn">
                    🔄 Réessayer
                </button>
                <details style="margin-top: 16px;">
                    <summary>🔍 Détails techniques</summary>
                    <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 0.8em; margin-top: 8px;">${error.stack || 'Pas de stack trace'}</pre>
                </details>
            </div>
        `;
    }
}

/**
 * Transforme les données capteurs en intégrations énergétiques
 */
function transformSensorsToIntegrations(sensorsData) {
    const integrations = {};
    const { selected = {}, alternatives = {} } = sensorsData;

    // Traiter les capteurs sélectionnés
    for (const [integration, sensors] of Object.entries(selected)) {
        if (!integrations[integration]) {
            integrations[integration] = {
                domain: integration,
                friendly_name: integration.charAt(0).toUpperCase() + integration.slice(1),
                status: 'Sélectionnée',
                health_state: 'selected',
                selected_count: 0,
                alternative_count: 0,
                total_sensors: 0,
                sensors_details: []
            };
        }

        integrations[integration].selected_count = sensors.length;
        integrations[integration].total_sensors += sensors.length;

        // Ajouter détails des capteurs
        for (const sensor of sensors) {
            integrations[integration].sensors_details.push({
                ...sensor,
                status: 'selected'
            });
        }
    }

    // Traiter les alternatives
    for (const [integration, sensors] of Object.entries(alternatives)) {
        if (!integrations[integration]) {
            integrations[integration] = {
                domain: integration,
                friendly_name: integration.charAt(0).toUpperCase() + integration.slice(1),
                status: 'Disponible',
                health_state: 'available',
                selected_count: 0,
                alternative_count: 0,
                total_sensors: 0,
                sensors_details: []
            };
        }

        integrations[integration].alternative_count = sensors.length;
        integrations[integration].total_sensors += sensors.length;

        // Ajouter détails des capteurs
        for (const sensor of sensors) {
            integrations[integration].sensors_details.push({
                ...sensor,
                status: 'alternative'
            });
        }
    }

    // Calculer les états de santé
    for (const integration of Object.values(integrations)) {
        if (integration.selected_count > 0) {
            integration.health_state = 'selected';
            integration.status = `${integration.selected_count} sélectionné(s)`;
        } else if (integration.alternative_count > 0) {
            integration.health_state = 'available';
            integration.status = `${integration.alternative_count} disponible(s)`;
        } else {
            integration.health_state = 'empty';
            integration.status = 'Aucun capteur';
        }
    }

    return {
        integrations: Object.values(integrations),
        summary: {
            total: Object.keys(integrations).length,
            selected: Object.values(integrations).filter(i => i.selected_count > 0).length,
            available: Object.values(integrations).filter(i => i.selected_count === 0 && i.alternative_count > 0).length,
            empty: Object.values(integrations).filter(i => i.total_sensors === 0).length
        }
    };
}

/**
 * Rendu des intégrations énergétiques
 */
function renderEnergyIntegrationsData(container, data) {
    const { integrations, summary } = data;

    if (!integrations || integrations.length === 0) {
        container.innerHTML = `
            <div class="no-data-placeholder">
                <h3>📊 Aucune intégration énergétique trouvée</h3>
                <p>Aucune intégration énergétique détectée. Vérifiez votre configuration.</p>
            </div>
        `;
        return;
    }

    // Trier par importance : sélectionnées > disponibles > vides
    const sortedIntegrations = [...integrations].sort((a, b) => {
        const priority = { selected: 3, available: 2, empty: 1 };
        return (priority[b.health_state] || 0) - (priority[a.health_state] || 0);
    });

    const html = `
        <div class="integrations-overview">
            <div class="summary-cards">
                <div class="summary-card selected">
                    <div class="card-icon">✅</div>
                    <div class="card-info">
                        <h3>${summary.selected}</h3>
                        <p>Sélectionnées</p>
                    </div>
                </div>
                <div class="summary-card available">
                    <div class="card-icon">📋</div>
                    <div class="card-info">
                        <h3>${summary.available}</h3>
                        <p>Disponibles</p>
                    </div>
                </div>
                <div class="summary-card empty">
                    <div class="card-icon">⚪</div>
                    <div class="card-info">
                        <h3>${summary.empty}</h3>
                        <p>Vides</p>
                    </div>
                </div>
                <div class="summary-card total">
                    <div class="card-icon">📊</div>
                    <div class="card-info">
                        <h3>${summary.total}</h3>
                        <p>Total</p>
                    </div>
                </div>
            </div>

            <div class="integrations-table-container">
                <table class="integrations-table">
                    <thead>
                        <tr>
                            <th>🔧 Intégration</th>
                            <th>📊 État</th>
                            <th>✅ Sélectionnés</th>
                            <th>📋 Disponibles</th>
                            <th>📈 Total</th>
                            <th>🔍 Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedIntegrations.map(integration => `
                            <tr class="integration-row ${integration.health_state}">
                                <td class="integration-name">
                                    <div class="integration-info">
                                        <strong>${integration.friendly_name}</strong>
                                        <small class="domain-name">${integration.domain}</small>
                                    </div>
                                </td>
                                <td>
                                    <span class="status-badge ${integration.health_state}">
                                        ${getEnergyStatusIcon(integration.health_state)} ${integration.status}
                                    </span>
                                </td>
                                <td class="text-center">
                                    <span class="selected-count">${integration.selected_count}</span>
                                </td>
                                <td class="text-center">
                                    <span class="available-count">${integration.alternative_count}</span>
                                </td>
                                <td class="text-center">
                                    <span class="total-count">${integration.total_sensors}</span>
                                </td>
                                <td class="text-center">
                                    <button class="view-details-btn" onclick="showIntegrationDetails('${integration.domain}')">
                                        👁️ Détails
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function getEnergyStatusIcon(healthState) {
    switch (healthState) {
        case 'selected': return '✅';
        case 'available': return '📋';
        case 'empty': return '⚪';
        default: return '❓';
    }
}

// Fonction globale pour afficher les détails
window.showIntegrationDetails = function(domain) {
    console.log(`Affichage des détails pour l'intégration: ${domain}`);
    // TODO: Implémenter l'affichage des détails
    alert(`Détails pour l'intégration: ${domain}\n(Fonctionnalité à implémenter)`);
};
