# GSIS Voice Assistant

A sophisticated voice assistant integrated into the GSIS Platform that provides natural voice interaction with AI for pharmaceutical analytics and business intelligence.

## Features

### 🎤 Speech Recognition
- **OpenAI Whisper**: High-accuracy English speech recognition
- **Real-time processing**: Instant voice-to-text conversion
- **Noise filtering**: Advanced audio processing for clear recognition

### 🔊 Speech Synthesis
- **OpenAI TTS HD**: Human-like voice synthesis with "ash" male voice
- **Natural intonation**: Context-aware speech patterns
- **High quality**: Studio-grade audio output

### 🤖 AI Intelligence
- **GPT-4o**: Advanced language model for context understanding
- **Business analytics**: Specialized knowledge of pharmaceutical metrics
- **Bilingual support**: Primary English language with professional terminology

### 🎯 Voice Mode Control
- **Explicit activation**: Voice assistant only speaks when voice mode is active
- **Toggle control**: Microphone button activates/deactivates voice mode
- **Visual indicators**: Clear UI feedback for voice mode status

## Technical Architecture

### Frontend Components
- `VoiceAssistant.tsx`: Main voice interaction component
- `VoiceAssistantDemo.tsx`: Demo page with settings and debug info
- `ChatInput.tsx`: Integrated voice input in chat interface
- `useVoiceAssistant.tsx`: Custom hook for voice functionality

### Backend Services
- `voice-assistant/`: Supabase Edge Function for voice processing
- `ai-assistant/`: Supabase Edge Function for AI responses

### Voice Processing Flow
1. **Audio Capture**: Browser MediaRecorder API
2. **Speech Recognition**: OpenAI Whisper API (English)
3. **AI Processing**: GPT-4o with business context
4. **Speech Synthesis**: OpenAI TTS HD with "ash" voice
5. **Audio Playback**: Web Audio API

## Configuration

### Voice Settings
- **Language**: English (en-US)
- **Voice**: "ash" (male voice)
- **Rate**: 0.9 (slightly slower for clarity)
- **Pitch**: 0.8 (lower male voice)
- **Volume**: 1.0 (full volume)

### Voice Mode Control
- **Auto-playback**: Only when voice mode is active
- **Manual activation**: Microphone button toggle
- **Visual feedback**: Blue indicator badge
- **State management**: Persistent voice mode tracking

## Usage

### Basic Voice Interaction
1. Click the microphone button to activate voice mode
2. Speak your question clearly
3. Wait for AI processing
4. Listen to the response
5. Click microphone again to deactivate voice mode

### Example Queries
- "Tell me about revenue growth"
- "Show me Digital Display chart"
- "How are Base Sales performing?"
- "Give me more information about Phone Calls"
- "What's the current situation with digital campaigns?"

### Voice Mode States
- **Inactive**: Voice assistant won't speak responses
- **Active**: Voice assistant will speak all AI responses
- **Recording**: Currently capturing audio
- **Processing**: AI is generating response
- **Speaking**: Playing back AI response

## Integration

### Chat Interface
- Voice input integrated into main chat
- Seamless switching between text and voice
- Consistent UI/UX across modes

### Business Analytics
- Specialized knowledge base for pharmaceutical metrics
- Context-aware responses about business data
- Metric card and chart integration

## Development

### Prerequisites
- Node.js 18+
- Supabase CLI
- OpenAI API key

### Setup
1. Install dependencies: `npm install`
2. Configure Supabase: `supabase link`
3. Set environment variables:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

### Deployment
```bash
# Deploy voice assistant function
supabase functions deploy voice-assistant

# Deploy AI assistant function
supabase functions deploy ai-assistant
```

### Testing
- Voice recognition accuracy
- Speech synthesis quality
- Voice mode state management
- Error handling and recovery

## Recent Updates

### Voice Mode Implementation
- ✅ Added explicit voice mode control
- ✅ Voice assistant only speaks when voice mode is active
- ✅ Microphone button toggles voice mode
- ✅ Visual indicators for voice mode status

### Voice Quality Improvements
- ✅ Changed voice from "alloy" to "ash" for better male voice
- ✅ Optimized speech rate and pitch settings
- ✅ Enhanced audio processing pipeline

### Language Standardization
- ✅ Full English language support
- ✅ Professional business terminology
- ✅ Consistent voice and text responses

### UX Enhancements
- ✅ Clear voice mode indicators
- ✅ Improved error handling
- ✅ Better state management
- ✅ Enhanced debug information

## Troubleshooting

### Common Issues
1. **Microphone not working**: Check browser permissions
2. **Voice not playing**: Ensure voice mode is active
3. **Poor recognition**: Speak clearly and reduce background noise
4. **No response**: Check internet connection and API keys

### Debug Information
The demo page includes real-time debug information:
- Voice mode status
- Recording state
- Speaking state
- Processing state

## Future Enhancements

### Planned Features
- Multi-language support
- Voice command shortcuts
- Custom voice training
- Advanced noise cancellation
- Voice biometrics

### Performance Optimizations
- Streaming audio processing
- Cached responses
- Offline voice recognition
- Adaptive voice quality

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

---

**GSIS Platform** - The future of business intelligence for pharmaceutical analytics.