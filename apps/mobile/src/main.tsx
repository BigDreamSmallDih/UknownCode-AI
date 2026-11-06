import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import { I18nProvider } from './i18n/I18nContext';
import { AuthProvider } from './lib/AuthContext';
import { SettingsProvider } from './lib/SettingsContext';
import './styles/index.css';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/figtree';
import '@fontsource-variable/jetbrains-mono';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <SettingsProvider>
      <I18nProvider>
        <AuthProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </AuthProvider>
      </I18nProvider>
    </SettingsProvider>
  </StrictMode>,
);
