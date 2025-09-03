import React, { useState, useRef } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from "recharts";
import "./SpeechEvaluator.css"; // We'll create this CSS file

function SpeechEvaluator() {
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [scores, setScores] = useState(null);
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("speechHistory")) || []
  );
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);
  const [lang, setLang] = useState("en-US");

  const toggleRecording = () => {
    if (recording) {
      recognitionRef.current.stop();
    } else {
      if (!("webkitSpeechRecognition" in window)) {
        alert("Speech recognition not supported in this browser");
        return;
      }
      setTranscript("");
      setFeedback("");
      setScores(null);
      
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = false;
      
      recognition.onresult = (event) => {
        const speechText = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join(" ");
        setTranscript((prev) => (prev + " " + speechText).trim());
      };
      
      recognition.onend = () => {
        setRecording(false);
        analyzeText(transcript);
      };
      
      recognition.onerror = (event) => {
        alert("Speech recognition error: " + event.error);
        setRecording(false);
      };
      
      recognitionRef.current = recognition;
      recognition.start();
      setRecording(true);
    }
  };

  const analyzeText = async (text) => {
    if (!text) return;
    setLoading(true);
    
    try {
      const response = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      setFeedback(data.feedback || "No feedback available.");
      setScores({
        fluency: data.fluency,
        grammar: data.grammar,
        vocabulary: data.vocabulary,
        pronunciation: data.pronunciation,
        overall: data.overall,
      });

      const newHistory = [
        ...history,
        {
          text,
          scores: data,
          date: new Date().toLocaleString(),
        },
      ];
      setHistory(newHistory);
      localStorage.setItem("speechHistory", JSON.stringify(newHistory));
    } catch (err) {
      setFeedback("Error analyzing text. Try again.");
      console.error(err);
    }
    setLoading(false);
  };

  const bandDescriptions = {
    5: "Frequent grammar errors, limited vocabulary, difficult to follow.",
    6: "Generally understandable, some errors reduce clarity.", 
    7: "Good range, occasional mistakes, mostly clear.",
    8: "Very good control, minor slips, fluent and coherent.",
    9: "Expert user, near-perfect fluency and accuracy.",
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("speechHistory");
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "#22c55e"; // Green
    if (score >= 6) return "#f59e0b"; // Yellow  
    return "#ef4444"; // Red
  };

  const chartData = scores ? [
    { subject: 'Fluency', score: scores.fluency, fullMark: 9 },
    { subject: 'Grammar', score: scores.grammar, fullMark: 9 },
    { subject: 'Vocabulary', score: scores.vocabulary, fullMark: 9 },
    { subject: 'Pronunciation', score: scores.pronunciation, fullMark: 9 }
  ] : [];

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">🎤</span>
            IELTS Speech Evaluator
          </h1>
          <p className="app-subtitle">
            Practice your English speaking skills and get instant IELTS band scores
          </p>
        </div>
      </header>

      <div className="main-content">
        {/* Control Panel */}
        <div className="control-panel">
          <div className="controls-grid">
            <div className="language-selector">
              <label htmlFor="language">Language Variant:</label>
              <select 
                id="language"
                value={lang} 
                onChange={(e) => setLang(e.target.value)}
                className="language-dropdown"
              >
                <option value="en-US">🇺🇸 American English</option>
                <option value="en-GB">🇬🇧 British English</option>
                <option value="en-AU">🇦🇺 Australian English</option>
              </select>
            </div>

            <button
              onClick={toggleRecording}
              className={`record-btn ${recording ? 'recording' : ''}`}
              disabled={loading}
            >
              <span className="btn-icon">
                {recording ? '⏹️' : '🎤'}
              </span>
              {recording ? 'Stop Recording' : 'Start Recording'}
              {recording && <span className="pulse"></span>}
            </button>

            {history.length > 0 && (
              <button onClick={clearHistory} className="clear-btn">
                🗑️ Clear History
              </button>
            )}
          </div>
        </div>

        {/* Transcript Section */}
        <div className="transcript-section">
          <h2 className="section-title">📝 Speech Transcript</h2>
          <div className="transcript-box">
            {transcript || "🎯 Click 'Start Recording' and begin speaking. Your speech will appear here..."}
          </div>
        </div>

        {/* Results Section */}
        <div className="results-grid">
          {/* Feedback */}
          <div className="feedback-section">
            <h2 className="section-title">💬 AI Feedback</h2>
            <div className="feedback-content">
              {loading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Analyzing your speech...</p>
                </div>
              ) : (
                <div className="feedback-text">
                  {feedback || "🤖 Feedback will appear here after analysis"}
                </div>
              )}
            </div>
          </div>

          {/* Scores */}
          {scores && (
            <div className="scores-section">
              <h2 className="section-title">📊 IELTS Band Scores</h2>
              <div className="scores-grid">
                <div className="score-card fluency">
                  <div className="score-header">
                    <span className="score-icon">💬</span>
                    <h3>Fluency & Coherence</h3>
                  </div>
                  <div className="score-value" style={{ color: getScoreColor(scores.fluency) }}>
                    {scores.fluency}
                  </div>
                  <p className="score-description">
                    {bandDescriptions[scores.fluency] || ""}
                  </p>
                </div>

                <div className="score-card grammar">
                  <div className="score-header">
                    <span className="score-icon">📝</span>
                    <h3>Grammar</h3>
                  </div>
                  <div className="score-value" style={{ color: getScoreColor(scores.grammar) }}>
                    {scores.grammar}
                  </div>
                  <p className="score-description">
                    {bandDescriptions[scores.grammar] || ""}
                  </p>
                </div>

                <div className="score-card vocabulary">
                  <div className="score-header">
                    <span className="score-icon">📚</span>
                    <h3>Vocabulary</h3>
                  </div>
                  <div className="score-value" style={{ color: getScoreColor(scores.vocabulary) }}>
                    {scores.vocabulary}
                  </div>
                  <p className="score-description">
                    {bandDescriptions[scores.vocabulary] || ""}
                  </p>
                </div>

                <div className="score-card pronunciation">
                  <div className="score-header">
                    <span className="score-icon">🗣️</span>
                    <h3>Pronunciation</h3>
                  </div>
                  <div className="score-value" style={{ color: getScoreColor(scores.pronunciation) }}>
                    {scores.pronunciation}
                  </div>
                  <p className="score-description">
                    {bandDescriptions[scores.pronunciation] || ""}
                  </p>
                </div>
              </div>

              {/* Overall Score */}
              <div className="overall-score">
                <h3>🏆 Overall Band Score</h3>
                <div className="overall-value" style={{ color: getScoreColor(scores.overall) }}>
                  {scores.overall}
                </div>
              </div>

              {/* Radar Chart */}
              <div className="chart-container">
                <h3>📈 Performance Radar</h3>
                <RadarChart width={300} height={250} data={chartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
              </div>
            </div>
          )}
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className="history-section">
            <h2 className="section-title">📋 Speech History</h2>
            <div className="history-grid">
              {history.slice(-3).reverse().map((item, index) => (
                <div key={index} className="history-item">
                  <div className="history-header">
                    <span className="history-date">{item.date}</span>
                    <span className="history-overall">
                      Band: {item.scores.overall}
                    </span>
                  </div>
                  <div className="history-text">
                    {item.text.substring(0, 100)}...
                  </div>
                  <div className="history-scores">
                    <span>F: {item.scores.fluency}</span>
                    <span>G: {item.scores.grammar}</span>
                    <span>V: {item.scores.vocabulary}</span>
                    <span>P: {item.scores.pronunciation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <p>Built with ❤️ for IELTS learners worldwide</p>
        <div className="footer-links">
          <span>🎯 Practice</span>
          <span>📈 Improve</span>
          <span>🌟 Succeed</span>
        </div>
      </footer>
    </div>
  );
}

export default SpeechEvaluator;
