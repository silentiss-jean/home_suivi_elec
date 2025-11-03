// referencePanel.js — Panel pour capteur de référence
import stateModule from "../shared/stateModule.js";
import { toast } from "../shared/uiToast.js";

let currentRoot = null;
let currentAllCapteurs = {};

export async function initReferencePanel(root, allCapteurs = {}) {
  if (!root) return;
  
  // Stocker pour rerenderReferencePanel
  currentRoot = root;
  currentAllCapteurs = allCapteurs;
  
  await renderReferencePanel(root, allCapteurs);
}

export async function rerenderReferencePanel() {
  if (currentRoot) {
    await renderReferencePanel(currentRoot, currentAllCapteurs);
  }
}

async function renderReferencePanel(root, allCapteurs = {}) {
  root.innerHTML = `
    <div class="card">
      <h3>Capteur de référence</h3>
      <div class="form-row">
        <label><input type="checkbox" id="useExternal"> Utiliser un capteur externe</label>
      </div>
      <div class="form-row">
        <label><input type="radio" name="referenceMode" value="capteur" checked> Capteur</label>
        <label><input type="radio" name="referenceMode" value="manuel"> Manuel</label>
      </div>
      <div class="form-row" id="refSensorRow">
        <label for="externalCapteur">Entité externe</label>
        <input type="text" id="externalCapteur" placeholder="sensor.xxx" list="entitiesList">
        <datalist id="entitiesList"></datalist>
      </div>
      <div class="form-row" id="refManualRow" style="display:none;">
        <label for="consommationExterne">Valeur manuelle (W)</label>
        <input type="number" id="consommationExterne" min="0" step="0.1" placeholder="0.0">
      </div>
      <div class="form-actions">
        <button id="saveReference" class="btn btn-primary">Enregistrer</button>
      </div>
    </div>
  `;

  // Hydratation depuis stateModule si disponible
  const st = stateModule.get("reference") || {};
  document.getElementById("useExternal").checked = !!st.useExternal;
  const mode = st.mode || "capteur";
  document.querySelector(`input[name="referenceMode"][value="${mode}"]`)?.click();
  document.getElementById("externalCapteur").value = st.externalCapteur || "";
  document.getElementById("consommationExterne").value = st.consommationExterne || 0;

  // Afficher/cacher la ligne manuelle selon le mode
  const refSensorRow = document.getElementById("refSensorRow");
  const refManualRow = document.getElementById("refManualRow");
  const radios = document.querySelectorAll('input[name="referenceMode"]');
  radios.forEach(r => r.addEventListener('change', () => {
    if (r.value === 'manuel' && r.checked) {
      refSensorRow.style.display = 'none';
      refManualRow.style.display = '';
    } else if (r.value === 'capteur' && r.checked) {
      refSensorRow.style.display = '';
      refManualRow.style.display = 'none';
    }
  }));

  // Remplir la datalist avec les entités possibles
  const datalist = document.getElementById("entitiesList");
  Object.values(allCapteurs || {}).forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.entity_id;
    opt.label = c.friendly_name || c.entity_id;
    datalist.appendChild(opt);
  });

  document.getElementById("saveReference").addEventListener("click", () => {
    const useExternal = document.getElementById("useExternal").checked;
    const mode = document.querySelector('input[name="referenceMode"]:checked')?.value || 'capteur';
    const externalCapteur = document.getElementById("externalCapteur").value;
    const consommationExterne = parseFloat(document.getElementById("consommationExterne").value) || 0;

    stateModule.set("reference", { useExternal, mode, externalCapteur, consommationExterne });
    toast.success("Référence mise à jour");
  });
}
