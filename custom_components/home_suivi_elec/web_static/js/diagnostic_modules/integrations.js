// diagnostic_modules/integrations.js
// Module intégrations ÉNERGÉTIQUES - Version complète et lisible

"use strict";

import { fetchViaProxy } from "/local/community/home_suivi_elec_ui/js/shared/proxy.js";
import { toast } from "/local/community/home_suivi_elec_ui/js/shared/uiToast.js";

console.info("[integrations] Module intégrations ÉNERGÉTIQUES chargé - Version complète");

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

        console.log('[loadIntegrations] Réponse get_sensors complète:', sensorsData);

        if (sensorsData.error) {
            throw new Error(sensorsData.message || 'Erreur lors du chargement des capteurs');
        }

        // ✅ TRANSFORMATION des données capteurs en intégrations énergétiques
        const integrationsData = transformSensorsToIntegrations(sensorsData);
        console.log('[loadIntegrations] Intégrations énergétiques extraites:', integrationsData);

        // Cache pour les détails
        cachedIntegrationsData = integrationsData;

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
 * Transforme les données capteurs en intégrations énergétiques avec noms lisibles
 */
function transformSensorsToIntegrations(sensorsData) {
    const integrations = {};

    // Debug des données reçues
    console.log('[transformSensorsToIntegrations] Données reçues:', {
        hasSelected: !!sensorsData.selected,
        selectedKeys: sensorsData.selected ? Object.keys(sensorsData.selected) : [],
        hasAlternatives: !!sensorsData.alternatives,
        alternativesKeys: sensorsData.alternatives ? Object.keys(sensorsData.alternatives) : []
    });

    const { selected = {}, alternatives = {}, detected = {} } = sensorsData;

    // Traiter les capteurs sélectionnés
    for (const [integration, sensors] of Object.entries(selected)) {
        console.log(`[transform] Traitement intégration sélectionnée: ${integration} avec ${sensors.length} capteurs`);

        const friendlyName = getFriendlyIntegrationName(integration);
        const integrationKey = integration.toLowerCase();

        if (!integrations[integrationKey]) {
            integrations[integrationKey] = {
                domain: integration,
                friendly_name: friendlyName,
                display_name: friendlyName,
                status: 'Sélectionnée',
                health_state: 'selected',
                selected_count: 0,
                alternative_count: 0,
                total_sensors: 0,
                sensors_details: [],
                last_updated: new Date().toISOString()
            };
        }

        integrations[integrationKey].selected_count = sensors.length;
        integrations[integrationKey].total_sensors += sensors.length;

        // Ajouter détails des capteurs avec informations lisibles
        for (const sensor of sensors) {
            integrations[integrationKey].sensors_details.push({
                ...sensor,
                status: 'selected',
                friendly_name: sensor.friendly_name || sensor.nom || sensor.entity_id,
                integration: friendlyName
            });
        }
    }

    // Traiter les alternatives
    for (const [integration, sensors] of Object.entries(alternatives)) {
        console.log(`[transform] Traitement intégration alternative: ${integration} avec ${sensors.length} capteurs`);

        const friendlyName = getFriendlyIntegrationName(integration);
        const integrationKey = integration.toLowerCase();

        if (!integrations[integrationKey]) {
            integrations[integrationKey] = {
                domain: integration,  
                friendly_name: friendlyName,
                display_name: friendlyName,
                status: 'Disponible',
                health_state: 'available',
                selected_count: 0,
                alternative_count: 0,
                total_sensors: 0,
                sensors_details: [],
                last_updated: new Date().toISOString()
            };
        }

        integrations[integrationKey].alternative_count = sensors.length;
        integrations[integrationKey].total_sensors += sensors.length;

        // Ajouter détails des capteurs
        for (const sensor of sensors) {
            integrations[integrationKey].sensors_details.push({
                ...sensor,
                status: 'alternative',
                friendly_name: sensor.friendly_name || sensor.nom || sensor.entity_id,
                integration: friendlyName
            });
        }
    }

    // Calculer les états de santé finaux
    for (const [key, integration] of Object.entries(integrations)) {
        if (integration.selected_count > 0) {
            integration.health_state = 'selected';
            integration.status = `✅ ${integration.selected_count} sélectionné${integration.selected_count > 1 ? 's' : ''}`;
        } else if (integration.alternative_count > 0) {
            integration.health_state = 'available';
            integration.status = `📋 ${integration.alternative_count} disponible${integration.alternative_count > 1 ? 's' : ''}`;
        } else {
            integration.health_state = 'empty';
            integration.status = '⚪ Aucun capteur';
        }

        console.log(`[transform] Intégration ${key} finalisée:`, {
            name: integration.display_name,
            selected: integration.selected_count,
            alternatives: integration.alternative_count,
            status: integration.status
        });
    }

    const finalData = {
        integrations: Object.values(integrations),
        summary: {
            total: Object.keys(integrations).length,
            selected: Object.values(integrations).filter(i => i.selected_count > 0).length,
            available: Object.values(integrations).filter(i => i.selected_count === 0 && i.alternative_count > 0).length,
            empty: Object.values(integrations).filter(i => i.total_sensors === 0).length
        }
    };

    console.log('[transformSensorsToIntegrations] Données finales:', finalData);
    return finalData;
}

