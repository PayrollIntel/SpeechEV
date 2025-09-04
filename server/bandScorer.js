// bandScorer.js
const DESCRIPTORS = require('./ieltsDescriptors.json');

// Advanced metrics calculation
function calculateAdvancedMetrics(text) {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  
  // Fluency metrics
  const pauseMarkers = (text.match(/\b(um|uh|er|ah|hmm)\b/gi) || []).length;
  const repetitionMarkers = (text.match(/\b(\w+)\s+\1\b/gi) || []).length;
  const selfCorrectionMarkers = (text.match(/\b(sorry|I mean|actually|wait)\b/gi) || []).length;
  
  // Discourse markers
  const basicConnectives = (text.match(/\b(and|but|so|then|because)\b/gi) || []).length;
  const advancedConnectives = (text.match(/\b(however|moreover|furthermore|nevertheless|consequently|therefore)\b/gi) || []).length;
  
  // Vocabulary complexity
  const commonWords = (text.match(/\b(the|is|are|was|were|have|has|had|do|does|did|will|would|can|could|should|may|might)\b/gi) || []).length;
  const lessCommonWords = words.filter(word => word.length > 6 && !commonWords.includes(word.toLowerCase())).length;
  
  // Grammar complexity
  const simplePresent = (text.match(/\b(am|is|are)\b/gi) || []).length;
  const complexTenses = (text.match(/\b(have been|had been|will have|would have|could have|should have)\b/gi) || []).length;
  const subordinateClauses = (text.match(/\b(which|that|who|whom|whose|when|where|why|although|though|while|since|if|unless|until)\b/gi) || []).length;
  
  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    uniqueWordCount: uniqueWords.size,
    typeTokenRatio: uniqueWords.size / Math.max(words.length, 1),
    avgWordsPerSentence: words.length / Math.max(sentences.length, 1),
    
    // Fluency indicators
    pauseMarkers,
    repetitionMarkers,
    selfCorrectionMarkers,
    fluencyScore: Math.max(0, 1 - (pauseMarkers + repetitionMarkers * 2 + selfCorrectionMarkers) / Math.max(words.length * 0.1, 1)),
    
    // Coherence indicators
    basicConnectives,
    advancedConnectives,
    coherenceScore: Math.min(1, (basicConnectives + advancedConnectives * 2) / Math.max(sentences.length * 0.5, 1)),
    
    // Lexical resource indicators
    lessCommonWords,
    lexicalDiversity: Math.min(1, uniqueWords.size / Math.max(words.length * 0.7, 1)),
    vocabularyScore: Math.min(1, (lessCommonWords * 2 + uniqueWords.size) / Math.max(words.length, 1)),
    
    // Grammar indicators
    simplePresent,
    complexTenses,
    subordinateClauses,
    grammarComplexity: Math.min(1, (complexTenses * 3 + subordinateClauses * 2) / Math.max(sentences.length, 1))
  };
}

function scoreToBand(score) {
  if (score >= 0.95) return 9;
  if (score >= 0.88) return 8.5;
  if (score >= 0.82) return 8;
  if (score >= 0.78) return 7.5;
  if (score >= 0.72) return 7;
  if (score >= 0.68) return 6.5;
  if (score >= 0.62) return 6;
  if (score >= 0.58) return 5.5;
  if (score >= 0.52) return 5;
  if (score >= 0.48) return 4.5;
  if (score >= 0.42) return 4;
  if (score >= 0.38) return 3.5;
  if (score >= 0.32) return 3;
  if (score >= 0.28) return 2.5;
  if (score >= 0.22) return 2;
  if (score >= 0.18) return 1.5;
  return 1;
}

function calculateFluencyBand(metrics, grammarErrors) {
  let fluencyScore = metrics.fluencyScore;
  
  // Adjust based on speech length and complexity
  if (metrics.wordCount < 50) fluencyScore *= 0.7; // Too short
  if (metrics.avgWordsPerSentence > 20) fluencyScore *= 0.9; // May indicate run-on sentences
  if (metrics.avgWordsPerSentence < 8) fluencyScore *= 0.8; // Too simple
  
  // Coherence factor
  fluencyScore = (fluencyScore + metrics.coherenceScore) / 2;
  
  return scoreToBand(Math.max(0, Math.min(1, fluencyScore)));
}

function calculateLexicalBand(metrics) {
  let lexicalScore = metrics.vocabularyScore;
  
  // Reward lexical diversity
  if (metrics.typeTokenRatio > 0.6) lexicalScore *= 1.1;
  if (metrics.typeTokenRatio < 0.3) lexicalScore *= 0.8;
  
  // Consider word length and complexity
  lexicalScore = (lexicalScore + metrics.lexicalDiversity) / 2;
  
  return scoreToBand(Math.max(0, Math.min(1, lexicalScore)));
}

function calculateGrammarBand(metrics, grammarErrors) {
  const errorRate = grammarErrors.length / Math.max(metrics.wordCount * 0.05, 1);
  let grammarScore = Math.max(0, 1 - errorRate);
  
  // Reward complex grammar usage
  grammarScore = (grammarScore + metrics.grammarComplexity) / 2;
  
  // Penalize if no complex structures are used
  if (metrics.grammarComplexity < 0.1) grammarScore *= 0.8;
  
  return scoreToBand(Math.max(0, Math.min(1, grammarScore)));
}

