import { ErrorBoundary } from "./ErrorBoundary";
import { MapShell } from "../components/map-shell/MapShell";
import { RepositoryEntry } from "../components/repository-entry/RepositoryEntry";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useAppStore } from "../state/app-store";

export function App() {
  useReducedMotion();
  const mode = useAppStore((state) => state.mode);
  return (
    <ErrorBoundary>{mode === "map" ? <MapShell /> : <RepositoryEntry />}</ErrorBoundary>
  );
}
