// diagnostic_modules/integrations.js
// Module intégrations ÉNERGÉTIQUES - Version finale ajustée

"use strict";

import { fetchViaProxy } from "/local/community/home_suivi_elec_ui/js/shared/proxy.js";
import { toast } from "/local/community/home_suivi_elec_ui/js/shared/uiToast.js";

console.info("[integrations] Module intégrations ÉNERGÉTIQUES chargé - Version finale");

let cachedIntegrationsData = null;

/**
 * Point d'entrée principal pour l'onglet intégrations énergétiques
 */
export async function loadIntegrations(container) {
    if (!container) {
        console.error('❌ [loadIntegrations] Container requis');
        return;
    }

    console.log('🔧 [loadIntegrations] Chargement des intégrations énergétiques...');

    container.innerHTML = `
        <div class="loading-placeholder">
            <div class="spinner"></div>
            <p>Chargement des intégrations énergétiques...</p>
        </div>
    `;

    try {
        console.log('[loadIntegrations] Appel API /api/home_suivi_elec/get_sensors');
        const sensorsData = await fetchViaProxy('/api/home_suivi_elec/get_sensors');

        console.log('[loadIntegrations] Réponse reçue:', {
            error: sensorsData.error,
            hasSelected: !!sensorsData.selected,
            hasAlternatives: !!sensorsData.alternatives
        });

        if (sensorsData.error) {
            throw new Error(sensorsData.message || 'Erreur lors du chargement des capteurs');
        }

        const integrationsData = transformSensorsToIntegrations(sensorsData);
        cachedIntegrationsData = integrationsData;

        renderEnergyIntegrationsData(container, integrationsData);
        console.log('✅ [loadIntegrations] Interface rendue avec', integrationsData.integrations.length, 'intégrations');

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

    console.log('[transform] Données d\'entrée:', {
        selectedKeys: Object.keys(selected),
        alternativesKeys: Object.keys(alternatives)
    });

    // Traiter les capteurs sélectionnés
    for (const [integration, sensors] of Object.entries(selected)) {
        const friendlyName = getFriendlyIntegrationName(integration);
        const key = integration.toLowerCase();

        integrations[key] = {
            domain: integration,
            friendly_name: friendlyName,
            display_name: friendlyName, // Nom lisible unique
            status: 'Sélectionnée',
            health_state: 'selected',
            selected_count: sensors.length,
            alternative_count: 0,
            total_sensors: sensors.length,
            sensors_details: sensors.map(sensor => ({
                ...sensor,
                status: 'selected',
                friendly_name: sensor.friendly_name || sensor.nom || sensor.entity_id
            }))
        };
    }

    // Traiter les alternatives
    for (const [integration, sensors] of Object.entries(alternatives)) {
        const friendlyName = getFriendlyIntegrationName(integration);
        const key = integration.toLowerCase();

        if (!integrations[key]) {
            integrations[key] = {
                domain: integration,
                friendly_name: friendlyName,
                display_name: friendlyName,
                status: 'Disponible',
                health_state: 'available', 
                selected_count: 0,
                alternative_count: sensors.length,
                total_sensors: sensors.length,
                sensors_details: sensors.map(sensor => ({
                    ...sensor,
                    status: 'alternative',
                    friendly_name: sensor.friendly_name || sensor.nom || sensor.entity_id
                }))
            };
        } else {
            // Intégration déjà présente, ajouter les alternatives
            integrations[key].alternative_count = sensors.length;
            integrations[key].total_sensors += sensors.length;
            integrations[key].sensors_details.push(...sensors.map(sensor => ({
                ...sensor,
                status: 'alternative',
                friendly_name: sensor.friendly_name || sensor.nom || sensor.entity_id
            })));
        }
    }

    // Recalculer les statuts
    for (const integration of Object.values(integrations)) {
        if (integration.selected_count > 0) {
            integration.health_state = 'selected';
            integration.status = `✅ ${integration.selected_count} sélectionné${integration.selected_count > 1 ? 's' : ''}`;
        } else if (integration.alternative_count > 0) {
            integration.health_state = 'available';
            integration.status = `📋 ${integration.alternative_count} disponible${integration.alternative_count > 1 ? 's' : ''}`;
        }
    }

    const result = {
        integrations: Object.values(integrations),
        summary: {
            total: Object.keys(integrations).length,
            selected: Object.values(integrations).filter(i => i.selected_count > 0).length,
            available: Object.values(integrations).filter(i => i.selected_count === 0 && i.alternative_count > 0).length
        }
    };

    console.log('[transform] Résultat final:', result);
    return result;
}

/**
 * Obtient un nom lisible pour l'intégration (sans doublons)
 */
function getFriendlyIntegrationName(integration) {
    const friendlyNames = {
        'tapo': 'TP-Link Tapo',
        'tplink': 'TP-Link Kasa',  
        'powercalc': 'PowerCalc',
        'shelly': 'Shelly',
        'zigbee2mqtt': 'Zigbee2MQTT',
        'zha': 'Zigbee Home Automation',
        'esphome': 'ESPHome',
        'hue': 'Philips Hue',
        'sonoff': 'Sonoff',
        'tuya': 'Tuya',
        'homekit_controller': 'HomeKit',
        'utility_meter': 'Compteur Utilitaire',
        'template': 'Template',
        'mqtt': 'MQTT',
        'local_file': 'Fichier Local',
        'min_max': 'Min/Max Helper',
        'integration': 'Intégration Générique'
    };

    const key = integration.toLowerCase();
    return friendlyNames[key] || integration.charAt(0).toUpperCase() + integration.slice(1);
}

/**
 * Rendu optimisé des intégrations énergétiques (sans doublons)
 */
function renderEnergyIntegrationsData(container, data) {
    const { integrations, summary } = data;

    if (!integrations || integrations.length === 0) {
        container.innerHTML = `
            <div class="no-data-placeholder">
                <h3>📊 Aucune intégration énergétique trouvée</h3>
                <p>Aucune intégration énergétique détectée. Vérifiez votre configuration.</p>
                <button onclick="window.location.reload()" class="retry-btn">🔄 Actualiser</button>
            </div>
        `;
        return;
    }

    const sortedIntegrations = [...integrations].sort((a, b) => {
        const priority = { selected: 3, available: 2, empty: 1 };
        const aPriority = priority[a.health_state] || 0;
        const bPriority = priority[b.health_state] || 0;

        if (aPriority !== bPriority) {
            return bPriority - aPriority;
        }

        return a.display_name.localeCompare(b.display_name);
    });

    // ✅ VERSION AJUSTÉE: 3 cartes, tailles réduites, pas de doublons
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
                                    <strong>${integration.display_name}</strong>
                                </td>
                                <td>
                                    <span class="status-badge ${integration.health_state}">
                                        ${integration.status}
                                    </span>
                                </td>
                                <td class="text-center">
                                    <span class="selected-count ${integration.selected_count > 0 ? 'has-selected' : ''}">${integration.selected_count}</span>
                                </td>
                                <td class="text-center">
                                    <span class="available-count ${integration.alternative_count > 0 ? 'has-available' : ''}">${integration.alternative_count}</span>
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

/**
 * Affiche les détails d'une intégration
 */
function showIntegrationDetails(domain) {
    if (!cachedIntegrationsData) {
        toast.show('❌ Aucune donnée disponible', { type: 'error' });
        return;
    }

    const integration = cachedIntegrationsData.integrations.find(i => i.domain === domain);
    if (!integration) {
        toast.show(`❌ Intégration ${domain} non trouvée`, { type: 'error' });
        return;
    }

    const sensors = integration.sensors_details || [];

    // Créer la modal
    const modal = document.createElement('div');
    modal.className = 'integration-details-modal';
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeIntegrationDetails()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>🔧 ${integration.display_name}</h3>
                <button class="modal-close" onclick="closeIntegrationDetails()">×</button>
            </div>
            <div class="modal-body">
                <div class="integration-summary">
                    <div class="summary-item">
                        <span class="label">État:</span>
                        <span class="value status-badge ${integration.health_state}">${integration.status}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Sélectionnés:</span>
                        <span class="value">${integration.selected_count}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Disponibles:</span>
                        <span class="value">${integration.alternative_count}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Total:</span>
                        <span class="value">${integration.total_sensors}</span>
                    </div>
                </div>

                <h4>📋 Capteurs (${sensors.length})</h4>
                <div class="sensors-list">
                    ${sensors.map(sensor => `
                        <div class="sensor-item ${sensor.status}">
                            <div class="sensor-info">
                                <strong>${sensor.friendly_name || sensor.nom || sensor.entity_id}</strong>
                                <small>${sensor.entity_id}</small>
                            </div>
                            <div class="sensor-status">
                                <span class="status-badge ${sensor.status}">
                                    ${sensor.status === 'selected' ? '✅ Sélectionné' : '📋 Disponible'}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

/**
 * Ferme la modal de détails
 */
function closeIntegrationDetails() {
    const modal = document.querySelector('.integration-details-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// Fonctions globales
window.showIntegrationDetails = showIntegrationDetails;
window.closeIntegrationDetails = closeIntegrationDetails;
