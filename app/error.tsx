"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="deck">
      <section className="panel" style={{ margin: "auto", maxWidth: 560 }}>
        <div className="panel-head">Core fault</div>
        <div className="panel-body">
          <p className="said" style={{ marginBottom: 14 }}>
            The interface stopped responding. Nothing you typed was lost — the transcript is stored
            against your session.
          </p>
          <p className="hint" style={{ marginBottom: 16 }}>
            {error?.message || "No detail was reported."}
          </p>
          <button className="btn" onClick={reset} style={{ width: "100%" }}>
            Restart core
          </button>
        </div>
      </section>
    </div>
  );
}
