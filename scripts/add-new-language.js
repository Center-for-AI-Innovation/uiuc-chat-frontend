#!/usr/bin/env node

/**
 * Add New Language Script
 * 
 * This script helps add new languages to your translation system.
 * It can:
 * 1. Add a new language to the configuration
 * 2. Create translation files for the new language
 * 3. Update the i18n configuration
 */

const fs = require('fs');
const path = require('path');

// Current supported locales
const CURRENT_LOCALES = [
  'bn', 'de', 'en', 'es', 'fr', 'he', 'id', 'it', 'ja', 'ko', 
  'pl', 'pt', 'ru', 'ro', 'sv', 'te', 'vi', 'zh', 'ar', 'tr', 'ca', 'fi'
];

// Popular languages to consider adding
const POPULAR_LANGUAGES = {
  'hi': 'Hindi',
  'th': 'Thai',
  'ms': 'Malay',
  'nl': 'Dutch',
  'no': 'Norwegian',
  'da': 'Danish',
  'cs': 'Czech',
  'sk': 'Slovak',
  'hu': 'Hungarian',
  'el': 'Greek',
  'uk': 'Ukrainian',
  'bg': 'Bulgarian',
  'hr': 'Croatian',
  'sl': 'Slovenian',
  'et': 'Estonian',
  'lv': 'Latvian',
  'lt': 'Lithuanian',
  'mt': 'Maltese',
  'ga': 'Irish',
  'cy': 'Welsh',
  'eu': 'Basque',
  'gl': 'Galician',
  'is': 'Icelandic',
  'fo': 'Faroese',
  'sq': 'Albanian',
  'mk': 'Macedonian',
  'sr': 'Serbian',
  'bs': 'Bosnian',
  'me': 'Montenegrin',
  'ka': 'Georgian',
  'hy': 'Armenian',
  'az': 'Azerbaijani',
  'kk': 'Kazakh',
  'ky': 'Kyrgyz',
  'uz': 'Uzbek',
  'tg': 'Tajik',
  'mn': 'Mongolian',
  'ne': 'Nepali',
  'si': 'Sinhala',
  'my': 'Burmese',
  'km': 'Khmer',
  'lo': 'Lao',
  'am': 'Amharic',
  'sw': 'Swahili',
  'yo': 'Yoruba',
  'ig': 'Igbo',
  'ha': 'Hausa',
  'zu': 'Zulu',
  'xh': 'Xhosa',
  'af': 'Afrikaans',
  'ur': 'Urdu',
  'fa': 'Persian',
  'ps': 'Pashto',
  'sd': 'Sindhi',
  'gu': 'Gujarati',
  'pa': 'Punjabi',
  'or': 'Odia',
  'as': 'Assamese',
  'ml': 'Malayalam',
  'kn': 'Kannada',
  'ta': 'Tamil',
  'mr': 'Marathi',
  'sa': 'Sanskrit'
};

// Translation namespaces
const NAMESPACES = ['common', 'chat', 'sidebar', 'markdown'];

// Paths
const LOCALES_PATH = path.join(__dirname, '../public/locales');
const I18N_CONFIG_PATH = path.join(__dirname, '../next-i18next.config.mjs');

/**
 * Add a new language to the system
 */
function addNewLanguage(locale, languageName) {
  console.log(`\n🌐 Adding ${languageName} (${locale}) to the translation system...`);
  
  // 1. Create locale directory
  const localePath = path.join(LOCALES_PATH, locale);
  if (!fs.existsSync(localePath)) {
    fs.mkdirSync(localePath, { recursive: true });
    console.log(`  ✅ Created directory: ${localePath}`);
  } else {
    console.log(`  ⚠️  Directory already exists: ${localePath}`);
  }
  
  // 2. Create translation files
  NAMESPACES.forEach(namespace => {
    const filePath = path.join(localePath, `${namespace}.json`);
    if (!fs.existsSync(filePath)) {
      const emptyContent = {};
      fs.writeFileSync(filePath, JSON.stringify(emptyContent, null, 2));
      console.log(`  ✅ Created ${namespace}.json`);
    } else {
      console.log(`  ⚠️  ${namespace}.json already exists`);
    }
  });
  
  // 3. Update i18n configuration
  updateI18nConfig(locale);
  
  console.log(`\n🎉 Successfully added ${languageName} (${locale})!`);
  console.log(`\nNext steps:`);
  console.log(`1. Run: node scripts/generate-translations.js generate-templates`);
  console.log(`2. Or run: node scripts/translate-with-openai.js translate ${locale}`);
  console.log(`3. Review and edit the translations in public/locales/${locale}/`);
}

/**
 * Update the i18n configuration file
 */
