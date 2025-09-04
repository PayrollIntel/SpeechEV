# IELTS Speech Evaluator - Enhanced Version

An advanced IELTS Speaking test evaluation application that provides comprehensive feedback based on official IELTS band descriptors.

## Features

### Core Functionality
- **Real-time Speech Recognition**: Record answers using Web Speech API
- **Comprehensive IELTS Scoring**: Evaluation across all four IELTS criteria
- **Detailed Feedback**: Specific suggestions based on official band descriptors
- **Multiple Test Sets**: Various question sets with sample answers
- **Batch Analysis**: Analyze complete test sessions

### Scoring Categories
1. **Fluency and Coherence** - Flow, hesitation, and logical structure
2. **Lexical Resource** - Vocabulary range, accuracy, and appropriateness
3. **Grammatical Range and Accuracy** - Grammar complexity and correctness
4. **Pronunciation** - Clarity and accent (estimated from text analysis)

### Advanced Analytics
- Word count and vocabulary diversity analysis
- Grammar error detection and correction suggestions
- Fluency markers identification (hesitations, repetitions)
- Discourse markers and connectives usage
- Complex sentence structure analysis

## Installation

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-username/ielts-speech-evaluator.git
cd ielts-speech-evaluator
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory** (if separate)
```bash
cd frontend
```

2. **Install React dependencies**
```bash
npm install
```

3. **Start the React application**
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## File Structure

```
ielts-speech-evaluator/
├── server.js                 # Main Express server
├── bandScorer.js            # IELTS scoring logic
├── ieltsDescriptors.json    # Official IELTS band descriptors
├── SpeechEvaluator.jsx      # React frontend component
├── package.json             # Node.js dependencies
└── README.md               # This file
```

## API Endpoints

### POST `/api/analyze`
Analyze a single text response
```json
{
  "text": "Your spoken response here..."
}
```

**Response:**
```json
{
  "feedback": "Detailed feedback string",
  "fluency": 7.0,
  "lexical": 6.5,
  "grammar": 7.5,
  "pronunciation": 7.0,
  "overall": 7.0,
  "wordCount": 150,
  "grammarErrors": 2
}
```

### POST `/api/analyze-batch`
Analyze multiple questions and responses
```json
{
  "testId": "Test1",
  "questions": ["Question 1", "Question 2"],
  "answers": ["Answer 1", "Answer 2"],
  "sampleAnswers": ["Sample 1", "Sample 2"]
}
```

### GET `/api/health`
Health check endpoint

## Usage

### For Test Takers

1. **Select Questions**: The app randomly selects a test with multiple questions
2. **Record Responses**: Click "Start Recording" and speak your answer clearly
3. **Navigate**: Use Previous/Next buttons to move between questions
4. **Submit**: Click "Submit Test for Analysis" when ready
5. **Review Results**: Get detailed feedback with specific band scores

### Recording Tips
- Ensure microphone permissions are enabled
- Speak clearly and at a natural pace
- Aim for detailed responses (100+ words per question)
- Use a quiet environment for best recognition

## Scoring System

The application uses official IELTS band descriptors (1-9 scale) to evaluate:

### Band 9 (Expert User)
- Full operational command of the language
- Appropriate, accurate, and fluent usage
- Complete understanding

### Band 7 (Good User)
- Operational command with occasional inaccuracies
- Generally handles complex language well
- Understands detailed reasoning

### Band 5 (Modest User)
- Partial command of the language
- Handles overall meaning in familiar situations
- Makes many mistakes

### Band Calculations
- Each criterion is scored individually (1-9 scale)
- Overall band is the average of four criteria
- Half-band scores (e.g., 6.5, 7.5) are supported

## Advanced Features

### Text Analysis Metrics
- **Type-Token Ratio**: Vocabulary diversity measurement
- **Sentence Complexity**: Analysis of grammar structures
- **Discourse Markers**: Coherence and cohesion indicators
- **Fluency Markers**: Detection of hesitations and repetitions

### Grammar Analysis
- Integration with LanguageTool API for error detection
- Categorization of error types
- Correction suggestions for common mistakes
- Grammar complexity assessment

### Feedback Generation
- Criterion-specific feedback based on performance
- Improvement suggestions aligned with band descriptors
- Comparative analysis with sample answers
- Detailed error explanations

## Browser Compatibility

### Supported Browsers
- ✅ Chrome (recommended)
- ✅ Microsoft Edge
- ✅ Safari (limited speech recognition)
- ❌ Firefox (no Web Speech API support)

### Requirements
- Modern browser with Web Speech API support
- Microphone access permissions
- Stable internet connection for grammar checking

## Dependencies

### Backend
- **Express.js**: Web server framework
- **Axios**: HTTP client for LanguageTool API
- **CORS**: Cross-origin resource sharing
- **Body-parser**: Request parsing middleware

### Frontend
- **React**: User interface framework
- **Web Speech API**: Browser speech recognition
- **Modern JavaScript**: ES6+ features

## Configuration

### Environment Variables
```bash
PORT=5000                    # Server port
LANGUAGETOOL_API_KEY=        # Optional API key for enhanced grammar checking
NODE_ENV=production          # Environment mode
```

### Customization Options
- Modify `testsRepo` in `SpeechEvaluator.jsx` to add new questions
- Adjust scoring weights in `bandScorer.js`
- Update IELTS descriptors in `ieltsDescriptors.json`

## Troubleshooting

### Common Issues

**Speech Recognition Not Working**
- Check browser compatibility (use Chrome/Edge)
- Verify microphone permissions
- Ensure HTTPS connection (required for speech API)

**Server Connection Errors**
- Verify backend server is running on port 5000
- Check CORS configuration for cross-origin requests
- Ensure proper network connectivity

**Low Scoring Accuracy**
- Provide longer, more detailed responses
- Speak clearly and avoid background noise
- Use varied vocabulary and complex sentences

### Performance Tips
- Use a good quality microphone
- Speak at moderate pace (not too fast/slow)
- Practice with sample answers for reference
- Review feedback carefully for improvement areas

## Future Enhancements

### Planned Features
- Real pronunciation analysis using audio processing
- AI-powered coherence evaluation
- Multi-language support
- Mobile app development
- Integration with learning management systems
- Advanced analytics dashboard

### Technical Improvements
- WebRTC for better audio quality
- Machine learning models for scoring
- Real-time feedback during recording
- Offline capability for basic features

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the official IELTS documentation for scoring criteria

## Acknowledgments

- IELTS for official band descriptors and criteria
- LanguageTool for grammar checking API
- Web Speech API for speech recognition capabilities
- React community for frontend framework
