import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Globe,
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Loader2,
  Volume2,
} from 'lucide-react';
import api from '../lib/api';

// ─── Language Configuration ─────────────────────────────────────────────────
// BCP-47 language codes for Web Speech API
// Architecture note: STT provider is abstracted behind SpeechRecognitionProvider
// interface — swap `WebSpeechProvider` for Google Cloud STT / Whisper / etc.

interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string; // BCP-47 code for Web Speech API
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'en-IN', name: 'English', nativeName: 'English', speechCode: 'en-IN' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা', speechCode: 'bn-IN' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', speechCode: 'mr-IN' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', speechCode: 'te-IN' },
];

// ─── STT Provider Interface (modular, swappable) ────────────────────────────

interface STTCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

interface STTProvider {
  isSupported: () => boolean;
  start: (languageCode: string, callbacks: STTCallbacks) => void;
  stop: () => void;
  isActive: () => boolean;
}

// ─── Web Speech API Provider ────────────────────────────────────────────────

function createWebSpeechProvider(): STTProvider {
  let recognition: any = null;
  let active = false;

  return {
    isSupported: () => {
      return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    },

    start: (languageCode: string, callbacks: STTCallbacks) => {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) {
        callbacks.onError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
        return;
      }

      recognition = new SpeechRecognition();
      recognition.lang = languageCode;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          callbacks.onResult(finalTranscript, true);
        } else if (interimTranscript) {
          callbacks.onResult(interimTranscript, false);
        }
      };

      recognition.onerror = (event: any) => {
        active = false;
        switch (event.error) {
          case 'not-allowed':
            callbacks.onError('Microphone access denied. Please allow microphone permission in your browser settings.');
            break;
          case 'no-speech':
            callbacks.onError('No speech detected. Please try speaking again.');
            break;
          case 'network':
            callbacks.onError('Network error. Please check your internet connection.');
            break;
          case 'aborted':
            // User stopped, not an error
            break;
          default:
            callbacks.onError(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        active = false;
        callbacks.onEnd();
      };

      try {
        recognition.start();
        active = true;
      } catch (err: any) {
        active = false;
        callbacks.onError(`Failed to start recording: ${err.message}`);
      }
    },

    stop: () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch {
          // Already stopped
        }
        active = false;
      }
    },

    isActive: () => active,
  };
}

// ─── Extracted Fields Interface ─────────────────────────────────────────────

export interface ExtractedFields {
  title: string;
  category: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  expiryDate: string | null;
  urgency: 'low' | 'medium' | 'high';
  notes: string;
  confidence: number;
  missingFields: string[];
}

// ─── Component Props ────────────────────────────────────────────────────────

interface VoiceListingPanelProps {
  onFieldsExtracted: (fields: ExtractedFields) => void;
}

// ─── VoiceListingPanel Component ────────────────────────────────────────────