function updateI18nConfig(newLocale) {
  try {
    let configContent = fs.readFileSync(I18N_CONFIG_PATH, 'utf8');
    
    // Find the locales array and add the new locale
    const localesMatch = configContent.match(/locales:\s*\[([^\]]+)\]/);
    if (localesMatch) {
      const currentLocales = localesMatch[1].split(',').map(l => l.trim().replace(/'/g, ''));
      
      if (!currentLocales.includes(newLocale)) {
        // Add the new locale in alphabetical order
        const updatedLocales = [...currentLocales, newLocale].sort();
        const newLocalesString = updatedLocales.map(l => `'${l}'`).join(',\n      ');
        
        configContent = configContent.replace(
          /locales:\s*\[([^\]]+)\]/,
          `locales: [\n      ${newLocalesString}\n    ]`
        );
        
        fs.writeFileSync(I18N_CONFIG_PATH, configContent);
        console.log(`  ✅ Updated next-i18next.config.mjs`);
      } else {
        console.log(`  ⚠️  Locale ${newLocale} already in configuration`);
      }
    } else {
      console.log(`  ❌ Could not find locales array in configuration`);
    }
  } catch (error) {
    console.error(`  ❌ Error updating i18n config:`, error.message);
  }
}

/**
 * Show popular languages that could be added
 */
function showPopularLanguages() {
  console.log('\n🌍 Popular languages you could add:\n');
  
  const currentSet = new Set(CURRENT_LOCALES);
  const availableLanguages = Object.entries(POPULAR_LANGUAGES)
    .filter(([code]) => !currentSet.has(code))
    .sort(([,a], [,b]) => a.localeCompare(b));
  
  // Group by region/category
  const categories = {
    'South Asian': ['hi', 'th', 'ms', 'ne', 'si', 'my', 'km', 'lo'],
    'European': ['nl', 'no', 'da', 'cs', 'sk', 'hu', 'el', 'uk', 'bg', 'hr', 'sl', 'et', 'lv', 'lt', 'mt', 'ga', 'cy', 'eu', 'gl', 'is', 'fo', 'sq', 'mk', 'sr', 'bs', 'me', 'ka', 'hy', 'az'],
    'Central Asian': ['kk', 'ky', 'uz', 'tg', 'mn'],
    'African': ['am', 'sw', 'yo', 'ig', 'ha', 'zu', 'xh', 'af'],
    'Middle Eastern': ['ur', 'fa', 'ps', 'sd'],
    'Indian Subcontinent': ['gu', 'pa', 'or', 'as', 'ml', 'kn', 'ta', 'mr', 'sa']
  };
  
  Object.entries(categories).forEach(([category, codes]) => {
    const languages = codes
      .filter(code => !currentSet.has(code))
      .map(code => `${code} (${POPULAR_LANGUAGES[code]})`);
    
    if (languages.length > 0) {
      console.log(`${category}:`);
      languages.forEach(lang => console.log(`  - ${lang}`));
      console.log('');
    }
  });
}

/**
 * Main function
 */
function main() {
  const command = process.argv[2];
  const locale = process.argv[3];
  const languageName = process.argv[4];
  
  switch (command) {
    case 'add':
      if (!locale) {
        console.log('❌ Please specify a locale: node scripts/add-new-language.js add <locale> [language_name]');
        return;
      }
      
      if (!languageName) {
        console.log('❌ Please specify a language name: node scripts/add-new-language.js add <locale> <language_name>');
        return;
      }
      
      addNewLanguage(locale, languageName);
      break;
      
    case 'list':
      showPopularLanguages();
      break;
      
    case 'suggest':
      console.log('\n💡 Language suggestions based on global usage:\n');
      console.log('High Priority (1B+ speakers):');
      console.log('  - hi (Hindi) - 602M speakers');
      console.log('  - ur (Urdu) - 170M speakers');
      console.log('  - th (Thai) - 60M speakers');
      console.log('  - nl (Dutch) - 24M speakers');
      console.log('  - no (Norwegian) - 5M speakers');
      console.log('  - da (Danish) - 6M speakers');
      console.log('  - cs (Czech) - 10M speakers');
      console.log('  - hu (Hungarian) - 13M speakers');
      console.log('  - el (Greek) - 13M speakers');
      console.log('  - uk (Ukrainian) - 40M speakers');
      console.log('');
      console.log('Medium Priority (Regional importance):');
      console.log('  - ms (Malay) - 290M speakers');
      console.log('  - af (Afrikaans) - 7M speakers');
      console.log('  - sw (Swahili) - 16M speakers');
      console.log('  - fa (Persian) - 110M speakers');
      console.log('  - ta (Tamil) - 75M speakers');
      console.log('  - gu (Gujarati) - 55M speakers');
      console.log('  - pa (Punjabi) - 125M speakers');
      break;
      
    default:
      console.log(`
🌐 Add New Language Script

Usage: node scripts/add-new-language.js <command> [locale] [language_name]

Commands:
  add <locale> <language_name>  - Add a new language to the system
  list                         - Show popular languages that could be added
  suggest                      - Show language suggestions with speaker counts

Examples:
  node scripts/add-new-language.js add hi Hindi
  node scripts/add-new-language.js add th Thai
  node scripts/add-new-language.js list
  node scripts/add-new-language.js suggest

Current languages: ${CURRENT_LOCALES.join(', ')}

After adding a language:
1. Run: node scripts/generate-translations.js generate-templates
2. Or run: node scripts/translate-with-openai.js translate <locale>
3. Review and edit the translations
      `);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  addNewLanguage,
  showPopularLanguages,
  POPULAR_LANGUAGES
}; 