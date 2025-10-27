import React, { useState, useEffect } from 'react';
import { SensorComparison, SensorQualityBadge } from './SensorQualityBadge';

export const SensorSelectionPanel = () => {
  const [sensors, setSensors] = useState([]);
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [showComparison, setShowComparison] = useState({});
  
  // Charger les capteurs avec leurs scores
  useEffect(() => {
    fetchSensorsWithQuality();
  }, []);
  
  const fetchSensorsWithQuality = async () => {
    try {
      const response = await fetch('/api/home_suivi_elec/get_sensor_quality_scores');
      const data = await response.json();
      
      if (data.success) {
        setSensors(data.sensors);
      }
    } catch (error) {
      console.error('Erreur chargement capteurs:', error);
    }
  };
  
  // Auto-sélection intelligente
  const handleAutoSelect = async () => {
    try {
      const response = await fetch('/api/home_suivi_elec/auto_select_best_sensors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${data.selected_count} capteurs sélectionnés automatiquement !`);
        fetchSensorsWithQuality(); // Recharger
      }
    } catch (error) {
      console.error('Erreur auto-sélection:', error);
    }
  };
  
  // Grouper les capteurs par appareil
  const groupedSensors = sensors.reduce((acc, sensor) => {
    const deviceId = sensor.device_id || 'no_device';
    if (!acc[deviceId]) {
      acc[deviceId] = [];
    }
    acc[deviceId].push(sensor);
    return acc;
  }, {});
  
  return (
    <div className="sensor-selection-panel">
      <div className="panel-header">
        <h2>Sélection des capteurs</h2>
        <button 
          className="auto-select-button"
          onClick={handleAutoSelect}
        >
          ✨ Sélection automatique intelligente
        </button>
      </div>
      
      <div className="devices-list">
        {Object.entries(groupedSensors).map(([deviceId, deviceSensors]) => {
          const deviceName = deviceSensors[0]?.device_name || "Appareil inconnu";
          const hasMultiple = deviceSensors.length > 1;
          
          return (
            <div key={deviceId} className="device-group">
              <div className="device-header">
                <h3>{deviceName}</h3>
                {hasMultiple && (
                  <button 
                    className="compare-button"
                    onClick={() => setShowComparison({
                      ...showComparison,
                      [deviceId]: !showComparison[deviceId]
                    })}
                  >
                    {showComparison[deviceId] ? '▼ Masquer comparaison' : '▶ Comparer les capteurs'}
                  </button>
                )}
              </div>
              
              {!showComparison[deviceId] ? (
                // Vue liste simple
                <div className="sensors-simple-list">
                  {deviceSensors.map(sensor => (
                    <div key={sensor.entity_id} className="sensor-row">
                      <div className="sensor-col-name">
                        <strong>{sensor.friendly_name}</strong>
                        <span className="sensor-entity-id">{sensor.entity_id}</span>
                      </div>
                      <div className="sensor-col-badge">
                        <SensorQualityBadge sensor={sensor} />
                      </div>
                      <div className="sensor-col-actions">
                        <input 
                          type="checkbox"
                          checked={selectedSensors.includes(sensor.entity_id)}
                          onChange={(e) => handleToggleSelection(sensor.entity_id, e.target.checked)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Vue comparaison détaillée
                <SensorComparison 
                  sensors={deviceSensors}
                  onSelect={(sensor) => handleSelectSensor(sensor)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
