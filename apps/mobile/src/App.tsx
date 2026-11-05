import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Splash } from './components/Splash';
import { useI18n } from './i18n/I18nContext';
import { useAuth } from './lib/AuthContext';
import { useSettings } from './lib/SettingsContext';
import { useBackButton, useStatusBar } from './lib/useNativeShell';
import { useNetwork } from './lib/useNetwork';
import { Agent } from './screens/Agent';
import { AuthScreen } from './screens/Auth';
import { Home } from './screens/Home';
import { Projects } from './screens/Projects';
import { Settings } from './screens/Settings';
import { Terminal } from './screens/Terminal';

const SPLASH_MIN_MS = 1700;
const SPLASH_MIN_REDUCED_MS = 600;
const SPLASH_FADE_MS = 450;

export function App() {
  useStatusBar();
  useBackButton();
  const { t } = useI18n();
  const { online } = useNetwork();
  const location = useLocation();
  const auth = useAuth();
  const { settings, loaded } = useSettings();

  // Splash stays until the minimum time has passed AND settings and the session are loaded.
  const [minElapsed, setMinElapsed] = useState(false);
  const [splashMounted, setSplashMounted] = useState(true);
  const ready = minElapsed && loaded && !(auth.configured && auth.loading);

  useEffect(() => {
    if (!loaded) return;
    const delay = settings.reduceMotion ? SPLASH_MIN_REDUCED_MS : SPLASH_MIN_MS;
    const timer = setTimeout(() => setMinElapsed(true), delay);
    return () => clearTimeout(timer);
  }, [loaded, settings.reduceMotion]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => setSplashMounted(false), SPLASH_FADE_MS);
    return () => clearTimeout(timer);
  }, [ready]);

  const splash = splashMounted ? <Splash leaving={ready} /> : null;

  // Login is enforced only when this build has Supabase configured.
  if (auth.configured && !auth.loading && !auth.session) {
    return (
      <>
        <AuthScreen />
        {splash}
      </>
    );
  }
  if (auth.configured && auth.loading) {
    return (
      <>
        <div className="app-shell" />
        {splash}
      </>
    );
  }

  return (
    <>
      <div className="app-shell">
        {!online && (
          <div className="offline-banner" role="alert">
            {t('app.offlineBanner')}
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
      {splash}
    </>
  );
}
