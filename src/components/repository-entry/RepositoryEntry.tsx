import { FormEvent, useState } from "react";
import { demoSnapshot } from "../../demo/demo-snapshot";
import { fetchRepositorySnapshot } from "../../github/client";
import { parseRepositoryInput } from "../../github/repository-parser";
import { useAppStore } from "../../state/app-store";

export function RepositoryEntry() {
  const lastRepository = useAppStore((state) => state.lastRepository);
  const launch = useAppStore((state) => state.launch);
  const storedError = useAppStore((state) => state.error);
  const setError = useAppStore((state) => state.setError);
  const [value, setValue] = useState(lastRepository);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      const ref = parseRepositoryInput(value);
      const snapshot = await fetchRepositorySnapshot(ref);
      launch(snapshot, `${ref.owner}/${ref.name}`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Repository activity could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="entry-screen">
      <section className="entry-hero" aria-labelledby="product-title">
        <div className="brand-mark" aria-hidden="true">
          GT
        </div>
        <p className="eyebrow">Public GitHub repositories only</p>
        <h1 id="product-title">GIT TRANSIT</h1>
        <p className="tagline">Watch a repository come alive.</p>
        <form className="repo-form" onSubmit={submit}>
          <label htmlFor="repository">Repository</label>
          <div className="repo-input-row">
            <input
              id="repository"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="owner/repository or GitHub URL"
              autoComplete="off"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Launching..." : "Launch Transit Map"}
            </button>
          </div>
          {storedError ? <p className="form-error">{storedError}</p> : null}
        </form>
        <p className="privacy-copy">
          Repository activity is fetched directly from GitHub and is not sent to or
          stored on our servers.
        </p>
        <button
          className="demo-button"
          type="button"
          onClick={() => launch(demoSnapshot, "signalworks/orbit-console")}
        >
          View Demo
        </button>
      </section>
    </main>
  );
}
