import { useCallback, useMemo } from 'react';
import { useAppStore } from '../app/AppStore';
import { translations, type Language, type TranslationKey } from './translations';

export const useTranslations = () => {
  const { state } = useAppStore();
  const language = (state?.settings.language ?? 'en') as Language;
  const dictionary = useMemo(() => translations[language] ?? translations.en, [language]);

  const t = useCallback(
    (key: TranslationKey) => dictionary[key] ?? translations.en[key] ?? key,
    [dictionary]
  );

  return { t, language };
};
