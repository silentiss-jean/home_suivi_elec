export async function loadDiagnosticSensors() {
  const tbody = document.getElementById('sensors-tbody');
  const search = document.getElementById('sensor-search');
  tbody.innerHTML = "<tr><td colspan='5'>Chargement...</td></tr>";

  // Récupère tous les sensors HSE
  const response = await fetch('/api/home_suivi_elec/lovelace_sensors');
  const sensors = await response.json();

  // Fonction pour obtenir la "clé" device empruntée du friendly_name sans suffixe temporel
  function getGroupKey(s) {
    let name = (s.attributes.friendly_name || s.entity_id);
    // Supprime les suffixes de type
    const suffixes = [' Hourly', ' Daily', ' Weekly', ' Monthly', ' Yearly'];
    for (const suff of suffixes) {
      if (name.endsWith(suff)) {
        name = name.slice(0, -suff.length).trim();
        break;
      }
    }
    return name;
  }

  // Grouper les sensors
  let groups = {};
  for (const s of sensors) {
    const groupKey = getGroupKey(s);
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(s);
  }

  // Render des groupes (tout replié par défaut)
  tbody.innerHTML = '';
  Object.entries(groups).forEach(([groupName, groupSensors]) => {
    // Statut du groupe (KO si 1 au moins en erreur)
    const groupOk = groupSensors.every(s => !['unknown', 'unavailable'].includes(s.state));
    // Ligne de groupe "parent"
    const trGroup = document.createElement('tr');
    trGroup.className = 'sensor-group';
    trGroup.innerHTML = `
      <td colspan="5" style="background:${groupOk ? '#e6ffe6' : '#ffe6e6'}; font-weight:600;">
        <span style="cursor:pointer" class="group-toggle">▶</span>
        <span style="color:${groupOk ? 'green' : 'red'};">${groupName}</span>
        <span style="margin-left:8px;">${groupOk ? '✅' : '⚠️'}</span>
      </td>
    `;
    tbody.appendChild(trGroup);

    // Sous-lignes (capteurs d'un même groupe, cachées par défaut)
    groupSensors.forEach(s => {
      const isError = ['unknown', 'unavailable'].includes(s.state);
      const tr = document.createElement('tr');
      tr.className = 'group-sensor-row';
      tr.style.display = 'none';
      tr.innerHTML = `
        <td style="padding-left: 32px;">${s.attributes.friendly_name || s.entity_id}</td>
        <td>${s.attributes.unit_of_measurement || ''}</td>
        <td>${s.state}</td>
        <td>${s.attributes.last_reset || '-'}</td>
        <td>${isError ? '❌' : '✅'}</td>
      `;
      tbody.appendChild(tr);
    });

    // Toggle group expand/collapse
    trGroup.querySelector('.group-toggle').onclick = () => {
      const rows = [];
      let next = trGroup.nextSibling;
      while (next && next.className === 'group-sensor-row') {
        rows.push(next);
        next = next.nextSibling;
      }
      rows.forEach(row => row.style.display = (row.style.display === 'none' ? '' : 'none'));
      // Flèche: droite (replié), bas (déplié)
      trGroup.querySelector('.group-toggle').textContent =
        (rows[0] && rows[0].style.display === 'none') ? '▶' : '▼';
    };
  });

  // Recherche filtrée (déplie tout si match)
  search.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    tbody.innerHTML = '';
    Object.entries(groups).forEach(([groupName, groupSensors]) => {
      const filtered = groupSensors.filter(s =>
        s.entity_id.toLowerCase().includes(q) ||
        (s.attributes.friendly_name || '').toLowerCase().includes(q)
      );
      if (filtered.length === 0) return;
      const groupOk = filtered.every(s => !['unknown', 'unavailable'].includes(s.state));
      const trGroup = document.createElement('tr');
      trGroup.className = 'sensor-group';
      trGroup.innerHTML = `
        <td colspan="5" style="background:${groupOk ? '#e6ffe6' : '#ffe6e6'}; font-weight:600;">
          <span style="cursor:pointer" class="group-toggle">▼</span>
          <span style="color:${groupOk ? 'green' : 'red'};">${groupName}</span>
          <span style="margin-left:8px;">${groupOk ? '✅' : '⚠️'}</span>
        </td>
      `;
      tbody.appendChild(trGroup);
      filtered.forEach(s => {
        const isError = ['unknown', 'unavailable'].includes(s.state);
        const tr = document.createElement('tr');
        tr.className = 'group-sensor-row';
        tr.style.display = '';
        tr.innerHTML = `
          <td style="padding-left: 32px;">${s.attributes.friendly_name || s.entity_id}</td>
          <td>${s.attributes.unit_of_measurement || ''}</td>
          <td>${s.state}</td>
          <td>${s.attributes.last_reset || '-'}</td>
          <td>${isError ? '❌' : '✅'}</td>
        `;
        tbody.appendChild(tr);
      });
      trGroup.querySelector('.group-toggle').onclick = () => {
        const rows = [];
        let next = trGroup.nextSibling;
        while (next && next.className === 'group-sensor-row') {
          rows.push(next);
          next = next.nextSibling;
        }
        rows.forEach(row => row.style.display = (row.style.display === 'none' ? '' : 'none'));
        trGroup.querySelector('.group-toggle').textContent =
          (rows[0] && rows[0].style.display === 'none') ? '▶' : '▼';
      };
    });
  });

  // EXPORT CSV (identique)
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