function calculatePronunciationBand(metrics) {
  // Placeholder - in real implementation, this would use audio analysis
  // For now, we'll estimate based on text complexity and assume average pronunciation
  let pronunciationScore = 0.7; // Base score
  
  // Adjust based on text complexity (more complex = potentially better pronunciation)
  if (metrics.vocabularyScore > 0.7) pronunciationScore += 0.1;
  if (metrics.grammarComplexity > 0.5) pronunciationScore += 0.1;
  
  return scoreToBand(Math.max(0, Math.min(1, pronunciationScore)));
}

function calculateBands(grammarErrors, text) {
  const metrics = calculateAdvancedMetrics(text);
  
  const fluencyBand = calculateFluencyBand(metrics, grammarErrors);
  const lexicalBand = calculateLexicalBand(metrics);
  const grammarBand = calculateGrammarBand(metrics, grammarErrors);
  const pronunciationBand = calculatePronunciationBand(metrics);
  
  const overallBand = Math.round(((fluencyBand + lexicalBand + grammarBand + pronunciationBand) / 4) * 2) / 2;
  
  return {
    fluency: fluencyBand,
    lexical: lexicalBand,
    grammar: grammarBand,
    pronunciation: pronunciationBand,
    overall: overallBand,
    metrics: metrics
  };
}

function generateDetailedFeedback(bands, metrics, grammarErrors) {
  const fluencyDesc = DESCRIPTORS.fluency_coherence[Math.floor(bands.fluency).toString()] || ["No description available"];
  const lexicalDesc = DESCRIPTORS.lexical_resource[Math.floor(bands.lexical).toString()] || ["No description available"];
  const grammarDesc = DESCRIPTORS.grammatical_range[Math.floor(bands.grammar).toString()] || ["No description available"];
  const pronunciationDesc = DESCRIPTORS.pronunciation[Math.floor(bands.pronunciation).toString()] || ["No description available"];
  
  let feedback = `**IELTS Speaking Assessment Results**\n\n`;
  feedback += `**Overall Band Score: ${bands.overall}**\n\n`;
  
  feedback += `**Fluency and Coherence - Band ${bands.fluency}:**\n`;
  feedback += `${fluencyDesc.map(desc => `• ${desc}`).join('\n')}\n\n`;
  
  feedback += `**Lexical Resource - Band ${bands.lexical}:**\n`;
  feedback += `${lexicalDesc.map(desc => `• ${desc}`).join('\n')}\n\n`;
  
  feedback += `**Grammatical Range and Accuracy - Band ${bands.grammar}:**\n`;
  feedback += `${grammarDesc.map(desc => `• ${desc}`).join('\n')}\n\n`;
  
  feedback += `**Pronunciation - Band ${bands.pronunciation}:**\n`;
  feedback += `${pronunciationDesc.map(desc => `• ${desc}`).join('\n')}\n\n`;
  
  // Specific feedback based on metrics
  feedback += `**Detailed Analysis:**\n`;
  feedback += `• Word count: ${metrics.wordCount} words\n`;
  feedback += `• Vocabulary diversity: ${(metrics.typeTokenRatio * 100).toFixed(1)}%\n`;
  feedback += `• Average sentence length: ${metrics.avgWordsPerSentence.toFixed(1)} words\n`;
  feedback += `• Grammar errors found: ${grammarErrors.length}\n`;
  
  if (metrics.pauseMarkers > 0) {
    feedback += `• Hesitation markers detected: ${metrics.pauseMarkers}\n`;
  }
  
  if (metrics.repetitionMarkers > 0) {
    feedback += `• Repetitions detected: ${metrics.repetitionMarkers}\n`;
  }
  
  // Improvement suggestions
  feedback += `\n**Areas for Improvement:**\n`;
  
  if (bands.fluency < 6) {
    feedback += `• Work on reducing pauses and hesitations\n`;
    feedback += `• Practice using linking words more naturally\n`;
  }
  
  if (bands.lexical < 6) {
    feedback += `• Expand your vocabulary with less common words\n`;
    feedback += `• Practice paraphrasing and using synonyms\n`;
  }
  
  if (bands.grammar < 6) {
    feedback += `• Focus on using more complex sentence structures\n`;
    feedback += `• Review grammar rules to reduce errors\n`;
  }
  
  if (bands.pronunciation < 6) {
    feedback += `• Practice pronunciation of individual sounds\n`;
    feedback += `• Work on word stress and sentence intonation\n`;
  }
  
  if (grammarErrors.length > 0) {
    feedback += `\n**Specific Grammar Issues:**\n`;
    grammarErrors.slice(0, 5).forEach((error, index) => {
      feedback += `${index + 1}. ${error.message}\n`;
      if (error.replacements && error.replacements.length > 0) {
        feedback += `   Suggestion: "${error.replacements[0].value}"\n`;
      }
    });
  }
  
  return feedback;
}

module.exports = {
  calculateBands,
  generateDetailedFeedback,
  calculateAdvancedMetrics
};