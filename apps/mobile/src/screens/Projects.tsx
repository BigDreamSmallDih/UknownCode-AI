import { PhaseNotice } from '../components/PhaseNotice';
import { useI18n } from '../i18n/I18nContext';

export function Projects() {
  const { t } = useI18n();
  return (
    <div className="screen">
      <h1>{t('projects.title')}</h1>
      <PhaseNotice titleKey="projects.repos.title" descriptionKey="projects.repos.desc" phase={3} />
      <PhaseNotice titleKey="projects.editor.title" descriptionKey="projects.editor.desc" phase={5} />
    </div>
  );
}
