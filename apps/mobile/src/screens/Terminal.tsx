import { PhaseNotice } from '../components/PhaseNotice';
import { useI18n } from '../i18n/I18nContext';

export function Terminal() {
  const { t } = useI18n();
  return (
    <div className="screen">
      <h1>{t('terminal.title')}</h1>
      <PhaseNotice titleKey="terminal.sandbox.title" descriptionKey="terminal.sandbox.desc" phase={7} />
    </div>
  );
}
