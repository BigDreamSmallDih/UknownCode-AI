import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import type { MessageKey } from '../i18n';
import { Logo } from './Logo';

const STEPS: readonly MessageKey[] = ['splash.step1', 'splash.step2', 'splash.step3', 'splash.step4'];
const STEP_MS = 520;
const WORD = 'UknownCode';

interface SplashProps {
  /** When true the splash fades out; the parent unmounts it afterwards. */
  leaving: boolean;
}

/** Startup screen: a glowing logo with three orbiting satellites, a typed wordmark and status lines. */
export function Splash({ leaving }: SplashProps) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((current) => Math.min(current + 1, STEPS.length - 1)), STEP_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`splash${leaving ? ' leaving' : ''}`} role="status" aria-live="polite">
      <div className="splash-stage">
        <div className="orbit orbit-1">
          <span className="sat" />
        </div>
        <div className="orbit orbit-2">
          <span className="sat" />
        </div>
        <div className="orbit orbit-3">
          <span className="sat" />
        </div>
        <Logo size={76} glow />
      </div>

      <h1 className="splash-word" aria-label="UknownCode AI">
        {WORD.split('').map((letter, index) => (
          <span key={index} style={{ animationDelay: `${index * 55}ms` }}>
            {letter}
          </span>
        ))}
        <span className="splash-ai" style={{ animationDelay: `${WORD.length * 55}ms` }}>
          {' '}
          AI
        </span>
      </h1>

      <p className="splash-step" key={step}>
        {t(STEPS[step] ?? 'app.loading')}
      </p>
      <div className="splash-bar" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
