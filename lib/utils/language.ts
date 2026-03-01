// Simple language detection (can be replaced with a proper library)
export function detectLanguage(text: string): string {
  // Very basic detection - just check for common patterns
  const samples = text.toLowerCase()
  
  // Count occurrences of language-specific characters/patterns
  const scores: Record<string, number> = {
    en: 0,
    pl: 0,
    de: 0,
    fr: 0,
    es: 0,
    it: 0,
  }
  
  // English: common words
  if (/\b(the|and|is|in|to|it|you|that|he|was|for|on|are|as|with|his|they|at|be|this|from)\b/i.test(samples)) {
    scores.en += 10
  }
  
  // Polish: specific characters and common words
  if (/[ąćęłńóśźż]/i.test(samples)) scores.pl += 20
  if (/\b(i|w|na|z|o|do|się|nie|jak|ale|co|to|jest|że|tak|też|ma|być|przez|pod)\b/i.test(samples)) {
    scores.pl += 10
  }
  
  // German: specific characters and common words
  if (/[äöüß]/i.test(samples)) scores.de += 20
  if (/\b(der|die|das|und|ist|zu|mit|auf|für|sich|nicht|ein|eine|dem|als|bei|aus|nach|auch|dass)\b/i.test(samples)) {
    scores.de += 10
  }
  
  // French: specific characters and common words
  if (/[éèêëàâîïôûùçœæ]/i.test(samples)) scores.fr += 20
  if (/\b(le|la|les|et|est|dans|pour|pas|une|sur|que|qui|avec|être|avoir|faire|plus|tout|bien|donc)\b/i.test(samples)) {
    scores.fr += 10
  }
  
  // Spanish: specific characters and common words
  if (/[ñáéíóúü¿¡]/i.test(samples)) scores.es += 20
  if (/\b(el|la|los|las|y|en|de|que|es|por|con|para|como|más|pero|este|esta|puede|todo|bien)\b/i.test(samples)) {
    scores.es += 10
  }
  
  // Italian: specific characters and common words
  if (/[àèéìíîòóùú]/i.test(samples)) scores.it += 20
  if (/\b(il|la|le|i|gli|e|è|in|a|per|con|su|che|non|anche|ma|come|più|questo|questa|bene)\b/i.test(samples)) {
    scores.it += 10
  }
  
  // Find the language with the highest score
  let maxLang = 'en'
  let maxScore = 0
  
  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      maxLang = lang
    }
  }
  
  return maxLang
}