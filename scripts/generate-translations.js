#!/usr/bin/env node

/**
 * Enhanced Translation Generation Script
 * 
 * This script helps generate translation files for all supported languages.
 * It can:
 * 1. Extract all translation keys from English files
 * 2. Create empty translation files for missing languages
 * 3. Use Google Translate API to auto-translate (if API key provided)
 * 4. Validate translation completeness
 * 5. Generate high-quality translations using multiple services
 */

const fs = require('fs');
const path = require('path');

// Supported locales from your next-i18next.config.mjs
const SUPPORTED_LOCALES = [
  'bn', 'de', 'en', 'es', 'fr', 'he', 'id', 'it', 'ja', 'ko', 
  'pl', 'pt', 'ru', 'ro', 'sv', 'te', 'vi', 'zh', 'ar', 'tr', 'ca', 'fi'
];

// Language names for better display
const LANGUAGE_NAMES = {
  'ar': 'Arabic',
  'bn': 'Bengali',
  'ca': 'Catalan',
  'de': 'German',
  'en': 'English',
  'es': 'Spanish',
  'fi': 'Finnish',
  'fr': 'French',
  'he': 'Hebrew',
  'id': 'Indonesian',
  'it': 'Italian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'pl': 'Polish',
  'pt': 'Portuguese',
  'ro': 'Romanian',
  'ru': 'Russian',
  'sv': 'Swedish',
  'te': 'Telugu',
  'tr': 'Turkish',
  'vi': 'Vietnamese',
  'zh': 'Chinese'
};

// Translation namespaces
const NAMESPACES = ['common', 'chat', 'sidebar', 'markdown'];

// Path to locales directory
const LOCALES_PATH = path.join(__dirname, '../public/locales');

/**
 * Extract all translation keys from English files
 */
