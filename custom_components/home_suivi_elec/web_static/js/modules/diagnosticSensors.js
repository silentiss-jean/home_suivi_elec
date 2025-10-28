export async function loadDiagnosticSensors() {
  const tbody = document.getElementById('sensors-tbody');
  const search = document.getElementById('sensor-search');
  tbody.innerHTML = "<tr><td colspan='5'>Chargement...</td></tr>";

  // Récupère tous les sensors HSE en local via ton endpoint
  const response = await fetch('/api/home_suivi_elec/lovelace_sensors');
  const sensors = await response.json();

  function renderSensors(list) {
    tbody.innerHTML = '';
    for (const s of list) {
      const isError = (s.state === 'unknown' || s.state === 'unavailable');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.attributes.friendly_name || s.entity_id}</td>
        <td>${s.attributes.unit_of_measurement || ''}</td>
        <td>${s.state}</td>
        <td>${s.attributes.last_reset || '-'}</td>
        <td>${isError ? '❌' : '✅'}</td>
      `;
      if (isError) tr.style.backgroundColor = "#ffd1d1";
      tbody.appendChild(tr);
    }
  }

  renderSensors(sensors);
  search.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = sensors.filter(s =>
      s.entity_id.toLowerCase().includes(q) ||
      (s.attributes.friendly_name || '').toLowerCase().includes(q)
    );
    renderSensors(filtered);
  });

  // EXPORT CSV
  document.getElementById('export-sensors-csv').onclick = () => {
    const lines = [
      ['Entity', 'Friendly name', 'Unit', 'State', 'Status'],
      ...sensors.map(s => [
        s.entity_id,
        s.attributes.friendly_name || '',
        s.attributes.unit_of_measurement || '',
        s.state,
        (s.state === 'unknown' || s.state === 'unavailable') ? 'KO' : 'OK'
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
