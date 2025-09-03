const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Helper: Map numeric score (0-1) to IELTS band (0-9)
function scoreToBand(score) {
  if (score < 0.15) return 3;
  if (score < 0.30) return 4;
  if (score < 0.45) return 5;
  if (score < 0.60) return 6;
  if (score < 0.75) return 7;
  if (score < 0.90) return 8;
  return 9;
}

app.post("/api/analyze", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    // Call LanguageTool API for grammar checks
    const ltRes = await axios({
      method: "POST",
      url: "https://api.languagetool.org/v2/check",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: new URLSearchParams({ text, language: "en-US" }).toString(),
    });

    // Filter out irrelevant rules
    const matches = ltRes.data.matches.filter(
      (m) => m.rule.id !== "UPPERCASE_SENTENCE_START"
    );

    const words = text.match(/\b\w+\b/g) || [];
    const wordCount = words.length;
    const sentences = text.match(/[^.!?]+[.!?]/g) || [text];
    const sentenceCount = sentences.length;

    // Vocabulary metrics
    const uniqueCount = new Set(words.map((w) => w.toLowerCase())).size;
    const lexicalRichness = wordCount ? uniqueCount / wordCount : 0;

    // Grammar accuracy
    const grammarErrors = matches.length;
    const maxErrors = Math.max(3, 0.05 * wordCount);
    const grammarAccuracy = Math.max(0, 1 - grammarErrors / maxErrors);

    // Fluency & coherence proxy
    const avgSentenceLength = wordCount / sentenceCount || 0;
    const shortFragments = sentences.filter(
      (s) => (s.match(/\b\w+\b/g) || []).length < 3
    ).length;
    const fluencyScore =
      1 - shortFragments / Math.max(3, 0.1 * sentenceCount);

    // Repetition penalty
    const wordFreqs = words.reduce((acc, w) => {
      acc[w] = (acc[w] || 0) + 1;
      return acc;
    }, {});
    const repeatedCount = Object.values(wordFreqs)
      .filter((freq) => freq > 2)
      .reduce((sum, freq) => sum + (freq - 2), 0);
    const repetitionPenalty = Math.max(
      0,
      1 - repeatedCount / Math.max(1, 0.1 * wordCount)
    );

    // Weighted composite scores (0–1)
    const lexScore = lexicalRichness;
    const gramScore = grammarAccuracy;
    const fluencyCoherenceScore =
      0.5 * fluencyScore + 0.5 * repetitionPenalty;

    // Convert to IELTS bands
    const lexicalBand = scoreToBand(lexScore);
    const grammarBand = scoreToBand(gramScore);
    const fluencyBand = scoreToBand(fluencyCoherenceScore);

    // Pronunciation proxy (average of other bands)
    const pronunciationBand = Math.round(
      (lexicalBand + grammarBand + fluencyBand) / 3
    );

    // Overall average
    const overallBand = Math.round(
      (lexicalBand + grammarBand + fluencyBand + pronunciationBand) / 4
    );

    // Feedback text
    let feedback = `Grammar issues: ${grammarErrors}`;
    if (grammarErrors) {
      feedback += `\nTop grammar problems:`;
      matches.slice(0, 3).forEach((m, i) => {
        const snippet = text.substr(m.offset, m.length);
        feedback += `\n${i + 1}. ${m.message} — "${snippet}"`;
      });
    } else {
      feedback += `\nNo major grammar issues found.`;
    }

    feedback += `\n\nLexical richness: ${(lexicalRichness * 100).toFixed(0)}%`;
    feedback += `\nFluency score: ${(fluencyCoherenceScore * 100).toFixed(0)}%`;
    feedback += `\nRepetition penalty applied: ${(repetitionPenalty * 100).toFixed(0)}%`;

    // Respond with structured JSON
    res.json({
      feedback,
      fluency: fluencyBand,
      grammar: grammarBand,
      vocabulary: lexicalBand,
      pronunciation: pronunciationBand,
      overall: overallBand,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis error" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
