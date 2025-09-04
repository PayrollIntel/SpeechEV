// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const bandScorer = require('./bandScorer');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Grammar checking function
async function grammarCheck(text) {
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://api.languagetool.org/v2/check',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: new URLSearchParams({ 
        text: text, 
        language: 'en-US',
        enabledRules: 'GRAMMAR,TYPOS,STYLE',
        disabledRules: 'UPPERCASE_SENTENCE_START,WHITESPACE_RULE'
      }).toString(),
    });

    const matches = response.data.matches.filter(match => 
      !['UPPERCASE_SENTENCE_START', 'WHITESPACE_RULE'].includes(match.rule.id)
    );

    return { matches, success: true };
  } catch (error) {
    console.error('Grammar check error:', error.message);
    return { matches: [], success: false, error: error.message };
  }
}

// Enhanced single answer analysis
app.post('/api/analyze', async (req, res) => {
  const { text } = req.body;
  
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'No text provided for analysis' });
  }

  try {
    // Get grammar check results
    const grammarResult = await grammarCheck(text);
    
    // Calculate IELTS bands using the new scoring system
    const bands = bandScorer.calculateBands(grammarResult.matches, text);
    
    // Generate detailed feedback
    const feedback = bandScorer.generateDetailedFeedback(bands, bands.metrics, grammarResult.matches);

    const response = {
      feedback: feedback,
      fluency: bands.fluency,
      lexical: bands.lexical,
      grammar: bands.grammar,
      pronunciation: bands.pronunciation,
      overall: bands.overall,
      grammarErrors: grammarResult.matches.length,
      wordCount: bands.metrics.wordCount,
      vocabularyDiversity: Math.round(bands.metrics.typeTokenRatio * 100),
      grammarCheckSuccess: grammarResult.success
    };

    return res.json(response);

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ 
      error: 'Analysis error occurred',
      details: error.message 
    });
  }
});

// Enhanced batch analysis for multiple questions
app.post('/api/analyze-batch', async (req, res) => {
  const { testId, questions, answers, sampleAnswers } = req.body;

  if (!Array.isArray(questions) || !Array.isArray(answers)) {
    return res.status(400).json({ 
      error: 'Invalid request format. Questions and answers must be arrays.' 
    });
  }

  if (questions.length !== answers.length) {
    return res.status(400).json({ 
      error: 'Mismatch between number of questions and answers' 
    });
  }

  try {
    const feedbacks = [];
    let totalFluency = 0, totalLexical = 0, totalGrammar = 0, totalPronunciation = 0;
    let totalWords = 0, totalErrors = 0;

    for (let i = 0; i < questions.length; i++) {
      const text = answers[i] || '';
      const question = questions[i] || '';
      const sampleAnswer = sampleAnswers && sampleAnswers[i] ? sampleAnswers[i] : '';

      if (text.trim().length === 0) {
        feedbacks.push({
          feedback: `**Question ${i + 1}: "${question}"**\n\nNo answer provided. Please record your response to this question.`,
          fluency: 0,
          lexical: 0,
          grammar: 0,
          pronunciation: 0,
          overall: 0,
          sampleAnswer: sampleAnswer,
          question: question
        });
        continue;
      }

      // Grammar check for this answer
      const grammarResult = await grammarCheck(text);
      
      // Calculate bands for this answer
      const bands = bandScorer.calculateBands(grammarResult.matches, text);
      
      // Generate feedback for this specific question
      let questionFeedback = `**Question ${i + 1}: "${question}"**\n\n`;
      questionFeedback += `**Your Response Analysis:**\n`;
      questionFeedback += `Overall Band: ${bands.overall}\n\n`;
      questionFeedback += `• Fluency & Coherence: ${bands.fluency}\n`;
      questionFeedback += `• Lexical Resource: ${bands.lexical}\n`;
      questionFeedback += `• Grammar: ${bands.grammar}\n`;
      questionFeedback += `• Pronunciation: ${bands.pronunciation}\n\n`;
      
      questionFeedback += `**Response Statistics:**\n`;
      questionFeedback += `• Words: ${bands.metrics.wordCount}\n`;
      questionFeedback += `• Vocabulary diversity: ${Math.round(bands.metrics.typeTokenRatio * 100)}%\n`;
      questionFeedback += `• Grammar errors: ${grammarResult.matches.length}\n\n`;

      // Add specific improvement suggestions
      if (bands.overall < 6) {
        questionFeedback += `**Key Areas for Improvement:**\n`;
        if (bands.metrics.wordCount < 50) {
          questionFeedback += `• Provide longer, more detailed responses\n`;
        }
        if (bands.fluency < 6) {
          questionFeedback += `• Reduce hesitations and improve flow\n`;
        }
        if (bands.lexical < 6) {
          questionFeedback += `• Use more varied and sophisticated vocabulary\n`;
        }
        if (bands.grammar < 6) {
          questionFeedback += `• Focus on grammar accuracy and complex structures\n`;
        }
        questionFeedback += `\n`;
      }

      // Show grammar errors if any
      if (grammarResult.matches.length > 0) {
        questionFeedback += `**Grammar Issues Detected:**\n`;
        grammarResult.matches.slice(0, 3).forEach((match, idx) => {
          const errorText = text.substr(match.offset, match.length);
          questionFeedback += `${idx + 1}. ${match.message} - "${errorText}"\n`;
          if (match.replacements && match.replacements.length > 0) {
            questionFeedback += `   Suggested: "${match.replacements[0].value}"\n`;
          }
        });
        questionFeedback += `\n`;
      }

      if (sampleAnswer) {
        questionFeedback += `**Sample Answer for Reference:**\n*${sampleAnswer}*`;
      }

      feedbacks.push({
        feedback: questionFeedback,
        fluency: bands.fluency,
        lexical: bands.lexical,
        grammar: bands.grammar,
        pronunciation: bands.pronunciation,
        overall: bands.overall,
        wordCount: bands.metrics.wordCount,
        grammarErrors: grammarResult.matches.length,
        sampleAnswer: sampleAnswer,
        question: question
      });

      // Accumulate totals for overall test score
      totalFluency += bands.fluency;
      totalLexical += bands.lexical;
      totalGrammar += bands.grammar;
      totalPronunciation += bands.pronunciation;
      totalWords += bands.metrics.wordCount;
      totalErrors += grammarResult.matches.length;
    }

    // Calculate overall test performance
    const validAnswers = feedbacks.filter(f => f.overall > 0).length;
    const overallTestScore = validAnswers > 0 ? {
      fluency: Math.round((totalFluency / validAnswers) * 2) / 2,
      lexical: Math.round((totalLexical / validAnswers) * 2) / 2,
      grammar: Math.round((totalGrammar / validAnswers) * 2) / 2,
      pronunciation: Math.round((totalPronunciation / validAnswers) * 2) / 2,
      overall: Math.round(((totalFluency + totalLexical + totalGrammar + totalPronunciation) / (validAnswers * 4)) * 2) / 2,
      totalWords: totalWords,
      totalErrors: totalErrors,
      questionsAnswered: validAnswers
    } : null;

    return res.json({
      feedbacks: feedbacks,
      testSummary: overallTestScore,
      testId: testId
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    return res.status(500).json({ 
      error: 'Batch analysis error occurred',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0.0' 
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`IELTS Speech Evaluator Backend listening on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
});
