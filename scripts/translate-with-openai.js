#!/usr/bin/env node

/**
 * OpenAI-based Translation Script
 * 
 * This script uses OpenAI's API to generate high-quality translations.
 * It's an alternative to Google Translate that might be more accessible.
 */

const fs = require('fs');
const path = require('path');

// Supported locales
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
 * Translate text using OpenAI API
 */
async function translateWithOpenAI(text, targetLang, apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const systemPrompt = `You are a professional translator. Translate the following English text to ${LANGUAGE_NAMES[targetLang]}. 
  
Important rules:
1. Preserve any interpolation variables like {{variable}} exactly as they are
2. Maintain the same tone and style as the original
3. Keep technical terms accurate and consistent
4. Return only the translated text, nothing else
5. If the text contains placeholders like [LANG] or similar, translate the actual content, not the placeholder`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    if (error.message.includes('401')) {
      console.error(`Translation error for "${text}": Authentication failed. Please check your API key.`);
    } else {
      console.error(`Translation error for "${text}":`, error.message);
    }
    return null;
  }
}

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
 * Generate real translations using OpenAI API
 */
async function generateTranslations(locale, apiKey) {
  const englishKeys = extractEnglishKeys();
  const localePath = path.join(LOCALES_PATH, locale);
  
  console.log(`\n🌐 Generating translations for ${LANGUAGE_NAMES[locale]} (${locale})...`);
  
  for (const namespace of NAMESPACES) {
    const englishFilePath = path.join(LOCALES_PATH, 'en', `${namespace}.json`);
    const targetFilePath = path.join(localePath, `${namespace}.json`);
    
    if (!fs.existsSync(englishFilePath)) {
      console.log(`⚠️  English file ${namespace}.json not found, skipping...`);
      continue;
    }
    
    try {
      const englishContent = JSON.parse(fs.readFileSync(englishFilePath, 'utf8'));
      const targetContent = fs.existsSync(targetFilePath) 
        ? JSON.parse(fs.readFileSync(targetFilePath, 'utf8'))
        : {};
      
      let translatedCount = 0;
      const totalKeys = Object.keys(englishContent).length;
      
      console.log(`  📝 Processing ${namespace}.json (${totalKeys} keys)...`);
      
      for (const [key, value] of Object.entries(englishContent)) {
        // Skip if already has a real translation
        if (targetContent[key] && !targetContent[key].startsWith(`[${locale.toUpperCase()}]`)) {
          continue;
        }
        
        // Skip if value is empty or not a string
        if (!value || typeof value !== 'string' || value.trim() === '') {
          continue;
        }
        
        try {
          const translated = await translateWithOpenAI(value, locale, apiKey);
          if (translated) {
            targetContent[key] = translated;
            translatedCount++;
            console.log(`    ✅ ${key}: "${value}" → "${translated}"`);
          } else {
            // Keep placeholder if translation failed
            targetContent[key] = `[${locale.toUpperCase()}] ${key}`;
            console.log(`    ⚠️  ${key}: Translation failed, keeping placeholder`);
          }
        } catch (error) {
          console.log(`    ❌ ${key}: Error - ${error.message}`);
          targetContent[key] = `[${locale.toUpperCase()}] ${key}`;
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      fs.writeFileSync(targetFilePath, JSON.stringify(targetContent, null, 2));
      console.log(`  ✅ ${namespace}.json: ${translatedCount}/${totalKeys} keys translated`);
      
    } catch (error) {
      console.error(`❌ Error processing ${namespace}.json:`, error.message);
    }
  }
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2];
  const locale = process.argv[3];
  const apiKey = process.env.VLADS_OPENAI_KEY;
  
  // Validate API key format
  if (apiKey && !apiKey.startsWith('sk-')) {
    console.log('⚠️  Warning: API key format looks incorrect. OpenAI API keys typically start with "sk-"');
  }
  
  switch (command) {
    case 'translate':
      if (!locale) {
        console.log('❌ Please specify a locale: node scripts/translate-with-openai.js translate <locale>');
        console.log('Available locales:', SUPPORTED_LOCALES.filter(l => l !== 'en').join(', '));
        return;
      }
      
      if (!SUPPORTED_LOCALES.includes(locale)) {
        console.log('❌ Invalid locale. Available locales:', SUPPORTED_LOCALES.filter(l => l !== 'en').join(', '));
        return;
      }
      
      if (!apiKey) {
        console.log('❌ OpenAI API key not found. Set VLADS_OPENAI_KEY environment variable.');
        console.log('Get your API key from: https://platform.openai.com/api-keys');
        return;
      }
      
      await generateTranslations(locale, apiKey);
      break;
      
    case 'translate-all':
      if (!apiKey) {
        console.log('❌ OpenAI API key not found. Set VLADS_OPENAI_KEY environment variable.');
        console.log('Get your API key from: https://platform.openai.com/api-keys');
        return;
      }
      
      console.log('🌍 Generating translations for all languages...\n');
      for (const locale of SUPPORTED_LOCALES) {
        if (locale !== 'en') {
          await generateTranslations(locale, apiKey);
          // Add delay between languages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      break;
      
    default:
      console.log(`
🤖 OpenAI-based Translation Script

Usage: node scripts/translate-with-openai.js <command> [locale]

Commands:
  translate <locale>  - Generate translations for a specific locale
  translate-all       - Generate translations for all locales

Environment Variables:
  OPENAI_API_KEY      - Your OpenAI API key (required for translation)

Examples:
  node scripts/translate-with-openai.js translate es
  node scripts/translate-with-openai.js translate-all

Available locales: ${SUPPORTED_LOCALES.filter(l => l !== 'en').join(', ')}

To get an OpenAI API key:
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in to your account
3. Create a new API key
4. Set the environment variable: export OPENAI_API_KEY="your-api-key"

Note: This script uses GPT-3.5-turbo for translations. Make sure you have sufficient credits.
      `);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  generateTranslations,
  translateWithOpenAI
}; 