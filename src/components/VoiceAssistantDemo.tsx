import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Mic, MicOff, Volume2, VolumeX, MessageSquare, Send } from 'lucide-react';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import ParticleBackground from '@/components/ParticleBackground';
import { useTheme } from '@/hooks/useTheme';

const VoiceAssistantDemo: React.FC = () => {
  const { theme } = useTheme();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  
  const {
    isListening,
    isTranscribing,
    isProcessing,
    isPlaying,
    status,
    transcript,
    response,
    error,
    startListening,
    stopListening,
    stopAudio,
    shutdown
  } = useVoiceAssistant();

  // Cleanup при размонтировании компонента
  useEffect(() => {
    return () => {
      // При размонтировании компонента полностью отключаем голосовой ассистент
      shutdown();
    };
  }, [shutdown]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSpeak = () => {
    // Voice synthesis is handled by the server now
    console.log("Test speech functionality is handled by the server");
  };

  const handleStopSpeaking = () => {
    stopAudio();
  };

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia;

  if (!isSupported) {
    return (
      <div className="relative min-h-screen bg-gradient-main">
        <ParticleBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <Card className="bg-gradient-card backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Voice Not Supported</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Your browser doesn't support speech recognition or speech synthesis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Please try using Chrome, Edge, or Safari for the best voice experience.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-main">
      <ParticleBackground />
      <div className="relative z-10 p-6 space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 pt-16">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-blue/20 dark:bg-gradient-cyan/20 border border-blue-500/30 dark:border-cyan-500/30 backdrop-blur-xl shadow-lg">
              <Mic className="w-8 h-8 text-blue-600 dark:text-cyan-500" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-glow">Voice Assistant Demo</h1>
          </div>
          <p className="text-gray-600 dark:text-white/70 max-w-2xl mx-auto">
            Experience the power of voice interaction with our AI assistant
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Voice Interface */}
          <Card className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl max-w-md shadow-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Voice Controls</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Control the assistant with your voice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Voice Status */}
              <div className="flex items-center justify-between p-4 rounded-lg backdrop-blur-[2px] bg-white/5 border border-white/10 shadow-md hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-gray-700 dark:text-white font-medium">
                    {isListening ? 'Listening...' : 'Ready'}
                  </span>
                </div>
                <Badge variant={isListening ? 'default' : 'secondary'} className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-700/50">
                  {isListening ? 'ACTIVE' : 'IDLE'}
                </Badge>
              </div>

              {/* Control Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleToggleListening}
                  disabled={!voiceEnabled}
                  className={`flex items-center gap-2 ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700' 
                      : 'bg-gradient-blue dark:bg-gradient-cyan'
                  } text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isListening ? 'Stop' : 'Start'} Listening
                </Button>
                
                <Button
                  onClick={isPlaying ? handleStopSpeaking : handleSpeak}
                  variant="outline"
                  disabled={!isPlaying && status !== 'ready'}
                  className={`backdrop-blur-[2px] bg-white/5 border border-cyan-300/30 dark:border-cyan-400/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50/10 dark:hover:bg-cyan-500/10 hover:border-cyan-300/50 transition-all duration-300 shadow-md`}
                >
                  {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {isPlaying ? 'Stop' : 'Test'} Speech
                </Button>
              </div>

              {/* Transcript */}
              {showTranscript && transcript && (
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-white">Transcript</Label>
                  <div className="p-3 rounded-lg backdrop-blur-[2px] bg-white/5 border border-white/10 shadow-md hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                    <p className="text-gray-700 dark:text-white text-sm">{transcript}</p>
                  </div>
                </div>
              )}

              {/* Response */}
              {response && (
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-white">AI Response</Label>
                  <div className="p-3 rounded-lg backdrop-blur-[2px] bg-white/5 border border-white/10 shadow-md hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                    <p className="text-gray-700 dark:text-white text-sm">{response}</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 rounded-lg backdrop-blur-[2px] bg-white/5 border border-red-500/30 dark:border-red-400/30 shadow-md hover:bg-red-50/10 hover:border-red-500/50 transition-all duration-300">
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Debug Information */}
          <Card className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl shadow-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-lg shadow-md hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="font-semibold text-gray-900 dark:text-white">Status</div>
                  <div className="text-lg text-blue-600 dark:text-blue-400">
                    {status.toUpperCase()}
                  </div>
                </div>
                <div className="p-3 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-lg shadow-md hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="font-semibold text-gray-900 dark:text-white">Recording</div>
                  <div className={`text-lg ${isListening ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isListening ? 'YES' : 'NO'}
                  </div>
                </div>
                <div className="p-3 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-lg shadow-md hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="font-semibold text-gray-900 dark:text-white">Playing</div>
                  <div className={`text-lg ${isPlaying ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isPlaying ? 'YES' : 'NO'}
                  </div>
                </div>
                <div className="p-3 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-lg shadow-md hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="font-semibold text-gray-900 dark:text-white">Processing</div>
                  <div className={`text-lg ${isProcessing || isTranscribing ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isProcessing || isTranscribing ? 'YES' : 'NO'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <Card className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl shadow-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Configure voice assistant parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-lg shadow-md hover:bg-white/10 hover:border-white/20 transition-all duration-300">
              <div className="space-y-0.5">
                <Label className="text-gray-700 dark:text-white">Voice Assistant</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">Enable/disable voice features</p>
              </div>
              <Switch
                checked={voiceEnabled}
                onCheckedChange={setVoiceEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-lg shadow-md hover:bg-white/10 hover:border-white/20 transition-all duration-300">
              <div className="space-y-0.5">
                <Label className="text-gray-700 dark:text-white">Auto Playback</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">Automatically speak AI responses</p>
              </div>
              <Switch
                checked={autoSpeak}
                onCheckedChange={setAutoSpeak}
                disabled={!voiceEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-lg shadow-md hover:bg-white/10 hover:border-white/20 transition-all duration-300">
              <div className="space-y-0.5">
                <Label className="text-gray-700 dark:text-white">Show Transcript</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">Display recognized text</p>
              </div>
              <Switch
                checked={showTranscript}
                onCheckedChange={setShowTranscript}
                disabled={!voiceEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Voice Assistant */}
        <Card className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl shadow-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              AI Assistant
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Chat with the AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 rounded-lg backdrop-blur-[2px] bg-white/5 border border-white/10 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:focus:ring-cyan-400/50 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-md"
                />
                <Button className="bg-gradient-blue dark:bg-gradient-cyan text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="p-4 rounded-lg backdrop-blur-[2px] bg-white/5 border border-white/10 shadow-md hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                <p className="text-gray-700 dark:text-white text-sm">
                  Hello! I'm your AI assistant. You can talk to me using your voice or type your messages. 
                  Try saying "What's the weather like?" or "Tell me a joke!"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoiceAssistantDemo; 