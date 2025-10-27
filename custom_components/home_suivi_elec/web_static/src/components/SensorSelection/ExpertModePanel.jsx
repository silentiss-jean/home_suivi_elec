import React, { useState } from 'react';
import './ExpertModePanel.css';

/**
 * Panneau expert affichant tous les détails techniques d'un capteur.
 */
export const ExpertModePanel = ({ sensor, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Calcul détaillé du score
  const scoreBreakdown = calculateScoreBreakdown(sensor);
  
  return (
    <div className="expert-modal-overlay" onClick={onClose}>
      <div className="expert-modal" onClick={e => e.stopPropagation()}>
        <div className="expert-header">
          <h2>🔬 Mode Expert</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        
        <div className="expert-sensor-name">
          <strong>{sensor.friendly_name}</strong>
          <code>{sensor.entity_id}</code>
        </div>
        
        {/* Onglets */}
        <div className="expert-tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            📊 Vue d'ensemble
          </button>
          <button 
            className={activeTab === 'scoring' ? 'active' : ''}
            onClick={() => setActiveTab('scoring')}
          >
            🎯 Scoring détaillé
          </button>
          <button 
            className={activeTab === 'technical' ? 'active' : ''}
            onClick={() => setActiveTab('technical')}
          >
            ⚙️ Attributs techniques
          </button>
          <button 
            className={activeTab === 'recommendation' ? 'active' : ''}
            onClick={() => setActiveTab('recommendation')}
          >
            💡 Recommandations
          </button>
        </div>
        
        <div className="expert-content">
          {activeTab === 'overview' && (
            <OverviewTab sensor={sensor} scoreBreakdown={scoreBreakdown} />
          )}
          
          {activeTab === 'scoring' && (
            <ScoringTab sensor={sensor} scoreBreakdown={scoreBreakdown} />
          )}
          
          {activeTab === 'technical' && (
            <TechnicalTab sensor={sensor} />
          )}
          
          {activeTab === 'recommendation' && (
            <RecommendationTab sensor={sensor} scoreBreakdown={scoreBreakdown} />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Onglet Vue d'ensemble
 */
const OverviewTab = ({ sensor, scoreBreakdown }) => (
  <div className="overview-tab">
    <div className="overview-grid">
      <div className="overview-card">
        <div className="card-icon">🎯</div>
        <div className="card-content">
          <div className="card-label">Score de qualité</div>
          <div className="card-value large">{sensor.quality_score}/150</div>
          <div className="card-sublabel">{sensor.stars}</div>
        </div>
      </div>
      
      <div className="overview-card">
        <div className="card-icon">📏</div>
        <div className="card-content">
          <div className="card-label">Type de mesure</div>
          <div className="card-value">
            {sensor.unit?.toLowerCase().includes('kwh') ? 
              '🔋 Energy (kWh)' : 
              '⚡ Power (W)'}
          </div>
          <div className="card-sublabel">{sensor.unit}</div>
        </div>
      </div>
      
      <div className="overview-card">
        <div className="card-icon">📊</div>
        <div className="card-content">
          <div className="card-label">State Class</div>
          <div className="card-value">{sensor.state_class || 'Non défini'}</div>
          <div className="card-sublabel">
            {sensor.state_class === 'total' ? 'Cumulatif' : 'Instantané'}
          </div>
        </div>
      </div>
      
      <div className="overview-card">
        <div className="card-icon">🏆</div>
        <div className="card-content">
          <div className="card-label">Qualité intégration</div>
          <div className="card-value">{sensor.quality_scale || 'Standard'}</div>
          <div className="card-sublabel">
            {sensor.is_premium ? '✨ Premium' : 'Standard'}
          </div>
        </div>
      </div>
    </div>
    
    <div className="overview-recommendation">
      <h3>Recommandation globale</h3>
      <div className={`recommendation-box ${getRecommendationClass(sensor.quality_score)}`}>
        {sensor.recommendation}
      </div>
      <p className="recommendation-text">
        {getRecommendationText(sensor)}
      </p>
    </div>
  </div>
);

/**
 * Onglet Scoring détaillé
 */
const ScoringTab = ({ sensor, scoreBreakdown }) => (
  <div className="scoring-tab">
    <h3>Détail du calcul du score (0-150 pts)</h3>
    
    <div className="score-breakdown">
      {scoreBreakdown.map((item, index) => (
        <div key={index} className="score-item">
          <div className="score-item-header">
            <span className="score-item-name">{item.name}</span>
            <span className="score-item-points">
              +{item.points} pts
            </span>
          </div>
          <div className="score-item-description">{item.description}</div>
          <div className="score-progress">
            <div 
              className="score-progress-bar"
              style={{ width: `${(item.points / item.max) * 100}%` }}
            />
          </div>
          <div className="score-item-max">sur {item.max} pts maximum</div>
        </div>
      ))}
    </div>
    
    <div className="score-total">
      <div className="score-total-label">Score total</div>
      <div className="score-total-value">{sensor.quality_score}/150</div>
      <div className="score-total-percentage">
        {Math.round((sensor.quality_score / 150) * 100)}% de perfection
      </div>
    </div>
  </div>
);

/**
 * Onglet Attributs techniques
 */
const TechnicalTab = ({ sensor }) => {
  const attributes = [
    { label: 'Entity ID', value: sensor.entity_id, type: 'code' },
    { label: 'Device ID', value: sensor.device_id || 'Non défini', type: 'text' },
    { label: 'Device Name', value: sensor.device_name || 'Non défini', type: 'text' },
    { label: 'Area', value: sensor.area || 'Non assigné', type: 'text' },
    { label: 'Integration', value: sensor.integration || 'Inconnue', type: 'text' },
    { label: 'Unit', value: sensor.unit || 'Non défini', type: 'badge' },
    { label: 'State Class', value: sensor.state_class || 'Non défini', type: 'badge' },
    { label: 'Device Class', value: sensor.device_class || 'Non défini', type: 'badge' },
    { label: 'State', value: sensor.state || 'unavailable', type: 'badge' },
    { label: 'Is Virtual', value: sensor.is_virtual ? 'Oui' : 'Non', type: 'boolean' },
    { label: 'Is Premium', value: sensor.is_premium ? 'Oui' : 'Non', type: 'boolean' },
    { label: 'Quality Scale', value: sensor.quality_scale || 'Non défini', type: 'badge' },
    { label: 'Last Updated', value: sensor.last_updated || 'Inconnue', type: 'datetime' },
  ];
  
  return (
    <div className="technical-tab">
      <h3>Attributs du capteur</h3>
      
      <table className="technical-table">
        <tbody>
          {attributes.map((attr, index) => (
            <tr key={index}>
              <td className="attr-label">{attr.label}</td>
              <td className="attr-value">
                {attr.type === 'code' && <code>{attr.value}</code>}
                {attr.type === 'text' && <span>{attr.value}</span>}
                {attr.type === 'badge' && (
                  <span className="attr-badge">{attr.value}</span>
                )}
                {attr.type === 'boolean' && (
                  <span className={`attr-bool ${attr.value === 'Oui' ? 'yes' : 'no'}`}>
                    {attr.value === 'Oui' ? '✓' : '✗'} {attr.value}
                  </span>
                )}
                {attr.type === 'datetime' && <span className="attr-datetime">{attr.value}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="technical-raw">
        <h4>Données brutes (JSON)</h4>
        <pre>{JSON.stringify(sensor, null, 2)}</pre>
      </div>
    </div>
  );
};

/**
 * Onglet Recommandations
 */
const RecommendationTab = ({ sensor, scoreBreakdown }) => {
  const recommendations = generateRecommendations(sensor, scoreBreakdown);
  
  return (
    <div className="recommendation-tab">
      <h3>Analyse et recommandations</h3>
      
      <div className="recommendation-sections">
        {/* Points forts */}
        {recommendations.strengths.length > 0 && (
          <div className="recommendation-section strengths">
            <h4>✅ Points forts</h4>
            <ul>
              {recommendations.strengths.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Points faibles */}
        {recommendations.weaknesses.length > 0 && (
          <div className="recommendation-section weaknesses">
            <h4>⚠️ Points d'attention</h4>
            <ul>
              {recommendations.weaknesses.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Conseils */}
        <div className="recommendation-section tips">
          <h4>💡 Conseils</h4>
          <ul>
            {recommendations.tips.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        
        {/* Alternatives */}
        {recommendations.alternatives.length > 0 && (
          <div className="recommendation-section alternatives">
            <h4>🔄 Alternatives possibles</h4>
            <ul>
              {recommendations.alternatives.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Calcule le détail du score.
 */
function calculateScoreBreakdown(sensor) {
  const breakdown = [];
  
  // Type de mesure
  const unit = (sensor.unit || '').toLowerCase();
  let typePoints = 0;
  let typeMax = 100;
  let typeDesc = '';
  
  if (unit.includes('kwh') || unit.includes('wh')) {
    typePoints = 100;
    typeDesc = '🔋 Mesure Energy (kWh) : Précision maximale, valeur cumulée directement';
  } else if (unit.includes('w')) {
    typePoints = 50;
    typeDesc = '⚡ Mesure Power (W) : Nécessite intégration trapézoïdale, moins précis';
  }
  
  breakdown.push({
    name: '1️⃣ Type de mesure',
    points: typePoints,
    max: typeMax,
    description: typeDesc
  });
  
  // State class
  const stateClass = (sensor.state_class || '').toLowerCase();
  let statePoints = 0;
  let stateMax = 20;
  let stateDesc = '';
  
  if (stateClass === 'total') {
    statePoints = 20;
    stateDesc = '📊 Total : Compteur cumulatif, idéal pour énergie';
  } else if (stateClass === 'measurement' || stateClass === 'total_increasing') {
    statePoints = 10;
    stateDesc = '📈 Measurement : Mesure instantanée';
  }
  
  breakdown.push({
    name: '2️⃣ State Class',
    points: statePoints,
    max: stateMax,
    description: stateDesc
  });
  
  // Qualité intégration
  let integPoints = 0;
  let integMax = 25;
  let integDesc = '';
  
  if (sensor.is_premium) {
    integPoints += 15;
  }
  
  const quality = (sensor.quality_scale || '').toLowerCase();
  if (quality === 'platinum' || quality === 'gold') {
    integPoints += 10;
    integDesc = `🏆 ${sensor.quality_scale} : Intégration officielle haute qualité`;
  } else if (quality === 'silver') {
    integPoints += 5;
    integDesc = '🥈 Silver : Intégration standard';
  } else {
    integDesc = '⚙️ Standard : Intégration communautaire';
  }
  
  breakdown.push({
    name: '3️⃣ Qualité intégration',
    points: integPoints,
    max: integMax,
    description: integDesc
  });
  
  // Physique vs virtuel
  let virtualPoints = sensor.is_virtual ? 0 : 10;
  let virtualMax = 10;
  let virtualDesc = sensor.is_virtual ? 
    '👻 Capteur virtuel : Calculé, peut être moins fiable' :
    '🔌 Capteur physique : Mesure réelle directe';
  
  breakdown.push({
    name: '4️⃣ Type de capteur',
    points: virtualPoints,
    max: virtualMax,
    description: virtualDesc
  });
  
  // Disponibilité
  const state = (sensor.state || '').toLowerCase();
  let availPoints = (state !== 'unavailable' && state !== 'unknown') ? 5 : 0;
  let availMax = 5;
  let availDesc = availPoints > 0 ?
    '✅ Disponible : Capteur actif et fonctionnel' :
    '❌ Indisponible : Capteur hors ligne ou défaillant';
  
  breakdown.push({
    name: '5️⃣ Disponibilité',
    points: availPoints,
    max: availMax,
    description: availDesc
  });
  
  return breakdown;
}

/**
 * Génère des recommandations personnalisées.
 */
function generateRecommendations(sensor, scoreBreakdown) {
  const recommendations = {
    strengths: [],
    weaknesses: [],
    tips: [],
    alternatives: []
  };
  
  const score = sensor.quality_score || 0;
  const unit = (sensor.unit || '').toLowerCase();
  const isEnergy = unit.includes('kwh') || unit.includes('wh');
  const isPower = unit.includes('w') && !isEnergy;
  
  // Points forts
  if (isEnergy) {
    recommendations.strengths.push('Mesure Energy directe (kWh) : précision optimale');
  }
  if (sensor.state_class === 'total') {
    recommendations.strengths.push('Compteur cumulatif : suivi long terme fiable');
  }
  if (sensor.is_premium) {
    recommendations.strengths.push('Intégration premium : support officiel garanti');
  }
  if (!sensor.is_virtual) {
    recommendations.strengths.push('Capteur physique réel : mesures authentiques');
  }
  
  // Points faibles
  if (isPower) {
    recommendations.weaknesses.push('Mesure Power (W) : nécessite intégration, moins précis qu\'Energy');
  }
  if (sensor.is_virtual) {
    recommendations.weaknesses.push('Capteur virtuel : calculé, peut diverger de la réalité');
  }
  if (!sensor.state_class) {
    recommendations.weaknesses.push('State class non défini : statistiques long terme limitées');
  }
  if (sensor.state === 'unavailable') {
    recommendations.weaknesses.push('Capteur actuellement indisponible : vérifier connexion');
  }
  
  // Conseils
  if (score >= 130) {
    recommendations.tips.push('✅ Capteur excellent : recommandé pour un tracking précis');
  } else if (score >= 100) {
    recommendations.tips.push('✅ Bon capteur : convient pour la plupart des usages');
  } else if (score >= 70) {
    recommendations.tips.push('⚠️ Capteur acceptable : utilisable mais préférer une alternative si disponible');
  } else {
    recommendations.tips.push('❌ Capteur déconseillé : chercher une alternative plus fiable');
  }
  
  if (isPower) {
    recommendations.tips.push('Pour plus de précision, vérifier si un capteur Energy (kWh) existe pour cet appareil');
  }
  
  if (!sensor.area) {
    recommendations.tips.push('Assigner une zone (area) pour faciliter l\'organisation');
  }
  
  // Alternatives
  if (isPower && sensor.device_id) {
    recommendations.alternatives.push('Rechercher un capteur Energy (kWh) sur le même appareil');
  }
  
  return recommendations;
}

function getRecommendationClass(score) {
  if (score >= 130) return 'excellent';
  if (score >= 100) return 'good';
  if (score >= 70) return 'acceptable';
  if (score >= 50) return 'medium';
  return 'poor';
}

function getRecommendationText(sensor) {
  const score = sensor.quality_score || 0;
  const unit = (sensor.unit || '').toLowerCase();
  const isEnergy = unit.includes('kwh');
  
  if (score >= 130) {
    return `Ce capteur ${isEnergy ? 'Energy' : 'Power'} est excellent et fortement recommandé. Toutes les conditions sont réunies pour un tracking précis et fiable.`;
  } else if (score >= 100) {
    return `Ce capteur ${isEnergy ? 'Energy' : 'Power'} est de bonne qualité et convient parfaitement pour votre usage. Quelques optimisations possibles mais pas obligatoires.`;
  } else if (score >= 70) {
    return `Ce capteur est acceptable mais présente quelques limitations. Vérifiez si une alternative plus performante existe.`;
  } else if (score >= 50) {
    return `Ce capteur a un score moyen. Il fonctionnera mais la précision pourrait être affectée. Préférez une alternative si possible.`;
  } else {
    return `Ce capteur n'est pas recommandé pour un usage en production. Cherchez une alternative plus fiable.`;
  }
}

export default ExpertModePanel;
