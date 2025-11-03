// js/configuration.state.js — Gestion état configuration complète
console.info("[config.state] module chargé");

const FOLD_KEY = "hse_fold_v1";

// ==================== FOLDS ====================
function readStore() {
  try {
    const raw = localStorage.getItem(FOLD_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("[config.state] readStore error:", e);
    return {};
  }
}

function writeStore(obj) {
  try {
    localStorage.setItem(FOLD_KEY, JSON.stringify(obj || {}));
  } catch (e) {
    console.warn("[config.state] writeStore error:", e);
  }
}

export function getFold(integration, columnName) {
  const store = readStore();
  const col = store[columnName] || {};
  return col[integration] === true;
}

export function setFold(integration, columnName, isOpen) {
  const store = readStore();
  store[columnName] ??= {};
  store[columnName][integration] = !!isOpen;
  writeStore(store);
  console.debug("[config.state] setFold:", columnName, integration, !!isOpen);
}

// ==================== HYDRATATION ====================
export function hydrateUserConfig(options) {
  console.info("[config.state] hydrateUserConfig", JSON.stringify(options, null, 2));

  const setVal = (id, v) => { 
    const el = document.getElementById(id); 
    if (el && v != null) {
      el.value = v;
      console.log(`✅ [config.state] ${id} = ${v}`);
    }
  };

  // Abonnement
  setVal("abonnementHT", options.abonnementHT);
  setVal("abonnementTTC", options.abonnementTTC);
  
  // Type contrat + toggle
  const typeSel = document.getElementById("typeContrat");
  const blocFixeConfig = document.getElementById("blocFixeConfig");
  const blocHpHcConfig = document.getElementById("hpHCFieldsConfig");
  
  if (typeSel) {
    typeSel.value = options.typeContrat || "fixe";
    
    console.log("[config.state] Type contrat:", typeSel.value);
    
    if (typeSel.value === "fixe") {
      if (blocFixeConfig) blocFixeConfig.style.display = "block";
      if (blocHpHcConfig) blocHpHcConfig.style.display = "none";
    } else {
      if (blocFixeConfig) blocFixeConfig.style.display = "none";
      if (blocHpHcConfig) blocHpHcConfig.style.display = "block";
    }
  }
  
  // ✅ TARIF FIXE : Backend utilise prix_ht/prix_ttc, Frontend utilise tarifFixeHT/tarifFixeTTC
  setVal("tarifFixeHT", options.prix_ht);
  setVal("tarifFixeTTC", options.prix_ttc);
  
  // ✅ TARIF HP/HC : Même logique
  setVal("tarifHPHT", options.prix_ht_hp);
  setVal("tarifHPTTC", options.prix_ttc_hp);
  setVal("tarifHCHT", options.prix_ht_hc);
  setVal("tarifHCTTC", options.prix_ttc_hc);
  
  // Horaires
  setVal("heuresHPDebut", options.hc_start || "06:00");
  setVal("heuresHPFin", options.hc_end || "22:00");
}

// ==================== BINDING BOUTONS ====================
export function bindUserOptions(onSave) {
  console.info("[config.state] bindUserOptions");
  
  bindSaveUserConfig(onSave);
  bindSaveSelection(onSave);
  bindTypeContratToggle();
}

function bindSaveUserConfig(onSave) {
  const oldBtn = document.getElementById("saveUserConfig");
  if (oldBtn) {
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
  }
  
  const btn = document.getElementById("saveUserConfig");
  if (btn) {
    btn.addEventListener("click", async (ev) => {
      ev?.preventDefault?.();
      
      const typeContrat = document.getElementById("typeContrat")?.value || "fixe";
      const payload = {
        abonnementHT: parseFloat(document.getElementById("abonnementHT")?.value) || 0,
        abonnementTTC: parseFloat(document.getElementById("abonnementTTC")?.value) || 0,
        typeContrat: typeContrat,
      };
      
      if (typeContrat === "fixe") {
        // ✅ Backend attend prix_ht/prix_ttc
        payload.prix_ht = parseFloat(document.getElementById("tarifFixeHT")?.value) || 0;
        payload.prix_ttc = parseFloat(document.getElementById("tarifFixeTTC")?.value) || 0;
      } else {
        // ✅ Backend attend prix_ht_hp/prix_ttc_hp/prix_ht_hc/prix_ttc_hc
        payload.prix_ht_hp = parseFloat(document.getElementById("tarifHPHT")?.value) || 0;
        payload.prix_ttc_hp = parseFloat(document.getElementById("tarifHPTTC")?.value) || 0;
        payload.prix_ht_hc = parseFloat(document.getElementById("tarifHCHT")?.value) || 0;
        payload.prix_ttc_hc = parseFloat(document.getElementById("tarifHCTTC")?.value) || 0;
        payload.hc_start = document.getElementById("heuresHPDebut")?.value || "";
        payload.hc_end = document.getElementById("heuresHPFin")?.value || "";
      }
      
      console.log("[config.state] Payload configuration:", payload);
      
      if (typeof onSave === "function") {
        await onSave(payload);
        alert("✅ Configuration tarifaire sauvegardée !");
      }
    });
  }
}

function bindSaveSelection(onSave) {
  const oldBtn = document.getElementById("saveSelection");
  if (oldBtn) {
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
  }
  
  const btn = document.getElementById("saveSelection");
  if (btn) {
    btn.addEventListener("click", async (ev) => {
      ev?.preventDefault?.();
      
      const typeContrat = document.getElementById("typeContrat")?.value || "fixe";
      const payload = {
        abonnementHT: parseFloat(document.getElementById("abonnementHT")?.value) || 0,
        abonnementTTC: parseFloat(document.getElementById("abonnementTTC")?.value) || 0,
        typeContrat: typeContrat,
      };
      
      if (typeContrat === "fixe") {
        payload.prix_ht = parseFloat(document.getElementById("tarifFixeHT")?.value) || 0;
        payload.prix_ttc = parseFloat(document.getElementById("tarifFixeTTC")?.value) || 0;
      } else {
        payload.prix_ht_hp = parseFloat(document.getElementById("tarifHPHT")?.value) || 0;
        payload.prix_ttc_hp = parseFloat(document.getElementById("tarifHPTTC")?.value) || 0;
        payload.prix_ht_hc = parseFloat(document.getElementById("tarifHCHT")?.value) || 0;
        payload.prix_ttc_hc = parseFloat(document.getElementById("tarifHCTTC")?.value) || 0;
        payload.hc_start = document.getElementById("heuresHPDebut")?.value || "";
        payload.hc_end = document.getElementById("heuresHPFin")?.value || "";
      }
      
      console.log("[config.state] Payload sauvegarde sélection:", payload);
      
      if (typeof onSave === "function") {
        await onSave(payload);
      }
    });
  }
}

function bindTypeContratToggle() {
  const typeContratSelect = document.getElementById("typeContrat");
  const blocFixeConfig = document.getElementById("blocFixeConfig");
  const blocHpHcConfig = document.getElementById("hpHCFieldsConfig");
  
  if (typeContratSelect) {
    typeContratSelect.addEventListener("change", () => {
      const val = typeContratSelect.value;
      console.log("[config.state] Changement contrat:", val);
      
      if (val === "fixe") {
        if (blocFixeConfig) blocFixeConfig.style.display = "block";
        if (blocHpHcConfig) blocHpHcConfig.style.display = "none";
      } else {
        if (blocFixeConfig) blocFixeConfig.style.display = "none";
        if (blocHpHcConfig) blocHpHcConfig.style.display = "block";
      }
    });
  }
}
