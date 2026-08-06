import Link from "next/link";

export default function NotFound() {
  return (
    <div className="deck">
      <section className="panel" style={{ margin: "auto", maxWidth: 520 }}>
        <div className="panel-head">No such route</div>
        <div className="panel-body">
          <p className="said" style={{ marginBottom: 16 }}>
            That address does not exist. The agent lives at the root.
          </p>
          <Link href="/" className="btn" style={{ display: "block", textAlign: "center" }}>
            Return to console
          </Link>
        </div>
      </section>
    </div>
  );
}
