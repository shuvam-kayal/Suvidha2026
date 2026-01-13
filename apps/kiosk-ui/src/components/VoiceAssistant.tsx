/**
 * Voice Assistant - AI Helper with Speech Recognition
 * Floating button that expands to chat interface with voice commands
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Mic,
    MicOff,
    MessageCircle,
    X,
    Send,
    Loader2,
    Volume2
} from 'lucide-react';

// =============================================================================
// VOICE COMMAND MAPPINGS
// =============================================================================

const VOICE_COMMANDS: Record<string, string> = {
    // Electricity
    'electricity': '/services/electricity',
    'electric': '/services/electricity',
    'power': '/services/electricity',
    'light': '/services/electricity',
    'bijli': '/services/electricity',

    // Water
    'water': '/services/water',
    'jal': '/services/water',
    'pani': '/services/water',

    // Gas
    'gas': '/services/gas',
    'lpg': '/services/gas',
    'cylinder': '/services/gas',

    // Municipal
    'municipal': '/services/municipal',
    'property': '/services/municipal',
    'tax': '/services/municipal',

    // Bill
    'bill': '/dashboard',
    'pay': '/dashboard',
    'payment': '/dashboard',
    'bhugtan': '/dashboard',

    // Grievance
    'complaint': '/grievance/new',
    'grievance': '/grievance/new',
    'shikayat': '/grievance/new',
    'problem': '/grievance/new',

    // Navigation
    'home': '/dashboard',
    'dashboard': '/dashboard',
    'track': '/grievance/track',
    'status': '/grievance/track',

    // Help
    'help': 'HELP',
    'sahayata': 'HELP',
};

// =============================================================================
// SPEECH RECOGNITION HOOK
// =============================================================================

interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
    error: string;
}

function useSpeechRecognition() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Check for browser support
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            setIsSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-IN'; // Indian English

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                const current = event.results[event.results.length - 1];
                const transcriptText = current[0].transcript;
                setTranscript(transcriptText);
            };

            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    return {
        isListening,
        transcript,
        isSupported,
        startListening,
        stopListening,
    };
}

// =============================================================================
// VOICE ASSISTANT COMPONENT
// =============================================================================

export default function VoiceAssistant() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
    const [inputText, setInputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const {
        isListening,
        transcript,
        isSupported,
        startListening,
        stopListening,
    } = useSpeechRecognition();

    // Process voice command
    const processCommand = useCallback((command: string) => {
        const lowerCommand = command.toLowerCase().trim();

        // Find matching command
        for (const [keyword, destination] of Object.entries(VOICE_COMMANDS)) {
            if (lowerCommand.includes(keyword)) {
                if (destination === 'HELP') {
                    return {
                        action: 'help',
                        response: t('voice.helpResponse', 'Say "Electricity", "Water", "Gas" to select a service, "Bill" to pay bills, or "Complaint" to file a grievance.'),
                    };
                }
                return {
                    action: 'navigate',
                    destination,
                    response: t('voice.navigating', `Navigating to ${keyword}...`),
                };
            }
        }

        return {
            action: 'unknown',
            response: t('voice.notUnderstood', 'I didn\'t understand that. Try saying "Electricity", "Water", "Gas", "Bill", or "Complaint".'),
        };
    }, [t]);

    // Handle transcript changes
    useEffect(() => {
        if (transcript && !isListening) {
            handleUserInput(transcript);
        }
    }, [transcript, isListening]);

    const handleUserInput = async (text: string) => {
        if (!text.trim()) return;

        setIsProcessing(true);

        // Add user message
        setMessages((prev) => [...prev, { role: 'user', text }]);
        setInputText('');

        // Process command
        const result = processCommand(text);

        // Small delay for UX
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Add assistant response
        setMessages((prev) => [...prev, { role: 'assistant', text: result.response }]);

        // Navigate if needed
        if (result.action === 'navigate' && result.destination) {
            setTimeout(() => {
                navigate(result.destination);
                setIsOpen(false);
            }, 1000);
        }

        setIsProcessing(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            handleUserInput(inputText);
        }
    };

    const toggleMic = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    if (!isOpen) {
        // Floating button
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-16 right-6 z-50 w-16 h-16 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-500 transition-all duration-300 flex items-center justify-center animate-pulse-glow"
                aria-label={t('voice.openAssistant', 'Open Voice Assistant')}
            >
                <MessageCircle className="w-8 h-8" />
            </button>
        );
    }

    // Expanded chat interface
    return (
        <div className="fixed bottom-16 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-kiosk-card border border-kiosk-border rounded-kiosk-xl shadow-2xl animate-slide-up overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-kiosk-border bg-primary-600/20">
                <div className="flex items-center gap-3">
                    <Volume2 className="w-6 h-6 text-primary-400" />
                    <div>
                        <h3 className="font-semibold text-white">
                            {t('voice.title', 'SUVIDHA Assistant')}
                        </h3>
                        <p className="text-xs text-kiosk-muted">
                            {isListening ? t('voice.listening', 'Listening...') : t('voice.askMe', 'Ask me anything')}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-kiosk-border/50 rounded-full transition-colors"
                    aria-label={t('common.close', 'Close')}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center text-kiosk-muted py-8">
                        <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">
                            {t('voice.hint', 'Tap the microphone or type a command')}
                        </p>
                        <p className="text-xs mt-2">
                            Try: "Electricity", "Pay bill", "File complaint"
                        </p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] px-4 py-2 rounded-kiosk ${msg.role === 'user'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-kiosk-bg border border-kiosk-border'
                                }`}
                        >
                            <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isProcessing && (
                    <div className="flex justify-start">
                        <div className="bg-kiosk-bg border border-kiosk-border px-4 py-2 rounded-kiosk">
                            <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
                        </div>
                    </div>
                )}
                {isListening && transcript && (
                    <div className="flex justify-end">
                        <div className="bg-primary-600/50 text-white px-4 py-2 rounded-kiosk italic">
                            <p className="text-sm">{transcript}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Input area */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-kiosk-border bg-kiosk-bg">
                <div className="flex gap-2">
                    {/* Voice input button */}
                    {isSupported && (
                        <button
                            type="button"
                            onClick={toggleMic}
                            disabled={isProcessing}
                            className={`p-3 rounded-kiosk transition-all ${isListening
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : 'bg-kiosk-card border border-kiosk-border hover:border-primary-500'
                                }`}
                            aria-label={isListening ? t('voice.stopListening', 'Stop listening') : t('voice.startListening', 'Start listening')}
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                    )}

                    {/* Text input */}
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={t('voice.typeCommand', 'Type a command...')}
                        className="flex-1 px-4 py-2 bg-kiosk-card border border-kiosk-border rounded-kiosk text-sm focus:border-primary-500 focus:outline-none"
                        disabled={isProcessing || isListening}
                    />

                    {/* Send button */}
                    <button
                        type="submit"
                        disabled={!inputText.trim() || isProcessing}
                        className="p-3 bg-primary-600 text-white rounded-kiosk hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label={t('common.send', 'Send')}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
