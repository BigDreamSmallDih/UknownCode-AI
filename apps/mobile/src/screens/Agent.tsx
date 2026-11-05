import { PhaseNotice } from '../components/PhaseNotice';

export function Agent() {
  return (
    <div className="screen">
      <h1>AI Agent</h1>
      <PhaseNotice
        title="Chat multi-provider"
        phase={4}
        description="Gemini, Claude, dan OpenAI lewat backend, dengan streaming dan riwayat percakapan."
      />
      <PhaseNotice
        title="Agent perencana dan pengkode"
        phase={6}
        description="Planner, Executor, Reviewer, dan Error Fixer dengan persetujuan sebelum perubahan."
      />
    </div>
  );
}
