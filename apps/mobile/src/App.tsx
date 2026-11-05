import { Navigate, Route, Routes } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { useNetwork } from './lib/useNetwork';
import { useBackButton, useStatusBar } from './lib/useNativeShell';
import { Agent } from './screens/Agent';
import { Home } from './screens/Home';
import { Projects } from './screens/Projects';
import { Settings } from './screens/Settings';
import { Terminal } from './screens/Terminal';

export function App() {
  useStatusBar();
  useBackButton();
  const { online } = useNetwork();

  return (
    <div className="app-shell">
      {!online && (
        <div className="offline-banner" role="alert">
          Tidak ada koneksi internet. Beberapa fitur dinonaktifkan.
        </div>
      )}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/agent" element={<Agent />} />
          <Route path="/terminal" element={<Terminal />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
