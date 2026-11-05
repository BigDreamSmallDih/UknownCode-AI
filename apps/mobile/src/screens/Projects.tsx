import { PhaseNotice } from '../components/PhaseNotice';

export function Projects() {
  return (
    <div className="screen">
      <h1>Projects</h1>
      <PhaseNotice
        title="Repositori GitHub"
        phase={3}
        description="Menghubungkan akun GitHub, melihat repositori, dan mengimpor proyek."
      />
      <PhaseNotice
        title="Editor kode dan explorer"
        phase={5}
        description="Menjelajah file, mengedit kode, dan melihat diff."
      />
    </div>
  );
}
