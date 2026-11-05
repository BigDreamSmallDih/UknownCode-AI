import { ChatPanel } from '../components/ChatPanel';
import { PhaseNotice } from '../components/PhaseNotice';
import { useI18n } from '../i18n/I18nContext';

export function Agent() {
  const { t } = useI18n();
  return (
    <div className="screen">
      <h1>{t('agent.title')}</h1>
      <ChatPanel />
      <PhaseNotice titleKey="agent.engine.title" descriptionKey="agent.engine.desc" phase={6} />
    </div>
  );
}
