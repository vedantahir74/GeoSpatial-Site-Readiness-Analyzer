import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function EnhancedMapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [lat, setLat] = useState('23.0225');
  const [lng, setLng] = useState('72.5714');
  const [useCase, setUseCase] = useState('retail');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string>('');
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      // Create map with multiple tile source fallbacks
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'carto-light': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors, © CARTO'
            },
            'osm-backup': {
              type: 'raster',
              tiles: [
                'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [{
            id: 'base-map',
            type: 'raster',
            source: 'carto-light'
          }],
          glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
        },
        center: [72.5714, 23.0225],
        zoom: 13,
        maxZoom: 18,
        minZoom: 8
      });

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      // Handle map load
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setMapLoaded(true);
        setMapError('');
      });

      // Handle map errors
      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Map tiles failed to load. Using fallback mode.');
        
        // Try to switch to backup tiles
        if (map.current) {
          try {
            map.current.removeLayer('base-map');
            map.current.addLayer({
              id: 'backup-map',
              type: 'raster',
              source: 'osm-backup'
            });
          } catch (err) {
            console.error('Failed to switch to backup tiles:', err);
          }
        }
      });

      // Handle click events
      map.current.on('click', (e) => {
        analyze(e.lngLat.lat, e.lngLat.lng);
      });

      // Handle source errors
      map.current.on('sourcedata', (e) => {
        if (e.isSourceLoaded && e.sourceId === 'carto-light') {
          console.log('Tiles loaded successfully');
        }
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError('Failed to initialize map. Please refresh the page.');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const analyze = async (latitude: number, longitude: number) => {
    setLoading(true);
    
    try {
      console.log('Analyzing location:', latitude, longitude);
      
      const res = await fetch('http://localhost:8000/api/v1/enhanced/score', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ lat: latitude, lng: longitude, use_case: useCase })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const result = await res.json();
      console.log('Analysis result:', result);
      setData(result);
      setLat(latitude.toString());
      setLng(longitude.toString());
      
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      // Add new marker if map is loaded
      if (map.current && mapLoaded) {
        const marker = new maplibregl.Marker({ 
          color: result.composite_score >= 70 ? '#10b981' : 
                 result.composite_score >= 50 ? '#f59e0b' : '#ef4444'
        })
        .setLngLat([longitude, latitude])
        .addTo(map.current);
        
        markersRef.current.push(marker);
      }
        
    } catch (err) {
      console.error('Error analyzing location:', err);
      alert(`Error analyzing location: ${(err as Error).message}`);
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
        alert('Please enter coordinates within the Ahmedabad area (Lat: 22.8-23.2, Lng: 72.3-72.8)');
        return;
      }
      
      if (map.current && mapLoaded) {
        map.current.flyTo({ center: [longitude, latitude], zoom: 14, duration: 1500 });
        setTimeout(() => analyze(latitude, longitude), 1500);
      } else {
        // If map is not loaded, analyze directly
        analyze(latitude, longitude);
      }
    } else {
      alert('Please enter valid coordinates');
    }
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
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
        
        {/* Map Error Overlay */}
        {mapError && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
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
                Map Loading Issue
              </h2>
              <p style={{ color: '#666', fontSize: '16px', marginBottom: '24px', lineHeight: 1.5 }}>
                {mapError} You can still analyze locations using coordinates in the sidebar.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #007bff, #0056b3)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🔄 Reload Page
              </button>
            </div>
          </div>
        )}
        
        {/* Loading Overlay */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: 30,
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 2000
          }}>
            <div style={{ fontSize: 48, marginBottom: 10, textAlign: 'center' }}>⏳</div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>Analyzing Site Readiness...</div>
          </div>
        )}

        {/* Map Status Indicator */}
        {!mapError && (
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: mapLoaded ? '#10b981' : '#f59e0b',
            color: 'white',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 'bold',
            zIndex: 1000
          }}>
            {mapLoaded ? '✅ Map Ready' : '⏳ Loading Map...'}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div style={{
        width: 450,
        background: '#f8fafc',
        borderLeft: '1px solid #e2e8f0',
        overflowY: 'auto',
        padding: 20
      }}>
        <h1 style={{ margin: '0 0 20px', fontSize: 24, fontWeight: 'bold', color: '#1e293b' }}>
          🌍 GeoSpatial Site Readiness Analyzer
        </h1>

        {/* Search */}
        <div style={{ background: 'white', padding: 20, borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#475569' }}>
              Use Case
            </label>
            <select
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              style={{ width: '100%', padding: 10, border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}
            >
              <option value="retail">🏪 Retail Store</option>
              <option value="office">🏢 Office Space</option>
              <option value="warehouse">🏭 Warehouse</option>
              <option value="restaurant">🍽️ Restaurant</option>
              <option value="residential">🏠 Residential</option>
              <option value="industrial">🏗️ Industrial</option>
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#475569' }}>
              Latitude
            </label>
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              style={{ width: '100%', padding: 10, border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}
            />
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#475569' }}>
              Longitude
            </label>
            <input
              type="text"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              style={{ width: '100%', padding: 10, border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}
            />
          </div>
          
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              width: '100%',
              padding: 14,
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Analyzing...' : `🔍 Analyze ${getUseCaseIcon(useCase)} Site`}
          </button>
          
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 12, marginBottom: 0 }}>
            💡 {mapLoaded ? 'Click anywhere on the map to analyze site readiness' : 'Enter coordinates above to analyze locations'}
          </p>
        </div>

        {/* Results */}
        {data && (
          <>
            {/* Overall Score */}
            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 12,
              marginBottom: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>Site Readiness Score</div>
              <div style={{
                fontSize: 56,
                fontWeight: 'bold',
                color: getScoreColor(data.composite_score),
                lineHeight: 1
              }}>
                {data.composite_score}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>out of 100</div>
              <div style={{ fontSize: 14, color: '#64748b', marginTop: 8 }}>
                {getUseCaseIcon(data.use_case)} {data.use_case.charAt(0).toUpperCase() + data.use_case.slice(1)} Development
              </div>
            </div>

            {/* Recommendation */}
            <div style={{
              background: data.composite_score >= 70 ? '#d1fae5' : data.composite_score >= 55 ? '#fef3c7' : '#fee2e2',
              padding: 20,
              borderRadius: 12,
              marginBottom: 20,
              border: `2px solid ${data.composite_score >= 70 ? '#10b981' : data.composite_score >= 55 ? '#f59e0b' : '#ef4444'}`
            }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#1e293b' }}>
                {data.recommendation.verdict}
              </div>
              <p style={{ fontSize: 14, color: '#475569', marginBottom: 12, lineHeight: 1.6 }}>
                {data.recommendation.summary}
              </p>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                ✅ {data.recommendation.action}
              </div>
              {data.recommendation.strengths && data.recommendation.strengths.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#059669', marginBottom: 4 }}>Strengths:</div>
                  {data.recommendation.strengths.map((strength: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: '#059669' }}>• {strength}</div>
                  ))}
                </div>
              )}
              {data.recommendation.weaknesses && data.recommendation.weaknesses.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>Considerations:</div>
                  {data.recommendation.weaknesses.map((weakness: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: '#dc2626' }}>• {weakness}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Analysis Categories */}
            {data.analysis && (
              <>
                {/* Demographics */}
                <div style={{ background: 'white', padding: 20, borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ margin: '0 0 15px', fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>
                    📊 Demographics ({data.analysis.demographics.score}/100)
                  </h3>
                  <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Population</span>
                      <strong>{data.analysis.demographics.population.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Area Type</span>
                      <strong>{data.analysis.demographics.area_type}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Avg Income</span>
                      <strong>₹{data.analysis.demographics.income.toLocaleString()}/year</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ color: '#64748b' }}>Market Potential</span>
                      <strong>{data.analysis.demographics.market_potential}</strong>
                    </div>
                  </div>
                </div>

                {/* Transport */}
                <div style={{ background: 'white', padding: 20, borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ margin: '0 0 15px', fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>
                    🚗 Transport & Accessibility ({data.analysis.transport.score}/100)
                  </h3>
                  <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Highway Access</span>
                      <strong>{data.analysis.transport.highway_access}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Highway Distance</span>
                      <strong>{data.analysis.transport.highway_distance} km</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Airport Distance</span>
                      <strong>{data.analysis.transport.airport_distance} km</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ color: '#64748b' }}>Connectivity</span>
                      <strong>{data.analysis.transport.connectivity}</strong>
                    </div>
                  </div>
                </div>

                {/* Infrastructure */}
                <div style={{ background: 'white', padding: 20, borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ margin: '0 0 15px', fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>
                    🏗️ Infrastructure ({data.analysis.infrastructure.score}/100)
                  </h3>
                  <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Power Reliability</span>
                      <strong>{data.analysis.infrastructure.power_reliability}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Water Supply</span>
                      <strong>{data.analysis.infrastructure.water_supply}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Internet Speed</span>
                      <strong>{data.analysis.infrastructure.internet_speed} Mbps</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ color: '#64748b' }}>Overall Rating</span>
                      <strong>{data.analysis.infrastructure.overall_rating}</strong>
                    </div>
                  </div>
                </div>

                {/* Market Potential */}
                <div style={{ background: 'white', padding: 20, borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ margin: '0 0 15px', fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>
                    📈 Market Analysis ({data.analysis.market.score}/100)
                  </h3>
                  <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Competitors</span>
                      <strong>{data.analysis.market.competitors}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Market Saturation</span>
                      <strong>{data.analysis.market.market_saturation}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Foot Traffic</span>
                      <strong>{data.analysis.market.foot_traffic}/100</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ color: '#64748b' }}>Opportunity</span>
                      <strong>{data.analysis.market.market_opportunity}</strong>
                    </div>
                  </div>
                </div>

                {/* Environmental */}
                <div style={{ background: 'white', padding: 20, borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ margin: '0 0 15px', fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>
                    🌿 Environmental Factors ({data.analysis.environment.score}/100)
                  </h3>
                  <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Flood Risk</span>
                      <strong>{data.analysis.environment.flood_risk}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Air Quality</span>
                      <strong>{data.analysis.environment.air_quality}/100</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Safety Index</span>
                      <strong>{data.analysis.environment.safety_index}/100</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ color: '#64748b' }}>Environmental Rating</span>
                      <strong>{data.analysis.environment.environmental_rating}</strong>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}