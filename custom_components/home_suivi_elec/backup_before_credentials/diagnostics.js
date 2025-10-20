// diagnostics.js — Onglet Diagnostic technique

// ✅ Export de la fonction principale
export async function loadDiagnostics() {
    try {
        const resp = await fetch("/api/home_suivi_elec/get_diagnostics");
        if (!resp.ok) throw new Error("Erreur HTTP " + resp.status);
        const data = await resp.json();

        renderGlobalStatus(data);
        renderSourcesTable(data.sources);
        renderIntegrationSensorsTable(data.integration_sensors);
        renderUtilityMetersTable(data.utility_meters);
        renderAlerts(data.alerts);
    } catch (err) {
        const panel = document.getElementById("diagnosticsPanel");
        if (panel) {
            panel.innerHTML = `<div class="card" style="color:darkred;">❌ Erreur chargement diagnostic: ${err.message}</div>`;
        }
        console.error(err);
    }
}

function renderGlobalStatus(data) {
    const stat = data.global_status;
    let color = "#24a745", icon = "✅", message = "Tout est opérationnel";
    if (stat === "warning") { 
        color = "#e6b700"; 
        icon = "⚠️"; 
        message = "Attention : des problèmes mineurs détectés";
    }
    if (stat === "error") { 
        color = "#b40020"; 
        icon = "❌"; 
        message = "Erreurs critiques détectées";
    }
    
    let html = `
        <div class="card" style="background:${color};color:#fff;padding:20px;">
            <h3 style="margin-top:0;">${icon} ${message}</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:15px;">
                <div>
                    <p style="margin:5px 0;"><b>Capteurs sources:</b> ${data.stats.sources_ok} / ${data.stats.sources_total} opérationnels</p>
                    <p style="margin:5px 0;"><b>Sensors d'intégration:</b> ${data.stats.integration_sensors_ok} / ${data.stats.integration_sensors_total} OK</p>
                </div>
                <div>
                    <p style="margin:5px 0;"><b>Utility Meters:</b> ${data.stats.utility_meters_ok} / ${data.stats.utility_meters_total} OK</p>
                    <p style="margin:5px 0;"><b>Dernière génération YAML:</b> ${data.last_yaml_generation ? (new Date(data.last_yaml_generation).toLocaleString('fr-FR')) : "Aucune"}</p>
                </div>
            </div>
        </div>
    `;
    const elem = document.getElementById("diagnosticsGlobal");
    if (elem) elem.innerHTML = html;
}

function renderSourcesTable(list) {
    const elem = document.getElementById("diagnosticsSources");
    if (!elem) return;
    
    if (!list || list.length === 0) {
        elem.innerHTML = `<div class="card">Aucun capteur source sélectionné.</div>`;
        return;
    }
    
    let html = `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
            <tr style="background:#f2f2f2;">
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Entity ID</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Nom</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center;">État</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center;">Unité</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center;">Statut</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center;">Type</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Action</th>
            </tr>
        </thead>
        <tbody>`;
    
    for (const s of list) {
        const rowColor = s.status.includes("❌") ? "#ffe6e6" : 
                        s.status.includes("⚠️") ? "#fff4e5" : "#fff";
        html += `<tr style="background:${rowColor};">
            <td style="padding:8px;border:1px solid #ddd;font-family:monospace;font-size:0.9em;">${s.entity_id}</td>
            <td style="padding:8px;border:1px solid #ddd;">${s.friendly_name}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:600;">${s.state}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${s.unit}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${s.status}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${s.data_type}</td>
            <td style="padding:8px;border:1px solid #ddd;">${s.action}</td>
        </tr>`;
    }
    html += "</tbody></table>";
    elem.innerHTML = html;
}

function renderIntegrationSensorsTable(list) {
    const elem = document.getElementById("diagnosticsIntegrationSensors");
    if (!elem) return;
    
    if (!list || list.length === 0) {
        elem.innerHTML = `<div class="card">Aucun sensor d'intégration généré (tous les capteurs sont déjà en énergie).</div>`;
        return;
    }
    
    let html = `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
            <tr style="background:#f2f2f2;">
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Entity ID</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Source</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center;">État</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center;">Unité</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center;">Statut</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Raison</th>
            </tr>
        </thead>
        <tbody>`;
    
    for (const s of list) {
        const rowColor = s.status.includes("❌") ? "#ffe6e6" : 
                        s.status.includes("⚠️") ? "#fff4e5" : "#fff";
        html += `<tr style="background:${rowColor};">
            <td style="padding:8px;border:1px solid #ddd;font-family:monospace;font-size:0.9em;">${s.entity_id}</td>
            <td style="padding:8px;border:1px solid #ddd;font-family:monospace;font-size:0.9em;">${s.source}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:600;">${s.state}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${s.unit}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${s.status}</td>
            <td style="padding:8px;border:1px solid #ddd;">${s.reason}</td>
        </tr>`;
    }
    html += "</tbody></table>";
    elem.innerHTML = html;
}

function renderUtilityMetersTable(list) {
    const elem = document.getElementById("diagnosticsUtilityMeters");
    if (!elem) return;
    
    if (!list || list.length === 0) {
        elem.innerHTML = `<div class="card">Aucun Utility Meter généré.</div>`;
        return;
    }
    
    let html = `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
            <tr style="background:#f2f2f2;">
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Entity ID</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center;">Cycle</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Source</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center;">État</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center;">Unité</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center;">Statut</th>
            </tr>
        </thead>
        <tbody>`;
    
    for (const m of list) {
        const rowColor = m.status.includes("❌") ? "#ffe6e6" : 
                        m.status.includes("⚠️") ? "#fff4e5" : "#fff";
        html += `<tr style="background:${rowColor};">
            <td style="padding:8px;border:1px solid #ddd;font-family:monospace;font-size:0.9em;">${m.entity_id}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:600;">${m.cycle}</td>
            <td style="padding:8px;border:1px solid #ddd;font-family:monospace;font-size:0.9em;">${m.source}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:600;">${m.state}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${m.unit}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${m.status}</td>
        </tr>`;
    }
    html += "</tbody></table>";
    elem.innerHTML = html;
}

function renderAlerts(list) {
    const elem = document.getElementById("diagnosticsAlerts");
    if (!elem) return;
    
    if (!list || list.length === 0) {
        elem.innerHTML = `<div class="card" style="background:#e8f5e9;color:#2e7d32;padding:15px;">
            ✅ Aucune alerte détectée. Tous les capteurs fonctionnent correctement.
        </div>`;
        return;
    }
    
    let html = `<div class="card" style="background:#fff3cd;border-left:4px solid #e6b700;padding:15px;">
        <h4 style="margin-top:0;color:#856404;">⚠️ Alertes détectées (${list.length})</h4>
        <ul style="margin:10px 0;padding-left:20px;">`;
    
    for (const a of list) {
        const icon = a.type === "error" ? "❌" : "⚠️";
        html += `<li style="margin:8px 0;">
            ${icon} <b style="font-family:monospace;">${a.entity_id}</b> : ${a.message}
        </li>`;
    }
    html += `</ul></div>`;
    elem.innerHTML = html;
}

// Gestion du bouton rafraîchir
document.addEventListener("DOMContentLoaded", () => {
    const refreshBtn = document.getElementById("refreshDiagnostics");
    if (refreshBtn) {
        refreshBtn.onclick = () => loadDiagnostics();
    }
});

