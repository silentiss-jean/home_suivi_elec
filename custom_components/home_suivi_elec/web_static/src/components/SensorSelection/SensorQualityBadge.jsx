import React from 'react';
import './SensorQualityBadge.css';

/**
 * Composant pour afficher un badge de qualité de capteur.
 * 
 * @param {Object} sensor - Capteur avec quality_score, recommendation, stars
 */
export const SensorQualityBadge = ({ sensor }) => {
  const score = sensor.quality_score || 0;
  const recommendation = sensor.recommendation || "Non évalué";
  const stars = sensor.stars || "☆";
  
  // Déterminer la couleur du badge selon le score
  let badgeClass = "quality-badge";
  if (score >= 130) {
    badgeClass += " excellent";
  } else if (score >= 100) {
    badgeClass += " good";
  } else if (score >= 70) {
    badgeClass += " acceptable";
  } else if (score >= 50) {
    badgeClass += " medium";
  } else {
    badgeClass += " poor";
  }
  
  // Déterminer l'icône selon le type
  const unit = (sensor.unit || "").toLowerCase();
  let icon = "⚡";
  if (unit.includes("kwh") || unit.includes("wh")) {
    icon = "🔋"; // Energy
  } else if (unit.includes("w")) {
    icon = "⚡"; // Power
  }
  
  return (
    <div className={badgeClass}>
      <div className="badge-header">
        <span className="badge-icon">{icon}</span>
        <span className="badge-label">{recommendation}</span>
      </div>
      <div className="badge-details">
        <span className="badge-score">Score: {score}/150</span>
        <span className="badge-stars">{stars}</span>
      </div>
      {sensor.auto_selected && (
        <div className="badge-auto">✨ Auto-sélectionné</div>
      )}
    </div>
  );
};

/**
 * Composant pour afficher un comparatif de capteurs.
 */
export const SensorComparison = ({ sensors, onSelect }) => {
  // Trier par score décroissant
  const sortedSensors = [...sensors].sort((a, b) => 
    (b.quality_score || 0) - (a.quality_score || 0)
  );
  
  return (
    <div className="sensor-comparison">
      <h3>Comparaison des capteurs</h3>
      <p className="comparison-hint">
        💡 Conseil : Choisissez le capteur avec le meilleur score (étoiles vertes)
      </p>
      
      <div className="sensor-list">
        {sortedSensors.map((sensor, index) => (
          <div 
            key={sensor.entity_id} 
            className={`sensor-item ${index === 0 ? 'recommended' : ''}`}
          >
            <div className="sensor-info">
              <div className="sensor-name">
                <strong>{sensor.friendly_name || sensor.entity_id}</strong>
                {index === 0 && <span className="best-badge">🏆 MEILLEUR</span>}
              </div>
              <div className="sensor-details">
                <span className="sensor-unit">{sensor.unit}</span>
                <span className="sensor-type">
                  {sensor.unit?.toLowerCase().includes('kwh') ? 
                    '🔋 Energy (précis)' : 
                    '⚡ Power (estimé)'}
                </span>
              </div>
            </div>
            
            <SensorQualityBadge sensor={sensor} />
            
            <button 
              className={`select-button ${index === 0 ? 'primary' : 'secondary'}`}
              onClick={() => onSelect(sensor)}
            >
              {index === 0 ? '✅ Choisir (recommandé)' : 'Choisir'}
            </button>
          </div>
        ))}
      </div>
      
      <div className="comparison-legend">
        <h4>Légende</h4>
        <ul>
          <li><span className="legend-icon">🔋</span> Energy (kWh) : Mesure directe, très précise</li>
          <li><span className="legend-icon">⚡</span> Power (W) : Nécessite calcul, moins précis</li>
          <li><span className="legend-icon">⭐⭐⭐</span> Excellent (130+) : Top qualité</li>
          <li><span className="legend-icon">⭐⭐</span> Acceptable (70-99) : Qualité moyenne</li>
          <li><span className="legend-icon">⭐</span> Faible (&lt;70) : Déconseillé</li>
        </ul>
      </div>
    </div>
  );
};
