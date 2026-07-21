import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RepositorySnapshot, ThemeName, TransitTrain } from "../transit/model";

type AppMode = "entry" | "map";

type AppState = {
  mode: AppMode;
  theme: ThemeName;
  speed: number;
  paused: boolean;
  reducedMotion: boolean;
  lastRepository: string;
  selectedTrainId?: string;
  snapshot?: RepositorySnapshot;
  error?: string;
  setTheme: (theme: ThemeName) => void;
  setSpeed: (speed: number) => void;
  setPaused: (paused: boolean) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  launch: (snapshot: RepositorySnapshot, repositoryInput: string) => void;
  setError: (error?: string) => void;
  selectTrain: (train?: TransitTrain) => void;
  backToEntry: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mode: "entry",
      theme: "metro",
      speed: 1,
      paused: false,
      reducedMotion: false,
      lastRepository: "",
      setTheme: (theme) => set({ theme }),
      setSpeed: (speed) => set({ speed }),
      setPaused: (paused) => set({ paused }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      launch: (snapshot, repositoryInput) =>
        set({
          mode: "map",
          snapshot,
          selectedTrainId: undefined,
          error: undefined,
          lastRepository: repositoryInput,
        }),
      setError: (error) => set({ error }),
      selectTrain: (train) => set({ selectedTrainId: train?.id }),
      backToEntry: () => set({ mode: "entry", error: undefined }),
    }),
    {
      name: "git-transit-preferences",
      partialize: (state) => ({
        theme: state.theme,
        speed: state.speed,
        reducedMotion: state.reducedMotion,
        lastRepository: state.lastRepository,
      }),
    },
  ),
);
