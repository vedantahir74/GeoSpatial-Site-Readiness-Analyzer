import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<any>(null);
  const [lat, setLat] = useState('23.0225');
  const [lng, setLng] = useState('72.5714');
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    console.log('Initializing map...');

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm-bright': {
              type: 'raster',
              tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap'
            }
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm-bright',
              minzoom: 0,
              maxzoom: 19,
              paint: {
                'raster-opacity': 1,
                'raster-brightness-min': 0,
                'raster-brightness-max': 1,
                'raster-contrast': 0.2,
                'raster-saturation': 0.1
              }
            }
          ]
        },
        center: [72.5714, 23.0225],
        zoom: 13,
        pitch: 0,
        bearing: 0
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

      map.current.on('load', () => {
        console.log('Map loaded successfully!');
        setMapLoaded(true);
      });

      map.current.on('click', (e) => {
        console.log('Map clicked:', e.lngLat);
        analyze(e.lngLat.lat, e.lngLat.lng);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const analyze = async (latitude: number, longitude: number) => {
    console.log('Analyzing location:', latitude, longitude);
    setLoading(true);
    
    try {
      const res = await fetch('http://localhost:8000/api/v1/score/point', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: latitude, lng: longitude, use_case: 'retail' })
      });
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Score data:', data);
      setScore(data);
      
      // Add marker
      new maplibregl.Marker({ color: '#3b82f6', scale: 1.2 })
        .setLngLat([longitude, latitude])
        .addTo(map.current!);

      // Create detailed popup
      const rec = data.recommendation || {};
      const demo = data.layer_details?.demographics || {};
      const trans = data.layer_details?.transport || {};
      const poi = data.layer_details?.poi || {};
      
      const popupHTML = `
        <div style="padding:20px;min-width:350px;max-width:400px;font-family:system-ui;background:#fff">
          <div style="border-bottom:3px solid ${rec.color === 'green' ? '#10b981' : rec.color === 'blue' ? '#3b82f6' : rec.color === 'yellow' ? '#f59e0b' : '#ef4444'};padding-bottom:15px;margin-bottom:15px">
            <h3 style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#1e293b">
              🏪 Clothes Shop Analysis
            </h3>
            <div style="font-size:14px;color:#64748b">
              ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E
            </div>
          </div>
          
          <div style="text-align:center;margin-bottom:20px;padding:15px;background:#f8fafc;border-radius:10px">
            <div style="font-size:14px;color:#64748b;margin-bottom:5px">Site Score</div>
            <div style="font-size:48px;font-weight:bold;color:${rec.color === 'green' ? '#10b981' : rec.color === 'blue' ? '#3b82f6' : rec.color === 'yellow' ? '#f59e0b' : '#ef4444'}">
              ${data.composite_score.toFixed(1)}
            </div>
            <div style="font-size:16px;font-weight:600;color:${rec.color === 'green' ? '#10b981' : rec.color === 'blue' ? '#3b82f6' : rec.color === 'yellow' ? '#f59e0b' : '#ef4444'};margin-top:5px">
              ${rec.verdict || 'Analyzing...'}
            </div>
          </div>
          
          <div style="margin-bottom:15px">
            <div style="font-size:14px;font-weight:600;color:#1e293b;margin-bottom:10px">📊 Key Insights:</div>
            ${(rec.insights || []).map((insight: string) => `
              <div style="font-size:13px;color:#475569;padding:6px 0;line-height:1.5">
                ${insight}
              </div>
            `).join('')}
          </div>
          
          <div style="border-top:1px solid #e2e8f0;padding-top:15px;margin-top:15px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
              <div style="background:#f1f5f9;padding:10px;border-radius:6px">
                <div style="color:#64748b;margin-bottom:4px">👥 Population</div>
                <div style="font-weight:bold;color:#1e293b">${(demo.total_population || 0).toLocaleString()}</div>
              </div>
              <div style="background:#f1f5f9;padding:10px;border-radius:6px">
                <div style="color:#64748b;margin-bottom:4px">💰 Income Level</div>
                <div style="font-weight:bold;color:#1e293b">${demo.income_level || 'N/A'}</div>
              </div>
              <div style="background:#f1f5f9;padding:10px;border-radius:6px">
                <div style="color:#64748b;margin-bottom:4px">🏪 Clothes Shops</div>
                <div style="font-weight:bold;color:#1e293b">${poi.clothes_shops_nearby || 0} nearby</div>
              </div>
              <div style="background:#f1f5f9;padding:10px;border-radius:6px">
                <div style="color:#64748b;margin-bottom:4px">🛣️ Highway</div>
                <div style="font-weight:bold;color:#1e293b">${trans.nearest_highway_km ? trans.nearest_highway_km.toFixed(1) + ' km' : 'N/A'}</div>
              </div>
            </div>
          </div>
          
          <div style="border-top:1px solid #e2e8f0;padding-top:15px;margin-top:15px">
            <div style="font-size:13px;font-weight:600;color:#1e293b;margin-bottom:8px">Layer Scores:</div>
            <div style="font-size:12px;line-height:2">
              <div style="display:flex;justify-content:space-between">
                <span style="color:#64748b">📊 Demographics</span>
                <strong style="color:#3b82f6">${data.layer_scores.demographics.toFixed(1)}</strong>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="color:#64748b">🚗 Transport</span>
                <strong style="color:#3b82f6">${data.layer_scores.transport.toFixed(1)}</strong>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="color:#64748b">🏪 POI</span>
                <strong style="color:#3b82f6">${data.layer_scores.poi.toFixed(1)}</strong>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="color:#64748b">🏗️ Land Use</span>
                <strong style="color:#3b82f6">${data.layer_scores.land_use.toFixed(1)}</strong>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="color:#64748b">🌳 Environment</span>
                <strong style="color:#3b82f6">${data.layer_scores.environment.toFixed(1)}</strong>
              </div>
            </div>
          </div>
        </div>
      `;

      new maplibregl.Popup({ 
        closeButton: true,
        maxWidth: '400px',
        className: 'custom-popup'
      })
        .setLngLat([longitude, latitude])
        .setHTML(popupHTML)
        .addTo(map.current!);
        
    } catch (err) {
      console.error('Error analyzing location:', err);
      alert('Error analyzing location. Make sure backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = () => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      alert('Please enter valid numbers');
      return;
    }
    
    if (map.current) {
      map.current.flyTo({ 
        center: [longitude, latitude], 
        zoom: 15,
        duration: 2000
      });
      setTimeout(() => analyze(latitude, longitude), 2000);
    }
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#f8fafc'
    }}>
      <div 
        ref={mapContainer} 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          filter: 'brightness(1.05) contrast(1.1)'
        }} 
      />
      
      {/* Control Panel */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(255,255,255,0.98)',
        padding: 25,
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        width: 340,
        maxHeight: 'calc(100vh - 40px)',
        overflow: 'auto',
        border: '1px solid rgba(255,255,255,0.8)'
      }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 'bold', color: '#1e293b' }}>
          🏪 Clothes Shop Analyzer
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
          Find the perfect location for your clothes shop
        </p>
        
        {!mapLoaded && (
          <div style={{ 
            padding: 12, 
            background: '#fef3c7', 
            borderRadius: 8, 
            marginBottom: 15,
            fontSize: 14,
            color: '#92400e',
            border: '1px solid #fde68a'
          }}>
            ⏳ Loading map...
          </div>
        )}
        
        {mapLoaded && (
          <div style={{ 
            padding: 12, 
            background: '#d1fae5', 
            borderRadius: 8, 
            marginBottom: 15,
            fontSize: 14,
            color: '#065f46',
            border: '1px solid #a7f3d0'
          }}>
            ✅ Map ready! Click anywhere
          </div>
        )}
        
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#475569' }}>
            Latitude
          </label>
          <input
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="23.0225"
            style={{ 
              width: '100%', 
              padding: 12, 
              border: '2px solid #e5e7eb', 
              borderRadius: 8,
              fontSize: 15,
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#475569' }}>
            Longitude
          </label>
          <input
            type="text"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="72.5714"
            style={{ 
              width: '100%', 
              padding: 12, 
              border: '2px solid #e5e7eb', 
              borderRadius: 8,
              fontSize: 15,
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
        
        <button
          onClick={handleAnalyze}
          disabled={loading || !mapLoaded}
          style={{
            width: '100%',
            padding: 14,
            background: loading || !mapLoaded ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: loading || !mapLoaded ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            boxShadow: loading || !mapLoaded ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.4)'
          }}
        >
          {loading ? '⏳ Analyzing...' : '🔍 Analyze Location'}
        </button>
        
        <div style={{ 
          marginTop: 20, 
          paddingTop: 20, 
          borderTop: '2px solid #e5e7eb',
          fontSize: 13,
          color: '#64748b',
          lineHeight: '1.6'
        }}>
          <p style={{ margin: '0 0 10px', fontWeight: 600, color: '#475569' }}>
            💡 How to use:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Click anywhere on the map</li>
            <li>Or enter coordinates above</li>
            <li>Get instant business insights</li>
          </ul>
        </div>
      </div>
      
      {/* Score Display */}
      {score && !loading && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'rgba(255,255,255,0.98)',
          padding: 20,
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          border: '1px solid rgba(255,255,255,0.8)'
        }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 600 }}>
            Current Site Score
          </div>
          <div style={{ fontSize: 42, fontWeight: 'bold', color: '#3b82f6', lineHeight: 1 }}>
            {score.composite_score.toFixed(1)}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
            {score.recommendation?.verdict || 'out of 100'}
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
          background: 'rgba(255,255,255,0.98)',
          padding: 40,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          zIndex: 2000,
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: 64, marginBottom: 15, animation: 'pulse 1.5s ease-in-out infinite' }}>
            🔍
          </div>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 }}>
            Analyzing Location...
          </div>
          <div style={{ fontSize: 14, color: '#64748b' }}>
            Calculating business potential
          </div>
        </div>
      )}
    </div>
  );
}
