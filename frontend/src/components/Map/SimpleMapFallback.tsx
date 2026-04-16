import { useState } from 'react';

export default function SimpleMapFallback() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [lat, setLat] = useState('23.0225');
  const [lng, setLng] = useState('72.5714');
  const [useCase, setUseCase] = useState('retail');

  const analyzeLocation = async (latitude: number, longitude: number) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Analyzing location:', latitude, longitude, 'Use case:', useCase);
      
      const response = await fetch('http://localhost:8000/api/v1/enhanced/score', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          lat: latitude, 
          lng: longitude, 
          use_case: useCase 
        })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      
      setData(result);
        
    } catch (err) {
      console.error('Error analyzing location:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = () => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (!isNaN(latitude) && !isNaN(longitude)) {
      // Validate coordinates are within reasonable bounds for Ahmedabad
      if (latitude < 22.8 || latitude > 23.2 || longitude < 72.3 || longitude > 72.8) {
        setError('Please enter coordinates within the Ahmedabad area (Lat: 22.8-23.2, Lng: 72.3-72.8)');
        return;
      }
      analyzeLocation(latitude, longitude);
    } else {
      setError('Please enter valid coordinates');
    }
  };

  const testAPI = () => {
    analyzeLocation(23.0225, 72.5714);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 65) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getUseCaseIcon = (useCase: string) => {
    const icons = {
      retail: '🏪',
      office: '🏢', 
      warehouse: '🏭',
      restaurant: '🍽️',
      residential: '🏠',
      industrial: '🏗️'
    };
    return icons[useCase as keyof typeof icons] || '📍';
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Map Placeholder */}
      <div style={{ 
        flex: 1, 
        position: 'relative',
        background: 'linear-gradient(45deg, #e3f2fd, #bbdefb)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🗺️</div>
          <h2 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '24px' }}>
            Interactive Map (Fallback Mode)
          </h2>
          <p style={{ color: '#666', fontSize: '16px', marginBottom: '24px', lineHeight: 1.5 }}>
            The interactive map is temporarily unavailable. You can still analyze locations using coordinates below.
          </p>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 'bold', color: '#555' }}>
                Use Case
              </label>
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  fontSize: '16px'
                }}
              >
                <option value="retail">🏪 Retail Store</option>
                <option value="office">🏢 Office Space</option>
                <option value="warehouse">🏭 Warehouse</option>
                <option value="restaurant">🍽️ Restaurant</option>
                <option value="residential">🏠 Residential</option>
                <option value="industrial">🏗️ Industrial</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 'bold', color: '#555' }}>
                Latitude (Ahmedabad area: 22.9 - 23.1)
              </label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  fontSize: '16px',
                  textAlign: 'center'
                }}
                placeholder="23.0225"
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 'bold', color: '#555' }}>
                Longitude (Ahmedabad area: 72.4 - 72.7)
              </label>
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  fontSize: '16px',
                  textAlign: 'center'
                }}
                placeholder="72.5714"
              />
            </div>
            
            <button
              onClick={handleAnalyze}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#6c757d' : 'linear-gradient(135deg, #007bff, #0056b3)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '12px'
              }}
            >
              {loading ? '🔍 Analyzing...' : `🎯 Analyze ${getUseCaseIcon(useCase)} Location`}
            </button>

            <button
              onClick={testAPI}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Testing...' : '🏢 Quick Test (Ahmedabad Center)'}
            </button>
          </div>

          <div style={{ fontSize: '12px', color: '#888', textAlign: 'left' }}>
            <strong>Sample coordinates to try:</strong><br/>
            • Ahmedabad Center: 23.0225, 72.5714<br/>
            • SG Highway: 23.0300, 72.5200<br/>
            • Maninagar: 23.0100, 72.6000<br/>
            • Satellite: 23.0400, 72.5100
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div style={{
        width: '420px',
        background: '#f8f9fa',
        padding: '24px',
        overflowY: 'auto',
        borderLeft: '1px solid #dee2e6'
      }}>
        <h1 style={{ 
          margin: '0 0 24px 0', 
          fontSize: '24px', 
          fontWeight: 'bold',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🌍 GeoSpatial Site Analyzer
        </h1>

        <div style={{
          background: '#fff3cd',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ffeaa7'
        }}>
          <div style={{ fontSize: '14px', color: '#856404', fontWeight: 'bold', marginBottom: '8px' }}>
            ℹ️ Fallback Mode Active
          </div>
          <div style={{ fontSize: '13px', color: '#856404' }}>
            The interactive map is not available, but you can still analyze locations using coordinates.
          </div>
        </div>

        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>⚠️ Error:</div>
            <div style={{ fontSize: '14px' }}>{error}</div>
          </div>
        )}

        {data && (
          <div>
            {/* Score Display */}
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '18px' }}>
                Site Readiness Score
              </h3>
              <div style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: getScoreColor(data.composite_score),
                margin: '12px 0',
                lineHeight: 1
              }}>
                {data.composite_score}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>out of 100</div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                {getUseCaseIcon(data.use_case)} {data.use_case.charAt(0).toUpperCase() + data.use_case.slice(1)} Development
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                📍 {data.location?.latitude?.toFixed(4)}, {data.location?.longitude?.toFixed(4)}
              </div>
            </div>

            {/* Recommendation */}
            {data.recommendation && (
              <div style={{
                background: data.composite_score >= 70 ? '#d1fae5' : data.composite_score >= 55 ? '#fef3c7' : '#fee2e2',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px',
                border: `2px solid ${data.composite_score >= 70 ? '#10b981' : data.composite_score >= 55 ? '#f59e0b' : '#ef4444'}`
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '16px', fontWeight: 'bold' }}>
                  {data.recommendation.verdict}
                </h4>
                <div style={{ fontSize: '14px', color: '#555', lineHeight: 1.4, marginBottom: '12px' }}>
                  {data.recommendation.summary}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
                  ✅ {data.recommendation.action}
                </div>
                {data.recommendation.strengths && data.recommendation.strengths.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#059669', marginBottom: '4px' }}>Strengths:</div>
                    {data.recommendation.strengths.map((strength: string, i: number) => (
                      <div key={i} style={{ fontSize: '12px', color: '#059669' }}>• {strength}</div>
                    ))}
                  </div>
                )}
                {data.recommendation.weaknesses && data.recommendation.weaknesses.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626', marginBottom: '4px' }}>Considerations:</div>
                    {data.recommendation.weaknesses.map((weakness: string, i: number) => (
                      <div key={i} style={{ fontSize: '12px', color: '#dc2626' }}>• {weakness}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analysis Breakdown */}
            {data.analysis && (
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '16px' }}>
                  📊 Detailed Analysis
                </h4>
                
                {/* Demographics */}
                {data.analysis.demographics && (
                  <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                      👥 Demographics ({data.analysis.demographics.score}/100)
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Population: {data.analysis.demographics.population?.toLocaleString()} • 
                      Income: ₹{data.analysis.demographics.income?.toLocaleString()}/year • 
                      Type: {data.analysis.demographics.area_type}
                    </div>
                  </div>
                )}

                {/* Transport */}
                {data.analysis.transport && (
                  <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                      🚗 Transport ({data.analysis.transport.score}/100)
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Highway: {data.analysis.transport.highway_distance}km ({data.analysis.transport.highway_access}) • 
                      Airport: {data.analysis.transport.airport_distance}km
                    </div>
                  </div>
                )}

                {/* Infrastructure */}
                {data.analysis.infrastructure && (
                  <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                      🏗️ Infrastructure ({data.analysis.infrastructure.score}/100)
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Power: {data.analysis.infrastructure.power_reliability}% • 
                      Water: {data.analysis.infrastructure.water_supply}% • 
                      Internet: {data.analysis.infrastructure.internet_speed} Mbps
                    </div>
                  </div>
                )}

                {/* Market */}
                {data.analysis.market && (
                  <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                      📈 Market ({data.analysis.market.score}/100)
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Competitors: {data.analysis.market.competitors} • 
                      Saturation: {data.analysis.market.market_saturation}% • 
                      Opportunity: {data.analysis.market.market_opportunity}
                    </div>
                  </div>
                )}

                {/* Environment */}
                {data.analysis.environment && (
                  <div style={{ marginBottom: '0', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                      🌿 Environment ({data.analysis.environment.score}/100)
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Flood Risk: {data.analysis.environment.flood_risk}% • 
                      Air Quality: {data.analysis.environment.air_quality}/100 • 
                      Safety: {data.analysis.environment.safety_index}/100
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}