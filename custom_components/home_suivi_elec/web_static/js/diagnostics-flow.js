/**
 * diagnostics-flow.js - Diagramme flux système interactif
 * Visualisation architecture backend: Détection → Sélection → Scoring → Tracking → APIs
 */

// 📈 CHARGEMENT DIAGRAMME FLUX
export async function loadDiagnosticFlow() {
  console.log('📈 Génération diagramme flux système...');
  
  try {
    // Génération diagramme textuel (en attendant Mermaid)
    const flowDiagram = generateSystemFlowDiagram();
    renderFlowDiagram(flowDiagram);
    
    console.log('📈 Diagramme flux affiché');
    
    // TODO: Intégration Mermaid pour diagrammes interactifs
    // loadMermaidDiagram();
    
  } catch (error) {
    console.error('❌ Erreur génération flux:', error);
    showFlowError(`Erreur diagramme: ${error.message}`);
  }
}

// 📊 GÉNÉRATION DIAGRAMME TEXTUEL
function generateSystemFlowDiagram() {
  const flowSteps = [
    {
      step: 1,
      module: 'detect_local.py',
      title: '🔍 Détection Capteurs',
      description: 'Scan automatique intégrations HA',
      outputs: ['capteurs_power.json'],
      status: 'operational'
    },
    {
      step: 2, 
      module: 'sensor_quality_scorer.py',
      title: '⭐ Scoring Qualité',
      description: 'Calcul scores fiabilité/priorité',
      inputs: ['capteurs_power.json'],
      outputs: ['scores calculés'],
      status: 'operational'
    },
    {
      step: 3,
      module: 'manage_selection.py', 
      title: '🎯 Sélection & Mapping',
      description: 'Fusion sélection utilisateur + auto',
      inputs: ['capteurs_power.json', 'capteurs_selection.json'],
      outputs: ['mapping final'],
      status: 'operational'
    },
    {
      step: 4,
      module: 'energy_tracking.py',
      title: '📈 Tracking Énergie', 
      description: 'Création sensors HSE (45 cycles)',
      inputs: ['mapping final'],
      outputs: ['sensor.hse_*_{cycle}'],
      status: 'operational'
    },
    {
      step: 5,
      module: 'sensor.py',
      title: '📊 Enregistrement HA',
      description: 'Ajout entités dans Home Assistant',
      inputs: ['sensors HSE'],
      outputs: ['45 entités actives'],
      status: 'operational'
    },
    {
      step: 6,
      module: 'proxy_api.py',
      title: '🌐 APIs Unifiées',
      description: 'Exposition données frontend',
      inputs: ['entités HA', 'configurations'],
      outputs: ['/sensors', '/data', '/diagnostics'],
      status: 'operational'
    }
  ];
  
  return flowSteps;
}

