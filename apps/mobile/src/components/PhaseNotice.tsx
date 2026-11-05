import type { MessageKey } from '../i18n';
import { useI18n } from '../i18n/I18nContext';

interface PhaseNoticeProps {
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  phase: number;
}

/** Honest placeholder for features that are not built yet. It has no interactive controls. */
export function PhaseNotice({ titleKey, descriptionKey, phase }: PhaseNoticeProps) {
  const { t } = useI18n();
  return (
    <section className="card notice">
      <h2>{t(titleKey)}</h2>
      <p className="muted">{t(descriptionKey)}</p>
      <p className="badge">{t('notice.badge', { phase })}</p>
    </section>
  );
}
