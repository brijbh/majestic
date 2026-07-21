import { useMemo } from "react";
import { useAppStore } from "../../state/app-store";
import type { TransitMapModel } from "../../transit/model";

export function TrainInspector({ model }: { model: TransitMapModel }) {
  const selectedTrainId = useAppStore((state) => state.selectedTrainId);
  const train = useMemo(
    () => model.trains.find((item) => item.id === selectedTrainId) ?? model.trains[0],
    [model.trains, selectedTrainId],
  );

  if (!train) {
    return (
      <section className="panel">
        <h2>Selected Train</h2>
        <p>No active trains. The map will still show repository stations.</p>
      </section>
    );
  }

  return (
    <section className="panel" aria-labelledby="train-title">
      <h2 id="train-title">Selected Train</h2>
      <dl className="train-details">
        <dt>Workstream</dt>
        <dd>{train.label}</dd>
        <dt>Branch</dt>
        <dd>{train.branch}</dd>
        <dt>Author</dt>
        <dd>{train.author}</dd>
        <dt>Status</dt>
        <dd>{train.status}</dd>
        <dt>Commits</dt>
        <dd>{train.commitCount}</dd>
      </dl>
      {train.url ? (
        <a href={train.url} target="_blank" rel="noreferrer">
          Open on GitHub
        </a>
      ) : null}
    </section>
  );
}
