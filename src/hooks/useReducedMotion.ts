import { useEffect } from "react";
import { useAppStore } from "../state/app-store";

export function useReducedMotion() {
  const setReducedMotion = useAppStore((state) => state.setReducedMotion);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [setReducedMotion]);
}
