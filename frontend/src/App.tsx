import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function UltronVoiceAgent() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'ULTRON SYSTEMS ONLINE. I am ready to assist. Speak or type your command.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }
        if (finalTranscript) {
          setInput(finalTranscript.trim());
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

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
      recognitionRef.current.start();
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: userMessage,
          userId: 'user-' + Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const reply = data.reply || 'No response received';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      
      speak(reply);
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = 'Error processing request. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
      speak(errorMessage);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-gray-900 to-black flex flex-col">
      {/* Header */}
      <div className="border-b border-red-900/50 bg-black/50 backdrop-blur p-6">
        <h1 className="text-4xl font-bold text-red-500 font-mono tracking-wider">
          ⚙️ ULTRON
        </h1>
        <p className="text-gray-400 text-sm mt-2">VOICE CONTROL SYSTEM • ONLINE</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-xl ${
                msg.role === 'user' 
                  ? 'bg-blue-900/30 border border-blue-500/50 text-blue-100' 
                  : 'bg-red-900/20 border border-red-500/30 text-gray-100'
              } rounded-lg p-4 font-mono text-sm leading-relaxed`}
            >
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
        <div className="flex justify-center gap-2 text-xs text-gray-400 font-mono">
          {isListening && <span className="text-red-500">🎤 LISTENING...</span>}
          {isSpeaking && <span className="text-green-500">🔊 SPEAKING...</span>}
          {isLoading && <span className="text-yellow-500">⚙️ PROCESSING...</span>}
          {!isListening && !isSpeaking && !isLoading && <span>READY</span>}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-red-900/50 bg-black/80 backdrop-blur p-6">
        <div className="flex gap-3 max-w-4xl mx-auto">
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
      </div>
    </div>
  );
}
