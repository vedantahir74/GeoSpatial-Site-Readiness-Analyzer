import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function SimpleMapTest() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    console.log('Initializing map...');
    
    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
              ],
              tileSize: 256
            }
          },
          layers: [{
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }],
          glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
        },
        center: [72.5714, 23.0225],
        zoom: 13
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        console.log('Map loaded successfully');
      });

      map.current.on('click', (e) => {
        console.log('Map clicked at:', e.lngLat.lat, e.lngLat.lng);
        testAPI(e.lngLat.lat, e.lngLat.lng);
      });

      console.log('Map initialization complete');
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Map initialization failed: ' + (err as Error).message);
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  const testAPI = async (lat: number, lng: number) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Testing API with coordinates:', lat, lng);
      
      const response = await fetch('http://localhost:8000/api/v1/enhanced/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, use_case: 'retail' })
      });
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('API Response data:', result);
      
      setData(result);
      
      // Add marker
      if (map.current) {
        new maplibregl.Marker({ color: '#ef4444' })
          .setLngLat([lng, lat])
          .addTo(map.current);
      }
        
    } catch (err) {
      console.error('API Error:', err);
      setError('API Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestClick = () => {
    testAPI(23.0225, 72.5714);
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
        
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: 20,
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 1000
          }}>
            Loading...
          </div>
        )}
      </div>

      {/* Debug Panel */}
      <div style={{
        width: 400,
        background: '#f5f5f5',
        padding: 20,
        overflowY: 'auto'
      }}>
        <h2>Debug Panel</h2>
        
        <button 
          onClick={handleTestClick}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            marginBottom: 20
          }}
        >
          Test API Call
        </button>

        {error && (
          <div style={{ 
            background: '#ffebee', 
            color: '#c62828', 
            padding: 10, 
            borderRadius: 4,
            marginBottom: 20
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {data && (
          <div>
            <h3>API Response:</h3>
            <div style={{ 
              background: 'white', 
              padding: 10, 
              borderRadius: 4,
              fontSize: 12,
              fontFamily: 'monospace'
            }}>
              <div><strong>Score:</strong> {data.composite_score}</div>
              <div><strong>Use Case:</strong> {data.use_case}</div>
              <div><strong>Verdict:</strong> {data.recommendation?.verdict}</div>
              <hr />
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        )}

        <div style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
          <p>Instructions:</p>
          <ul>
            <li>Click "Test API Call" button</li>
            <li>Or click anywhere on the map</li>
            <li>Check browser console for detailed logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}