/**
 * Obtient un nom lisible pour l'intégration
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
        'integration': 'Intégration Générique'
    };

    const key = integration.toLowerCase();
    return friendlyNames[key] || integration.charAt(0).toUpperCase() + integration.slice(1);
}

/**
 * Rendu amélioré des intégrations énergétiques
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

    // Trier par importance : sélectionnées > disponibles > vides
    const sortedIntegrations = [...integrations].sort((a, b) => {
        const priority = { selected: 3, available: 2, empty: 1 };
        const aPriority = priority[a.health_state] || 0;
        const bPriority = priority[b.health_state] || 0;

        if (aPriority !== bPriority) {
            return bPriority - aPriority;
        }

        // Si même priorité, trier par nom
        return a.display_name.localeCompare(b.display_name);
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
                            <tr class="integration-row ${integration.health_state}" data-integration="${integration.domain}">
                                <td class="integration-name">
                                    <div class="integration-info">
                                        <strong>${integration.display_name}</strong>
                                        <small class="domain-name">${integration.domain}</small>
                                    </div>
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
                                    <button class="view-details-btn" onclick="showIntegrationDetails('${integration.domain}')" ${integration.total_sensors === 0 ? 'disabled' : ''}>
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
    console.log('✅ Interface intégrations énergétiques rendue avec', sortedIntegrations.length, 'intégrations');
}

/**
 * Affiche les détails d'une intégration avec liste des capteurs
 */
function showIntegrationDetails(domain) {
    console.log(`[showIntegrationDetails] Affichage détails pour: ${domain}`);

    if (!cachedIntegrationsData || !cachedIntegrationsData.integrations) {
        toast.show('❌ Aucune donnée disponible', { type: 'error' });
        return;
    }

    const integration = cachedIntegrationsData.integrations.find(i => i.domain === domain);
    if (!integration) {
        toast.show(`❌ Intégration ${domain} non trouvée`, { type: 'error' });
        return;
    }

    const sensors = integration.sensors_details || [];
    if (sensors.length === 0) {
        toast.show(`ℹ️ Aucun capteur trouvé pour ${integration.display_name}`, { type: 'info' });
        return;
    }

    // Créer la modal avec détails
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
                        <span class="label">Domain:</span>
                        <span class="value">${integration.domain}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Total capteurs:</span>
                        <span class="value">${sensors.length}</span>
                    </div>
                </div>

                <h4>📋 Liste des capteurs</h4>
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

    // Animation d'apparition
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
