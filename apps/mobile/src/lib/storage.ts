import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

/** True when running inside the Android app (not a regular browser). */
export const isNative = (): boolean => Capacitor.isNativePlatform();

/**
 * Persistent key-value storage. Uses Capacitor Preferences on Android and
 * localStorage in the browser (dev mode). Failures never throw: callers get null / false.
 */
export async function getItem(key: string): Promise<string | null> {
  try {
    if (isNative()) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<boolean> {
  try {
    if (isNative()) {
      await Preferences.set({ key, value });
    } else {
      window.localStorage.setItem(key, value);
    }
    return true;
  } catch {
    return false;
  }
}
