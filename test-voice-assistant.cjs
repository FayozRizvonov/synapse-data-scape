const fs = require('fs');

// Test the voice assistant function
async function testVoiceAssistant() {
  console.log('🎤 Testing Voice Assistant Function...');
  
  try {
    // Simulate a small audio file (base64 encoded empty WebM)
    const testAudio = "GkXfo0OBAkKFQoOBAULygQRC84EIQoKEd2VibQKHgQRChYECw4EBQoOBAUK3gQFChYEBQ4EBQoOBAUKFgQIAgIAAAREPw8Zi34QQAAAAAAwAsID8iP///4P+9AA";
    
    const response = await fetch('http://localhost:54321/functions/v1/voice-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-key'
      },
      body: JSON.stringify({
        audioData: testAudio,
        audioFormat: 'webm'
      })
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Function error:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Function response:', result);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run test
testVoiceAssistant(); 