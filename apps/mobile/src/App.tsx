import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { useAuth } from './lib/AuthContext';
import { useNetwork } from './lib/useNetwork';
import { useBackButton, useStatusBar } from './lib/useNativeShell';
import { Agent } from './screens/Agent';
import { AuthScreen } from './screens/Auth';
import { Home } from './screens/Home';
import { Projects } from './screens/Projects';
import { Settings } from './screens/Settings';
import { Terminal } from './screens/Terminal';

export function App() {
  useStatusBar();
  useBackButton();
  const { online } = useNetwork();
  const location = useLocation();
  const auth = useAuth();

  // Login is enforced only when this build has Supabase configured.
  if (auth.configured && auth.loading) {
    return (
      <div className="app-shell">
        <p className="muted" style={{ margin: 'auto' }}>
          Memuat…
        </p>
      </div>
    );
  }
  if (auth.configured && !auth.session) return <AuthScreen />;

  return (
    <div className="app-shell">
      {!online && (
        <div className="offline-banner" role="alert">
          Tidak ada koneksi internet. Beberapa fitur dinonaktifkan.
        </div>
      )}
      <main className="app-main">
        <div className="page" key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/terminal" element={<Terminal />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
