import { PhaseNotice } from '../components/PhaseNotice';

export function Terminal() {
  return (
    <div className="screen">
      <h1>Terminal</h1>
      <PhaseNotice
        title="Eksekusi terisolasi"
        phase={7}
        description="Menjalankan build dan test di sandbox terpisah, lengkap dengan log dan pembatalan."
      />
    </div>
  );
}
