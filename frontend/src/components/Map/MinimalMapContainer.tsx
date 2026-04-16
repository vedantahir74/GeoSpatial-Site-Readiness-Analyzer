import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MinimalMapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    console.log('Initializing map...');
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [{
          id: 'osm',
          type: 'raster',
          source: 'osm'
        }]
      },
      center: [72.5714, 23.0225], // Ahmedabad coordinates
      zoom: 12
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      console.log('Map loaded successfully');
      setMapLoaded(true);
    });

    map.current.on('click', (e) => {
      console.log('Map clicked at:', e.lngLat.lat, e.lngLat.lng);
      analyzeLocation(e.lngLat.lat, e.lngLat.lng);
    });

    return () => {
      map.current?.remove();
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
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      
      setData(result);
      
      // Add marker to map
      if (map.current) {
        new maplibregl.Marker({ color: '#ff0000' })
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

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* Map Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div 
          ref={mapContainer} 
          style={{ width: '100%', height: '100%' }}
        />
        
        {loading && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            zIndex: 1000
          }}>
            Analyzing location...
          </div>
        )}

        {!mapLoaded && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: 1000
          }}>
            Loading map...
          </div>
        )}
      </div>

      {/* Results Panel */}
      <div style={{
        width: '400px',
        background: '#f8f9fa',
        padding: '20px',
        overflowY: 'auto',
        borderLeft: '1px solid #dee2e6'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
          🌍 GeoSpatial Site Analyzer
        </h2>

        <button 
          onClick={testAPI}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '20px'
          }}
        >
          {loading ? 'Analyzing...' : 'Test API (Ahmedabad Center)'}
        </button>

        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          Click anywhere on the map or use the test button above to analyze a location.
        </p>

        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {data && (
          <div>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Site Readiness Score</h3>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: data.composite_score >= 70 ? '#28a745' : data.composite_score >= 50 ? '#ffc107' : '#dc3545',
                margin: '10px 0'
              }}>
                {data.composite_score}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>out of 100</div>
            </div>

            {data.recommendation && (
              <div style={{
                background: 'white',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Recommendation</h4>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  {data.recommendation.verdict}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {data.recommendation.summary}
                </div>
              </div>
            )}

            {data.analysis && (
              <div style={{
                background: 'white',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Analysis Breakdown</h4>
                
                {data.analysis.demographics && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Demographics:</strong> {data.analysis.demographics.score}/100
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Population: {data.analysis.demographics.population?.toLocaleString()}
                    </div>
                  </div>
                )}

                {data.analysis.transport && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Transport:</strong> {data.analysis.transport.score}/100
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Highway Access: {data.analysis.transport.highway_access}
                    </div>
                  </div>
                )}

                {data.analysis.infrastructure && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Infrastructure:</strong> {data.analysis.infrastructure.score}/100
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Rating: {data.analysis.infrastructure.overall_rating}
                    </div>
                  </div>
                )}

                {data.analysis.market && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Market:</strong> {data.analysis.market.score}/100
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Competitors: {data.analysis.market.competitors}
                    </div>
                  </div>
                )}

                {data.analysis.environment && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Environment:</strong> {data.analysis.environment.score}/100
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Rating: {data.analysis.environment.environmental_rating}
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