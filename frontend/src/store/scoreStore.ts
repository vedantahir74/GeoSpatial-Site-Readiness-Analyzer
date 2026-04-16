import { create } from 'zustand';

interface ScoreData {
  composite_score: number;
  layer_scores: {
    demographics: number;
    transport: number;
    poi: number;
    land_use: number;
    environment: number;
  };
  layer_details?: any;
  weights_used: {
    demographics: number;
    transport: number;
    poi: number;
    land_use: number;
    environment: number;
  };
  location: {
    latitude: number;
    longitude: number;
  };
}

interface ScoreState {
  activeScore: ScoreData | null;
  isLoading: boolean;
  error: string | null;
  weights: {
    demographics: number;
    transport: number;
    poi: number;
    land_use: number;
    environment: number;
  };
  useCase: string | null;
  setActiveScore: (score: ScoreData) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setWeights: (weights: any) => void;
  setUseCase: (useCase: string | null) => void;
  clearScore: () => void;
}

export const useScoreStore = create<ScoreState>((set) => ({
  activeScore: null,
  isLoading: false,
  error: null,
  weights: {
    demographics: 0.35,
    transport: 0.25,
    poi: 0.20,
    land_use: 0.10,
    environment: 0.10,
  },
  useCase: null,
  setActiveScore: (score) => set({ activeScore: score, isLoading: false, error: null }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  setWeights: (weights) => set({ weights }),
  setUseCase: (useCase) => set({ useCase }),
  clearScore: () => set({ activeScore: null, error: null }),
}));
