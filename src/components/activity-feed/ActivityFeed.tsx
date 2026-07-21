import type { TransitEvent } from "../../transit/model";

export function ActivityFeed({ events }: { events: TransitEvent[] }) {
  return (
    <section className="panel" aria-labelledby="activity-title">
      <h2 id="activity-title">Activity Feed</h2>
      <ol className="activity-feed">
        {events.map((event) => (
          <li key={event.id}>
            <strong>{event.title}</strong>
            <span>{event.detail}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
