import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function ProfessionalMapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [useCase, setUseCase] = useState('retail');
  const [lat, setLat] = useState('23.0225');
  const [lng, setLng] = useState('72.5714');
  const markersR