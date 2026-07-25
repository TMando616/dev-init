export type SupportedLanguage = 'php' | 'python' | 'javascript' | 'ruby' | 'java';

interface LanguageAsset {
  label: string;
  image: string;
}

const LANGUAGE_ASSETS: Record<SupportedLanguage, LanguageAsset> = {
  php: { label: 'PHP', image: '/images/languages/php.png' },
  python: { label: 'Python', image: '/images/languages/python.png' },
  javascript: { label: 'JavaScript', image: '/images/languages/javascript.png' },
  ruby: { label: 'Ruby', image: '/images/languages/ruby.png' },
  java: { label: 'Java', image: '/images/languages/java.png' },
};

export function getLanguageAsset(language?: string | null): LanguageAsset | null {
  if (!language) return null;
  return LANGUAGE_ASSETS[language as SupportedLanguage] ?? null;
}
