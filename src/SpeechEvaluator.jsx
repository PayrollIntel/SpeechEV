import React, { useState, useRef, useEffect } from "react";

const testsRepo = [
  {
    testId: "Test1",
    questions: [
      "Describe your hometown. What do you like most about it?",
      "What are your hobbies and why do you enjoy them?",
      "Tell me about a book that has influenced you. How did it change your perspective?"
    ],
    sampleAnswers: [
      "My hometown is a beautiful coastal city with stunning beaches and a rich cultural heritage. What I love most about it is the perfect blend of modern amenities and traditional charm. The people are incredibly friendly and welcoming, and there's always something interesting happening, whether it's local festivals, art exhibitions, or outdoor activities. The climate is pleasant year-round, which allows for an active outdoor lifestyle.",
      "I have several hobbies that I'm passionate about. Reading is probably my favorite because it allows me to explore different worlds and perspectives without leaving my home. I also enjoy hiking and photography, often combining the two when I explore nature trails. These activities help me relax and disconnect from the stress of daily life while keeping me physically active and mentally stimulated.",
      "One book that profoundly influenced me was 'To Kill a Mockingbird' by Harper Lee. It opened my eyes to issues of social justice and the importance of standing up for what's right, even when it's difficult. The character of Atticus Finch taught me about moral courage and integrity. This book changed how I view prejudice and discrimination, making me more aware of social issues and inspiring me to be more empathetic towards others."
    ]
  },
  {
    testId: "Test2",
    questions: [
      "Talk about your education and what subjects you found most interesting.",
      "Describe your best friend and explain why this friendship is important to you.",
      "What are your career goals and how do you plan to achieve them?"
    ],
    sampleAnswers: [
      "I completed my bachelor's degree in Computer Science, which I found incredibly fascinating. The subjects I enjoyed most were artificial intelligence and software development because they challenged me to think logically and creatively. Programming languages like Python and Java became tools for solving complex problems. What I appreciated most about my education was how it taught me to approach challenges systematically and think critically about solutions.",
      "My best friend Sarah has been in my life for over ten years. What makes our friendship special is our ability to communicate openly and honestly about anything. She's incredibly supportive during difficult times and celebrates my successes genuinely. We share similar values and interests, but we're different enough to learn from each other. This friendship has taught me the importance of loyalty, trust, and having someone who accepts you completely for who you are.",
      "My career goal is to become a senior software engineer specializing in sustainable technology solutions. I plan to achieve this by continuously learning new programming languages and frameworks, contributing to open-source projects, and gaining experience in renewable energy applications. I'm also pursuing additional certifications and attending industry conferences to stay current with technological advances and network with professionals in the field."
    ]
  },
  {
    testId: "Test3",
    questions: [
      "Describe a memorable travel experience and what made it special.",
      "Talk about a skill you would like to learn and explain why.",
      "Discuss the role of technology in modern communication."
    ],
    sampleAnswers: [
      "Last year, I traveled to Japan, which was absolutely extraordinary. What made it special was the incredible attention to detail in everything - from the perfectly organized transportation system to the beautiful presentation of food. I was amazed by how technology and tradition coexisted harmoniously. The people were exceptionally polite and helpful, even with language barriers. Visiting ancient temples in Kyoto while experiencing the ultra-modern atmosphere of Tokyo gave me a unique perspective on how cultures can preserve their heritage while embracing innovation.",
      "I would love to learn how to play the piano because music has always been a passion of mine, but I never had the opportunity to learn an instrument properly. Piano appeals to me because it's versatile - you can play classical pieces, jazz, or contemporary music. I believe learning piano would improve my cognitive abilities, provide stress relief, and give me a creative outlet. It would also allow me to better appreciate musical compositions and potentially compose my own pieces in the future.",
      "Technology has revolutionized modern communication in remarkable ways. We can now instantly connect with people across the globe through video calls, social media, and messaging apps. This has made the world feel smaller and more connected. However, there are both positive and negative aspects. While technology enables rapid information sharing and maintains long-distance relationships, it can also lead to superficial interactions and reduced face-to-face communication skills. The key is finding balance and using technology to enhance rather than replace meaningful human connections."
    ]
  }
];

