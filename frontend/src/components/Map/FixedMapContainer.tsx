import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function FixedMapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string>('');

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    console.log('Initializing map...');
    
    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
              maxzoom: 19
            }
          },
          layers: [{
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 22
          }],
          glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
        },
        center: [72.5714, 23.0225], // Ahmedabad coordinates
        zoom: 11,
        pitch: 0,
        bearing: 0,
        antialias: true
      });

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      // Map load event
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setMapLoaded(true);
        setMapError('');
      });

      // Map error event
      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Map failed to load. Please check your internet connection.');
      });

      // Map click event
      map.current.on('click', (e) => {
        console.log('Map clicked at:', e.lngLat.lat, e.lngLat.lng);
        analyzeLocation(e.lngLat.lat, e.lngLat.lng);
      });

      // Source error events
      map.current.on('sourcedataloading', () => {
        console.log('Loading map tiles...');
      });

      map.current.on('sourcedata', (e) => {
        if (e.isSourceLoaded) {
          console.log('Map tiles loaded');
        }
      });

    } catch (err) {
      console.error('Map initialization error:', err);
      setMapError('Failed to initialize map: ' + (err as Error).message);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const analyzeLocation = async (lat: number, lng: number) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Analyzing location:', lat, lng);
      
      const response = await fetch('http://localhost:8000/api/v1/enhanced/score', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          lat: lat, 
          lng: lng, 
          use_case: 'retail' 
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
      
      // Add marker to map
      if (map.current) {
        new maplibregl.Marker({ 
          color: '#ff4444',
          scale: 1.2
        })
        .setLngLat([lng, lat])
        .addTo(map.current);
      }
        
    } catch (err) {
      console.error('Error analyzing location:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const testAPI = () => {
    analyzeLocation(23.0225, 72.5714);
  };

  const retryMap = () => {
    setMapError('');
    setMapLoaded(false);
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    // Trigger re-initialization
    window.location.reload();
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', fontFamily: 'Arial, sans-serif' }}>
      {/* Map Container */}
      <div style={{ flex: 1, position: 'relative', background: '#f0f0f0' }}>
        <div 
          ref={mapContainer} 
          style={{ 
            width: '100%', 
            height: '100%',
            background: '#e6f3ff'
          }}
        />
        
        {/* Loading overlay */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '6px',
            zIndex: 1000,
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            🔍 Analyzing location...
          </div>
        )}

        {/* Map loading indicator */}
        {!mapLoaded && !mapError && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 1000,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🗺️</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Loading Map...</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Please wait while we load the map tiles</div>
          </div>
        )}

        {/* Map error indicator */}
        {mapError && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 1000,
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#d32f2f' }}>
              Map Loading Error
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              {mapError}
            </div>
            <button 
              onClick={retryMap}
              style={{
                padding: '10px 20px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Retry Loading Map
            </button>
          </div>
        )}
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

        <button 
          onClick={testAPI}
          disabled={loading || !mapLoaded}
          style={{
            width: '100%',
            padding: '14px',
            background: loading || !mapLoaded ? '#6c757d' : 'linear-gradient(135deg, #007bff, #0056b3)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading || !mapLoaded ? 'not-allowed' : 'pointer',
            marginBottom: '20px',
            transition: 'all 0.2s'
          }}
        >
          {loading ? '🔍 Analyzing...' : '🎯 Test Analysis (Ahmedabad)'}
        </button>

        <div style={{
          background: '#e3f2fd',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #bbdefb'
        }}>
          <div style={{ fontSize: '14px', color: '#1565c0', fontWeight: 'bold', marginBottom: '8px' }}>
            📍 How to Use:
          </div>
          <ul style={{ fontSize: '13px', color: '#1976d2', margin: '0', paddingLeft: '16px' }}>
            <li>Click anywhere on the map to analyze that location</li>
            <li>Use the test button above for a quick demo</li>
            <li>View comprehensive site analysis results</li>
            <li>Different locations show different scores</li>
          </ul>
        </div>

        {/* Map Status */}
        <div style={{
          background: mapLoaded ? '#d4edda' : '#fff3cd',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px',
          border: `1px solid ${mapLoaded ? '#c3e6cb' : '#ffeaa7'}`
        }}>
          <div style={{ 
            fontSize: '14px', 
            color: mapLoaded ? '#155724' : '#856404',
            fontWeight: 'bold'
          }}>
            Map Status: {mapLoaded ? '✅ Ready' : '⏳ Loading...'}
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
                color: data.composite_score >= 70 ? '#28a745' : 
                       data.composite_score >= 50 ? '#ffc107' : '#dc3545',
                margin: '12px 0',
                lineHeight: 1
              }}>
                {data.composite_score}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>out of 100</div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                📍 {data.location?.latitude?.toFixed(4)}, {data.location?.longitude?.toFixed(4)}
              </div>
            </div>

            {/* Recommendation */}
            {data.recommendation && (
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '16px' }}>
                  📋 Recommendation
                </h4>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '8px',
                  color: data.composite_score >= 70 ? '#28a745' : 
                         data.composite_score >= 50 ? '#ffc107' : '#dc3545'
                }}>
                  {data.recommendation.verdict}
                </div>
                <div style={{ fontSize: '14px', color: '#666', lineHeight: 1.4 }}>
                  {data.recommendation.summary}
                </div>
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
                  📊 Analysis Breakdown
                </h4>
                
                {Object.entries(data.analysis).map(([key, value]: [string, any]) => (
                  <div key={key} style={{ marginBottom: '12px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {key === 'demographics' ? '👥 Demographics' :
                         key === 'transport' ? '🚗 Transport' :
                         key === 'infrastructure' ? '🏗️ Infrastructure' :
                         key === 'market' ? '📈 Market' :
                         key === 'environment' ? '🌿 Environment' : key}:
                      </span>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: value.score >= 70 ? '#28a745' : 
                               value.score >= 50 ? '#ffc107' : '#dc3545'
                      }}>
                        {value.score}/100
                      </span>
                    </div>
                    {value.analysis && (
                      <div style={{ fontSize: '12px', color: '#666', paddingLeft: '8px' }}>
                        {value.analysis}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}