import { useState, useEffect } from 'react';
import EnhancedMapContainer from './EnhancedMapContainer';
import SimpleMapFallback from './SimpleMapFallback';

export default function MapWithFallback() {
  const [useMap, setUseMap] = useState(true);
  const [mapFailed, setMapFailed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkMapSupport = async () => {
      try {
        // Check WebGL support
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
          console.warn('WebGL not supported, using fallback mode');
          setUseMap(false);
          setMapFailed(true);
          setChecking(false);
          return;
        }

        // Check if we can load map tiles
        const testTileLoad = () => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => reject(false);
            img.src = 'https://a.basemaps.cartocdn.com/light_all/0/0/0.png';
            
            // Timeout after 5 seconds
            setTimeout(() => reject(false), 5000);
          });
        };

        try {
          await testTileLoad();
          console.log('Map tiles accessible');
          setChecking(false);
        } catch {
          console.warn('Map tiles not accessible, using fallback');
          setUseMap(false);
          setMapFailed(true);
          setChecking(false);
        }
      } catch (error) {
        console.error('Error checking map support:', error);
        setUseMap(false);
        setMapFailed(true);
        setChecking(false);
      }
    };

    checkMapSupport();
  }, []);

  if (checking) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗺️</div>
          <h2 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '24px' }}>
            Loading GeoSpatial Analyzer
          </h2>
          <div style={{ fontSize: '16px', color: '#666' }}>
            Checking map compatibility...
          </div>
        </div>
      </div>
    );
  }

  if (!useMap || mapFailed) {
    return <SimpleMapFallback />;
  }

  return (
    <div>
      <EnhancedMapContainer />
      {/* Fallback button */}
      <button
        onClick={() => setUseMap(false)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          padding: '10px 15px',
          background: '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          fontSize: 12,
          cursor: 'pointer',
          zIndex: 10000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
        title="Switch to coordinate-based mode if map is not working"
      >
        🔄 Use Coordinate Mode
      </button>
    </div>
  );
}