export const PRESET_CATEGORIES = [
  {
    id: 'animals',
    name: 'Animals',
    words: ['Elephant', 'Giraffe', 'Lion', 'Tiger', 'Zebra', 'Dog', 'Cat', 'Bear']
  },
  {
    id: 'fruits',
    name: 'Fruits',
    words: ['Apple', 'Banana', 'Orange', 'Mango', 'Grapes', 'Pineapple', 'Strawberry', 'Watermelon']
  },
  {
    id: 'professions',
    name: 'Professions',
    words: ['Doctor', 'Engineer', 'Teacher', 'Lawyer', 'Artist', 'Actor', 'Pilot', 'Chef']
  }
];

export function getRandomWordFromCategory(categoryId: string): string {
  const category = PRESET_CATEGORIES.find(c => c.id === categoryId);
  if (!category) return '';
  const randomIndex = Math.floor(Math.random() * category.words.length);
  return category.words[randomIndex];
}

export function getRandomWordWithSettings(settings: any): { category: string, word: string, relatedWord: string | null } {
  const { activeCategories, customWords, wordSource } = settings;
  
  let usePreset = wordSource === 'preset' || wordSource === 'both';
  let useCustom = wordSource === 'custom' || wordSource === 'both';

  // Fallback to presets if custom is chosen but empty
  if (useCustom && (!customWords || customWords.length === 0)) {
    useCustom = false;
    usePreset = true;
  }
  // Fallback to all presets if preset chosen but activeCategories empty
  let availablePresets = PRESET_CATEGORIES;
  if (usePreset && activeCategories && activeCategories.length > 0) {
    availablePresets = PRESET_CATEGORIES.filter(c => activeCategories.includes(c.id));
    if (availablePresets.length === 0) availablePresets = PRESET_CATEGORIES;
  }

  const choices: ('preset' | 'custom')[] = [];
  if (usePreset) choices.push('preset');
  if (useCustom) choices.push('custom');

  const selectedSource = choices[Math.floor(Math.random() * choices.length)];

  if (selectedSource === 'custom') {
    const wordIndex = Math.floor(Math.random() * customWords.length);
    const word = customWords[wordIndex];
    let relatedWord = null;
    if (customWords.length > 1) {
      let rIdx = Math.floor(Math.random() * customWords.length);
      while(rIdx === wordIndex) rIdx = Math.floor(Math.random() * customWords.length);
      relatedWord = customWords[rIdx];
    }
    return { category: 'Custom Word', word, relatedWord };
  } else {
    const category = availablePresets[Math.floor(Math.random() * availablePresets.length)];
    const wordIndex = Math.floor(Math.random() * category.words.length);
    const word = category.words[wordIndex];
    let relatedWord = null;
    if (category.words.length > 1) {
      let rIdx = Math.floor(Math.random() * category.words.length);
      while(rIdx === wordIndex) rIdx = Math.floor(Math.random() * category.words.length);
      relatedWord = category.words[rIdx];
    }
    return { category: category.name, word, relatedWord };
  }
}

