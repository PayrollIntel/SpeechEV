import React, { useState, useRef } from "react";

function SpeechEvaluator() {
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);

  const toggleRecording = () => {
    if (recording) {
      // Stop recording
      recognitionRef.current.stop();
    } else {
      // Start recording
      if (!("webkitSpeechRecognition" in window)) {
        alert("Speech recognition not supported in this browser");
        return;
      }
      // Reset previous data
      setTranscript("");
      setFeedback("");
      setScores(null);

      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const speechText = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join(" ");
        setTranscript((prev) => (prev + " " + speechText).trim());
      };

      recognition.onend = () => {
        // Recognition stopped: trigger analysis
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

      // Expected response format:
      // {
      //   fluency: number,
      //   grammar: number,
      //   vocabulary: number,
      //   pronunciation: number,
      //   overall: number,
      //   feedback: string
      // }

      setFeedback(data.feedback || "No feedback available.");
      setScores({
        fluency: data.fluency,
        grammar: data.grammar,
        vocabulary: data.vocabulary,
        pronunciation: data.pronunciation,
        overall: data.overall,
      });
    } catch (err) {
      setFeedback("Error analyzing text");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 700, margin: "auto", fontFamily: "Arial" }}>
      <h1>🎤 IELTS Speech Evaluator</h1>

      <button
        onClick={toggleRecording}
        style={{
          padding: "10px 20px",
          marginBottom: "20px",
          fontSize: "16px",
          background: recording ? "#e74c3c" : "#2ecc71",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        {recording ? "⏹️ Stop Recording" : "▶️ Start Recording"}
      </button>

      <h3>Transcript:</h3>
      <p
        style={{
          minHeight: 80,
          border: "1px solid #ccc",
          padding: 10,
          borderRadius: "6px",
          background: "#fafafa",
        }}
      >
        {transcript || "🎙️ Your speech will appear here..."}
      </p>

      <h3>Feedback:</h3>
      {loading ? (
        <p>⏳ Analyzing...</p>
      ) : (
        <p style={{ whiteSpace: "pre-wrap" }}>
          {feedback || "📄 Feedback will appear here after analysis."}
        </p>
      )}

      {scores && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            border: "1px solid #ccc",
            borderRadius: "8px",
            background: "#f9f9f9",
          }}
        >
          <h3>📊 IELTS Band Scores</h3>
          <p>Fluency & Coherence: <b>{scores.fluency}</b></p>
          <p>Grammar: <b>{scores.grammar}</b></p>
          <p>Vocabulary: <b>{scores.vocabulary}</b></p>
          <p>Pronunciation: <b>{scores.pronunciation}</b></p>
          <h4>⭐ Overall Band: {scores.overall}</h4>
        </div>
      )}
    </div>
  );
}

export default SpeechEvaluator;
