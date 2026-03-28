import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // Try to read locale from cookie (set by the language settings page)
  let locale = 'nl';

  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('locale');
    if (localeCookie?.value === 'en' || localeCookie?.value === 'nl') {
      locale = localeCookie.value;
    }
  } catch {
    // Fallback to 'nl' if cookies aren't available (e.g., during static generation)
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
