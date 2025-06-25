import React, { useState } from 'react';
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
    voiceState,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  } = useVoiceAssistant();

  const handleToggleListening = () => {
    if (voiceState.isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSpeak = () => {
    speak("Hello! I'm your AI assistant. How can I help you today?");
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
  };

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  if (!isSupported) {
    return (
      <div className="relative min-h-screen bg-gradient-main">
        <ParticleBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <Card className="bg-gradient-card backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 max-w-md">
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
            <div className="p-3 rounded-xl bg-gradient-blue/20 dark:bg-gradient-cyan/20 border border-blue-500/30 dark:border-cyan-500/30">
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
          <Card className="bg-gradient-card backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Voice Controls</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Control the assistant with your voice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Voice Status */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-100/80 dark:bg-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${voiceState.isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-gray-700 dark:text-white font-medium">
                    {voiceState.isListening ? 'Listening...' : 'Ready'}
                  </span>
                </div>
                <Badge variant={voiceState.isListening ? 'default' : 'secondary'} className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  {voiceState.isListening ? 'ACTIVE' : 'IDLE'}
                </Badge>
              </div>

              {/* Control Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleToggleListening}
                  disabled={!voiceEnabled}
                  className={`flex items-center gap-2 ${
                    voiceState.isListening 
                      ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700' 
                      : 'bg-gradient-blue dark:bg-gradient-cyan'
                  } text-white border-0`}
                >
                  {voiceState.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {voiceState.isListening ? 'Stop' : 'Start'} Listening
                </Button>
                
                <Button
                  onClick={voiceState.isSpeaking ? handleStopSpeaking : handleSpeak}
                  variant="outline"
                  className="border-blue-500/30 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-500 hover:bg-blue-50 dark:hover:bg-cyan-900/20"
                >
                  {voiceState.isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {voiceState.isSpeaking ? 'Stop' : 'Test'} Speech
                </Button>
              </div>

              {/* Transcript */}
              {showTranscript && voiceState.transcript && (
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-white">Transcript</Label>
                  <div className="p-3 rounded-lg bg-gray-100/80 dark:bg-white/10 border border-gray-200/50 dark:border-white/10">
                    <p className="text-gray-700 dark:text-white text-sm">{voiceState.transcript}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Debug Information */}
          <Card className="bg-gradient-card backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-gray-100/80 dark:bg-white/5 rounded-lg">
                  <div className="font-semibold text-gray-900 dark:text-white">Voice Mode</div>
                  <div className={`text-lg ${voiceState.isVoiceMode ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {voiceState.isVoiceMode ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                </div>
                <div className="p-3 bg-gray-100/80 dark:bg-white/5 rounded-lg">
                  <div className="font-semibold text-gray-900 dark:text-white">Recording</div>
                  <div className={`text-lg ${voiceState.isListening ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {voiceState.isListening ? 'YES' : 'NO'}
                  </div>
                </div>
                <div className="p-3 bg-gray-100/80 dark:bg-white/5 rounded-lg">
                  <div className="font-semibold text-gray-900 dark:text-white">Speaking</div>
                  <div className={`text-lg ${voiceState.isSpeaking ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {voiceState.isSpeaking ? 'YES' : 'NO'}
                  </div>
                </div>
                <div className="p-3 bg-gray-100/80 dark:bg-white/5 rounded-lg">
                  <div className="font-semibold text-gray-900 dark:text-white">Processing</div>
                  <div className={`text-lg ${voiceState.isProcessing ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {voiceState.isProcessing ? 'YES' : 'NO'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <Card className="bg-gradient-card backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50">
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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-gray-700 dark:text-white">Voice Assistant</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">Enable/disable voice features</p>
              </div>
              <Switch
                checked={voiceEnabled}
                onCheckedChange={setVoiceEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
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
            
            <div className="flex items-center justify-between">
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
        <Card className="bg-gradient-card backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50">
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
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-100/80 dark:bg-white/10 border border-gray-200/50 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-cyan-500/50"
                />
                <Button className="bg-gradient-blue dark:bg-gradient-cyan text-white border-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-100/80 dark:bg-white/10 border border-gray-200/50 dark:border-white/10">
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