import { FormEvent, useState } from "react";
import { DebugPanel } from "../debug/DebugPanel";
import { demoSnapshot } from "../../demo/demo-snapshot";
import { fetchRepositorySnapshot } from "../../github/client";
import { parseRepositoryInput } from "../../github/repository-parser";
import { useAppStore } from "../../state/app-store";

export function RepositoryEntry() {
  const lastRepository = useAppStore((state) => state.lastRepository);
  const launch = useAppStore((state) => state.launch);
  const storedError = useAppStore((state) => state.error);
  const setError = useAppStore((state) => state.setError);
  const githubToken = useAppStore((state) => state.githubToken);
  const setGithubToken = useAppStore((state) => state.setGithubToken);
  const clearGithubToken = useAppStore((state) => state.clearGithubToken);
  const [value, setValue] = useState(lastRepository);
  const [tokenValue, setTokenValue] = useState(githubToken);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      const ref = parseRepositoryInput(value);
      console.info("[Git Transit] Launching public repository", ref);
      const snapshot = await fetchRepositorySnapshot(ref, githubToken);
      console.info("[Git Transit] Repository snapshot loaded", {
        repository: snapshot.repository.fullName,
        branches: snapshot.branches.length,
        commits: snapshot.commits.length,
        pullRequests: snapshot.pullRequests.length,
        warnings: snapshot.warnings,
      });
      launch(snapshot, `${ref.owner}/${ref.name}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Repository activity could not be loaded.";
      console.error("[Git Transit] Repository launch failed", error);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="entry-screen">
      <section className="entry-hero" aria-labelledby="product-title">
        <img className="entry-logo" src="/logo.png" alt="" aria-hidden="true" />
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
        <details className="token-help">
          <summary>
            Optional: use a read-only GitHub token for higher API limits
          </summary>
          <div className="token-grid">
            <div>
              <label htmlFor="github-token">Fine-grained token</label>
              <input
                id="github-token"
                type="password"
                value={tokenValue}
                onChange={(event) => setTokenValue(event.target.value)}
                placeholder="github_pat_..."
                autoComplete="off"
              />
              <div className="token-actions">
                <button type="button" onClick={() => setGithubToken(tokenValue.trim())}>
                  Save token locally
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTokenValue("");
                    clearGithubToken();
                  }}
                >
                  Forget token
                </button>
              </div>
              <p>
                The token is stored only in this browser's local storage and is sent
                directly to GitHub in API requests. Do not use someone else's token.
              </p>
            </div>
            <ol>
              <li>Open GitHub Settings → Developer settings.</li>
              <li>Choose Personal access tokens → Fine-grained tokens.</li>
              <li>Generate a new token with an expiration date.</li>
              <li>Select the repository owner and only the repositories you need.</li>
              <li>
                Use read-only repository permissions. Contents and metadata are enough
                for basic repository activity; add read-only Pull requests and Actions
                if you want richer PR/workflow data.
              </li>
              <li>Generate the token, copy it once, paste it here, and save.</li>
            </ol>
          </div>
        </details>
        <button
          className="demo-button"
          type="button"
          onClick={() => {
            console.info("[Git Transit] Launching bundled demo", demoSnapshot);
            launch(demoSnapshot, "signalworks/orbit-console");
          }}
        >
          View Demo
        </button>
        <DebugPanel phase="entry" error={storedError} />
      </section>
    </main>
  );
}
