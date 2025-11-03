export async function loadDiagnosticSensors() {
  const tbody = document.getElementById('sensors-tbody');
  const search = document.getElementById('sensor-search');
  tbody.innerHTML = "<tr><td colspan='5'>Chargement...</td></tr>";

  // Préparation des données
  const response = await fetch('/api/home_suivi_elec/lovelace_sensors');
  const sensors = await response.json();

  // Map des sensors par entity_id
  const entityById = {};
  sensors.forEach(s => { entityById[s.entity_id] = s; });

  // Grouper : parent = capteur physique, enfants = cumulés pointant via source_entity
  let parents = [];  // Parents physiques (root)
  let childrenByParent = {};  // entity_id_physique -> [enfants]
  sensors.forEach(s => {
    const sourceEntity = s.attributes.source_entity;
    if (sourceEntity && entityById[sourceEntity]) {
      // Sensor virtuel cumulé : groupé sous son physique
      if (!childrenByParent[sourceEntity]) childrenByParent[sourceEntity] = [];
      childrenByParent[sourceEntity].push(s);
    } else {
      // Physique “de base” (device)
      parents.push(s);
    }
  });

  // Warnings pour l’ensemble
  function isKO(s) { return s.state === "unknown" || s.state === "unavailable"; }
  let sensorsKO = sensors.filter(isKO);

  // Filtres warning et status général
  const warningDiv = document.querySelector('#diagnostic-warning') || document.createElement('div');
  warningDiv.id = "diagnostic-warning";
  warningDiv.style.marginBottom = "14px";
  let filter = "all";

  function renderWarning() {
    const tot = sensorsKO.length;
    warningDiv.innerHTML = "";
    if (tot > 0) {
      warningDiv.innerHTML = `<span style="color:orange; font-weight:600;">⚠️ ${tot} capteur(s) requièrent votre attention</span>`;
    }
    warningDiv.innerHTML +=
      `<span style="margin-left:18px;">
        <button id="btn-all" ${filter=="all"?"style='font-weight:bold'":""}>Tous</button>
        <button id="btn-ok" ${filter=="ok"?"style='font-weight:bold'":""}>OK</button>
        <button id="btn-ko" ${filter=="ko"?"style='font-weight:bold'":""}>KO</button>
      </span>`;
    warningDiv.querySelector('#btn-all').onclick = ()=>{ filter="all"; render(); };
    warningDiv.querySelector('#btn-ok').onclick = ()=>{ filter="ok"; render(); };
    warningDiv.querySelector('#btn-ko').onclick = ()=>{ filter="ko"; render(); };
  }
  if (!warningDiv.parentNode) {
    tbody.parentNode.parentNode.insertBefore(warningDiv, tbody.parentNode);
  }

  // Render principal (parent + enfants + open/close/toggle + search + color)
  function render() {
    renderWarning();
    tbody.innerHTML = "";
    const q = (search.value || "").toLowerCase();

    parents.forEach(parent => {
      const children = childrenByParent[parent.entity_id] || [];
      // if filtre search, on masque le bloc parent si aucun enfant ni le parent ne correspond
      const fullList = [parent, ...children];
      let anyMatch = 
        q === "" || 
        fullList.some(s => (s.attributes.friendly_name || '').toLowerCase().includes(q));
      // Filtre OK/KO
      if (filter === "ok" && fullList.every(isKO)) anyMatch = false;
      if (filter === "ko" && fullList.every(s => !isKO(s))) anyMatch = false;
      if (!anyMatch) return;

      // Statut global pour couleur parent
      const someKO = fullList.some(isKO);
      const parentStyle = `background:${someKO ? "#ffe6e6":"#e6ffe6"};font-weight:600;font-size:1.04em; cursor:pointer;`;
      const parentColor = someKO ? 'red' : 'green';
      // Création de la ligne parent avec toggle (par défaut replié)
      const groupID = `group-${parent.entity_id.replace(/\W+/g,"_")}`;

      const trGroup = document.createElement('tr');
      trGroup.className = 'sensor-group';
      trGroup.innerHTML = `
        <td colspan="5" style="${parentStyle}">
          <span class="group-toggle" style="margin-right:8px;font-weight:700; font-size:1.12em;">▶</span>
          <span style="color:${parentColor};">${parent.attributes.friendly_name || parent.entity_id}</span>
          <span style="margin-left:10px;font-size:0.95em;color:#777">(physique)</span>
          <span style="margin-left:8px;">${someKO ? "⚠️" : "✅"}</span>
        </td>
      `;
      tbody.appendChild(trGroup);

      // Ajout enfants cachés par défaut
      children.forEach(child => {
        const isChildKO = isKO(child);
        const childColor = isChildKO ? "red" : "#0078d4";
        const tr = document.createElement('tr');
        tr.className = groupID+" group-sensor-row";
        tr.style.display = 'none';
        tr.innerHTML = `
          <td style="padding-left:36px;color:${childColor};">${child.attributes.friendly_name || child.entity_id}</td>
          <td>${child.attributes.unit_of_measurement || ""}</td>
          <td>${child.state}</td>
          <td>${child.attributes.last_reset || '-'}</td>
          <td>${isChildKO ? '❌' : '🔷'}<span style="font-size:0.87em; color:#888; margin-left:6px">(virtuel cumulé)</span></td>
        `;
        tbody.appendChild(tr);
      });

      // Toggle +/−
      trGroup.querySelector('.group-toggle').onclick = function() {
        const open = this.textContent === '▼';
        this.textContent = open ? '▶' : '▼';
        tbody.querySelectorAll(`.${groupID}`).forEach(e => e.style.display = open ? 'none' : '');
      };
    });
  }

  render();

  // Recherche live
  search.oninput = () => render();

  // EXPORT CSV inchangé
  document.getElementById('export-sensors-csv').onclick = () => {
    const lines = [
      ['Entity', 'Friendly name', 'Unit', 'State', 'Status'],
      ...sensors.map(s => [
        s.entity_id,
        s.attributes.friendly_name || '',
        s.attributes.unit_of_measurement || '',
        s.state,
        (['unknown', 'unavailable'].includes(s.state)) ? 'KO' : 'OK'
      ])
    ];
    const csv = lines.map(r=>r.join(';')).join('\n');
    const blob = new Blob([csv], {type: 'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'capteurs_home_suivi_elec.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };
}
