// diagnostic_modules/logs.js
// Module pour l'onglet "Logs Système" des diagnostics - Version corrigée

"use strict";

import { fetchViaProxy } from "/local/community/home_suivi_elec_ui/js/shared/proxy.js";
import { toast } from "/local/community/home_suivi_elec_ui/js/shared/uiToast.js";

console.info("[logs] Module logs système chargé - Version corrigée");

// Configuration des logs
const LOGS_CONFIG = {
    DEFAULT_LIMIT: 100,
    PAGE_SIZES: [25, 50, 100, 200],
    AUTO_REFRESH_INTERVALS: {
        'off': null,
        '30s': 30000,
        '1min': 60000,
        '5min': 300000
    },
    ERROR_PATTERN_THRESHOLD: 3,
    ERROR_RATE_THRESHOLD: 10
};

// Cache et filtres
let cachedLogsData = null;
let currentFilters = {
    search: '',
    level: 'all',
    module: 'all',
    period: 'all'
};
let autoRefreshTimer = null;

/**
 * Point d'entrée principal pour l'onglet logs
 */
export async function loadSystemLogs(container) {
    if (!container) {
        console.error('❌ [loadSystemLogs] Container requis');
        return;
    }

    console.log('[logs] Début chargement logs système');

    container.innerHTML = `
        <div class="loading-placeholder">
            <div class="spinner"></div>
            <p>Chargement des logs système...</p>
        </div>
    `;

    try {
        // ✅ CORRIGER: Utiliser la structure de réponse cohérente
        console.log('[logs] Appel API /api/home_suivi_elec/get_logs');
        const logsResponse = await fetchViaProxy('/api/home_suivi_elec/get_logs?limit=100');

        console.log('[logs] Réponse logs API:', {
            error: logsResponse.error,
            hasData: !!logsResponse.data,
            dataType: typeof logsResponse.data
        });

        // ✅ CORRIGER: Structure de réponse {error: false, data: ...}
        if (logsResponse.error) {
            throw new Error(logsResponse.message || 'Logs indisponibles');
        }

        // Adapter selon le format de réponse réel
        const logsData = logsResponse.data || logsResponse.logs || [];
        cachedLogsData = Array.isArray(logsData) ? logsData : [];

        console.log('[logs] Logs chargés:', cachedLogsData.length);

        const errorPatterns = analyzeErrorPatterns(cachedLogsData);
        container.innerHTML = renderLogsInterface(cachedLogsData, errorPatterns);
        initLogsInteractions();

        console.log('✅ [loadSystemLogs] Interface logs rendue');

    } catch (error) {
        console.error('❌ [loadSystemLogs] Erreur:', error);

        // Interface d'erreur avec fallback console
        container.innerHTML = `
            <div class="error-placeholder">
                <h3>❌ Erreur de chargement des logs</h3>
                <p><strong>Endpoint:</strong> /api/home_suivi_elec/get_logs</p>
                <p><strong>Erreur:</strong> ${error.message}</p>

                <div class="error-actions">
                    <button onclick="window.showDiagTab('logs')" class="retry-btn">
                        🔄 Réessayer
                    </button>
                    <button onclick="loadConsoleFallback(document.getElementById('logs-content'))" class="console-btn">
                        🖥️ Console Browser
                    </button>
                </div>

                <details style="margin-top: 16px;">
                    <summary>🔍 Informations de debug</summary>
                    <div class="debug-info">
                        <p><strong>Méthode:</strong> fetchViaProxy</p>
                        <p><strong>URL:</strong> /api/home_suivi_elec/get_logs</p>
                        <p><strong>Stack:</strong></p>
                        <pre>${error.stack || 'Pas de stack trace'}</pre>
                    </div>
                </details>

                <div class="fallback-note">
                    <h4>💡 Alternative</h4>
                    <p>En cas de problème persistant, ouvrez <strong>F12 → Console</strong> pour voir les logs en temps réel.</p>
                </div>
            </div>
        `;
    }
}

/**
 * Rendu de l'interface logs avec filtres et tableau
 */
