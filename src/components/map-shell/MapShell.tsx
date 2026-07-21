import { ActivityFeed } from "../activity-feed/ActivityFeed";
import { TrainInspector } from "../train-inspector/TrainInspector";
import { TransitCanvas } from "../../renderer/TransitCanvas";
import { generateTransitMap } from "../../transit/map-generator";
import { useAppStore } from "../../state/app-store";

export function MapShell() {
  const snapshot = useAppStore((state) => state.snapshot);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const speed = useAppStore((state) => state.speed);
  const setSpeed = useAppStore((state) => state.setSpeed);
  const paused = useAppStore((state) => state.paused);
  const setPaused = useAppStore((state) => state.setPaused);
  const backToEntry = useAppStore((state) => state.backToEntry);
  const reducedMotion = useAppStore((state) => state.reducedMotion);

  if (!snapshot) return null;
  const model = generateTransitMap(snapshot);

  async function fullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

  return (
    <main className={`map-shell theme-${theme}`}>
      <header className="top-bar">
        <button className="ghost-button" type="button" onClick={backToEntry}>
          Git Transit
        </button>
        <div>
          <strong>{snapshot.repository.fullName}</strong>
          <span>Live view · Auto-refresh every 60 seconds</span>
        </div>
        <div className="top-controls" aria-label="Map controls">
          <button
            type="button"
            onClick={() => setTheme(theme === "metro" ? "retro" : "metro")}
          >
            {theme === "metro" ? "Retro" : "Metro"}
          </button>
          <button type="button" onClick={() => setPaused(!paused)}>
            {paused ? "Play" : "Pause"}
          </button>
          <button type="button" onClick={fullscreen}>
            Fullscreen
          </button>
        </div>
      </header>
      <section className="workspace">
        <aside className="legend" aria-label="Transit legend">
          <h2>Lines</h2>
          {model.lines.map((line) => (
            <div key={line.id} className="legend-row">
              <span style={{ background: line.color }} />
              {line.label}
            </div>
          ))}
          <h2>Signals</h2>
          <p>
            Shape and motion reinforce status for users who cannot rely on color alone.
          </p>
        </aside>
        <section className="map-stage" aria-label="Animated transit map">
          <TransitCanvas
            model={model}
            theme={theme}
            paused={paused || reducedMotion}
            speed={reducedMotion ? 0 : speed}
          />
        </section>
        <aside className="side-panels">
          <TrainInspector model={model} />
          <ActivityFeed events={model.events} />
        </aside>
      </section>
      <footer className="status-strip">
        <span>Default branch: {snapshot.repository.defaultBranch}</span>
        <span>{snapshot.commits.length} recent commits</span>
        <span>
          {snapshot.pullRequests.filter((pr) => pr.state === "open").length} open PRs
        </span>
        <label>
          Speed
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.25"
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          />
        </label>
      </footer>
    </main>
  );
}
