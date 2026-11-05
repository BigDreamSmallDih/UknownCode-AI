import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isNative } from './storage';

/** Configures the Android status bar once on startup. */
export function useStatusBar(): void {
  useEffect(() => {
    if (!isNative()) return;
    void StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
    void StatusBar.setBackgroundColor({ color: '#0b0b14' }).catch(() => undefined);
  }, []);
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
