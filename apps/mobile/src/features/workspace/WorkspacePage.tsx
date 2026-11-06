import { useI18n } from '../../i18n/I18nContext';

/** Routed at /workspace/*. Owned by the workspace feature; replace this stub. */
export function WorkspacePage() {
  const { t } = useI18n();
  return (
    <section className="screen">
      <h1>{t('workspace.title')}</h1>
    </section>
  );
}