// 💁 RENDU DIAGRAMME FLUX
function renderFlowDiagram(flowSteps) {
  const container = document.getElementById('flowDiagram');
  if (!container) return;
  
  let html = `
    <div style="padding: 20px;">
      <h4 style="text-align: center; margin-bottom: 30px; color: #0078d4;">
        📈 Architecture Backend Home Suivi Élec
      </h4>
      
      <div style="position: relative;">
  `;
  
  flowSteps.forEach((step, index) => {
    const isLast = index === flowSteps.length - 1;
    const statusIcon = getFlowStepIcon(step.status);
    const statusColor = getFlowStepColor(step.status);
    
    html += `
      <div style="
        display: flex;
        align-items: center;
        margin-bottom: ${isLast ? '0' : '20px'};
        position: relative;
      ">
        <!-- Numéro étape -->
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${statusColor};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        ">
          ${step.step}
        </div>
        
        <!-- Contenu étape -->
        <div style="
          flex: 1;
          margin-left: 20px;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <h5 style="margin: 0; color: #333; font-size: 16px;">
              ${step.title}
            </h5>
            <span style="
              background: ${statusColor};
              color: white;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 500;
            ">
              ${statusIcon} ${step.status.toUpperCase()}
            </span>
          </div>
          
          <div style="font-size: 13px; color: #666; margin-bottom: 10px;">
            💻 <strong>${step.module}</strong>
          </div>
          
          <div style="color: #333; margin-bottom: 10px;">
            ${step.description}
          </div>
          
          <div style="display: flex; gap: 20px; font-size: 12px;">
            ${step.inputs ? `
              <div>
                <strong style="color: #dc3545;">⬅️ Inputs:</strong>
                <ul style="margin: 2px 0 0 15px; padding: 0;">
                  ${step.inputs.map(input => `<li>${input}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${step.outputs ? `
              <div>
                <strong style="color: #28a745;">➡️ Outputs:</strong>
                <ul style="margin: 2px 0 0 15px; padding: 0;">
                  ${step.outputs.map(output => `<li>${output}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    // Flèche vers étape suivante
    if (!isLast) {
      html += `
        <div style="
          position: absolute;
          left: 20px;
          width: 2px;
          height: 20px;
          background: #0078d4;
          margin: 5px 0;
        "></div>
        <div style="
          position: absolute;
          left: 15px;
          margin-top: -5px;
          font-size: 20px;
          color: #0078d4;
        ">▼</div>
      `;
    }
  });
  
  html += `
      </div>
      
      <!-- Résumé performances -->
      <div style="
        margin-top: 30px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #28a745;
      ">
        <h5 style="margin: 0 0 10px 0; color: #28a745;">✅ État Système Global</h5>
        <div style="display: flex; gap: 30px; font-size: 14px;">
          <span><strong>Modules actifs:</strong> ${flowSteps.filter(s => s.status === 'operational').length}/${flowSteps.length}</span>
          <span><strong>Capteurs HSE:</strong> 45 entités</span>
          <span><strong>APIs disponibles:</strong> 5 endpoints</span>
          <span><strong>Santé globale:</strong> ✅ Operational</span>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

// 🎨 HELPERS VISUELS
function getFlowStepIcon(status) {
  switch(status) {
    case 'operational': return '✅';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    case 'maintenance': return '🔧';
    default: return '❓';
  }
}

function getFlowStepColor(status) {
  switch(status) {
    case 'operational': return '#28a745';
    case 'warning': return '#ffc107';
    case 'error': return '#dc3545';
    case 'maintenance': return '#17a2b8';
    default: return '#6c757d';
  }
}

// 📊 EXPORT MERMAID (futur)
window.exportFlowMermaid = function() {
  const mermaidCode = generateMermaidCode();
  
  // Copie dans clipboard
  navigator.clipboard.writeText(mermaidCode).then(() => {
    console.log('📊 Code Mermaid copié dans le clipboard');
    alert('📈 Code Mermaid copié !\n\nCollez-le sur mermaid.live pour visualisation interactive.');
  }).catch(err => {
    console.error('Erreur copie clipboard:', err);
    // Fallback: téléchargement fichier
    const blob = new Blob([mermaidCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hse_flow_diagram.mmd';
    a.click();
    URL.revokeObjectURL(url);
  });
};

// 📜 GÉNÉRATION CODE MERMAID 
function generateMermaidCode() {
  return `
flowchart TD
    A[🔍 detect_local.py] --> B[⭐ sensor_quality_scorer.py]
    B --> C[🎯 manage_selection.py]
    C --> D[📈 energy_tracking.py]
    D --> E[📊 sensor.py]
    E --> F[🌐 proxy_api.py]
    
    A1[capteurs_power.json] --> A
    B --> B1[scores qualité]
    C1[capteurs_selection.json] --> C
    C --> C1[mapping final]
    D --> D1[45 sensors HSE]
    E --> E1[entités HA]
    F --> F1[APIs unifiées]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#fce4ec
    style F fill:#f1f8e9
`.trim();
}

// 🚨 AFFICHAGE ERREUR
function showFlowError(message) {
  const container = document.getElementById('flowDiagram');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #dc3545;">
        ❌ ${message}
      </div>
    `;
  }
}

// ✅ INITIALISATION EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refreshFlow');
  const exportBtn = document.getElementById('exportFlow');
  
  if (refreshBtn) refreshBtn.addEventListener('click', loadDiagnosticFlow);
  if (exportBtn) exportBtn.addEventListener('click', window.exportFlowMermaid);
  
  console.log('📈 Module diagnostics-flow.js initialisé');
});

// Expose globalement
window.loadDiagnosticFlow = loadDiagnosticFlow;
window.exportFlowMermaid = window.exportFlowMermaid;

export default {
  loadDiagnosticFlow
};