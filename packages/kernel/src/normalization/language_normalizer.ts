import { MultilingualAlias } from '@shoppage/contracts';

/**
 * Common foreign-to-English translation and normalization dictionary
 * Translates global FMCG / product terms into clean, standard English
 */
const FOREIGN_TERM_MAP: Record<string, string> = {
  // French
  'limonade artisanale': 'Artisanal Lemonade',
  'a la rose': 'with Rose Essence',
  'au lait': 'Milk',
  'chocolat noir': 'Dark Chocolate',
  'chocolat au lait': 'Milk Chocolate',
  'chocolat blanc': 'White Chocolate',
  'chocolat': 'Chocolate',
  'eau minerale': 'Mineral Water',
  'eau gazeuse': 'Sparkling Water',
  'jus de pomme': 'Apple Juice',
  'jus d\'orange': 'Orange Juice',
  'jus de fruits': 'Fruit Juice',
  'huile d\'olive': 'Olive Oil',
  'huile de tournesol': 'Sunflower Oil',
  'sauce tomate': 'Tomato Sauce',
  'pates alimentaires': 'Pasta',
  'farine de ble': 'Wheat Flour',
  'confiture de fraises': 'Strawberry Jam',
  'confiture d\'abricots': 'Apricot Jam',
  'miel de fleurs': 'Blossom Honey',
  'the vert': 'Green Tea',
  'the noir': 'Black Tea',
  'cafe moulu': 'Ground Coffee',
  'cafe en grains': 'Coffee Beans',
  'savon de marseille': 'Marseille Soap',
  'biscuit au beurre': 'Butter Biscuit',
  'pain de mie': 'Sliced Bread',
  'riz basmati': 'Basmati Rice',
  'lait demi-ecreme': 'Semi-Skimmed Milk',
  'creme fraiche': 'Fresh Cream',
  'fromage blanc': 'Fromage Blanc',
  'vinaigre balsamique': 'Balsamic Vinegar',
  'chips artisanales': 'Artisanal Potato Chips',
  'moutarde de dijon': 'Dijon Mustard',
  'gateau au chocolat': 'Chocolate Cake',

  // Spanish / Portuguese
  'agua mineral': 'Mineral Water',
  'leche entera': 'Whole Milk',
  'aceite de oliva': 'Olive Oil',
  'arroz blanco': 'White Rice',
  'galletas de chocolate': 'Chocolate Cookies',
  'cafe molido': 'Ground Coffee',
  'te verde': 'Green Tea',

  // German / Italian
  'vollmilch': 'Whole Milk',
  'dunkle schokolade': 'Dark Chocolate',
  'olivenol': 'Olive Oil',
  'mineralwasser': 'Mineral Water',
  'olio extra vergine': 'Extra Virgin Olive Oil',
  'passata di pomodoro': 'Tomato Passata',
  'pasta di semola': 'Semolina Pasta',
};

/**
 * Decode HTML entities like &amp;, &quot;, &#39;, &eacute;, etc.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&eacute;/g, 'e')
    .replace(/&egrave;/g, 'e')
    .replace(/&ecirc;/g, 'e')
    .replace(/&agrave;/g, 'a')
    .replace(/&ccedil;/g, 'c')
    .replace(/&ocirc;/g, 'o')
    .replace(/&uuml;/g, 'u')
    .replace(/&ouml;/g, 'o')
    .replace(/&auml;/g, 'a');
}

/**
 * Normalizes title to clean Title Case English
 */
export function toTitleCase(text: string): string {
  if (!text) return '';
  const lowercaseWords = new Set(['a', 'an', 'and', 'in', 'of', 'on', 'at', 'to', 'for', 'with', 'de', 'la', 'le', 'du']);

  return text
    .split(/\s+/)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && lowercaseWords.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Detects if a title contains foreign terms and produces a clean English canonical title
 * along with multilingual aliases preserving the original term.
 */
export function canonicalizeToEnglish(rawTitle: string): {
  englishTitle: string;
  originalLanguageDetected?: 'fr' | 'es' | 'de' | 'it' | 'pt';
  aliases: MultilingualAlias[];
} {
  const cleanedRaw = decodeHtmlEntities(rawTitle || '').trim();
  const lower = cleanedRaw.toLowerCase();
  let translated = cleanedRaw;
  let detectedLang: 'fr' | 'es' | 'de' | 'it' | 'pt' | undefined = undefined;

  // Replace recognized foreign terms with English equivalents
  for (const [foreignTerm, englishReplacement] of Object.entries(FOREIGN_TERM_MAP)) {
    if (lower.includes(foreignTerm)) {
      const regex = new RegExp(foreignTerm, 'gi');
      translated = translated.replace(regex, englishReplacement);
      detectedLang = 'fr'; // primary default for OFF dataset
    }
  }

  // Remove trailing un-needed French prepositions (e.g., "a la rose" -> "Rose Essence")
  translated = translated.replace(/\b(de|du|des|aux|au|a la|a l')\b/gi, 'with');
  translated = decodeHtmlEntities(translated);

  // Capitalize properly
  const englishTitle = toTitleCase(translated);

  const aliases: MultilingualAlias[] = [
    { phrase: englishTitle, locale: 'en', source: 'ai_normalized', confidence: 0.98 },
  ];

  if (cleanedRaw !== englishTitle) {
    aliases.push({
      phrase: cleanedRaw,
      locale: (detectedLang as any) || 'fr',
      source: 'merchant_usage',
      confidence: 0.92,
    });
  }

  return {
    englishTitle,
    originalLanguageDetected: detectedLang,
    aliases,
  };
}
