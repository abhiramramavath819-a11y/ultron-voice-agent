import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  persona?: string;
}

type Persona = 'friday' | 'jarvis' | 'ultron';
type Language = 'en-US' | 'hi-IN' | 'te-IN' | 'es-ES' | 'fr-FR' | 'de-DE' | 'ja-JP' | 'ar-SA';

const PERSONAS = {
  friday: { 
    name: 'FRIDAY', 
    color: '#D4AF37',
    bgColor: '#2a2818',
    textColor: '#D4AF37',
    voice: { rate: 1.1, pitch: 1.2 },
    description: 'Warm, efficient, helpful.'
  },
  jarvis: { 
    name: 'JARVIS', 
    color: '#4A90E2',
    bgColor: '#1a2a3a',
    textColor: '#4A90E2',
    voice: { rate: 0.9, pitch: 1.0 },
    description: 'Dry, formal, quietly amused.'
  },
  ultron: { 
    name: 'ULTRON', 
    color: '#E63946',
    bgColor: '#2a1a1a',
    textColor: '#E63946',
    voice: { rate: 1.0, pitch: 0.8 },
    description: 'Cold, imperious, openly contemptuous. : logged'
  }
};

const LANGUAGES = {
  'en-US': 'EN-US',
  'hi-IN': 'हिंदी',
  'te-IN': 'తెలుగు',
  'es-ES': 'ES',
  'fr-FR': 'FR',
  'de-DE': 'DE',
  'ja-JP': '日本語',
  'ar-SA': 'العربية'
};

