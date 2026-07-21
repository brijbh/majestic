import { DebugPanel } from "../debug/DebugPanel";
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
        <button className="brand-button" type="button" onClick={backToEntry}>
          <span className="train-glyph" aria-hidden="true">
            ▣
          </span>
          <span>
            <strong>GIT TRANSIT</strong>
            <small>LIVE REPOSITORY MAP</small>
          </span>
        </button>
        <div className="repo-launcher" aria-label="Current repository">
          <span className="github-dot" aria-hidden="true">
            ◖
          </span>
          <strong>{snapshot.repository.fullName}</strong>
          <button type="button" onClick={backToEntry} aria-label="Change repository">
            →
          </button>
          <small>
            <span className="live-dot" /> LIVE · Last updated{" "}
            {new Date(snapshot.fetchedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · Auto-refresh every 60s
          </small>
        </div>
        <div className="top-controls" aria-label="Map controls">
          <span>THEME</span>
          <button
            className={theme === "metro" ? "is-active" : ""}
            type="button"
            onClick={() => setTheme("metro")}
          >
            Metro
          </button>
          <button
            className={theme === "retro" ? "is-active" : ""}
            type="button"
            onClick={() => setTheme("retro")}
          >
            Retro
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
          <section>
            <h2>Lines</h2>
            {model.lines.map((line) => (
              <div key={line.id} className="legend-row">
                <span style={{ background: line.color }} />
                {line.label}
              </div>
            ))}
          </section>
          <section>
            <h2>Stations</h2>
            {model.stations.slice(0, 7).map((station) => (
              <div key={station.id} className="legend-row station-key">
                <span />
                {station.label}
              </div>
            ))}
          </section>
          <section>
            <h2>Filters</h2>
            {["Show Trains", "Show Labels", "Show Avatars", "Show Merged"].map(
              (item) => (
                <label className="toggle-row" key={item}>
                  {item}
                  <input type="checkbox" defaultChecked />
                </label>
              ),
            )}
          </section>
          <section className="active-trains">
            <span className="train-glyph" aria-hidden="true">
              ▣
            </span>
            <span>
              ACTIVE TRAINS
              <strong>{model.trains.length}</strong>
            </span>
          </section>
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
        <div>
          <small>Repository</small>
          <strong>{snapshot.repository.fullName}</strong>
        </div>
        <div>
          <small>Default branch</small>
          <strong>{snapshot.repository.defaultBranch}</strong>
        </div>
        <div>
          <small>Total commits</small>
          <strong>{snapshot.commits.length}</strong>
        </div>
        <div>
          <small>Open PRs</small>
          <strong>
            {snapshot.pullRequests.filter((pr) => pr.state === "open").length}
          </strong>
        </div>
        <div>
          <small>Workflows</small>
          <strong>
            {snapshot.workflowRuns.filter((run) => run.status === "success").length}{" "}
            Passing
          </strong>
        </div>
        <label className="speed-tile">
          <small>Map speed</small>
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
      <DebugPanel snapshot={snapshot} model={model} phase="map" />
    </main>
  );
}
