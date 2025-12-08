import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'en';
  }

  // Load all translation files and merge them
  const [common, aiVideo, aiMusic] = await Promise.all([
    import(`../messages/${locale}/common.json`).then(m => m.default),
    import(`../messages/${locale}/aiVideo.json`).then(m => m.default).catch(() => ({})),
    import(`../messages/${locale}/aiMusic.json`).then(m => m.default).catch(() => ({})),
  ]);

  return {
    locale,
    messages: {
      ...common,
      aiVideo,
      aiMusic,
    }
  };
});