export const VoiceListingPanel: React.FC<VoiceListingPanelProps> = ({ onFieldsExtracted }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('hi-IN');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const [extraction, setExtraction] = useState<ExtractedFields | null>(null);
  const [sttSupported, setSttSupported] = useState(true);

  const sttProviderRef = useRef<STTProvider>(createWebSpeechProvider());

  useEffect(() => {
    setSttSupported(sttProviderRef.current.isSupported());
  }, []);

  const handleStartRecording = useCallback(() => {
    setError('');
    setInterimText('');

    const provider = sttProviderRef.current;
    if (!provider.isSupported()) {
      setError('Speech recognition not supported. Please use Chrome or Edge.');
      return;
    }

    provider.start(selectedLanguage, {
      onResult: (text: string, isFinal: boolean) => {
        if (isFinal) {
          setTranscript((prev) => (prev ? prev + ' ' + text : text));
          setInterimText('');
        } else {
          setInterimText(text);
        }
      },
      onError: (errorMsg: string) => {
        setError(errorMsg);
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      },
    });

    setIsRecording(true);
  }, [selectedLanguage]);

  const handleStopRecording = useCallback(() => {
    sttProviderRef.current.stop();
    setIsRecording(false);
    setInterimText('');
  }, []);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  }, [isRecording, handleStartRecording, handleStopRecording]);

  const handleParse = useCallback(async () => {
    if (!transcript.trim()) {
      setError('Please speak something first before extracting.');
      return;
    }

    setIsParsing(true);
    setError('');
    setExtraction(null);

    try {
      const res = await api.post('/voice/parse', {
        transcript: transcript.trim(),
        language: selectedLanguage,
      });

      if (res.data.success && res.data.extraction) {
        setExtraction(res.data.extraction);
      } else {
        setError(res.data.error || 'Failed to extract listing details.');
      }
    } catch (err: any) {
      const message = err.response?.data?.error || 'Voice processing failed. Please try again.';
      setError(message);
    } finally {
      setIsParsing(false);
    }
  }, [transcript, selectedLanguage]);

  const handleUseExtraction = useCallback(() => {
    if (extraction) {
      onFieldsExtracted(extraction);
    }
  }, [extraction, onFieldsExtracted]);

  const handleReset = useCallback(() => {
    setTranscript('');
    setInterimText('');
    setExtraction(null);
    setError('');
  }, []);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage);

  return (
    <div className="space-y-5">
      {/* Step 1: Language Selection */}
      <div className="bg-[#0f1329]/60 rounded-2xl p-4 border border-[#3f4b81]/40">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={16} className="text-teal-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Step 1 — Select Your Language
          </h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setSelectedLanguage(lang.code);
                setError('');
              }}
              disabled={isRecording}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                selectedLanguage === lang.code
                  ? 'bg-teal-500/25 text-teal-300 border-2 border-teal-500/60 shadow-lg shadow-teal-500/10'
                  : 'bg-[#1b2151] text-slate-300 border border-[#3f4b81]/60 hover:bg-[#293264] hover:text-white'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="block text-base">{lang.nativeName}</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Record Speech */}
      <div className="bg-[#0f1329]/60 rounded-2xl p-4 border border-[#3f4b81]/40">
        <div className="flex items-center gap-2 mb-3">
          <Volume2 size={16} className="text-teal-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Step 2 — Speak Your Listing Details
          </h4>
        </div>

        {!sttSupported && (
          <div className="text-xs text-amber-400 bg-amber-950/40 p-3 rounded-xl border border-amber-800/60 mb-3 flex items-center gap-2">
            <AlertCircle size={14} />
            Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.
          </div>
        )}

        <p className="text-[11px] text-slate-400 mb-4">
          Speak naturally in <strong className="text-teal-300">{currentLang?.nativeName || 'your language'}</strong>.
          Mention the product name, quantity, price, expiry date, and any condition details.
        </p>

        {/* Mic Button */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleToggleRecording}
            disabled={!sttSupported}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isRecording
                ? 'bg-rose-500/30 border-2 border-rose-400 shadow-lg shadow-rose-500/30 animate-pulse-glow-red'
                : 'bg-teal-500/20 border-2 border-teal-500/60 hover:bg-teal-500/30 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/20'
            } ${!sttSupported ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            {isRecording ? (
              <MicOff size={32} className="text-rose-400" />
            ) : (
              <Mic size={32} className="text-teal-400" />
            )}
            {isRecording && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full animate-ping" />
            )}
          </button>
          <span className={`text-xs font-semibold ${isRecording ? 'text-rose-400' : 'text-slate-400'}`}>
            {isRecording ? '🔴 Recording... Tap to stop' : 'Tap to start recording'}
          </span>
        </div>

        {/* Transcript Display */}
        {(transcript || interimText) && (
          <div className="mt-4 bg-[#1b2151] rounded-xl p-3 border border-[#3f4b81]/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Transcript</span>
              <button
                type="button"
                onClick={handleReset}
                className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCw size={10} />
                Clear
              </button>
            </div>
            <p className="text-sm text-white leading-relaxed">
              {transcript}
              {interimText && <span className="text-slate-400 italic"> {interimText}...</span>}
            </p>
          </div>
        )}
      </div>

      {/* Step 3: Extract & Review */}
      {transcript && !extraction && (
        <div className="bg-[#0f1329]/60 rounded-2xl p-4 border border-[#3f4b81]/40">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-teal-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Step 3 — AI Extract Fields
            </h4>
          </div>
          <button
            type="button"
            onClick={handleParse}
            disabled={isParsing || !transcript.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
          >
            {isParsing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                AI is extracting details...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Extract Listing Details with AI
              </>
            )}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-xs text-rose-400 bg-rose-950/40 p-3 rounded-xl border border-rose-800/60 flex items-center gap-2">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Extraction Results */}
      {extraction && (
        <div className="bg-[#0f1329]/60 rounded-2xl p-4 border border-teal-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                AI Extracted Fields
              </h4>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                extraction.confidence >= 0.8
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : extraction.confidence >= 0.5
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {Math.round(extraction.confidence * 100)}% Confidence
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#1b2151] p-2.5 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Title</span>
              <span className="text-white font-medium">{extraction.title || '—'}</span>
            </div>
            <div className="bg-[#1b2151] p-2.5 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Category</span>
              <span className="text-white font-medium">{extraction.category}</span>
            </div>
            <div className="bg-[#1b2151] p-2.5 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Quantity</span>
              <span className="text-white font-medium">
                {extraction.quantity} {extraction.unit}
              </span>
            </div>
            <div className="bg-[#1b2151] p-2.5 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Price/Unit</span>
              <span className="text-emerald-400 font-bold">₹{extraction.pricePerUnit}</span>
            </div>
            <div className="bg-[#1b2151] p-2.5 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Expiry</span>
              <span className="text-white font-medium">{extraction.expiryDate || 'Not mentioned'}</span>
            </div>
            <div className="bg-[#1b2151] p-2.5 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Urgency</span>
              <span
                className={`font-semibold ${
                  extraction.urgency === 'high'
                    ? 'text-rose-300'
                    : extraction.urgency === 'medium'
                    ? 'text-amber-300'
                    : 'text-teal-300'
                }`}
              >
                {extraction.urgency.toUpperCase()}
              </span>
            </div>
          </div>

          {extraction.notes && (
            <div className="mt-2 bg-[#1b2151] p-2.5 rounded-lg text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Notes</span>
              <span className="text-white">{extraction.notes}</span>
            </div>
          )}

          {extraction.missingFields.length > 0 && (
            <p className="mt-2 text-[10px] text-amber-400">
              ⚠️ These fields were not mentioned and may need editing:{' '}
              <strong>{extraction.missingFields.join(', ')}</strong>
            </p>
          )}

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleUseExtraction}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              Use These Fields → Review & Publish
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 bg-[#1b2151] border border-[#3f4b81] text-slate-300 hover:text-white hover:bg-[#293264] font-medium text-sm rounded-xl transition-colors cursor-pointer"
            >
              Redo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