function SpeechEvaluator() {
  const [currentTest, setCurrentTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState(null);
  const [testSummary, setTestSummary] = useState(null);
  const [error, setError] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const recognitionRef = useRef(null);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    // Randomly select a test on mount
    const randomTest = testsRepo[Math.floor(Math.random() * testsRepo.length)];
    setCurrentTest(randomTest);
    setAnswers(Array(randomTest.questions.length).fill(""));
  }, []);

  useEffect(() => {
    // Cleanup timer on unmount
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const startRecordingTimer = () => {
    setRecordingTime(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    if (recording) {
      recognitionRef.current?.stop();
      return;
    }

    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setRecording(true);
        setError(null);
        startRecordingTimer();
      };

      recognition.onresult = (event) => {
        const speechText = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join(" ");
        
        setAnswers((prev) => {
          const newAnswers = [...prev];
          newAnswers[currentQuestionIndex] = speechText.trim();
          return newAnswers;
        });
      };

      recognition.onend = () => {
        setRecording(false);
        stopRecordingTimer();
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError(`Speech recognition error: ${event.error}. Please try again.`);
        setRecording(false);
        stopRecordingTimer();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError("Failed to initialize speech recognition. Please check your microphone permissions.");
      console.error("Recognition initialization error:", err);
    }
  };

  const goNext = () => {
    if (currentQuestionIndex < currentTest.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("http://localhost:5000/api/analyze-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testId: currentTest.testId,
          questions: currentTest.questions,
          answers,
          sampleAnswers: currentTest.sampleAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setFeedbacks(data.feedbacks);
      setTestSummary(data.testSummary);
      setShowResults(true);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Error during analysis. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetTest = () => {
    const randomTest = testsRepo[Math.floor(Math.random() * testsRepo.length)];
    setCurrentTest(randomTest);
    setAnswers(Array(randomTest.questions.length).fill(""));
    setCurrentQuestionIndex(0);
    setFeedbacks(null);
    setTestSummary(null);
    setShowResults(false);
    setError(null);
    setRecordingTime(0);
  };

  const getBandColor = (band) => {
    if (band >= 8.5) return "#2e7d32"; // Dark green
    if (band >= 7) return "#388e3c";   // Green
    if (band >= 6.5) return "#689f38"; // Light green
    if (band >= 6) return "#afb42b";   // Yellow green
    if (band >= 5.5) return "#f57f17"; // Dark yellow
    if (band >= 5) return "#ff8f00";   // Orange
    if (band >= 4) return "#f57c00";   // Dark orange
    return "#d32f2f";                  // Red
  };

  if (!currentTest) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div>Loading test...</div>
      </div>
    );
  }

  if (showResults && feedbacks) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1 style={{ textAlign: "center", color: "#333" }}>IELTS Speaking Test Results</h1>
        
        {testSummary && (
          <div style={{ 
            backgroundColor: "#f5f5f5", 
            padding: "20px", 
            borderRadius: "8px", 
            marginBottom: "30px",
            border: `3px solid ${getBandColor(testSummary.overall)}`
          }}>
            <h2 style={{ textAlign: "center", margin: "0 0 15px 0" }}>Overall Test Performance</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: getBandColor(testSummary.overall) }}>
                  {testSummary.overall}
                </div>
                <div>Overall Band</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: getBandColor(testSummary.fluency) }}>
                  {testSummary.fluency}
                </div>
                <div>Fluency</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: getBandColor(testSummary.lexical) }}>
                  {testSummary.lexical}
                </div>
                <div>Vocabulary</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: getBandColor(testSummary.grammar) }}>
                  {testSummary.grammar}
                </div>
                <div>Grammar</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: getBandColor(testSummary.pronunciation) }}>
                  {testSummary.pronunciation}
                </div>
                <div>Pronunciation</div>
              </div>
            </div>
            <div style={{ marginTop: "15px", textAlign: "center", fontSize: "14px", color: "#666" }}>
              Total Words: {testSummary.totalWords} | Grammar Errors: {testSummary.totalErrors} | Questions Answered: {testSummary.questionsAnswered}
            </div>
          </div>
        )}

        {feedbacks.map((feedback, i) => (
          <div key={i} style={{ 
            marginBottom: "30px", 
            padding: "20px", 
            border: "1px solid #ddd", 
            borderRadius: "8px",
            backgroundColor: "#fff"
          }}>
            <div style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>
              {feedback.feedback}
            </div>
          </div>
        ))}

        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <button
            onClick={resetTest}
            style={{
              padding: "12px 30px",
              fontSize: "16px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Take Another Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#333", marginBottom: "30px" }}>
        IELTS Speaking Practice Test
      </h1>

      <div style={{ marginBottom: "30px", textAlign: "center" }}>
        <h2 style={{ color: "#555" }}>
          Question {currentQuestionIndex + 1} of {currentTest.questions.length}
        </h2>
        <div style={{ 
          backgroundColor: "#f5f5f5", 
          padding: "20px", 
          borderRadius: "8px", 
          marginBottom: "20px",
          fontSize: "18px",
          lineHeight: "1.5"
        }}>
          {currentTest.questions[currentQuestionIndex]}
        </div>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <strong>Your Response:</strong>
          {recording && (
            <div style={{ color: "#d32f2f", fontWeight: "bold" }}>
              🔴 Recording... {formatTime(recordingTime)}
            </div>
          )}
        </div>
        
        <textarea
          value={answers[currentQuestionIndex] || ""}
          onChange={(e) => {
            const newAnswers = [...answers];
            newAnswers[currentQuestionIndex] = e.target.value;
            setAnswers(newAnswers);
          }}
          placeholder="Click 'Start Recording' to record your answer, or type here..."
          style={{
            width: "100%",
            minHeight: "120px",
            padding: "12px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            fontSize: "14px",
            resize: "vertical"
          }}
        />
      </div>

      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <button
          onClick={toggleRecording}
          disabled={loading}
          style={{
            padding: "12px 30px",
            fontSize: "16px",
            backgroundColor: recording ? "#d32f2f" : "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "15px"
          }}
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </button>
        
        {error && (
          <div style={{ color: "#d32f2f", marginTop: "10px", fontSize: "14px" }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <button
          onClick={goPrev}
          disabled={currentQuestionIndex === 0 || loading}
          style={{
            padding: "10px 20px",
            backgroundColor: currentQuestionIndex === 0 ? "#ccc" : "#2196f3",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: currentQuestionIndex === 0 || loading ? "not-allowed" : "pointer"
          }}
        >
          ← Previous
        </button>

        <div style={{ fontSize: "14px", color: "#666" }}>
          {answers.filter(a => a.trim().length > 0).length} of {currentTest.questions.length} answered
        </div>

        <button
          onClick={goNext}
          disabled={currentQuestionIndex === currentTest.questions.length - 1 || loading}
          style={{
            padding: "10px 20px",
            backgroundColor: currentQuestionIndex === currentTest.questions.length - 1 ? "#ccc" : "#2196f3",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: currentQuestionIndex === currentTest.questions.length - 1 || loading ? "not-allowed" : "pointer"
          }}
        >
          Next →
        </button>
      </div>

      {answers.some(answer => answer.trim().length > 0) && (
        <div style={{ textAlign: "center" }}>
          <button
            onClick={submitTest}
            disabled={loading}
            style={{
              padding: "15px 40px",
              fontSize: "18px",
              backgroundColor: loading ? "#ccc" : "#ff5722",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Analyzing your responses..." : "Submit Test for Analysis"}
          </button>
        </div>
      )}

      <div style={{ marginTop: "40px", backgroundColor: "#e3f2fd", padding: "15px", borderRadius: "6px" }}>
        <h3 style={{ margin: "0 0 10px 0", color: "#1976d2" }}>Instructions:</h3>
        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px" }}>
          <li>Click "Start Recording" and speak your answer clearly</li>
          <li>You can also type your response directly in the text area</li>
          <li>Navigate between questions using Previous/Next buttons</li>
          <li>Submit when you've answered at least one question</li>
          <li>Speak naturally and try to give detailed responses</li>
        </ul>
      </div>
    </div>
  );
}

export default SpeechEvaluator;
