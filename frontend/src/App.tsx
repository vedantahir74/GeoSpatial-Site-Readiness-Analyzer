import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Add CSS for loading spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default function App() {
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
  const [mapMode, setMapMode] = useState<'online' | 'offline'>('online');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (map.current) {
        setTimeout(() => map.current?.resize(), 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-switch to offline mode if online map fails to load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapLoaded && mapMode === 'online') {
        setMapMode('offline');
        setMapLoaded(true);
        setMapError('Switched to offline mode');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [mapLoaded, mapMode]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const initializeMap = async () => {
      try {
        // Wait for container to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!mapContainer.current) return;

        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              'osm': {
                type: 'raster',
                tiles: [
                  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors'
              }
            },
            layers: [
              {
                id: 'osm-layer',
                type: 'raster',
                source: 'osm'
              }
            ]
          },
          center: [72.5714, 23.0225], // Ahmedabad
          zoom: 12,
          maxZoom: 18,
          minZoom: 2,
          attributionControl: false
        });

        // Add controls
        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
        map.current.addControl(new maplibregl.AttributionControl({
          compact: true
        }), 'bottom-right');

        // Handle successful load
        map.current.on('load', () => {
          console.log('Map loaded successfully');
          setMapLoaded(true);
          setMapError('');
        });

        // Handle style load (more reliable than 'load')
        map.current.on('styledata', () => {
          if (map.current?.isStyleLoaded()) {
            console.log('Map style loaded');
            setMapLoaded(true);
            setMapError('');
          }
        });

        // Handle any errors
        map.current.on('error', (e) => {
          console.warn('Map error:', e);
          setMapLoaded(true); // Still allow interaction
          setMapError('Map tiles may be slow to load');
        });

        // Handle click events
        map.current.on('click', (e) => {
          const { lat, lng } = e.lngLat;
          analyze(lat, lng);
        });

        // Force map to be considered loaded after 2 seconds
        setTimeout(() => {
          setMapLoaded(true);
          if (mapError) setMapError('');
        }, 2000);

      } catch (error) {
        console.error('Map initialization error:', error);
        setMapLoaded(true);
        setMapError('Map initialization failed - using coordinate input');
      }
    };

    initializeMap();

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
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      setLat(latitude.toString());
      setLng(longitude.toString());
      
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      // Add new marker
      if (map.current) {
        const markerColor = result.composite_score >= 70 ? '#10b981' : 
                           result.composite_score >= 50 ? '#f59e0b' : '#ef4444';
        
        const marker = new maplibregl.Marker({ color: markerColor })
          .setLngLat([longitude, latitude])
          .addTo(map.current);
        
        markersRef.current.push(marker);
      }
        
    } catch (err) {
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = () => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (!isNaN(latitude) && !isNaN(longitude)) {
      if (latitude < 20.0 || latitude > 24.8 || longitude < 68.0 || longitude > 74.6) {
        alert('Please enter coordinates within Gujarat (Lat: 20.0-24.8, Lng: 68.0-74.6)');
        return;
      }
      
      if (map.current) {
        map.current.flyTo({ center: [longitude, latitude], zoom: 14, duration: 1500 });
        setTimeout(() => analyze(latitude, longitude), 1500);
      } else {
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

  return (
    <div style={{ 
      display: 'flex', 
      width: '100vw', 
      height: '100vh', 
      fontFamily: 'Arial, sans-serif',
      flexDirection: isMobile ? 'column' : 'row'
    }}>
      {/* Map Container */}
      <div style={{ 
        flex: 1, 
        position: 'relative', 
        background: '#f0f0f0',
        height: isMobile ? '60vh' : '100vh',
        minHeight: isMobile ? '400px' : 'auto'
      }}>
        {mapMode === 'online' ? (
          <>
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
            
            {!mapLoaded && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(240, 240, 240, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                zIndex: 500
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  border: '4px solid #e2e8f0',
                  borderTop: '4px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: 16
                }} />
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1565c0', marginBottom: 8 }}>
                  Loading Map...
                </div>
                <div style={{ fontSize: 14, color: '#1976d2', textAlign: 'center', maxWidth: 300 }}>
                  Initializing interactive map for Gujarat
                </div>
              </div>
            )}
          </>
        ) : (
          /* Offline Map */
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 50%, #e0f2fe 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Grid Background */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }} />
            
            {/* Gujarat Cities */}
            <div 
              onClick={() => analyze(23.0225, 72.5714)}
              style={{
                position: 'absolute',
                top: '40%',
                left: '45%',
                background: '#1976d2',
                color: 'white',
                padding: '8px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transform: 'translate(-50%, -50%)'
              }}
              title="Click to analyze Ahmedabad"
            >
              📍 Ahmedabad
            </div>
            
            <div 
              onClick={() => analyze(21.1702, 72.8311)}
              style={{
                position: 'absolute',
                top: '70%',
                left: '50%',
                background: '#388e3c',
                color: 'white',
                padding: '8px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transform: 'translate(-50%, -50%)'
              }}
              title="Click to analyze Surat"
            >
              🏭 Surat
            </div>
            
            <div 
              onClick={() => analyze(22.3072, 73.1812)}
              style={{
                position: 'absolute',
                top: '55%',
                left: '60%',
                background: '#f57c00',
                color: 'white',
                padding: '8px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transform: 'translate(-50%, -50%)'
              }}
              title="Click to analyze Vadodara"
            >
              🏛️ Vadodara
            </div>
            
            <div 
              onClick={() => analyze(22.3039, 70.8022)}
              style={{
                position: 'absolute',
                top: '60%',
                left: '25%',
                background: '#7b1fa2',
                color: 'white',
                padding: '8px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transform: 'translate(-50%, -50%)'
              }}
              title="Click to analyze Rajkot"
            >
              🏢 Rajkot
            </div>
            
            <div style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              right: 20,
              textAlign: 'center',
              color: '#64748b',
              fontSize: 14
            }}>
              🗺️ Offline Map Mode - Click cities or use coordinates in sidebar
            </div>
          </div>
        )}
        
        {/* Status */}
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
          {mapMode === 'offline' ? '🗺️ Offline Mode' : mapLoaded ? '✅ Map Ready' : '⏳ Loading...'}
        </div>

        {/* Map Mode Toggle */}
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => {
              if (map.current) {
                map.current.remove();
                map.current = null;
              }
              setMapLoaded(false);
              setMapError('');
              // Trigger re-initialization
              setTimeout(() => window.location.reload(), 100);
            }}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh Map
          </button>
          
          <button
            onClick={() => setMapMode(mapMode === 'online' ? 'offline' : 'online')}
            style={{
              background: mapMode === 'offline' ? '#10b981' : '#6b7280',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {mapMode === 'online' ? '📡 Switch to Offline' : '🌐 Switch to Online'}
          </button>
        </div>

        {mapError && (
          <div style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            right: 10,
            background: 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            padding: '12px',
            borderRadius: 8,
            fontSize: 14,
            zIndex: 1000,
            textAlign: 'center'
          }}>
            {mapError}
          </div>
        )}
        
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
            zIndex: 2000,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>⏳</div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>Analyzing Site...</div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div style={{
        width: isMobile ? '100%' : '420px',
        maxWidth: isMobile ? 'none' : '420px',
        background: '#f8fafc',
        borderLeft: isMobile ? 'none' : '1px solid #e2e8f0',
        borderTop: isMobile ? '1px solid #e2e8f0' : 'none',
        overflowY: 'auto',
        padding: isMobile ? '16px' : '20px',
        height: isMobile ? '40vh' : '100vh',
        minHeight: isMobile ? '300px' : 'auto'
      }}>
        <h1 style={{ 
          margin: '0 0 20px', 
          fontSize: isMobile ? '20px' : '24px', 
          fontWeight: 'bold', 
          color: '#1e293b'
        }}>
          Gujarat Site Analyzer
        </h1>

        {/* Controls */}
        <div style={{ 
          background: 'white', 
          padding: 20, 
          borderRadius: 12, 
          marginBottom: 20, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
        }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 6, 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#475569' 
            }}>
              Use Case
            </label>
            <select
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              style={{ 
                width: '100%', 
                padding: 12, 
                border: '2px solid #e2e8f0', 
                borderRadius: 8, 
                fontSize: 14,
                background: 'white'
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

          <div style={{ display: 'flex', gap: '12px', marginBottom: 16, flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 6, 
                fontSize: 14, 
                fontWeight: 600,
                color: '#475569' 
              }}>
                Latitude
              </label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: 12, 
                  border: '2px solid #e2e8f0', 
                  borderRadius: 8, 
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
                placeholder="23.0225"
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 6, 
                fontSize: 14, 
                fontWeight: 600, 
                color: '#475569' 
              }}>
                Longitude
              </label>
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: 12, 
                  border: '2px solid #e2e8f0', 
                  borderRadius: 8, 
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
                placeholder="72.5714"
              />
            </div>
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
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: 12
            }}
          >
            {loading ? '⏳ Analyzing...' : '🔍 Analyze Site'}
          </button>
          
          <p style={{ 
            fontSize: 12, 
            color: '#64748b', 
            margin: 0, 
            textAlign: 'center',
            lineHeight: 1.4
          }}>
            💡 Click anywhere on the map or enter coordinates above
          </p>

          <div style={{ marginTop: 16, padding: 12, background: '#f1f5f9', borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
              📍 Sample Locations:
            </div>
            <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
              • Ahmedabad: 23.0225, 72.5714<br/>
              • Surat: 21.1702, 72.8311<br/>
              • Vadodara: 22.3072, 73.1812<br/>
              • Rajkot: 22.3039, 70.8022
            </div>
          </div>
        </div>

        {/* Results */}
        {data && (
          <>
            {/* Overall Score */}
            <div style={{
              background: 'white',
              padding: isMobile ? '16px' : '20px',
              borderRadius: 12,
              marginBottom: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>
                Site Readiness Score
              </div>
              <div style={{
                fontSize: isMobile ? '36px' : '48px',
                fontWeight: 'bold',
                color: getScoreColor(data.composite_score),
                lineHeight: 1,
                marginBottom: 4
              }}>
                {data.composite_score}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>out of 100</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>
                {data.use_case?.charAt(0).toUpperCase() + data.use_case?.slice(1) || useCase.charAt(0).toUpperCase() + useCase.slice(1)} Development
              </div>
            </div>

            {/* Detailed Score Breakdown */}
            <div style={{
              background: 'white',
              padding: isMobile ? '16px' : '20px',
              borderRadius: 12,
              marginBottom: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                margin: '0 0 16px', 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: '#1e293b' 
              }}>
                Score Breakdown
              </h3>
              
              {/* Demographics Score */}
              {data.demographics && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: '600', color: '#475569' }}>
                      👥 Demographics
                    </span>
                    <span style={{ 
                      fontSize: 16, 
                      fontWeight: 'bold', 
                      color: getScoreColor(data.demographics.score) 
                    }}>
                      {data.demographics.score}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: 8,
                    background: '#e2e8f0',
                    borderRadius: 4,
                    overflow: 'hidden',
                    marginBottom: 8
                  }}>
                    <div style={{
                      width: `${data.demographics.score}%`,
                      height: '100%',
                      background: getScoreColor(data.demographics.score),
                      borderRadius: 4
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Population: {data.demographics.total_population?.toLocaleString() || 'N/A'} • 
                    Income: {data.demographics.income_level || 'N/A'} • 
                    Avg Income: ₹{data.demographics.avg_income?.toLocaleString() || 'N/A'}
                  </div>
                </div>
              )}

              {/* Shops/Competition Score */}
              {data.shops && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: '600', color: '#475569' }}>
                      🏪 Competition Analysis
                    </span>
                    <span style={{ 
                      fontSize: 16, 
                      fontWeight: 'bold', 
                      color: getScoreColor(data.shops.score) 
                    }}>
                      {data.shops.score}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: 8,
                    background: '#e2e8f0',
                    borderRadius: 4,
                    overflow: 'hidden',
                    marginBottom: 8
                  }}>
                    <div style={{
                      width: `${data.shops.score}%`,
                      height: '100%',
                      background: getScoreColor(data.shops.score),
                      borderRadius: 4
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Clothes Shops: {data.shops.clothes_shops_nearby || 0} • 
                    Total Retail: {data.shops.total_retail || 0} • 
                    Anchor Stores: {data.shops.anchor_stores || 0}
                  </div>
                </div>
              )}

              {/* Transport Score */}
              {data.transport && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: '600', color: '#475569' }}>
                      🛣️ Transport Access
                    </span>
                    <span style={{ 
                      fontSize: 16, 
                      fontWeight: 'bold', 
                      color: getScoreColor(data.transport.score) 
                    }}>
                      {data.transport.score}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: 8,
                    background: '#e2e8f0',
                    borderRadius: 4,
                    overflow: 'hidden',
                    marginBottom: 8
                  }}>
                    <div style={{
                      width: `${data.transport.score}%`,
                      height: '100%',
                      background: getScoreColor(data.transport.score),
                      borderRadius: 4
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Highway: {data.transport.closest_highway_km ? `${data.transport.closest_highway_km}km` : 'N/A'} • 
                    Access: {data.transport.highway_access_level || 'N/A'}
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Insights */}
            <div style={{
              background: 'white',
              padding: isMobile ? '16px' : '20px',
              borderRadius: 12,
              marginBottom: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                margin: '0 0 16px', 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: '#1e293b' 
              }}>
                Location Insights
              </h3>
              
              {data.demographics && (
                <div style={{ marginBottom: 12, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 4 }}>
                    📊 Demographics
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.4 }}>
                    • Population Density: {data.demographics.avg_density?.toLocaleString() || 'N/A'} people/km²<br/>
                    • Working Age: {data.demographics.working_age_pct || 'N/A'}%<br/>
                    • Zones Analyzed: {data.demographics.zones_analyzed || 0}
                  </div>
                </div>
              )}

              {data.shops && (
                <div style={{ marginBottom: 12, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 4 }}>
                    🏬 Competition Level
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.4 }}>
                    • {data.shops.competition_level || 'N/A'}<br/>
                    • Competitors: {data.shops.competitors || 0}<br/>
                    • Market Validation: {data.shops.clothes_shops_nearby > 0 ? 'Proven demand' : 'Untested market'}
                  </div>
                </div>
              )}

              {data.transport && (
                <div style={{ marginBottom: 12, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 4 }}>
                    🚗 Accessibility
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.4 }}>
                    • Nearest Highway: {data.transport.closest_highway_name || 'N/A'}<br/>
                    • Major Roads: {data.transport.major_roads_nearby || 0}<br/>
                    • Highways Nearby: {data.transport.highways_nearby || 0}
                  </div>
                </div>
              )}
            </div>

            {/* Recommendation */}
            <div style={{
              background: data.composite_score >= 70 ? '#d1fae5' : data.composite_score >= 55 ? '#fef3c7' : '#fee2e2',
              padding: 16,
              borderRadius: 12,
              marginBottom: 20,
              border: `2px solid ${data.composite_score >= 70 ? '#10b981' : data.composite_score >= 55 ? '#f59e0b' : '#ef4444'}`
            }}>
              <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#1e293b' }}>
                {data.recommendation?.recommendation || 'ANALYSIS COMPLETE'}
              </div>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 10, lineHeight: 1.5 }}>
                {data.recommendation?.reason || `Site analysis completed for ${data.business_type || useCase} development.`}
              </p>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                ✅ {data.recommendation?.action || 'Review detailed analysis'}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}