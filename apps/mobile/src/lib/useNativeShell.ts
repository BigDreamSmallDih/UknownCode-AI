import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSettings } from './SettingsContext';
import { isNative } from './storage';
import { getTheme } from './theme';

/** Keeps the Android status bar in sync with the selected theme. */
export function useStatusBar(): void {
  const { settings } = useSettings();
  useEffect(() => {
    const theme = getTheme(settings.theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', theme.statusBarColor);
    if (!isNative()) return;
    void StatusBar.setStyle({ style: theme.dark ? Style.Dark : Style.Light }).catch(
      () => undefined,
    );
    void StatusBar.setBackgroundColor({ color: theme.statusBarColor }).catch(() => undefined);
  }, [settings.theme]);
}

/**
 * Android hardware back button:
 * - not on Home  -> go back in history, or to Home if there is none
 * - on Home      -> exit the app
 */
export function useBackButton(): void {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isNative()) return;
    let remove: (() => void) | undefined;
    let active = true;

    void App.addListener('backButton', ({ canGoBack }) => {
      if (location.pathname !== '/') {
        if (canGoBack) navigate(-1);
        else navigate('/', { replace: true });
      } else {
        void App.exitApp();
      }
    })
      .then((handle) => {
        if (active) remove = () => void handle.remove();
        else void handle.remove();
      })
      .catch(() => undefined);

    return () => {
      active = false;
      remove?.();
    };
  }, [location.pathname, navigate]);
}
