import { Network } from '@capacitor/network';
import { useEffect, useState } from 'react';

/** Tracks connectivity via Capacitor Network (works in the browser too). */
export function useNetwork(): { online: boolean } {
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    let remove: (() => void) | undefined;

    void Network.getStatus()
      .then((status) => {
        if (active) setOnline(status.connected);
      })
      .catch(() => undefined);

    void Network.addListener('networkStatusChange', (status) => {
      if (active) setOnline(status.connected);
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
  }, []);

  return { online };
}
