import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Send, Upload, Globe, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  persona?: string;
}

type Persona = 'friday' | 'jarvis' | 'ultron';
type Language = 'en-US' | 'hi-IN' | 'te-IN' | 'es-ES' | 'fr-FR';

const PERSONAS = {
  friday: { name: 'FRIDAY', voice: { rate: 1.1, pitch: 1.2 }, color: 'text-blue-400' },
  jarvis: { name: 'JARVIS', voice: { rate: 0.9, pitch: 1.0 }, color: 'text-purple-400' },
  ultron: { name: 'ULTRON', voice: { rate: 1.0, pitch: 0.8 }, color: 'text-red-500' }
};

const LANGUAGES = {
  'en-US': '🇺🇸 English',
  'hi-IN': '🇮🇳 Hindi',
  'te-IN': '🇮🇳 Telugu',
  'es-ES': '🇪🇸 Spanish',
  'fr-FR': '🇫🇷 French'
};

export default function UltronVoiceAgent() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'ULTRON SYSTEMS ONLINE. Choose your directive or speak to activate voice control.',
      persona: 'ultron'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [persona, setPersona] = useState<Persona>('ultron');
  const [language, setLanguage] = useState<Language>('en-US');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const wakeWordRef = useRef<boolean>(false);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            
            // Wake word detection
            if (transcript.toLowerCase().includes('ultron') || 
                transcript.toLowerCase().includes('hey') ||
                transcript.toLowerCase().includes('jarvis') ||
                transcript.toLowerCase().includes('friday')) {
              wakeWordRef.current = true;
            }
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setInput(finalTranscript.trim());
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech error:', event.error);
        setIsListening(false);
      };
    }
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleMicrophone = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInput('');
      wakeWordRef.current = false;
      recognitionRef.current.start();
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voiceSettings = PERSONAS[persona].voice;
      
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setIsStreaming(true);

    try {
      const formData = new FormData();
      formData.append('query', userMessage);
      formData.append('persona', persona);
      formData.append('userId', 'user-' + Date.now());
      formData.append('language', language);
      uploadedFiles.forEach((file, idx) => {
        formData.append(`file-${idx}`, file);
      });
      setUploadedFiles([]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      const reply = data.reply || 'No response';
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: reply,
        persona 
      }]);
      
      speak(reply);
    } catch (error: any) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error processing request.',
        persona 
      }]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-gray-900 to-black flex flex-col">
      {/* Header */}
      <div className="border-b border-red-900/50 bg-black/50 backdrop-blur p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-red-500 font-mono tracking-wider">
            ⚙️ ULTRON VOICE AGENT
          </h1>
          <p className="text-gray-400 text-sm mt-2">MULTI-PERSONA AI SYSTEM • ONLINE</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="border-b border-red-900/50 bg-black/30 backdrop-blur p-4">
        <div className="max-w-6xl mx-auto flex gap-4 flex-wrap items-center">
          {/* Persona Selector */}
          <div className="flex gap-2">
            {(Object.entries(PERSONAS) as [Persona, any][]).map(([key, data]) => (
              <button
                key={key}
                onClick={() => setPersona(key)}
                className={`px-3 py-1 rounded border text-xs font-mono font-bold transition ${
                  persona === key
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {data.name}
              </button>
            ))}
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 font-mono hover:border-gray-600"
            >
              {Object.entries(LANGUAGES).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>

          {/* Streaming Indicator */}
          {isStreaming && (
            <div className="flex items-center gap-2 text-yellow-500 text-xs font-mono">
              <Zap className="w-4 h-4 animate-pulse" />
              STREAMING
            </div>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-2xl ${
                msg.role === 'user' 
                  ? 'bg-blue-900/30 border border-blue-500/50 text-blue-100' 
                  : `bg-red-900/20 border border-red-500/30 text-gray-100`
              } rounded-lg p-4 font-mono text-sm leading-relaxed`}
            >
              {msg.persona && msg.role === 'assistant' && (
                <div className={`text-xs font-bold mb-2 ${PERSONAS[msg.persona as Persona].color}`}>
                  {PERSONAS[msg.persona as Persona].name}
                </div>
              )}
              <ReactMarkdown className="prose prose-invert max-w-none">
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Status Bar */}
      <div className="border-t border-red-900/50 bg-black/50 backdrop-blur p-4">
        <div className="flex justify-center gap-4 text-xs text-gray-400 font-mono">
          {isListening && <span className="text-red-500">🎤 LISTENING...</span>}
          {isSpeaking && <span className="text-green-500">🔊 SPEAKING...</span>}
          {isLoading && <span className="text-yellow-500">⚙️ PROCESSING...</span>}
          {!isListening && !isSpeaking && !isLoading && <span>READY</span>}
          {uploadedFiles.length > 0 && <span className="text-blue-400">📎 {uploadedFiles.length} FILE(S)</span>}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-red-900/50 bg-black/80 backdrop-blur p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-3 mb-3">
            {/* Microphone Button */}
            <button
              onClick={toggleMicrophone}
              disabled={isLoading}
              className={`flex-shrink-0 p-3 rounded border font-mono text-sm font-bold transition ${
                isListening
                  ? 'bg-red-600 border-red-500 text-white animate-pulse'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* File Upload */}
            <label className="flex-shrink-0 p-3 bg-gray-800 border border-gray-700 rounded text-gray-300 hover:bg-gray-700 cursor-pointer font-mono text-sm font-bold transition">
              <Upload className="w-5 h-5" />
              <input 
                type="file" 
                multiple 
                onChange={handleFileUpload} 
                className="hidden"
              />
            </label>

            {/* Text Input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="COMMAND INPUT..."
              disabled={isLoading}
              className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-3 text-gray-100 placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 disabled:opacity-50"
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 p-3 bg-red-600 border border-red-500 rounded text-white hover:bg-red-700 disabled:opacity-50 disabled:bg-gray-800 disabled:border-gray-700 font-mono text-sm font-bold transition"
            >
              <Send className="w-5 h-5" />
            </button>

            {/* Stop Speaking Button */}
            <button
              onClick={() => window.speechSynthesis.cancel()}
              className={`flex-shrink-0 p-3 rounded border font-mono text-sm font-bold transition ${
                isSpeaking
                  ? 'bg-green-600 border-green-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* File Preview */}
          {uploadedFiles.length > 0 && (
            <div className="text-xs text-gray-400 font-mono">
              Files: {uploadedFiles.map(f => f.name).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
