import { useI18n } from '../../i18n/I18nContext';

/** Routed at /security. Owned by the security feature; replace this stub. */
export function SecurityPage() {
  const { t } = useI18n();
  return (
    <section className="screen">
      <h1>{t('security.title')}</h1>
    </section>
  );
}
