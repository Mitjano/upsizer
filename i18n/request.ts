import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'en';
  }

  const [common, aiVideo, aiImage, chat] = await Promise.all([
    import(`../messages/${locale}/common.json`).then(m => m.default),
    import(`../messages/${locale}/aiVideo.json`).then(m => m.default).catch(() => ({})),
    import(`../messages/${locale}/aiImage.json`).then(m => m.default).catch(() => ({})),
    import(`../messages/${locale}/chat.json`).then(m => m.default).catch(() => ({})),
  ]);

  return {
    locale,
    messages: {
      ...common,
      aiVideo,
      aiImage,
      chat,
    }
  };
});
