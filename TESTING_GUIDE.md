# CropWizard Smart Citation Formatting - Testing Guide

## 🎯 Testing Objectives
Test the new smart citation formatting in **CropWizard** that shows:
- **1-2 citations**: Full document titles
- **3+ citations**: Numbers only

## 🌾 How to Access CropWizard
1. **Production**: Visit your deployed preview URL from the Vercel email
2. **Local**: Run `npm run dev` and go to `http://localhost:3000/cropwizard-1.5`
3. **Direct URL**: Navigate to `/cropwizard-1.5` in your browser

## 📋 Test Scenarios for CropWizard

### Scenario 1: Single Citation (Agricultural Topics)
**Expected**: Full title displayed
- Ask: "What are Japanese beetles?"
- Ask: "How do I identify soybean diseases?"
- Ask: "What is the best time to plant corn?"
- Verify: `"KY_Apple_Crop-Profile.pdf, p.79"` format

### Scenario 2: Two Citations (Agricultural Topics)
**Expected**: Full titles displayed
- Ask: "What are the best pest control methods for tomatoes?"
- Ask: "How do I manage soil fertility and irrigation?"
- Ask: "What are the symptoms of common plant diseases?"
- Verify: `"Doc1, p.123; Doc2, p.456"` format

### Scenario 3: Three or More Citations (Agricultural Topics)
**Expected**: Numbers only
- Ask: "What are all the pest control methods mentioned in the materials?"
- Ask: "List all the plant diseases and their treatments"
- Ask: "What are the different soil types and their characteristics?"
- Ask: "What are all the crop management techniques?"
- Verify: `"1, p.123; 2; 3, p.456"` format

### Scenario 4: Mixed Citation Counts
**Expected**: Smart switching based on count
- Test questions that naturally have varying citation counts
- Verify proper switching between title and number formats

## 🔧 Configuration Testing

### Test Different Modes
1. **Smart Mode** (default): `CITATION_DISPLAY_MODE = 'smart'`
2. **Titles Only**: Change to `CITATION_DISPLAY_MODE = 'titles'`
3. **Numbers Only**: Change to `CITATION_DISPLAY_MODE = 'numbers'`

## 📝 CropWizard-Specific Test Questions

### For Single Citations:
- "What are Japanese beetles?"
- "How do I identify soybean diseases?"
- "What is the best time to plant corn?"
- "What are the symptoms of corn blight?"

### For Multiple Citations:
- "What are the best pest control methods for tomatoes?"
- "How do I manage soil fertility and irrigation?"
- "What are the symptoms of common plant diseases?"
- "What are the different types of soil?"

### For Many Citations:
- "What are all the pest control methods mentioned in the materials?"
- "List all the plant diseases and their treatments"
- "What are the different soil types and their characteristics?"
- "What are all the crop management techniques?"
- "What are all the agricultural best practices?"

## ✅ Verification Checklist

- [ ] Single citations show full titles (e.g., "KY_Apple_Crop-Profile.pdf, p.79")
- [ ] Two citations show full titles separated by semicolons
- [ ] Three+ citations show numbers only (e.g., "1, p.79; 2; 3, p.15")
- [ ] Page numbers are preserved in all formats
- [ ] Links still work correctly
- [ ] Tooltips show citation numbers
- [ ] No visual glitches or formatting issues
- [ ] Performance is not impacted
- [ ] Answers don't appear "exorbitantly long" anymore

## 🐛 Common Issues to Watch For

1. **Citation counting**: Ensure the system correctly counts citations
2. **Format consistency**: All citations in a group should use the same format
3. **Link functionality**: Citations should still be clickable
4. **Page numbers**: Should be preserved in all formats
5. **Special characters**: Handle titles with special characters properly
6. **Agricultural document titles**: Long extension service document names

## 📊 Performance Testing

- Test with very long agricultural document titles
- Test with many citations (10+)
- Verify no performance degradation
- Check memory usage

## 🔄 Regression Testing

- Ensure existing citation functionality still works
- Test backward compatibility
- Verify no breaking changes to other features
- Test image upload functionality (important for CropWizard)

## 📱 Responsive Testing

- Test on different screen sizes
- Verify citations wrap properly on mobile
- Check readability on small screens
- Test on tablets (farmers often use tablets)

## 🎯 Specific CropWizard Features to Test

- **Image uploads**: CropWizard heavily uses image uploads for plant identification
- **Agricultural terminology**: Ensure citations work with farming terms
- **Extension service documents**: Test with long extension document names
- **Multi-language support**: If applicable for agricultural terms 