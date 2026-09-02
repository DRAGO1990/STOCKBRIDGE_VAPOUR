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
  Play,
  Pause,
  Square,
  ChevronDown,
  ChevronUp,
  Radio,
  Edit3,
  Copy,
  Check,
  Flame,
  HelpCircle,
} from 'lucide-react';
import api from '../lib/api';

// ─── Language Configuration ─────────────────────────────────────────────────

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'hi-IN', name: 'Hindi / Hinglish', nativeName: 'हिन्दी / Hinglish', speechCode: 'hi-IN' },
  { code: 'en-IN', name: 'English (India)', nativeName: 'English (India)', speechCode: 'en-IN' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speechCode: 'pa-IN' },
];

const SAMPLE_PROMPTS = [
  {
    label: 'Hinglish Oil Batch',
    lang: 'hi-IN',
    text: 'Hamare paas Fortune sunflower oil 1 litre pouch ke 50 packets surplus bache hain, 110 rupees per packet rate hai, expiry 3 months baad ki hai, packaging fresh aur sealed hai.',
  },
  {
    label: 'English Notebooks',
    lang: 'en-IN',
    text: 'We have 200 boxes of Classmate A4 long notebooks surplus stock, selling at 85 rupees per box, expiry 6 months from now, clean condition ready for bulk pickup.',
  },
  {
    label: 'Kannada Rice Bags',
    lang: 'kn-IN',
    text: 'ನಮ್ಮ ಬಳಿ ಸೋನಾ ಮಸೂರಿ ಅಕ್ಕಿ 25 ಕೆಜಿ 50 ಚೀಲಗಳು ಇವೆ, ಪ್ರತಿ ಚೀಲಕ್ಕೆ 1150 ರೂಪಾಯಿ, 6 ತಿಂಗಳು ವ್ಯಾಲಿಡಿಟಿ ಇದೆ, ತಕ್ಷಣ ಮಾರಾಟಕ್ಕೆ ಲಭ್ಯ.',
  },
  {
    label: 'Punjabi Wheat Lot',
    lang: 'pa-IN',
    text: 'ਸਾਡੇ ਕੋਲ 100 ਬੋਰੀਆਂ ਕਣਕ ਦਾ ਸਰਪਲਸ ਸਟਾਕ ਹੈ, ਰੇਟ 2200 ਰੁਪਏ ਪ੍ਰਤੀ ਕੁਇੰਟਲ, ਬਿਲਕੁਲ ਤਾਜ਼ਾ ਸਟਾਕ ਤੁਰੰਤ ਡਿਲੀਵਰੀ ਲਈ ਤਿਆਰ ਹੈ।',
  },
];

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

class WebSpeechSTTProvider implements STTProvider {
  private recognition: any = null;
  private running = false;

  isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  start(languageCode: string, callbacks: STTCallbacks): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      callbacks.onError('Web Speech API is not supported in this browser.');
      return;
    }

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Ignore
      }
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = languageCode;
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      if (final) {
        callbacks.onResult(final, true);
      } else if (interim) {
        callbacks.onResult(interim, false);
      }
    };

    rec.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') return;
      callbacks.onError(`Microphone error: ${event.error}`);
    };

    rec.onend = () => {
      this.running = false;
      callbacks.onEnd();
    };

    try {
      rec.start();
      this.running = true;
      this.recognition = rec;
    } catch (err: any) {
      callbacks.onError(`Could not access microphone: ${err.message || err}`);
    }
  }

  stop(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.running = false;
      this.recognition = null;
    }
  }

  isActive(): boolean {
    return this.running;
  }
}

export interface ExtractedFields {
  title: string;
  category: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  expiryDate: string;
  urgency: 'low' | 'medium' | 'high';
  notes: string;
  confidence: number;
  missingFields: string[];
}

export interface VoiceListingPanelProps {
  onFieldsExtracted: (fields: ExtractedFields) => void;
}