function renderLogsInterface(logs, errorPatterns) {
    const filteredLogs = applyFilters(logs);
    const totalCount = logs.length;
    const filteredCount = filteredLogs.length;
    const errorCount = logs.filter(log => log.level === 'ERROR' || log.level === 'error').length;
    const warningCount = logs.filter(log => log.level === 'WARNING' || log.level === 'warning').length;

    return `
        <div class="logs-overview">
            <!-- Cartes résumé -->
            <div class="summary-cards">
                <div class="summary-card total">
                    <div class="card-icon">📊</div>
                    <div class="card-info">
                        <h3>${totalCount}</h3>
                        <p>Total logs</p>
                    </div>
                </div>
                <div class="summary-card error">
                    <div class="card-icon">🔴</div>
                    <div class="card-info">
                        <h3>${errorCount}</h3>
                        <p>Erreurs</p>
                    </div>
                </div>
                <div class="summary-card warning">
                    <div class="card-icon">🟡</div>
                    <div class="card-info">
                        <h3>${warningCount}</h3>
                        <p>Avertissements</p>
                    </div>
                </div>
            </div>

            <!-- Filtres -->
            <div class="logs-filters">
                <div class="filter-group">
                    <label for="logs-search">🔍 Recherche:</label>
                    <input type="text" id="logs-search" placeholder="Filtrer les logs..." value="${currentFilters.search}">
                </div>
                <div class="filter-group">
                    <label for="logs-level">📊 Niveau:</label>
                    <select id="logs-level">
                        <option value="all">Tous niveaux</option>
                        <option value="ERROR">Erreurs seulement</option>
                        <option value="WARNING">Avertissements</option>
                        <option value="INFO">Informations</option>
                        <option value="DEBUG">Debug</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="logs-module">🔧 Module:</label>
                    <select id="logs-module">
                        <option value="all">Tous modules</option>
                        ${getUniqueModules(logs).map(module => 
                            `<option value="${module}">${module}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <button id="clear-filters-btn" class="clear-btn">🗑️ Effacer filtres</button>
                    <button id="refresh-logs-btn" class="refresh-btn">🔄 Actualiser</button>
                </div>
            </div>

            <!-- Patterns d'erreur -->
            ${errorPatterns.length > 0 ? `
                <div class="error-patterns">
                    <h4>⚠️ Patterns d'erreur détectés (${errorPatterns.length})</h4>
                    <div class="patterns-list">
                        ${errorPatterns.map(pattern => `
                            <div class="pattern-item">
                                <span class="pattern-count">${pattern.count}x</span>
                                <span class="pattern-message">${pattern.message}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Tableau des logs -->
            <div class="logs-table-container">
                <div class="logs-header">
                    <h4>📋 Logs système (${filteredCount}/${totalCount})</h4>
                </div>
                <div class="logs-table-wrapper">
                    <table class="logs-table">
                        <thead>
                            <tr>
                                <th>🕒 Timestamp</th>
                                <th>📊 Niveau</th>
                                <th>🔧 Module</th>
                                <th>💬 Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredLogs.slice(0, 100).map(log => `
                                <tr class="log-row ${(log.level || '').toLowerCase()}">
                                    <td class="log-timestamp">${formatLogTimestamp(log.timestamp || log.time)}</td>
                                    <td class="log-level">
                                        <span class="level-badge ${(log.level || '').toLowerCase()}">
                                            ${getLevelIcon(log.level)} ${log.level || 'INFO'}
                                        </span>
                                    </td>
                                    <td class="log-module">${log.module || log.source || 'system'}</td>
                                    <td class="log-message">${escapeHtml(log.message || log.msg || '')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

/**
 * Analyse les patterns d'erreur
 */
function analyzeErrorPatterns(logs) {
    const errorLogs = logs.filter(log => (log.level || '').toUpperCase() === 'ERROR');
    const patterns = {};

    for (const log of errorLogs) {
        const message = log.message || log.msg || '';
        // Simplifier le message pour détecter les patterns
        const pattern = message.replace(/\d+/g, 'N').replace(/[0-9a-f-]{8,}/g, 'ID').substring(0, 100);

        if (patterns[pattern]) {
            patterns[pattern].count++;
            patterns[pattern].lastSeen = log.timestamp || log.time;
        } else {
            patterns[pattern] = {
                message: pattern,
                count: 1,
                firstSeen: log.timestamp || log.time,
                lastSeen: log.timestamp || log.time
            };
        }
    }

    // Retourner les patterns avec plus de 3 occurrences
    return Object.values(patterns)
        .filter(p => p.count >= LOGS_CONFIG.ERROR_PATTERN_THRESHOLD)
        .sort((a, b) => b.count - a.count);
}

/**
 * Applique les filtres aux logs
 */
function applyFilters(logs) {
    return logs.filter(log => {
        // Filtre de recherche
        if (currentFilters.search) {
            const search = currentFilters.search.toLowerCase();
            const message = (log.message || log.msg || '').toLowerCase();
            const module = (log.module || log.source || '').toLowerCase();
            if (!message.includes(search) && !module.includes(search)) {
                return false;
            }
        }

        // Filtre de niveau
        if (currentFilters.level !== 'all') {
            if ((log.level || '').toUpperCase() !== currentFilters.level) {
                return false;
            }
        }

        // Filtre de module
        if (currentFilters.module !== 'all') {
            if ((log.module || log.source || '') !== currentFilters.module) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Initialise les interactions (filtres, refresh, etc.)
 */
function initLogsInteractions() {
    // Filtre de recherche
    const searchInput = document.getElementById('logs-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilters.search = e.target.value;
            refreshLogsDisplay();
        });
    }

    // Filtres select
    ['logs-level', 'logs-module'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.addEventListener('change', (e) => {
                const filterKey = id.replace('logs-', '');
                currentFilters[filterKey] = e.target.value;
                refreshLogsDisplay();
            });
        }
    });

    // Boutons
    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            currentFilters = { search: '', level: 'all', module: 'all', period: 'all' };
            document.getElementById('logs-search').value = '';
            document.getElementById('logs-level').value = 'all';
            document.getElementById('logs-module').value = 'all';
            refreshLogsDisplay();
        });
    }

    const refreshBtn = document.getElementById('refresh-logs-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const container = document.getElementById('logs-content');
            if (container) {
                loadSystemLogs(container);
            }
        });
    }
}

/**
 * Actualise l'affichage des logs avec les filtres actuels
 */
function refreshLogsDisplay() {
    if (!cachedLogsData) return;

    const container = document.getElementById('logs-content');
    if (!container) return;

    const errorPatterns = analyzeErrorPatterns(cachedLogsData);
    container.innerHTML = renderLogsInterface(cachedLogsData, errorPatterns);
    initLogsInteractions();
}

/**
 * Obtient les modules uniques des logs
 */
function getUniqueModules(logs) {
    const modules = new Set();
    for (const log of logs) {
        const module = log.module || log.source || 'system';
        modules.add(module);
    }
    return Array.from(modules).sort();
}

/**
 * Formate le timestamp
 */
function formatLogTimestamp(timestamp) {
    if (!timestamp) return 'N/A';

    try {
        const date = new Date(timestamp);
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (e) {
        return timestamp;
    }
}

/**
 * Obtient l'icône pour le niveau de log
 */
function getLevelIcon(level) {
    switch ((level || '').toUpperCase()) {
        case 'ERROR': return '🔴';
        case 'WARNING': return '🟡';
        case 'INFO': return '🔵';
        case 'DEBUG': return '🟢';
        default: return '⚪';
    }
}

/**
 * Échappe le HTML pour éviter l'injection
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Fallback avec console du navigateur si l'API ne marche pas
 */
window.loadConsoleFallback = function(container) {
    container.innerHTML = `
        <div class="console-fallback">
            <h3>🖥️ Console Browser (Fallback)</h3>
            <div class="console-instructions">
                <p>L'API de logs n'est pas disponible. Utilisez la console du navigateur :</p>
                <ol>
                    <li>Ouvrez <strong>F12</strong> ou <strong>Ctrl+Shift+I</strong></li>
                    <li>Cliquez sur l'onglet <strong>"Console"</strong></li>
                    <li>Les logs de votre application y apparaîtront en temps réel</li>
                </ol>

                <div class="console-tips">
                    <h4>💡 Filtres console utiles:</h4>
                    <ul>
                        <li><code>home_suivi_elec</code> - Filtrer vos logs</li>
                        <li><code>error</code> - Voir seulement les erreurs</li>
                        <li><code>warning</code> - Voir les avertissements</li>
                    </ul>
                </div>
            </div>

            <button onclick="window.showDiagTab('logs')" class="retry-btn">
                🔄 Réessayer l'API
            </button>
        </div>
    `;
};
