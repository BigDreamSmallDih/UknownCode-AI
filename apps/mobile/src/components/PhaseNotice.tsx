interface PhaseNoticeProps {
  title: string;
  phase: number;
  description: string;
}

/** Honest placeholder for features that are not built yet. It has no interactive controls. */
export function PhaseNotice({ title, phase, description }: PhaseNoticeProps) {
  return (
    <section className="card notice">
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      <p className="badge">Belum tersedia · dibangun di Phase {phase}</p>
    </section>
  );
}
