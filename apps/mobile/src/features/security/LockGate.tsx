import type { ReactNode } from 'react';

/**
 * Wraps the signed-in app. The security feature replaces this with the PIN lock screen;
 * it must render children unchanged while the lock is off.
 */
export function LockGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
