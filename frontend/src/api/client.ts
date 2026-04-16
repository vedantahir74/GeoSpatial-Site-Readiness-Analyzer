import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const scoreApi = {
  getPointScore: (lat: number, lng: number, weights?: Record<string, number>, useCase?: string) =>
    apiClient.post('/api/v1/score/point', { lat, lng, weights, use_case: useCase }),
  
  getBatchScore: (points: { lat: number; lng: number }[], weights?: Record<string, number>, useCase?: string) =>
    apiClient.post('/api/v1/score/batch', { points, weights, use_case: useCase }),
  
  getHexGrid: (resolution: number = 8, useCase?: string) =>
    apiClient.get(`/api/v1/score/hex-grid?resolution=${resolution}&use_case=${useCase || ''}`),
  
  getIsochrone: (lat: number, lng: number, modes: string[] = ['drive'], minutes: number[] = [10, 20, 30]) =>
    apiClient.post('/api/v1/score/isochrone', { lat, lng, modes, minutes }),
}

export const layerApi = {
  getDemographics: () => apiClient.get('/api/v1/layers/demographics'),
  getRoads: () => apiClient.get('/api/v1/layers/roads'),
  getPoi: (category?: string) => apiClient.get(`/api/v1/layers/poi${category ? `?category=${category}` : ''}`),
  getLandUse: () => apiClient.get('/api/v1/layers/land-use'),
  getEnvironment: () => apiClient.get('/api/v1/layers/environment'),
}

export const clusterApi = {
  getHotspots: (resolution: number = 8, useCase?: string) =>
    apiClient.get(`/api/v1/clusters/hotspots?resolution=${resolution}&use_case=${useCase || ''}`),
  getHexGrid: (resolution: number = 8) =>
    apiClient.get(`/api/v1/clusters/hex-grid?resolution=${resolution}`),
}

export const siteApi = {
  saveSite: (data: { lat: number; lng: number; name: string; description?: string; useCase?: string; weights?: Record<string, number> }) =>
    apiClient.post('/api/v1/sites/save', data),
  getSites: () => apiClient.get('/api/v1/sites/'),
  getSite: (id: number) => apiClient.get(`/api/v1/sites/${id}`),
  compareSites: (siteIds: number[]) => apiClient.post('/api/v1/sites/compare', siteIds),
}

export const exportApi = {
  getWeightConfigs: () => apiClient.get('/api/v1/export/weights'),
  getSiteReport: (siteId: number) => apiClient.get(`/api/v1/export/site-report/${siteId}`, { responseType: 'blob' }),
}