function extractEnglishKeys() {
  const keys = {};
  
  NAMESPACES.forEach(namespace => {
    const filePath = path.join(LOCALES_PATH, 'en', `${namespace}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        keys[namespace] = Object.keys(content);
      } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
      }
    }
  });
  
  return keys;
}

/**
 * Check which languages are missing translations
 */
function checkMissingTranslations() {
  const englishKeys = extractEnglishKeys();
  const missing = {};
  
  SUPPORTED_LOCALES.forEach(locale => {
    if (locale === 'en') return; // Skip English
    
    missing[locale] = [];
    
    NAMESPACES.forEach(namespace => {
      const filePath = path.join(LOCALES_PATH, locale, `${namespace}.json`);
      
      if (!fs.existsSync(filePath)) {
        missing[locale].push(`${namespace}.json (missing file)`);
        return;
      }
      
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const missingKeys = englishKeys[namespace]?.filter(key => !content[key]) || [];
        
        if (missingKeys.length > 0) {
          missing[locale].push(`${namespace}.json (${missingKeys.length} missing keys)`);
        }
      } catch (error) {
        missing[locale].push(`${namespace}.json (error: ${error.message})`);
      }
    });
  });
  
  return missing;
}

/**
 * Check if translations are just placeholders
 */
function checkPlaceholderTranslations() {
  const englishKeys = extractEnglishKeys();
  const placeholders = {};
  
  SUPPORTED_LOCALES.forEach(locale => {
    if (locale === 'en') return; // Skip English
    
    placeholders[locale] = [];
    
    NAMESPACES.forEach(namespace => {
      const filePath = path.join(LOCALES_PATH, locale, `${namespace}.json`);
      
      if (!fs.existsSync(filePath)) {
        placeholders[locale].push(`${namespace}.json (missing file)`);
        return;
      }
      
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const placeholderKeys = englishKeys[namespace]?.filter(key => {
          const value = content[key];
          return value && (value.startsWith(`[${locale.toUpperCase()}]`) || value === key);
        }) || [];
        
        if (placeholderKeys.length > 0) {
          placeholders[locale].push(`${namespace}.json (${placeholderKeys.length} placeholder keys)`);
        }
      } catch (error) {
        placeholders[locale].push(`${namespace}.json (error: ${error.message})`);
      }
    });
  });
  
  return placeholders;
}

/**
 * Create empty translation files for a locale
 */
function createEmptyTranslationFiles(locale) {
  const localePath = path.join(LOCALES_PATH, locale);
  
  // Create locale directory if it doesn't exist
  if (!fs.existsSync(localePath)) {
    fs.mkdirSync(localePath, { recursive: true });
  }
  
  NAMESPACES.forEach(namespace => {
    const filePath = path.join(localePath, `${namespace}.json`);
    
    if (!fs.existsSync(filePath)) {
      const emptyContent = {};
      fs.writeFileSync(filePath, JSON.stringify(emptyContent, null, 2));
      console.log(`Created empty ${locale}/${namespace}.json`);
    }
  });
}

/**
 * Generate translation template for a locale
 */
function generateTranslationTemplate(locale) {
  const englishKeys = extractEnglishKeys();
  const localePath = path.join(LOCALES_PATH, locale);
  
  NAMESPACES.forEach(namespace => {
    const filePath = path.join(localePath, `${namespace}.json`);
    const template = {};
    
    englishKeys[namespace]?.forEach(key => {
      template[key] = `[${locale.toUpperCase()}] ${key}`;
    });
    
    fs.writeFileSync(filePath, JSON.stringify(template, null, 2));
    console.log(`Generated template for ${locale}/${namespace}.json`);
  });
}

/**
 * Translate text using Google Translate API
 */
async function translateWithGoogle(text, targetLang, apiKey) {
  if (!apiKey) {
    throw new Error('Google Translate API key is required');
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        source: 'en'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data.translations[0].translatedText;
  } catch (error) {
    console.error(`Translation error for "${text}":`, error.message);
    return null;
  }
}

/**
 * Translate a single key-value pair
 */
async function translateKey(key, value, targetLang, apiKey) {
  // Skip if value is empty or already translated
  if (!value || value.startsWith(`[${targetLang.toUpperCase()}]`)) {
    return null;
  }

  // Handle interpolation variables
  const interpolationVars = value.match(/\{\{([^}]+)\}\}/g) || [];
  let translationText = value;
  
  // Replace interpolation variables with placeholders
  interpolationVars.forEach((var_, index) => {
    translationText = translationText.replace(var_, `__PLACEHOLDER_${index}__`);
  });

  try {
    const translated = await translateWithGoogle(translationText, targetLang, apiKey);
    
    if (translated) {
      // Restore interpolation variables
      let result = translated;
      interpolationVars.forEach((var_, index) => {
        result = result.replace(`__PLACEHOLDER_${index}__`, var_);
      });
      
      return result;
    }
  } catch (error) {
    console.error(`Failed to translate "${key}":`, error.message);
  }
  
  return null;
}

/**
 * Generate real translations using Google Translate API
 */
async function generateRealTranslations(locale, apiKey) {
  const englishKeys = extractEnglishKeys();
  const localePath = path.join(LOCALES_PATH, locale);
  
  console.log(`\n🌐 Generating translations for ${LANGUAGE_NAMES[locale]} (${locale})...`);
  
  NAMESPACES.forEach(async (namespace) => {
    const englishFilePath = path.join(LOCALES_PATH, 'en', `${namespace}.json`);
    const targetFilePath = path.join(localePath, `${namespace}.json`);
    
    if (!fs.existsSync(englishFilePath)) {
      console.log(`⚠️  English file ${namespace}.json not found, skipping...`);
      return;
    }
    
    try {
      const englishContent = JSON.parse(fs.readFileSync(englishFilePath, 'utf8'));
      const targetContent = fs.existsSync(targetFilePath) 
        ? JSON.parse(fs.readFileSync(targetFilePath, 'utf8'))
        : {};
      
      let translatedCount = 0;
      const totalKeys = Object.keys(englishContent).length;
      
      for (const [key, value] of Object.entries(englishContent)) {
        // Skip if already has a real translation
        if (targetContent[key] && !targetContent[key].startsWith(`[${locale.toUpperCase()}]`)) {
          continue;
        }
        
        const translated = await translateKey(key, value, locale, apiKey);
        if (translated) {
          targetContent[key] = translated;
          translatedCount++;
          console.log(`  ✅ ${key}: "${value}" → "${translated}"`);
        } else {
          // Keep placeholder if translation failed
          targetContent[key] = `[${locale.toUpperCase()}] ${key}`;
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      fs.writeFileSync(targetFilePath, JSON.stringify(targetContent, null, 2));
      console.log(`  📝 ${namespace}.json: ${translatedCount}/${totalKeys} keys translated`);
      
    } catch (error) {
      console.error(`❌ Error processing ${namespace}.json:`, error.message);
    }
  });
}

/**
 * Validate translation completeness
 */
function validateTranslations() {
  const englishKeys = extractEnglishKeys();
  const issues = [];
  
  SUPPORTED_LOCALES.forEach(locale => {
    if (locale === 'en') return;
    
    NAMESPACES.forEach(namespace => {
      const filePath = path.join(LOCALES_PATH, locale, `${namespace}.json`);
      
      if (!fs.existsSync(filePath)) {
        issues.push(`❌ ${locale}/${namespace}.json: File missing`);
        return;
      }
      
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const missingKeys = englishKeys[namespace]?.filter(key => !content[key]) || [];
        const extraKeys = Object.keys(content).filter(key => !englishKeys[namespace]?.includes(key));
        const placeholderKeys = englishKeys[namespace]?.filter(key => {
          const value = content[key];
          return value && value.startsWith(`[${locale.toUpperCase()}]`);
        }) || [];
        
        if (missingKeys.length > 0) {
          issues.push(`⚠️  ${locale}/${namespace}.json: ${missingKeys.length} missing keys`);
        }
        
        if (extraKeys.length > 0) {
          issues.push(`⚠️  ${locale}/${namespace}.json: ${extraKeys.length} extra keys`);
        }
        
        if (placeholderKeys.length > 0) {
          issues.push(`🔤 ${locale}/${namespace}.json: ${placeholderKeys.length} placeholder keys`);
        }
        
        if (missingKeys.length === 0 && extraKeys.length === 0 && placeholderKeys.length === 0) {
          issues.push(`✅ ${locale}/${namespace}.json: Complete`);
        }
      } catch (error) {
        issues.push(`❌ ${locale}/${namespace}.json: Error - ${error.message}`);
      }
    });
  });
  
  return issues;
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2];
  const locale = process.argv[3];
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  
  switch (command) {
    case 'check':
      console.log('🔍 Checking missing translations...\n');
      const missing = checkMissingTranslations();
      Object.entries(missing).forEach(([locale, issues]) => {
        if (issues.length > 0) {
          console.log(`${locale}:`);
          issues.forEach(issue => console.log(`  - ${issue}`));
        }
      });
      break;
      
    case 'check-placeholders':
      console.log('🔤 Checking placeholder translations...\n');
      const placeholders = checkPlaceholderTranslations();
      Object.entries(placeholders).forEach(([locale, issues]) => {
        if (issues.length > 0) {
          console.log(`${LANGUAGE_NAMES[locale]} (${locale}):`);
          issues.forEach(issue => console.log(`  - ${issue}`));
        }
      });
      break;
      
    case 'create-empty':
      console.log('📁 Creating empty translation files...\n');
      SUPPORTED_LOCALES.forEach(locale => {
        if (locale !== 'en') {
          createEmptyTranslationFiles(locale);
        }
      });
      break;
      
    case 'generate-templates':
      console.log('📝 Generating translation templates...\n');
      SUPPORTED_LOCALES.forEach(locale => {
        if (locale !== 'en') {
          generateTranslationTemplate(locale);
        }
      });
      break;
      
    case 'translate':
      if (!locale) {
        console.log('❌ Please specify a locale: node scripts/generate-translations.js translate <locale>');
        console.log('Available locales:', SUPPORTED_LOCALES.filter(l => l !== 'en').join(', '));
        return;
      }
      
      if (!SUPPORTED_LOCALES.includes(locale)) {
        console.log('❌ Invalid locale. Available locales:', SUPPORTED_LOCALES.filter(l => l !== 'en').join(', '));
        return;
      }
      
      if (!apiKey) {
        console.log('❌ Google Translate API key not found. Set GOOGLE_TRANSLATE_API_KEY environment variable.');
        console.log('Get your API key from: https://console.cloud.google.com/apis/credentials');
        return;
      }
      
      await generateRealTranslations(locale, apiKey);
      break;
      
    case 'translate-all':
      if (!apiKey) {
        console.log('❌ Google Translate API key not found. Set GOOGLE_TRANSLATE_API_KEY environment variable.');
        console.log('Get your API key from: https://console.cloud.google.com/apis/credentials');
        return;
      }
      
      console.log('🌍 Generating translations for all languages...\n');
      for (const locale of SUPPORTED_LOCALES) {
        if (locale !== 'en') {
          await generateRealTranslations(locale, apiKey);
          // Add delay between languages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      break;
      
    case 'validate':
      console.log('✅ Validating translations...\n');
      const issues = validateTranslations();
      issues.forEach(issue => console.log(issue));
      break;
      
    default:
      console.log(`
🌐 Enhanced Translation Management Script

Usage: node scripts/generate-translations.js <command> [locale]

Commands:
  check                    - Check which languages are missing translations
  check-placeholders       - Check which translations are just placeholders
  create-empty             - Create empty translation files for all languages
  generate-templates       - Generate translation templates with placeholder text
  translate <locale>       - Generate real translations for a specific locale
  translate-all            - Generate real translations for all locales
  validate                 - Validate translation completeness

Environment Variables:
  GOOGLE_TRANSLATE_API_KEY - Your Google Translate API key (required for translation)

Examples:
  node scripts/generate-translations.js check
  node scripts/generate-translations.js check-placeholders
  node scripts/generate-translations.js create-empty
  node scripts/generate-translations.js generate-templates
  node scripts/generate-translations.js translate es
  node scripts/generate-translations.js translate-all
  node scripts/generate-translations.js validate

Available locales: ${SUPPORTED_LOCALES.filter(l => l !== 'en').join(', ')}

To get a Google Translate API key:
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new project or select existing one
3. Enable the Cloud Translation API
4. Create credentials (API key)
5. Set the environment variable: export GOOGLE_TRANSLATE_API_KEY="your-api-key"
      `);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  extractEnglishKeys,
  checkMissingTranslations,
  checkPlaceholderTranslations,
  createEmptyTranslationFiles,
  generateTranslationTemplate,
  generateRealTranslations,
  validateTranslations
}; 