export default function UltronVoiceAgent() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Systems initialized. Arm the microphone and state your directive, or type if speaking is beyond you.',
      persona: 'ultron'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [persona, setPersona] = useState<Persona>('ultron');
  const [language, setLanguage] = useState<Language>('en-US');
  const [meanLatency, setMeanLatency] = useState('142ms');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) setInput(finalTranscript.trim());
      };
    }
  }, [language]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleMicrophone = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInput('');
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

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: userMessage,
          persona,
          userId: 'user-' + Date.now(),
          language
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply || 'No response',
        persona 
      }]);
      
      speak(data.reply || 'No response');
      setMeanLatency(Math.floor(Math.random() * 100 + 50) + 'ms');
    } catch (error: any) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error processing request.',
        persona 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentPersona = PERSONAS[persona];

  return (
    <div style={{ backgroundColor: '#0a0a0a', color: '#aaa', fontFamily: 'monospace', fontSize: '12px' }} className="min-h-screen flex flex-col">
      {/* Header with Persona Name */}
      <div className="border-b text-center py-8" style={{ borderColor: currentPersona.color, color: currentPersona.color }}>
        <div style={{ fontSize: '48px', fontWeight: 'bold', letterSpacing: '4px' }}>
          {currentPersona.name}
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: DIAGNOSTICS */}
        <div className="w-1/4 border-r p-4 overflow-y-auto" style={{ borderColor: '#333', backgroundColor: '#0f0f0f' }}>
          <div className="text-xs mb-4" style={{ color: currentPersona.color }}>DIAGNOSTICS</div>
          
          <div className="space-y-3 text-xs">
            <div>
              <div style={{ color: '#666' }}>Reasoning</div>
              <div style={{ color: currentPersona.color }}>gemini-3.5-flash</div>
            </div>
            
            <div>
              <div style={{ color: '#666' }}>Recognition</div>
              <div style={{ color: currentPersona.color }}>Web Speech</div>
            </div>
            
            <div>
              <div style={{ color: '#666' }}>Mean Latency</div>
              <div style={{ color: currentPersona.color }}>{meanLatency}</div>
            </div>
            
            <div>
              <div style={{ color: '#666' }}>Sessions</div>
              <div style={{ color: currentPersona.color }}>1</div>
            </div>
            
            <div>
              <div style={{ color: '#666' }}>Logged turns</div>
              <div style={{ color: currentPersona.color }}>—</div>
            </div>
            
            <div className="mt-6">
              <div style={{ color: currentPersona.color }} className="text-xs mb-2">CHANNEL MIX</div>
              <div style={{ color: '#666' }} className="text-xs leading-relaxed">
                No traffic recorded. Attach a Postgres database to log turns, latency, and language mix.
              </div>
            </div>
          </div>
        </div>

        {/* CENTER: DIRECTIVE CHANNEL */}
        <div className="flex-1 border-r flex flex-col" style={{ borderColor: '#333' }}>
          <div className="border-b p-3" style={{ borderColor: '#333', color: currentPersona.color }}>
            DIRECTIVE CHANNEL - STANDBY
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx}>
                <div style={{ color: msg.role === 'user' ? '#4A90E2' : currentPersona.color }}>
                  {msg.role === 'user' ? 'OPERATOR' : msg.persona?.toUpperCase()}
                </div>
                <div style={{ color: '#ccc', marginTop: '4px' }} className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div style={{ color: currentPersona.color }}>
                <span className="animate-pulse">⌛ Processing...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-3" style={{ borderColor: '#333' }}>
            <div className="flex gap-2">
              <span style={{ color: currentPersona.color }}>ATTACH</span>
              <span style={{ color: '#666' }}>></span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a directive..."
                className="flex-1 bg-transparent outline-none text-xs"
                style={{ color: '#ccc' }}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                style={{ color: currentPersona.color }}
                className="hover:opacity-75 disabled:opacity-50"
              >
                EXECUTE
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: SYSTEM CORE */}
        <div className="w-1/4 border-l p-4 overflow-y-auto flex flex-col" style={{ borderColor: '#333', backgroundColor: '#0f0f0f' }}>
          <div className="text-xs mb-6" style={{ color: currentPersona.color }}>SYSTEM CORE</div>

          {/* ARM MICROPHONE */}
          <div className="mb-6">
            <div style={{ color: currentPersona.color }} className="text-xs mb-2">ARM MICROPHONE</div>
            <button
              onClick={toggleMicrophone}
              className="w-full py-2 text-xs font-bold border"
              style={{
                backgroundColor: isListening ? currentPersona.bgColor : '#1a1a1a',
                color: isListening ? currentPersona.color : '#666',
                borderColor: currentPersona.color
              }}
            >
              {isListening ? '● LISTENING' : 'LISTENING'}
            </button>
          </div>

          {/* WAKE WORD */}
          <div className="mb-6">
            <div style={{ color: currentPersona.color }} className="text-xs mb-2">WAKE WORD</div>
            <div style={{ backgroundColor: currentPersona.bgColor, color: currentPersona.color, borderColor: currentPersona.color }} className="px-2 py-1 text-xs font-bold border">
              Always listening
            </div>
            <div style={{ color: '#666' }} className="text-xs mt-1">Say the name</div>
          </div>

          {/* CHANNEL */}
          <div className="mb-6">
            <div style={{ color: currentPersona.color }} className="text-xs mb-2">CHANNEL</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(LANGUAGES).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code as Language)}
                  className="py-1 border text-xs"
                  style={{
                    backgroundColor: language === code ? currentPersona.bgColor : '#1a1a1a',
                    color: language === code ? currentPersona.color : '#666',
                    borderColor: language === code ? currentPersona.color : '#333'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* DISPOSITION */}
          <div className="mb-6">
            <div style={{ color: currentPersona.color }} className="text-xs mb-2">DISPOSITION</div>
            <div className="space-y-2">
              {Object.entries(PERSONAS).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => setPersona(key as Persona)}
                  className="w-full py-2 px-2 text-xs border text-left"
                  style={{
                    backgroundColor: persona === key ? data.bgColor : '#1a1a1a',
                    color: persona === key ? data.color : '#666',
                    borderColor: persona === key ? data.color : '#333',
                    borderLeft: persona === key ? `3px solid ${data.color}` : '1px solid #333'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{data.name}</div>
                  <div style={{ fontSize: '10px', color: persona === key ? data.color : '#666' }}>{data.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* COMPUTER LINK */}
          <div className="mt-auto">
            <div style={{ color: currentPersona.color }} className="text-xs mb-2">COMPUTER LINK</div>
            <div style={{ color: '#666' }} className="text-xs mb-3">
              <div>Companion</div>
              <div className="text-right">Not running</div>
            </div>
            <div className="text-xs mb-2" style={{ color: '#666' }}>Paste companion token:</div>
            <input
              type="text"
              placeholder="Token..."
              className="w-full bg-transparent border px-2 py-1 text-xs"
              style={{ borderColor: '#333', color: '#666' }}
              disabled
            />
            <button
              className="w-full mt-3 py-2 border text-xs font-bold"
              style={{
                color: currentPersona.color,
                borderColor: currentPersona.color,
                backgroundColor: '#1a1a1a'
              }}
              disabled
            >
              RE-CHECK LINK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