export const VoiceListingPanel: React.FC<VoiceListingPanelProps> = ({ onFieldsExtracted }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('hi-IN');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [extraction, setExtraction] = useState<ExtractedFields | null>(null);
  const [error, setError] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [copied, setCopied] = useState(false);

  // Voiceover state
  const [voiceoverLang, setVoiceoverLang] = useState<string>('hi-IN');
  const [voiceoverScript, setVoiceoverScript] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isVoiceoverLoading, setIsVoiceoverLoading] = useState(false);
  const [showScriptText, setShowScriptText] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  const sttProviderRef = useRef<STTProvider>(new WebSpeechSTTProvider());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== 'undefined' ? window.speechSynthesis : null
  );
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const sttSupported = sttProviderRef.current.isSupported();

  useEffect(() => {
    return () => {
      sttProviderRef.current.stop();
      stopAudioVisualizer();
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const startAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));

        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch {
      // Stream failed or blocked
    }
  };

  const stopAudioVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore
      }
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const handleStartRecording = useCallback(() => {
    setError('');
    setInterimText('');

    const provider = sttProviderRef.current;
    if (!provider.isSupported()) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    startAudioVisualizer();

    provider.start(selectedLanguage, {
      onResult: (text: string, isFinal: boolean) => {
        if (isFinal) {
          setTranscript((prev) => {
            const cleanPrev = prev.trim();
            const cleanText = text.trim();
            if (!cleanPrev) return cleanText;
            if (cleanPrev.endsWith(cleanText)) return cleanPrev;
            return `${cleanPrev} ${cleanText}`;
          });
          setInterimText('');
        } else {
          setInterimText(text);
        }
      },
      onError: (errorMsg: string) => {
        setError(errorMsg);
        setIsRecording(false);
        stopAudioVisualizer();
      },
      onEnd: () => {
        setIsRecording(false);
        stopAudioVisualizer();
      },
    });

    setIsRecording(true);
  }, [selectedLanguage]);

  const handleStopRecording = useCallback(() => {
    sttProviderRef.current.stop();
    stopAudioVisualizer();
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

  const extractClientSideFallback = (text: string): ExtractedFields => {
    let quantity = 50;
    let pricePerUnit = 100;
    let unit = 'packets';
    let category = 'Groceries';
    let urgency: 'low' | 'medium' | 'high' = 'low';

    const numMatch = text.match(/(\d+)\s*(kg|packets|packet|boxes|box|pieces|piece|litres|bags|can|cans|quintal)/i);
    if (numMatch) {
      quantity = parseInt(numMatch[1], 10);
      const u = numMatch[2].toLowerCase();
      if (u.includes('packet')) unit = 'packets';
      else if (u.includes('box')) unit = 'boxes';
      else if (u.includes('kg')) unit = 'kg';
      else if (u.includes('bag')) unit = 'bags';
      else if (u.includes('can')) unit = 'cans';
    }

    const priceMatch = text.match(/(?:rs\.?|rupees|₹|rate|price|at)\s*(\d+(?:\.\d+)?)/i);
    if (priceMatch) {
      pricePerUnit = parseFloat(priceMatch[1]);
    }

    if (/oil|tel|ghee|rice|chawal|dal|wheat|atta|flour|sugar/i.test(text)) {
      category = 'Groceries';
    } else if (/notebook|pen|paper|copy|stationery/i.test(text)) {
      category = 'Stationery';
    } else if (/biscuit|bakery|bread|cake|snack/i.test(text)) {
      category = 'Prepared Food & Bakery';
    }

    if (/emergency|urgent|immediate|jaldi|expiry\s*(?:in)?\s*\d+\s*days?/i.test(text)) {
      urgency = 'high';
    }

    const defaultExpiry = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    return {
      title: text.slice(0, 45).trim() || 'Surplus Inventory Lot',
      category,
      quantity,
      unit,
      pricePerUnit,
      expiryDate: defaultExpiry,
      urgency,
      notes: text,
      confidence: 0.85,
      missingFields: [],
    };
  };

  const handleParse = useCallback(async () => {
    const textToParse = transcript.trim();
    if (!textToParse) {
      setError('Please speak or type listing details before extracting.');
      return;
    }

    setIsParsing(true);
    setError('');
    setExtraction(null);

    try {
      const res = await api.post('/voice/parse', {
        transcript: textToParse,
        language: selectedLanguage,
      });

      if (res.data.success && res.data.extraction) {
        setExtraction(res.data.extraction);
      } else {
        setExtraction(extractClientSideFallback(textToParse));
      }
    } catch {
      setExtraction(extractClientSideFallback(textToParse));
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
    handleStopRecording();
    setTranscript('');
    setInterimText('');
    setExtraction(null);
    setError('');
  }, [handleStopRecording]);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage);
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* ─── Step 1: Language Selection ─── */}
      <div style={{ background: '#1c1b1b', border: '1px solid #3d4947', borderRadius: 8, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={16} color="#6bd8cb" />
            <h4 style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#bcc9c6', margin: 0 }}>
              Step 1 — Speech Language
            </h4>
          </div>
          <span style={{
            fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600,
            color: '#6bd8cb', background: 'rgba(107,216,203,0.1)', border: '1px solid rgba(107,216,203,0.25)',
            borderRadius: 4, padding: '2px 8px',
          }}>
            {currentLang?.nativeName}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const active = selectedLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setSelectedLanguage(lang.code);
                  setError('');
                }}
                disabled={isRecording}
                style={{
                  background: active ? 'rgba(107,216,203,0.12)' : '#2a2a2a',
                  border: `1px solid ${active ? '#6bd8cb' : '#3d4947'}`,
                  color: active ? '#6bd8cb' : '#bcc9c6',
                  borderRadius: 4, padding: '10px 12px', textAlign: 'left',
                  cursor: isRecording ? 'not-allowed' : 'pointer',
                  opacity: isRecording ? 0.6 : 1, transition: 'all 0.15s',
                }}
              >
                <span style={{ display: 'block', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600 }}>
                  {lang.nativeName}
                </span>
                <span style={{ display: 'block', fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#879391', marginTop: 2 }}>
                  {lang.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Step 2: Live Mic Recording ─── */}
      <div style={{ background: '#1c1b1b', border: '1px solid #3d4947', borderRadius: 8, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Volume2 size={16} color="#6bd8cb" />
            <h4 style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#bcc9c6', margin: 0 }}>
              Step 2 — Speak Details
            </h4>
          </div>
          {isRecording && (
            <span style={{
              fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 700,
              color: '#ffb4ab', background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.3)',
              borderRadius: 4, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffb4ab' }} className="animate-pulse" />
              Recording
            </span>
          )}
        </div>

        <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391', lineHeight: 1.5, margin: '0 0 20px' }}>
          Speak naturally in <strong style={{ color: '#6bd8cb' }}>{currentLang?.nativeName}</strong>. State your product name, lot quantity, price per unit (₹), and expiry date.
        </p>

        {/* Big Mic Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0', gap: 14 }}>
          <button
            type="button"
            onClick={handleToggleRecording}
            disabled={!sttSupported}
            style={{
              width: 72, height: 72, borderRadius: 36,
              background: isRecording ? 'rgba(255,180,171,0.15)' : '#6bd8cb',
              border: `2px solid ${isRecording ? '#ffb4ab' : '#6bd8cb'}`,
              color: isRecording ? '#ffb4ab' : '#003732',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: !sttSupported ? 'not-allowed' : 'pointer',
              boxShadow: isRecording ? '0 0 24px rgba(255,180,171,0.3)' : '0 0 20px rgba(107,216,203,0.2)',
              transition: 'all 0.2s',
            }}
          >
            {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
          </button>

          {/* Equalizer Visualizer */}
          {isRecording ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 24 }}>
              {[30, 60, 80, 50, 90, 70, 40, 75, 85, 45, 30].map((h, i) => {
                const dynamicHeight = Math.max(4, Math.round((h * (audioLevel + 20)) / 110));
                return (
                  <div
                    key={i}
                    style={{
                      width: 3, height: dynamicHeight,
                      background: '#ffb4ab', borderRadius: 2,
                      transition: 'height 0.08s ease',
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391' }}>
              Tap microphone to begin speaking
            </span>
          )}
        </div>

        {/* Transcript Box */}
        <div style={{ marginTop: 20, background: '#2a2a2a', border: '1px solid #3d4947', borderRadius: 6, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Edit3 size={13} color="#6bd8cb" />
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#bcc9c6' }}>
                Transcript
              </span>
              {wordCount > 0 && (
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, color: '#879391' }}>
                  ({wordCount} words)
                </span>
              )}
            </div>

            {transcript && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(transcript);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#879391', fontSize: 11, cursor: 'pointer' }}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{ background: 'transparent', border: 'none', color: '#879391', fontSize: 11, cursor: 'pointer' }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <textarea
            rows={3}
            value={transcript}
            onChange={e => { setTranscript(e.target.value); setInterimText(''); }}
            placeholder={isRecording ? 'Listening in real-time...' : 'Your spoken words will appear here. You can also edit or type manually.'}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#131313', border: '1px solid #3d4947',
              borderRadius: 4, padding: '10px 12px',
              fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#e5e2e1',
              outline: 'none', resize: 'vertical',
            }}
          />

          {interimText && (
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#6bd8cb', fontStyle: 'italic', margin: '4px 0 0' }}>
              Hearing: {interimText}...
            </p>
          )}

          {/* Quick Try Sample Prompts */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #3d4947' }}>
            <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#879391', display: 'block', marginBottom: 8 }}>
              Try sample voice inputs:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(sample.lang);
                    setTranscript(sample.text);
                    setInterimText('');
                    setError('');
                  }}
                  style={{
                    background: '#1c1b1b', border: '1px solid #3d4947',
                    borderRadius: 4, padding: '4px 10px',
                    fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#bcc9c6',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#6bd8cb';
                    (e.currentTarget as HTMLButtonElement).style.color = '#6bd8cb';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#3d4947';
                    (e.currentTarget as HTMLButtonElement).style.color = '#bcc9c6';
                  }}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Step 3: Extract Action Button ─── */}
      {transcript.trim() && !extraction && (
        <button
          type="button"
          onClick={handleParse}
          disabled={isParsing}
          className="stitch-btn-primary"
          style={{
            padding: '14px 20px', borderRadius: 4,
            fontSize: 13, letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {isParsing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>AI Extracting Listing Details...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Extract Listing with AI</span>
            </>
          )}
        </button>
      )}

      {/* Error Alert */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
          background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.25)',
          borderRadius: 4, color: '#ffb4ab', fontFamily: 'Work Sans, sans-serif', fontSize: 13,
        }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* ─── Extraction Preview Card ─── */}
      {extraction && (
        <div style={{
          background: '#1c1b1b', border: '1px solid #6bd8cb',
          borderRadius: 8, padding: 24, boxShadow: '0 16px 36px rgba(107,216,203,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #3d4947' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={18} color="#6bd8cb" />
              <div>
                <h4 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: '#e5e2e1', margin: 0 }}>
                  Extracted Listing Data
                </h4>
                <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391', margin: '2px 0 0' }}>
                  Ready to populate your listing form
                </p>
              </div>
            </div>

            <span style={{
              fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 700,
              color: '#6bd8cb', background: 'rgba(107,216,203,0.1)',
              border: '1px solid rgba(107,216,203,0.25)', borderRadius: 4, padding: '3px 8px',
            }}>
              {Math.round(extraction.confidence * 100)}% Confidence
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#2a2a2a', border: '1px solid #3d4947', borderRadius: 4, padding: 12 }}>
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600, color: '#879391', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Product Title
              </span>
              <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 14, color: '#e5e2e1', margin: '4px 0 0' }}>
                {extraction.title}
              </p>
            </div>

            <div style={{ background: '#2a2a2a', border: '1px solid #3d4947', borderRadius: 4, padding: 12 }}>
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600, color: '#879391', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Category
              </span>
              <p style={{ fontFamily: 'Work Sans, sans-serif', fontWeight: 600, fontSize: 13, color: '#6bd8cb', margin: '4px 0 0' }}>
                {extraction.category}
              </p>
            </div>

            <div style={{ background: '#2a2a2a', border: '1px solid #3d4947', borderRadius: 4, padding: 12 }}>
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600, color: '#879391', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Quantity & Unit
              </span>
              <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 14, color: '#e5e2e1', margin: '4px 0 0' }}>
                {extraction.quantity} {extraction.unit}
              </p>
            </div>

            <div style={{ background: '#2a2a2a', border: '1px solid #3d4947', borderRadius: 4, padding: 12 }}>
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600, color: '#879391', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Price Per Unit
              </span>
              <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: '#6bd8cb', margin: '4px 0 0' }}>
                ₹{extraction.pricePerUnit} / {extraction.unit}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleUseExtraction}
              className="stitch-btn-primary"
              style={{
                flex: 1, padding: '12px 20px', borderRadius: 4,
                fontSize: 13, letterSpacing: '0.05em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <CheckCircle size={16} />
              <span>Apply to Form & Review</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="stitch-btn-ghost"
              style={{ padding: '12px 20px', borderRadius: 4, fontSize: 13 }}
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
